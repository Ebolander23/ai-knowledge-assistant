"""
Test script for document processing.
Run: python test_documents.py
"""

import os
import sys

# Add the app directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.document import DocumentProcessor, print_chunks_preview


def create_sample_document():
    """Create a sample text file for testing."""
    sample_text = """
    Artificial Intelligence and Machine Learning Overview
    
    Artificial intelligence (AI) is intelligence demonstrated by machines, as opposed to 
    natural intelligence displayed by animals including humans. AI research has been defined 
    as the field of study of intelligent agents, which refers to any system that perceives 
    its environment and takes actions that maximize its chance of achieving its goals.
    
    Machine Learning Fundamentals
    
    Machine learning (ML) is a subset of artificial intelligence that provides systems the 
    ability to automatically learn and improve from experience without being explicitly 
    programmed. Machine learning focuses on the development of computer programs that can 
    access data and use it to learn for themselves.
    
    The process of learning begins with observations or data, such as examples, direct 
    experience, or instruction, in order to look for patterns in data and make better 
    decisions in the future based on the examples that we provide.
    
    Deep Learning and Neural Networks
    
    Deep learning is part of a broader family of machine learning methods based on artificial 
    neural networks with representation learning. Learning can be supervised, semi-supervised 
    or unsupervised. Deep learning architectures such as deep neural networks, recurrent 
    neural networks, and convolutional neural networks have been applied to fields including 
    computer vision and natural language processing.
    
    Retrieval-Augmented Generation (RAG)
    
    Retrieval-Augmented Generation (RAG) is an AI framework that combines the power of 
    large language models with external knowledge retrieval. Instead of relying solely on 
    the knowledge encoded in the model's parameters, RAG systems retrieve relevant documents 
    from a knowledge base and use them to generate more accurate and up-to-date responses.
    
    RAG systems typically consist of three main components:
    1. A document store or vector database that holds the knowledge base
    2. A retriever that finds relevant documents based on the user's query
    3. A generator (usually an LLM) that produces responses using the retrieved context
    
    This approach helps reduce hallucinations and allows the AI to access information 
    that wasn't part of its original training data.
    """
    
    # Create uploads directory if it doesn't exist
    os.makedirs("uploads", exist_ok=True)
    
    # Write sample file
    sample_path = "uploads/sample_ai_overview.txt"
    with open(sample_path, "w", encoding="utf-8") as f:
        f.write(sample_text)
    
    print(f" Created sample document: {sample_path}")
    return sample_path


def test_document_processing():
    """Test the document processing pipeline."""
    print("=" * 60)
    print(" Document Processing Test")
    print("=" * 60)
    
    # Create sample document
    sample_path = create_sample_document()
    
    # Initialize processor
    processor = DocumentProcessor(chunk_size=500, chunk_overlap=50)
    
    # Process the document
    print(f"\n Processing: {sample_path}")
    chunks = processor.process_document(sample_path)
    
    # Preview the chunks
    print_chunks_preview(chunks, num_preview=3)
    
    # Test with different chunk sizes
    print("\n" + "=" * 60)
    print(" Testing different chunk sizes:")
    print("=" * 60)
    
    for chunk_size in [200, 500, 1000]:
        processor = DocumentProcessor(chunk_size=chunk_size, chunk_overlap=50)
        chunks = processor.process_document(sample_path)
        avg_chunk_len = sum(len(c.page_content) for c in chunks) // len(chunks)
        print(f"   Chunk size {chunk_size}: {len(chunks)} chunks, avg length: {avg_chunk_len}")
    
    print("\n" + "=" * 60)
    print(" Document processing test complete!")
    print("=" * 60)
    print("\nNext steps:")
    print("  1. Try processing a real PDF file")


if __name__ == "__main__":
    test_document_processing()