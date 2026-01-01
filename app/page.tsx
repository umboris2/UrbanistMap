'use client';

import { useState, useEffect } from 'react';
import MapView from '@/components/MapView';
import Sidebar from '@/components/Sidebar';
import CityInfo from '@/components/CityInfo';
import PhotoStrip from '@/components/PhotoStrip';
import LocationPopup from '@/components/LocationPopup';
import LocationFilters from '@/components/LocationFilters';
import LocationList from '@/components/LocationList';
import { City, Photo, Location } from '@/types';
import { loadCities, saveCities } from '@/lib/storage';
import { loadLocationsForCity } from '@/lib/locations';
import { loadPreloadCities } from '@/lib/preloadCities';
import { getCitiesWithLocations } from '@/lib/cityLocations';
import { normalizeCityName } from '@/lib/cityNameUtils';

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
  const [citiesWithLocations, setCitiesWithLocations] = useState<Set<string>>(new Set());
  
  // Mobile panel states - start with only sidebar open
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [photoStripOpen, setPhotoStripOpen] = useState(false);
  const [locationFiltersOpen, setLocationFiltersOpen] = useState(false);
  const [locationListOpen, setLocationListOpen] = useState(false);
  const [cityInfoOpen, setCityInfoOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size - only on client side
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    // Check immediately
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Auto-open/close panels when city is selected
  useEffect(() => {
    if (selectedCity) {
      // Close sidebar, open other panels
      setSidebarOpen(false);
      setCityInfoOpen(true);
      setPhotoStripOpen(true);
    } else {
      // Reset to initial state when no city selected
      setSidebarOpen(true);
      setCityInfoOpen(false);
      setPhotoStripOpen(false);
      setLocationFiltersOpen(false);
      setLocationListOpen(false);
    }
  }, [selectedCity?.id]); // Only trigger when city ID changes

  useEffect(() => {
    // Load cities on mount
    const loadInitialCities = async () => {
      const loadedCities = loadCities();
      console.log('[page.tsx] App initialized, loaded cities from localStorage:', loadedCities.length);
      
      // Only preload from CSV if localStorage is empty (first launch)
      if (loadedCities.length === 0) {
        console.log('[page.tsx] No cities in localStorage, loading from City Preload.csv...');
        try {
          const preloadCities = await loadPreloadCities();
          if (preloadCities.length > 0) {
            console.log(`[page.tsx] ✓ Successfully loaded ${preloadCities.length} cities from CSV preload`);
            setCities(preloadCities);
            saveCities(preloadCities);
          } else {
            console.warn('[page.tsx] ⚠ No cities were loaded from CSV preload. Check console for errors.');
            setCities([]);
          }
        } catch (error) {
          console.error('[page.tsx] Error during preload:', error);
          setCities([]);
        }
      } else {
        // User already has cities, just use what's in localStorage
        console.log(`[page.tsx] Found ${loadedCities.length} cities in localStorage, skipping CSV preload`);
        setCities(loadedCities);
      }
      
      // Load which cities have locations
      const citiesWithLocs = await getCitiesWithLocations();
      setCitiesWithLocations(citiesWithLocs);

      // Test localStorage is working
      try {
        const testKey = 'urbanist-map-test';
        localStorage.setItem(testKey, 'test');
        const testValue = localStorage.getItem(testKey);
        localStorage.removeItem(testKey);
        if (testValue !== 'test') {
          console.error('localStorage test failed - storage may not be working');
        } else {
          console.log('localStorage is working correctly');
        }
      } catch (error) {
        console.error('localStorage is not available:', error);
      }
    };
    
    loadInitialCities();
  }, []);

  // Load locations when city is selected
  useEffect(() => {
    if (selectedCity) {
      console.log(`[page.tsx] Loading locations for city: "${selectedCity.name}" (id: ${selectedCity.id})`);
      setLocationsLoading(true);
      // Pass city coordinates to bias geocoding results toward the correct city
      loadLocationsForCity(selectedCity.name, [selectedCity.lng, selectedCity.lat])
        .then(loadedLocations => {
          console.log(`[page.tsx] Loaded ${loadedLocations.length} locations for "${selectedCity.name}"`);
          setLocations(loadedLocations);
          setLocationsLoading(false);
          // Default: no categories selected (shows all)
          setSelectedCategories(new Set());
          // Open location filters and list if locations exist
          if (loadedLocations.length > 0) {
            setLocationFiltersOpen(true);
            setLocationListOpen(true);
            // Mark this city as having locations so markers render solid
            setCitiesWithLocations(prev => {
              const next = new Set(prev);
              next.add(normalizeCityName(selectedCity.name));
              return next;
            });
          }
        })
        .catch(error => {
          console.error('[page.tsx] Error loading locations:', error);
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
    // MapView will handle flying to the location via selectedLocation prop
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
    <div style={{ 
      display: 'flex', 
      height: '100vh', 
      width: '100vw',
      overflow: 'hidden',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      margin: 0,
      padding: 0,
    }}>
      <Sidebar 
        onCitySelect={setSelectedCity} 
        selectedCity={selectedCity}
        cities={cities}
        onCitiesChange={setCities}
        onPhotosChange={setPhotos}
        onPhotosLoadingChange={setPhotosLoading}
        onPhotoSearchChange={handlePhotoSearchChange}
        photoSearchQuery={photoSearchQuery}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        citiesWithLocations={citiesWithLocations}
      />
      <div 
        style={{ 
          flex: 1,
          height: '100vh', 
          width: '100%',
          position: 'relative',
          overflow: 'hidden',
          minWidth: 0,
        }}
      >
        {/* Backdrop for mobile sidebar */}
        {sidebarOpen && isMobile && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 999,
            }}
          />
        )}
        <MapView
          cities={cities}
          selectedCity={selectedCity}
          onCitySelect={setSelectedCity}
          locations={filteredLocations}
          onLocationSelect={handleLocationSelect}
          citiesWithLocations={citiesWithLocations}
          selectedLocation={selectedLocation}
        />
        <CityInfo 
          city={selectedCity} 
          isOpen={cityInfoOpen}
          onToggle={() => setCityInfoOpen(!cityInfoOpen)}
        />
        {selectedCity && locations.length > 0 && (
          <>
            <LocationFilters
              locations={locations}
              selectedCategories={selectedCategories}
              onCategoryToggle={handleCategoryToggle}
              isOpen={locationFiltersOpen}
              onToggle={() => setLocationFiltersOpen(!locationFiltersOpen)}
            />
            <LocationList
              locations={locations}
              selectedCategories={selectedCategories}
              onLocationSelect={handleLocationSelect}
              isOpen={locationListOpen}
              onToggle={() => setLocationListOpen(!locationListOpen)}
            />
          </>
        )}
        {selectedCity && (
          <PhotoStrip 
            photos={photos} 
            loading={photosLoading}
            onSearchChange={handlePhotoSearchChange}
            currentSearchQuery={photoSearchQuery}
            isOpen={photoStripOpen}
            onToggle={() => setPhotoStripOpen(!photoStripOpen)}
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
