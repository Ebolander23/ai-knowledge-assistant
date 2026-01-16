"""
Citations Module
Handles formatting and structuring of source citations.
"""

from typing import List, Dict, Optional
from dataclasses import dataclass
from langchain_core.documents import Document


@dataclass
class Citation:
    """Structured citation object."""
    citation_id: int
    source: str
    page: int
    chunk_index: int
    relevance_score: float
    snippet: str
    full_content: str
    
    def to_dict(self) -> dict:
        """Convert to dictionary for JSON response."""
        return {
            "id": self.citation_id,
            "source": self.source,
            "page": self.page,
            "chunk_index": self.chunk_index,
            "relevance_score": self.relevance_score,
            "relevance_label": self._get_relevance_label(),
            "snippet": self.snippet
        }
    
    def _get_relevance_label(self) -> str:
        """Convert score to human-readable label."""
        if self.relevance_score >= 0.7:
            return "High"
        elif self.relevance_score >= 0.4:
            return "Medium"
        elif self.relevance_score >= 0.2:
            return "Low"
        else:
            return "Minimal"
    
    def to_inline_citation(self) -> str:
        """Format as inline citation for LLM context."""
        return f"[{self.citation_id}]"
    
    def to_reference(self) -> str:
        """Format as full reference."""
        return f"[{self.citation_id}] {self.source}, Page {self.page} (Relevance: {self._get_relevance_label()})"


class CitationManager:
    """Manages citation creation and formatting."""
    
    def __init__(self):
        self.citations: List[Citation] = []
    
    def clear(self):
        """Clear all citations."""
        self.citations = []
    
    def create_citations_from_results(
        self,
        results: List[tuple],  # List of (Document, score) tuples
        snippet_length: int = 150
    ) -> List[Citation]:
        """
        Create Citation objects from search results.
        Removes duplicates based on content similarity.
        """
        self.citations = []
        seen_content = set()
        
        for i, (doc, score) in enumerate(results):
            # Create content hash to detect duplicates
            content_hash = hash(doc.page_content[:200])
            if content_hash in seen_content:
                continue
            seen_content.add(content_hash)
            
            # Extract metadata
            source = doc.metadata.get("source", "Unknown")
            page = doc.metadata.get("page", 0)
            if isinstance(page, float):
                page = int(page)
            page += 1  # Convert to 1-indexed
            
            chunk_index = doc.metadata.get("chunk_index", 0)
            
            # Create snippet
            snippet = self._create_snippet(doc.page_content, snippet_length)
            
            citation = Citation(
                citation_id=len(self.citations) + 1,
                source=source,
                page=page,
                chunk_index=chunk_index,
                relevance_score=round(score, 3),
                snippet=snippet,
                full_content=doc.page_content
            )
            self.citations.append(citation)
        
        return self.citations
    
    def _create_snippet(self, content: str, max_length: int) -> str:
        """Create a clean snippet from content."""
        # Clean up whitespace
        cleaned = " ".join(content.split())
        
        if len(cleaned) <= max_length:
            return cleaned
        
        # Try to cut at a sentence boundary
        truncated = cleaned[:max_length]
        last_period = truncated.rfind(".")
        last_space = truncated.rfind(" ")
        
        if last_period > max_length * 0.5:
            return truncated[:last_period + 1]
        elif last_space > 0:
            return truncated[:last_space] + "..."
        else:
            return truncated + "..."
    
    def build_context_with_citations(self) -> str:
        """
        Build context string with citation markers for LLM.
        """
        if not self.citations:
            return ""
        
        context_parts = []
        for citation in self.citations:
            context_parts.append(
                f"[Source {citation.citation_id}: {citation.source}, Page {citation.page}]\n"
                f"{citation.full_content}"
            )
        
        return "\n\n---\n\n".join(context_parts)
    
    def build_citation_instruction(self) -> str:
        """
        Build instruction for LLM on how to cite sources.
        """
        if not self.citations:
            return ""
        
        refs = []
        for c in self.citations:
            refs.append(f"  [{c.citation_id}] {c.source}, Page {c.page}")
        
        return (
            "When using information from the sources above, cite them using the format "
            "[Source X] where X is the source number. Available sources:\n"
            + "\n".join(refs)
        )
    
    def get_citations_summary(self) -> Dict:
        """Get summary of all citations."""
        if not self.citations:
            return {
                "total_sources": 0,
                "sources": [],
                "average_relevance": 0
            }
        
        sources = list(set(c.source for c in self.citations))
        avg_relevance = sum(c.relevance_score for c in self.citations) / len(self.citations)
        
        return {
            "total_sources": len(self.citations),
            "unique_documents": len(sources),
            "documents": sources,
            "average_relevance": round(avg_relevance, 3),
            "citations": [c.to_dict() for c in self.citations]
        }
    
    def format_sources_for_response(self) -> Optional[List[dict]]:
        """Format citations for API response."""
        if not self.citations:
            return None
        return [c.to_dict() for c in self.citations]