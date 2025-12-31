import { normalizeCityName } from './cityNameUtils';

/**
 * Check which cities have locations in the sites_of_interest.csv file
 * Returns a Set of city names (normalized) that have locations
 */
export async function getCitiesWithLocations(): Promise<Set<string>> {
  const citiesWithLocations = new Set<string>();
  
  try {
    // Fetch the CSV file
    const response = await fetch('/sites_of_interest.csv');
    if (!response.ok) {
      console.warn('[getCitiesWithLocations] Could not load sites_of_interest.csv');
      return citiesWithLocations;
    }

    const csvText = await response.text();
    const lines = csvText.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      return citiesWithLocations;
    }

    // Parse CSV row helper
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

    // Parse header
    const header = parseCSVRow(lines[0]).map(h => h.trim().toLowerCase());
    const cityIdx = header.findIndex(h => h === 'city');
    
    if (cityIdx === -1) {
      return citiesWithLocations;
    }

    // Process data rows
    for (let i = 1; i < lines.length; i++) {
      const row = parseCSVRow(lines[i]);
      if (row.length <= cityIdx) continue;
      
      const cityName = row[cityIdx].trim();
      if (cityName) {
        const normalized = normalizeCityName(cityName);
        citiesWithLocations.add(normalized);
      }
    }
    
    console.log(`[getCitiesWithLocations] Found ${citiesWithLocations.size} cities with locations`);
  } catch (error) {
    console.error('[getCitiesWithLocations] Error:', error);
  }
  
  return citiesWithLocations;
}
