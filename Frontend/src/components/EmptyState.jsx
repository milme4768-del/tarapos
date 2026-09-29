import React from 'react';
import { FolderOpen } from 'lucide-react';

export default function EmptyState({
  icon: Icon = FolderOpen,
  title = 'No items found',
  description = 'There are currently no records to display.',
  action = null,
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
      <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="font-semibold text-slate-800 text-base">{title}</h3>
      <p className="text-xs text-slate-500 max-w-xs mt-1 mb-4">{description}</p>
      {action}
    </div>
  );
}
