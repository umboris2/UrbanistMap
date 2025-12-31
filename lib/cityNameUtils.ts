/**
 * Generalized city name normalization and matching utilities
 * Handles variations automatically without hardcoded lists
 */

/**
 * Normalize city name for matching - generalized approach
 * Handles:
 * - Accents and diacritics (é → e, ø → o, etc.)
 * - Hyphenated suffixes (Tel Aviv-Yafo → Tel Aviv)
 * - Common administrative suffixes
 * - Case differences
 * - Japanese/Chinese characters (normalized via Unicode)
 */
const translationMap: Record<string, string> = {
  // European variants
  kobenhavn: 'copenhagen',
  köbenhavn: 'copenhagen',
  københavn: 'copenhagen',
  roma: 'rome',
  milano: 'milan',
  warszawa: 'warsaw',
  warszaw: 'warsaw',
  lisboa: 'lisbon',
  münchen: 'munich',
  munchen: 'munich',
  wien: 'vienna',
  praha: 'prague',
  firenze: 'florence',
  florencija: 'florence',
  'praha 1': 'prague',
  riyad: 'riyadh',
  arriyad: 'riyadh',
  'ar riyad': 'riyadh',
  'الرياض': 'riyadh',
  venezia: 'venice',
  venedig: 'venice',
  venise: 'venice',
  venecia: 'venice',
  samarqand: 'samarkand',
  samarcanda: 'samarkand',
  самарканд: 'samarkand',

  // Asia
  '東京': 'tokyo',
  '東京都': 'tokyo',
};

const canonicalDisplayMap: Record<string, string> = {
  copenhagen: 'Copenhagen',
  rome: 'Rome',
  milan: 'Milan',
  warsaw: 'Warsaw',
  lisbon: 'Lisbon',
  munich: 'Munich',
  vienna: 'Vienna',
  prague: 'Prague',
  florence: 'Florence',
  riyadh: 'Riyadh',
  venice: 'Venice',
  samarkand: 'Samarkand',
  tokyo: 'Tokyo',
  'tel aviv': 'Tel Aviv',
};

function titleCase(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function normalizeCityName(name: string): string {
  if (!name) return '';
  
  let normalized = name
    .toLowerCase()
    .normalize('NFD') // Decompose characters (é → e + ́)
    .replace(/[\u0300-\u036f]/g, '') // Remove combining diacritical marks
    .trim();
  
  // Remove common administrative/district suffixes that Mapbox might add
  // Pattern: "City Name - Suffix" or "City Name-Suffix"
  const suffixPatterns = [
    /\s*-\s*(yafo|district|county|prefecture|province|region|oblast|governorate|municipality).*$/i,
    /\s*-\s*.*$/i, // Remove any hyphenated suffix as fallback
  ];
  
  for (const pattern of suffixPatterns) {
    normalized = normalized.replace(pattern, '');
  }
  
  // Remove common prefixes
  normalized = normalized.replace(/^(the|la|le|les|el|los|las)\s+/i, '');
  
  // Normalize whitespace
  normalized = normalized.replace(/\s+/g, ' ').trim();

  // Map well-known local/alternate spellings to their English equivalents
  if (translationMap[normalized]) {
    normalized = translationMap[normalized];
  }
  
  return normalized;
}

/**
 * Check if two city names match (fuzzy matching)
 * Returns true if they're the same or very similar after normalization
 */
export function cityNamesMatch(name1: string, name2: string): boolean {
  const norm1 = normalizeCityName(name1);
  const norm2 = normalizeCityName(name2);
  
  // Exact match after normalization
  if (norm1 === norm2) return true;
  
  // One contains the other (for cases like "Tel Aviv" vs "Tel Aviv-Yafo")
  if (norm1.includes(norm2) || norm2.includes(norm1)) {
    // But require at least 3 characters to avoid false matches
    if (Math.min(norm1.length, norm2.length) >= 3) {
      return true;
    }
  }
  
  // Word-based matching for multi-word cities
  const words1 = norm1.split(/\s+/).filter(w => w.length > 0);
  const words2 = norm2.split(/\s+/).filter(w => w.length > 0);
  
  if (words1.length === 0 || words2.length === 0) return false;
  
  // For single-word cities, require exact match
  if (words1.length === 1 && words2.length === 1) {
    return norm1 === norm2;
  }
  
  // For multi-word cities, check if all significant words match
  // At least 2 words should match, or all words from the shorter name
  const matchingWords = words1.filter(w1 => 
    words2.some(w2 => w1 === w2 || w1.includes(w2) || w2.includes(w1))
  );
  
  const minWordsToMatch = Math.min(2, Math.min(words1.length, words2.length));
  return matchingWords.length >= minWordsToMatch;
}

/**
 * Convert a city name to a canonical display-friendly English variant when possible
 */
export function canonicalizeCityDisplayName(name: string): string {
  const normalized = normalizeCityName(name);
  if (canonicalDisplayMap[normalized]) {
    return canonicalDisplayMap[normalized];
  }

  // If normalization translated the name, return a title-cased version of the translated value
  const translatedEntry = Object.entries(translationMap).find(([, translated]) => translated === normalized);
  if (translatedEntry) {
    return titleCase(normalized);
  }

  return name;
}
