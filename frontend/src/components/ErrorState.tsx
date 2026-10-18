import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  message?: string;
  onRetry: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = 'Failed to load destinations. Please check your network connection.',
  onRetry,
}) => {
  return (
    <div className="py-16 px-4 text-center max-w-md mx-auto space-y-4">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600 border border-rose-200">
        <AlertCircle className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-bold font-serif text-stone-900">Unable to retrieve places</h3>
        <p className="text-sm text-stone-600 leading-relaxed">{message}</p>
      </div>

      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-900 text-white text-xs sm:text-sm font-semibold rounded-xl hover:bg-rose-950 transition-all cursor-pointer shadow-sm"
      >
        <RefreshCw className="w-4 h-4" />
        <span>Try Again</span>
      </button>
    </div>
  );
};
