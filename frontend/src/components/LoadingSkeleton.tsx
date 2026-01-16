'use client';

export function MessageSkeleton() {
  return (
    <div className="flex gap-3 animate-pulse">
      <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="h-4 bg-gray-200 rounded w-2/3" />
      </div>
    </div>
  );
}

export function DocumentSkeleton() {
  return (
    <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200 animate-pulse">
      <div className="w-4 h-4 bg-gray-200 rounded" />
      <div className="flex-1">
        <div className="h-3 bg-gray-200 rounded w-3/4 mb-1" />
        <div className="h-2 bg-gray-200 rounded w-1/4" />
      </div>
    </div>
  );
}

export function SourceSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 animate-pulse">
      <div className="flex items-start gap-2">
        <div className="w-4 h-4 bg-gray-200 rounded flex-shrink-0" />
        <div className="flex-1">
          <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
          <div className="h-2 bg-gray-200 rounded w-full" />
          <div className="h-2 bg-gray-200 rounded w-3/4 mt-1" />
        </div>
      </div>
    </div>
  );
}