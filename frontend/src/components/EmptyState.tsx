import React from 'react';
import { Compass, RotateCcw } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  onReset?: () => void;
  actionText?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No destinations found',
  description = 'We couldn’t find any places matching your current search or filters. Try adjusting keywords or selecting a different category.',
  onReset,
  actionText = 'Reset Filters'
}) => {
  return (
    <div className="py-16 px-4 text-center max-w-md mx-auto space-y-4">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-stone-100 flex items-center justify-center text-stone-400 border border-stone-200">
        <Compass className="w-8 h-8 text-[#0F382C]" />
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-bold font-serif text-stone-900">{title}</h3>
        <p className="text-sm text-stone-600 leading-relaxed">{description}</p>
      </div>

      {onReset && (
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0F382C] text-white text-xs sm:text-sm font-semibold rounded-xl hover:bg-[#164E3E] transition-all cursor-pointer shadow-sm"
        >
          <RotateCcw className="w-4 h-4" />
          <span>{actionText}</span>
        </button>
      )}
    </div>
  );
};
