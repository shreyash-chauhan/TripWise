import type { Place, PlaceCategory, PlacesQueryParams } from '../types/index.js';
import { FEATURED_DESTINATIONS } from '../data/featuredPlaces.js';
import { db } from '../db/database.js';
import { calculateRelevanceScore, type CandidatePlace } from './rankingService.js';
import { deduplicatePlaces } from './dedupService.js';

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
  if (cls === 'place' || cls === 'boundary' || type === 'city' || type === 'administrative' || type === 'town' || type === 'suburb' || type === 'locality') {
    return 'Modern & Urban';
  }
  return 'Historical & Landmarks';
}

/**
 * Visually neutral, non-misleading fallback imagery.
 * CRITICAL: NEVER include identifiable iconic world monuments (such as the Taj Mahal or Colosseum)
 * in generic fallback arrays to prevent attaching them to unrelated destinations.
 */
const CATEGORY_FALLBACK_IMAGES: Record<PlaceCategory, string[]> = {
  'Historical & Landmarks': [
    'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=1200&q=80', // Historic cobblestone street
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80', // Scenic travel road
    'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=80'  // Atmospheric historic cityscape
  ],
  'Nature & Parks': [
    'https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=1200&q=80', // Mountain landscape
    'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1200&q=80', // Forest canopy
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80'  // Misty wilderness
  ],
  'Arts & Culture': [
    'https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=1200&q=80', // Museum gallery interior
    'https://images.unsplash.com/photo-1508997449629-303059a039c0?auto=format&fit=crop&w=1200&q=80', // Exhibition hall
    'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=1200&q=80'  // Classical sculpture gallery
  ],
  'Food & Dining': [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80', // Bistro table
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80'  // Culinary restaurant setting
  ],
  'Coastal & Beaches': [
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80', // Ocean coastline
    'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=80'  // Sea horizon
  ],
  'Architecture': [
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80', // Modern facade
    'https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=1200&q=80'  // Geometric architecture
  ],
  'Modern & Urban': [
    'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?auto=format&fit=crop&w=1200&q=80', // City skyline
    'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=1200&q=80'  // Urban boulevard
  ]
};

export function getFallbackImage(category: PlaceCategory, seed: number = 0): string {
  const list = CATEGORY_FALLBACK_IMAGES[category] || CATEGORY_FALLBACK_IMAGES['Historical & Landmarks'];
  return list[Math.abs(seed) % list.length];
}

/**
 * Robust Wikipedia summary fetcher with disambiguation filtering and geographic verification.
 */
async function fetchWikipediaSummary(
  placeName: string,
  englishName?: string,
  wikiTag?: string,
  expectedCountry?: string
): Promise<{ description?: string; imageUrl?: string; externalUrl?: string } | null> {
  // Determine candidate article title
  let articleTitle = '';

  if (wikiTag && wikiTag.startsWith('en:')) {
    articleTitle = wikiTag.replace(/^en:/, '').trim();
  } else if (englishName && englishName.trim()) {
    articleTitle = englishName.split(',')[0].trim();
  } else if (placeName && placeName.trim()) {
    articleTitle = placeName.split(',')[0].trim();
  }

  if (!articleTitle) return null;

  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(articleTitle)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'TripWise/1.0 (travel-planner-app; recruitment-task)',
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(3500)
    });

    if (!res.ok) return null;
    const data = (await res.json()) as any;

    // 1. REJECT Disambiguation Pages
    if (
      data.type === 'disambiguation' ||
      data.description?.toLowerCase().includes('disambiguation') ||
      data.extract?.toLowerCase().includes('may refer to:') ||
      data.extract?.toLowerCase().startsWith('may refer to')
    ) {
      return null;
    }

    const extract = (data.extract || '').trim();
    if (!extract) return null;

    // 2. Geographic Consistency Verification
    // Prevent attaching Italy/Rome summaries to places in Australia, United States, etc.
    if (expectedCountry) {
      const lowerCountry = expectedCountry.toLowerCase();
      const lowerExtract = extract.toLowerCase();
      if (lowerCountry !== 'italy' && lowerCountry !== 'italia') {
        if (
          lowerExtract.includes('in the centre of the city of rome') ||
          lowerExtract.includes('capital and largest city of italy') ||
          lowerExtract.includes('in lazio, italy') ||
          lowerExtract.includes('in rome, italy') ||
          lowerExtract.includes('capital of italy')
        ) {
          return null;
        }
      }
    }

    return {
      description: extract,
      imageUrl: data.originalimage?.source || data.thumbnail?.source || undefined,
      externalUrl: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(articleTitle)}`
    };
  } catch {
    return null;
  }
}

/**
 * Searches OpenStreetMap Nominatim with rich namedetails and address details.
 */
async function searchOsmPlaces(query: string): Promise<Place[]> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=jsonv2&addressdetails=1&extratags=1&namedetails=1&limit=15`;
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

    // Parallel resolution with Promise.all
    const placePromises = items.map(async (item: any, idx: number): Promise<Place | null> => {
      // Prefer English name if available from namedetails
      const nameEn = item.namedetails?.['name:en'] || item.namedetails?.name;
      const primaryName = nameEn || item.name || item.display_name.split(',')[0];
      const category = mapOsmCategory(item.class, item.type);

      const address = item.address || {};
      const country = address.country || '';
      const state = address.state || '';
      const city = address.city || address.town || address.village || address.municipality || '';
      const location = [city || primaryName, state, country].filter(Boolean).join(', ') || item.display_name.split(',').slice(0, 3).join(', ');

      const wikiTag = item.extratags?.wikipedia;
      let description = item.extratags?.description;
      let imageUrl = item.extratags?.image;
      let externalUrl = item.extratags?.website || `https://www.openstreetmap.org/${item.osm_type}/${item.osm_id}`;

      // Fetch verified Wikipedia summary
      const wiki = await fetchWikipediaSummary(item.name || primaryName, nameEn, wikiTag, country);
      if (wiki) {
        if (wiki.description) description = wiki.description;
        if (wiki.imageUrl) imageUrl = wiki.imageUrl;
        if (wiki.externalUrl) externalUrl = wiki.externalUrl;
      }

      // Neutral fallback description if none available
      if (!description) {
        description = location ? `A notable destination located in ${location}. Explore this place on the map.` : 'Explore this destination on the map.';
      }

      // Safe neutral fallback image
      if (!imageUrl) {
        imageUrl = getFallbackImage(category, idx);
      }

      // Importance & Prominence metadata
      const importance = parseFloat(item.importance) || 0.4;
      const isCapital = item.extratags?.capital === 'yes' || item.extratags?.is_capital === 'country';
      const population = parseInt(item.extratags?.population || '0', 10);

      const place: Place & { importance?: number; isCapital?: boolean; population?: number } = {
        id: `osm-${item.osm_type}-${item.osm_id}`,
        name: primaryName,
        location,
        country,
        city,
        category,
        description,
        imageUrl,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        address: item.display_name,
        tags: [category, item.type || item.class || 'destination'].filter(Boolean),
        externalUrl,
        source: 'osm',
        importance,
        isCapital,
        population
      };

      return place;
    });

    const places = (await Promise.all(placePromises)).filter(Boolean) as Place[];
    return places;
  } catch (err: any) {
    console.error('[PlacesService] OSM search failed:', err.message);
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
      // Robust cache key including query, category, and sort to prevent contamination
      const cacheKey = `search:${query.toLowerCase()}:${category.toLowerCase()}:${sort}`;
      const cached = getFromCache(cacheKey);

      if (cached) {
        results = cached;
      } else {
        // 1. Fetch OSM results
        const osmResults = await searchOsmPlaces(query);

        // 2. Score and filter FEATURED_DESTINATIONS using deliberate relevance ranking
        // Only include featured places that actually match the query (prevents Copacabana or Florence matching "Rome")
        const candidateFeatured = FEATURED_DESTINATIONS.map(p => {
          const score = calculateRelevanceScore(query, p as CandidatePlace);
          return { place: p, score };
        }).filter(item => item.score > 0);

        // 3. Score OSM results
        const candidateOsm = osmResults.map(p => {
          const score = calculateRelevanceScore(query, p as any);
          return { place: p, score };
        }).filter(item => item.score > 0);

        // 4. Combine all relevant candidates
        const allScored = [...candidateFeatured, ...candidateOsm];

        // 5. Deduplicate near-identical entries while preserving distinct genuine landmarks
        const placesOnly = allScored.map(s => s.place);
        const dedupedPlaces = deduplicatePlaces(placesOnly);

        // Re-associate scores with deduped places
        const scoredMap = new Map<string, number>();
        allScored.forEach(s => scoredMap.set(s.place.id, s.score));

        // 6. Deliberate Relevance Sorting (or user-chosen sort)
        results = dedupedPlaces;

        if (sort === 'recommended') {
          // Sort strictly by relevance score descending
          results.sort((a, b) => {
            const scoreA = scoredMap.get(a.id) || 0;
            const scoreB = scoredMap.get(b.id) || 0;
            if (scoreB !== scoreA) {
              return scoreB - scoreA;
            }
            // Secondary tie-breaker: rating or featured
            return (b.rating ?? 4.5) - (a.rating ?? 4.5);
          });
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

    // Sort results if user specified non-recommended sort
    if (sort !== 'recommended') {
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
      }
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
          const wiki = await fetchWikipediaSummary(name, item.names?.['name:en'], item.extratags?.wikipedia);

          const place: Place = {
            id,
            name,
            location: item.addresstags?.city || item.addresstags?.country || 'Global Destination',
            country: item.addresstags?.country,
            city: item.addresstags?.city,
            category,
            description: wiki?.description || item.extratags?.description || 'A notable destination. Explore this place on the map.',
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
