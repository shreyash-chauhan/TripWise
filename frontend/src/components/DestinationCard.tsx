import React, { useState } from 'react';
import { MapPin, Star, Plus, Check, ExternalLink, Globe } from 'lucide-react';
import type { Place } from '../types';

interface DestinationCardProps {
  place: Place;
  isSaved: boolean;
  onToggleSave: (place: Place) => void;
  onOpenDetails: (place: Place) => void;
}

export const DestinationCard: React.FC<DestinationCardProps> = ({
  place,
  isSaved,
  onToggleSave,
  onOpenDetails,
}) => {
  const [imgError, setImgError] = useState(false);

  // Fallback image based on category
  const fallbackImg =
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80';

  return (
    <article className="group bg-white rounded-2xl overflow-hidden border border-stone-200/90 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between h-full hover:-translate-y-1">
      {/* Top Image & Badge Container */}
      <div className="relative aspect-4/3 w-full overflow-hidden bg-stone-100">
        <img
          src={imgError ? fallbackImg : place.imageUrl || fallbackImg}
          alt={place.name}
          loading="lazy"
          onError={() => setImgError(true)}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Gradient Overlay for text contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10 opacity-60 pointer-events-none" />

        {/* Category Badge */}
        <div className="absolute top-3 left-3 z-10">
          <span className="px-2.5 py-1 text-[11px] font-semibold tracking-wide bg-stone-900/80 backdrop-blur-md text-stone-100 rounded-full border border-white/20 shadow-xs">
            {place.category}
          </span>
        </div>

        {/* Rating Badge (if available) */}
        {place.rating !== undefined && place.rating > 0 && (
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2 py-1 text-xs font-bold bg-white/95 backdrop-blur-md text-stone-900 rounded-full shadow-xs">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
            <span>{place.rating.toFixed(1)}</span>
          </div>
        )}

        {/* Source indicator */}
        {place.source === 'osm' && (
          <div className="absolute bottom-2.5 left-3 z-10 flex items-center gap-1 text-[10px] font-medium text-white/90 bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded-md">
            <Globe className="w-3 h-3 text-emerald-300" />
            <span>OSM Verified</span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Location */}
          <div className="flex items-center gap-1 text-xs font-medium text-stone-500 mb-1">
            <MapPin className="w-3.5 h-3.5 text-[#0F382C] shrink-0" />
            <span className="truncate">{place.location || place.address || 'Global Destination'}</span>
          </div>

          {/* Title */}
          <h3
            onClick={() => onOpenDetails(place)}
            className="text-lg font-bold text-stone-900 font-serif leading-snug hover:text-[#0F382C] cursor-pointer transition-colors line-clamp-1"
            title={place.name}
          >
            {place.name}
          </h3>

          {/* Description Snippet */}
          <p className="mt-1.5 text-xs sm:text-sm text-stone-600 line-clamp-2 leading-relaxed">
            {place.description || 'Discover the beauty and cultural atmosphere of this remarkable destination.'}
          </p>
        </div>

        {/* Actions Footer */}
        <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
          {/* Details Button */}
          <button
            onClick={() => onOpenDetails(place)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-stone-600 hover:text-stone-950 py-1.5 px-2.5 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <span>Details</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          {/* Add to Trip Action */}
          <button
            onClick={() => onToggleSave(place)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer shadow-xs ${
              isSaved
                ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                : 'bg-[#0F382C] text-white hover:bg-[#164E3E]'
            }`}
          >
            {isSaved ? (
              <>
                <Check className="w-3.5 h-3.5 text-amber-800" />
                <span>In Itinerary</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>Add to Trip</span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
};
