export type PlaceCategory =
  | 'Historical & Landmarks'
  | 'Nature & Parks'
  | 'Arts & Culture'
  | 'Food & Dining'
  | 'Coastal & Beaches'
  | 'Architecture'
  | 'Modern & Urban'
  | 'All';

export interface Place {
  id: string;
  name: string;
  location: string;
  country?: string;
  city?: string;
  category: string;
  description: string;
  imageUrl: string;
  rating?: number;
  lat: number;
  lng: number;
  address?: string;
  tags?: string[];
  externalUrl?: string;
  source: 'osm' | 'wikipedia' | 'geoapify' | 'opentripmap' | 'featured';
}

export interface ItineraryItem {
  id: number;
  placeId: string;
  name: string;
  location: string;
  category: string;
  imageUrl: string;
  description?: string;
  lat?: number;
  lng?: number;
  notes?: string;
  visitDate?: string;
  createdAt: string;
  updatedAt: string;
}

export type SortOption =
  | 'recommended'
  | 'rating-desc'
  | 'name-asc'
  | 'name-desc'
  | 'category';

export interface FilterState {
  query: string;
  category: string;
  sort: SortOption;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}
