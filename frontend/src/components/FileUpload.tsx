'use client';

import { useState, useCallback } from 'react';
import { Upload, CheckCircle, XCircle, Loader2, FileUp } from 'lucide-react';
import { uploadDocument } from '@/lib/api';

interface FileUploadProps {
  onUploadComplete?: () => void;
}

export default function FileUpload({ onUploadComplete }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

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

  return (
    <div className="p-4 border-b border-gray-200">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-4 text-center transition-all ${
          isDragging
            ? 'border-purple-500 bg-purple-50 scale-[1.02]'
            : uploadStatus?.success
            ? 'border-green-300 bg-green-50'
            : uploadStatus?.success === false
            ? 'border-red-300 bg-red-50'
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        }`}
      >
        {uploading ? (
          <div className="flex flex-col items-center py-2">
            <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
            <p className="mt-2 text-sm text-gray-600">Processing...</p>
          </div>
        ) : uploadStatus ? (
          <div className="flex flex-col items-center py-2">
            {uploadStatus.success ? (
              <CheckCircle className="w-8 h-8 text-green-500" />
            ) : (
              <XCircle className="w-8 h-8 text-red-500" />
            )}
            <p className={`mt-2 text-sm ${uploadStatus.success ? 'text-green-600' : 'text-red-600'}`}>
              {uploadStatus.message}
            </p>
          </div>
        ) : (
          <>
            <FileUp className="w-8 h-8 text-gray-400 mx-auto" />
            <p className="mt-2 text-sm text-gray-600">
              Drop file or{' '}
              <label className="text-purple-600 hover:text-purple-700 font-medium cursor-pointer">
                browse
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.txt,.md,.docx"
                  onChange={handleFileSelect}
                />
              </label>
            </p>
            <p className="mt-1 text-xs text-gray-400">PDF, TXT, MD, DOCX</p>
          </>
        )}
      </div>
    </div>
  );
}