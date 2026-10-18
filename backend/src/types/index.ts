export type PlaceCategory =
  | 'Historical & Landmarks'
  | 'Nature & Parks'
  | 'Arts & Culture'
  | 'Food & Dining'
  | 'Coastal & Beaches'
  | 'Architecture'
  | 'Modern & Urban';

export interface Place {
  id: string;
  name: string;
  location: string;
  country?: string;
  city?: string;
  category: PlaceCategory;
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

export interface PlacesQueryParams {
  query?: string;
  category?: string;
  sort?: 'recommended' | 'name-asc' | 'name-desc' | 'rating-desc' | 'category';
  limit?: number;
  page?: number;
}
