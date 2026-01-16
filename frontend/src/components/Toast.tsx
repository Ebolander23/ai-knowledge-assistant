'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type, onClose, duration = 4000 }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <XCircle className="w-5 h-5 text-red-500" />,
    info: <AlertCircle className="w-5 h-5 text-blue-500" />,
  };

  const bgColors = {
    success: 'bg-green-50 dark:bg-green-900/50 border-green-200 dark:border-green-700',
    error: 'bg-red-50 dark:bg-red-900/50 border-red-200 dark:border-red-700',
    info: 'bg-blue-50 dark:bg-blue-900/50 border-blue-200 dark:border-blue-700',
  };

  return (
    <div
      className={`fixed bottom-4 right-4 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg transition-all duration-300 z-50 ${
        bgColors[type]
      } ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
    >
      {icons[type]}
      <span className="text-sm text-gray-700 dark:text-slate-100">{message}</span>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }}
        className="p-1 hover:bg-gray-200 dark:hover:bg-slate-600 rounded transition-colors"
      >
        <X className="w-4 h-4 text-gray-500 dark:text-slate-300" />
      </button>
    </div>
  );
}
