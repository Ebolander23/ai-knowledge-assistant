'use client';

import { X, Keyboard } from 'lucide-react';

interface KeyboardShortcutsProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode?: boolean;
}

export default function KeyboardShortcuts({ isOpen, onClose, darkMode = false }: KeyboardShortcutsProps) {
  if (!isOpen) return null;

  const modalBg = darkMode ? '#1e293b' : '#ffffff'; // slate-800 or white
  const borderColor = darkMode ? '#475569' : '#e5e7eb'; // slate-600 or gray-200
  const textPrimary = darkMode ? '#f1f5f9' : '#374151'; // slate-100 or gray-700
  const kbdBg = darkMode ? '#334155' : '#f3f4f6'; // slate-700 or gray-100
  const kbdBorder = darkMode ? '#64748b' : '#d1d5db'; // slate-500 or gray-300
  const footerBg = darkMode ? '#334155' : '#f9fafb'; // slate-700 or gray-50
  const textMuted = darkMode ? '#94a3b8' : '#6b7280'; // slate-400 or gray-500

  const shortcuts = [
    { keys: ['Enter'], description: 'Send message' },
    { keys: ['Shift', 'Enter'], description: 'New line' },
    { keys: ['Ctrl', 'K'], description: 'Clear chat' },
    { keys: ['Ctrl', '/'], description: 'Show shortcuts' },
    { keys: ['Escape'], description: 'Close modal' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden animate-slide-in"
        style={{ backgroundColor: modalBg }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-500 to-blue-500" style={{ borderBottom: `1px solid ${borderColor}` }}>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="p-4 space-y-3">
          {shortcuts.map((shortcut, index) => (
            <div key={index} className="flex items-center justify-between">
              <span style={{ color: textPrimary }}>{shortcut.description}</span>
              <div className="flex items-center gap-1">
                {shortcut.keys.map((key, keyIndex) => (
                  <span key={keyIndex}>
                    <kbd 
                      className="px-2 py-1 rounded-md text-sm font-mono"
                      style={{ 
                        backgroundColor: kbdBg, 
                        border: `1px solid ${kbdBorder}`,
                        color: textPrimary,
                      }}
                    >
                      {key}
                    </kbd>
                    {keyIndex < shortcut.keys.length - 1 && (
                      <span className="mx-1" style={{ color: textMuted }}>+</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4" style={{ backgroundColor: footerBg, borderTop: `1px solid ${borderColor}` }}>
          <p className="text-xs text-center" style={{ color: textMuted }}>
            Press <kbd className="px-1.5 py-0.5 rounded text-xs" style={{ backgroundColor: kbdBg }}>Esc</kbd> to close
          </p>
        </div>
      </div>
    </div>
  );
}
