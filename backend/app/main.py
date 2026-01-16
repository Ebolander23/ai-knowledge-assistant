"""
AI Knowledge Assistant - Main Application
Built by Eric Bolander

Day 7: Added tool-using agents (web search, calculator)
"""

import os
import shutil
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv

from app.document import DocumentProcessor
from app.embeddings import EmbeddingsManager
from app.agents import get_agent
from app.config import settings

load_dotenv()

app = FastAPI(
    title="AI Knowledge Assistant",
    description="Chat with your documents using RAG + AI agents",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

document_processor = DocumentProcessor()
embeddings_manager = None

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def get_embeddings_manager():
    global embeddings_manager
    if embeddings_manager is None:
        embeddings_manager = EmbeddingsManager()
    return embeddings_manager


# ============== Pydantic Models ==============

class ChatRequest(BaseModel):
    message: str

class WebSource(BaseModel):
    id: int
    title: str
    url: str
    snippet: str

class ChatResponse(BaseModel):
    answer: str
    tool_used: str
    sources: Optional[List[dict]] = None
    web_sources: Optional[List[dict]] = None
    used_rag: bool = False
    documents_searched: int = 0

class HealthResponse(BaseModel):
    status: str
    message: str
    index_stats: Optional[dict] = None
    agent_status: Optional[dict] = None

class UploadResponse(BaseModel):
    filename: str
    status: str
    chunks_created: int
    message: str


# ============== Endpoints ==============

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check with index and agent stats."""
    try:
        manager = get_embeddings_manager()
        stats = manager.get_index_stats()
        agent = get_agent()
        agent_status = agent.get_status()
        
        return HealthResponse(
            status="healthy",
            message="AI Knowledge Assistant is running",
            index_stats={
                "total_vectors": stats.total_vector_count,
                "index_name": settings.PINECONE_INDEX_NAME
            },
            agent_status=agent_status
        )
    except Exception as e:
        return HealthResponse(
            status="healthy",
            message=f"Running (issue: {str(e)})",
            index_stats=None,
            agent_status=None
        )


@app.post("/upload", response_model=UploadResponse)
async def upload_document(file: UploadFile = File(...)):
    """Upload and process a document."""
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type {file_ext} not supported. Allowed: {settings.ALLOWED_EXTENSIONS}"
        )
    
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    
    try:
        chunks = document_processor.process_document(file_path)
    except Exception as e:
        os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Failed to process: {str(e)}")
    
    try:
        manager = get_embeddings_manager()
        manager.add_documents(chunks)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to store: {str(e)}")
    
    return UploadResponse(
        filename=file.filename,
        status="success",
        chunks_created=len(chunks),
        message=f"Document processed. Created {len(chunks)} searchable chunks."
    )


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Chat with the AI agent. Automatically uses appropriate tools."""
    try:
        agent = get_agent()
        result = agent.run(request.message)
        
        return ChatResponse(
            answer=result["answer"],
            tool_used=result["tool_used"],
            sources=result.get("sources"),
            web_sources=result.get("web_sources"),
            used_rag=result.get("used_rag", False),
            documents_searched=result.get("documents_searched", 0)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/clear-history")
async def clear_history():
    """Clear conversation history."""
    agent = get_agent()
    agent.clear_history()
    return {"status": "cleared", "message": "Conversation history cleared"}


@app.get("/documents")
async def list_documents():
    """List uploaded documents."""
    files = []
    for filename in os.listdir(UPLOAD_DIR):
        file_path = os.path.join(UPLOAD_DIR, filename)
        if os.path.isfile(file_path):
            files.append({
                "filename": filename,
                "size_bytes": os.path.getsize(file_path)
            })
    return {"documents": files, "count": len(files)}


@app.delete("/documents/{filename}")
async def delete_document(filename: str):
    """Delete a document."""
    file_path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    os.remove(file_path)
    return {"status": "deleted", "filename": filename}


@app.post("/index/clear")
async def clear_index():
    """Clear all vectors from Pinecone."""
    try:
        manager = get_embeddings_manager()
        manager.delete_all()
        return {"status": "cleared", "message": "All vectors deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)