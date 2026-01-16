'use client';

import { Source, WebSource } from '@/types';
import { FileText, ExternalLink } from 'lucide-react';

interface SourceCardProps {
  source: Source | WebSource;
  type: 'document' | 'web';
  darkMode?: boolean;
}

export default function SourceCard({ source, type, darkMode = false }: SourceCardProps) {
  const cardBg = darkMode ? '#334155' : '#ffffff'; // slate-700 or white
  const borderColor = darkMode ? '#475569' : '#e5e7eb'; // slate-600 or gray-200
  const textPrimary = darkMode ? '#f1f5f9' : '#1f2937'; // slate-100 or gray-800
  const textSecondary = darkMode ? '#cbd5e1' : '#4b5563'; // slate-300 or gray-600
  const textMuted = darkMode ? '#94a3b8' : '#6b7280'; // slate-400 or gray-500

  if (type === 'document') {
    const docSource = source as Source;
    
    const getRelevanceBadgeStyle = () => {
      if (docSource.relevance_label === 'High') {
        return { backgroundColor: darkMode ? '#166534' : '#dcfce7', color: darkMode ? '#86efac' : '#15803d' };
      } else if (docSource.relevance_label === 'Medium') {
        return { backgroundColor: darkMode ? '#854d0e' : '#fef9c3', color: darkMode ? '#fde047' : '#a16207' };
      }
      return { backgroundColor: darkMode ? '#475569' : '#f3f4f6', color: darkMode ? '#cbd5e1' : '#4b5563' };
    };
    
    return (
      <div 
        className="rounded-lg p-3 text-sm"
        style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}
      >
        <div className="flex items-start gap-2">
          <FileText className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: darkMode ? '#60a5fa' : '#2563eb' }} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium truncate" style={{ color: textPrimary }}>
                {docSource.source}
              </span>
              <span className="text-xs" style={{ color: textMuted }}>Page {docSource.page}</span>
              <span
                className="text-xs px-1.5 py-0.5 rounded"
                style={getRelevanceBadgeStyle()}
              >
                {docSource.relevance_label}
              </span>
            </div>
            <p className="text-xs mt-1 line-clamp-2" style={{ color: textSecondary }}>
              {docSource.snippet}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const webSource = source as WebSource;
  
  return (
    <a 
      href={webSource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-lg p-3 text-sm transition-all hover:shadow-sm"
      style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}
    >
      <div className="flex items-start gap-2">
        <ExternalLink className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: darkMode ? '#4ade80' : '#16a34a' }} />
        <div className="flex-1 min-w-0">
          <span className="font-medium hover:underline truncate block" style={{ color: darkMode ? '#60a5fa' : '#2563eb' }}>
            {webSource.title}
          </span>
          <p className="text-xs mt-1 line-clamp-2" style={{ color: textSecondary }}>
            {webSource.snippet}
          </p>
        </div>
      </div>
    </a>
  );
}
