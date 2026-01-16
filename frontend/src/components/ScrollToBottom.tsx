'use client';

import { ChevronDown } from 'lucide-react';

interface ScrollToBottomProps {
  visible: boolean;
  onClick: () => void;
  darkMode?: boolean;
}

export default function ScrollToBottom({ visible, onClick, darkMode = false }: ScrollToBottomProps) {
  if (!visible) return null;

  const bg = darkMode ? '#334155' : '#ffffff'; // slate-700 or white
  const border = darkMode ? '#64748b' : '#e5e7eb'; // slate-500 or gray-200
  const iconColor = darkMode ? '#e2e8f0' : '#4b5563'; // slate-200 or gray-600

  return (
    <button
      onClick={onClick}
      className="absolute bottom-24 right-6 p-2 rounded-full shadow-lg hover:shadow-xl transition-all animate-bounce"
      style={{ backgroundColor: bg, border: `1px solid ${border}` }}
      title="Scroll to bottom"
    >
      <ChevronDown className="w-5 h-5" style={{ color: iconColor }} />
    </button>
  );
}
