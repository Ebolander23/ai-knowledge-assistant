'use client';

import { Source, WebSource } from '@/types';
import { FileText, ExternalLink } from 'lucide-react';

interface SourceCardProps {
  source: Source | WebSource;
  type: 'document' | 'web';
}

export default function SourceCard({ source, type }: SourceCardProps) {
  if (type === 'document') {
    const docSource = source as Source;
    
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-3 text-sm">
        <div className="flex items-start gap-2">
          <FileText className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-gray-800 truncate">
                {docSource.source}
              </span>
              <span className="text-xs text-gray-500">Page {docSource.page}</span>
              <span
                className={`text-xs px-1.5 py-0.5 rounded ${
                  docSource.relevance_label === 'High'
                    ? 'bg-green-100 text-green-700'
                    : docSource.relevance_label === 'Medium'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {docSource.relevance_label}
              </span>
            </div>
            <p className="text-gray-600 text-xs mt-1 line-clamp-2">
              {docSource.snippet}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const webSource = source as WebSource;
  
  return (
    
     <a href={webSource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-white border border-gray-200 rounded-lg p-3 text-sm hover:border-blue-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-start gap-2">
        <ExternalLink className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <span className="font-medium text-blue-600 hover:underline truncate block">
            {webSource.title}
          </span>
          <p className="text-gray-600 text-xs mt-1 line-clamp-2">
            {webSource.snippet}
          </p>
        </div>
      </div>
    </a>
  );
}