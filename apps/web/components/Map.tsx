import React, { useState, useEffect } from 'react';

interface MapMarker {
  lat: number;
  lng: number;
  label?: string;
  color?: string;
}

interface MapProps {
  markers?: MapMarker[];
  center?: { lat: number; lng: number };
  zoom?: number;
  style?: React.CSSProperties;
  className?: string;
}

/**
 * Map component for displaying fleet locations and routes
 * Placeholder implementation - integrate Mapbox or Google Maps for production
 */
const Map: React.FC<MapProps> = ({ 
  markers = [], 
  center = { lat: 39.8283, lng: -98.5795 }, // Center of USA
  zoom = 4,
  style = {},
  className = '',
}) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Simulate map loading
    const timer = setTimeout(() => setIsLoaded(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const defaultStyle: React.CSSProperties = {
    width: '100%',
    height: '400px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    position: 'relative',
    overflow: 'hidden',
    ...style,
  };

  return (
    <div style={defaultStyle} className={className}>
      {!isLoaded ? (
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid rgba(255,255,255,0.3)',
            borderTop: '4px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '16px',
          }} />
          <p>Loading Map...</p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      ) : (
        <>
          <div style={{ 
            position: 'absolute', 
            top: '16px', 
            left: '16px',
            background: 'rgba(0,0,0,0.7)',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '12px',
          }}>
            <strong>Map Component</strong>
            <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px' }}>
              Center: {center.lat.toFixed(4)}, {center.lng.toFixed(4)} | Zoom: {zoom}
            </div>
          </div>

          {markers.length > 0 && (
            <div style={{
              position: 'absolute',
              bottom: '16px',
              left: '16px',
              background: 'rgba(0,0,0,0.7)',
              padding: '12px',
              borderRadius: '4px',
              fontSize: '12px',
              maxWidth: '200px',
            }}>
              <strong>Markers: {markers.length}</strong>
              <div style={{ marginTop: '8px', maxHeight: '100px', overflowY: 'auto' }}>
                {markers.slice(0, 5).map((marker, idx) => (
                  <div key={idx} style={{ fontSize: '11px', marginTop: '4px' }}>
                    📍 {marker.label || `Location ${idx + 1}`}
                  </div>
                ))}
                {markers.length > 5 && (
                  <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.7 }}>
                    +{markers.length - 5} more
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={{
            textAlign: 'center',
            background: 'rgba(255,255,255,0.1)',
            padding: '24px',
            borderRadius: '8px',
            backdropFilter: 'blur(10px)',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🗺️</div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>Map Integration Required</h3>
            <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>
              Install Mapbox or Google Maps for production mapping
            </p>
            <div style={{ 
              marginTop: '16px', 
              fontSize: '12px', 
              opacity: 0.7,
              fontFamily: 'monospace',
            }}>
              pnpm add react-map-gl mapbox-gl
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Map;
