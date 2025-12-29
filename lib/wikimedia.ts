import { Photo } from '@/types';

export async function fetchCitySkyline(cityName: string): Promise<Photo | null> {
  try {
    // Search for the first most relevant photo of the city from Wikimedia Commons
    const searchQuery = cityName;
    const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&list=search&srsearch=${encodeURIComponent(
      searchQuery
    )}&srnamespace=6&srlimit=1`;
    
    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) return null;
    
    const searchData = await searchResponse.json();
    const searchResults = searchData.query?.search || [];
    
    if (searchResults.length === 0) return null;
    
    // Get image info for the first result (most relevant)
    const pageId = searchResults[0].pageid;
    const imageInfoUrl = `https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&pageids=${pageId}&prop=imageinfo&iiprop=url&iiurlwidth=400`;
    
    const imageResponse = await fetch(imageInfoUrl);
    if (!imageResponse.ok) return null;
    
    const imageData = await imageResponse.json();
    const pages = imageData.query?.pages || {};
    const page = Object.values(pages)[0] as any;
    const imageInfo = page?.imageinfo?.[0];
    
    if (imageInfo?.url) {
      return {
        imageUrl: imageInfo.url,
        title: page.title?.replace('File:', '').replace(/\.[^/.]+$/, '') || cityName,
        sourceUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title || '')}`,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching city thumbnail from Wikimedia:', error);
    return null;
  }
}

export async function fetchCityPhotos(cityName: string): Promise<Photo[]> {
  try {
    // Search for images on Wikimedia Commons
    // Using srsearch with filetype:bitmap to get actual images
    const searchQuery = `${cityName} filetype:bitmap`;
    const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&list=search&srsearch=${encodeURIComponent(
      searchQuery
    )}&srnamespace=6&srlimit=6`;
    
    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) throw new Error('Search request failed');
    
    const searchData = await searchResponse.json();
    const searchResults = searchData.query?.search || [];
    
    if (searchResults.length === 0) return [];
    
    // Get image info for the search results
    const pageIds = searchResults.map((r: any) => r.pageid).join('|');
    const imageInfoUrl = `https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&pageids=${pageIds}&prop=imageinfo&iiprop=url&iiurlwidth=800`;
    
    const imageResponse = await fetch(imageInfoUrl);
    if (!imageResponse.ok) throw new Error('Image info request failed');
    
    const imageData = await imageResponse.json();
    const pages = imageData.query?.pages || {};
    
    const photos: Photo[] = [];
    
    for (const pageId in pages) {
      const page = pages[pageId];
      const imageInfo = page.imageinfo?.[0];
      
      if (imageInfo?.url) {
        photos.push({
          imageUrl: imageInfo.url,
          title: page.title?.replace('File:', '').replace(/\.[^/.]+$/, '') || cityName,
          sourceUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title || '')}`,
        });
      }
    }
    
    return photos;
  } catch (error) {
    console.error('Error fetching city photos:', error);
    return [];
  }
}

