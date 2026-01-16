'use client';

import { useState, useEffect } from 'react';
import { FileText, Trash2, RefreshCw, Database, X, Upload, Moon, Sun } from 'lucide-react';
import { getDocuments, deleteDocument, getHealth } from '@/lib/api';
import { Document, HealthStatus } from '@/types';
import FileUpload from './FileUpload';
import Toast, { ToastType } from './Toast';
import { DocumentSkeleton } from './LoadingSkeleton';
import { useTheme } from './ThemeProvider';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const { darkMode, toggleDarkMode } = useTheme();

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

  // Inline styles to guarantee solid backgrounds
  const sidebarBg = darkMode ? '#1e293b' : '#ffffff'; // slate-800 or white
  const cardBg = darkMode ? '#334155' : '#f9fafb'; // slate-700 or gray-50
  const borderColor = darkMode ? '#475569' : '#e5e7eb'; // slate-600 or gray-200
  const textPrimary = darkMode ? '#f1f5f9' : '#1f2937'; // slate-100 or gray-800
  const textSecondary = darkMode ? '#cbd5e1' : '#6b7280'; // slate-300 or gray-500
  const footerBg = darkMode ? '#334155' : '#f9fafb'; // slate-700 or gray-50

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar with inline styles for guaranteed solid background */}
      <aside
        className={`
          fixed md:relative inset-y-0 left-0 z-50
          w-72 flex-shrink-0
          flex flex-col h-full
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          shadow-xl md:shadow-none
        `}
        style={{
          backgroundColor: sidebarBg,
          borderRight: `1px solid ${borderColor}`,
        }}
      >
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-purple-500 to-blue-500" style={{ borderBottom: `1px solid ${borderColor}` }}>
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-white flex items-center gap-2">
              📚 Knowledge Base
            </h1>
            <div className="flex items-center gap-1">
              {/* Dark mode toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              {/* Close button - mobile only */}
              <button
                onClick={onClose}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg md:hidden transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          {health && (
            <div className="flex items-center gap-2 mt-2 text-sm text-white/80">
              <Database className="w-4 h-4" />
              <span>{health.index_stats?.total_vectors || 0} vectors indexed</span>
            </div>
          )}
        </div>

        {/* Upload Area */}
        <div style={{ backgroundColor: sidebarBg, borderBottom: `1px solid ${borderColor}` }}>
          <FileUpload onUploadComplete={fetchData} darkMode={darkMode} />
        </div>

        {/* Documents List */}
        <div 
          className="flex-1 overflow-y-auto p-4"
          style={{ backgroundColor: sidebarBg }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: textPrimary }}>
              <FileText className="w-4 h-4" />
              Documents
            </h2>
            <button
              onClick={fetchData}
              disabled={loading}
              className="p-1.5 rounded-lg transition-colors disabled:opacity-50"
              style={{ color: textSecondary }}
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loading ? (
            <div className="space-y-2">
              <DocumentSkeleton darkMode={darkMode} />
              <DocumentSkeleton darkMode={darkMode} />
              <DocumentSkeleton darkMode={darkMode} />
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8">
              <Upload className="w-10 h-10 mx-auto mb-2" style={{ color: textSecondary }} />
              <p className="text-sm" style={{ color: textSecondary }}>No documents yet</p>
              <p className="text-xs" style={{ color: textSecondary }}>Upload files above to get started</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {documents.map((doc) => (
                <li
                  key={doc.filename}
                  className="flex items-center gap-2 p-2.5 rounded-lg group transition-colors"
                  style={{ 
                    backgroundColor: cardBg,
                    border: `1px solid ${borderColor}`,
                  }}
                >
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: darkMode ? '#1e40af' : '#dbeafe' }}
                  >
                    <FileText className="w-4 h-4" style={{ color: darkMode ? '#93c5fd' : '#2563eb' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate font-medium" style={{ color: textPrimary }}>{doc.filename}</p>
                    <p className="text-xs" style={{ color: textSecondary }}>{formatBytes(doc.size_bytes)}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(doc.filename)}
                    className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-100 dark:hover:bg-red-900/30"
                    style={{ color: darkMode ? '#f87171' : '#dc2626' }}
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
        <div 
          className="p-4"
          style={{ 
            backgroundColor: footerBg,
            borderTop: `1px solid ${borderColor}`,
          }}
        >
          <p className="text-xs font-medium" style={{ color: textSecondary }}>AI Knowledge Assistant</p>
          <p className="text-xs" style={{ color: textSecondary }}>Built by Eric Bolander</p>
        </div>

        {/* Toast */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </aside>
    </>
  );
}
