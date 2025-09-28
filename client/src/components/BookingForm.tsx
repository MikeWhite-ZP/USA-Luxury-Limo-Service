import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

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
  hourlyRate: string;
  passengerCapacity: number;
  luggageCapacity: string;
  imageUrl?: string;
}

export default function BookingForm() {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  
  const [activeTab, setActiveTab] = useState<'transfer' | 'hourly'>('transfer');
  const [step, setStep] = useState(1);
  
  // Form state
  const [fromAddress, setFromAddress] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  
  // Coordinates storage
  const [fromCoords, setFromCoords] = useState<{lat: number, lon: number} | null>(null);
  const [toCoords, setToCoords] = useState<{lat: number, lon: number} | null>(null);
  const [pickupCoords, setPickupCoords] = useState<{lat: number, lon: number} | null>(null);
  
  // Address suggestions
  const [suggestions, setSuggestions] = useState<{[key: string]: AddressSuggestion[]}>({});
  const [showSuggestions, setShowSuggestions] = useState<{[key: string]: boolean}>({});
  
  // Quote data
  const [quoteData, setQuoteData] = useState<any>(null);
  
  const suggestionTimeouts = useRef<{[key: string]: NodeJS.Timeout}>({});

  // Set minimum date to today
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setDate(today);
  }, []);

  // Fetch vehicle types
  const { data: vehicleTypes } = useQuery<VehicleType[]>({
    queryKey: ['/api/vehicle-types'],
  });

  // Address geocoding with debounce
  const handleAddressInput = (inputId: string, value: string) => {
    if (suggestionTimeouts.current[inputId]) {
      clearTimeout(suggestionTimeouts.current[inputId]);
    }

    if (value.length < 2) {
      setSuggestions(prev => ({ ...prev, [inputId]: [] }));
      setShowSuggestions(prev => ({ ...prev, [inputId]: false }));
      return;
    }

    suggestionTimeouts.current[inputId] = setTimeout(async () => {
      try {
        const response = await fetch(`/api/geocode?q=${encodeURIComponent(value)}&limit=5`);
        if (response.ok) {
          const data = await response.json();
          const suggestions = data.results?.map((result: any) => ({
            id: result.id || result.address?.freeformAddress,
            display_name: result.address?.freeformAddress || result.poi?.name,
            address: result.address,
            position: result.position
          })) || [];
          
          setSuggestions(prev => ({ ...prev, [inputId]: suggestions }));
          setShowSuggestions(prev => ({ ...prev, [inputId]: true }));
        }
      } catch (error) {
        console.error('Geocoding error:', error);
      }
    }, 300);
  };

  const selectSuggestion = (inputId: string, suggestion: AddressSuggestion) => {
    if (inputId === 'from') {
      setFromAddress(suggestion.display_name);
      setFromCoords(suggestion.position);
    } else if (inputId === 'to') {
      setToAddress(suggestion.display_name);
      setToCoords(suggestion.position);
    } else if (inputId === 'pickup') {
      setPickupAddress(suggestion.display_name);
      setPickupCoords(suggestion.position);
    }
    
    setShowSuggestions(prev => ({ ...prev, [inputId]: false }));
  };

  // Get quote mutation
  const quoteMutation = useMutation({
    mutationFn: async () => {
      if (activeTab === 'transfer') {
        if (!fromCoords || !toCoords || !selectedVehicle) {
          throw new Error('Please fill in all required fields');
        }

        // Calculate distance first
        const distanceResponse = await apiRequest('POST', '/api/calculate-distance', {
          origins: `${fromCoords.lat},${fromCoords.lon}`,
          destinations: `${toCoords.lat},${toCoords.lon}`
        });
        const distanceData = await distanceResponse.json();

        // Get quote
        const quoteResponse = await apiRequest('POST', '/api/calculate-quote', {
          vehicleTypeId: selectedVehicle,
          bookingType: 'transfer',
          distance: distanceData.distance,
          duration: distanceData.duration
        });
        return await quoteResponse.json();
      } else {
        if (!pickupCoords || !duration || !selectedVehicle) {
          throw new Error('Please fill in all required fields');
        }

        const quoteResponse = await apiRequest('POST', '/api/calculate-quote', {
          vehicleTypeId: selectedVehicle,
          bookingType: 'hourly',
          hours: duration
        });
        return await quoteResponse.json();
      }
    },
    onSuccess: (data) => {
      setQuoteData(data);
      setStep(2);
    },
    onError: (error: Error) => {
      toast({
        title: "Quote Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create booking mutation
  const bookingMutation = useMutation({
    mutationFn: async () => {
      if (!isAuthenticated) {
        throw new Error('Please sign in to complete your booking');
      }

      const bookingData = {
        vehicleTypeId: selectedVehicle,
        bookingType: activeTab,
        scheduledDateTime: new Date(`${date}T${time}`).toISOString(),
        totalAmount: parseFloat(quoteData.totalAmount),
        ...(activeTab === 'transfer' ? {
          pickupAddress: fromAddress,
          pickupLat: fromCoords?.lat,
          pickupLon: fromCoords?.lon,
          destinationAddress: toAddress,
          destinationLat: toCoords?.lat,
          destinationLon: toCoords?.lon,
        } : {
          pickupAddress,
          pickupLat: pickupCoords?.lat,
          pickupLon: pickupCoords?.lon,
          requestedHours: parseInt(duration),
        }),
      };

      const response = await apiRequest('POST', '/api/bookings', bookingData);
      return await response.json();
    },
    onSuccess: (booking) => {
      setLocation(`/checkout?bookingId=${booking.id}&amount=${quoteData.totalAmount}`);
    },
    onError: (error: Error) => {
      if (error.message.includes('sign in')) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to complete your booking",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = '/api/login';
        }, 1000);
      } else {
        toast({
          title: "Booking Error",
          description: error.message,
          variant: "destructive",
        });
      }
    },
  });

  const handleGetQuote = () => {
    if (!date || !time) {
      toast({
        title: "Missing Information",
        description: "Please select date and time",
        variant: "destructive",
      });
      return;
    }
    quoteMutation.mutate();
  };

  const handleContinueBooking = () => {
    bookingMutation.mutate();
  };

  if (step === 2 && quoteData) {
    return (
      <div className="space-y-6">
        {/* Trip Details */}
        <div className="bg-gray-50 p-4 rounded-lg" data-testid="trip-details">
          <h4 className="font-semibold mb-3">Trip Details</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Date & Time:</span>
              <span data-testid="trip-datetime">{date} at {time}</span>
            </div>
            {activeTab === 'transfer' ? (
              <>
                <div className="flex justify-between">
                  <span>From:</span>
                  <span data-testid="trip-from" className="text-right">{fromAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span>To:</span>
                  <span data-testid="trip-to" className="text-right">{toAddress}</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between">
                  <span>Pickup:</span>
                  <span data-testid="trip-pickup" className="text-right">{pickupAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span data-testid="trip-duration">{duration} hours</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Vehicle Selection */}
        <div>
          <h4 className="font-semibold mb-3">Selected Vehicle</h4>
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <h5 className="font-medium text-primary" data-testid="selected-vehicle-name">
              {quoteData.vehicleType.name}
            </h5>
            <p className="text-2xl font-bold text-primary mt-2" data-testid="total-amount">
              ${quoteData.totalAmount}
            </p>
            <div className="text-sm text-gray-600 mt-2">
              <div>Passengers: Up to {quoteData.vehicleType.passengerCapacity}</div>
              <div>Luggage: {quoteData.vehicleType.luggageCapacity}</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => setStep(1)}
            className="flex-1"
            data-testid="button-back"
          >
            Back
          </Button>
          <Button 
            onClick={handleContinueBooking}
            disabled={bookingMutation.isPending}
            className="flex-1"
            data-testid="button-continue-booking"
          >
            {bookingMutation.isPending ? 'Processing...' : 'Continue to Payment'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Service Type Tabs */}
      <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('transfer')}
          className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'transfer'
              ? 'bg-primary text-white'
              : 'text-gray-700 hover:text-gray-900'
          }`}
          data-testid="tab-transfer"
        >
          Transfer
        </button>
        <button
          onClick={() => setActiveTab('hourly')}
          className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'hourly'
              ? 'bg-primary text-white'
              : 'text-gray-700 hover:text-gray-900'
          }`}
          data-testid="tab-hourly"
        >
          Hourly
        </button>
      </div>

      {/* Transfer Form */}
      {activeTab === 'transfer' && (
        <div className="space-y-4">
          {/* From Address */}
          <div className="relative">
            <Label htmlFor="from">From *</Label>
            <Input
              id="from"
              value={fromAddress}
              onChange={(e) => {
                setFromAddress(e.target.value);
                handleAddressInput('from', e.target.value);
              }}
              placeholder="Pickup location"
              autoComplete="off"
              data-testid="input-from"
            />
            {showSuggestions.from && suggestions.from?.length > 0 && (
              <div className="address-suggestions" style={{ display: 'block' }}>
                {suggestions.from.map((suggestion, index) => (
                  <div
                    key={index}
                    className="suggestion-item"
                    onClick={() => selectSuggestion('from', suggestion)}
                    data-testid={`suggestion-from-${index}`}
                  >
                    <div className="font-medium">{suggestion.display_name}</div>
                  </div>
                ))}
              </div>
            )}
            {fromCoords && (
              <div className="coordinates-display show" data-testid="from-coordinates">
                <span className="font-semibold">📍 Location:</span>
                <span>Lat: {fromCoords.lat.toFixed(6)}, Lng: {fromCoords.lon.toFixed(6)}</span>
              </div>
            )}
          </div>

          {/* To Address */}
          <div className="relative">
            <Label htmlFor="to">To *</Label>
            <Input
              id="to"
              value={toAddress}
              onChange={(e) => {
                setToAddress(e.target.value);
                handleAddressInput('to', e.target.value);
              }}
              placeholder="Destination"
              autoComplete="off"
              data-testid="input-to"
            />
            {showSuggestions.to && suggestions.to?.length > 0 && (
              <div className="address-suggestions" style={{ display: 'block' }}>
                {suggestions.to.map((suggestion, index) => (
                  <div
                    key={index}
                    className="suggestion-item"
                    onClick={() => selectSuggestion('to', suggestion)}
                    data-testid={`suggestion-to-${index}`}
                  >
                    <div className="font-medium">{suggestion.display_name}</div>
                  </div>
                ))}
              </div>
            )}
            {toCoords && (
              <div className="coordinates-display show" data-testid="to-coordinates">
                <span className="font-semibold">📍 Location:</span>
                <span>Lat: {toCoords.lat.toFixed(6)}, Lng: {toCoords.lon.toFixed(6)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hourly Form */}
      {activeTab === 'hourly' && (
        <div className="space-y-4">
          {/* Pickup Address */}
          <div className="relative">
            <Label htmlFor="pickup">Pickup Address *</Label>
            <Input
              id="pickup"
              value={pickupAddress}
              onChange={(e) => {
                setPickupAddress(e.target.value);
                handleAddressInput('pickup', e.target.value);
              }}
              placeholder="Enter pickup location"
              autoComplete="off"
              data-testid="input-pickup"
            />
            {showSuggestions.pickup && suggestions.pickup?.length > 0 && (
              <div className="address-suggestions" style={{ display: 'block' }}>
                {suggestions.pickup.map((suggestion, index) => (
                  <div
                    key={index}
                    className="suggestion-item"
                    onClick={() => selectSuggestion('pickup', suggestion)}
                    data-testid={`suggestion-pickup-${index}`}
                  >
                    <div className="font-medium">{suggestion.display_name}</div>
                  </div>
                ))}
              </div>
            )}
            {pickupCoords && (
              <div className="coordinates-display show" data-testid="pickup-coordinates">
                <span className="font-semibold">📍 Location:</span>
                <span>Lat: {pickupCoords.lat.toFixed(6)}, Lng: {pickupCoords.lon.toFixed(6)}</span>
              </div>
            )}
          </div>

          {/* Duration */}
          <div>
            <Label htmlFor="duration">Duration (2-24 hours) *</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger data-testid="select-duration">
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 23 }, (_, i) => i + 2).map((hours) => (
                  <SelectItem key={hours} value={hours.toString()}>
                    {hours} hours
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Date and Time */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="date">Date *</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            data-testid="input-date"
          />
        </div>
        <div>
          <Label htmlFor="time">Time *</Label>
          <Input
            id="time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            data-testid="input-time"
          />
        </div>
      </div>

      {/* Vehicle Selection */}
      <div>
        <Label>Select Vehicle *</Label>
        <div className="grid gap-3 mt-2">
          {vehicleTypes?.map((vehicle) => (
            <div
              key={vehicle.id}
              className={`vehicle-card p-4 rounded-lg cursor-pointer transition-all ${
                selectedVehicle === vehicle.id ? 'selected' : ''
              }`}
              onClick={() => setSelectedVehicle(vehicle.id)}
              data-testid={`vehicle-${vehicle.id}`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-semibold text-primary">{vehicle.name}</h4>
                  <p className="text-sm text-gray-600">
                    Up to {vehicle.passengerCapacity} passengers • {vehicle.luggageCapacity}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">
                    ${vehicle.hourlyRate}/hour
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Get Quote Button */}
      <Button
        onClick={handleGetQuote}
        disabled={quoteMutation.isPending || !selectedVehicle}
        className="w-full"
        data-testid="button-get-quote"
      >
        {quoteMutation.isPending ? 'Calculating...' : 'Get Quote'}
      </Button>
    </div>
  );
}
