import { useEffect, useState } from "react";
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
  XCircle,
  Plus
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

const viaIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface ViaPoint {
  address: string;
  lat: number;
  lon: number;
}

interface BookingFormData {
  passengerId: string;
  bookingType: 'transfer' | 'hourly';
  vehicleTypeId: string;
  pickupAddress: string;
  pickupCoords: { lat: number; lon: number } | null;
  destinationAddress: string;
  destinationCoords: { lat: number; lon: number } | null;
  viaPoints: ViaPoint[];
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
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
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
  systemCommission?: { percentage: number; description: string } | null;
  onAssignDriver?: (bookingId: string, driverId: string, driverPayment: string) => void;
  isAssigningDriver?: boolean;
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
  systemCommission,
  onAssignDriver,
  isAssigningDriver = false,
}: BookingDetailsDialogProps) {
  
  // State for change driver mode
  const [isChangingDriver, setIsChangingDriver] = useState(false);
  const [tempSelectedDriverId, setTempSelectedDriverId] = useState('');
  const [tempDriverPayment, setTempDriverPayment] = useState('');
  
  // Calculate map center and route
  const getMapConfig = () => {
    const { pickupCoords, destinationCoords, viaPoints = [] } = formData;
    
    // Collect all points for bounds calculation
    const allPoints: Array<[number, number]> = [];
    if (pickupCoords) allPoints.push([pickupCoords.lat, pickupCoords.lon]);
    viaPoints.forEach(via => allPoints.push([via.lat, via.lon]));
    if (destinationCoords) allPoints.push([destinationCoords.lat, destinationCoords.lon]);
    
    if (allPoints.length >= 2) {
      // Calculate center point from all coordinates
      const avgLat = allPoints.reduce((sum, p) => sum + p[0], 0) / allPoints.length;
      const avgLon = allPoints.reduce((sum, p) => sum + p[1], 0) / allPoints.length;
      
      // Calculate zoom based on bounding box
      const lats = allPoints.map(p => p[0]);
      const lons = allPoints.map(p => p[1]);
      const latDiff = Math.max(...lats) - Math.min(...lats);
      const lonDiff = Math.max(...lons) - Math.min(...lons);
      const maxDiff = Math.max(latDiff, lonDiff);
      
      let zoom = 10;
      if (maxDiff > 1) zoom = 8;
      if (maxDiff > 2) zoom = 7;
      if (maxDiff > 5) zoom = 6;
      
      return {
        center: [avgLat, avgLon] as [number, number],
        zoom,
        showRoute: true,
        routePositions: allPoints
      };
    } else if (pickupCoords) {
      return {
        center: [pickupCoords.lat, pickupCoords.lon] as [number, number],
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
    
    const { lat: lat1, lon: lon1 } = formData.pickupCoords;
    const { lat: lat2, lon: lon2 } = formData.destinationCoords;
    
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

  // Auto-calculate driver payment when driver is selected or total amount changes
  useEffect(() => {
    if (selectedDriverId && formData.totalAmount && systemCommission) {
      const totalAmount = parseFloat(formData.totalAmount);
      if (!isNaN(totalAmount) && totalAmount > 0) {
        const commissionPct = systemCommission.percentage;
        const calculatedPayment = totalAmount * (1 - commissionPct / 100);
        
        // Only update if current driver payment is empty or different from calculated
        if (!driverPayment || parseFloat(driverPayment) !== calculatedPayment) {
          setDriverPayment(calculatedPayment.toFixed(2));
        }
      }
    }
  }, [selectedDriverId, formData.totalAmount, systemCommission]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[1400px] max-h-[95vh] overflow-hidden p-0">
        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] h-[95vh] overflow-hidden">
          
          {/* LEFT PANEL - Journey Visualization */}
          <div className="overflow-y-auto p-6 bg-gray-50 border-r text-[12px] pl-[0px] pr-[0px] pt-[0px] pb-[0px]">
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
                          position={[formData.pickupCoords.lat, formData.pickupCoords.lon]}
                          icon={pickupIcon}
                        >
                          <Popup>
                            <strong>Pickup</strong><br/>
                            {formData.pickupAddress}
                          </Popup>
                        </Marker>
                      )}
                      
                      {/* Via Point Markers */}
                      {formData.viaPoints?.map((via, index) => (
                        <Marker 
                          key={`via-${index}`}
                          position={[via.lat, via.lon]}
                          icon={viaIcon}
                        >
                          <Popup>
                            <strong>Via Point {index + 1}</strong><br/>
                            {via.address}
                          </Popup>
                        </Marker>
                      ))}
                      
                      {/* Destination Marker */}
                      {formData.destinationCoords && (
                        <Marker 
                          position={[formData.destinationCoords.lat, formData.destinationCoords.lon]}
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
                          pathOptions={{ color: 'blue', weight: 3, dashArray: '10, 5' }}
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

            {/* Address Input Section with Saved Addresses */}
            <div className="space-y-4 mb-6">
              <Card>
                <CardHeader className="flex flex-col space-y-1.5 p-6 text-[12px]">
                  <CardTitle className="text-lg">Journey Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Passenger Selection */}
                  <div>
                    <Label>Passenger *</Label>
                    <div className="relative">
                      <Input
                        placeholder="Search by name, email, or phone..."
                        value={(() => {
                          if (!formData.passengerId) return '';
                          const selectedPassenger = allUsers?.find(u => u.id === formData.passengerId);
                          if (selectedPassenger) {
                            return `${selectedPassenger.firstName} ${selectedPassenger.lastName} (${selectedPassenger.email})`;
                          }
                          return '';
                        })()}
                        onChange={(e) => {
                          const searchQuery = e.target.value;
                          if (formData.passengerId) {
                            setFormData({ ...formData, passengerId: '' });
                          }
                          setUserSearchQuery(searchQuery);
                        }}
                        onFocus={() => {
                          if (!userSearchQuery && !formData.passengerId) {
                            setUserSearchQuery(' ');
                          }
                        }}
                        data-testid="input-passenger-search"
                      />
                      {userSearchQuery && allUsers && allUsers.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {allUsers
                            .filter(u => u.role === 'passenger')
                            .filter(u => {
                              const query = userSearchQuery.trim().toLowerCase();
                              if (!query) return true;
                              return (
                                u.firstName?.toLowerCase().includes(query) ||
                                u.lastName?.toLowerCase().includes(query) ||
                                u.email?.toLowerCase().includes(query) ||
                                u.phone?.toLowerCase().includes(query) ||
                                `${u.firstName} ${u.lastName}`.toLowerCase().includes(query)
                              );
                            })
                            .slice(0, 10)
                            .map((passenger) => (
                              <button
                                key={passenger.id}
                                type="button"
                                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                                onClick={() => {
                                  setFormData({ ...formData, passengerId: passenger.id });
                                  setUserSearchQuery('');
                                }}
                                data-testid={`passenger-option-${passenger.id}`}
                              >
                                {passenger.firstName} {passenger.lastName} ({passenger.email}) - {passenger.phone || 'N/A'}
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Booking Type & Vehicle */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Booking Type *</Label>
                      <Select
                        value={formData.bookingType}
                        onValueChange={(value) => setFormData({ ...formData, bookingType: value as 'transfer' | 'hourly' })}
                      >
                        <SelectTrigger data-testid="select-booking-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="transfer">Transfer</SelectItem>
                          <SelectItem value="hourly">Hourly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Vehicle Type *</Label>
                      <Select
                        value={formData.vehicleTypeId}
                        onValueChange={(value) => setFormData({ ...formData, vehicleTypeId: value })}
                      >
                        <SelectTrigger data-testid="select-vehicle-type">
                          <SelectValue placeholder="Select vehicle" />
                        </SelectTrigger>
                        <SelectContent>
                          {vehicleTypes?.map((vt) => (
                            <SelectItem key={vt.id} value={vt.id}>
                              {vt.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Pickup Address with Saved Addresses */}
                  <AddressAutocomplete
                    id="pickup-address"
                    label="Pickup Address"
                    value={formData.pickupAddress}
                    onChange={(value, coords) => {
                      setFormData({ ...formData, pickupAddress: value, pickupCoords: coords || null });
                    }}
                    placeholder="Enter pickup address"
                    userId={formData.passengerId}
                    required={true}
                    data-testid="input-pickup-address"
                  />

                  {/* Via Points Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Via Points (Optional)</Label>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const newViaPoints = [...(formData.viaPoints || []), { address: '', lat: 0, lon: 0 }];
                          setFormData({ ...formData, viaPoints: newViaPoints });
                        }}
                        data-testid="button-add-via-point"
                        className="text-xs bg-[#84c6f0]"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Via Point
                      </Button>
                    </div>
                    
                    {formData.viaPoints && formData.viaPoints.length > 0 && (
                      <div className="space-y-3">
                        {formData.viaPoints.map((viaPoint, index) => (
                          <div key={index} className="relative">
                            <AddressAutocomplete
                              id={`via-point-${index}`}
                              label={`Via Point ${index + 1}`}
                              value={viaPoint.address}
                              onChange={(value, coords) => {
                                const newViaPoints = [...(formData.viaPoints || [])];
                                newViaPoints[index] = {
                                  address: value,
                                  lat: coords?.lat || 0,
                                  lon: coords?.lon || 0,
                                };
                                setFormData({ ...formData, viaPoints: newViaPoints });
                              }}
                              placeholder="Enter via point address"
                              userId={formData.passengerId}
                              required={false}
                              data-testid={`input-via-point-${index}`}
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                const newViaPoints = (formData.viaPoints || []).filter((_, i) => i !== index);
                                setFormData({ ...formData, viaPoints: newViaPoints });
                              }}
                              className="absolute top-0 right-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                              data-testid={`button-remove-via-point-${index}`}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Destination Address with Saved Addresses */}
                  <AddressAutocomplete
                    id="destination-address"
                    label="Destination Address"
                    value={formData.destinationAddress}
                    onChange={(value, coords) => {
                      setFormData({ ...formData, destinationAddress: value, destinationCoords: coords || null });
                    }}
                    placeholder={formData.bookingType === 'hourly' ? 'N/A for hourly service' : 'Enter destination address'}
                    userId={formData.passengerId}
                    disabled={formData.bookingType === 'hourly'}
                    required={formData.bookingType === 'transfer'}
                    data-testid="input-destination-address"
                  />

                  {/* Duration for Hourly */}
                  {formData.bookingType === 'hourly' && (
                    <div>
                      <Label>Duration (Hours) *</Label>
                      <Select
                        value={formData.requestedHours}
                        onValueChange={(value) => setFormData({ ...formData, requestedHours: value })}
                      >
                        <SelectTrigger data-testid="select-requested-hours">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2">2 hours</SelectItem>
                          <SelectItem value="3">3 hours</SelectItem>
                          <SelectItem value="4">4 hours</SelectItem>
                          <SelectItem value="5">5 hours</SelectItem>
                          <SelectItem value="6">6 hours</SelectItem>
                          <SelectItem value="8">8 hours</SelectItem>
                          <SelectItem value="10">10 hours</SelectItem>
                          <SelectItem value="12">12 hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Scheduled DateTime */}
                  <div>
                    <Label>Scheduled Date & Time *</Label>
                    <Input
                      type="datetime-local"
                      value={formData.scheduledDateTime}
                      onChange={(e) => setFormData({ ...formData, scheduledDateTime: e.target.value })}
                      data-testid="input-scheduled-datetime"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Passenger Details Section */}
            <div className="mb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Passenger & Luggage Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Passengers *</Label>
                      <Input
                        type="number"
                        min="1"
                        value={formData.passengerCount}
                        onChange={(e) => setFormData({ ...formData, passengerCount: parseInt(e.target.value) || 1 })}
                        data-testid="input-passenger-count"
                      />
                    </div>
                    
                    <div>
                      <Label>Luggage</Label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.luggageCount}
                        onChange={(e) => setFormData({ ...formData, luggageCount: parseInt(e.target.value) || 0 })}
                        data-testid="input-luggage-count"
                      />
                    </div>
                    
                    <div className="flex items-center gap-2 pt-6">
                      <input
                        id="baby-seat"
                        type="checkbox"
                        checked={formData.babySeat}
                        onChange={(e) => setFormData({ ...formData, babySeat: e.target.checked })}
                        className="w-4 h-4"
                        data-testid="checkbox-baby-seat"
                      />
                      <Label htmlFor="baby-seat">Baby Seat</Label>
                    </div>
                  </div>

                  {/* Book for Another Person */}
                  <div className="pt-4 border-t">
                    <div className="flex items-center gap-2 mb-3">
                      <input
                        id="booking-for-toggle"
                        type="checkbox"
                        checked={formData.bookingFor === 'someone_else'}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          bookingFor: e.target.checked ? 'someone_else' : 'self' 
                        })}
                        className="w-4 h-4"
                        data-testid="checkbox-booking-for"
                      />
                      <Label htmlFor="booking-for-toggle">Book for Another Person</Label>
                    </div>
                    
                    {formData.bookingFor === 'someone_else' && (
                      <div className="space-y-3 pl-6">
                        <Input
                          placeholder="Passenger Name"
                          value={formData.passengerName}
                          onChange={(e) => setFormData({ ...formData, passengerName: e.target.value })}
                          data-testid="input-passenger-name"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="email"
                            placeholder="Email"
                            value={formData.passengerEmail}
                            onChange={(e) => setFormData({ ...formData, passengerEmail: e.target.value })}
                            data-testid="input-passenger-email"
                          />
                          <Input
                            type="tel"
                            placeholder="Phone"
                            value={formData.passengerPhone}
                            onChange={(e) => setFormData({ ...formData, passengerPhone: e.target.value })}
                            data-testid="input-passenger-phone"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Flight Search Section */}
            <div className="mb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Plane className="w-5 h-5" />
                    Add Flight Information (Optional)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Search for a flight to automatically populate details.
                  </p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter flight number (e.g., UA2346)"
                      value={flightSearchInput}
                      onChange={(e) => setFlightSearchInput(e.target.value.toUpperCase())}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          onFlightSearch();
                        }
                      }}
                      data-testid="input-flight-search"
                    />
                    <Button
                      onClick={onFlightSearch}
                      disabled={isSearchingFlight || !flightSearchInput.trim()}
                      data-testid="button-find-flight"
                    >
                      {isSearchingFlight ? 'Searching...' : 'Search'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Flight Information Section */}
            {(formData.flightNumber || selectedFlight) && (
              <div className="mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Plane className="w-5 h-5" />
                      Flight Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedFlight ? (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-[12px] pl-[0px] pr-[0px] pt-[0px] pb-[0px]">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-bold text-green-800">{selectedFlight.airline}</p>
                            <p className="text-sm text-green-700">Flight {selectedFlight.flightNumber}</p>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedFlight(null);
                              setFlightSearchInput('');
                              setFormData({
                                ...formData,
                                flightNumber: '',
                                flightAirline: '',
                                flightDepartureAirport: '',
                                flightArrivalAirport: '',
                              });
                            }}
                            className="text-green-600 hover:text-green-800 text-sm"
                            data-testid="button-clear-flight"
                          >
                            Clear
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-xs text-green-600 font-medium">Departure</p>
                            <p className="text-green-800">{selectedFlight.departureAirport}</p>
                          </div>
                          <div>
                            <p className="text-xs text-green-600 font-medium">Arrival</p>
                            <p className="text-green-800">{selectedFlight.arrivalAirport}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="font-bold text-blue-800">{formData.flightAirline}</p>
                        <p className="text-sm text-blue-700">Flight {formData.flightNumber}</p>
                        {formData.flightDepartureAirport && formData.flightArrivalAirport && (
                          <div className="grid grid-cols-2 gap-3 text-sm mt-2">
                            <div>
                              <p className="text-xs text-blue-600">From: {formData.flightDepartureAirport}</p>
                            </div>
                            <div>
                              <p className="text-xs text-blue-600">To: {formData.flightArrivalAirport}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Journey Log Timeline */}
            {editingBooking && (
              <div className="mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Journey Log</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-sm">Booking Created</p>
                          <p className="text-xs text-gray-500">Admin created the booking</p>
                        </div>
                      </div>
                      {editingBooking.status === 'confirmed' || editingBooking.status === 'in_progress' || editingBooking.status === 'completed' ? (
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-sm">Booking Confirmed</p>
                            <p className="text-xs text-gray-500">Passenger confirmed the booking</p>
                          </div>
                        </div>
                      ) : null}
                      {editingBooking.driverId && (
                        <div className="flex items-start gap-3">
                          <Car className="w-5 h-5 text-blue-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-sm">Driver Assigned</p>
                            <p className="text-xs text-gray-500">Driver has been assigned to this job</p>
                          </div>
                        </div>
                      )}
                      {editingBooking.status === 'in_progress' || editingBooking.status === 'completed' ? (
                        <div className="flex items-start gap-3">
                          <Navigation className="w-5 h-5 text-blue-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-sm">Trip Started</p>
                            <p className="text-xs text-gray-500">Driver started the journey</p>
                          </div>
                        </div>
                      ) : null}
                      {editingBooking.status === 'completed' && (
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-sm">Trip Completed</p>
                            <p className="text-xs text-gray-500">Journey completed successfully</p>
                          </div>
                        </div>
                      )}
                      {editingBooking.status === 'cancelled' && (
                        <div className="flex items-start gap-3">
                          <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-sm">Booking Cancelled</p>
                            <p className="text-xs text-gray-500">This booking was cancelled</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* RIGHT PANEL - Dispatch & Invoice */}
          <div className="overflow-y-auto p-6 bg-white">
            {/* Dispatch Job Section (Top) */}
            <div className="mb-6">
              <Card className="bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Car className="w-5 h-5" />
                    Dispatch Job
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Vehicle Selection */}
                  <div>
                    <Label>Vehicle</Label>
                    <Select
                      value={formData.vehicleTypeId}
                      onValueChange={(value) => setFormData({ ...formData, vehicleTypeId: value })}
                    >
                      <SelectTrigger data-testid="dispatch-vehicle-type">
                        <SelectValue placeholder="Select vehicle" />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicleTypes?.map((vt) => (
                          <SelectItem key={vt.id} value={vt.id}>
                            {vt.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Driver Assignment */}
                  <div>
                    <Label>Driver</Label>
                    {selectedDriverId && editingBooking?.driverId && !isChangingDriver ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 p-3 border rounded-lg bg-white">
                          {editingBooking.driverProfileImageUrl ? (
                            <img 
                              src={editingBooking.driverProfileImageUrl} 
                              alt="Driver" 
                              className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold">
                              {editingBooking.driverFirstName?.[0]}{editingBooking.driverLastName?.[0]}
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="font-semibold">{editingBooking.driverFirstName} {editingBooking.driverLastName}</p>
                            {editingBooking.driverPhone && (
                              <p className="text-sm text-gray-600">{editingBooking.driverPhone}</p>
                            )}
                            {editingBooking.driverVehiclePlate && (
                              <p className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded inline-block mt-1">
                                {editingBooking.driverVehiclePlate}
                              </p>
                            )}
                            <Badge className="mt-1 bg-green-100 text-green-800">Assigned</Badge>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsChangingDriver(true);
                            setTempSelectedDriverId('');
                            setTempDriverPayment(driverPayment || '');
                          }}
                          className="w-full"
                          data-testid="button-change-driver"
                        >
                          <Car className="w-4 h-4 mr-2" />
                          Change Driver
                        </Button>
                      </div>
                    ) : isChangingDriver ? (
                      <div className="space-y-3">
                        <Select
                          value={tempSelectedDriverId}
                          onValueChange={setTempSelectedDriverId}
                        >
                          <SelectTrigger data-testid="dispatch-driver-select-change">
                            <SelectValue placeholder="Select new driver" />
                          </SelectTrigger>
                          <SelectContent>
                            {activeDrivers?.map((driver) => (
                              <SelectItem key={driver.id} value={driver.id}>
                                {driver.firstName} {driver.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        {tempSelectedDriverId && (
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <Label className="text-xs">Driver Payment</Label>
                            <div className="relative mt-1">
                              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={tempDriverPayment}
                                onChange={(e) => setTempDriverPayment(e.target.value)}
                                placeholder="0.00"
                                className="pl-9"
                                data-testid="input-temp-driver-payment"
                              />
                            </div>
                          </div>
                        )}
                        
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setIsChangingDriver(false);
                              setTempSelectedDriverId('');
                              setTempDriverPayment('');
                            }}
                            className="flex-1"
                            disabled={isAssigningDriver}
                            data-testid="button-cancel-change-driver"
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            onClick={() => {
                              if (onAssignDriver && editingBooking && tempSelectedDriverId) {
                                onAssignDriver(editingBooking.id, tempSelectedDriverId, tempDriverPayment);
                                setIsChangingDriver(false);
                              }
                            }}
                            disabled={!tempSelectedDriverId || isAssigningDriver}
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                            data-testid="button-save-change-driver"
                          >
                            {isAssigningDriver ? 'Assigning...' : 'Assign Driver'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Select
                        value={selectedDriverId}
                        onValueChange={setSelectedDriverId}
                      >
                        <SelectTrigger data-testid="dispatch-driver-select">
                          <SelectValue placeholder="Select driver" />
                        </SelectTrigger>
                        <SelectContent>
                          {activeDrivers?.map((driver) => (
                            <SelectItem key={driver.id} value={driver.id}>
                              {driver.firstName} {driver.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {/* Driver Payment */}
                  {selectedDriverId && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <Label>Driver Payment</Label>
                      <div className="flex gap-2 mt-2">
                        <div className="relative flex-1">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={driverPayment}
                            onChange={(e) => setDriverPayment(e.target.value)}
                            placeholder="0.00"
                            className="pl-9"
                            data-testid="input-driver-payment"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-green-700 mt-1">
                        Amount driver will receive for this ride
                      </p>
                    </div>
                  )}

                  {/* Note to Driver */}
                  <div>
                    <Label>Note to Driver</Label>
                    <Textarea
                      value={formData.specialInstructions}
                      onChange={(e) => setFormData({ ...formData, specialInstructions: e.target.value })}
                      placeholder="Special instructions for the driver..."
                      rows={3}
                      data-testid="textarea-driver-note"
                    />
                  </div>

                  {/* Submit Button */}
                  <Button
                    onClick={onSave}
                    disabled={isSaving}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 text-lg"
                    data-testid="button-save-booking"
                  >
                    {isSaving ? 'Saving...' : (editingBooking ? 'UPDATE BOOKING' : 'CREATE BOOKING')}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Invoice Section (Bottom) */}
            <div>
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Invoice
                    </CardTitle>
                    {editingBooking && (
                      <Badge variant={editingBooking.status === 'completed' ? 'default' : 'secondary'}>
                        {editingBooking.status === 'pending' ? 'UNPAID' : 
                         editingBooking.status === 'completed' ? 'PAID' : 'IN PROGRESS'}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Invoice Number */}
                  {editingBooking && (
                    <div className="pb-3 border-b">
                      <p className="text-sm text-gray-600">Invoice Number</p>
                      <p className="text-lg font-mono font-bold">#{editingBooking.id.substring(0, 8).toUpperCase()}</p>
                    </div>
                  )}

                  {/* Payment Method */}
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Payment Method</p>
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <DollarSign className="w-4 h-4" />
                      <span className="text-sm">Card Payment</span>
                    </div>
                  </div>

                  {/* Journey Fare */}
                  <div>
                    <Label>Journey Fare</Label>
                    <div className="flex gap-2 mt-1">
                      <div className="relative flex-1">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.totalAmount}
                          onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                          placeholder="0.00"
                          className="pl-9"
                          data-testid="input-total-amount"
                        />
                      </div>
                      <Button
                        type="button"
                        onClick={onCalculatePrice}
                        disabled={
                          isCalculatingPrice ||
                          !formData.vehicleTypeId ||
                          !formData.pickupAddress ||
                          (formData.bookingType === 'transfer' && !formData.destinationAddress)
                        }
                        variant="outline"
                        data-testid="button-calculate-price"
                      >
                        {isCalculatingPrice ? 'Calculating...' : 'Calculate'}
                      </Button>
                    </div>
                    {calculatedPrice && (
                      <p className="text-xs text-gray-600 mt-1">
                        Calculated: ${calculatedPrice} (editable)
                      </p>
                    )}
                  </div>

                  {/* Total Fare */}
                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">Total Fare</span>
                      <span className="text-3xl font-bold text-blue-600">
                        ${formData.totalAmount || '0.00'}
                      </span>
                    </div>
                  </div>

                  {/* Payment Actions */}
                  {editingBooking && (
                    <div className="space-y-2 pt-4 border-t">
                      <Button 
                        variant="outline" 
                        className="w-full"
                        data-testid="button-authorize-payment"
                      >
                        Authorize & Capture
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        data-testid="button-send-proforma"
                      >
                        Send Proforma Invoice
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
