import React, { useState, useEffect } from 'react';
import { Search, X, Sparkles, MapPin, ArrowRight } from 'lucide-react';

interface HeroBannerProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit: (query: string) => void;
  onQuickSelect: (destination: string) => void;
}

const QUICK_DESTINATIONS = [
  'Kyoto',
  'Paris',
  'Rome',
  'Bali',
  'Cairo',
  'Mahabalipuram',
  'San Francisco',
  'Banff'
];

export const HeroBanner: React.FC<HeroBannerProps> = ({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  onQuickSelect,
}) => {
  const [localInput, setLocalInput] = useState(searchQuery);

  useEffect(() => {
    setLocalInput(searchQuery);
  }, [searchQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchSubmit(localInput);
  };

  const handleClear = () => {
    setLocalInput('');
    onSearchChange('');
    onSearchSubmit('');
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#103D30] to-[#0A2920] text-white py-12 md:py-16 px-4 sm:px-6 lg:px-8 shadow-sm">
      {/* Subtle organic background patterns */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#FAF8F5_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-4xl mx-auto text-center space-y-6">
        {/* Curated Tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-white/10 text-emerald-200 border border-white/15 backdrop-blur-sm shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Curated Travel Intelligence & Live Places API</span>
        </div>

        {/* Main Heading */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight font-serif text-white leading-tight">
          Where will your journey take you?
        </h1>

        <p className="max-w-2xl mx-auto text-sm sm:text-base text-stone-200/90 font-normal leading-relaxed">
          Discover world-renowned landmarks, serene natural wonders, and architectural treasures.
          Search real destinations powered by live geographical data.
        </p>

        {/* Search Bar */}
        <form
          onSubmit={handleSubmit}
          className="max-w-2xl mx-auto mt-4 relative flex items-center bg-white rounded-2xl p-1.5 shadow-2xl border border-stone-200/50 transition-all focus-within:ring-3 focus-within:ring-emerald-400/40"
        >
          <div className="pl-3 text-stone-400">
            <Search className="w-5 h-5 text-stone-500" />
          </div>

          <input
            type="text"
            value={localInput}
            onChange={(e) => {
              setLocalInput(e.target.value);
              onSearchChange(e.target.value);
            }}
            placeholder="Search city, monument, or keyword (e.g. Kyoto, Louvre, Beach)..."
            className="w-full px-3 py-2.5 text-sm sm:text-base text-stone-900 placeholder-stone-400 focus:outline-none bg-transparent"
            aria-label="Search destinations"
          />

          {localInput && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 text-stone-400 hover:text-stone-600 rounded-lg transition-colors mr-1 cursor-pointer"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            type="submit"
            className="flex items-center gap-1.5 px-5 py-2.5 bg-[#0F382C] hover:bg-[#164E3E] text-white text-sm font-semibold rounded-xl shadow-md transition-all duration-200 hover:shadow-lg shrink-0 cursor-pointer"
          >
            <span>Search</span>
            <ArrowRight className="w-4 h-4 hidden sm:inline" />
          </button>
        </form>

        {/* Quick Suggestions Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs">
          <span className="text-stone-300 font-medium mr-1 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-amber-300" />
            Popular:
          </span>
          {QUICK_DESTINATIONS.map((dest) => (
            <button
              key={dest}
              onClick={() => onQuickSelect(dest)}
              className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-stone-100 hover:text-white border border-white/10 transition-colors duration-150 cursor-pointer text-xs font-medium"
            >
              {dest}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
