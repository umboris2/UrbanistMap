'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { City, Category, Location } from '@/types';
import { normalizeCityName } from '@/lib/cityNameUtils';

interface MapViewProps {
  cities: City[];
  selectedCity: City | null;
  onCitySelect: (city: City) => void;
  locations: Location[];
  onLocationSelect: (location: Location) => void;
  citiesWithLocations: Set<string>;
  selectedLocation: Location | null;
}

const categoryColors: Record<Category, string> = {
  'Tier 1': '#FF6B6B',
  'Tier 2': '#3B82F6', // Blue
  'Tier 3': '#FFE66D',
  'Tier 4': '#95E1D3',
};


export default function MapView({ cities, selectedCity, onCitySelect, locations, onLocationSelect, citiesWithLocations, selectedLocation }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const locationMarkers = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!mapContainer.current) return;
    
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      console.error('Mapbox token not found. Please set NEXT_PUBLIC_MAPBOX_TOKEN in .env.local');
      if (mapContainer.current) {
        mapContainer.current.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #f5f5f5; color: #666; padding: 20px; text-align: center;">
            <div>
              <h3>Mapbox Token Required</h3>
              <p>Please set NEXT_PUBLIC_MAPBOX_TOKEN in your .env.local file</p>
            </div>
          </div>
        `;
      }
      return;
    }

    mapboxgl.accessToken = token;

    if (!map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [0, 20],
        zoom: 2,
      });

      map.current.on('load', () => {
        console.log('Map loaded successfully');
        
        // Enable transit layers in the map style
        // Mapbox Streets style includes transit layers that show at higher zoom levels
        if (map.current) {
          const style = map.current.getStyle();
          if (style && style.layers) {
            // Make transit layers more visible
            style.layers.forEach((layer: any) => {
              if (layer.id && (
                layer.id.includes('transit') || 
                layer.id.includes('rail') ||
                layer.id.includes('subway')
              )) {
                // Ensure transit layers are visible
                map.current!.setLayoutProperty(layer.id, 'visibility', 'visible');
                // Make them more prominent if it's a line layer
                if (layer.type === 'line') {
                  map.current!.setPaintProperty(layer.id, 'line-width', [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    10, 1,
                    15, 3
                  ]);
                }
              }
            });
          }
        }
      });

      map.current.on('error', (e) => {
        console.error('Map error:', e);
      });
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update markers when cities change
  useEffect(() => {
    if (!map.current) return;

    // Remove existing city markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Add new city markers
    cities.forEach(city => {
      const normalizedCityName = normalizeCityName(city.name);
      const hasLocations = citiesWithLocations.has(normalizedCityName);
      const color = categoryColors[city.category];
      
      // Create custom marker element - solid if has locations, hollow if not
      const el = document.createElement('div');
      el.style.width = '20px';
      el.style.height = '20px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = hasLocations ? color : 'transparent';
      el.style.border = `3px solid ${color}`;
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
      el.style.cursor = 'pointer';
      
      const marker = new mapboxgl.Marker(el)
        .setLngLat([city.lng, city.lat])
        .addTo(map.current!);

      marker.getElement().addEventListener('click', () => {
        onCitySelect(city);
      });

      markers.current.push(marker);
    });
  }, [cities, citiesWithLocations, onCitySelect]);

  // Update location markers when locations change
  useEffect(() => {
    if (!map.current) return;

    // Remove existing location markers
    locationMarkers.current.forEach(marker => marker.remove());
    locationMarkers.current = [];

    // Add new location markers (only show when a city is selected)
    if (selectedCity && locations.length > 0) {
      locations.forEach(location => {
        // Create a custom marker element
        const el = document.createElement('div');
        el.className = 'location-marker';
        el.style.width = '20px';
        el.style.height = '20px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = '#9C27B0';
        el.style.border = '3px solid white';
        el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
        el.style.cursor = 'pointer';

        const marker = new mapboxgl.Marker(el)
          .setLngLat([location.lng, location.lat])
          .addTo(map.current!);

        marker.getElement().addEventListener('click', () => {
          onLocationSelect(location);
        });

        locationMarkers.current.push(marker);
      });
    }
  }, [locations, selectedCity, onLocationSelect]);

  // Fly to selected city
  useEffect(() => {
    if (!map.current || !selectedCity) return;

    map.current.flyTo({
      center: [selectedCity.lng, selectedCity.lat],
      zoom: 10,
      duration: 1500,
    });
  }, [selectedCity]);

  // Fly to selected location
  useEffect(() => {
    if (!map.current || !selectedLocation) return;

    map.current.flyTo({
      center: [selectedLocation.lng, selectedLocation.lat],
      zoom: 15,
      duration: 1500,
    });
  }, [selectedLocation]);

  return (
    <div
      ref={mapContainer}
      style={{
        width: '100%',
        height: '100vh',
        position: 'relative',
        maxWidth: '100%',
        overflow: 'hidden',
      }}
    />
  );
}

