import axios from 'axios';
import { ChatResponse, Document, HealthStatus } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function sendMessage(message: string): Promise<ChatResponse> {
  const response = await api.post<ChatResponse>('/chat', { message });
  return response.data;
}

export async function uploadDocument(file: File): Promise<{
  filename: string;
  status: string;
  chunks_created: number;
  message: string;
}> {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

export async function getDocuments(): Promise<{ documents: Document[]; count: number }> {
  const response = await api.get('/documents');
  return response.data;
}

export async function deleteDocument(filename: string): Promise<void> {
  await api.delete(`/documents/${encodeURIComponent(filename)}`);
}

export async function getHealth(): Promise<HealthStatus> {
  const response = await api.get<HealthStatus>('/health');
  return response.data;
}

export async function clearHistory(): Promise<void> {
  await api.post('/clear-history');
}