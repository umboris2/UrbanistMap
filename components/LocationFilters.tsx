'use client';

import { Location } from '@/types';

interface LocationFiltersProps {
  locations: Location[];
  selectedCategories: Set<string>;
  onCategoryToggle: (category: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export default function LocationFilters({ locations, selectedCategories, onCategoryToggle, isOpen, onToggle }: LocationFiltersProps) {
  // Get unique categories from locations
  const categories = Array.from(new Set(locations.map(loc => loc.category).filter(Boolean))).sort();

  if (categories.length === 0) return null;

  return (
    <>
      {/* Toggle button - always visible, fixed position */}
      <button
        onClick={onToggle}
        style={{
          position: 'fixed',
          right: isOpen ? '266px' : '16px',
          top: '50%',
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
          top: '16px',
          right: isOpen ? '16px' : '-350px',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '8px',
          padding: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          zIndex: 1000,
          maxWidth: '250px',
          transition: 'right 0.3s ease',
        }}
      >
      <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: '#666' }}>
        Filter Locations
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {categories.map(category => {
          const isChecked = selectedCategories.has(category);
          const count = locations.filter(loc => loc.category === category).length;
          
          return (
            <label
              key={category}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                userSelect: 'none',
              }}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => onCategoryToggle(category)}
                style={{
                  width: '16px',
                  height: '16px',
                  cursor: 'pointer',
                }}
              />
              <span style={{ flex: 1 }}>{category}</span>
              <span style={{ fontSize: '11px', color: '#999' }}>({count})</span>
            </label>
          );
        })}
      </div>
      </div>
    </>
  );
}

