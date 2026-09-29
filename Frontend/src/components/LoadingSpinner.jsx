import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ message = 'Loading...', size = 'md' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-2 text-slate-500">
      <Loader2 className={`${sizeClasses[size] || sizeClasses.md} animate-spin text-orange-600`} />
      {message && <p className="text-xs font-medium text-slate-500">{message}</p>}
    </div>
  );
}
