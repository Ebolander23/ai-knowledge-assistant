// API Response Types

export interface Source {
    id: number;
    source: string;
    page: number;
    chunk_index: number;
    relevance_score: number;
    relevance_label: string;
    snippet: string;
  }
  
  export interface WebSource {
    id: number;
    title: string;
    url: string;
    snippet: string;
  }
  
  export interface ChatResponse {
    answer: string;
    tool_used: string;
    sources: Source[] | null;
    web_sources: WebSource[] | null;
    used_rag: boolean;
    documents_searched: number;
  }
  
  export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    sources?: Source[] | null;
    web_sources?: WebSource[] | null;
    tool_used?: string;
    timestamp: Date;
  }
  
  export interface Document {
    filename: string;
    size_bytes: number;
  }
  
  export interface HealthStatus {
    status: string;
    message: string;
    index_stats: {
      total_vectors: number;
      index_name: string;
    } | null;
    agent_status: {
      conversation_length: number;
      tools_available: string[];
    } | null;
  }