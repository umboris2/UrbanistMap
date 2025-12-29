export interface GeocodingResult {
  id: string;
  place_name: string;
  center: [number, number]; // [lng, lat]
  context?: Array<{
    id: string;
    text: string;
    short_code?: string;
  }>;
}

export async function searchCities(
  query: string,
  token: string
): Promise<GeocodingResult[]> {
  if (!query.trim() || !token) return [];
  
  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      query
    )}.json?access_token=${token}&types=place&limit=5`;
    
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
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      address
    )}.json?access_token=${token}&limit=1`;
    
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

