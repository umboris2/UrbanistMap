'use client';

import { useState, useEffect } from 'react';
import { Photo } from '@/types';

interface PhotoStripProps {
  photos: Photo[];
  loading: boolean;
  onSearchChange: (query: string) => void;
  currentSearchQuery: string;
}

export default function PhotoStrip({ photos, loading, onSearchChange, currentSearchQuery }: PhotoStripProps) {
  const [searchInput, setSearchInput] = useState(currentSearchQuery || '');

  // Sync input with prop when it changes (e.g., when city changes)
  useEffect(() => {
    setSearchInput(currentSearchQuery || '');
  }, [currentSearchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange(searchInput.trim());
  };

  if (loading) {
    return (
      <div
        style={{
          position: 'absolute',
          bottom: '0',
          left: '0',
          right: '0',
          padding: '12px',
          textAlign: 'center',
          color: '#666',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
        }}
      >
        Loading photos...
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '0',
        left: '0',
        right: '0',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 -2px 8px rgba(0,0,0,0.1)',
        zIndex: 1000,
      }}
    >
      {/* Search Box */}
      <div style={{ padding: '12px', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="Search photos (e.g., streets, metro, architecture...)"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
          />
          <button
            type="submit"
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: '#4CAF50',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#45a049';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#4CAF50';
            }}
          >
            Search
          </button>
        </form>
        {currentSearchQuery && (
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            Showing: <strong>{currentSearchQuery}</strong>
          </div>
        )}
      </div>

      {/* Photo Gallery */}
      {photos.length === 0 && !loading ? (
        <div style={{ padding: '24px', textAlign: 'center', color: '#666' }}>
          {currentSearchQuery 
            ? `No photos found for "${currentSearchQuery}". Try a different search term.`
            : 'No photos found. Try searching for something specific (e.g., "streets", "metro", "architecture").'}
        </div>
      ) : photos.length > 0 ? (
        <div
          style={{
            display: 'flex',
            gap: '8px',
            padding: '12px',
            overflowX: 'auto',
          }}
        >
          {photos.map((photo, index) => (
            <a
              key={index}
              href={photo.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flexShrink: 0,
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <div
                style={{
                  width: '150px',
                  height: '100px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: '1px solid #e0e0e0',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                }}
              >
                <img
                  src={photo.imageUrl}
                  alt={photo.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              </div>
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}

