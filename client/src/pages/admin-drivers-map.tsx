import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { Icon, LatLng, divIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, MapPin, Phone, Mail, Star, Clock, Navigation } from 'lucide-react';
import { AdminNav } from '@/components/AdminNav';

// Custom Car Marker Component
const CarIcon = ({ color }: { color: string }) => {
  const svgIcon = `
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
          <feOffset dx="0" dy="2" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.3"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <g filter="url(#shadow)">
        <path d="M8 14 L10 10 L22 10 L24 14 Z" fill="${color}" stroke="white" stroke-width="1.5"/>
        <path d="M6 14 L7 18 L7 20 C7 20.5 7.5 21 8 21 L9 21 C9.5 21 10 20.5 10 20 L10 19 L22 19 L22 20 C22 20.5 22.5 21 23 21 L24 21 C24.5 21 25 20.5 25 20 L25 18 L26 14 L6 14 Z" fill="${color}" stroke="white" stroke-width="1.5"/>
        <circle cx="10" cy="18" r="1.5" fill="white"/>
        <circle cx="22" cy="18" r="1.5" fill="white"/>
        <rect x="12" y="11" width="3" height="2.5" fill="rgba(255,255,255,0.3)" rx="0.5"/>
        <rect x="17" y="11" width="3" height="2.5" fill="rgba(255,255,255,0.3)" rx="0.5"/>
      </g>
    </svg>
  `;
  
  return divIcon({
    html: svgIcon,
    className: 'custom-car-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

// Component to handle map centering
function MapController({ center, zoom }: { center: [number, number] | null; zoom: number }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom, { duration: 1 });
    }
  }, [center, zoom, map]);
  
  return null;
}

interface DriverLocation {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  profileImageUrl: string | null;
  isActive: boolean;
  latitude: string | null;
  longitude: string | null;
  lastLocationUpdate: Date | null;
  driverId: string | null;
  rating: string | null;
  totalRides: number | null;
  isAvailable: boolean | null;
  status: string;
  statusColor: string;
  currentBooking: any | null;
}

export default function AdminDriversMap() {
  const [selectedDriver, setSelectedDriver] = useState<DriverLocation | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [mapZoom, setMapZoom] = useState(12);
  const [refreshInterval, setRefreshInterval] = useState(60000); // 60 seconds default

  // Fetch driver locations
  const { data: drivers = [], isLoading, refetch } = useQuery<DriverLocation[]>({
    queryKey: ['/api/drivers/locations'],
    refetchInterval: refreshInterval,
  });

  // Determine if any driver is on duty
  useEffect(() => {
    const hasOnDutyDriver = drivers.some(d => 
      d.status === 'on_the_way' || d.status === 'customer_in_car' ||
      (d.currentBooking && ['confirmed', 'on_the_way', 'arrived', 'on_board', 'in_progress'].includes(d.currentBooking.status))
    );
    
    // Set refresh interval: 30s if any driver on duty, 60s otherwise
    setRefreshInterval(hasOnDutyDriver ? 30000 : 60000);
  }, [drivers]);

  // Set default map center on first load
  useEffect(() => {
    if (drivers.length > 0 && !mapCenter) {
      const firstDriverWithLocation = drivers.find(d => d.latitude && d.longitude);
      if (firstDriverWithLocation && firstDriverWithLocation.latitude && firstDriverWithLocation.longitude) {
        setMapCenter([
          parseFloat(firstDriverWithLocation.latitude),
          parseFloat(firstDriverWithLocation.longitude)
        ]);
      } else {
        // Default to New York if no driver has location
        setMapCenter([40.7128, -74.0060]);
      }
    }
  }, [drivers, mapCenter]);

  const handleDriverClick = (driver: DriverLocation) => {
    setSelectedDriver(driver);
    if (driver.latitude && driver.longitude) {
      setMapCenter([parseFloat(driver.latitude), parseFloat(driver.longitude)]);
      setMapZoom(15);
    }
  };

  const getStatusBadge = (status: string, color: string) => {
    const statusLabels: Record<string, string> = {
      // Frontend-generated statuses
      'online': 'Online',
      'offline': 'Offline',
      'on_the_way': 'On the Way',
      'customer_in_car': 'Customer in Car',
      // Booking statuses (raw backend values as fallback)
      'pending': 'Pending',
      'pending_driver_acceptance': 'Awaiting Driver',
      'confirmed': 'Confirmed',
      'arrived': 'Arrived',
      'on_board': 'Passenger On Board',
      'in_progress': 'In Progress',
      'completed': 'Completed',
      'cancelled': 'Cancelled',
    };

    const colorClasses: Record<string, string> = {
      'green': 'bg-gradient-to-r from-green-500 to-emerald-600 text-white',
      'grey': 'bg-gradient-to-r from-slate-400 to-slate-500 text-white',
      'black': 'bg-gradient-to-r from-slate-800 to-slate-900 text-white',
      'red': 'bg-gradient-to-r from-red-500 to-rose-600 text-white',
    };

    return (
      <Badge className={`${colorClasses[color] || 'bg-slate-200 text-slate-700'} border-0 font-bold shadow-md`}>
        {statusLabels[status] || status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </Badge>
    );
  };

  const getTimeAgo = (date: Date | null) => {
    if (!date) return 'Never';
    
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (isLoading && drivers.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AdminNav />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">Loading drivers map...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminNav />
      <div className="flex h-[calc(100vh-80px)] bg-slate-50">
        {/* Sidebar - Driver List */}
        <div className="w-96 bg-white border-r-2 border-slate-200 shadow-lg overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 z-10 border-b-2 border-slate-700">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Navigation className="w-6 h-6" />
            Drivers Map
          </h1>
          <p className="text-slate-300 text-sm mt-2">
            {drivers.length} {drivers.length === 1 ? 'driver' : 'drivers'} total
          </p>
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            <span>Auto-refresh every {refreshInterval / 1000}s</span>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {drivers.map((driver) => {
            const driverName = `${driver.firstName || ''} ${driver.lastName || ''}`.trim() || 'Unknown Driver';
            const initial = (driver.firstName?.[0] || driver.lastName?.[0] || 'D').toUpperCase();

            return (
              <Card
                key={driver.userId}
                className={`p-4 cursor-pointer hover:shadow-xl hover:border-blue-300 transition-all duration-300 ${
                  selectedDriver?.userId === driver.userId ? 'border-2 border-blue-500 shadow-lg' : 'border-2 border-slate-200'
                }`}
                onClick={() => handleDriverClick(driver)}
                data-testid={`driver-card-${driver.userId}`}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="w-12 h-12 ring-2 ring-slate-200">
                    <AvatarImage src={driver.profileImageUrl || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold">
                      {initial}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-slate-900 truncate">{driverName}</h3>
                      {getStatusBadge(driver.status, driver.statusColor)}
                    </div>

                    {driver.rating && parseFloat(driver.rating) > 0 && (
                      <div className="flex items-center gap-1 text-sm text-slate-600 mb-2">
                        <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">{parseFloat(driver.rating).toFixed(1)}</span>
                        <span className="text-xs text-slate-400">({driver.totalRides || 0} rides)</span>
                      </div>
                    )}

                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-2">
                      <Clock className="w-3 h-3" />
                      <span>Updated {getTimeAgo(driver.lastLocationUpdate)}</span>
                    </div>

                    {driver.currentBooking && (
                      <div className="mt-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-xs font-semibold text-blue-900">Active Booking</p>
                        <p className="text-xs text-blue-700 truncate mt-1">
                          <MapPin className="w-3 h-3 inline mr-1" />
                          {driver.currentBooking.pickupAddress}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}

          {drivers.length === 0 && (
            <div className="text-center py-12">
              <Navigation className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">No drivers found</p>
              <p className="text-slate-400 text-sm mt-2">Drivers will appear here when they go online</p>
            </div>
          )}
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative">
        {mapCenter ? (
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            style={{ height: '100%', width: '100%' }}
            className="z-0"
            data-testid="drivers-map"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <MapController center={mapCenter} zoom={mapZoom} />

            {/* Driver Markers */}
            {drivers.map((driver) => {
              if (!driver.latitude || !driver.longitude) return null;

              const position: [number, number] = [
                parseFloat(driver.latitude),
                parseFloat(driver.longitude)
              ];

              const colorMap: Record<string, string> = {
                'green': '#10b981',
                'grey': '#94a3b8',
                'black': '#1e293b',
                'red': '#ef4444',
              };

              const driverName = `${driver.firstName || ''} ${driver.lastName || ''}`.trim() || 'Unknown Driver';

              return (
                <Marker
                  key={driver.userId}
                  position={position}
                  icon={CarIcon({ color: colorMap[driver.statusColor] || '#94a3b8' })}
                  eventHandlers={{
                    click: () => handleDriverClick(driver),
                  }}
                >
                  <Popup>
                    <div className="p-2 min-w-[200px]">
                      <h3 className="font-bold text-slate-900 mb-2">{driverName}</h3>
                      {getStatusBadge(driver.status, driver.statusColor)}
                      {driver.phone && (
                        <p className="text-sm text-slate-600 mt-2 flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" />
                          {driver.phone}
                        </p>
                      )}
                      {driver.currentBooking && (
                        <div className="mt-2 pt-2 border-t border-slate-200">
                          <p className="text-xs font-semibold text-slate-700">Active Booking:</p>
                          <p className="text-xs text-slate-600 mt-1">{driver.currentBooking.pickupAddress}</p>
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* Show pickup/dropoff markers for selected driver */}
            {selectedDriver?.currentBooking && (
              <>
                {selectedDriver.currentBooking.pickupLat && selectedDriver.currentBooking.pickupLon && (
                  <Marker
                    position={[
                      parseFloat(selectedDriver.currentBooking.pickupLat),
                      parseFloat(selectedDriver.currentBooking.pickupLon)
                    ]}
                    icon={new Icon({
                      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
                      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                      iconSize: [25, 41],
                      iconAnchor: [12, 41],
                      popupAnchor: [1, -34],
                      shadowSize: [41, 41]
                    })}
                  >
                    <Popup>
                      <div className="p-2">
                        <h3 className="font-bold text-green-700">Pickup Location</h3>
                        <p className="text-sm">{selectedDriver.currentBooking.pickupAddress}</p>
                      </div>
                    </Popup>
                  </Marker>
                )}

                {selectedDriver.currentBooking.destinationLat && selectedDriver.currentBooking.destinationLon && (
                  <>
                    <Marker
                      position={[
                        parseFloat(selectedDriver.currentBooking.destinationLat),
                        parseFloat(selectedDriver.currentBooking.destinationLon)
                      ]}
                      icon={new Icon({
                        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                        iconSize: [25, 41],
                        iconAnchor: [12, 41],
                        popupAnchor: [1, -34],
                        shadowSize: [41, 41]
                      })}
                    >
                      <Popup>
                        <div className="p-2">
                          <h3 className="font-bold text-red-700">Dropoff Location</h3>
                          <p className="text-sm">{selectedDriver.currentBooking.destinationAddress}</p>
                        </div>
                      </Popup>
                    </Marker>

                    {/* Draw line from pickup to dropoff */}
                    {selectedDriver.currentBooking.pickupLat && selectedDriver.currentBooking.pickupLon && (
                      <Polyline
                        positions={[
                          [parseFloat(selectedDriver.currentBooking.pickupLat), parseFloat(selectedDriver.currentBooking.pickupLon)],
                          [parseFloat(selectedDriver.currentBooking.destinationLat), parseFloat(selectedDriver.currentBooking.destinationLon)]
                        ]}
                        color="#3b82f6"
                        weight={3}
                        opacity={0.7}
                        dashArray="10, 10"
                      />
                    )}
                  </>
                )}
              </>
            )}
          </MapContainer>
        ) : (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
