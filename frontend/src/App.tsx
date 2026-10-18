import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { CategoryFilterBar } from './components/CategoryFilterBar';
import { DestinationCard } from './components/DestinationCard';
import { DestinationModal } from './components/DestinationModal';
import { SkeletonCard } from './components/SkeletonCard';
import { EmptyState } from './components/EmptyState';
import { ErrorState } from './components/ErrorState';
import { MyTripView } from './components/MyTripView';
import { ExportModal } from './components/ExportModal';
import { useToast } from './context/ToastContext';
import { api } from './services/api';
import type { Place, ItineraryItem, SortOption } from './types';
import { Globe, Sparkles } from 'lucide-react';

export const App: React.FC = () => {
  const { showToast } = useToast();

  // Navigation
  const [activeTab, setActiveTab] = useState<'explore' | 'mytrip'>('explore');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedQuery, setDebouncedQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [currentSort, setCurrentSort] = useState<SortOption>('recommended');

  // Data states
  const [places, setPlaces] = useState<Place[]>([]);
  const [categories, setCategories] = useState<{ name: string; count: number }[]>([]);
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);
  const [totalResults, setTotalResults] = useState<number>(0);

  // Status states
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);

  // Debounce search query to prevent excessive queries while typing
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Load Itinerary from backend on mount
  const loadItinerary = useCallback(async () => {
    try {
      const items = await api.getItinerary();
      setItinerary(items);
    } catch (err: any) {
      console.warn('Could not load itinerary initially:', err.message);
    }
  }, []);

  // Load Categories on mount
  const loadCategories = useCallback(async () => {
    try {
      const cats = await api.getCategories();
      if (cats && cats.length > 0) {
        setCategories(cats);
      }
    } catch (err) {
      console.warn('Could not load categories:', err);
    }
  }, []);

  // Fetch Places whenever query, category, or sort changes
  const loadPlaces = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getPlaces({
        query: debouncedQuery,
        category: selectedCategory,
        sort: currentSort,
      });
      setPlaces(res.places);
      setTotalResults(res.total);
    } catch (err: any) {
      console.error('Failed to load places:', err);
      setError(err.message || 'Unable to connect to the destinations service.');
      showToast('Failed to load destinations. Please check your connection.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedQuery, selectedCategory, currentSort, showToast]);

  // Initial load
  useEffect(() => {
    loadCategories();
    loadItinerary();
  }, [loadCategories, loadItinerary]);

  useEffect(() => {
    loadPlaces();
  }, [loadPlaces]);

  // Set of saved place IDs for O(1) lookup
  const savedPlaceIds = useMemo(() => {
    return new Set(itinerary.map((item) => item.placeId));
  }, [itinerary]);

  // Add / Remove from itinerary
  const handleToggleSave = async (place: Place, notes?: string, visitDate?: string) => {
    const isAlreadySaved = savedPlaceIds.has(place.id);

    if (isAlreadySaved) {
      // Remove
      try {
        await api.removeFromItineraryByPlaceId(place.id);
        setItinerary((prev) => prev.filter((item) => item.placeId !== place.id));
        showToast(`Removed "${place.name}" from your itinerary`, 'info');
      } catch (err: any) {
        showToast('Failed to remove from itinerary', 'error');
      }
    } else {
      // Add
      try {
        const newItem = await api.addToItinerary(place, notes, visitDate);
        setItinerary((prev) => [newItem, ...prev.filter((i) => i.placeId !== place.id)]);
        showToast(`Added "${place.name}" to your trip!`, 'success');
      } catch (err: any) {
        showToast('Failed to add to itinerary', 'error');
      }
    }
  };

  // Remove by Itinerary numeric ID
  const handleRemoveItineraryItem = async (id: number) => {
    const item = itinerary.find((i) => i.id === id);
    try {
      await api.removeFromItinerary(id);
      setItinerary((prev) => prev.filter((i) => i.id !== id));
      showToast(`Removed "${item?.name || 'Destination'}" from itinerary`, 'info');
    } catch (err) {
      showToast('Failed to delete item', 'error');
    }
  };

  // Update notes / visitDate
  const handleUpdateItineraryItem = async (id: number, fields: { notes?: string; visitDate?: string }) => {
    try {
      const updated = await api.updateItineraryItem(id, fields);
      setItinerary((prev) => prev.map((item) => (item.id === id ? updated : item)));
      showToast('Trip plan updated successfully!', 'success');
    } catch (err) {
      showToast('Failed to update trip notes', 'error');
    }
  };

  // Clear all itinerary items
  const handleClearAllItinerary = async () => {
    if (!window.confirm('Are you sure you want to clear your entire itinerary?')) return;
    try {
      await api.clearItinerary();
      setItinerary([]);
      showToast('Itinerary cleared', 'info');
    } catch (err) {
      showToast('Failed to clear itinerary', 'error');
    }
  };

  // Open Details Modal
  const handleOpenDetails = (place: Place) => {
    setSelectedPlace(place);
    setIsDetailsOpen(true);
  };

  // Quick Select from Hero
  const handleQuickSelect = (destination: string) => {
    setSearchQuery(destination);
    setSelectedCategory('All');
    setActiveTab('explore');
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setDebouncedQuery('');
    setSelectedCategory('All');
    setCurrentSort('recommended');
  };

  const hasActiveFilters = searchQuery.length > 0 || selectedCategory !== 'All' || currentSort !== 'recommended';

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-stone-900 selection:bg-emerald-800 selection:text-white">
      {/* Navigation */}
      <Navbar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        savedCount={itinerary.length}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'explore' ? (
          <div>
            {/* Hero Section */}
            <HeroBanner
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSearchSubmit={(q) => {
                setSearchQuery(q);
                setDebouncedQuery(q);
              }}
              onQuickSelect={handleQuickSelect}
            />

            {/* Container */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
              {/* Filter and Sort Toolbar */}
              <CategoryFilterBar
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                categories={categories}
                currentSort={currentSort}
                onSortChange={setCurrentSort}
                totalResults={totalResults}
                hasActiveFilters={hasActiveFilters}
                onResetFilters={handleResetFilters}
              />

              {/* Error State */}
              {error ? (
                <ErrorState message={error} onRetry={loadPlaces} />
              ) : isLoading ? (
                /* Loading Skeleton Grid */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              ) : places.length === 0 ? (
                /* Empty Results State */
                <EmptyState
                  title="No places match your search"
                  description="We couldn’t find any destinations matching your criteria. Try searching for major cities, landmarks, or reset your filters."
                  onReset={handleResetFilters}
                  actionText="Show All Destinations"
                />
              ) : (
                /* Destination Cards Grid */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-2">
                  {places.map((place) => (
                    <DestinationCard
                      key={place.id}
                      place={place}
                      isSaved={savedPlaceIds.has(place.id)}
                      onToggleSave={handleToggleSave}
                      onOpenDetails={handleOpenDetails}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* My Trip Itinerary View */
          <MyTripView
            items={itinerary}
            onRemoveItem={handleRemoveItineraryItem}
            onUpdateItem={handleUpdateItineraryItem}
            onClearAll={handleClearAllItinerary}
            onGoExplore={() => setActiveTab('explore')}
            onOpenExport={() => setIsExportOpen(true)}
          />
        )}
      </main>

      {/* Destination Details Modal */}
      <DestinationModal
        place={selectedPlace}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        isSaved={selectedPlace ? savedPlaceIds.has(selectedPlace.id) : false}
        onToggleSave={handleToggleSave}
      />

      {/* Export & Print Travel Plan Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        items={itinerary}
      />

      {/* Editorial Footer */}
      <footer className="mt-20 border-t border-stone-200/80 bg-stone-900 text-stone-300 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs sm:text-sm">
          <div className="space-y-1.5 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="font-bold font-serif text-white text-base">TripWise</span>
              <span className="text-stone-400">• Smart Travel Planner</span>
            </div>
            <p className="text-stone-400">
              AWS Student Builder Group — VIT Chennai Full-Stack Recruitment Submission
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-stone-400">
            <span className="inline-flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              Live OpenStreetMap Nominatim
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Wikipedia REST API
            </span>
            <span>•</span>
            <span>SQLite Embedded Persistence</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
