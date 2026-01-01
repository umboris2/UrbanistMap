import { Location } from '@/types';
import { geocodeAddress } from './mapbox';
import { geocodeAddressGoogle } from './googleMaps';
import { fetchCitySkyline } from './wikimedia';
import { normalizeCityName, cityNamesMatch } from './cityNameUtils';

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Parse CSV file and load locations for a specific city
 * CSV format: city,country,category,name,address,why_it_matters,associated_person_or_event,source_url
 * @param cityName - The name of the city
 * @param cityCoordinates - Optional [lng, lat] coordinates of the city center to bias geocoding results
 */
export async function loadLocationsForCity(
  cityName: string,
  cityCoordinates?: [number, number] // [lng, lat]
): Promise<Location[]> {
  try {
    console.log(`[loadLocationsForCity] Starting load for city: "${cityName}"`);
    
    // Fetch the CSV file
    const response = await fetch('/sites_of_interest.csv');
    if (!response.ok) {
      console.warn('[loadLocationsForCity] Could not load sites_of_interest.csv:', response.status, response.statusText);
      return [];
    }

    const csvText = await response.text();
    console.log(`[loadLocationsForCity] CSV loaded, length: ${csvText.length}`);
    
    const lines = csvText.split('\n').filter(line => line.trim());
    console.log(`[loadLocationsForCity] CSV has ${lines.length} lines`);
    
    if (lines.length < 2) {
      console.warn('[loadLocationsForCity] CSV has too few lines');
      return [];
    }

    // Parse header using parseCSVRow to handle quoted fields
    const header = parseCSVRow(lines[0]).map(h => h.trim().toLowerCase());
    console.log('[loadLocationsForCity] CSV header:', header);
    
    const cityIdx = header.findIndex(h => h === 'city');
    const nameIdx = header.findIndex(h => h === 'name');
    const addressIdx = header.findIndex(h => h === 'address');
    const descIdx = header.findIndex(h => h === 'why_it_matters' || h.includes('description'));
    const urlIdx = header.findIndex(h => h === 'source_url' || h.includes('wikipedia') || h.includes('url'));
    const categoryIdx = header.findIndex(h => h === 'category');

    console.log('[loadLocationsForCity] Column indices:', { cityIdx, nameIdx, addressIdx, descIdx, urlIdx, categoryIdx });

    if (cityIdx === -1 || nameIdx === -1 || addressIdx === -1 || descIdx === -1 || urlIdx === -1) {
      console.error('[loadLocationsForCity] CSV format error: missing required columns');
      return [];
    }

    // First, collect all locations that need geocoding
    const locationsToGeocode: Array<{
      name: string;
      address: string;
      description: string;
      wikipediaUrl: string;
      category: string;
      cityName: string;
      index: number;
    }> = [];

    // Parse rows and collect addresses
    const normalizedCityName = normalizeCityName(cityName);
    console.log(`[loadLocationsForCity] ========================================`);
    console.log(`[loadLocationsForCity] Looking for city: "${cityName}"`);
    console.log(`[loadLocationsForCity] Normalized search term: "${normalizedCityName}"`);
    console.log(`[loadLocationsForCity] (Handles variations: Roma->Rome, Tel Aviv-Yafo->Tel Aviv, etc.)`);
    console.log(`[loadLocationsForCity] ========================================`);
    
    let matchCount = 0;
    let checkedCount = 0;
    
    for (let i = 1; i < lines.length; i++) {
      const row = parseCSVRow(lines[i]);
      if (row.length < Math.max(cityIdx, nameIdx, addressIdx, descIdx, urlIdx) + 1) {
        if (i <= 5) console.log(`[loadLocationsForCity] Row ${i} too short: ${row.length} columns`);
        continue;
      }

      const rowCity = row[cityIdx]?.trim();
      if (!rowCity) continue;
      
      checkedCount++;
      const normalizedRowCity = normalizeCityName(rowCity);
      
      // Log rows for debugging specific cities or first 20 rows
      const cityNameLower = normalizedCityName.toLowerCase();
      const rowCityLower = normalizedRowCity.toLowerCase();
      const shouldLog = checkedCount <= 20 || 
                        rowCityLower.includes(cityNameLower) ||
                        cityNameLower.includes(rowCityLower) ||
                        rowCity.toLowerCase().includes(cityNameLower) ||
                        cityNameLower.includes('tokyo') ||
                        cityNameLower.includes('tel aviv') ||
                        cityNameLower.includes('copenhagen') ||
                        cityNameLower.includes('beijing');
      
      if (shouldLog) {
        const isMatch = normalizedRowCity === normalizedCityName;
        console.log(`[loadLocationsForCity] Row ${i}: city="${rowCity}" (normalized: "${normalizedRowCity}") | Looking for: "${cityName}" (normalized: "${normalizedCityName}") | Match: ${isMatch}`);
        if (isMatch) {
          console.log(`[loadLocationsForCity] ✓ MATCH FOUND! Row ${i} matches!`);
        }
      }
      
      // Use generalized matching function
      if (cityNamesMatch(rowCity, cityName)) {
        matchCount++;
        console.log(`[loadLocationsForCity] ✓ Found match at row ${i}: "${rowCity}" matches "${cityName}"`);
      } else {
        continue;
      }
      
      // If we get here, we have a match - extract the location data
      const name = row[nameIdx]?.trim();
      const address = row[addressIdx]?.trim();
      const description = row[descIdx]?.trim() || '';
      const wikipediaUrl = row[urlIdx]?.trim();
      const category = categoryIdx >= 0 ? row[categoryIdx]?.trim() || 'Other' : 'Other';

      if (!name || !address) continue;

      locationsToGeocode.push({
        name,
        address,
        description,
        wikipediaUrl: wikipediaUrl || '',
        category,
        cityName: rowCity,
        index: i,
      });
    }

    console.log(`[loadLocationsForCity] ========================================`);
    console.log(`[loadLocationsForCity] Summary for "${cityName}":`);
    console.log(`[loadLocationsForCity] - Checked ${checkedCount} rows`);
    console.log(`[loadLocationsForCity] - Found ${matchCount} matching rows`);
    console.log(`[loadLocationsForCity] - Collected ${locationsToGeocode.length} locations to geocode`);
    console.log(`[loadLocationsForCity] ========================================`);

    // Load geocoding cache
    const GEOCODE_CACHE_KEY = 'urbanist-map-geocode-cache';
    let geocodeCache: Record<string, { lat: number; lng: number }> = {};

    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(GEOCODE_CACHE_KEY);
        if (cached) {
          geocodeCache = JSON.parse(cached);
        }
      } catch (error) {
        console.error('Error loading geocode cache:', error);
      }
    }

    // Use Mapbox first (free), fallback to Google Maps if Mapbox fails or result is too far
    const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    const MAX_DISTANCE_KM = 30; // Maximum distance from city center to consider result valid

    console.log('[loadLocationsForCity] Geocoding strategy: Mapbox first, Google Maps as fallback');
    if (!mapboxToken) {
      console.error('[loadLocationsForCity] ❌ Mapbox token not found - required for primary geocoding');
    }
    if (!googleApiKey) {
      console.warn('[loadLocationsForCity] ⚠ Google Maps API key not found - no fallback available');
    }

    // Geocode all addresses in parallel (with caching)
    const geocodePromises = locationsToGeocode.map(async (loc) => {
      // Check cache first
      const cacheKey = `${loc.address}-${loc.cityName}`;
      if (geocodeCache[cacheKey]) {
        console.log(`[loadLocationsForCity] Using CACHED coordinates for "${loc.name}": ${geocodeCache[cacheKey].lat}, ${geocodeCache[cacheKey].lng}`);
        return {
          ...loc,
          lat: geocodeCache[cacheKey].lat,
          lng: geocodeCache[cacheKey].lng,
        };
      }
      
      console.log(`[loadLocationsForCity] No cache found, will geocode: "${loc.name}" at "${loc.address}"`);

      // Geocode if not cached
      if (!googleApiKey && !mapboxToken) {
        return null;
      }

      try {
        let lat: number | undefined;
        let lng: number | undefined;
        let usedService = 'unknown';
        let needsGoogleFallback = false;

        // Try Mapbox first (free)
        if (mapboxToken) {
          console.log(`[loadLocationsForCity] Trying Mapbox first for: "${loc.address}" in ${loc.cityName}`);
          const mapboxResult = await geocodeAddress(loc.address, mapboxToken, loc.cityName, cityCoordinates);
          
          if (mapboxResult) {
            const [resultLng, resultLat] = mapboxResult.center;
            
            // Check if result is near the city center (if we have city coordinates)
            if (cityCoordinates) {
              const distance = calculateDistance(
                resultLat,
                resultLng,
                cityCoordinates[1], // cityCoordinates is [lng, lat]
                cityCoordinates[0]
              );
              
              console.log(`[loadLocationsForCity] Mapbox result distance from city center: ${distance.toFixed(2)} km`);
              
              if (distance > MAX_DISTANCE_KM) {
                console.warn(`[loadLocationsForCity] ⚠ Mapbox result too far (${distance.toFixed(2)} km), trying Google Maps fallback`);
                needsGoogleFallback = true;
              } else {
                // Mapbox result is good!
                lat = resultLat;
                lng = resultLng;
                usedService = 'Mapbox';
                console.log(`[loadLocationsForCity] ✓ Mapbox geocoded "${loc.name}": ${lat}, ${lng} (${distance.toFixed(2)} km from city)`);
              }
            } else {
              // No city coordinates to check against, use Mapbox result
              lat = resultLat;
              lng = resultLng;
              usedService = 'Mapbox';
              console.log(`[loadLocationsForCity] ✓ Mapbox geocoded "${loc.name}": ${lat}, ${lng} (no city coordinates to verify)`);
            }
          } else {
            // Mapbox failed, try Google fallback
            console.warn(`[loadLocationsForCity] ⚠ Mapbox failed for "${loc.address}", trying Google Maps fallback`);
            needsGoogleFallback = true;
          }
        } else {
          // No Mapbox token, go straight to Google
          needsGoogleFallback = true;
        }

        // Fallback to Google Maps if needed
        if (needsGoogleFallback && googleApiKey) {
          console.log(`[loadLocationsForCity] Using Google Maps fallback for: "${loc.address}" in ${loc.cityName}`);
          const googleResult = await geocodeAddressGoogle(loc.address, googleApiKey, loc.cityName);
          
          if (!googleResult) {
            console.error(`[loadLocationsForCity] ❌ Google Maps also failed for: "${loc.address}" in ${loc.cityName}`);
            return null;
          }
          
          lat = googleResult.lat;
          lng = googleResult.lng;
          usedService = 'Google Maps (fallback)';
          console.log(`[loadLocationsForCity] ✓ Google Maps geocoded "${loc.name}": ${lat}, ${lng}`);
        } else if (needsGoogleFallback && !googleApiKey) {
          // Both failed or no Google key available
          console.error(`[loadLocationsForCity] ❌ No geocoding service available for: "${loc.address}"`);
          return null;
        }

        // Ensure we have valid coordinates before proceeding
        if (lat === undefined || lng === undefined) {
          console.error(`[loadLocationsForCity] ❌ No valid coordinates obtained for: "${loc.address}"`);
          return null;
        }

        console.log(`[loadLocationsForCity] ✓ Final result for "${loc.name}": ${lat}, ${lng} (${usedService})`);
        
        // Save to cache
        geocodeCache[cacheKey] = { lat, lng };
        
        // Update cache in localStorage
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(GEOCODE_CACHE_KEY, JSON.stringify(geocodeCache));
          } catch (error) {
            // Cache might be full, that's okay
          }
        }

        return {
          ...loc,
          lat,
          lng,
        };
      } catch (error) {
        console.error(`Error geocoding ${loc.address}:`, error);
        return null;
      }
    });

    // Wait for all geocoding to complete in parallel
    const geocodedResults = await Promise.all(geocodePromises);

    // Build locations array
    const locations: Location[] = geocodedResults
      .filter((result): result is NonNullable<typeof result> => result !== null)
      .map((result, idx) => ({
        id: `${cityName}-${result.index}-${Date.now()}-${idx}`,
        cityName: result.cityName,
        name: result.name,
        address: result.address,
        description: result.description,
        wikipediaUrl: result.wikipediaUrl,
        category: result.category,
        lat: result.lat,
        lng: result.lng,
      }));

    return locations;
  } catch (error) {
    console.error('Error loading locations:', error);
    return [];
  }
}

/**
 * Parse CSV row handling quoted fields
 */
function parseCSVRow(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

/**
 * Fetch a photo for a location from Wikipedia/Wikimedia
 */
export async function fetchLocationPhoto(location: Location): Promise<string | null> {
  try {
    if (!location.wikipediaUrl) {
      // Try using the location name
      const photo = await fetchCitySkyline(location.name);
      return photo?.imageUrl || null;
    }

    // Extract page title from Wikipedia URL
    const urlMatch = location.wikipediaUrl.match(/\/wiki\/(.+)$/);
    if (urlMatch) {
      const pageTitle = decodeURIComponent(urlMatch[1].replace(/_/g, ' '));
      const photo = await fetchCitySkyline(pageTitle);
      if (photo?.imageUrl) {
        return photo.imageUrl;
      }
    }
    
    // Fallback: try with location name
    const fallbackPhoto = await fetchCitySkyline(location.name);
    return fallbackPhoto?.imageUrl || null;
  } catch (error) {
    console.error('Error fetching location photo:', error);
    return null;
  }
}
