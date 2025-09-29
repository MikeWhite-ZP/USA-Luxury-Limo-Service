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
  
  // Via points state
  const [viaPoints, setViaPoints] = useState<string[]>([]);
  const [viaCoords, setViaCoords] = useState<{[key: number]: {lat: number, lon: number}} | null>(null);
  
  // Coordinates storage
  const [fromCoords, setFromCoords] = useState<{lat: number, lon: number} | null>(null);
  const [toCoords, setToCoords] = useState<{lat: number, lon: number} | null>(null);
  const [pickupCoords, setPickupCoords] = useState<{lat: number, lon: number} | null>(null);
  
  // Address suggestions
  const [suggestions, setSuggestions] = useState<{[key: string]: AddressSuggestion[]}>({});
  const [showSuggestions, setShowSuggestions] = useState<{[key: string]: boolean}>({});
  
  // Quote data
  const [quoteData, setQuoteData] = useState<any>(null);
  
  const suggestionTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

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
    } else if (inputId.startsWith('via-')) {
      const index = parseInt(inputId.split('-')[1]);
      const newViaPoints = [...viaPoints];
      newViaPoints[index] = suggestion.display_name;
      setViaPoints(newViaPoints);
      
      // Store via point coordinates
      setViaCoords(prev => ({
        ...(prev || {}),
        [index]: suggestion.position
      }));
    }
    
    setShowSuggestions(prev => ({ ...prev, [inputId]: false }));
  };

  // Via point functions
  const addViaPoint = () => {
    if (viaPoints.length < 3) { // Limit to 3 via points
      setViaPoints([...viaPoints, '']);
    }
  };

  const removeViaPoint = (index: number) => {
    const newViaPoints = viaPoints.filter((_, i) => i !== index);
    setViaPoints(newViaPoints);
    
    // Remove via point coordinates and reindex correctly
    if (viaCoords) {
      const newViaCoords: {[key: number]: {lat: number, lon: number}} = {};
      Object.keys(viaCoords).forEach(key => {
        const keyIndex = parseInt(key);
        if (keyIndex < index) {
          // Keep indices before removed index as-is
          newViaCoords[keyIndex] = viaCoords[keyIndex];
        } else if (keyIndex > index) {
          // Shift indices after removed index down by 1
          newViaCoords[keyIndex - 1] = viaCoords[keyIndex];
        }
        // Skip the removed index (keyIndex === index)
      });
      setViaCoords(Object.keys(newViaCoords).length > 0 ? newViaCoords : null);
    }
  };

  const updateViaPoint = (index: number, value: string) => {
    const newViaPoints = [...viaPoints];
    newViaPoints[index] = value;
    setViaPoints(newViaPoints);
    handleAddressInput(`via-${index}`, value);
  };

  // Get quote mutation
  const quoteMutation = useMutation({
    mutationFn: async () => {
      if (activeTab === 'transfer') {
        if (!fromCoords || !toCoords) {
          throw new Error('Please fill in all required fields');
        }

        // Calculate distance first
        const distanceResponse = await apiRequest('/api/calculate-distance', {
          method: 'POST',
          body: JSON.stringify({
            origins: `${fromCoords.lat},${fromCoords.lon}`,
            destinations: `${toCoords.lat},${toCoords.lon}`
          })
        });

        return distanceResponse;
      } else {
        if (!pickupCoords || !duration) {
          throw new Error('Please fill in all required fields');
        }

        // For hourly service, just return duration info for step 2
        return {
          distanceKm: 0,
          durationMinutes: parseInt(duration) * 60
        };
      }
    },
    onSuccess: (data) => {
      setQuoteData(data);
      setStep(2);
      toast({
        title: "Quote Calculated",
        description: "Please select your vehicle to see pricing.",
      });
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
          // Include via points if they exist
          ...(viaPoints.length > 0 && {
            viaPoints: viaPoints.filter(point => point.trim() !== ''),
            viaCoordinates: viaCoords ? Object.values(viaCoords) : [],
          }),
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
    // Validation for step 1
    if (activeTab === 'transfer') {
      if (!fromAddress || !toAddress || !date || !time) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }
      
      if (!fromCoords || !toCoords) {
        toast({
          title: "Address Error",
          description: "Please select valid addresses from the suggestions.",
          variant: "destructive",
        });
        return;
      }
    } else {
      if (!pickupAddress || !duration || !date || !time) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }
      
      if (!pickupCoords) {
        toast({
          title: "Address Error",
          description: "Please select a valid pickup address from the suggestions.",
          variant: "destructive",
        });
        return;
      }
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
                {viaPoints.length > 0 && viaPoints.map((viaPoint, index) => 
                  viaPoint && (
                    <div key={index} className="flex justify-between">
                      <span>Via {index + 1}:</span>
                      <span data-testid={`trip-via-${index}`} className="text-right">{viaPoint}</span>
                    </div>
                  )
                )}
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

        {/* Vehicle Selection Grid */}
        <div>
          <h3 className="text-xl font-bold text-primary mb-6">Select Your Vehicle</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {vehicleTypes?.map((vehicle) => (
              <div
                key={vehicle.id}
                className={`p-5 rounded-xl cursor-pointer transition-all border-2 text-center ${
                  selectedVehicle === vehicle.id 
                    ? 'border-primary bg-primary/10 transform -translate-y-1 shadow-lg' 
                    : 'border-primary/20 hover:border-primary hover:transform hover:-translate-y-1 hover:shadow-md'
                }`}
                onClick={() => setSelectedVehicle(vehicle.id)}
                data-testid={`vehicle-${vehicle.id}`}
              >
                <h4 className="font-bold text-primary text-lg mb-2">{vehicle.name}</h4>
                <p className="text-2xl font-bold text-primary mb-3">
                  ${vehicle.hourlyRate}{activeTab === 'hourly' ? '/hour' : ''}
                </p>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Up to {vehicle.passengerCapacity} passengers</div>
                  <div>{vehicle.luggageCapacity}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Service Includes Section */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
          <h4 className="text-lg font-bold text-primary mb-4">All Classes Include:</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center">
              <span className="text-primary mr-2 font-bold">✓</span>
              Free cancellation up until 2 hours before pickup
            </li>
            <li className="flex items-center">
              <span className="text-primary mr-2 font-bold">✓</span>
              Free 15 minutes of wait time in city pickups
            </li>
            <li className="flex items-center">
              <span className="text-primary mr-2 font-bold">✓</span>
              Free 1 hour of wait time in airport pickups
            </li>
            <li className="flex items-center">
              <span className="text-primary mr-2 font-bold">✓</span>
              Meet & Greet service
            </li>
            <li className="flex items-center">
              <span className="text-primary mr-2 font-bold">✓</span>
              Complimentary bottle of water
            </li>
            <li className="flex items-center">
              <span className="text-primary mr-2 font-bold">✓</span>
              Complimentary in-vehicle WiFi
            </li>
            <li className="flex items-center">
              <span className="text-primary mr-2 font-bold">✓</span>
              Tissues and sanitizer
            </li>
            <li className="flex items-center">
              <span className="text-primary mr-2 font-bold">✓</span>
              Android and iPhone chargers
            </li>
          </ul>
          
          <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-800 font-medium mb-2">
              <strong>Guest/luggage capacities must be abided by for safety reasons. If you are unsure, select a larger class as chauffeurs may turn down service when they are exceeded.</strong>
            </p>
            <p className="text-sm text-orange-800">
              <strong>The vehicle images above are examples. You may get a different vehicle of similar quality.</strong>
            </p>
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
            disabled={bookingMutation.isPending || !selectedVehicle}
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
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl">
      {/* Enhanced Service Type Tabs */}
      <div className="flex mb-8 border-b-2 border-gray-200">
        <button
          onClick={() => setActiveTab('transfer')}
          className={`flex-1 py-4 px-6 text-lg font-semibold transition-all border-b-4 ${
            activeTab === 'transfer'
              ? 'text-primary border-primary font-bold'
              : 'text-gray-500 border-transparent hover:text-gray-700'
          }`}
          data-testid="tab-transfer"
        >
          Transfer Only
        </button>
        <button
          onClick={() => setActiveTab('hourly')}
          className={`flex-1 py-4 px-6 text-lg font-semibold transition-all border-b-4 ${
            activeTab === 'hourly'
              ? 'text-primary border-primary font-bold'
              : 'text-gray-500 border-transparent hover:text-gray-700'
          }`}
          data-testid="tab-hourly"
        >
          Hourly
        </button>
      </div>

      {/* Transfer Form */}
      {activeTab === 'transfer' && (
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-primary mb-6">Book Your Transfer</h3>
          
          {/* From Address */}
          <div className="relative">
            <Label htmlFor="from" className="text-base font-semibold text-gray-700">From *</Label>
            <Input
              id="from"
              value={fromAddress}
              onChange={(e) => {
                setFromAddress(e.target.value);
                handleAddressInput('from', e.target.value);
              }}
              placeholder="Pickup location"
              autoComplete="off"
              className="mt-2 p-3 text-base border-2 border-gray-300 rounded-lg focus:border-primary"
              data-testid="input-from"
            />
            {showSuggestions.from && suggestions.from?.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 border-t-0 rounded-b-lg max-h-48 overflow-y-auto z-50 shadow-lg">
                {suggestions.from.map((suggestion, index) => (
                  <div
                    key={index}
                    className="p-3 cursor-pointer border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    onClick={() => selectSuggestion('from', suggestion)}
                    data-testid={`suggestion-from-${index}`}
                  >
                    <div className="font-semibold text-gray-800">{suggestion.display_name}</div>
                  </div>
                ))}
              </div>
            )}
            {fromCoords && (
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700 font-mono" data-testid="from-coordinates">
                <span className="font-semibold">📍 Location: </span>
                <span>Lat: {fromCoords.lat.toFixed(6)}, Lng: {fromCoords.lon.toFixed(6)}</span>
              </div>
            )}
          </div>

          {/* Via Points Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-base font-semibold text-gray-700">+ Via Point (Optional)</Label>
              <Button
                type="button"
                onClick={addViaPoint}
                disabled={viaPoints.length >= 3}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:bg-gray-400"
                data-testid="button-add-via"
              >
                Add
              </Button>
            </div>
            
            {viaPoints.map((viaPoint, index) => (
              <div key={index} className="flex items-center gap-3 mb-3">
                <div className="relative flex-1">
                  <Input
                    value={viaPoint}
                    onChange={(e) => updateViaPoint(index, e.target.value)}
                    placeholder={`Via point ${index + 1}`}
                    autoComplete="off"
                    className="p-3 text-base border-2 border-gray-300 rounded-lg focus:border-primary"
                    data-testid={`input-via-${index}`}
                  />
                  {showSuggestions[`via-${index}`] && suggestions[`via-${index}`]?.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 border-t-0 rounded-b-lg max-h-48 overflow-y-auto z-50 shadow-lg">
                      {suggestions[`via-${index}`].map((suggestion, sugIndex) => (
                        <div
                          key={sugIndex}
                          className="p-3 cursor-pointer border-b border-gray-100 hover:bg-gray-50 transition-colors"
                          onClick={() => selectSuggestion(`via-${index}`, suggestion)}
                          data-testid={`suggestion-via-${index}-${sugIndex}`}
                        >
                          <div className="font-semibold text-gray-800">{suggestion.display_name}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {viaCoords && viaCoords[index] && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700 font-mono" data-testid={`via-${index}-coordinates`}>
                      <span className="font-semibold">📍 Location: </span>
                      <span>Lat: {viaCoords[index].lat.toFixed(6)}, Lng: {viaCoords[index].lon.toFixed(6)}</span>
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  onClick={() => removeViaPoint(index)}
                  className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  data-testid={`button-remove-via-${index}`}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>

          {/* To Address */}
          <div className="relative">
            <Label htmlFor="to" className="text-base font-semibold text-gray-700">To *</Label>
            <Input
              id="to"
              value={toAddress}
              onChange={(e) => {
                setToAddress(e.target.value);
                handleAddressInput('to', e.target.value);
              }}
              placeholder="Destination"
              autoComplete="off"
              className="mt-2 p-3 text-base border-2 border-gray-300 rounded-lg focus:border-primary"
              data-testid="input-to"
            />
            {showSuggestions.to && suggestions.to?.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 border-t-0 rounded-b-lg max-h-48 overflow-y-auto z-50 shadow-lg">
                {suggestions.to.map((suggestion, index) => (
                  <div
                    key={index}
                    className="p-3 cursor-pointer border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    onClick={() => selectSuggestion('to', suggestion)}
                    data-testid={`suggestion-to-${index}`}
                  >
                    <div className="font-semibold text-gray-800">{suggestion.display_name}</div>
                  </div>
                ))}
              </div>
            )}
            {toCoords && (
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700 font-mono" data-testid="to-coordinates">
                <span className="font-semibold">📍 Location: </span>
                <span>Lat: {toCoords.lat.toFixed(6)}, Lng: {toCoords.lon.toFixed(6)}</span>
              </div>
            )}
          </div>

          {/* Date and Time Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date" className="text-base font-semibold text-gray-700">Date *</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="mt-2 p-3 text-base border-2 border-gray-300 rounded-lg focus:border-primary"
                data-testid="input-date"
              />
            </div>
            <div>
              <Label htmlFor="time" className="text-base font-semibold text-gray-700">Time *</Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="mt-2 p-3 text-base border-2 border-gray-300 rounded-lg focus:border-primary"
                data-testid="input-time"
              />
            </div>
          </div>

          {/* Get Quote Button */}
          <Button
            onClick={handleGetQuote}
            disabled={quoteMutation.isPending}
            className="w-full p-4 text-lg font-semibold bg-primary hover:bg-primary/90 text-white rounded-lg transition-all hover:transform hover:-translate-y-1 hover:shadow-lg"
            data-testid="button-get-quote"
          >
            {quoteMutation.isPending ? 'Calculating...' : 'Get a Quote'}
          </Button>
        </div>
      )}

      {/* Hourly Form */}
      {activeTab === 'hourly' && (
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-primary mb-6">Book Hourly Service</h3>
          
          {/* Pickup Address */}
          <div className="relative">
            <Label htmlFor="pickup" className="text-base font-semibold text-gray-700">Pickup Address *</Label>
            <Input
              id="pickup"
              value={pickupAddress}
              onChange={(e) => {
                setPickupAddress(e.target.value);
                handleAddressInput('pickup', e.target.value);
              }}
              placeholder="Enter pickup location"
              autoComplete="off"
              className="mt-2 p-3 text-base border-2 border-gray-300 rounded-lg focus:border-primary"
              data-testid="input-pickup"
            />
            {showSuggestions.pickup && suggestions.pickup?.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 border-t-0 rounded-b-lg max-h-48 overflow-y-auto z-50 shadow-lg">
                {suggestions.pickup.map((suggestion, index) => (
                  <div
                    key={index}
                    className="p-3 cursor-pointer border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    onClick={() => selectSuggestion('pickup', suggestion)}
                    data-testid={`suggestion-pickup-${index}`}
                  >
                    <div className="font-semibold text-gray-800">{suggestion.display_name}</div>
                  </div>
                ))}
              </div>
            )}
            {pickupCoords && (
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700 font-mono" data-testid="pickup-coordinates">
                <span className="font-semibold">📍 Location: </span>
                <span>Lat: {pickupCoords.lat.toFixed(6)}, Lng: {pickupCoords.lon.toFixed(6)}</span>
              </div>
            )}
          </div>

          {/* Duration */}
          <div>
            <Label htmlFor="duration" className="text-base font-semibold text-gray-700">Duration (2-24 hours) *</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger className="mt-2 p-3 text-base border-2 border-gray-300 rounded-lg" data-testid="select-duration">
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

          {/* Date and Time Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date" className="text-base font-semibold text-gray-700">Date *</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="mt-2 p-3 text-base border-2 border-gray-300 rounded-lg focus:border-primary"
                data-testid="input-date"
              />
            </div>
            <div>
              <Label htmlFor="time" className="text-base font-semibold text-gray-700">Time *</Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="mt-2 p-3 text-base border-2 border-gray-300 rounded-lg focus:border-primary"
                data-testid="input-time"
              />
            </div>
          </div>

          {/* Get Quote Button */}
          <Button
            onClick={handleGetQuote}
            disabled={quoteMutation.isPending}
            className="w-full p-4 text-lg font-semibold bg-primary hover:bg-primary/90 text-white rounded-lg transition-all hover:transform hover:-translate-y-1 hover:shadow-lg"
            data-testid="button-get-quote"
          >
            {quoteMutation.isPending ? 'Calculating...' : 'Get a Quote'}
          </Button>
        </div>
      )}
    </div>
  );
}
