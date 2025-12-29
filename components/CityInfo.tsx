'use client';

import { useState, useEffect } from 'react';
import { City } from '@/types';
import { fetchWeather, WeatherData } from '@/lib/weather';

interface CityInfoProps {
  city: City | null;
}

export default function CityInfo({ city }: CityInfoProps) {
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

  return (
    <div
      style={{
        position: 'absolute',
        top: '16px',
        left: '16px',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: '8px',
        padding: '16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        maxWidth: '320px',
        zIndex: 1000,
      }}
    >
      <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 600 }}>
        {city.name}
      </h2>
      {city.country && (
        <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#666' }}>
          {city.country}
        </p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <a
            href={wikipediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '8px 12px',
              backgroundColor: '#f5f5f5',
              borderRadius: '4px',
              textDecoration: 'none',
              color: '#333',
              fontSize: '14px',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e0e0e0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f5f5';
            }}
          >
            <span>📖</span>
            <span>Wikipedia</span>
            <span style={{ marginLeft: 'auto' }}>↗</span>
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
              borderRadius: '4px',
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

