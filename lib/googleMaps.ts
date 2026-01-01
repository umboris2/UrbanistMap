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
    // Build the query - only add city name if address doesn't already contain it
    // Many addresses from CSV already include city and country, so avoid duplicates
    let query = address;
    if (cityName && !address.toLowerCase().includes(cityName.toLowerCase())) {
      query = `${address}, ${cityName}`;
    }
    
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      query
    )}&key=${apiKey}`;
    
    console.log(`[geocodeAddressGoogle] Making request to Google Maps API for: "${query}"`);
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[geocodeAddressGoogle] ❌ HTTP ERROR (${response.status}):`, errorText);
      console.error(`[geocodeAddressGoogle] Full URL (key redacted):`, url.replace(apiKey, 'REDACTED'));
      throw new Error(`Google Geocoding request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`[geocodeAddressGoogle] API Response status:`, data.status);
    
    if (data.status === 'ZERO_RESULTS' || !data.results || data.results.length === 0) {
      console.warn(`[geocodeAddressGoogle] ⚠ No results found for "${query}"`);
      return null;
    }
    
    if (data.status !== 'OK') {
      console.error(`[geocodeAddressGoogle] ❌ API ERROR for "${query}":`, {
        status: data.status,
        error_message: data.error_message || 'Unknown error',
        full_response: data
      });
      
      // Provide helpful error messages for common issues
      if (data.status === 'REQUEST_DENIED') {
        console.error(`[geocodeAddressGoogle] 🔒 REQUEST_DENIED - Check:`);
        console.error(`  1. API key restrictions in Google Cloud Console`);
        console.error(`  2. HTTP referrers must include: https://*.vercel.app/*`);
        console.error(`  3. Geocoding API must be enabled`);
        console.error(`  4. Billing must be enabled (required even for free tier)`);
        if (data.error_message) {
          console.error(`  Error details: ${data.error_message}`);
        }
      }
      
      return null;
    }
    
    console.log(`[geocodeAddressGoogle] ✓ Successfully geocoded "${query}"`);
    
    const result = data.results[0];
    const location = result.geometry.location;
    
    return {
      lat: location.lat,
      lng: location.lng,
      formattedAddress: result.formatted_address,
      placeId: result.place_id,
    };
  } catch (error) {
    console.error(`[geocodeAddressGoogle] ❌ ERROR geocoding "${address}":`, error);
    if (error instanceof Error) {
      console.error('[geocodeAddressGoogle] Error message:', error.message);
      console.error('[geocodeAddressGoogle] Error stack:', error.stack);
    }
    return null;
  }
}

