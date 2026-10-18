/**
 * Deliberate relevance-ranking engine for destination searches.
 * Evaluates exact matches, prefix matches, geographic context, and prominence.
 */

export interface CandidatePlace {
  id: string;
  name: string;
  nameEn?: string;
  location: string;
  country?: string;
  city?: string;
  category: string;
  description?: string;
  tags?: string[];
  lat?: number;
  lng?: number;
  importance?: number;
  isCapital?: boolean;
  population?: number;
  source?: string;
}

/**
 * Normalizes text for comparison: lowercases and strips diacritics / accents.
 */
export function normalizeText(text: string): string {
  return (text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Strips leading articles like "the ", "a ", "an " for landmark comparison.
 * E.g., "The Colosseum" -> "colosseum"
 */
export function stripArticles(text: string): string {
  return normalizeText(text).replace(/^(the|a|an)\s+/i, '').trim();
}

/**
 * Checks if a word exists as a discrete whole word inside a text string.
 * Prevents "rome" from matching inside "promenade" or "polychrome".
 */
export function containsWholeWord(text: string, word: string): boolean {
  if (!text || !word) return false;
  const normText = normalizeText(text);
  const normWord = normalizeText(word);
  if (!normText || !normWord) return false;

  // Exact match
  if (normText === normWord) return true;

  // Regex word boundary check
  const escaped = normWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i');
  return regex.test(normText);
}

/**
 * Checks if text starts with a word or prefix at a word boundary.
 */
export function startsWithWord(text: string, prefix: string): boolean {
  if (!text || !prefix) return false;
  const normText = normalizeText(text);
  const normPrefix = normalizeText(prefix);
  return normText.startsWith(normPrefix);
}

/**
 * Multilingual equivalence check (e.g. Rome in Italian is Roma).
 */
function areEquivalentNames(a: string, b: string): boolean {
  const normA = normalizeText(a);
  const normB = normalizeText(b);
  if (normA === normB) return true;
  if ((normA === 'roma' && normB === 'rome') || (normA === 'rome' && normB === 'roma')) return true;
  return false;
}

/**
 * Computes a deterministic relevance score for a candidate place given a search query.
 * Returns 0 or negative score if the place is not genuinely relevant to the query.
 */
export function calculateRelevanceScore(query: string, place: CandidatePlace): number {
  const normQuery = normalizeText(query);
  if (!normQuery) return 0;

  const normName = normalizeText(place.name);
  const cleanName = stripArticles(place.name);
  const normNameEn = normalizeText(place.nameEn || '');
  const normCity = normalizeText(place.city || '');
  const normLocation = normalizeText(place.location || '');
  const normCountry = normalizeText(place.country || '');

  let score = 0;
  let hasValidMatch = false;
  let isDirectNameMatch = false;

  // 1. Exact Name Match (or with stripped articles, e.g. "The Colosseum" matching "Colosseum")
  if (
    normName === normQuery ||
    cleanName === normQuery ||
    areEquivalentNames(normName, normQuery) ||
    (normNameEn && areEquivalentNames(normNameEn, normQuery))
  ) {
    score += 1000;
    hasValidMatch = true;
    isDirectNameMatch = true;
  }
  // 2. Strong Prefix Match on Name
  else if (startsWithWord(cleanName, normQuery) || startsWithWord(normName, normQuery)) {
    score += 650;
    hasValidMatch = true;
    isDirectNameMatch = true;
  }
  // 3. Whole Word Match in Name
  else if (containsWholeWord(normName, normQuery) || containsWholeWord(cleanName, normQuery)) {
    score += 450;
    hasValidMatch = true;
    isDirectNameMatch = true;
  }
  // 4. Multiword search: all query tokens present in place name
  else {
    const queryTokens = normQuery.split(/\s+/).filter(Boolean);
    if (queryTokens.length > 1) {
      const allTokensInName = queryTokens.every(t => containsWholeWord(normName, t) || startsWithWord(normName, t));
      if (allTokensInName) {
        score += 500;
        hasValidMatch = true;
        isDirectNameMatch = true;
      }
    }
  }

  // 5. Geographic Context Match
  // E.g., Landmark located in the queried city (e.g. "The Colosseum" when searching "Rome")
  // Only apply when the candidate itself is NOT already an exact match on name
  if (!isDirectNameMatch) {
    if (normCity === normQuery || areEquivalentNames(normCity, normQuery)) {
      score += 500;
      hasValidMatch = true;
    } else if (containsWholeWord(normCity, normQuery)) {
      score += 350;
      hasValidMatch = true;
    } else if (containsWholeWord(normLocation, normQuery)) {
      score += 300;
      hasValidMatch = true;
    } else if (normCountry === normQuery) {
      score += 200;
      hasValidMatch = true;
    }
  }

  // 6. Tags Match
  if (place.tags && place.tags.length > 0) {
    const matchedTag = place.tags.some(tag => {
      const normTag = normalizeText(tag);
      return normTag === normQuery || containsWholeWord(normTag, normQuery);
    });
    if (matchedTag) {
      score += 150;
      hasValidMatch = true;
    }
  }

  // Reject candidates that only match incidental substrings inside unrelated words
  if (!hasValidMatch) {
    return 0;
  }

  // 7. Prominence & Geographic Context Boost
  // Distinguishes major global metropolises from small towns/villages with the same name
  // E.g., Rome, Italy (importance 0.86, capital, pop 2.8M) vs Rome, Georgia (importance 0.53, pop 36K)
  if (place.importance !== undefined && place.importance > 0) {
    score += Math.round(place.importance * 300);
  }

  if (place.isCapital) {
    score += 100;
  }

  if (place.population && place.population > 500000) {
    score += 100;
  } else if (place.population && place.population > 50000) {
    score += 30;
  }

  // Quality boost for curated featured places when they are genuinely relevant
  if (place.source === 'featured') {
    score += 40;
  }

  return score;
}
