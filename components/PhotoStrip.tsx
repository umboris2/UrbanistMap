'use client';

import { useState, useEffect } from 'react';
import { Photo } from '@/types';

interface PhotoStripProps {
  photos: Photo[];
  loading: boolean;
  onSearchChange: (query: string) => void;
  currentSearchQuery: string;
  isOpen: boolean;
  onToggle: () => void;
}

export default function PhotoStrip({ photos, loading, onSearchChange, currentSearchQuery, isOpen, onToggle }: PhotoStripProps) {
  const [searchInput, setSearchInput] = useState(currentSearchQuery || '');

  // Sync input with prop when it changes (e.g., when city changes)
  useEffect(() => {
    setSearchInput(currentSearchQuery || '');
  }, [currentSearchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange(searchInput.trim());
  };

  // Calculate max height based on content
  const maxHeight = isOpen ? (photos.length > 0 ? '300px' : '200px') : '0px';
  const bottom = isOpen ? '0' : '-300px';
  const panelHeight = photos.length > 0 ? 300 : 200;

  if (loading) {
    return (
      <div
        style={{
          position: 'absolute',
          bottom: bottom,
          left: '0',
          right: '0',
          padding: '12px',
          textAlign: 'center',
          color: '#666',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          transition: 'bottom 0.3s ease',
          zIndex: 1000,
        }}
      >
        Loading photos...
      </div>
    );
  }

  return (
    <>
      {/* Toggle button - always visible, fixed position */}
      <button
        onClick={onToggle}
        style={{
          position: 'fixed',
          bottom: isOpen ? `${panelHeight}px` : '0',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1001,
          width: '48px',
          height: '40px',
          borderRadius: '12px 12px 0 0',
          border: '2px solid #666',
          borderBottom: isOpen ? 'none' : '2px solid #666',
          backgroundColor: '#666',
          boxShadow: '0 -4px 12px rgba(0,0,0,0.3)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          color: '#fff',
          fontWeight: 'bold',
          transition: 'bottom 0.3s ease',
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
      <div
        style={{
          position: 'absolute',
          bottom: bottom,
          left: '0',
          right: '0',
          maxHeight: maxHeight,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 -2px 8px rgba(0,0,0,0.1)',
          zIndex: 1000,
          transition: 'bottom 0.3s ease, max-height 0.3s ease',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
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
    </>
  );
}

