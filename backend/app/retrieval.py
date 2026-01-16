"""
Retrieval Module
Handles RAG chain with improved memory, relevance scoring, and citations.
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
from app.citations import CitationManager
from app.config import settings

load_dotenv()


class ConversationMemory:
    """Manages conversation history."""
    
    def __init__(self, max_messages: int = 10):
        self.messages: List = []
        self.max_messages = max_messages
    
    def add_user_message(self, content: str):
        self.messages.append(HumanMessage(content=content))
        self._trim_if_needed()
    
    def add_ai_message(self, content: str):
        self.messages.append(AIMessage(content=content))
        self._trim_if_needed()
    
    def _trim_if_needed(self):
        if len(self.messages) > self.max_messages * 2:
            self.messages = self.messages[-(self.max_messages * 2):]
    
    def get_messages(self) -> List:
        return self.messages
    
    def clear(self):
        self.messages = []
    
    def get_context_string(self) -> str:
        if not self.messages:
            return "No previous conversation."
        
        context_parts = []
        for msg in self.messages[-6:]:
            role = "User" if isinstance(msg, HumanMessage) else "Assistant"
            # Truncate long messages in context
            content = msg.content[:300] + "..." if len(msg.content) > 300 else msg.content
            context_parts.append(f"{role}: {content}")
        
        return "\n".join(context_parts)


class RAGChain:
    """RAG chain with citations and improved prompts."""
    
    def __init__(self):
        self.llm = ChatOpenAI(
            model=settings.LLM_MODEL,
            temperature=settings.LLM_TEMPERATURE,
            api_key=os.getenv("OPENAI_API_KEY")
        )
        self.embeddings_manager = None
        self.memory = ConversationMemory(max_messages=10)
        self.citation_manager = CitationManager()
        self.min_relevance = 0.15
    
    def _get_embeddings_manager(self) -> EmbeddingsManager:
        if self.embeddings_manager is None:
            self.embeddings_manager = EmbeddingsManager()
        return self.embeddings_manager
    
    def retrieve_documents(
        self,
        query: str,
        k: int = 4
    ) -> List[Tuple[Document, float]]:
        """Retrieve relevant documents with scores."""
        manager = self._get_embeddings_manager()
        results = manager.similarity_search_with_score(query, k=k)
        
        # Filter by minimum relevance
        filtered = [(doc, score) for doc, score in results if score >= self.min_relevance]
        return filtered
    
    def _get_system_prompt(self, has_context: bool) -> str:
        """Generate system prompt based on context availability."""
        
        if has_context:
            context = self.citation_manager.build_context_with_citations()
            citation_instruction = self.citation_manager.build_citation_instruction()
            conversation_context = self.memory.get_context_string()
            
            return f"""You are a helpful AI Knowledge Assistant with access to the user's documents.

INSTRUCTIONS:
1. Answer the user's question using the document sources provided below.
2. Always cite your sources! Use [Source X] format when referencing information.
3. If multiple sources support a point, cite all relevant ones.
4. If the sources don't fully answer the question, say what you found and what's missing.
5. Be conversational and helpful, not robotic.
6. For follow-up questions, use conversation history for context.

{citation_instruction}

DOCUMENT SOURCES:
{context}

RECENT CONVERSATION:
{conversation_context}
"""
        else:
            return """You are a helpful AI Knowledge Assistant.

The user's documents don't contain information relevant to this question.

You should:
1. Let them know you searched but didn't find relevant information in their documents
2. Offer to answer based on your general knowledge if appropriate
3. Suggest what types of documents might help answer their question

Be helpful and conversational."""
    
    def query(
        self,
        question: str,
        use_rag: bool = True,
        k: int = 4
    ) -> dict:
        """Process a query through the RAG chain."""
        
        # Reset citation manager for new query
        self.citation_manager.clear()
        
        has_relevant_context = False
        
        # Step 1: Retrieve documents if RAG enabled
        if use_rag:
            try:
                results = self.retrieve_documents(question, k=k)
                if results:
                    self.citation_manager.create_citations_from_results(results)
                    has_relevant_context = len(self.citation_manager.citations) > 0
            except Exception as e:
                print(f"Retrieval error: {e}")
        
        # Step 2: Build prompt with appropriate context
        system_prompt = self._get_system_prompt(has_relevant_context)
        
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
        
        # Step 5: Build result
        citation_summary = self.citation_manager.get_citations_summary()
        
        return {
            "answer": response,
            "sources": self.citation_manager.format_sources_for_response(),
            "used_rag": has_relevant_context,
            "documents_searched": citation_summary["total_sources"],
            "unique_documents": citation_summary.get("unique_documents", 0),
            "average_relevance": citation_summary.get("average_relevance", 0)
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


# Singleton instance
_rag_chain_instance = None

def get_rag_chain() -> RAGChain:
    """Get or create the RAG chain singleton."""
    global _rag_chain_instance
    if _rag_chain_instance is None:
        _rag_chain_instance = RAGChain()
    return _rag_chain_instance