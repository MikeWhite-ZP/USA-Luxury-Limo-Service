import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { AlertTriangle, MapPin, Clock, Car, Users, Briefcase, Info, Loader2 } from "lucide-react";

interface AddressSuggestion {
  id: string;
  display_name: string;
  address: any;
  position: {
    lat: number;
    lon: number;
  };
}

interface VehicleType {
  id: string;
  name: string;
  slug: string;
  hourlyRate: string;
  passengerCapacity: number;
  luggageCapacity: string;
  imageUrl?: string;
}

interface Booking {
  id: string;
  bookingType: 'transfer' | 'hourly';
  status: string;
  pickupAddress: string;
  pickupLat?: string;
  pickupLon?: string;
  destinationAddress?: string;
  destinationLat?: string;
  destinationLon?: string;
  scheduledDateTime: string;
  totalAmount: string;
  vehicleTypeId?: string;
  vehicleTypeName?: string;
  passengerCount?: number;
  luggageCount?: number;
  requestedHours?: number;
  specialInstructions?: string;
  passengerName?: string;
  passengerPhone?: string;
  passengerEmail?: string;
  bookingFor?: 'self' | 'someone_else';
}

interface EditBookingDialogProps {
  booking: Booking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function EditBookingDialog({ booking, open, onOpenChange, onSuccess }: EditBookingDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Form state
  const [pickupAddress, setPickupAddress] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [pickupCoords, setPickupCoords] = useState<{lat: number, lon: number} | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<{lat: number, lon: number} | null>(null);
  const [scheduledDate, setScheduledDate] = useState('');
  const [hour, setHour] = useState('12');
  const [minute, setMinute] = useState('00');
  const [period, setPeriod] = useState<'AM' | 'PM'>('PM');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [passengerCount, setPassengerCount] = useState(1);
  const [luggageCount, setLuggageCount] = useState(0);
  const [requestedHours, setRequestedHours] = useState(2);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [bookingFor, setBookingFor] = useState<'self' | 'someone_else'>('self');
  const [passengerName, setPassengerName] = useState('');
  const [passengerPhone, setPassengerPhone] = useState('');
  const [passengerEmail, setPassengerEmail] = useState('');
  
  // Track address changes for price warning
  const [originalPickupAddress, setOriginalPickupAddress] = useState('');
  const [originalDestinationAddress, setOriginalDestinationAddress] = useState('');
  const [addressChanged, setAddressChanged] = useState(false);
  
  // Address suggestions
  const [pickupSuggestions, setPickupSuggestions] = useState<AddressSuggestion[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<AddressSuggestion[]>([]);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  const [isSearchingPickup, setIsSearchingPickup] = useState(false);
  const [isSearchingDestination, setIsSearchingDestination] = useState(false);
  
  // Quote state
  const [quoteData, setQuoteData] = useState<any>(null);
  const [isCalculatingQuote, setIsCalculatingQuote] = useState(false);
  
  const suggestionTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Fetch vehicle types
  const { data: vehicleTypes = [] } = useQuery<VehicleType[]>({
    queryKey: ['/api/vehicle-types'],
    enabled: open,
  });

  // Initialize form with booking data
  useEffect(() => {
    if (booking && open) {
      setPickupAddress(booking.pickupAddress || '');
      setDestinationAddress(booking.destinationAddress || '');
      setOriginalPickupAddress(booking.pickupAddress || '');
      setOriginalDestinationAddress(booking.destinationAddress || '');
      setAddressChanged(false);
      
      if (booking.pickupLat && booking.pickupLon) {
        setPickupCoords({ lat: parseFloat(booking.pickupLat), lon: parseFloat(booking.pickupLon) });
      }
      if (booking.destinationLat && booking.destinationLon) {
        setDestinationCoords({ lat: parseFloat(booking.destinationLat), lon: parseFloat(booking.destinationLon) });
      }
      
      // Parse date and time
      const dateTime = new Date(booking.scheduledDateTime);
      setScheduledDate(dateTime.toISOString().split('T')[0]);
      let hours = dateTime.getHours();
      const minutes = dateTime.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      setHour(hours.toString());
      setMinute(minutes.toString().padStart(2, '0'));
      setPeriod(ampm);
      
      setSelectedVehicle(booking.vehicleTypeId || '');
      setPassengerCount(booking.passengerCount || 1);
      setLuggageCount(booking.luggageCount || 0);
      setRequestedHours(booking.requestedHours || 2);
      setSpecialInstructions(booking.specialInstructions || '');
      setBookingFor(booking.bookingFor || 'self');
      setPassengerName(booking.passengerName || '');
      setPassengerPhone(booking.passengerPhone || '');
      setPassengerEmail(booking.passengerEmail || '');
      setQuoteData(null);
    }
  }, [booking, open]);

  // Track address changes
  useEffect(() => {
    const pickupChanged = pickupAddress !== originalPickupAddress;
    const destChanged = destinationAddress !== originalDestinationAddress;
    setAddressChanged(pickupChanged || destChanged);
  }, [pickupAddress, destinationAddress, originalPickupAddress, originalDestinationAddress]);

  // Fetch address suggestions
  const fetchAddressSuggestions = async (query: string, type: 'pickup' | 'destination') => {
    if (query.length < 3) {
      if (type === 'pickup') setPickupSuggestions([]);
      else setDestinationSuggestions([]);
      return;
    }
    
    if (type === 'pickup') setIsSearchingPickup(true);
    else setIsSearchingDestination(true);
    
    try {
      const response = await fetch(`/api/geocode?query=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        if (type === 'pickup') {
          setPickupSuggestions(data.results || []);
          setShowPickupSuggestions(true);
        } else {
          setDestinationSuggestions(data.results || []);
          setShowDestinationSuggestions(true);
        }
      }
    } catch (error) {
      console.error('Geocode error:', error);
    } finally {
      if (type === 'pickup') setIsSearchingPickup(false);
      else setIsSearchingDestination(false);
    }
  };

  // Debounced address search
  const handleAddressChange = (value: string, type: 'pickup' | 'destination') => {
    if (type === 'pickup') setPickupAddress(value);
    else setDestinationAddress(value);
    
    if (suggestionTimeouts.current[type]) {
      clearTimeout(suggestionTimeouts.current[type]);
    }
    
    suggestionTimeouts.current[type] = setTimeout(() => {
      fetchAddressSuggestions(value, type);
    }, 300);
  };

  // Select address from suggestions
  const handleAddressSelect = (suggestion: AddressSuggestion, type: 'pickup' | 'destination') => {
    const address = suggestion.address.freeformAddress;
    if (type === 'pickup') {
      setPickupAddress(address);
      setPickupCoords({ lat: suggestion.position.lat, lon: suggestion.position.lon });
      setShowPickupSuggestions(false);
    } else {
      setDestinationAddress(address);
      setDestinationCoords({ lat: suggestion.position.lat, lon: suggestion.position.lon });
      setShowDestinationSuggestions(false);
    }
  };

  // Calculate quote when addresses or vehicle changes
  const calculateQuote = async () => {
    if (!pickupCoords || !selectedVehicle) return;
    if (booking?.bookingType === 'transfer' && !destinationCoords) return;
    
    setIsCalculatingQuote(true);
    
    try {
      const vehicle = vehicleTypes.find(v => v.id === selectedVehicle);
      if (!vehicle) return;
      
      const quotePayload: any = {
        bookingType: booking?.bookingType || 'transfer',
        vehicleType: vehicle.slug,
        pickupLat: pickupCoords.lat,
        pickupLon: pickupCoords.lon,
        passengerCount,
      };
      
      if (booking?.bookingType === 'transfer' && destinationCoords) {
        quotePayload.destinationLat = destinationCoords.lat;
        quotePayload.destinationLon = destinationCoords.lon;
      } else if (booking?.bookingType === 'hourly') {
        quotePayload.hours = requestedHours;
      }
      
      const response = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quotePayload),
      });
      
      if (response.ok) {
        const data = await response.json();
        setQuoteData(data);
      }
    } catch (error) {
      console.error('Quote calculation error:', error);
    } finally {
      setIsCalculatingQuote(false);
    }
  };

  // Recalculate quote when relevant fields change
  useEffect(() => {
    if (addressChanged && pickupCoords && selectedVehicle) {
      const timer = setTimeout(() => {
        calculateQuote();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [pickupCoords, destinationCoords, selectedVehicle, requestedHours, addressChanged]);

  // Build scheduled datetime
  const getScheduledDateTime = () => {
    let hours = parseInt(hour);
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    const dateTime = new Date(scheduledDate);
    dateTime.setHours(hours, parseInt(minute), 0, 0);
    return dateTime.toISOString();
  };

  // Update booking mutation
  const updateBookingMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('PATCH', `/api/bookings/${booking?.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Booking Updated",
        description: "Your booking has been updated. It will be reviewed by our team.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update booking. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!booking) return;
    
    const updateData: any = {
      pickupAddress,
      destinationAddress: booking.bookingType === 'transfer' ? destinationAddress : null,
      scheduledDateTime: getScheduledDateTime(),
      vehicleTypeId: selectedVehicle,
      passengerCount,
      luggageCount,
      specialInstructions,
      bookingFor,
      passengerName: bookingFor === 'someone_else' ? passengerName : null,
      passengerPhone: bookingFor === 'someone_else' ? passengerPhone : null,
      passengerEmail: bookingFor === 'someone_else' ? passengerEmail : null,
    };
    
    if (pickupCoords) {
      updateData.pickupLat = pickupCoords.lat.toString();
      updateData.pickupLon = pickupCoords.lon.toString();
    }
    
    if (destinationCoords && booking.bookingType === 'transfer') {
      updateData.destinationLat = destinationCoords.lat.toString();
      updateData.destinationLon = destinationCoords.lon.toString();
    }
    
    if (booking.bookingType === 'hourly') {
      updateData.requestedHours = requestedHours;
    }
    
    // Include new price if addresses changed
    if (addressChanged && quoteData?.totalPrice) {
      updateData.totalAmount = quoteData.totalPrice.toString();
      updateData.baseFare = quoteData.baseFare?.toString();
      updateData.distanceFare = quoteData.distanceFare?.toString();
      updateData.estimatedDistance = quoteData.distanceKm ? (quoteData.distanceKm * 0.621371).toFixed(2) : null;
    }
    
    updateBookingMutation.mutate(updateData);
  };

  if (!booking) return null;

  const selectedVehicleInfo = vehicleTypes.find(v => v.id === selectedVehicle);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Car className="w-5 h-5" />
            Edit Booking
          </DialogTitle>
          <DialogDescription>
            Make changes to your booking. After saving, your booking will be reviewed by our team.
          </DialogDescription>
        </DialogHeader>

        {/* Price Change Warning */}
        {addressChanged && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-200">Price May Change</p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                You've modified the pickup or destination address. The final price will be recalculated based on the new route. 
                {quoteData?.totalPrice && (
                  <span className="block mt-1 font-semibold">
                    New estimated price: ${parseFloat(quoteData.totalPrice).toFixed(2)}
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Status Reset Notice */}
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-blue-800 dark:text-blue-200">Important Notice</p>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              After editing, your booking status will change to "Pending" and any assigned driver will be removed. 
              Our dispatch team will review and reassign a driver.
            </p>
          </div>
        </div>

        <div className="space-y-6 mt-4">
          {/* Booking Type Badge */}
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm">
              {booking.bookingType === 'transfer' ? 'Point-to-Point Transfer' : 'Hourly Service'}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Current Price: ${parseFloat(booking.totalAmount).toFixed(2)}
            </span>
          </div>

          {/* Pickup Address */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-green-600" />
              Pickup Address
            </Label>
            <div className="relative">
              <Input
                value={pickupAddress}
                onChange={(e) => handleAddressChange(e.target.value, 'pickup')}
                placeholder="Enter pickup address"
                className="pr-8"
              />
              {isSearchingPickup && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              )}
              {showPickupSuggestions && pickupSuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {pickupSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      className="w-full text-left px-4 py-3 hover:bg-muted border-b border-border last:border-0"
                      onClick={() => handleAddressSelect(suggestion, 'pickup')}
                    >
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 mt-1 text-green-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{suggestion.address.freeformAddress}</p>
                          {suggestion.address.countrySubdivision && (
                            <p className="text-xs text-muted-foreground truncate">
                              {suggestion.address.countrySubdivision}, {suggestion.address.country}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Destination Address (for transfer only) */}
          {booking.bookingType === 'transfer' && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-red-600" />
                Destination Address
              </Label>
              <div className="relative">
                <Input
                  value={destinationAddress}
                  onChange={(e) => handleAddressChange(e.target.value, 'destination')}
                  placeholder="Enter destination address"
                  className="pr-8"
                />
                {isSearchingDestination && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                )}
                {showDestinationSuggestions && destinationSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {destinationSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        className="w-full text-left px-4 py-3 hover:bg-muted border-b border-border last:border-0"
                        onClick={() => handleAddressSelect(suggestion, 'destination')}
                      >
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 mt-1 text-red-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{suggestion.address.freeformAddress}</p>
                            {suggestion.address.countrySubdivision && (
                              <p className="text-xs text-muted-foreground truncate">
                                {suggestion.address.countrySubdivision}, {suggestion.address.country}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Date
              </Label>
              <Input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-2">
              <Label>Time</Label>
              <div className="flex gap-2">
                <Select value={hour} onValueChange={setHour}>
                  <SelectTrigger className="w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                      <SelectItem key={h} value={h.toString()}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="flex items-center">:</span>
                <Select value={minute} onValueChange={setMinute}>
                  <SelectTrigger className="w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['00', '15', '30', '45'].map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={period} onValueChange={(v) => setPeriod(v as 'AM' | 'PM')}>
                  <SelectTrigger className="w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AM">AM</SelectItem>
                    <SelectItem value="PM">PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Vehicle Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Car className="w-4 h-4" />
              Vehicle Type
            </Label>
            <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
              <SelectTrigger>
                <SelectValue placeholder="Select vehicle type" />
              </SelectTrigger>
              <SelectContent>
                {vehicleTypes.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.name} - {vehicle.passengerCapacity} passengers
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Hourly Duration (for hourly booking) */}
          {booking.bookingType === 'hourly' && (
            <div className="space-y-2">
              <Label>Duration (Hours)</Label>
              <Select value={requestedHours.toString()} onValueChange={(v) => setRequestedHours(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2, 3, 4, 5, 6, 7, 8, 10, 12].map((h) => (
                    <SelectItem key={h} value={h.toString()}>{h} hours</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Passengers and Luggage */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Passengers
              </Label>
              <Select value={passengerCount.toString()} onValueChange={(v) => setPassengerCount(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: selectedVehicleInfo?.passengerCapacity || 8 }, (_, i) => i + 1).map((n) => (
                    <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Luggage
              </Label>
              <Select value={luggageCount.toString()} onValueChange={(v) => setLuggageCount(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 11 }, (_, i) => i).map((n) => (
                    <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Special Instructions */}
          <div className="space-y-2">
            <Label>Special Instructions</Label>
            <Textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="Any special requirements or notes for the driver..."
              rows={3}
            />
          </div>

          {/* Booking For Someone Else */}
          <div className="space-y-4">
            <Label>Booking For</Label>
            <div className="flex gap-4">
              <Button
                type="button"
                variant={bookingFor === 'self' ? 'default' : 'outline'}
                onClick={() => setBookingFor('self')}
                className="flex-1"
              >
                Myself
              </Button>
              <Button
                type="button"
                variant={bookingFor === 'someone_else' ? 'default' : 'outline'}
                onClick={() => setBookingFor('someone_else')}
                className="flex-1"
              >
                Someone Else
              </Button>
            </div>
            
            {bookingFor === 'someone_else' && (
              <Card className="mt-4">
                <CardContent className="pt-4 space-y-4">
                  <div className="space-y-2">
                    <Label>Passenger Name</Label>
                    <Input
                      value={passengerName}
                      onChange={(e) => setPassengerName(e.target.value)}
                      placeholder="Full name of the passenger"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Passenger Phone</Label>
                    <Input
                      value={passengerPhone}
                      onChange={(e) => setPassengerPhone(e.target.value)}
                      placeholder="Phone number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Passenger Email</Label>
                    <Input
                      type="email"
                      value={passengerEmail}
                      onChange={(e) => setPassengerEmail(e.target.value)}
                      placeholder="Email address"
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Quote Summary */}
          {isCalculatingQuote && (
            <div className="flex items-center justify-center py-4 gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Calculating new price...</span>
            </div>
          )}

          {quoteData && addressChanged && !isCalculatingQuote && (
            <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
              <CardContent className="pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-green-800 dark:text-green-200">New Estimated Price:</span>
                  <span className="text-2xl font-bold text-green-700 dark:text-green-300">
                    ${parseFloat(quoteData.totalPrice).toFixed(2)}
                  </span>
                </div>
                {quoteData.distanceKm && (
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                    Distance: {(quoteData.distanceKm * 0.621371).toFixed(1)} miles
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={updateBookingMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1"
              disabled={updateBookingMutation.isPending || (addressChanged && isCalculatingQuote)}
            >
              {updateBookingMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
