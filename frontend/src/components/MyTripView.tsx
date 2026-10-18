import React, { useState } from 'react';
import {
  Trash2,
  MapPin,
  Calendar,
  FileText,
  ExternalLink,
  Download,
  Compass,
  Check,
  Edit2,
  ArrowRight
} from 'lucide-react';
import type { ItineraryItem } from '../types';

interface MyTripViewProps {
  items: ItineraryItem[];
  onRemoveItem: (id: number) => void;
  onUpdateItem: (id: number, fields: { notes?: string; visitDate?: string }) => void;
  onClearAll: () => void;
  onGoExplore: () => void;
  onOpenExport: () => void;
}

export const MyTripView: React.FC<MyTripViewProps> = ({
  items,
  onRemoveItem,
  onUpdateItem,
  onClearAll,
  onGoExplore,
  onOpenExport,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editNotes, setEditNotes] = useState<string>('');
  const [editDate, setEditDate] = useState<string>('');

  const fallbackImg =
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80';

  // Categories from saved items
  const categories = ['All', ...Array.from(new Set(items.map((i) => i.category)))];

  const filteredItems =
    selectedCategory === 'All'
      ? items
      : items.filter((i) => i.category === selectedCategory);

  const startEditing = (item: ItineraryItem) => {
    setEditingId(item.id);
    setEditNotes(item.notes || '');
    setEditDate(item.visitDate || '');
  };

  const saveEditing = (id: number) => {
    onUpdateItem(id, { notes: editNotes, visitDate: editDate });
    setEditingId(null);
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-[#0F382C]/10 flex items-center justify-center text-[#0F382C] border border-[#0F382C]/20 shadow-xs">
          <Compass className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-bold font-serif text-stone-900">Your itinerary is empty</h2>
          <p className="max-w-md mx-auto text-stone-600 text-sm sm:text-base leading-relaxed">
            You haven’t added any places to your trip yet. Explore top-rated monuments, cultural landmarks, and nature parks to begin building your custom journey.
          </p>
        </div>

        <button
          onClick={onGoExplore}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#0F382C] hover:bg-[#164E3E] text-white text-sm font-semibold rounded-2xl shadow-lg shadow-emerald-950/20 transition-all cursor-pointer"
        >
          <span>Explore Destinations</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl font-bold font-serif text-stone-900 tracking-tight">
              My Personal Itinerary
            </h1>
            <span className="px-3 py-1 text-xs font-bold bg-[#0F382C] text-white rounded-full">
              {items.length} {items.length === 1 ? 'place' : 'places'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Persisted securely in your SQLite database. Survives refreshes and application restarts.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={onOpenExport}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl transition-colors cursor-pointer border border-stone-200/80"
          >
            <Download className="w-4 h-4 text-stone-600" />
            <span>Export / Print</span>
          </button>

          <button
            onClick={onClearAll}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear All</span>
          </button>
        </div>
      </div>

      {/* Category Filter Chips for saved items */}
      {categories.length > 2 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-bold text-stone-400 uppercase tracking-wider mr-1">Filter:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors border cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#0F382C] text-white border-[#0F382C]'
                  : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Itinerary Items List */}
      <div className="space-y-4">
        {filteredItems.map((item, index) => {
          const isEditing = editingId === item.id;
          const hasCoords = item.lat !== undefined && item.lng !== undefined;
          const mapUrl = hasCoords
            ? `https://www.google.com/maps/search/?api=1&query=${item.lat},${item.lng}`
            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.name + ' ' + item.location)}`;

          return (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-stone-200/90 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col md:flex-row"
            >
              {/* Thumbnail Image */}
              <div className="relative md:w-64 h-48 md:h-auto shrink-0 bg-stone-100 overflow-hidden">
                <img
                  src={item.imageUrl || fallbackImg}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-3 left-3 px-2.5 py-0.5 text-[11px] font-semibold bg-stone-900/80 text-white rounded-full backdrop-blur-xs">
                  #{index + 1}
                </span>
              </div>

              {/* Card Details & Editable Notes */}
              <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {item.category}
                    </span>

                    <a
                      href={mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-stone-900 font-medium"
                    >
                      <MapPin className="w-3.5 h-3.5 text-[#0F382C]" />
                      <span>Maps</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <h3 className="text-xl font-bold font-serif text-stone-900">{item.name}</h3>

                  <p className="text-xs text-stone-500 mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-stone-400" />
                    <span>{item.location}</span>
                  </p>

                  {item.description && (
                    <p className="mt-2 text-xs sm:text-sm text-stone-600 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>

                {/* Planner Metadata (Date & Notes) */}
                <div className="pt-3 border-t border-stone-100 space-y-2">
                  {isEditing ? (
                    /* Inline Editing Mode */
                    <div className="space-y-3 bg-stone-50 p-3.5 rounded-xl border border-stone-200">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                            Visit Date
                          </label>
                          <input
                            type="date"
                            value={editDate}
                            onChange={(e) => setEditDate(e.target.value)}
                            className="w-full text-xs bg-white border border-stone-200 rounded-lg px-2.5 py-1.5"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                            Trip Notes
                          </label>
                          <input
                            type="text"
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            placeholder="Add personal notes or tips..."
                            className="w-full text-xs bg-white border border-stone-200 rounded-lg px-2.5 py-1.5"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1 text-xs font-semibold text-stone-600 hover:bg-stone-200 rounded-lg"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => saveEditing(item.id)}
                          className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-[#0F382C] text-white rounded-lg hover:bg-[#164E3E]"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Save Changes</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Display Mode */
                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex flex-wrap items-center gap-3">
                        {item.visitDate ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200/80 rounded-lg font-medium">
                            <Calendar className="w-3.5 h-3.5 text-amber-700" />
                            <span>Planned: {item.visitDate}</span>
                          </div>
                        ) : (
                          <span className="text-stone-400 italic">No date scheduled</span>
                        )}

                        {item.notes ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-stone-100 text-stone-700 rounded-lg">
                            <FileText className="w-3.5 h-3.5 text-stone-500" />
                            <span className="max-w-xs truncate">{item.notes}</span>
                          </div>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEditing(item)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-stone-600 hover:text-stone-900 p-1.5 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                          title="Edit visit date & notes"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => onRemoveItem(item.id)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-800 p-1.5 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Remove from itinerary"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
