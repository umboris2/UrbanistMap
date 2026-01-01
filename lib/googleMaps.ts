/**
 * Google Maps Geocoding API integration
 * Used for better address geocoding accuracy compared to Mapbox
 */

export interface GoogleGeocodingResult {
  lat: number;
  lng: number;
  formattedAddress: string;
  placeId: string;
}

/**
 * Geocode an address using Google Maps Geocoding API
 * @param address - The address to geocode
 * @param apiKey - Google Maps API key
 * @param cityName - Optional city name to include in the query for better accuracy
 */
export async function geocodeAddressGoogle(
  address: string,
  apiKey: string,
  cityName?: string
): Promise<GoogleGeocodingResult | null> {
  if (!address.trim() || !apiKey) return null;
  
  try {
    // Build the query - include city name if provided to improve accuracy
    // Google Maps is good at understanding context from the query itself
    const query = cityName 
      ? `${address}, ${cityName}`
      : address;
    
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      query
    )}&key=${apiKey}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Google Geocoding API HTTP error (${response.status}):`, errorText);
      throw new Error(`Google Geocoding request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.status === 'ZERO_RESULTS' || !data.results || data.results.length === 0) {
      console.log(`Google Geocoding: No results for "${query}"`);
      return null;
    }
    
    if (data.status !== 'OK') {
      console.error(`Google Geocoding API error for "${query}":`, {
        status: data.status,
        error_message: data.error_message || 'Unknown error',
        results: data.results
      });
      return null;
    }
    
    const result = data.results[0];
    const location = result.geometry.location;
    
    return {
      lat: location.lat,
      lng: location.lng,
      formattedAddress: result.formatted_address,
      placeId: result.place_id,
    };
  } catch (error) {
    console.error(`Error geocoding address with Google Maps for "${address}":`, error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    return null;
  }
}

