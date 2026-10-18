import { Compass, Bookmark, Globe2, Sparkles } from 'lucide-react';

interface NavbarProps {
  activeTab: 'explore' | 'mytrip';
  onTabChange: (tab: 'explore' | 'mytrip') => void;
  savedCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  savedCount,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#FAF8F5]/90 backdrop-blur-md border-b border-stone-200/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Brand Logo */}
          <div
            onClick={() => onTabChange('explore')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-[#0F382C] flex items-center justify-center text-white shadow-sm transition-transform duration-200 group-hover:scale-105">
              <Compass className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold tracking-tight text-stone-900 font-serif">
                  TripWise
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-800 border border-amber-200">
                  <Sparkles className="w-2.5 h-2.5" />
                  Smart
                </span>
              </div>
              <p className="text-[11px] text-stone-500 font-medium tracking-wide">
                Smart Travel Planner
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2" aria-label="Main Navigation">
            <button
              onClick={() => onTabChange('explore')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                activeTab === 'explore'
                  ? 'bg-[#0F382C] text-white shadow-sm shadow-emerald-950/20'
                  : 'text-stone-700 hover:text-stone-900 hover:bg-stone-100/80'
              }`}
            >
              <Globe2 className="w-4 h-4" />
              <span>Explore</span>
            </button>

            <button
              onClick={() => onTabChange('mytrip')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer relative ${
                activeTab === 'mytrip'
                  ? 'bg-[#0F382C] text-white shadow-sm shadow-emerald-950/20'
                  : 'text-stone-700 hover:text-stone-900 hover:bg-stone-100/80'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              <span>My Trip</span>
              {savedCount > 0 && (
                <span
                  className={`inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-xs font-bold rounded-full ${
                    activeTab === 'mytrip'
                      ? 'bg-amber-400 text-stone-950'
                      : 'bg-[#0F382C] text-white'
                  }`}
                >
                  {savedCount}
                </span>
              )}
            </button>
          </nav>

          {/* Live External API Status Indicator */}
          <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-stone-600 bg-stone-100/90 border border-stone-200 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-stone-700 font-medium">Live OSM & Wikipedia APIs</span>
          </div>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden border-t border-stone-200/80 bg-stone-50/95 px-4 py-2 flex items-center justify-around">
        <button
          onClick={() => onTabChange('explore')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'explore'
              ? 'bg-[#0F382C] text-white shadow-sm'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Globe2 className="w-4 h-4" />
          <span>Explore</span>
        </button>

        <button
          onClick={() => onTabChange('mytrip')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-semibold transition-all relative ${
            activeTab === 'mytrip'
              ? 'bg-[#0F382C] text-white shadow-sm'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          <span>My Trip</span>
          {savedCount > 0 && (
            <span className="ml-1 inline-flex items-center justify-center min-w-4.5 h-4.5 px-1 text-[11px] font-bold rounded-full bg-amber-500 text-stone-950">
              {savedCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
