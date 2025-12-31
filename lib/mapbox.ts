export interface GeocodingResult {
  id: string;
  place_name: string;
  place_name_en?: string;
  text: string; // Primary name in requested language
  text_en?: string;
  center: [number, number]; // [lng, lat]
  context?: Array<{
    id: string;
    text: string;
    short_code?: string;
  }>;
  properties?: {
    name?: string;
    name_en?: string;
    short_code?: string;
  };
}

export async function searchCities(
  query: string,
  token: string
): Promise<GeocodingResult[]> {
  if (!query.trim() || !token) return [];
  
  try {
    // Request English language for city names
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      query
    )}.json?access_token=${token}&types=place&limit=5&language=en`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Geocoding request failed');
    
    const data = await response.json();
    return data.features || [];
  } catch (error) {
    console.error('Error searching cities:', error);
    return [];
  }
}

export function extractCountry(context?: Array<{ id: string; text: string }>): string | undefined {
  if (!context) return undefined;
  
  const country = context.find(ctx => ctx.id.startsWith('country'));
  return country?.text;
}

/**
 * Prefer English place names when available in the geocoding result
 */
export function getEnglishPlaceName(result: GeocodingResult, fallback?: string): string {
  const candidates = [
    result.text_en,
    result.properties?.name_en,
    result.place_name_en,
    fallback, // Prefer the known English input before local-language fields
    result.text,
    result.properties?.name,
    result.place_name,
    fallback,
  ];

  const name = candidates.find(Boolean) || '';
  return name.split(',')[0].trim();
}

/**
 * Geocode an address to get coordinates
 * This is for specific addresses, not city searches
 */
export async function geocodeAddress(
  address: string,
  token: string
): Promise<GeocodingResult | null> {
  if (!address.trim() || !token) return null;
  
  try {
    // Use geocoding API without type restrictions to get precise addresses
    // Request English language for names
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      address
    )}.json?access_token=${token}&limit=1&language=en`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Geocoding request failed');
    
    const data = await response.json();
    const features = data.features || [];
    
    if (features.length === 0) return null;
    
    return features[0];
  } catch (error) {
    console.error('Error geocoding address:', error);
    return null;
  }
}
