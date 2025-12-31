import { City, CachedPhotos, Photo } from '@/types';
import { canonicalizeCityDisplayName } from './cityNameUtils';

const CITIES_KEY = 'urbanist-map-cities';
const PHOTOS_CACHE_KEY = 'urbanist-map-photos-cache';

export function loadCities(): City[] {
  if (typeof window === 'undefined') {
    console.warn('Cannot load cities: window is undefined (server-side)');
    return [];
  }
  
  try {
    const data = localStorage.getItem(CITIES_KEY);
    if (!data) {
      console.log('No cities found in localStorage');
      return [];
    }
    const cities = JSON.parse(data) as City[];
    const sanitizedCities = cities.map(city => ({
      ...city,
      name: canonicalizeCityDisplayName(city.name),
    }));
    console.log(`Loaded ${sanitizedCities.length} cities from localStorage`);
    return sanitizedCities;
  } catch (error) {
    console.error('Error loading cities:', error);
    return [];
  }
}

export function saveCities(cities: City[]): void {
  if (typeof window === 'undefined') {
    console.warn('Cannot save cities: window is undefined (server-side)');
    return;
  }
  
  try {
    const sanitizedCities = cities.map(city => ({
      ...city,
      name: canonicalizeCityDisplayName(city.name),
    }));
    const json = JSON.stringify(sanitizedCities);
    localStorage.setItem(CITIES_KEY, json);
    console.log(`Saved ${sanitizedCities.length} cities to localStorage`);
  } catch (error) {
    console.error('Error saving cities:', error);
    // Check if it's a quota exceeded error
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.error('localStorage quota exceeded. Try clearing some data.');
    }
  }
}

export function loadCachedPhotos(cityName: string): Photo[] | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const data = localStorage.getItem(PHOTOS_CACHE_KEY);
    if (!data) return null;
    
    const cache: CachedPhotos[] = JSON.parse(data);
    const cached = cache.find(c => c.cityName === cityName);
    
    if (!cached) return null;
    
    // Cache expires after 7 days
    const cacheAge = Date.now() - new Date(cached.cachedAt).getTime();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    
    if (cacheAge > sevenDays) {
      // Remove expired cache
      const updatedCache = cache.filter(c => c.cityName !== cityName);
      localStorage.setItem(PHOTOS_CACHE_KEY, JSON.stringify(updatedCache));
      return null;
    }
    
    return cached.photos;
  } catch (error) {
    console.error('Error loading cached photos:', error);
    return null;
  }
}

export function saveCachedPhotos(cityName: string, photos: Photo[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    const data = localStorage.getItem(PHOTOS_CACHE_KEY);
    const cache: CachedPhotos[] = data ? JSON.parse(data) : [];
    
    const existingIndex = cache.findIndex(c => c.cityName === cityName);
    const cached: CachedPhotos = {
      cityName,
      photos,
      cachedAt: new Date().toISOString(),
    };
    
    if (existingIndex >= 0) {
      cache[existingIndex] = cached;
    } else {
      cache.push(cached);
    }
    
    localStorage.setItem(PHOTOS_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Error saving cached photos:', error);
  }
}
