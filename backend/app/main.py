"""
AI Knowledge Assistant - Main Application
Built by Eric Bolander

Day 4: Full backend integration with document upload and RAG
"""

import os
import shutil
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv

# LangChain imports
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

# Our custom modules
from app.document import DocumentProcessor
from app.embeddings import EmbeddingsManager
from app.config import settings

load_dotenv()

app = FastAPI(
    title="AI Knowledge Assistant",
    description="Chat with your documents using RAG + AI agents",
    version="1.0.0"
)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize components
llm = ChatOpenAI(
    model="gpt-4o",
    temperature=0.7,
    api_key=os.getenv("OPENAI_API_KEY")
)

document_processor = DocumentProcessor()
embeddings_manager = None  # Lazy initialization

# In-memory chat history
chat_history = []

# Upload directory
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def get_embeddings_manager():
    """Lazy initialization of embeddings manager."""
    global embeddings_manager
    if embeddings_manager is None:
        embeddings_manager = EmbeddingsManager()
    return embeddings_manager


# ============== Pydantic Models ==============

class ChatRequest(BaseModel):
    message: str
    use_rag: bool = True  # Whether to search documents

class ChatResponse(BaseModel):
    answer: str
    sources: Optional[List[dict]] = None

class HealthResponse(BaseModel):
    status: str
    message: str
    index_stats: Optional[dict] = None

class UploadResponse(BaseModel):
    filename: str
    status: str
    chunks_created: int
    message: str


# ============== Endpoints ==============

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint with index stats."""
    try:
        manager = get_embeddings_manager()
        stats = manager.get_index_stats()
        return HealthResponse(
            status="healthy",
            message="AI Knowledge Assistant is running",
            index_stats={
                "total_vectors": stats.total_vector_count,
                "index_name": settings.PINECONE_INDEX_NAME
            }
        )
    except Exception as e:
        return HealthResponse(
            status="healthy",
            message=f"Running (Pinecone connection issue: {str(e)})",
            index_stats=None
        )


@app.post("/upload", response_model=UploadResponse)
async def upload_document(file: UploadFile = File(...)):
    """
    Upload a document, process it, and store embeddings in Pinecone.
    Supports PDF and TXT files.
    """
    # Validate file type
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type {file_ext} not supported. Allowed: {settings.ALLOWED_EXTENSIONS}"
        )
    
    # Save uploaded file
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    
    # Process document into chunks
    try:
        chunks = document_processor.process_document(file_path)
    except Exception as e:
        # Clean up file if processing fails
        os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Failed to process document: {str(e)}")
    
    # Store embeddings in Pinecone
    try:
        manager = get_embeddings_manager()
        manager.add_documents(chunks)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to store embeddings: {str(e)}")
    
    return UploadResponse(
        filename=file.filename,
        status="success",
        chunks_created=len(chunks),
        message=f"Document processed and stored. Created {len(chunks)} searchable chunks."
    )


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Chat with the AI assistant.
    If use_rag=True, searches documents for relevant context.
    """
    try:
        context = ""
        sources = []
        
        # RAG: Search for relevant documents
        if request.use_rag:
            try:
                manager = get_embeddings_manager()
                results = manager.similarity_search(request.message, k=4)
                
                if results:
                    # Build context from retrieved documents
                    context_parts = []
                    for i, doc in enumerate(results):
                        source_info = {
                            "source": doc.metadata.get("source", "Unknown"),
                            "page": doc.metadata.get("page", 0) + 1,
                            "chunk_index": doc.metadata.get("chunk_index", 0),
                            "snippet": doc.page_content[:200] + "..."
                        }
                        sources.append(source_info)
                        context_parts.append(f"[Source {i+1}: {source_info['source']}, Page {source_info['page']}]\n{doc.page_content}")
                    
                    context = "\n\n".join(context_parts)
            except Exception as e:
                print(f"RAG search failed: {e}")
                # Continue without RAG if it fails
        
        # Build the prompt
        if context:
            system_message = """You are a helpful AI assistant with access to the user's documents.
            
Use the following context from the user's documents to answer their question.
Always cite your sources by mentioning which document and page the information came from.
If the context doesn't contain relevant information, say so and answer based on your general knowledge.

CONTEXT FROM DOCUMENTS:
{context}
"""
            system_content = system_message.format(context=context)
        else:
            system_content = """You are a helpful AI assistant.
You help users understand documents and answer questions.
Be concise but thorough in your responses."""
        
        prompt = ChatPromptTemplate.from_messages([
            SystemMessage(content=system_content),
            MessagesPlaceholder(variable_name="history"),
            HumanMessage(content="{input}")
        ])
        
        # Create chain and get response
        chain = prompt | llm
        response = chain.invoke({
            "history": chat_history,
            "input": request.message
        })
        
        # Update chat history
        chat_history.append(HumanMessage(content=request.message))
        chat_history.append(AIMessage(content=response.content))
        
        # Keep history manageable
        if len(chat_history) > 20:
            chat_history.pop(0)
            chat_history.pop(0)
        
        return ChatResponse(
            answer=response.content,
            sources=sources if sources else None
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/clear-history")
async def clear_history():
    """Clear the chat history."""
    global chat_history
    chat_history = []
    return {"status": "cleared", "message": "Chat history cleared"}


@app.get("/documents")
async def list_documents():
    """List all uploaded documents."""
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
    """Delete a document (note: vectors remain in Pinecone)."""
    file_path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    os.remove(file_path)
    return {
        "status": "deleted",
        "filename": filename,
        "note": "File deleted. Vector embeddings remain in Pinecone."
    }


@app.post("/index/clear")
async def clear_index():
    """Clear all vectors from Pinecone index."""
    try:
        manager = get_embeddings_manager()
        manager.delete_all()
        return {"status": "cleared", "message": "All vectors deleted from index"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)