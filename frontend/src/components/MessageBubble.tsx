'use client';

import { Message } from '@/types';
import { User, Bot, Globe, Calculator, FileText, Sparkles } from 'lucide-react';
import SourceCard from './SourceCard';

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

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

  const getToolBadgeClass = () => {
    switch (message.tool_used) {
      case 'documents':
        return 'tool-badge tool-badge-documents';
      case 'web_search':
        return 'tool-badge tool-badge-web';
      case 'calculator':
        return 'tool-badge tool-badge-calculator';
      default:
        return 'tool-badge tool-badge-general';
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
    <div className={`flex gap-3 animate-slide-in ${isUser ? 'flex-row-reverse' : ''}`}>
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
          <div className={`mb-1.5 ${getToolBadgeClass()}`}>
            {getToolIcon()}
            <span>{getToolLabel()}</span>
          </div>
        )}

        {/* Bubble */}
        <div
          className={`rounded-2xl px-4 py-3 shadow-sm ${
            isUser
              ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-md'
              : 'bg-white text-gray-800 rounded-bl-md border border-gray-100'
          }`}
        >
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        </div>

        {/* Sources */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-3 space-y-2 w-full">
            <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
              <FileText className="w-3 h-3" />
              Document Sources ({message.sources.length})
            </p>
            {message.sources.map((source) => (
              <SourceCard key={source.id} source={source} type="document" />
            ))}
          </div>
        )}

        {/* Web Sources */}
        {!isUser && message.web_sources && message.web_sources.length > 0 && (
          <div className="mt-3 space-y-2 w-full">
            <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
              <Globe className="w-3 h-3" />
              Web Sources ({message.web_sources.length})
            </p>
            {message.web_sources.map((source) => (
              <SourceCard key={source.id} source={source} type="web" />
            ))}
          </div>
        )}

        {/* Timestamp */}
        <span className="text-xs text-gray-400 mt-1.5">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}