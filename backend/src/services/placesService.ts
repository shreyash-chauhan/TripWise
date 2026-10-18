import type { Place, PlaceCategory, PlacesQueryParams } from '../types/index.js';
import { FEATURED_DESTINATIONS } from '../data/featuredPlaces.js';
import { db } from '../db/database.js';

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// Helper to check cache
function getFromCache(key: string): Place[] | null {
  try {
    const stmt = db.prepare('SELECT data, expires_at FROM api_cache WHERE cache_key = ?');
    const row = stmt.get(key) as { data: string; expires_at: number } | undefined;
    if (row && row.expires_at > Date.now()) {
      return JSON.parse(row.data);
    }
  } catch (err) {
    console.error('Cache read error:', err);
  }
  return null;
}

// Helper to write to cache
function writeToCache(key: string, data: Place[] | Place): void {
  try {
    const stmt = db.prepare(`
      INSERT INTO api_cache (cache_key, data, expires_at)
      VALUES (?, ?, ?)
      ON CONFLICT(cache_key) DO UPDATE SET data = excluded.data, expires_at = excluded.expires_at
    `);
    stmt.run(key, JSON.stringify(data), Date.now() + CACHE_TTL_MS);
  } catch (err) {
    console.error('Cache write error:', err);
  }
}

// Map OSM type/class to TripWise PlaceCategory
function mapOsmCategory(osmClass?: string, osmType?: string): PlaceCategory {
  if (!osmClass && !osmType) return 'Historical & Landmarks';

  const type = (osmType || '').toLowerCase();
  const cls = (osmClass || '').toLowerCase();

  if (cls === 'natural' || cls === 'leisure' || type.includes('park') || type.includes('forest') || type.includes('mountain') || type.includes('lake') || type.includes('valley')) {
    return 'Nature & Parks';
  }
  if (type.includes('beach') || type.includes('coast') || cls === 'waterway' || type.includes('island') || type.includes('cliff')) {
    return 'Coastal & Beaches';
  }
  if (cls === 'tourism' && (type === 'museum' || type === 'gallery' || type === 'artwork' || type === 'theatre')) {
    return 'Arts & Culture';
  }
  if (cls === 'amenity' && (type === 'restaurant' || type === 'cafe' || type === 'bar' || type === 'food_court')) {
    return 'Food & Dining';
  }
  if (cls === 'building' || type.includes('bridge') || type.includes('tower') || type.includes('palace') || type.includes('castle') || type.includes('skyscraper') || type.includes('monument')) {
    return 'Architecture';
  }
  return 'Historical & Landmarks';
}

// Category fallback imagery
const CATEGORY_FALLBACK_IMAGES: Record<PlaceCategory, string[]> = {
  'Historical & Landmarks': [
    'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=1200&q=80'
  ],
  'Nature & Parks': [
    'https://images.unsplash.com/photo-1503614472-8c93d56e92ce?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1534430480872-3498386e7856?auto=format&fit=crop&w=1200&q=80'
  ],
  'Arts & Culture': [
    'https://images.unsplash.com/photo-1543349689-9a4d426bee8e?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80'
  ],
  'Food & Dining': [
    'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80'
  ],
  'Coastal & Beaches': [
    'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&w=1200&q=80'
  ],
  'Architecture': [
    'https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80'
  ],
  'Modern & Urban': [
    'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=1200&q=80'
  ]
};

function getFallbackImage(category: PlaceCategory, seed: number = 0): string {
  const list = CATEGORY_FALLBACK_IMAGES[category] || CATEGORY_FALLBACK_IMAGES['Historical & Landmarks'];
  return list[seed % list.length];
}

// Fetch Wikipedia summary to get factual photo and description
async function fetchWikipediaSummary(searchTerm: string): Promise<{ description?: string; imageUrl?: string; externalUrl?: string } | null> {
  try {
    const cleanTerm = searchTerm.split(',')[0].trim();
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanTerm)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'TripWise/1.0 (travel-planner-app; educational-submission)',
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(4000)
    });
    if (!res.ok) return null;
    const data = (await res.json()) as any;
    return {
      description: data.extract || undefined,
      imageUrl: data.originalimage?.source || data.thumbnail?.source || undefined,
      externalUrl: data.content_urls?.desktop?.page || undefined
    };
  } catch {
    return null;
  }
}

// Search OpenStreetMap Nominatim
async function searchOsmPlaces(query: string): Promise<Place[]> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=jsonv2&addressdetails=1&extratags=1&namedetails=1&limit=12`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'TripWise/1.0 (travel-planner-app; recruitment-task)'
      },
      signal: AbortSignal.timeout(6000)
    });

    if (!res.ok) {
      console.warn(`[PlacesService] OSM Nominatim returned status ${res.status}`);
      return [];
    }

    const items = (await res.json()) as any[];
    if (!Array.isArray(items)) return [];

    const places: Place[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const name = item.namedetails?.name || item.name || item.display_name.split(',')[0];
      const category = mapOsmCategory(item.class, item.type);
      const address = item.address || {};
      const country = address.country || '';
      const city = address.city || address.town || address.village || address.state || '';
      const location = [city, country].filter(Boolean).join(', ') || item.display_name.split(',').slice(0, 3).join(', ');

      // Enriched description & image from Wikipedia if available
      let description = item.extratags?.description || item.display_name;
      let imageUrl = item.extratags?.image;
      let externalUrl = item.extratags?.website || `https://www.openstreetmap.org/${item.osm_type}/${item.osm_id}`;

      // Fetch Wikipedia summary if no direct image
      if (!imageUrl) {
        const wiki = await fetchWikipediaSummary(name);
        if (wiki) {
          if (wiki.description) description = wiki.description;
          if (wiki.imageUrl) imageUrl = wiki.imageUrl;
          if (wiki.externalUrl) externalUrl = wiki.externalUrl;
        }
      }

      if (!imageUrl) {
        imageUrl = getFallbackImage(category, i);
      }

      places.push({
        id: `osm-${item.osm_type}-${item.osm_id}`,
        name,
        location,
        country,
        city,
        category,
        description,
        imageUrl,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        address: item.display_name,
        tags: [category, item.type || item.class || 'point of interest'].filter(Boolean),
        externalUrl,
        source: 'osm'
      });
    }

    return places;
  } catch (err: any) {
    console.error('[PlacesService] OSM search failed:', err.message);
    return [];
  }
}

// Search Geoapify if API key exists
async function searchGeoapifyPlaces(query: string, apiKey: string): Promise<Place[]> {
  try {
    const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(query)}&format=json&apiKey=${apiKey}&limit=10`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return [];
    const data = (await res.json()) as any;
    if (!data.results || !Array.isArray(data.results)) return [];

    return data.results.map((r: any, idx: number) => {
      const category = mapOsmCategory(r.category, r.result_type);
      return {
        id: `geo-${r.place_id || idx}`,
        name: r.name || r.formatted?.split(',')[0] || query,
        location: [r.city, r.country].filter(Boolean).join(', ') || r.formatted,
        country: r.country,
        city: r.city,
        category,
        description: r.formatted,
        imageUrl: getFallbackImage(category, idx),
        lat: r.lat,
        lng: r.lon,
        address: r.formatted,
        tags: [category, r.result_type].filter(Boolean),
        source: 'geoapify'
      };
    });
  } catch {
    return [];
  }
}

export const placesService = {
  // Get all categories
  getCategories(): { name: string; count: number }[] {
    const categories: Record<string, number> = {
      'All': FEATURED_DESTINATIONS.length
    };

    FEATURED_DESTINATIONS.forEach(place => {
      categories[place.category] = (categories[place.category] || 0) + 1;
    });

    return Object.entries(categories).map(([name, count]) => ({ name, count }));
  },

  // Main search & discovery endpoint
  async search(params: PlacesQueryParams): Promise<{
    places: Place[];
    total: number;
    query?: string;
    category?: string;
    sort?: string;
  }> {
    const query = (params.query || '').trim();
    const category = params.category || 'All';
    const sort = params.sort || 'recommended';

    let results: Place[] = [];

    if (query) {
      const cacheKey = `search:${query.toLowerCase()}`;
      const cached = getFromCache(cacheKey);

      if (cached) {
        results = cached;
      } else {
        // Search Geoapify if configured, otherwise OSM Nominatim
        const geoapifyKey = process.env.GEOAPIFY_API_KEY;
        if (geoapifyKey) {
          const geoResults = await searchGeoapifyPlaces(query, geoapifyKey);
          if (geoResults.length > 0) {
            results = geoResults;
          }
        }

        if (results.length === 0) {
          // OpenStreetMap search
          const osmResults = await searchOsmPlaces(query);
          results = osmResults;
        }

        // Also search within featured places that match the query
        const queryLower = query.toLowerCase();
        const matchedFeatured = FEATURED_DESTINATIONS.filter(p =>
          p.name.toLowerCase().includes(queryLower) ||
          p.location.toLowerCase().includes(queryLower) ||
          (p.country && p.country.toLowerCase().includes(queryLower)) ||
          p.description.toLowerCase().includes(queryLower) ||
          (p.tags && p.tags.some(t => t.toLowerCase().includes(queryLower)))
        );

        // Merge without duplicates
        const seenNames = new Set(results.map(r => r.name.toLowerCase()));
        for (const feat of matchedFeatured) {
          if (!seenNames.has(feat.name.toLowerCase())) {
            results.unshift(feat);
            seenNames.add(feat.name.toLowerCase());
          }
        }

        // Cache results if we found any
        if (results.length > 0) {
          writeToCache(cacheKey, results);
        }
      }
    } else {
      // Default: explore featured destinations
      results = [...FEATURED_DESTINATIONS];
    }

    // Filter by Category
    if (category && category !== 'All') {
      results = results.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }

    // Sort results
    switch (sort) {
      case 'name-asc':
        results.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        results.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'rating-desc':
        results.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        break;
      case 'category':
        results.sort((a, b) => a.category.localeCompare(b.category));
        break;
      case 'recommended':
      default:
        // Featured places first, then high rating
        results.sort((a, b) => {
          if (a.source === 'featured' && b.source !== 'featured') return -1;
          if (b.source === 'featured' && a.source !== 'featured') return 1;
          return (b.rating ?? 4.5) - (a.rating ?? 4.5);
        });
        break;
    }

    return {
      places: results,
      total: results.length,
      query: query || undefined,
      category,
      sort
    };
  },

  // Get destination details by ID
  async getById(id: string): Promise<Place | null> {
    // 1. Look in featured places
    const featured = FEATURED_DESTINATIONS.find(p => p.id === id);
    if (featured) return featured;

    // 2. Check cache
    const cacheKey = `place:${id}`;
    const cached = getFromCache(cacheKey);
    if (cached && Array.isArray(cached) && cached[0]) return cached[0];

    // 3. If OSM ID, fetch details
    if (id.startsWith('osm-')) {
      const parts = id.split('-');
      const osmType = parts[1]; // N, W, R
      const osmId = parts[2];
      try {
        const osmTypeMap: Record<string, string> = { node: 'N', way: 'W', relation: 'R', N: 'N', W: 'W', R: 'R' };
        const shortType = osmTypeMap[osmType] || 'N';
        const url = `https://nominatim.openstreetmap.org/details?osmtype=${shortType}&osmid=${osmId}&format=json&addressdetails=1`;
        const res = await fetch(url, {
          headers: { 'User-Agent': 'TripWise/1.0 (travel-planner)' }
        });
        if (res.ok) {
          const item = (await res.json()) as any;
          const name = item.localname || item.names?.name || 'Destination Details';
          const category = mapOsmCategory(item.category, item.type);
          const wiki = await fetchWikipediaSummary(name);

          const place: Place = {
            id,
            name,
            location: item.addresstags?.city || item.addresstags?.country || 'Global Destination',
            country: item.addresstags?.country,
            city: item.addresstags?.city,
            category,
            description: wiki?.description || item.extratags?.description || 'A fascinating destination to explore with rich local heritage.',
            imageUrl: wiki?.imageUrl || getFallbackImage(category, 0),
            lat: parseFloat(item.centroid?.coordinates[1] || '0'),
            lng: parseFloat(item.centroid?.coordinates[0] || '0'),
            address: item.calculated_postcode ? `${name}, ${item.calculated_postcode}` : name,
            tags: [category, item.type].filter(Boolean),
            externalUrl: wiki?.externalUrl || `https://www.openstreetmap.org/${osmType}/${osmId}`,
            source: 'osm'
          };
          writeToCache(cacheKey, place as any);
          return place;
        }
      } catch (err) {
        console.error('Failed to fetch OSM details for', id, err);
      }
    }

    return null;
  }
};
