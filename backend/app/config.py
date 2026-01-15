"""
Configuration settings for AI Knowledge Assistant
"""

import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # API Keys
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    PINECONE_API_KEY: str = os.getenv("PINECONE_API_KEY", "")
    TAVILY_API_KEY: str = os.getenv("TAVILY_API_KEY", "")
    
    # Pinecone Settings
    PINECONE_INDEX_NAME: str = os.getenv("PINECONE_INDEX_NAME", "knowledge-assistant")
    
    # LLM Settings
    LLM_MODEL: str = "gpt-4o"
    LLM_TEMPERATURE: float = 0.7
    
    # Chunking Settings (Day 2)
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200
    
    # Embedding Settings
    EMBEDDING_MODEL: str = "text-embedding-3-small"
    EMBEDDING_DIMENSIONS: int = 1536
    
    # File Upload Settings
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS: list = [".pdf", ".txt", ".docx", ".md"]

settings = Settings()