'use client';

import { useState } from 'react';
import { Message } from '@/types';
import { User, Bot, Globe, Calculator, FileText, Sparkles } from 'lucide-react';
import SourceCard from './SourceCard';
import CopyButton from './CopyButton';

interface MessageBubbleProps {
  message: Message;
  darkMode?: boolean;
}

export default function MessageBubble({ message, darkMode = false }: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  const isUser = message.role === 'user';

  // Colors
  const bubbleBg = darkMode ? '#334155' : '#ffffff'; // slate-700 or white
  const bubbleBorder = darkMode ? '#475569' : '#f3f4f6'; // slate-600 or gray-100
  const textColor = darkMode ? '#f1f5f9' : '#1f2937'; // slate-100 or gray-800
  const textMuted = darkMode ? '#94a3b8' : '#6b7280'; // slate-400 or gray-500

  const getToolIcon = () => {
    switch (message.tool_used) {
      case 'documents':
        return <FileText className="w-3 h-3" />;
      case 'web_search':
        return <Globe className="w-3 h-3" />;
      case 'calculator':
        return <Calculator className="w-3 h-3" />;
      default:
        return <Sparkles className="w-3 h-3" />;
    }
  };

  const getToolBadgeStyle = () => {
    switch (message.tool_used) {
      case 'documents':
        return { backgroundColor: darkMode ? '#1e40af' : '#dbeafe', color: darkMode ? '#93c5fd' : '#1d4ed8' };
      case 'web_search':
        return { backgroundColor: darkMode ? '#166534' : '#dcfce7', color: darkMode ? '#86efac' : '#15803d' };
      case 'calculator':
        return { backgroundColor: darkMode ? '#5b21b6' : '#f3e8ff', color: darkMode ? '#c4b5fd' : '#7c3aed' };
      default:
        return { backgroundColor: darkMode ? '#475569' : '#f3f4f6', color: darkMode ? '#e2e8f0' : '#374151' };
    }
  };

  const getToolLabel = () => {
    switch (message.tool_used) {
      case 'documents':
        return 'Documents';
      case 'web_search':
        return 'Web Search';
      case 'calculator':
        return 'Calculator';
      case 'general':
        return 'General';
      default:
        return '';
    }
  };

  return (
    <div 
      className={`flex gap-3 animate-slide-in group ${isUser ? 'flex-row-reverse' : ''}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center shadow-sm ${
          isUser 
            ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
            : 'bg-gradient-to-br from-purple-500 to-purple-600'
        }`}
      >
        {isUser ? (
          <User className="w-5 h-5 text-white" />
        ) : (
          <Bot className="w-5 h-5 text-white" />
        )}
      </div>

      {/* Message Content */}
      <div className={`flex flex-col max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Tool indicator badge */}
        {!isUser && message.tool_used && (
          <div 
            className="mb-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
            style={getToolBadgeStyle()}
          >
            {getToolIcon()}
            <span>{getToolLabel()}</span>
          </div>
        )}

        {/* Bubble with actions */}
        <div className="relative">
          <div
            className={`rounded-2xl px-4 py-3 shadow-sm ${
              isUser
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-md'
                : 'rounded-bl-md'
            }`}
            style={isUser ? {} : { 
              backgroundColor: bubbleBg, 
              border: `1px solid ${bubbleBorder}`,
              color: textColor,
            }}
          >
            <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
          </div>

          {/* Action buttons */}
          <div 
            className={`absolute top-0 ${isUser ? 'left-0 -translate-x-full pr-2' : 'right-0 translate-x-full pl-2'} 
            flex items-center gap-1 transition-opacity duration-200 ${showActions ? 'opacity-100' : 'opacity-0'}`}
          >
            <CopyButton text={message.content} darkMode={darkMode} />
          </div>
        </div>

        {/* Sources */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-3 space-y-2 w-full">
            <p className="text-xs font-medium flex items-center gap-1" style={{ color: textMuted }}>
              <FileText className="w-3 h-3" />
              Document Sources ({message.sources.length})
            </p>
            {message.sources.map((source) => (
              <SourceCard key={source.id} source={source} type="document" darkMode={darkMode} />
            ))}
          </div>
        )}

        {/* Web Sources */}
        {!isUser && message.web_sources && message.web_sources.length > 0 && (
          <div className="mt-3 space-y-2 w-full">
            <p className="text-xs font-medium flex items-center gap-1" style={{ color: textMuted }}>
              <Globe className="w-3 h-3" />
              Web Sources ({message.web_sources.length})
            </p>
            {message.web_sources.map((source) => (
              <SourceCard key={source.id} source={source} type="web" darkMode={darkMode} />
            ))}
          </div>
        )}

        {/* Timestamp */}
        <span className="text-xs mt-1.5" style={{ color: textMuted }}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}
