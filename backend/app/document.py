"""
Document Processing Module
Handles loading, chunking, and metadata extraction for documents.
"""

import os
from typing import List
from langchain_core.documents import Document
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.config import settings


class DocumentProcessor:
    """Handles document loading and chunking."""
    
    def __init__(
        self,
        chunk_size: int = None,
        chunk_overlap: int = None
    ):
        self.chunk_size = chunk_size or settings.CHUNK_SIZE
        self.chunk_overlap = chunk_overlap or settings.CHUNK_OVERLAP
        
        # Initialize the text splitter
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap,
            length_function=len,
            separators=["\n\n", "\n", ". ", " ", ""]
        )
    
    def load_document(self, file_path: str) -> List[Document]:
        """
        Load a document from file path.
        Supports PDF and TXT files.
        """
        file_extension = os.path.splitext(file_path)[1].lower()
        
        if file_extension == ".pdf":
            loader = PyPDFLoader(file_path)
        elif file_extension in [".txt", ".md"]:
            loader = TextLoader(file_path, encoding="utf-8")
        else:
            raise ValueError(f"Unsupported file type: {file_extension}")
        
        documents = loader.load()
        
        # Add source filename to metadata
        filename = os.path.basename(file_path)
        for doc in documents:
            doc.metadata["source"] = filename
            
        return documents
    
    def chunk_documents(self, documents: List[Document]) -> List[Document]:
        """
        Split documents into smaller chunks.
        Preserves and enhances metadata.
        """
        chunks = self.text_splitter.split_documents(documents)
        
        # Add chunk index to metadata
        for i, chunk in enumerate(chunks):
            chunk.metadata["chunk_index"] = i
            chunk.metadata["total_chunks"] = len(chunks)
            
        return chunks
    
    def process_document(self, file_path: str) -> List[Document]:
        """
        Full pipeline: load document and chunk it.
        Returns list of document chunks with metadata.
        """
        # Load the document
        documents = self.load_document(file_path)
        
        # Chunk the documents
        chunks = self.chunk_documents(documents)
        
        print(f" Document Processed '{os.path.basename(file_path)}':")
        print(f"   - Pages/sections loaded: {len(documents)}")
        print(f"   - Chunks created: {len(chunks)}")
        print(f"   - Chunk size: {self.chunk_size}, Overlap: {self.chunk_overlap}")
        
        return chunks


def print_chunks_preview(chunks: List[Document], num_preview: int = 3):
    """Helper function to preview chunks."""
    print(f"\n Preview of first {min(num_preview, len(chunks))} chunks:\n")
    
    for i, chunk in enumerate(chunks[:num_preview]):
        print(f"--- Chunk {i + 1} ---")
        print(f"Metadata: {chunk.metadata}")
        print(f"Content ({len(chunk.page_content)} chars):")
        print(f"{chunk.page_content[:200]}...")
        print()