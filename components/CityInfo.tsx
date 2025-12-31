'use client';

import { useState, useEffect } from 'react';
import { City } from '@/types';
import { fetchWeather, WeatherData } from '@/lib/weather';

interface CityInfoProps {
  city: City | null;
  isOpen: boolean;
  onToggle: () => void;
}

export default function CityInfo({ city, isOpen, onToggle }: CityInfoProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  useEffect(() => {
    if (!city) {
      setWeather(null);
      return;
    }

    const loadWeather = async () => {
      setWeatherLoading(true);
      try {
        const weatherData = await fetchWeather(city.lat, city.lng);
        setWeather(weatherData);
      } catch (error) {
        console.error('Error loading weather:', error);
        setWeather(null);
      } finally {
        setWeatherLoading(false);
      }
    };

    loadWeather();
  }, [city]);

  if (!city) return null;

  const wikipediaUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(city.name)}${city.country ? `,_${city.country.replace(/\s+/g, '_')}` : ''}`;
  const citySearchQuery = `${city.name}${city.country ? ` ${city.country}` : ''}`;
  const airbnbUrl = `https://www.airbnb.com/s/${encodeURIComponent(citySearchQuery)}/homes`;
  const googleMapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(citySearchQuery)}`;

  const iconButtonStyle = {
    width: '44px',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    textDecoration: 'none',
    fontSize: '24px',
    transition: 'all 0.2s',
    border: 'none',
    cursor: 'pointer',
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: isOpen ? '16px' : '-200px',
        left: '16px',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: '8px',
        padding: '16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        maxWidth: '320px',
        zIndex: 1000,
        transition: 'top 0.3s ease',
      }}
    >
      {/* Toggle button */}
      <button
        onClick={onToggle}
        style={{
          position: 'absolute',
          bottom: isOpen ? '-40px' : '-40px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '48px',
          height: '40px',
          borderRadius: '0 0 12px 12px',
          border: '2px solid #666',
          backgroundColor: '#666',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          color: '#fff',
          fontWeight: 'bold',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#555';
          e.currentTarget.style.transform = 'translateX(-50%) scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#666';
          e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
        }}
      >
        {isOpen ? '▼' : '▲'}
      </button>
      <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 600 }}>
        {city.name}
      </h2>
      {city.country && (
        <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#666' }}>
          {city.country}
        </p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* Icon Links Row */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <a
            href={wikipediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={iconButtonStyle}
            title="Wikipedia"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e0e0e0';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f5f5';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            📖
          </a>
          <a
            href={airbnbUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={iconButtonStyle}
            title="Airbnb"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e0e0e0';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f5f5';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            🏠
          </a>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={iconButtonStyle}
            title="Google Maps"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e0e0e0';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f5f5';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            🗺️
          </a>
          
          {/* Weather Box */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              backgroundColor: '#e3f2fd',
              borderRadius: '8px',
              fontSize: '14px',
              minWidth: '100px',
            }}
          >
            {weatherLoading ? (
              <span style={{ fontSize: '12px', color: '#666' }}>Loading...</span>
            ) : weather ? (
              <>
                <span style={{ fontSize: '20px' }}>{weather.icon}</span>
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <span style={{ fontWeight: 600, fontSize: '16px' }}>
                    {weather.temperature}°C
                  </span>
                  <span style={{ fontSize: '11px', color: '#666' }}>
                    {weather.condition}
                  </span>
                </div>
              </>
            ) : (
              <span style={{ fontSize: '12px', color: '#666' }}>No weather data</span>
            )}
          </div>
        </div>
        <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
          Coordinates: {city.lat.toFixed(4)}, {city.lng.toFixed(4)}
        </div>
      </div>
    </div>
  );
}

