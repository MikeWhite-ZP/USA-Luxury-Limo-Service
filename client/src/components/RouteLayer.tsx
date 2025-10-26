import { useEffect, useState } from 'react';
import { Polyline } from 'react-leaflet';
import L from 'leaflet';

interface RouteLayerProps {
  pickup: { lat: number; lon: number } | null;
  viaPoints?: Array<{ lat: number; lon: number; address: string }>;
  destination: { lat: number; lon: number } | null;
  color?: string;
  weight?: number;
}

interface RouteCoordinate {
  lat: number;
  lon: number;
}

export function RouteLayer({ 
  pickup, 
  viaPoints = [], 
  destination, 
  color = '#3b82f6',
  weight = 4 
}: RouteLayerProps) {
  const [routeCoordinates, setRouteCoordinates] = useState<Array<[number, number]>>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchRoute = async () => {
      // Need at least pickup and destination
      if (!pickup || !destination) {
        setRouteCoordinates([]);
        return;
      }

      setIsLoading(true);
      
      try {
        // Build waypoints array: pickup -> via points -> destination
        const waypoints: RouteCoordinate[] = [pickup];
        
        // Filter out invalid via points (with 0,0 coordinates)
        const validViaPoints = viaPoints.filter(
          via => via.lat !== 0 && via.lon !== 0 && via.address.trim() !== ''
        );
        
        waypoints.push(...validViaPoints.map(v => ({ lat: v.lat, lon: v.lon })));
        waypoints.push(destination);

        // Build OSRM API URL
        // Format: lon,lat;lon,lat;...
        const coordinates = waypoints
          .map(point => `${point.lon},${point.lat}`)
          .join(';');
        
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`;
        
        const response = await fetch(osrmUrl);
        
        if (!response.ok) {
          throw new Error('Failed to fetch route');
        }
        
        const data = await response.json();
        
        if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
          throw new Error('No route found');
        }
        
        // Extract coordinates from GeoJSON
        const routeGeometry = data.routes[0].geometry;
        
        if (routeGeometry.type === 'LineString') {
          // Convert from [lon, lat] to [lat, lon] for Leaflet
          const coords: Array<[number, number]> = routeGeometry.coordinates.map(
            (coord: number[]) => [coord[1], coord[0]]
          );
          setRouteCoordinates(coords);
        }
      } catch (error) {
        console.error('Error fetching route:', error);
        // Fallback to straight lines if routing fails
        const fallbackCoords: Array<[number, number]> = [];
        if (pickup) fallbackCoords.push([pickup.lat, pickup.lon]);
        
        viaPoints
          .filter(via => via.lat !== 0 && via.lon !== 0 && via.address.trim() !== '')
          .forEach(via => fallbackCoords.push([via.lat, via.lon]));
        
        if (destination) fallbackCoords.push([destination.lat, destination.lon]);
        
        setRouteCoordinates(fallbackCoords);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoute();
  }, [pickup, viaPoints, destination]);

  if (routeCoordinates.length < 2) {
    return null;
  }

  return (
    <Polyline 
      positions={routeCoordinates}
      pathOptions={{ 
        color: color,
        weight: weight,
        opacity: isLoading ? 0.5 : 0.8,
        lineJoin: 'round',
        lineCap: 'round'
      }}
    />
  );
}
