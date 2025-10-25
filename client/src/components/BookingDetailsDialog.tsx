import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { 
  MapPin, 
  Navigation, 
  User, 
  Plane, 
  Car, 
  DollarSign, 
  Clock, 
  Luggage,
  Baby,
  FileText,
  CheckCircle2,
  AlertCircle,
  XCircle
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create custom markers
const pickupIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const destinationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface BookingFormData {
  passengerId: string;
  bookingType: 'transfer' | 'hourly';
  vehicleTypeId: string;
  pickupAddress: string;
  pickupCoords: { lat: number; lng: number } | null;
  destinationAddress: string;
  destinationCoords: { lat: number; lng: number } | null;
  scheduledDateTime: string;
  totalAmount: string;
  requestedHours: string;
  passengerCount: number;
  luggageCount: number;
  babySeat: boolean;
  bookingFor: 'self' | 'someone_else';
  passengerName: string;
  passengerEmail: string;
  passengerPhone: string;
  flightNumber: string;
  flightAirline: string;
  flightDepartureAirport: string;
  flightArrivalAirport: string;
  specialInstructions: string;
}

interface BookingDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: BookingFormData;
  setFormData: (data: BookingFormData) => void;
  editingBooking: any | null;
  onSave: () => void;
  isSaving: boolean;
  vehicleTypes: any[];
  allUsers: any[];
  activeDrivers: any[];
  selectedDriverId: string;
  setSelectedDriverId: (id: string) => void;
  driverPayment: string;
  setDriverPayment: (amount: string) => void;
  onCalculatePrice: () => void;
  isCalculatingPrice: boolean;
  calculatedPrice: string;
  userSearchQuery: string;
  setUserSearchQuery: (query: string) => void;
  selectedFlight: any | null;
  setSelectedFlight: (flight: any) => void;
  flightSearchInput: string;
  setFlightSearchInput: (input: string) => void;
  onFlightSearch: () => void;
  isSearchingFlight: boolean;
}

export function BookingDetailsDialog({
  open,
  onOpenChange,
  formData,
  setFormData,
  editingBooking,
  onSave,
  isSaving,
  vehicleTypes,
  allUsers,
  activeDrivers,
  selectedDriverId,
  setSelectedDriverId,
  driverPayment,
  setDriverPayment,
  onCalculatePrice,
  isCalculatingPrice,
  calculatedPrice,
  userSearchQuery,
  setUserSearchQuery,
  selectedFlight,
  setSelectedFlight,
  flightSearchInput,
  setFlightSearchInput,
  onFlightSearch,
  isSearchingFlight,
}: BookingDetailsDialogProps) {
  
  // Calculate map center and route
  const getMapConfig = () => {
    const { pickupCoords, destinationCoords } = formData;
    
    if (pickupCoords && destinationCoords) {
      // Calculate center point
      const centerLat = (pickupCoords.lat + destinationCoords.lat) / 2;
      const centerLng = (pickupCoords.lng + destinationCoords.lng) / 2;
      
      // Calculate zoom based on distance
      const latDiff = Math.abs(pickupCoords.lat - destinationCoords.lat);
      const lngDiff = Math.abs(pickupCoords.lng - destinationCoords.lng);
      const maxDiff = Math.max(latDiff, lngDiff);
      let zoom = 10;
      if (maxDiff > 1) zoom = 8;
      if (maxDiff > 2) zoom = 7;
      if (maxDiff > 5) zoom = 6;
      
      return {
        center: [centerLat, centerLng] as [number, number],
        zoom,
        showRoute: true,
        routePositions: [
          [pickupCoords.lat, pickupCoords.lng] as [number, number],
          [destinationCoords.lat, destinationCoords.lng] as [number, number]
        ]
      };
    } else if (pickupCoords) {
      return {
        center: [pickupCoords.lat, pickupCoords.lng] as [number, number],
        zoom: 13,
        showRoute: false,
        routePositions: []
      };
    }
    
    // Default to US center
    return {
      center: [39.8283, -98.5795] as [number, number],
      zoom: 4,
      showRoute: false,
      routePositions: []
    };
  };

  const mapConfig = getMapConfig();
  
  // Calculate distance
  const calculateDistance = () => {
    if (!formData.pickupCoords || !formData.destinationCoords) return null;
    
    const { lat: lat1, lng: lon1 } = formData.pickupCoords;
    const { lat: lat2, lng: lon2 } = formData.destinationCoords;
    
    const R = 3959; // Earth radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance.toFixed(1);
  };

  const distance = calculateDistance();
  const estimatedDuration = distance ? `${Math.ceil(parseFloat(distance) / 30)} hr ${Math.round((parseFloat(distance) / 30 % 1) * 60)} mins` : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[1400px] max-h-[95vh] overflow-hidden p-0">
        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] h-[95vh] overflow-hidden">
          
          {/* LEFT PANEL - Journey Visualization */}
          <div className="overflow-y-auto p-6 bg-gray-50 border-r">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">
              {editingBooking ? `Booking ID: ${editingBooking.id.substring(0, 8)}` : 'New Booking'}
            </h2>

            {/* TODO: Map Component will go here */}
            <div className="mb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Journey Map
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] rounded-lg overflow-hidden border">
                    <MapContainer
                      center={mapConfig.center}
                      zoom={mapConfig.zoom}
                      style={{ height: '100%', width: '100%' }}
                      scrollWheelZoom={false}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      
                      {/* Pickup Marker */}
                      {formData.pickupCoords && (
                        <Marker 
                          position={[formData.pickupCoords.lat, formData.pickupCoords.lng]}
                          icon={pickupIcon}
                        >
                          <Popup>
                            <strong>Pickup</strong><br/>
                            {formData.pickupAddress}
                          </Popup>
                        </Marker>
                      )}
                      
                      {/* Destination Marker */}
                      {formData.destinationCoords && (
                        <Marker 
                          position={[formData.destinationCoords.lat, formData.destinationCoords.lng]}
                          icon={destinationIcon}
                        >
                          <Popup>
                            <strong>Destination</strong><br/>
                            {formData.destinationAddress}
                          </Popup>
                        </Marker>
                      )}
                      
                      {/* Route Line */}
                      {mapConfig.showRoute && (
                        <Polyline 
                          positions={mapConfig.routePositions}
                          pathOptions={{ color: 'red', weight: 3 }}
                        />
                      )}
                    </MapContainer>
                  </div>
                  
                  {/* Distance & Duration */}
                  {distance && (
                    <div className="mt-3 flex gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Navigation className="w-4 h-4" />
                        <span>{distance} miles</span>
                      </div>
                      {estimatedDuration && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{estimatedDuration}</span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* TODO: Address Cards, Flight Info, Passenger Details, Journey Log will be added */}
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Additional sections coming soon...</p>
            </div>
          </div>

          {/* RIGHT PANEL - Dispatch & Invoice */}
          <div className="overflow-y-auto p-6 bg-white">
            {/* TODO: Dispatch Job Section (Top) will go here */}
            <div className="mb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Dispatch Job</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">Dispatch section coming soon...</p>
                </CardContent>
              </Card>
            </div>

            {/* TODO: Invoice Section (Bottom) will go here */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Invoice</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">Invoice section coming soon...</p>
                </CardContent>
              </Card>
            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
