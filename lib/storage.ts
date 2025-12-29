import { City, CachedPhotos, Photo } from '@/types';

const CITIES_KEY = 'urbanist-map-cities';
const PHOTOS_CACHE_KEY = 'urbanist-map-photos-cache';

export function loadCities(): City[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const data = localStorage.getItem(CITIES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading cities:', error);
    return [];
  }
}

export function saveCities(cities: City[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(CITIES_KEY, JSON.stringify(cities));
  } catch (error) {
    console.error('Error saving cities:', error);
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

