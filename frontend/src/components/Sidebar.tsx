'use client';

import { useState, useEffect } from 'react';
import { FileText, Trash2, RefreshCw, Database, X, Upload } from 'lucide-react';
import { getDocuments, deleteDocument, getHealth } from '@/lib/api';
import { Document, HealthStatus } from '@/types';
import FileUpload from './FileUpload';
import Toast, { ToastType } from './Toast';
import { DocumentSkeleton } from './LoadingSkeleton';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [docsResponse, healthResponse] = await Promise.all([
        getDocuments(),
        getHealth(),
      ]);
      setDocuments(docsResponse.documents);
      setHealth(healthResponse);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setToast({ message: 'Failed to connect to server', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (filename: string) => {
    if (confirm(`Delete ${filename}?`)) {
      try {
        await deleteDocument(filename);
        setToast({ message: `${filename} deleted`, type: 'success' });
        fetchData();
      } catch (error) {
        setToast({ message: 'Failed to delete file', type: 'error' });
      }
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 flex flex-col h-full transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-500 to-blue-500">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-white flex items-center gap-2">
              📚 Knowledge Base
            </h1>
            <button
              onClick={onClose}
              className="p-1 text-white/80 hover:text-white rounded md:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {health && (
            <div className="flex items-center gap-2 mt-2 text-sm text-white/80">
              <Database className="w-4 h-4" />
              <span>{health.index_stats?.total_vectors || 0} vectors indexed</span>
            </div>
          )}
        </div>

        {/* Upload Area */}
        <FileUpload onUploadComplete={fetchData} />

        {/* Documents List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Documents
            </h2>
            <button
              onClick={fetchData}
              disabled={loading}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loading ? (
            <div className="space-y-2">
              <DocumentSkeleton />
              <DocumentSkeleton />
              <DocumentSkeleton />
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8">
              <Upload className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No documents yet</p>
              <p className="text-xs text-gray-400">Upload files above to get started</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {documents.map((doc) => (
                <li
                  key={doc.filename}
                  className="flex items-center gap-2 p-2.5 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 group transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 truncate font-medium">{doc.filename}</p>
                    <p className="text-xs text-gray-500">{formatBytes(doc.size_bytes)}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(doc.filename)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500 font-medium">AI Knowledge Assistant</p>
          <p className="text-xs text-gray-400">Built by Eric Bolander</p>
        </div>

        {/* Toast */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </>
  );
}