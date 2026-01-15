"""
Embeddings Module
Handles vector embeddings and Pinecone operations.
"""

import os
from typing import List
from dotenv import load_dotenv
from langchain_core.documents import Document
from langchain_openai import OpenAIEmbeddings
from pinecone import Pinecone, ServerlessSpec
from langchain_pinecone import PineconeVectorStore
from app.config import settings

load_dotenv()


class EmbeddingsManager:
    """Handles embedding generation and vector store operations."""
    
    def __init__(self):
        # Initialize OpenAI embeddings
        self.embeddings = OpenAIEmbeddings(
            model=settings.EMBEDDING_MODEL,
            api_key=os.getenv("OPENAI_API_KEY")
        )
        
        # Initialize Pinecone
        self.pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
        self.index_name = settings.PINECONE_INDEX_NAME
        
        # Get or verify the index exists
        self._ensure_index_exists()
        
        # Initialize the vector store
        self.vector_store = PineconeVectorStore(
            index=self.pc.Index(self.index_name),
            embedding=self.embeddings,
            text_key="text"
        )
    
    def _ensure_index_exists(self):
        """Check if index exists, provide helpful message if not."""
        existing_indexes = [idx.name for idx in self.pc.list_indexes()]
        
        if self.index_name not in existing_indexes:
            print(f" Index '{self.index_name}' not found!")
            print(f"   Available indexes: {existing_indexes}")
            print(f"   Please create the index in Pinecone dashboard first.")
            raise ValueError(f"Index '{self.index_name}' does not exist")
        
        print(f" Index Connected to Pinecone index: {self.index_name}")
    
    def add_documents(self, documents: List[Document]) -> List[str]:
        """
        Add documents to the vector store.
        Returns list of document IDs.
        """
        print(f" Adding {len(documents)} documents to Pinecone...")
        
        # Add documents to vector store
        ids = self.vector_store.add_documents(documents)
        
        print(f" Successfully added {len(ids)} documents")
        return ids
    
    def similarity_search(
        self,
        query: str,
        k: int = 4
    ) -> List[Document]:
        """
        Search for similar documents.
        Returns top k most relevant documents.
        """
        results = self.vector_store.similarity_search(query, k=k)
        return results
    
    def similarity_search_with_score(
        self,
        query: str,
        k: int = 4
    ) -> List[tuple]:
        """
        Search with relevance scores.
        Returns list of (document, score) tuples.
        """
        results = self.vector_store.similarity_search_with_score(query, k=k)
        return results
    
    def delete_all(self):
        """Delete all vectors from the index."""
        index = self.pc.Index(self.index_name)
        index.delete(delete_all=True)
        print(f" Deleted all vectors from '{self.index_name}'")
    
    def get_index_stats(self):
        """Get statistics about the index."""
        index = self.pc.Index(self.index_name)
        stats = index.describe_index_stats()
        return stats


def print_search_results(results: List[Document], query: str):
    """Helper to display search results nicely."""
    print(f"\n Search Query: \"{query}\"")
    print(f"   Found {len(results)} results:\n")
    
    for i, doc in enumerate(results, 1):
        print(f"--- Result {i} ---")
        print(f"Source: {doc.metadata.get('source', 'Unknown')}")
        if 'page' in doc.metadata:
            print(f"Page: {doc.metadata['page'] + 1}")
        print(f"Content preview: {doc.page_content[:200]}...")
        print()