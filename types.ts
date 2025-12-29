export type Category = 'Favorite' | 'Visited' | 'Want to Visit';

export interface City {
  id: string;
  name: string;
  country?: string;
  lat: number;
  lng: number;
  category: Category;
  createdAt: string;
}

export interface Photo {
  imageUrl: string;
  title: string;
  sourceUrl: string;
}

export interface CachedPhotos {
  cityName: string;
  photos: Photo[];
  cachedAt: string;
}

export interface Location {
  id: string;
  cityName: string;
  name: string;
  address: string;
  description: string;
  wikipediaUrl: string;
  category: string;
  lat: number;
  lng: number;
  photoUrl?: string;
}

