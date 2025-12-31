import { useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { RouteLayer } from './RouteLayer';

interface RouteMapProps {
  fromCoords: { lat: number; lon: number } | null;
  toCoords: { lat: number; lon: number } | null;
  viaCoords?: { [key: number]: { lat: number; lon: number } } | null;
  viaPoints?: string[];
  height?: string;
  className?: string;
}

const createMarkerIcon = (color: string, label: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
      ">
        <div style="
          width: 24px;
          height: 24px;
          background-color: ${color};
          border: 2px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          font-size: 12px;
          font-weight: bold;
          color: white;
        ">${label}</div>
        <div style="
          width: 2px;
          height: 8px;
          background-color: ${color};
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        "></div>
      </div>
    `,
    iconSize: [24, 34],
    iconAnchor: [12, 34],
  });
};

function MapBoundsUpdater({ 
  fromCoords, 
  toCoords, 
  viaCoords 
}: { 
  fromCoords: { lat: number; lon: number } | null; 
  toCoords: { lat: number; lon: number } | null;
  viaCoords?: { [key: number]: { lat: number; lon: number } } | null;
}) {
  const map = useMap();
  
  useEffect(() => {
    const points: [number, number][] = [];
    
    if (fromCoords) {
      points.push([fromCoords.lat, fromCoords.lon]);
    }
    
    if (viaCoords) {
      Object.values(viaCoords).forEach(coord => {
        if (coord.lat && coord.lon) {
          points.push([coord.lat, coord.lon]);
        }
      });
    }
    
    if (toCoords) {
      points.push([toCoords.lat, toCoords.lon]);
    }
    
    if (points.length >= 2) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { 
        padding: [30, 30],
        maxZoom: 14
      });
    } else if (points.length === 1) {
      map.setView(points[0], 13);
    }
  }, [map, fromCoords, toCoords, viaCoords]);
  
  return null;
}

export function RouteMap({ 
  fromCoords, 
  toCoords, 
  viaCoords,
  viaPoints = [],
  height = '180px',
  className = ''
}: RouteMapProps) {
  const defaultCenter: [number, number] = [29.7604, -95.3698];
  
  const fromMarkerIcon = useMemo(() => createMarkerIcon('#22c55e', 'A'), []);
  const toMarkerIcon = useMemo(() => createMarkerIcon('#ef4444', 'B'), []);
  
  const viaPointsForRoute = useMemo(() => {
    if (!viaCoords) return [];
    return viaPoints
      .map((address, index) => {
        const coords = viaCoords[index];
        if (coords && address.trim()) {
          return { lat: coords.lat, lon: coords.lon, address };
        }
        return null;
      })
      .filter(Boolean) as Array<{ lat: number; lon: number; address: string }>;
  }, [viaCoords, viaPoints]);
  
  const viaMarkerIcons = useMemo(() => {
    return viaPointsForRoute.map((_, index) => 
      createMarkerIcon('#3b82f6', String(index + 1))
    );
  }, [viaPointsForRoute.length]);
  
  if (!fromCoords && !toCoords) {
    return (
      <div 
        className={`bg-muted rounded-lg flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <p className="text-muted-foreground text-sm">Map preview will appear here</p>
      </div>
    );
  }
  
  return (
    <div className={`rounded-lg overflow-hidden ${className}`} style={{ height }}>
      <MapContainer
        center={fromCoords ? [fromCoords.lat, fromCoords.lon] : defaultCenter}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        scrollWheelZoom={false}
        dragging={false}
        doubleClickZoom={false}
        touchZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapBoundsUpdater 
          fromCoords={fromCoords} 
          toCoords={toCoords}
          viaCoords={viaCoords}
        />
        
        {fromCoords && (
          <Marker 
            position={[fromCoords.lat, fromCoords.lon]}
            icon={fromMarkerIcon}
          />
        )}
        
        {viaPointsForRoute.map((via, index) => (
          <Marker
            key={`via-${index}`}
            position={[via.lat, via.lon]}
            icon={viaMarkerIcons[index]}
          />
        ))}
        
        {toCoords && (
          <Marker 
            position={[toCoords.lat, toCoords.lon]}
            icon={toMarkerIcon}
          />
        )}
        
        <RouteLayer
          pickup={fromCoords}
          viaPoints={viaPointsForRoute}
          destination={toCoords}
          color="#3b82f6"
          weight={4}
        />
      </MapContainer>
    </div>
  );
}
