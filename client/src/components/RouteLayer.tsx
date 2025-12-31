import { useEffect, useState } from 'react';
import { Polyline } from 'react-leaflet';

interface RouteLayerProps {
  pickup: { lat: number; lon: number } | null;
  viaPoints?: Array<{ lat: number; lon: number; address: string }>;
  destination: { lat: number; lon: number } | null;
  color?: string;
  weight?: number;
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
      if (!pickup || !destination) {
        setRouteCoordinates([]);
        return;
      }

      setIsLoading(true);
      
      try {
        const waypoints: Array<{ lat: number; lon: number }> = [pickup];
        
        const validViaPoints = viaPoints.filter(
          via => via.lat !== 0 && via.lon !== 0 && via.address.trim() !== ''
        );
        
        waypoints.push(...validViaPoints.map(v => ({ lat: v.lat, lon: v.lon })));
        waypoints.push(destination);

        const response = await fetch('/api/route-geometry', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ waypoints }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch route');
        }
        
        const data = await response.json();
        
        if (data.success && data.coordinates && data.coordinates.length >= 2) {
          setRouteCoordinates(data.coordinates);
        } else {
          const fallbackCoords: Array<[number, number]> = waypoints.map(wp => [wp.lat, wp.lon]);
          setRouteCoordinates(fallbackCoords);
        }
      } catch (error) {
        console.error('Error fetching route:', error);
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
