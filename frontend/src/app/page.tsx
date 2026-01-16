'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import ChatInterface from '@/components/ChatInterface';
import { ThemeProvider } from '@/components/ThemeProvider';

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ThemeProvider>
      <main className="flex h-screen bg-gray-100 dark:bg-slate-900 transition-colors duration-200">
        {/* Sidebar - fixed on mobile, static on desktop */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        {/* Main content area */}
        <div className="flex-1 flex flex-col min-w-0">
          <ChatInterface onMenuClick={() => setSidebarOpen(true)} />
        </div>
      </main>
    </ThemeProvider>
  );
}
