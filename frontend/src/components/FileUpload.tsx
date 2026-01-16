'use client';

import { useState, useCallback, useRef } from 'react';
import { CheckCircle, XCircle, Loader2, FileUp, FolderOpen } from 'lucide-react';
import { uploadDocument } from '@/lib/api';

interface FileUploadProps {
  onUploadComplete?: () => void;
  darkMode?: boolean;
}

export default function FileUpload({ onUploadComplete, darkMode = false }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await handleUpload(files[0]);
    }
  }, []);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await handleUpload(files[0]);
      e.target.value = '';
    }
  }, []);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setUploadStatus(null);

    try {
      const result = await uploadDocument(file);
      setUploadStatus({
        success: true,
        message: `✓ ${result.chunks_created} chunks created`,
      });
      onUploadComplete?.();
      
      setTimeout(() => setUploadStatus(null), 3000);
    } catch (error: any) {
      setUploadStatus({
        success: false,
        message: error.response?.data?.detail || 'Upload failed',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  // Colors based on dark mode
  const dropzoneBg = isDragging 
    ? (darkMode ? '#581c87' : '#faf5ff')
    : uploadStatus?.success 
    ? (darkMode ? '#14532d' : '#f0fdf4')
    : uploadStatus?.success === false
    ? (darkMode ? '#7f1d1d' : '#fef2f2')
    : (darkMode ? '#334155' : '#f9fafb');
  
  const dropzoneBorder = isDragging
    ? '#a855f7'
    : uploadStatus?.success
    ? '#22c55e'
    : uploadStatus?.success === false
    ? '#ef4444'
    : (darkMode ? '#64748b' : '#d1d5db');

  const textColor = darkMode ? '#f1f5f9' : '#374151';
  const textMuted = darkMode ? '#94a3b8' : '#9ca3af';

  return (
    <div className="p-4">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.txt,.md,.docx"
        onChange={handleFileSelect}
      />

      {/* Drop zone with inline styles */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="relative rounded-xl p-4 text-center transition-all duration-200"
        style={{
          backgroundColor: dropzoneBg,
          border: `2px dashed ${dropzoneBorder}`,
        }}
      >
        {uploading ? (
          <div className="flex flex-col items-center py-2">
            <div className="relative">
              <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
            </div>
            <p className="mt-3 text-sm font-medium" style={{ color: textColor }}>Processing document...</p>
            <p className="text-xs mt-1" style={{ color: textMuted }}>Creating embeddings</p>
          </div>
        ) : uploadStatus ? (
          <div className="flex flex-col items-center py-2">
            {uploadStatus.success ? (
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            ) : (
              <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                <XCircle className="w-6 h-6 text-white" />
              </div>
            )}
            <p className={`mt-3 text-sm font-medium ${uploadStatus.success ? 'text-green-600' : 'text-red-600'}`}>
              {uploadStatus.message}
            </p>
          </div>
        ) : (
          <div className="py-2">
            {/* Upload icon */}
            <div 
              className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-3"
              style={{ backgroundColor: darkMode ? '#7c3aed' : '#ede9fe' }}
            >
              <FileUp className="w-6 h-6" style={{ color: darkMode ? '#e9d5ff' : '#7c3aed' }} />
            </div>
            
            {/* Drag text */}
            <p className="text-sm mb-3" style={{ color: textColor }}>
              Drag & drop your file here
            </p>
            
            {/* Or divider */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 h-px" style={{ backgroundColor: darkMode ? '#64748b' : '#e5e7eb' }} />
              <span className="text-xs" style={{ color: textMuted }}>or</span>
              <div className="flex-1 h-px" style={{ backgroundColor: darkMode ? '#64748b' : '#e5e7eb' }} />
            </div>
            
            {/* Browse button */}
            <button
              onClick={handleBrowseClick}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
            >
              <FolderOpen className="w-4 h-4" />
              Browse Files
            </button>
            
            {/* Supported formats */}
            <p className="mt-3 text-xs" style={{ color: textMuted }}>
              Supports PDF, TXT, MD, DOCX
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
