'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, Trash2, Sparkles, Menu, Keyboard } from 'lucide-react';
import { Message } from '@/types';
import { sendMessage, clearHistory } from '@/lib/api';
import MessageBubble from './MessageBubble';
import Toast, { ToastType } from './Toast';
import ScrollToBottom from './ScrollToBottom';
import KeyboardShortcuts from './KeyboardShortcuts';
import { useTheme } from './ThemeProvider';

interface ChatInterfaceProps {
  onMenuClick?: () => void;
}

export default function ChatInterface({ onMenuClick }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const { darkMode } = useTheme();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Colors based on dark mode
  const bgMain = darkMode ? '#0f172a' : '#f9fafb'; // slate-900 or gray-50
  const bgHeader = darkMode ? '#1e293b' : '#ffffff'; // slate-800 or white
  const borderColor = darkMode ? '#475569' : '#e5e7eb'; // slate-600 or gray-200
  const textPrimary = darkMode ? '#f1f5f9' : '#1f2937'; // slate-100 or gray-800
  const textSecondary = darkMode ? '#94a3b8' : '#6b7280'; // slate-400 or gray-500
  const inputBg = darkMode ? '#334155' : '#ffffff'; // slate-700 or white
  const inputBorder = darkMode ? '#64748b' : '#d1d5db'; // slate-500 or gray-300
  const cardBg = darkMode ? '#1e293b' : '#ffffff'; // slate-800 or white

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  const handleScroll = useCallback(() => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom && messages.length > 0);
    }
  }, [messages.length]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 150) + 'px';
    }
  }, [input]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        handleClearChat();
      }
      if (e.ctrlKey && e.key === '/') {
        e.preventDefault();
        setShowShortcuts(true);
      }
      if (e.key === 'Escape') {
        setShowShortcuts(false);
      }
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (document.activeElement !== inputRef.current) {
          inputRef.current?.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    try {
      const response = await sendMessage(userMessage.content);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.answer,
        sources: response.sources,
        web_sources: response.web_sources,
        tool_used: response.tool_used,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Failed to send message:', error);
      setToast({
        message: 'Failed to get response. Is the backend running?',
        type: 'error',
      });
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I couldn\'t connect to the server. Please make sure the backend is running on http://127.0.0.1:8000',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = async () => {
    if (messages.length === 0) return;
    
    if (confirm('Clear chat history?')) {
      try {
        await clearHistory();
        setMessages([]);
        setToast({ message: 'Chat history cleared', type: 'success' });
      } catch (error) {
        setToast({ message: 'Failed to clear history', type: 'error' });
      }
    }
  };

  const suggestions = [
    { text: "What is Eric's education?", icon: "🎓" },
    { text: "What's the current price of Bitcoin?", icon: "💰" },
    { text: "Calculate 15% of 250", icon: "🔢" },
    { text: "What are Eric's technical skills?", icon: "💻" },
  ];

  return (
    <div className="flex-1 flex flex-col h-full relative" style={{ backgroundColor: bgMain }}>
      {/* Chat Header */}
      <div 
        className="flex items-center justify-between px-4 md:px-6 py-4 shadow-sm"
        style={{ backgroundColor: bgHeader, borderBottom: `1px solid ${borderColor}` }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg md:hidden transition-colors hover:bg-gray-100 dark:hover:bg-slate-700"
          >
            <Menu className="w-5 h-5" style={{ color: textSecondary }} />
          </button>
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: textPrimary }}>
              <Sparkles className="w-5 h-5 text-purple-500" />
              Chat
            </h2>
            <p className="text-sm hidden sm:block" style={{ color: textSecondary }}>Ask questions about your documents</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowShortcuts(true)}
            className="p-2 rounded-lg transition-colors hidden sm:block hover:bg-gray-100 dark:hover:bg-slate-700"
            title="Keyboard shortcuts (Ctrl+/)"
          >
            <Keyboard className="w-5 h-5" style={{ color: textSecondary }} />
          </button>
          <button
            onClick={handleClearChat}
            disabled={messages.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-50 dark:hover:bg-red-900/30"
            style={{ color: textSecondary }}
            title="Clear chat (Ctrl+K)"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: textPrimary }}>
              AI Knowledge Assistant
            </h3>
            <p className="max-w-md mb-6" style={{ color: textSecondary }}>
              Upload documents to your knowledge base, then ask questions. 
              I can search your documents, browse the web, and do calculations!
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.text}
                  onClick={() => setInput(suggestion.text)}
                  className="flex items-center gap-2 px-4 py-3 text-sm rounded-xl transition-all hover:shadow-sm text-left"
                  style={{ 
                    backgroundColor: cardBg, 
                    border: `1px solid ${borderColor}`,
                    color: textPrimary,
                  }}
                >
                  <span>{suggestion.icon}</span>
                  <span className="truncate">{suggestion.text}</span>
                </button>
              ))}
            </div>
            <p className="text-xs mt-6" style={{ color: textSecondary }}>
              Press <kbd className="px-1.5 py-0.5 rounded text-xs" style={{ backgroundColor: darkMode ? '#334155' : '#e5e7eb' }}>Ctrl</kbd> + <kbd className="px-1.5 py-0.5 rounded text-xs" style={{ backgroundColor: darkMode ? '#334155' : '#e5e7eb' }}>/</kbd> for keyboard shortcuts
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} darkMode={darkMode} />
          ))
        )}

        {loading && (
          <div className="flex items-center gap-3 animate-slide-in">
            <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-sm">
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            </div>
            <div 
              className="rounded-2xl rounded-bl-md px-4 py-3 shadow-sm"
              style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}
            >
              <div className="flex items-center gap-2" style={{ color: textSecondary }}>
                <span className="animate-pulse-soft">Thinking</span>
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      <ScrollToBottom 
        visible={showScrollButton} 
        onClick={() => scrollToBottom('smooth')}
        darkMode={darkMode}
      />

      {/* Input Area */}
      <div className="p-4" style={{ backgroundColor: bgHeader, borderTop: `1px solid ${borderColor}` }}>
        <div className="flex items-end gap-3 max-w-4xl mx-auto">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything..."
              rows={1}
              className="w-full resize-none rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-shadow"
              style={{ 
                maxHeight: '150px',
                backgroundColor: inputBg,
                border: `1px solid ${inputBorder}`,
                color: textPrimary,
              }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md disabled:shadow-none"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        <p className="text-xs text-center mt-2" style={{ color: textSecondary }}>
          Press <kbd className="px-1 py-0.5 rounded text-xs" style={{ backgroundColor: darkMode ? '#334155' : '#f3f4f6' }}>Enter</kbd> to send, <kbd className="px-1 py-0.5 rounded text-xs" style={{ backgroundColor: darkMode ? '#334155' : '#f3f4f6' }}>Shift+Enter</kbd> for new line
        </p>
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcuts 
        isOpen={showShortcuts} 
        onClose={() => setShowShortcuts(false)}
        darkMode={darkMode}
      />
    </div>
  );
}
