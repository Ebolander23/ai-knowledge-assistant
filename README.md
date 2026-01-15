# AI Knowledge Assistant

> Chat with your documents using RAG + AI agents.

![Screenshot](docs/screenshot.png)

## Features

- 📄 **Document Upload** - Upload PDFs and text documents
- 💬 **Natural Language Chat** - Ask questions in plain English
- 📍 **Citations** - Get answers with source references
- 🔍 **Web Search Fallback** - Searches the web when docs don't have the answer
- 🧮 **Built-in Calculator** - Handles numerical questions automatically

## Tech Stack

| Layer | Technology |
|-------|------------|
| **LLM** | OpenAI GPT-4o |
| **Framework** | LangChain |
| **Vector DB** | Pinecone |
| **Backend** | FastAPI |
| **Frontend** | Next.js + Tailwind |

## Quick Start

### Prerequisites

- Python 3.10+
- OpenAI API key

### Backend Setup
```bash
# Clone the repo
git clone https://github.com/Ebolander23/ai-knowledge-assistant.git
cd ai-knowledge-assistant/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Run the server
uvicorn app.main:app --reload
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/upload` | POST | Upload a document |
| `/chat` | POST | Send a message, get a response |
| `/clear-history` | POST | Clear conversation history |

## Built By

**Eric Bolander**
- [LinkedIn](https://www.linkedin.com/in/eric-bolander/)
- [GitHub](https://github.com/Ebolander23)