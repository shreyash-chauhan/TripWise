import React from 'react';

export const SkeletonCard: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-stone-200 shadow-xs animate-pulse flex flex-col justify-between h-[360px]">
      {/* Image Skeleton */}
      <div className="aspect-4/3 w-full bg-stone-200" />

      {/* Content Skeleton */}
      <div className="p-4 sm:p-5 space-y-3 flex-1 flex flex-col justify-between">
        <div className="space-y-2">
          {/* Location line */}
          <div className="h-3 w-1/3 bg-stone-200 rounded-md" />
          {/* Title line */}
          <div className="h-5 w-3/4 bg-stone-200 rounded-md" />
          {/* Description line 1 */}
          <div className="h-3.5 w-full bg-stone-200 rounded-md mt-2" />
          {/* Description line 2 */}
          <div className="h-3.5 w-4/5 bg-stone-200 rounded-md" />
        </div>

        {/* Footer Skeleton */}
        <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
          <div className="h-7 w-16 bg-stone-200 rounded-lg" />
          <div className="h-8 w-24 bg-stone-200 rounded-xl" />
        </div>
      </div>
    </div>
  );
};
