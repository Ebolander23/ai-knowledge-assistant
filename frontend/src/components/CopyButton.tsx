'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyButtonProps {
  text: string;
  className?: string;
  darkMode?: boolean;
}

export default function CopyButton({ text, className = '', darkMode = false }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const bgNormal = darkMode ? '#475569' : '#f3f4f6'; // slate-600 or gray-100
  const bgHover = darkMode ? '#64748b' : '#e5e7eb'; // slate-500 or gray-200
  const bgCopied = darkMode ? '#166534' : '#dcfce7'; // green-800 or green-100
  const colorNormal = darkMode ? '#cbd5e1' : '#6b7280'; // slate-300 or gray-500
  const colorCopied = darkMode ? '#86efac' : '#16a34a'; // green-300 or green-600

  return (
    <button
      onClick={handleCopy}
      className={`p-1.5 rounded-lg transition-all ${className}`}
      style={{
        backgroundColor: copied ? bgCopied : bgNormal,
        color: copied ? colorCopied : colorNormal,
      }}
      onMouseEnter={(e) => {
        if (!copied) {
          e.currentTarget.style.backgroundColor = bgHover;
        }
      }}
      onMouseLeave={(e) => {
        if (!copied) {
          e.currentTarget.style.backgroundColor = bgNormal;
        }
      }}
      title={copied ? 'Copied!' : 'Copy to clipboard'}
    >
      {copied ? (
        <Check className="w-4 h-4" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
    </button>
  );
}
