'use client';

interface SkeletonProps {
  darkMode?: boolean;
}

export function MessageSkeleton({ darkMode = false }: SkeletonProps) {
  const skeletonBg = darkMode ? '#475569' : '#e5e7eb';
  
  return (
    <div className="flex gap-3 animate-pulse">
      <div className="w-8 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: skeletonBg }} />
      <div className="flex-1 space-y-2">
        <div className="h-4 rounded w-3/4" style={{ backgroundColor: skeletonBg }} />
        <div className="h-4 rounded w-1/2" style={{ backgroundColor: skeletonBg }} />
        <div className="h-4 rounded w-2/3" style={{ backgroundColor: skeletonBg }} />
      </div>
    </div>
  );
}

export function DocumentSkeleton({ darkMode = false }: SkeletonProps) {
  const cardBg = darkMode ? '#334155' : '#f9fafb';
  const borderColor = darkMode ? '#475569' : '#e5e7eb';
  const skeletonBg = darkMode ? '#475569' : '#e5e7eb';
  
  return (
    <div 
      className="flex items-center gap-2 p-2.5 rounded-lg animate-pulse"
      style={{ 
        backgroundColor: cardBg,
        border: `1px solid ${borderColor}`,
      }}
    >
      <div className="w-8 h-8 rounded-lg flex-shrink-0" style={{ backgroundColor: skeletonBg }} />
      <div className="flex-1">
        <div className="h-3.5 rounded w-3/4 mb-1.5" style={{ backgroundColor: skeletonBg }} />
        <div className="h-2.5 rounded w-1/4" style={{ backgroundColor: skeletonBg }} />
      </div>
    </div>
  );
}

export function SourceSkeleton({ darkMode = false }: SkeletonProps) {
  const cardBg = darkMode ? '#334155' : '#f9fafb';
  const borderColor = darkMode ? '#475569' : '#e5e7eb';
  const skeletonBg = darkMode ? '#475569' : '#e5e7eb';
  
  return (
    <div 
      className="rounded-lg p-3 animate-pulse"
      style={{ 
        backgroundColor: cardBg,
        border: `1px solid ${borderColor}`,
      }}
    >
      <div className="flex items-start gap-2">
        <div className="w-4 h-4 rounded flex-shrink-0" style={{ backgroundColor: skeletonBg }} />
        <div className="flex-1">
          <div className="h-3 rounded w-1/2 mb-2" style={{ backgroundColor: skeletonBg }} />
          <div className="h-2 rounded w-full" style={{ backgroundColor: skeletonBg }} />
          <div className="h-2 rounded w-3/4 mt-1" style={{ backgroundColor: skeletonBg }} />
        </div>
      </div>
    </div>
  );
}
