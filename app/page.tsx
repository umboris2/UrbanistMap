'use client';

import { useState, useEffect } from 'react';
import MapView from '@/components/MapView';
import Sidebar from '@/components/Sidebar';
import CityInfo from '@/components/CityInfo';
import PhotoStrip from '@/components/PhotoStrip';
import LocationPopup from '@/components/LocationPopup';
import LocationFilters from '@/components/LocationFilters';
import { City, Photo, Location } from '@/types';
import { loadCities } from '@/lib/storage';
import { loadLocationsForCity } from '@/lib/locations';

export default function Home() {
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [photoSearchQuery, setPhotoSearchQuery] = useState('');
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    setCities(loadCities());
  }, []);

  // Load locations when city is selected
  useEffect(() => {
    if (selectedCity) {
      setLocationsLoading(true);
      loadLocationsForCity(selectedCity.name)
        .then(loadedLocations => {
          setLocations(loadedLocations);
          setLocationsLoading(false);
          // Default: no categories selected (shows all)
          setSelectedCategories(new Set());
        })
        .catch(error => {
          console.error('Error loading locations:', error);
          setLocations([]);
          setLocationsLoading(false);
        });
    } else {
      setLocations([]);
      setSelectedCategories(new Set());
    }
    setSelectedLocation(null);
  }, [selectedCity]);

  // Reset search query when city changes
  useEffect(() => {
    setPhotoSearchQuery('');
  }, [selectedCity?.id]);

  const handlePhotoSearchChange = (query: string) => {
    setPhotoSearchQuery(query);
  };

  const handleLocationSelect = (location: Location) => {
    setSelectedLocation(location);
  };

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  // Filter locations by selected categories
  // If no categories selected, show all locations
  // If categories selected, only show those categories
  const filteredLocations = selectedCategories.size === 0
    ? locations
    : locations.filter(loc => selectedCategories.has(loc.category));

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar 
        onCitySelect={setSelectedCity} 
        selectedCity={selectedCity}
        cities={cities}
        onCitiesChange={setCities}
        onPhotosChange={setPhotos}
        onPhotosLoadingChange={setPhotosLoading}
        onPhotoSearchChange={handlePhotoSearchChange}
        photoSearchQuery={photoSearchQuery}
      />
      <div style={{ marginLeft: '320px', width: 'calc(100% - 320px)', height: '100vh', position: 'relative' }}>
        <MapView
          cities={cities}
          selectedCity={selectedCity}
          onCitySelect={setSelectedCity}
          locations={filteredLocations}
          onLocationSelect={handleLocationSelect}
        />
        <CityInfo city={selectedCity} />
        {selectedCity && locations.length > 0 && (
          <LocationFilters
            locations={locations}
            selectedCategories={selectedCategories}
            onCategoryToggle={handleCategoryToggle}
          />
        )}
        {selectedCity && (
          <PhotoStrip 
            photos={photos} 
            loading={photosLoading}
            onSearchChange={handlePhotoSearchChange}
            currentSearchQuery={photoSearchQuery}
          />
        )}
        {selectedLocation && (
          <>
            <LocationPopup 
              location={selectedLocation} 
              onClose={() => setSelectedLocation(null)}
            />
            {/* Backdrop */}
            <div
              onClick={() => setSelectedLocation(null)}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 1500,
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}

