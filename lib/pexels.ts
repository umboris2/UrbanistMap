import { Photo } from '@/types';

function getPexelsApiKey(): string | null {
  return process.env.NEXT_PUBLIC_PEXELS_API_KEY || null;
}

export async function fetchPexelsSkyline(cityName: string): Promise<Photo | null> {
  try {
    const apiKey = getPexelsApiKey();
    if (!apiKey) {
      console.warn('Pexels API key not found. Please set NEXT_PUBLIC_PEXELS_API_KEY in .env.local');
      return null;
    }

    // Search for skyline images
    const searchQueries = [
      `${cityName} skyline`,
      `${cityName} cityscape`,
      `${cityName} skyline panorama`,
    ];

    for (const query of searchQueries) {
      const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`;
      const response = await fetch(url, {
        headers: {
          'Authorization': apiKey,
        },
      });

      if (!response.ok) continue;

      const data = await response.json();
      if (data.photos && data.photos.length > 0) {
        const photo = data.photos[0];
        return {
          imageUrl: photo.src.medium,
          title: `${cityName} skyline`,
          sourceUrl: photo.url,
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Error fetching Pexels skyline:', error);
    return null;
  }
}

export async function fetchPexelsPhotos(cityName: string, searchQuery?: string): Promise<Photo[]> {
  try {
    const apiKey = getPexelsApiKey();
    if (!apiKey) {
      console.warn('Pexels API key not found. Please set NEXT_PUBLIC_PEXELS_API_KEY in .env.local');
      return [];
    }

    // Combine city name with optional search query
    const query = searchQuery 
      ? `${cityName} ${searchQuery}` 
      : cityName;

    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=6&orientation=landscape`;
    const response = await fetch(url, {
      headers: {
        'Authorization': apiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Pexels API error (${response.status}):`, errorText);
      throw new Error(`Pexels API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.photos || data.photos.length === 0) {
      console.log(`No photos found for query: ${query}`);
      return [];
    }

    return data.photos.map((photo: any) => ({
      imageUrl: photo.src.medium,
      title: photo.photographer || query,
      sourceUrl: photo.url,
    }));
  } catch (error) {
    console.error('Error fetching Pexels photos:', error);
    return [];
  }
}

