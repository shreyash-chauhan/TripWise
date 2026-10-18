import type { Place, ItineraryItem, SortOption } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const api = {
  async getPlaces(params: {
    query?: string;
    category?: string;
    sort?: SortOption;
  }): Promise<{ places: Place[]; total: number }> {
    const url = new URL(`${window.location.origin}${API_BASE}/places`);
    if (params.query) url.searchParams.set('query', params.query);
    if (params.category && params.category !== 'All') url.searchParams.set('category', params.category);
    if (params.sort) url.searchParams.set('sort', params.sort);

    const res = await fetch(url.toString(), {
      headers: { 'Accept': 'application/json' },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to fetch places (${res.status})`);
    }

    const json = await res.json();
    return {
      places: json.data || [],
      total: json.meta?.total || 0,
    };
  },

  async getPlaceById(id: string): Promise<Place> {
    const res = await fetch(`${API_BASE}/places/${encodeURIComponent(id)}`);
    if (!res.ok) {
      throw new Error('Destination details not found');
    }
    const json = await res.json();
    return json.data;
  },

  async getCategories(): Promise<{ name: string; count: number }[]> {
    const res = await fetch(`${API_BASE}/places/categories`);
    if (!res.ok) {
      return [];
    }
    const json = await res.json();
    return json.data || [];
  },

  async getItinerary(): Promise<ItineraryItem[]> {
    const res = await fetch(`${API_BASE}/itinerary`);
    if (!res.ok) {
      throw new Error('Failed to load itinerary');
    }
    const json = await res.json();
    return json.data || [];
  },

  async addToItinerary(place: Place, notes?: string, visitDate?: string): Promise<ItineraryItem> {
    const res = await fetch(`${API_BASE}/itinerary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        placeId: place.id,
        name: place.name,
        location: place.location,
        category: place.category,
        imageUrl: place.imageUrl,
        description: place.description,
        lat: place.lat,
        lng: place.lng,
        notes: notes || '',
        visitDate: visitDate || '',
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to add place to itinerary');
    }

    const json = await res.json();
    return json.data;
  },

  async updateItineraryItem(id: number, fields: { notes?: string; visitDate?: string }): Promise<ItineraryItem> {
    const res = await fetch(`${API_BASE}/itinerary/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    });

    if (!res.ok) {
      throw new Error('Failed to update itinerary item');
    }

    const json = await res.json();
    return json.data;
  },

  async removeFromItinerary(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/itinerary/${id}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      throw new Error('Failed to remove item from itinerary');
    }
  },

  async removeFromItineraryByPlaceId(placeId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/itinerary/place/${encodeURIComponent(placeId)}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      throw new Error('Failed to remove item from itinerary');
    }
  },

  async clearItinerary(): Promise<void> {
    const res = await fetch(`${API_BASE}/itinerary`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      throw new Error('Failed to clear itinerary');
    }
  },
};
