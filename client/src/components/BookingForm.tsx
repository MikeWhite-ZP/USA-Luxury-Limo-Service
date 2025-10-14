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
  const { isAuthenticated, user } = useAuth();
  const [, setLocation] = useLocation();
  
  const [activeTab, setActiveTab] = useState<'transfer' | 'hourly'>('transfer');
  const [step, setStep] = useState(1);
  
  // Form state - Step 1 & 2
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
  
  // Form state - Step 3 (Additional Information)
  const [bookingFor, setBookingFor] = useState<'self' | 'someone_else'>('self');
  const [passengerName, setPassengerName] = useState('');
  const [passengerPhone, setPassengerPhone] = useState('');
  const [passengerEmail, setPassengerEmail] = useState('');
  const [flightNumber, setFlightNumber] = useState('');
  const [flightName, setFlightName] = useState('');
  const [noFlightInfo, setNoFlightInfo] = useState(false);
  const [passengerCount, setPassengerCount] = useState(1);
  const [luggageCount, setLuggageCount] = useState(0);
  const [babySeat, setBabySeat] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState('');
  
  const suggestionTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Set minimum date to today and restore saved booking data
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setDate(today);
    
    // Check for saved booking data from localStorage
    const savedBookingData = localStorage.getItem('pendingBookingData');
    if (savedBookingData) {
      try {
        const data = JSON.parse(savedBookingData);
        
        // Restore all form state - Step 1 & 2
        setActiveTab(data.activeTab);
        setFromAddress(data.fromAddress || '');
        setToAddress(data.toAddress || '');
        setPickupAddress(data.pickupAddress || '');
        setDate(data.date || today);
        setTime(data.time || '');
        setDuration(data.duration || '');
        setSelectedVehicle(data.selectedVehicle || '');
        setViaPoints(data.viaPoints || []);
        setViaCoords(data.viaCoords || null);
        setFromCoords(data.fromCoords || null);
        setToCoords(data.toCoords || null);
        setPickupCoords(data.pickupCoords || null);
        setQuoteData(data.quoteData || null);
        setCalculatedPrices(data.calculatedPrices || {});
        
        // Restore step 3 data if exists
        if (data.bookingFor) setBookingFor(data.bookingFor);
        if (data.passengerName) setPassengerName(data.passengerName);
        if (data.passengerPhone) setPassengerPhone(data.passengerPhone);
        if (data.passengerEmail) setPassengerEmail(data.passengerEmail);
        if (data.flightNumber) setFlightNumber(data.flightNumber);
        if (data.flightName) setFlightName(data.flightName);
        if (data.noFlightInfo !== undefined) setNoFlightInfo(data.noFlightInfo);
        if (data.passengerCount) setPassengerCount(data.passengerCount);
        if (data.luggageCount !== undefined) setLuggageCount(data.luggageCount);
        if (data.babySeat !== undefined) setBabySeat(data.babySeat);
        if (data.specialInstructions) setSpecialInstructions(data.specialInstructions);
        
        // If user was on step 2 and is now authenticated, proceed to step 3
        // Pre-fill passenger info if booking for self
        if (isAuthenticated && data.step === 2) {
          if (user && data.bookingFor === 'self') {
            setPassengerName(`${user.firstName || ''} ${user.lastName || ''}`.trim());
            setPassengerPhone(user.phone || '');
            setPassengerEmail(user.email || '');
          }
          setStep(3);
        } else {
          setStep(data.step);
        }
        
        // Show success message
        toast({
          title: "Booking Restored",
          description: "Your booking details have been restored. Please continue with your booking.",
        });
      } catch (error) {
        console.error('Error restoring booking data:', error);
      }
    }
  }, [toast]);

  // Fetch vehicle types
  const { data: vehicleTypes } = useQuery<VehicleType[]>({
    queryKey: ['/api/vehicle-types'],
  });

  // Fetch available pricing rules for current service type
  const { data: pricingRules } = useQuery<Record<string, any>>({
    queryKey: [`/api/pricing-rules/available?serviceType=${activeTab}`],
    enabled: !!activeTab,
  });

  // Store calculated prices for each vehicle
  const [calculatedPrices, setCalculatedPrices] = useState<Record<string, string>>({});

  // Convert vehicle display name to pricing rule slug
  const getVehicleSlug = (vehicleName: string): string => {
    // Convert "Business Sedan" → "business_sedan", "First-Class Sedan" → "first_class_sedan", etc.
    return vehicleName
      .toLowerCase()
      .replace(/-/g, '_')  // Replace hyphens with underscores
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/[^a-z0-9_]/g, ''); // Remove any other special characters
  };

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
        const distanceResponse = await apiRequest('POST', '/api/calculate-distance', {
          origins: `${fromCoords.lat},${fromCoords.lon}`,
          destinations: `${toCoords.lat},${toCoords.lon}`
        });
        
        const distanceData = await distanceResponse.json();
        
        // Get available vehicles with pricing rules
        if (!pricingRules || Object.keys(pricingRules).length === 0) {
          throw new Error('No pricing rules configured. Please contact support.');
        }

        // Calculate prices for all available vehicles
        const pricePromises = Object.keys(pricingRules).map(async (vehicleTypeSlug) => {
          try {
            const priceResponse = await apiRequest('POST', '/api/calculate-price', {
              vehicleType: vehicleTypeSlug,
              serviceType: 'transfer',
              distance: distanceData.distance,
              date,
              time
            });
            const priceData = await priceResponse.json();
            return { vehicleType: vehicleTypeSlug, price: priceData.price };
          } catch (error) {
            console.error(`Failed to calculate price for ${vehicleTypeSlug}:`, error);
            return { vehicleType: vehicleTypeSlug, price: null };
          }
        });

        const prices = await Promise.all(pricePromises);
        const priceMap = prices.reduce((acc, { vehicleType, price }) => {
          if (price) acc[vehicleType] = price;
          return acc;
        }, {} as Record<string, string>);

        setCalculatedPrices(priceMap);

        return {
          ...distanceData,
          prices: priceMap
        };
      } else {
        if (!pickupCoords || !duration) {
          throw new Error('Please fill in all required fields');
        }

        // Get available vehicles with pricing rules
        if (!pricingRules || Object.keys(pricingRules).length === 0) {
          throw new Error('No pricing rules configured. Please contact support.');
        }

        // Calculate prices for all available vehicles (hourly service)
        const pricePromises = Object.keys(pricingRules).map(async (vehicleTypeSlug) => {
          try {
            const priceResponse = await apiRequest('POST', '/api/calculate-price', {
              vehicleType: vehicleTypeSlug,
              serviceType: 'hourly',
              hours: duration,
              date,
              time
            });
            const priceData = await priceResponse.json();
            return { vehicleType: vehicleTypeSlug, price: priceData.price };
          } catch (error) {
            console.error(`Failed to calculate price for ${vehicleTypeSlug}:`, error);
            return { vehicleType: vehicleTypeSlug, price: null };
          }
        });

        const prices = await Promise.all(pricePromises);
        const priceMap = prices.reduce((acc, { vehicleType, price }) => {
          if (price) acc[vehicleType] = price;
          return acc;
        }, {} as Record<string, string>);

        setCalculatedPrices(priceMap);

        return {
          distanceKm: 0,
          durationMinutes: parseInt(duration) * 60,
          prices: priceMap
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
        scheduledDateTime: new Date(`${date}T${time}`),
        totalAmount: parseFloat(quoteData.totalAmount),
        ...(activeTab === 'transfer' ? {
          pickupAddress: fromAddress,
          pickupLat: fromCoords?.lat.toString(),
          pickupLon: fromCoords?.lon.toString(),
          destinationAddress: toAddress,
          destinationLat: toCoords?.lat.toString(),
          destinationLon: toCoords?.lon.toString(),
          // Include via points if they exist
          ...(viaPoints.length > 0 && {
            viaPoints: viaPoints.filter(point => point.trim() !== ''),
            viaCoordinates: viaCoords ? Object.values(viaCoords) : [],
          }),
        } : {
          pickupAddress,
          pickupLat: pickupCoords?.lat.toString(),
          pickupLon: pickupCoords?.lon.toString(),
          requestedHours: parseInt(duration),
        }),
        // Step 3 - Additional booking information
        bookingFor,
        passengerName: passengerName || undefined,
        passengerPhone: passengerPhone || undefined,
        passengerEmail: passengerEmail || undefined,
        flightNumber: flightNumber || undefined,
        flightName: flightName || undefined,
        noFlightInfo,
        passengerCount,
        luggageCount,
        babySeat,
        specialInstructions: specialInstructions || undefined,
      };

      const response = await apiRequest('POST', '/api/bookings', bookingData);
      return await response.json();
    },
    onSuccess: (booking) => {
      // Clear saved booking data from localStorage after successful booking
      localStorage.removeItem('pendingBookingData');
      
      // Check if user has pay later enabled
      if (user?.payLaterEnabled && user.role === 'passenger') {
        // Pay later enabled - skip payment and go to bookings
        toast({
          title: "Booking Confirmed",
          description: "Your booking has been confirmed. You can pay after the trip is completed.",
        });
        setLocation('/bookings');
      } else {
        // Regular flow - proceed to payment
        setLocation(`/checkout?bookingId=${booking.id}&amount=${quoteData.totalAmount}`);
      }
    },
    onError: (error: Error) => {
      if (error.message.includes('sign in')) {
        // Save booking data to localStorage before redirecting to login
        const bookingDataToSave = {
          activeTab,
          step,
          fromAddress,
          toAddress,
          pickupAddress,
          date,
          time,
          duration,
          selectedVehicle,
          viaPoints,
          viaCoords,
          fromCoords,
          toCoords,
          pickupCoords,
          quoteData,
          calculatedPrices,
          // Step 3 data
          bookingFor,
          passengerName,
          passengerPhone,
          passengerEmail,
          flightNumber,
          flightName,
          noFlightInfo,
          passengerCount,
          luggageCount,
          babySeat,
          specialInstructions,
        };
        localStorage.setItem('pendingBookingData', JSON.stringify(bookingDataToSave));
        
        toast({
          title: "Authentication Required",
          description: "Please sign in to complete your booking",
          variant: "destructive",
        });
        setTimeout(() => {
          setLocation('/login');
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
    // Check if user is authenticated before proceeding to step 3
    if (!isAuthenticated) {
      // Save booking data to localStorage before redirecting to login
      const bookingDataToSave = {
        activeTab,
        step: 2, // Save as step 2 so user returns to vehicle selection
        fromAddress,
        toAddress,
        pickupAddress,
        date,
        time,
        duration,
        selectedVehicle,
        viaPoints,
        viaCoords,
        fromCoords,
        toCoords,
        pickupCoords,
        quoteData,
        calculatedPrices,
        // Step 3 data (if any)
        bookingFor,
        passengerName,
        passengerPhone,
        passengerEmail,
        flightNumber,
        flightName,
        noFlightInfo,
        passengerCount,
        luggageCount,
        babySeat,
        specialInstructions,
      };
      localStorage.setItem('pendingBookingData', JSON.stringify(bookingDataToSave));
      
      toast({
        title: "Authentication Required",
        description: "Please sign in to continue with your booking",
        variant: "destructive",
      });
      setTimeout(() => {
        setLocation('/login');
      }, 1000);
      return;
    }
    
    // User is authenticated - Pre-fill step 3 data with user info if booking for self
    if (user && bookingFor === 'self') {
      setPassengerName(`${user.firstName || ''} ${user.lastName || ''}`.trim());
      setPassengerPhone(user.phone || '');
      setPassengerEmail(user.email || '');
    }
    setStep(3);
  };
  
  const handleProceedToPayment = () => {
    // Validation for step 3
    if (bookingFor === 'someone_else') {
      if (!passengerName || !passengerPhone || !passengerEmail) {
        toast({
          title: "Missing Information",
          description: "Please provide passenger name, phone, and email when booking for someone else.",
          variant: "destructive",
        });
        return;
      }
    }
    
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
          <div className="space-y-3 mb-6">
            {vehicleTypes
              ?.filter(vehicle => {
                // Only show vehicles that have pricing rules and calculated prices
                const vehicleSlug = getVehicleSlug(vehicle.name);
                const hasPricing = pricingRules && pricingRules[vehicleSlug];
                const hasCalculatedPrice = calculatedPrices[vehicleSlug];
                return hasPricing && hasCalculatedPrice;
              })
              .sort((a, b) => {
                // Sort by calculated price
                const slugA = getVehicleSlug(a.name);
                const slugB = getVehicleSlug(b.name);
                const priceA = parseFloat(calculatedPrices[slugA] || '0');
                const priceB = parseFloat(calculatedPrices[slugB] || '0');
                return priceA - priceB;
              })
              .map((vehicle) => {
                const vehicleSlug = getVehicleSlug(vehicle.name);
                const calculatedPrice = calculatedPrices[vehicleSlug];
                
                // Customize descriptions based on vehicle type
                let capacityText = `Up to ${vehicle.passengerCapacity} passengers`;
                let luggageText = vehicle.luggageCapacity;
                
                if (vehicle.name.toLowerCase().includes('sedan')) {
                  capacityText = '3 passengers';
                  luggageText = '2 large bags';
                } else if (vehicle.name.toLowerCase().includes('suv')) {
                  capacityText = '6 passengers';
                  luggageText = '4-5 bags';
                }
                
                return (
                  <div
                    key={vehicle.id}
                    className={`p-4 rounded-xl cursor-pointer transition-all border-2 flex items-center gap-4 ${
                      selectedVehicle === vehicle.id 
                        ? 'border-primary bg-primary/10 shadow-lg' 
                        : 'border-primary/20 hover:border-primary hover:shadow-md'
                    }`}
                    onClick={() => setSelectedVehicle(vehicle.id)}
                    data-testid={`vehicle-${vehicle.id}`}
                  >
                    {/* Vehicle Image */}
                    {vehicle.imageUrl && (
                      <div className="w-20 h-16 flex-shrink-0">
                        <img 
                          src={vehicle.imageUrl} 
                          alt={vehicle.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                    )}
                    
                    {/* Vehicle Info */}
                    <div className="flex-1">
                      <h4 className="font-bold text-primary text-lg">{vehicle.name}</h4>
                      <div className="text-sm text-gray-600 mt-1">
                        {capacityText} • {luggageText}
                      </div>
                    </div>
                    
                    {/* Price */}
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary" data-testid={`price-${vehicle.id}`}>
                        ${calculatedPrice}
                      </p>
                      <p className="text-xs text-gray-500">Total Price</p>
                    </div>
                  </div>
                );
              })}
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
            {bookingMutation.isPending ? 'Processing...' : 'Continue'}
          </Button>
        </div>
      </div>
    );
  }

  if (step === 3 && quoteData) {
    return (
      <div className="space-y-6">
        {/* Trip Summary - Compact View */}
        <div className="bg-gray-50 p-4 rounded-lg" data-testid="trip-summary">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">
              {new Date(`${date}T${time}`).toLocaleString()}
            </span>
            <span className="text-xl font-bold text-primary">${quoteData.totalAmount}</span>
          </div>
          <div className="text-sm text-gray-700">
            <div className="flex items-start gap-2">
              <span className="text-green-600">●</span>
              <span>{activeTab === 'transfer' ? fromAddress : pickupAddress}</span>
            </div>
            {activeTab === 'transfer' && toAddress && (
              <div className="flex items-start gap-2 mt-1">
                <span className="text-red-600">●</span>
                <span>{toAddress}</span>
              </div>
            )}
          </div>
        </div>

        {/* Booking For */}
        <div data-testid="booking-for-section">
          <h4 className="font-semibold mb-3">Are you booking for yourself or someone else?</h4>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                setBookingFor('self');
                if (user) {
                  setPassengerName(`${user.firstName || ''} ${user.lastName || ''}`.trim());
                  setPassengerPhone(user.phone || '');
                  setPassengerEmail(user.email || '');
                }
              }}
              className={`p-4 rounded-lg border-2 transition-all ${
                bookingFor === 'self' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              data-testid="radio-booking-self"
            >
              <div className="flex items-center gap-2">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  bookingFor === 'self' ? 'border-primary' : 'border-gray-300'
                }`}>
                  {bookingFor === 'self' && <div className="w-3 h-3 rounded-full bg-primary" />}
                </div>
                <span className="font-medium">I am booking for myself</span>
              </div>
            </button>
            <button
              onClick={() => {
                setBookingFor('someone_else');
                setPassengerName('');
                setPassengerPhone('');
                setPassengerEmail('');
              }}
              className={`p-4 rounded-lg border-2 transition-all ${
                bookingFor === 'someone_else' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              data-testid="radio-booking-someone-else"
            >
              <div className="flex items-center gap-2">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  bookingFor === 'someone_else' ? 'border-primary' : 'border-gray-300'
                }`}>
                  {bookingFor === 'someone_else' && <div className="w-3 h-3 rounded-full bg-primary" />}
                </div>
                <span className="font-medium">I am booking for someone else</span>
              </div>
            </button>
          </div>
        </div>

        {/* Additional Information */}
        <div data-testid="additional-info-section">
          <h4 className="font-semibold mb-3">Provide additional information</h4>
          <div className="space-y-3">
            <Input
              placeholder="Passenger Name"
              value={passengerName}
              onChange={(e) => setPassengerName(e.target.value)}
              data-testid="input-passenger-name"
            />
            <Input
              placeholder="Phone Number"
              value={passengerPhone}
              onChange={(e) => setPassengerPhone(e.target.value)}
              data-testid="input-passenger-phone"
            />
            <Input
              placeholder="Email"
              type="email"
              value={passengerEmail}
              onChange={(e) => setPassengerEmail(e.target.value)}
              data-testid="input-passenger-email"
            />
          </div>
        </div>

        {/* Flight Details */}
        <div data-testid="flight-details-section">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-semibold">Flight Details</h4>
            <button className="text-sm text-red-600 font-medium" data-testid="button-check-flight">
              check flight
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-2">
            <Input
              placeholder="Enter Flight Number"
              value={flightNumber}
              onChange={(e) => setFlightNumber(e.target.value)}
              disabled={noFlightInfo}
              data-testid="input-flight-number"
            />
            <Input
              placeholder="Enter Flight Name"
              value={flightName}
              onChange={(e) => setFlightName(e.target.value)}
              disabled={noFlightInfo}
              data-testid="input-flight-name"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={noFlightInfo}
              onChange={(e) => {
                setNoFlightInfo(e.target.checked);
                if (e.target.checked) {
                  setFlightNumber('');
                  setFlightName('');
                }
              }}
              data-testid="checkbox-no-flight-info"
            />
            I don't have flight information.
          </label>
        </div>

        {/* Passenger Count */}
        <div data-testid="passenger-count-section">
          <div className="flex justify-between items-center">
            <span className="font-semibold">Passenger</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPassengerCount(Math.max(1, passengerCount - 1))}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                data-testid="button-decrease-passengers"
              >
                −
              </button>
              <span className="w-8 text-center font-medium" data-testid="text-passenger-count">{passengerCount}</span>
              <button
                onClick={() => setPassengerCount(passengerCount + 1)}
                className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700"
                data-testid="button-increase-passengers"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Luggage Count */}
        <div data-testid="luggage-count-section">
          <div className="flex justify-between items-center">
            <span className="font-semibold">Luggage</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setLuggageCount(Math.max(0, luggageCount - 1))}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                data-testid="button-decrease-luggage"
              >
                −
              </button>
              <span className="w-8 text-center font-medium" data-testid="text-luggage-count">{luggageCount}</span>
              <button
                onClick={() => setLuggageCount(luggageCount + 1)}
                className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700"
                data-testid="button-increase-luggage"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Baby Seat */}
        <div data-testid="baby-seat-section">
          <div className="flex justify-between items-center">
            <span className="font-semibold">Baby Seat (optional)</span>
            <label className="relative inline-block w-12 h-6">
              <input
                type="checkbox"
                checked={babySeat}
                onChange={(e) => setBabySeat(e.target.checked)}
                className="sr-only peer"
                data-testid="toggle-baby-seat"
              />
              <div className="w-12 h-6 bg-gray-300 rounded-full peer peer-checked:bg-primary transition-colors"></div>
              <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
            </label>
          </div>
        </div>

        {/* Special Instructions */}
        <div data-testid="special-instructions-section">
          <h4 className="font-semibold mb-2">Special Instructions</h4>
          <textarea
            placeholder="Is there anything else we need to know?"
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg resize-none h-24"
            data-testid="textarea-special-instructions"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => setStep(2)}
            className="flex-1"
            data-testid="button-back-step3"
          >
            Back
          </Button>
          <Button 
            onClick={handleProceedToPayment}
            disabled={bookingMutation.isPending}
            className="flex-1 bg-red-600 hover:bg-red-700"
            data-testid="button-proceed-payment"
          >
            {bookingMutation.isPending ? 'Processing...' : 'PROCEED TO PAYMENT'}
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
              : 'text-gray-300 border-transparent hover:text-gray-500'
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
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-[8px] text-green-700 font-mono" data-testid="from-coordinates">
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
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-[8px] text-green-700 font-mono" data-testid={`via-${index}-coordinates`}>
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
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-[8px] text-green-700 font-mono" data-testid="to-coordinates">
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
            className="w-full py-6 px-8 text-xl font-bold bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 active:from-red-800 active:to-red-900 text-white rounded-xl transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-2xl active:transform active:scale-95 border-2 border-red-600 hover:border-red-700 shadow-lg mt-8 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
            data-testid="button-get-quote"
          >
            {quoteMutation.isPending ? 'Calculating Quote...' : 'Get a Quote'}
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
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-[8px] text-green-700 font-mono" data-testid="pickup-coordinates">
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
            className="w-full py-6 px-8 text-xl font-bold bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 active:from-red-800 active:to-red-900 text-white rounded-xl transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-2xl active:transform active:scale-95 border-2 border-red-600 hover:border-red-700 shadow-lg mt-8 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
            data-testid="button-get-quote"
          >
            {quoteMutation.isPending ? 'Calculating Quote...' : 'Get a Quote'}
          </Button>
        </div>
      )}
    </div>
  );
}
