import { City, Category } from '@/types';
import { searchCities, extractCountry, getEnglishPlaceName } from './mapbox';
import { canonicalizeCityDisplayName } from './cityNameUtils';

/**
 * Parse a CSV row, handling quoted fields
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
 * Load cities from the City Preload CSV file
 * Only loads cities that have a tier designated (1, 2, 3, or 4)
 */
export async function loadPreloadCities(): Promise<City[]> {
  try {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      console.warn('[preloadCities] Mapbox token not found. Cannot preload cities.');
      return [];
    }

    console.log('[preloadCities] Starting to load cities from CSV...');
    
    // Fetch the CSV file (URL encode the space in the filename)
    const csvPath = '/City Preload.csv';
    console.log(`[preloadCities] Fetching CSV from: ${csvPath}`);
    const response = await fetch(csvPath);
    if (!response.ok) {
      console.error(`[preloadCities] Could not load City Preload.csv: ${response.status} ${response.statusText}`);
      console.error(`[preloadCities] Make sure the file exists at: public/City Preload.csv`);
      return [];
    }

    const csvText = await response.text();
    console.log(`[preloadCities] CSV file loaded, length: ${csvText.length} characters`);
    
    const lines = csvText.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      console.warn('[preloadCities] City Preload.csv appears to be empty or invalid');
      return [];
    }

    // Skip header row
    const dataLines = lines.slice(1);
    console.log(`[preloadCities] Found ${dataLines.length} data rows in CSV`);
    
    const cities: City[] = [];
    let processedCount = 0;
    let skippedCount = 0;
    
    // Process cities in parallel batches to avoid overwhelming the API
    const batchSize = 10;
    for (let i = 0; i < dataLines.length; i += batchSize) {
      const batch = dataLines.slice(i, i + batchSize);
      console.log(`[preloadCities] Processing batch ${Math.floor(i / batchSize) + 1} (rows ${i + 1}-${Math.min(i + batchSize, dataLines.length)})`);
      
      const batchPromises = batch.map(async (line) => {
        const row = parseCSVRow(line);
        if (row.length < 2) {
          skippedCount++;
          return null;
        }
        
        const cityName = row[0].trim();
        const tierStr = row[1].trim();
        
        // Only process cities with a tier designated
        if (!tierStr || tierStr === '') {
          skippedCount++;
          return null;
        }
        
        const tierNum = parseInt(tierStr, 10);
        if (isNaN(tierNum) || tierNum < 1 || tierNum > 4) {
          skippedCount++;
          return null;
        }
        
        const category: Category = `Tier ${tierNum}` as Category;
        
        // Geocode the city to get coordinates
        try {
          console.log(`[preloadCities] Geocoding: ${cityName} (Tier ${tierNum})`);
          const results = await searchCities(cityName, token);
          if (results.length === 0) {
            console.warn(`[preloadCities] Could not geocode city: ${cityName}`);
            skippedCount++;
            return null;
          }
          
          // Use the first result (most relevant)
          const result = results[0];
          const country = extractCountry(result.context);
          const [lng, lat] = result.center;
          
          const englishName = getEnglishPlaceName(result, cityName);
          const displayName = canonicalizeCityDisplayName(englishName || cityName);
          
          const city: City = {
            id: `preload-${cityName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}-${Math.random()}`,
            name: displayName,
            country,
            lat,
            lng,
            category,
            createdAt: new Date().toISOString(),
          };
          
          processedCount++;
          console.log(`[preloadCities] ✓ Successfully loaded: ${city.name}, ${country} (${category})`);
          return city;
        } catch (error) {
          console.error(`[preloadCities] Error geocoding city ${cityName}:`, error);
          skippedCount++;
          return null;
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      const validCities = batchResults.filter((city): city is City => city !== null);
      cities.push(...validCities);
      
      // Small delay between batches to avoid rate limiting
      if (i + batchSize < dataLines.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log(`[preloadCities] ✓ Completed! Loaded ${cities.length} cities (${processedCount} processed, ${skippedCount} skipped)`);
    return cities;
  } catch (error) {
    console.error('[preloadCities] Error loading preload cities:', error);
    return [];
  }
}
