'use client';

import { Location } from '@/types';

interface LocationListProps {
  locations: Location[];
  selectedCategories: Set<string>;
  onLocationSelect: (location: Location) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export default function LocationList({ locations, selectedCategories, onLocationSelect, isOpen, onToggle }: LocationListProps) {
  // Filter locations by selected categories
  // If no categories selected, show all locations
  // If categories selected, only show those categories
  const filteredLocations = selectedCategories.size === 0
    ? locations
    : locations.filter(loc => selectedCategories.has(loc.category));

  if (locations.length === 0) return null;

  return (
    <>
      {/* Toggle button - always visible, fixed position */}
      <button
        onClick={onToggle}
        style={{
          position: 'fixed',
          right: isOpen ? '266px' : '16px',
          top: 'calc(50% + 120px)', // Position below the category filter button
          transform: 'translateY(-50%)',
          zIndex: 1001,
          width: '48px',
          height: '64px',
          borderRadius: '12px 0 0 12px',
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
          transition: 'right 0.3s ease',
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
        {isOpen ? '→' : '←'}
      </button>
      <div
        style={{
          position: 'absolute',
          top: '340px', // Position well below the filter box (starts at 16px, filter box ~150-200px tall, plus gap)
          right: isOpen ? '16px' : '-350px',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '8px',
          padding: '10px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          zIndex: 1000,
          maxWidth: '250px',
          width: '250px',
          maxHeight: 'calc(100vh - 360px)',
          overflowY: 'auto',
          transition: 'right 0.3s ease',
          boxSizing: 'border-box',
          pointerEvents: isOpen ? 'auto' : 'none',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: '#666', flexShrink: 0 }}>
          Locations ({filteredLocations.length})
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', flex: 1, minHeight: 0 }}>
          {filteredLocations.length === 0 ? (
            <div style={{ fontSize: '12px', color: '#999', padding: '8px', textAlign: 'center' }}>
              No locations match filters
            </div>
          ) : (
            filteredLocations.map(location => (
              <button
                key={location.id}
                onClick={() => onLocationSelect(location)}
                style={{
                  padding: '8px 10px',
                  backgroundColor: 'transparent',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '11px',
                  color: '#333',
                  transition: 'all 0.2s',
                  lineHeight: '1.4',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  minHeight: 'auto',
                  width: '100%',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                  e.currentTarget.style.borderColor = '#9C27B0';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = '#e0e0e0';
                }}
                title={location.name}
              >
                {location.name}
              </button>
            ))
          )}
        </div>
      </div>
    </>
  );
}

