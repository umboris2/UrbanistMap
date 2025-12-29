'use client';

import { useState, useEffect } from 'react';
import { Location } from '@/types';
import { fetchLocationPhoto } from '@/lib/locations';

interface LocationPopupProps {
  location: Location | null;
  onClose: () => void;
}

export default function LocationPopup({ location, onClose }: LocationPopupProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoLoading, setPhotoLoading] = useState(false);

  useEffect(() => {
    if (!location) {
      setPhotoUrl(null);
      return;
    }

    // Load photo if not already loaded
    if (!location.photoUrl) {
      setPhotoLoading(true);
      fetchLocationPhoto(location).then(url => {
        setPhotoUrl(url);
        setPhotoLoading(false);
      });
    } else {
      setPhotoUrl(location.photoUrl);
    }
  }, [location]);

  if (!location) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(10px)',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '80vh',
        overflowY: 'auto',
        zIndex: 2000,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          border: 'none',
          backgroundColor: 'transparent',
          fontSize: '24px',
          cursor: 'pointer',
          color: '#666',
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#f0f0f0';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        ×
      </button>

      {/* Photo */}
      {photoLoading ? (
        <div
          style={{
            width: '100%',
            height: '200px',
            backgroundColor: '#f0f0f0',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
            color: '#666',
          }}
        >
          Loading photo...
        </div>
      ) : photoUrl ? (
        <img
          src={photoUrl}
          alt={location.name}
          style={{
            width: '100%',
            height: '200px',
            objectFit: 'cover',
            borderRadius: '8px',
            marginBottom: '16px',
          }}
        />
      ) : null}

      {/* Title */}
      <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 600 }}>
        {location.name}
      </h2>

      {/* Address */}
      <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#666' }}>
        📍 {location.address}
      </p>

      {/* Description */}
      {location.description && (
        <p style={{ margin: '0 0 16px 0', fontSize: '15px', lineHeight: '1.6', color: '#333' }}>
          {location.description}
        </p>
      )}

      {/* Wikipedia link */}
      {location.wikipediaUrl && (
        <a
          href={location.wikipediaUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            backgroundColor: '#f5f5f5',
            borderRadius: '6px',
            textDecoration: 'none',
            color: '#333',
            fontSize: '14px',
            fontWeight: 500,
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
          <span>View on Wikipedia</span>
          <span style={{ marginLeft: 'auto' }}>↗</span>
        </a>
      )}
    </div>
  );
}

