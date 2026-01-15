"""
Test script for embeddings and Pinecone.
Run: python test_embeddings.py
"""

import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.document import DocumentProcessor
from app.embeddings import EmbeddingsManager, print_search_results


def test_embeddings_pipeline():
    """Test the full embeddings pipeline."""
    print("=" * 60)
    print(" Embeddings & Pinecone Test")
    print("=" * 60)
    
    # Step 1: Process a document
    print("\n Step 1: Processing document...")
    processor = DocumentProcessor(chunk_size=500, chunk_overlap=50)
    
    # Use the sample document or bitcoin.pdf if available
    if os.path.exists("uploads/bitcoin.pdf"):
        doc_path = "uploads/bitcoin.pdf"
    elif os.path.exists("uploads/sample_ai_overview.txt"):
        doc_path = "uploads/sample_ai_overview.txt"
    else:
        # Create sample document
        from test_documents import create_sample_document
        doc_path = create_sample_document()
    
    chunks = processor.process_document(doc_path)
    
    # Limit chunks for testing (to save on API costs)
    test_chunks = chunks[:10]
    print(f"   Using {len(test_chunks)} chunks for testing")
    
    # Step 2: Initialize embeddings manager
    print("\n Step 2: Connecting to Pinecone...")
    manager = EmbeddingsManager()
    
    # Step 3: Check index stats before
    print("\n Step 3: Index stats before adding documents:")
    stats = manager.get_index_stats()
    print(f"   Total vectors: {stats.total_vector_count}")
    
    # Step 4: Add documents
    print("\n Step 4: Adding documents to Pinecone...")
    ids = manager.add_documents(test_chunks)
    
    # Wait for indexing
    print("   Waiting for indexing...")
    time.sleep(3)
    
    # Step 5: Check index stats after
    print("\n Step 5: Index stats after adding documents:")
    stats = manager.get_index_stats()
    print(f"   Total vectors: {stats.total_vector_count}")
    
    # Step 6: Test similarity search
    print("\n Step 6: Testing similarity search...")
    
    # Test queries
    test_queries = [
        "What is Bitcoin?",
        "How does the proof of work system function?",
        "What problem does this solve?"
    ]
    
    for query in test_queries:
        results = manager.similarity_search(query, k=2)
        print_search_results(results, query)
    
    print("=" * 60)
    print("Embeddings test complete!")
    print("=" * 60)
    print("\nNext steps:")
    print("  1. Try different search queries")
    print("  2. Add more documents")


def test_search_only():
    """Just test searching (if documents already added)."""
    print(" Search-only test")
    print("-" * 40)
    
    manager = EmbeddingsManager()
    
    query = input("Enter your search query: ")
    results = manager.similarity_search(query, k=3)
    print_search_results(results, query)


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "search":
        test_search_only()
    else:
        test_embeddings_pipeline()