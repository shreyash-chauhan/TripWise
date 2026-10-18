import React from 'react';
import {
  Layers,
  Landmark,
  Trees,
  Palette,
  UtensilsCrossed,
  Waves,
  Building2,
  Compass,
  ArrowUpDown,
  RotateCcw
} from 'lucide-react';
import type { SortOption } from '../types';

interface CategoryFilterBarProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  categories: { name: string; count: number }[];
  currentSort: SortOption;
  onSortChange: (sort: SortOption) => void;
  totalResults: number;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
}

const CATEGORY_ICONS: Record<string, React.FC<{ className?: string }>> = {
  'All': Layers,
  'Historical & Landmarks': Landmark,
  'Nature & Parks': Trees,
  'Arts & Culture': Palette,
  'Food & Dining': UtensilsCrossed,
  'Coastal & Beaches': Waves,
  'Architecture': Building2,
  'Modern & Urban': Compass,
};

export const CategoryFilterBar: React.FC<CategoryFilterBarProps> = ({
  selectedCategory,
  onSelectCategory,
  categories,
  currentSort,
  onSortChange,
  totalResults,
  hasActiveFilters,
  onResetFilters,
}) => {
  // Fallback category list if not loaded yet
  const displayCategories = categories.length > 0 ? categories : [
    { name: 'All', count: 0 },
    { name: 'Historical & Landmarks', count: 0 },
    { name: 'Nature & Parks', count: 0 },
    { name: 'Arts & Culture', count: 0 },
    { name: 'Food & Dining', count: 0 },
    { name: 'Coastal & Beaches', count: 0 },
    { name: 'Architecture', count: 0 },
    { name: 'Modern & Urban', count: 0 },
  ];

  return (
    <div className="space-y-4 pt-6 pb-2">
      {/* Category Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none scroll-smooth">
        {displayCategories.map((cat) => {
          const Icon = CATEGORY_ICONS[cat.name] || Layers;
          const isSelected = selectedCategory.toLowerCase() === cat.name.toLowerCase();

          return (
            <button
              key={cat.name}
              onClick={() => onSelectCategory(cat.name)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer border ${
                isSelected
                  ? 'bg-[#0F382C] text-white border-[#0F382C] shadow-sm'
                  : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300 hover:bg-stone-50'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-emerald-300' : 'text-stone-500'}`} />
              <span>{cat.name}</span>
              {cat.count > 0 && (
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  {cat.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Meta Bar: Results count, Reset button, and Sort Dropdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-stone-200/80">
        <div className="flex items-center gap-3">
          <p className="text-xs sm:text-sm text-stone-600 font-medium">
            Showing <strong className="text-stone-900 font-semibold">{totalResults}</strong> destination{totalResults === 1 ? '' : 's'}
            {selectedCategory !== 'All' && <span> in <span className="text-[#0F382C] font-semibold">{selectedCategory}</span></span>}
          </p>

          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="inline-flex items-center gap-1 text-xs font-semibold text-stone-500 hover:text-stone-900 underline underline-offset-2 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Reset filters
            </button>
          )}
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <label htmlFor="sort-select" className="text-xs font-semibold text-stone-600 flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-stone-500" />
            Sort by:
          </label>
          <select
            id="sort-select"
            value={currentSort}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="text-xs sm:text-sm font-medium bg-white text-stone-800 border border-stone-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-[#0F382C] cursor-pointer shadow-2xs"
          >
            <option value="recommended">Recommended & Curated</option>
            <option value="rating-desc">Rating: Highest First</option>
            <option value="name-asc">Name: A to Z</option>
            <option value="name-desc">Name: Z to A</option>
            <option value="category">Category</option>
          </select>
        </div>
      </div>
    </div>
  );
};
