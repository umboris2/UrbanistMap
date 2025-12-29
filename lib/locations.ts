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

    const locations: Location[] = [];
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    // Parse rows
    for (let i = 1; i < lines.length; i++) {
      const row = parseCSVRow(lines[i]);
      if (row.length < Math.max(cityIdx, nameIdx, addressIdx, descIdx, urlIdx) + 1) continue;

      const rowCity = row[cityIdx]?.trim();
      
      // Only process locations for the selected city
      if (!rowCity || rowCity.toLowerCase() !== cityName.toLowerCase()) {
        continue;
      }

      const name = row[nameIdx]?.trim();
      const address = row[addressIdx]?.trim();
      const description = row[descIdx]?.trim() || ''; // Allow empty description
      const wikipediaUrl = row[urlIdx]?.trim();
      const category = categoryIdx >= 0 ? row[categoryIdx]?.trim() || 'Other' : 'Other';

      // Only require name and address
      if (!name || !address) continue;

      // Geocode address to get lat/lng
      if (!token) {
        console.warn('Mapbox token not found, skipping geocoding');
        continue;
      }

      try {
        const result = await geocodeAddress(address, token);
        if (!result) {
          console.warn(`Could not geocode address: ${address}`);
          continue;
        }

        const [lng, lat] = result.center;

        locations.push({
          id: `${cityName}-${i}-${Date.now()}`,
          cityName: rowCity,
          name,
          address,
          description,
          wikipediaUrl: wikipediaUrl || '',
          category,
          lat,
          lng,
        });
      } catch (error) {
        console.error(`Error geocoding ${address}:`, error);
      }
    }

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

