import React, { useEffect, useState } from 'react';
import {
  X,
  MapPin,
  Star,
  ExternalLink,
  Plus,
  Check,
  Calendar,
  Map,
  Compass,
  Globe2
} from 'lucide-react';
import type { Place } from '../types';

interface DestinationModalProps {
  place: Place | null;
  isOpen: boolean;
  onClose: () => void;
  isSaved: boolean;
  onToggleSave: (place: Place, notes?: string, visitDate?: string) => void;
}

export const DestinationModal: React.FC<DestinationModalProps> = ({
  place,
  isOpen,
  onClose,
  isSaved,
  onToggleSave,
}) => {
  const [imgError, setImgError] = useState(false);
  const [personalNotes, setPersonalNotes] = useState('');
  const [visitDate, setVisitDate] = useState('');

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !place) return null;

  const fallbackImg =
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80';

  const hasCoords = place.lat !== undefined && place.lng !== undefined && !isNaN(place.lat) && !isNaN(place.lng);
  const googleMapsUrl = hasCoords
    ? `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ' ' + (place.location || ''))}`;

  const osmUrl = hasCoords
    ? `https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lng}#map=15/${place.lat}/${place.lng}`
    : `https://www.openstreetmap.org/search?query=${encodeURIComponent(place.name)}`;

  const handleSaveWithDetails = () => {
    onToggleSave(place, personalNotes, visitDate);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div
        className="relative bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-stone-200 transition-all max-h-[92vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-headline"
      >
        {/* Sticky Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-transform hover:scale-105 cursor-pointer backdrop-blur-xs"
          aria-label="Close details"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Modal Content */}
        <div className="overflow-y-auto">
          {/* Hero Image Container */}
          <div className="relative aspect-16/9 sm:aspect-21/9 w-full bg-stone-100 overflow-hidden">
            <img
              src={imgError ? fallbackImg : place.imageUrl || fallbackImg}
              alt={place.name}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

            {/* Badges on image */}
            <div className="absolute bottom-4 left-5 right-5 flex flex-wrap items-center justify-between gap-2 text-white">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 text-xs font-semibold bg-[#0F382C] text-white rounded-full border border-emerald-400/30">
                  {place.category}
                </span>
                {place.rating !== undefined && place.rating > 0 && (
                  <span className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-white text-stone-900 rounded-full">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                    <span>{place.rating.toFixed(1)}</span>
                  </span>
                )}
              </div>

              {place.source && (
                <span className="text-[11px] font-medium text-stone-200 bg-white/20 backdrop-blur-sm px-2.5 py-0.5 rounded-full">
                  Source: {place.source.toUpperCase()}
                </span>
              )}
            </div>
          </div>

          {/* Details Body */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Header Title & Location */}
            <div>
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[#0F382C] mb-1.5">
                <MapPin className="w-4 h-4 shrink-0" />
                <span>{place.location || 'Global Destination'}</span>
                {place.country && <span className="text-stone-400">• {place.country}</span>}
              </div>

              <h2
                id="modal-headline"
                className="text-2xl sm:text-3xl font-bold font-serif text-stone-900 tracking-tight"
              >
                {place.name}
              </h2>

              {place.address && place.address !== place.name && (
                <p className="mt-1 text-xs text-stone-500 italic">
                  Address: {place.address}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                About this destination
              </h3>
              <p className="text-stone-700 leading-relaxed text-sm sm:text-base">
                {place.description ||
                  'No detailed description is available from the places registry for this location.'}
              </p>
            </div>

            {/* Geographic Coordinates & External Map Links */}
            <div className="bg-stone-50 rounded-2xl p-4 sm:p-5 border border-stone-200/80 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-[#0F382C]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
                    Geographic Coordinates
                  </span>
                </div>
                {hasCoords && (
                  <span className="text-xs font-mono text-stone-600 bg-white border border-stone-200 px-2.5 py-1 rounded-md">
                    {place.lat.toFixed(4)}° N, {place.lng.toFixed(4)}° E
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-white hover:bg-stone-100 text-stone-800 rounded-xl border border-stone-200 transition-colors shadow-2xs"
                >
                  <Map className="w-3.5 h-3.5 text-rose-600" />
                  <span>Open in Google Maps</span>
                  <ExternalLink className="w-3 h-3 text-stone-400" />
                </a>

                <a
                  href={osmUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-white hover:bg-stone-100 text-stone-800 rounded-xl border border-stone-200 transition-colors shadow-2xs"
                >
                  <Globe2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>OpenStreetMap Registry</span>
                  <ExternalLink className="w-3 h-3 text-stone-400" />
                </a>

                {place.externalUrl && (
                  <a
                    href={place.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-white hover:bg-stone-100 text-stone-800 rounded-xl border border-stone-200 transition-colors shadow-2xs"
                  >
                    <span>Wikipedia Reference</span>
                    <ExternalLink className="w-3 h-3 text-stone-400" />
                  </a>
                )}
              </div>
            </div>

            {/* Tags / Highlights */}
            {place.tags && place.tags.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                  Tags & Attributes
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {place.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 text-xs font-medium bg-stone-100 text-stone-700 rounded-lg border border-stone-200/80"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Optional Trip Planner Inputs (Notes & Planned Date) */}
            <div className="p-4 sm:p-5 bg-amber-50/60 rounded-2xl border border-amber-200/60 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900 uppercase tracking-wider">
                <Calendar className="w-4 h-4 text-amber-700" />
                <span>Personal Itinerary Planner</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Planned Visit Date
                  </label>
                  <input
                    type="date"
                    value={visitDate}
                    onChange={(e) => setVisitDate(e.target.value)}
                    className="w-full text-xs sm:text-sm bg-white border border-stone-200 rounded-xl px-3 py-2 text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Trip Notes (optional)
                  </label>
                  <input
                    type="text"
                    value={personalNotes}
                    onChange={(e) => setPersonalNotes(e.target.value)}
                    placeholder="e.g. Sunrise view, book entry pass"
                    className="w-full text-xs sm:text-sm bg-white border border-stone-200 rounded-xl px-3 py-2 text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="p-4 sm:p-6 bg-stone-50 border-t border-stone-200/80 flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 rounded-xl transition-colors cursor-pointer"
          >
            Back to Explore
          </button>

          <button
            onClick={handleSaveWithDetails}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer shadow-md ${
              isSaved
                ? 'bg-amber-100 text-amber-950 border border-amber-300 hover:bg-amber-200'
                : 'bg-[#0F382C] text-white hover:bg-[#164E3E]'
            }`}
          >
            {isSaved ? (
              <>
                <Check className="w-4 h-4 text-amber-900" />
                <span>Remove from Itinerary</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Add to My Trip</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
