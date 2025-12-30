import { Location } from '@/types';
import { geocodeAddress } from './mapbox';
import { fetchCitySkyline } from './wikimedia';

/**
 * Parse CSV file and load locations for a specific city
 * CSV format: city,country,category,name,address,why_it_matters,associated_person_or_event,source_url
 */
export async function loadLocationsForCity(cityName: string): Promise<Location[]> {
  try {
    // Fetch the CSV file
    const response = await fetch('/sites_of_interest.csv');
    if (!response.ok) {
      console.warn('Could not load sites_of_interest.csv');
      return [];
    }

    const csvText = await response.text();
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    // Parse header
    const header = lines[0].split(',').map(h => h.trim().toLowerCase());
    const cityIdx = header.findIndex(h => h === 'city');
    const nameIdx = header.findIndex(h => h === 'name');
    const addressIdx = header.findIndex(h => h === 'address');
    const descIdx = header.findIndex(h => h === 'why_it_matters' || h.includes('description'));
    const urlIdx = header.findIndex(h => h === 'source_url' || h.includes('wikipedia') || h.includes('url'));
    const categoryIdx = header.findIndex(h => h === 'category');

    if (cityIdx === -1 || nameIdx === -1 || addressIdx === -1 || descIdx === -1 || urlIdx === -1) {
      console.error('CSV format error: missing required columns');
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
    for (let i = 1; i < lines.length; i++) {
      const row = parseCSVRow(lines[i]);
      if (row.length < Math.max(cityIdx, nameIdx, addressIdx, descIdx, urlIdx) + 1) continue;

      const rowCity = row[cityIdx]?.trim();
      if (!rowCity || rowCity.toLowerCase() !== cityName.toLowerCase()) {
        continue;
      }

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

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    // Geocode all addresses in parallel (with caching)
    const geocodePromises = locationsToGeocode.map(async (loc) => {
      // Check cache first
      const cacheKey = `${loc.address}-${loc.cityName}`;
      if (geocodeCache[cacheKey]) {
        return {
          ...loc,
          lat: geocodeCache[cacheKey].lat,
          lng: geocodeCache[cacheKey].lng,
        };
      }

      // Geocode if not cached
      if (!token) {
        return null;
      }

      try {
        const result = await geocodeAddress(loc.address, token);
        if (!result) {
          return null;
        }

        const [lng, lat] = result.center;
        
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

