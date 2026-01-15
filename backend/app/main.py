"""
AI Knowledge Assistant - Main Application
Built by Eric Bolander
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv

# LangChain imports
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

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

# Initialize the LLM
llm = ChatOpenAI(
    model="gpt-4o",
    temperature=0.7,
    api_key=os.getenv("OPENAI_API_KEY")
)

# Simple in-memory chat history
chat_history = []


class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    answer: str
    sources: Optional[List[dict]] = None

class HealthResponse(BaseModel):
    status: str
    message: str


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        message="AI Knowledge Assistant is running"
    )


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Send a message and get a response from the AI assistant.
    This is the basic version - we'll add RAG in Day 5.
    """
    try:
        # Create the prompt template
        prompt = ChatPromptTemplate.from_messages([
            SystemMessage(content="""You are a helpful AI assistant. 
            You help users understand documents and answer questions.
            Be concise but thorough in your responses."""),
            MessagesPlaceholder(variable_name="history"),
            HumanMessage(content="{input}")
        ])
        
        # Create the chain
        chain = prompt | llm
        
        # Get response
        response = chain.invoke({
            "history": chat_history,
            "input": request.message
        })
        
        # Update chat history
        chat_history.append(HumanMessage(content=request.message))
        chat_history.append(AIMessage(content=response.content))
        
        # Keep history manageable (last 10 exchanges)
        if len(chat_history) > 20:
            chat_history.pop(0)
            chat_history.pop(0)
        
        return ChatResponse(
            answer=response.content,
            sources=None
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """
    Upload a document for processing.
    Full pipeline coming in Days 2-4.
    """
    return {
        "filename": file.filename,
        "status": "received",
        "message": "Document upload endpoint ready. Full processing coming in Day 2-4."
    }


@app.post("/clear-history")
async def clear_history():
    """Clear the chat history"""
    global chat_history
    chat_history = []
    return {"status": "cleared", "message": "Chat history cleared"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)