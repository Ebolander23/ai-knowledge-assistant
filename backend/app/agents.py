"""
Agents Module
Handles tool-using agents for web search and calculations.
"""

import os
import re
from typing import List, Optional, Dict, Any
from dotenv import load_dotenv

from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

from tavily import TavilyClient

from app.embeddings import EmbeddingsManager
from app.citations import CitationManager
from app.config import settings

load_dotenv()


class WebSearchTool:
    """Web search tool using Tavily API."""
    
    def __init__(self):
        api_key = os.getenv("TAVILY_API_KEY")
        if not api_key:
            raise ValueError("TAVILY_API_KEY not found in environment variables")
        self.client = TavilyClient(api_key=api_key)
    
    def search(self, query: str, max_results: int = 3) -> Dict[str, Any]:
        """
        Search the web for information.
        Returns structured results with sources.
        """
        try:
            response = self.client.search(
                query=query,
                max_results=max_results,
                search_depth="basic"
            )
            
            results = []
            for item in response.get("results", []):
                results.append({
                    "title": item.get("title", ""),
                    "url": item.get("url", ""),
                    "content": item.get("content", ""),
                    "score": item.get("score", 0)
                })
            
            return {
                "success": True,
                "query": query,
                "results": results,
                "answer": response.get("answer", None)
            }
            
        except Exception as e:
            return {
                "success": False,
                "query": query,
                "error": str(e),
                "results": []
            }


class CalculatorTool:
    """Simple calculator tool for mathematical operations."""
    
    def calculate(self, expression: str) -> Dict[str, Any]:
        """
        Safely evaluate a mathematical expression.
        """
        try:
            # Clean the expression
            cleaned = expression.strip()
            
            # Only allow safe characters
            allowed_chars = set("0123456789+-*/.() %")
            if not all(c in allowed_chars for c in cleaned.replace(" ", "")):
                return {
                    "success": False,
                    "expression": expression,
                    "error": "Invalid characters in expression"
                }
            
            # Evaluate safely
            result = eval(cleaned, {"__builtins__": {}}, {})
            
            return {
                "success": True,
                "expression": expression,
                "result": result
            }
            
        except Exception as e:
            return {
                "success": False,
                "expression": expression,
                "error": str(e)
            }


class ToolRouter:
    """
    Routes queries to appropriate tools based on intent.
    Uses LLM to decide which tool to use.
    """
    
    def __init__(self):
        self.llm = ChatOpenAI(
            model="gpt-4o",
            temperature=0,
            api_key=os.getenv("OPENAI_API_KEY")
        )
        self.web_search = WebSearchTool()
        self.calculator = CalculatorTool()
    
    def classify_intent(self, query: str, has_relevant_docs: bool) -> str:
        """
        Classify what tool (if any) should handle this query.
        Returns: 'documents', 'web_search', 'calculator', or 'general'
        """
        prompt = ChatPromptTemplate.from_messages([
            SystemMessage(content="""You are a query classifier. Analyze the user's query and determine the best way to answer it.

Respond with ONLY ONE of these exact words:
- "documents" - if the query is about personal information, resumes, uploaded documents, or specific people's details
- "web_search" - if the query needs current information, news, facts not in personal documents, or real-time data
- "calculator" - if the query involves mathematical calculations
- "general" - if it's a general knowledge question that doesn't need tools

Consider:
- Questions about "Eric" or personal info = documents
- Questions about current events, news, prices, weather = web_search
- Questions with math expressions or "calculate" = calculator
- Philosophical questions, opinions, general knowledge = general
"""),
            HumanMessage(content=f"Query: {query}\nHas relevant documents: {has_relevant_docs}\n\nClassification:")
        ])
        
        chain = prompt | self.llm | StrOutputParser()
        result = chain.invoke({}).strip().lower()
        
        # Validate response
        valid_intents = ["documents", "web_search", "calculator", "general"]
        if result not in valid_intents:
            # Default based on document availability
            return "documents" if has_relevant_docs else "general"
        
        return result


class AgentExecutor:
    """
    Main agent that orchestrates tool use and response generation.
    """
    
    def __init__(self):
        self.llm = ChatOpenAI(
            model=settings.LLM_MODEL,
            temperature=settings.LLM_TEMPERATURE,
            api_key=os.getenv("OPENAI_API_KEY")
        )
        self.embeddings_manager = None
        self.citation_manager = CitationManager()
        self.tool_router = ToolRouter()
        self.web_search = WebSearchTool()
        self.calculator = CalculatorTool()
        self.conversation_history: List = []
        self.min_relevance = 0.15
    
    def _get_embeddings_manager(self) -> EmbeddingsManager:
        if self.embeddings_manager is None:
            self.embeddings_manager = EmbeddingsManager()
        return self.embeddings_manager
    
    def _check_document_relevance(self, query: str) -> tuple:
        """Check if documents have relevant information."""
        try:
            manager = self._get_embeddings_manager()
            results = manager.similarity_search_with_score(query, k=4)
            filtered = [(doc, score) for doc, score in results if score >= self.min_relevance]
            
            if filtered:
                self.citation_manager.create_citations_from_results(filtered)
                return True, filtered
            return False, []
        except Exception as e:
            print(f"Document search error: {e}")
            return False, []
    
    def _format_web_results(self, results: Dict) -> str:
        """Format web search results for LLM context."""
        if not results.get("success") or not results.get("results"):
            return "No web results found."
        
        formatted = []
        for i, item in enumerate(results["results"], 1):
            formatted.append(
                f"[Web Source {i}]: {item['title']}\n"
                f"URL: {item['url']}\n"
                f"Content: {item['content'][:300]}..."
            )
        
        return "\n\n".join(formatted)
    
    def _generate_response(
        self,
        query: str,
        context: str,
        tool_used: str,
        web_sources: Optional[List] = None
    ) -> str:
        """Generate final response using LLM."""
        
        # Build conversation context
        conv_context = ""
        if self.conversation_history:
            recent = self.conversation_history[-6:]
            conv_parts = []
            for msg in recent:
                role = "User" if isinstance(msg, HumanMessage) else "Assistant"
                content = msg.content[:200] + "..." if len(msg.content) > 200 else msg.content
                conv_parts.append(f"{role}: {content}")
            conv_context = "\n".join(conv_parts)
        
        if tool_used == "documents":
            system_content = f"""You are a helpful AI assistant with access to the user's documents.

Use the document context below to answer the question. Cite sources using [Source X] format.

DOCUMENT CONTEXT:
{context}

CONVERSATION HISTORY:
{conv_context}
"""
        elif tool_used == "web_search":
            system_content = f"""You are a helpful AI assistant with web search capabilities.

Use the web search results below to answer the question. Cite sources using [Web Source X] format.
Include relevant URLs when helpful.

WEB SEARCH RESULTS:
{context}

CONVERSATION HISTORY:
{conv_context}
"""
        elif tool_used == "calculator":
            system_content = f"""You are a helpful AI assistant with calculator capabilities.

The calculation result is: {context}

Explain the result clearly to the user.

CONVERSATION HISTORY:
{conv_context}
"""
        else:
            system_content = f"""You are a helpful AI assistant.

Answer the user's question based on your general knowledge.
Be helpful and conversational.

CONVERSATION HISTORY:
{conv_context}
"""
        
        prompt = ChatPromptTemplate.from_messages([
            SystemMessage(content=system_content),
            HumanMessage(content=query)
        ])
        
        chain = prompt | self.llm | StrOutputParser()
        return chain.invoke({})
    
    def run(self, query: str) -> Dict[str, Any]:
        """
        Run the agent on a query.
        Returns response with metadata about tool usage.
        """
        # Step 1: Check document relevance
        has_docs, doc_results = self._check_document_relevance(query)
        
        # Step 2: Route to appropriate tool
        intent = self.tool_router.classify_intent(query, has_docs)
        
        # Step 3: Execute based on intent
        tool_used = intent
        context = ""
        web_sources = None
        sources = None
        
        if intent == "documents" and has_docs:
            # Use document context
            context = self.citation_manager.build_context_with_citations()
            sources = self.citation_manager.format_sources_for_response()
            
        elif intent == "web_search" or (intent == "documents" and not has_docs):
            # Fall back to web search
            tool_used = "web_search"
            web_results = self.web_search.search(query)
            context = self._format_web_results(web_results)
            if web_results.get("success"):
                web_sources = [
                    {
                        "id": i + 1,
                        "title": r["title"],
                        "url": r["url"],
                        "snippet": r["content"][:150] + "..."
                    }
                    for i, r in enumerate(web_results.get("results", []))
                ]
                
        elif intent == "calculator":
            # Extract math expression and calculate
            calc_result = self.calculator.calculate(query)
            if calc_result["success"]:
                context = f"{calc_result['expression']} = {calc_result['result']}"
            else:
                context = f"Could not calculate: {calc_result.get('error', 'Unknown error')}"
                
        else:
            # General knowledge - no tool needed
            tool_used = "general"
        
        # Step 4: Generate response
        response = self._generate_response(query, context, tool_used, web_sources)
        
        # Step 5: Update conversation history
        self.conversation_history.append(HumanMessage(content=query))
        self.conversation_history.append(AIMessage(content=response))
        
        # Keep history manageable
        if len(self.conversation_history) > 20:
            self.conversation_history = self.conversation_history[-20:]
        
        # Step 6: Build result
        result = {
            "answer": response,
            "tool_used": tool_used,
            "sources": sources,
            "web_sources": web_sources,
            "used_rag": tool_used == "documents",
            "documents_searched": len(sources) if sources else 0
        }
        
        return result
    
    def clear_history(self):
        """Clear conversation history."""
        self.conversation_history = []
    
    def get_status(self) -> Dict:
        """Get agent status."""
        return {
            "conversation_length": len(self.conversation_history),
            "tools_available": ["documents", "web_search", "calculator", "general"]
        }


# Singleton instance
_agent_instance = None

def get_agent() -> AgentExecutor:
    """Get or create the agent singleton."""
    global _agent_instance
    if _agent_instance is None:
        _agent_instance = AgentExecutor()
    return _agent_instance