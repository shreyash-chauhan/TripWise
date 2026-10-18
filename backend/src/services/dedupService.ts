import type { Place } from '../types/index.js';
import { normalizeText } from './rankingService.js';

/**
 * Calculates distance between two coordinates in kilometers using Haversine formula.
 */
export function getDistanceKm(lat1?: number, lng1?: number, lat2?: number, lng2?: number): number {
  if (lat1 === undefined || lng1 === undefined || lat2 === undefined || lng2 === undefined) {
    return Infinity;
  }
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Extracts a normalized core name, stripping common administrative prefixes/suffixes.
 * E.g., "City of Rome" -> "rome", "Roma Capitale" -> "roma", "Comune di Roma" -> "roma".
 */
export function getBaseCityName(name: string): string {
  let clean = normalizeText(name);
  clean = clean.replace(/^(city of|town of|village of|municipality of|comune di)\s+/i, '');
  clean = clean.replace(/\s+(capitale|metropolitan city|municipality|district)$/i, '');
  return clean.trim();
}

/**
 * Deduplicates destination results:
 * 1. Deduplicates exact IDs.
 * 2. Merges duplicate administrative representations of the same city (e.g. Roma vs Roma Capitale).
 * 3. Preserves different genuine landmarks located in the same city (e.g. Colosseum vs Rome).
 */
export function deduplicatePlaces(places: Place[]): Place[] {
  const result: Place[] = [];
  const seenIds = new Set<string>();

  for (const place of places) {
    if (!place || !place.id) continue;

    // 1. Exact ID check
    if (seenIds.has(place.id)) {
      continue;
    }

    const baseName = getBaseCityName(place.name);
    const country = normalizeText(place.country || '');

    // 2. Near-identical administrative representation check
    const isDuplicate = result.some(existing => {
      // If one is a landmark and the other is a city, do not deduplicate!
      const existingBase = getBaseCityName(existing.name);
      const existingCountry = normalizeText(existing.country || '');

      // Check if both represent the same city/region
      if (baseName === existingBase && (country === existingCountry || !country || !existingCountry)) {
        // Check geographic proximity
        const dist = getDistanceKm(place.lat, place.lng, existing.lat, existing.lng);
        if (dist < 30) {
          return true; // Duplicate representation of the same city
        }
      }

      // Check for exact same name and location
      if (normalizeText(place.name) === normalizeText(existing.name) && normalizeText(place.location) === normalizeText(existing.location)) {
        return true;
      }

      return false;
    });

    if (!isDuplicate) {
      seenIds.add(place.id);
      result.push(place);
    }
  }

  return result;
}
