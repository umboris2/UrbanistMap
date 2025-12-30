'use client';

import { useState, useEffect, useRef } from 'react';
import { City, Category, Photo } from '@/types';
import { saveCities, loadCachedPhotos, saveCachedPhotos } from '@/lib/storage';
import { searchCities, extractCountry } from '@/lib/mapbox';
import { fetchCitySkyline } from '@/lib/wikimedia';
import { fetchPexelsPhotos } from '@/lib/pexels';

interface SidebarProps {
  onCitySelect: (city: City) => void;
  selectedCity: City | null;
  cities: City[];
  onCitiesChange: (cities: City[]) => void;
  onPhotosChange: (photos: Photo[]) => void;
  onPhotosLoadingChange: (loading: boolean) => void;
  onPhotoSearchChange: (query: string) => void;
  photoSearchQuery: string;
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ onCitySelect, selectedCity, cities, onCitiesChange, onPhotosChange, onPhotosLoadingChange, onPhotoSearchChange, photoSearchQuery, isOpen, onToggle }: SidebarProps) {
  const [filter, setFilter] = useState<Category | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedSearchResult, setSelectedSearchResult] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category>('Tier 3');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [cityPhotos, setCityPhotos] = useState<Record<string, Photo | null>>({});
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Load skyline photos for all cities (for thumbnails in city bars)
  useEffect(() => {
    const loadCityThumbnails = async () => {
      const photosMap: Record<string, Photo | null> = {};
      
      for (const city of cities) {
        // Try to get thumbnail from cache first
        const cached = loadCachedPhotos(city.name);
        // Use first cached photo if available
        if (cached && cached.length > 0) {
          photosMap[city.id] = cached[0];
        } else {
          // Fetch first relevant photo from Wikimedia Commons
          try {
            const thumbnail = await fetchCitySkyline(city.name);
            if (thumbnail) {
              photosMap[city.id] = thumbnail;
              // Cache it
              saveCachedPhotos(city.name, [thumbnail]);
            } else {
              photosMap[city.id] = null;
            }
          } catch (error) {
            photosMap[city.id] = null;
          }
        }
      }
      
      setCityPhotos(photosMap);
    };

    if (cities.length > 0) {
      loadCityThumbnails();
    }
  }, [cities]);

  // Load photos for selected city (for photo strip in map area)
  useEffect(() => {
    if (!selectedCity) {
      setPhotos([]);
      onPhotosChange([]);
      return;
    }

    const loadPhotos = async () => {
      // Only check cache if there's no search query (search results shouldn't be cached)
      if (!photoSearchQuery) {
        const cached = loadCachedPhotos(selectedCity.name);
        if (cached && cached.length > 0) {
          setPhotos(cached);
          onPhotosChange(cached);
          return;
        }
      }

      // Fetch from Pexels API
      setPhotosLoading(true);
      onPhotosLoadingChange(true);
      try {
        const fetchedPhotos = await fetchPexelsPhotos(selectedCity.name, photoSearchQuery);
        setPhotos(fetchedPhotos);
        onPhotosChange(fetchedPhotos);
        // Only cache default photos (no search query)
        if (fetchedPhotos.length > 0 && !photoSearchQuery) {
          saveCachedPhotos(selectedCity.name, fetchedPhotos);
        }
      } catch (error) {
        console.error('Error loading photos:', error);
        setPhotos([]);
        onPhotosChange([]);
      } finally {
        setPhotosLoading(false);
        onPhotosLoadingChange(false);
      }
    };

    loadPhotos();
  }, [selectedCity, photoSearchQuery, onPhotosChange, onPhotosLoadingChange]);

  // Handle city search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSelectedSearchResult(null);
      return;
    }

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) return;

    searchTimeoutRef.current = setTimeout(async () => {
      const results = await searchCities(searchQuery, token);
      setSearchResults(results);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setSearchResults([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSearchResult = (result: any) => {
    setSelectedSearchResult(result);
    setSearchQuery(result.place_name);
    setSearchResults([]);
  };

  const handleAddCity = () => {
    if (!selectedSearchResult) return;

    const country = extractCountry(selectedSearchResult.context);
    const [lng, lat] = selectedSearchResult.center;

    const newCity: City = {
      id: `${Date.now()}-${Math.random()}`,
      name: selectedSearchResult.place_name.split(',')[0], // Get city name (first part)
      country,
      lat,
      lng,
      category: selectedCategory,
      createdAt: new Date().toISOString(),
    };

    const updatedCities = [...cities, newCity];
    onCitiesChange(updatedCities);
    saveCities(updatedCities);
    setSearchQuery('');
    setSearchResults([]);
    setSelectedSearchResult(null);
    onCitySelect(newCity);
  };

  const handleDeleteCity = (id: string) => {
    const updatedCities = cities.filter(c => c.id !== id);
    onCitiesChange(updatedCities);
    saveCities(updatedCities);
    if (selectedCity?.id === id) {
      onCitySelect(null as any);
    }
  };

  const filteredCities = filter === 'All' 
    ? cities 
    : cities.filter(c => c.category === filter);

  const categoryColors: Record<Category, string> = {
    'Tier 1': '#FF6B6B',
    'Tier 2': '#4ECDC4',
    'Tier 3': '#FFE66D',
  };

  return (
    <>
      {/* Toggle button when closed */}
      {!isOpen && (
        <button
          onClick={onToggle}
          style={{
            position: 'fixed',
            left: '8px',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 1001,
            width: '48px',
            height: '64px',
            borderRadius: '0 12px 12px 0',
            border: '2px solid #666',
            backgroundColor: '#666',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            color: '#fff',
            fontWeight: 'bold',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#555';
            e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#666';
            e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
          }}
        >
          →
        </button>
      )}
      {/* Toggle button when open - always visible */}
      {isOpen && (
        <button
          onClick={onToggle}
          style={{
            position: 'fixed',
            left: '320px',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 1001,
            width: '48px',
            height: '64px',
            borderRadius: '0 12px 12px 0',
            border: '2px solid #666',
            backgroundColor: '#666',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            color: '#fff',
            fontWeight: 'bold',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#555';
            e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#666';
            e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
          }}
        >
          ←
        </button>
      )}
      <div
      style={{
        width: '320px',
        maxWidth: '320px',
        height: '100vh',
        position: 'fixed',
        left: isOpen ? 0 : '-320px',
        top: 0,
        backgroundColor: '#fff',
        borderRight: '1px solid #e0e0e0',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
        overflowY: 'auto',
        overflowX: 'hidden',
        transition: 'left 0.3s ease',
        boxSizing: 'border-box',
      }}
      >
      {/* Add City Section */}
      <div style={{ padding: '16px', borderBottom: '1px solid #e0e0e0' }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 600 }}>
          Add City
        </h2>
        
        <div ref={searchContainerRef} style={{ position: 'relative', marginBottom: '12px' }}>
          <input
            type="text"
            placeholder="Search for a city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
          />
          {searchResults.length > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: '#fff',
                border: '1px solid #ccc',
                borderRadius: '4px',
                marginTop: '4px',
                maxHeight: '200px',
                overflowY: 'auto',
                zIndex: 1001,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            >
              {searchResults.map((result, index) => (
                <div
                  key={result.id}
                  onClick={() => handleSelectSearchResult(result)}
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    borderBottom: index < searchResults.length - 1 ? '1px solid #f0f0f0' : 'none',
                    backgroundColor: selectedSearchResult?.id === result.id ? '#e3f2fd' : '#fff',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedSearchResult?.id !== result.id) {
                      e.currentTarget.style.backgroundColor = '#f5f5f5';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedSearchResult?.id !== result.id) {
                      e.currentTarget.style.backgroundColor = '#fff';
                    }
                  }}
                >
                  {result.place_name}
                </div>
              ))}
            </div>
          )}
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value as Category)}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '14px',
            marginBottom: '12px',
            boxSizing: 'border-box',
          }}
        >
          <option value="Tier 1">Tier 1</option>
          <option value="Tier 2">Tier 2</option>
          <option value="Tier 3">Tier 3</option>
        </select>

        <button
          onClick={handleAddCity}
          disabled={!selectedSearchResult}
          style={{
            width: '100%',
            padding: '10px',
            border: 'none',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: 600,
            backgroundColor: selectedSearchResult ? '#4CAF50' : '#ccc',
            color: '#fff',
            cursor: selectedSearchResult ? 'pointer' : 'not-allowed',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => {
            if (selectedSearchResult) {
              e.currentTarget.style.backgroundColor = '#45a049';
            }
          }}
          onMouseLeave={(e) => {
            if (selectedSearchResult) {
              e.currentTarget.style.backgroundColor = '#4CAF50';
            }
          }}
        >
          Add City
        </button>
      </div>

      {/* Filter Section */}
      <div style={{ padding: '16px', borderBottom: '1px solid #e0e0e0' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 600 }}>
          Filter
        </h3>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as Category | 'All')}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '14px',
            boxSizing: 'border-box',
          }}
        >
          <option value="All">All</option>
          <option value="Tier 1">Tier 1</option>
          <option value="Tier 2">Tier 2</option>
          <option value="Tier 3">Tier 3</option>
        </select>
      </div>

      {/* City List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 600 }}>
          Cities ({filteredCities.length})
        </h3>
        {filteredCities.length === 0 ? (
          <div style={{ color: '#666', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
            No cities yet. Add one above!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {filteredCities.map((city) => (
              <div
                key={city.id}
                onClick={() => onCitySelect(city)}
                style={{
                  padding: '8px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  backgroundColor: selectedCity?.id === city.id ? '#f0f7ff' : '#fff',
                  transition: 'background-color 0.2s',
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center',
                  padding: '8px 12px',
                  boxSizing: 'border-box',
                }}
                onMouseEnter={(e) => {
                  if (selectedCity?.id !== city.id) {
                    e.currentTarget.style.backgroundColor = '#f9f9f9';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedCity?.id !== city.id) {
                    e.currentTarget.style.backgroundColor = '#fff';
                  }
                }}
              >
                {/* Photo thumbnail */}
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    flexShrink: 0,
                    backgroundColor: '#f0f0f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {cityPhotos[city.id] ? (
                    <img
                      src={cityPhotos[city.id]!.imageUrl}
                      alt={city.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div style={{ fontSize: '20px', color: '#ccc' }}>📍</div>
                  )}
                </div>

                {/* City info */}
                <div style={{ flex: 1, minWidth: 0, marginRight: '8px' }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {city.name}
                  </div>
                  {city.country && (
                    <div style={{ fontSize: '11px', color: '#666', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {city.country}
                    </div>
                  )}
                  <div
                    style={{
                      display: 'inline-block',
                      padding: '2px 6px',
                      borderRadius: '10px',
                      fontSize: '10px',
                      fontWeight: 500,
                      backgroundColor: categoryColors[city.category],
                      color: '#000',
                    }}
                  >
                    {city.category}
                  </div>
                </div>

                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCity(city.id);
                  }}
                  style={{
                    padding: '6px 10px',
                    border: 'none',
                    backgroundColor: '#ff4444',
                    color: '#fff',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 600,
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#cc0000';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ff4444';
                  }}
                  title="Remove city"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </>
  );
}

