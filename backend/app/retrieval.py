"""
Retrieval Module
Handles RAG chain with improved memory and relevance scoring.
"""

import os
from typing import List, Optional, Tuple
from dotenv import load_dotenv

from langchain_openai import ChatOpenAI
from langchain_core.documents import Document
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import StrOutputParser

from app.embeddings import EmbeddingsManager
from app.config import settings

load_dotenv()


class ConversationMemory:
    """Manages conversation history with summarization for long conversations."""
    
    def __init__(self, max_messages: int = 10):
        self.messages: List = []
        self.max_messages = max_messages
    
    def add_user_message(self, content: str):
        """Add a user message to history."""
        self.messages.append(HumanMessage(content=content))
        self._trim_if_needed()
    
    def add_ai_message(self, content: str):
        """Add an AI message to history."""
        self.messages.append(AIMessage(content=content))
        self._trim_if_needed()
    
    def _trim_if_needed(self):
        """Keep only recent messages to manage context window."""
        if len(self.messages) > self.max_messages * 2:
            # Keep the most recent messages
            self.messages = self.messages[-(self.max_messages * 2):]
    
    def get_messages(self) -> List:
        """Get all messages in history."""
        return self.messages
    
    def clear(self):
        """Clear all messages."""
        self.messages = []
    
    def get_context_string(self) -> str:
        """Get conversation as a formatted string for context."""
        if not self.messages:
            return ""
        
        context_parts = []
        for msg in self.messages[-6:]:  # Last 3 exchanges
            role = "User" if isinstance(msg, HumanMessage) else "Assistant"
            context_parts.append(f"{role}: {msg.content}")
        
        return "\n".join(context_parts)


class RAGChain:
    """
    Retrieval-Augmented Generation chain with improved features.
    """
    
    def __init__(self):
        self.llm = ChatOpenAI(
            model=settings.LLM_MODEL,
            temperature=settings.LLM_TEMPERATURE,
            api_key=os.getenv("OPENAI_API_KEY")
        )
        self.embeddings_manager = None
        self.memory = ConversationMemory(max_messages=10)
        
        # Relevance threshold (0-1, higher = more strict)
        self.relevance_threshold = 0.3
    
    def _get_embeddings_manager(self) -> EmbeddingsManager:
        """Lazy initialization of embeddings manager."""
        if self.embeddings_manager is None:
            self.embeddings_manager = EmbeddingsManager()
        return self.embeddings_manager
    
    def retrieve_with_scores(
        self,
        query: str,
        k: int = 4
    ) -> List[Tuple[Document, float]]:
        """
        Retrieve documents with relevance scores.
        Filters out low-relevance results.
        """
        manager = self._get_embeddings_manager()
        results = manager.similarity_search_with_score(query, k=k)
        
        # Filter by relevance threshold
        # Note: Pinecone returns distance, lower = more similar
        # We convert to similarity score (1 - distance) for cosine
        filtered_results = []
        for doc, score in results:
            # For cosine similarity in Pinecone, score is already similarity (higher = better)
            if score >= 0.15:
                filtered_results.append((doc, score))
        
        return filtered_results
    
    def _build_context(
        self,
        retrieved_docs: List[Tuple[Document, float]]
    ) -> Tuple[str, List[dict]]:
        """
        Build context string and sources from retrieved documents.
        """
        if not retrieved_docs:
            return "", []
        
        context_parts = []
        sources = []
        
        for i, (doc, score) in enumerate(retrieved_docs):
            source_info = {
                "source": doc.metadata.get("source", "Unknown"),
                "page": doc.metadata.get("page", 0) + 1,
                "chunk_index": doc.metadata.get("chunk_index", 0),
                "relevance_score": round(score, 3),
                "snippet": doc.page_content[:200] + "..."
            }
            sources.append(source_info)
            
            context_parts.append(
                f"[Document {i+1}: {source_info['source']}, "
                f"Page {source_info['page']}, "
                f"Relevance: {source_info['relevance_score']:.0%}]\n"
                f"{doc.page_content}"
            )
        
        context = "\n\n---\n\n".join(context_parts)
        return context, sources
    
    def _get_system_prompt(self, context: str, has_context: bool) -> str:
        """Generate appropriate system prompt based on context availability."""
        
        if has_context:
            return f"""You are a helpful AI Knowledge Assistant with access to the user's documents.

INSTRUCTIONS:
1. Use the document context below to answer the user's question accurately.
2. Always cite your sources by mentioning the document name and page number.
3. If the context partially answers the question, provide what you can and note what's missing.
4. If the context doesn't contain relevant information, clearly state that the documents don't contain this information, then offer to help based on your general knowledge.
5. Be conversational and helpful, not robotic.
6. Consider the conversation history for context on follow-up questions.

DOCUMENT CONTEXT:
{context}

CONVERSATION HISTORY:
{self.memory.get_context_string()}
"""
        else:
            return """You are a helpful AI Knowledge Assistant.

The user's document library doesn't contain information relevant to this question.
You can:
1. Let them know the documents don't cover this topic
2. Offer to answer based on your general knowledge
3. Suggest what types of documents might help

Be helpful and conversational."""
    
    def query(
        self,
        question: str,
        use_rag: bool = True,
        k: int = 4
    ) -> dict:
        """
        Process a query through the RAG chain.
        
        Returns:
            dict with 'answer', 'sources', and 'used_rag' keys
        """
        context = ""
        sources = []
        used_rag = False
        
        # Step 1: Retrieve relevant documents
        if use_rag:
            try:
                retrieved = self.retrieve_with_scores(question, k=k)
                if retrieved:
                    context, sources = self._build_context(retrieved)
                    used_rag = True
            except Exception as e:
                print(f"Retrieval error: {e}")
                # Continue without RAG
        
        # Step 2: Build prompt
        system_prompt = self._get_system_prompt(context, bool(context))
        
        prompt = ChatPromptTemplate.from_messages([
            SystemMessage(content=system_prompt),
            MessagesPlaceholder(variable_name="history"),
            HumanMessage(content="{input}")
        ])
        
        # Step 3: Generate response
        chain = prompt | self.llm | StrOutputParser()
        
        response = chain.invoke({
            "history": self.memory.get_messages(),
            "input": question
        })
        
        # Step 4: Update memory
        self.memory.add_user_message(question)
        self.memory.add_ai_message(response)
        
        return {
            "answer": response,
            "sources": sources if sources else None,
            "used_rag": used_rag,
            "documents_searched": len(sources)
        }
    
    def clear_memory(self):
        """Clear conversation memory."""
        self.memory.clear()
    
    def get_memory_summary(self) -> dict:
        """Get summary of current memory state."""
        return {
            "message_count": len(self.memory.messages),
            "max_messages": self.memory.max_messages * 2
        }


# Singleton instance for the app
_rag_chain_instance = None

def get_rag_chain() -> RAGChain:
    """Get or create the RAG chain singleton."""
    global _rag_chain_instance
    if _rag_chain_instance is None:
        _rag_chain_instance = RAGChain()
    return _rag_chain_instance