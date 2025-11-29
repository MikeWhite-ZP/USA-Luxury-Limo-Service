import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { 
  ArrowLeft, 
  Car, 
  Clock, 
  MapPin, 
  Calendar, 
  Users, 
  Briefcase, 
  Baby, 
  FileText,
  Plane,
  Search,
  X,
  Plus,
  Trash2,
  Check
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

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

interface PaymentMethodsResponse {
  paymentMethods: any[];
  defaultPaymentMethodId: string | null;
}

export default function MobileBookingForm() {
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
  const [hour, setHour] = useState('12');
  const [minute, setMinute] = useState('00');
  const [period, setPeriod] = useState<'AM' | 'PM'>('PM');
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
  const [passengerCount, setPassengerCount] = useState(1);
  const [luggageCount, setLuggageCount] = useState(0);
  const [babySeat, setBabySeat] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState('');
  
  // Flight search state
  const [flightSearchInput, setFlightSearchInput] = useState('');
  const [selectedFlight, setSelectedFlight] = useState<any>(null);
  const [flightResults, setFlightResults] = useState<any[]>([]);
  const [showFlightDialog, setShowFlightDialog] = useState(false);
  const [isSearchingFlight, setIsSearchingFlight] = useState(false);
  
  // Payment options dialog state
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [createdBooking, setCreatedBooking] = useState<any>(null);
  
  const suggestionTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Fetch user's payment methods to check if they have saved cards
  const { data: paymentData } = useQuery<PaymentMethodsResponse>({
    queryKey: ['/api/payment-methods'],
    enabled: isAuthenticated && showPaymentOptions,
  });

  const paymentMethods = paymentData?.paymentMethods || [];

  // Sync time state from hour, minute, and period
  useEffect(() => {
    let hours = parseInt(hour);
    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }
    const formattedTime = `${hours.toString().padStart(2, '0')}:${minute}`;
    setTime(formattedTime);
  }, [hour, minute, period]);

  // Set minimum date to today
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setDate(today);
  }, []);

  // Track if we've auto-filled on initial entry to step 3
  const [hasAutoFilled, setHasAutoFilled] = useState(false);

  // Auto-fill passenger details with logged-in user's information when reaching step 3
  useEffect(() => {
    if (step === 3 && isAuthenticated && user && !hasAutoFilled) {
      if (!passengerName && !passengerPhone && !passengerEmail && bookingFor === 'self') {
        setPassengerName(`${user.firstName || ''} ${user.lastName || ''}`.trim());
        setPassengerPhone(user.phone || '');
        setPassengerEmail(user.email || '');
        setHasAutoFilled(true);
      }
    }
    if (step !== 3) {
      setHasAutoFilled(false);
    }
  }, [step, isAuthenticated, user, hasAutoFilled, passengerName, passengerPhone, passengerEmail, bookingFor]);

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
  const [priceBreakdowns, setPriceBreakdowns] = useState<Record<string, {
    regularPrice: string;
    discountAmount: string;
    finalPrice: string;
  }>>({});

  // Convert vehicle display name to pricing rule slug
  const getVehicleSlug = (vehicleName: string): string => {
    return vehicleName
      .toLowerCase()
      .replace(/-/g, '_')
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
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
      
      setViaCoords(prev => ({
        ...(prev || {}),
        [index]: suggestion.position
      }));
    }
    
    setShowSuggestions(prev => ({ ...prev, [inputId]: false }));
  };

  // Via point functions
  const addViaPoint = () => {
    if (viaPoints.length < 3) {
      setViaPoints([...viaPoints, '']);
    }
  };

  const removeViaPoint = (index: number) => {
    const newViaPoints = viaPoints.filter((_, i) => i !== index);
    setViaPoints(newViaPoints);
    
    if (viaCoords) {
      const newViaCoords: {[key: number]: {lat: number, lon: number}} = {};
      Object.keys(viaCoords).forEach(key => {
        const keyIndex = parseInt(key);
        if (keyIndex < index) {
          newViaCoords[keyIndex] = viaCoords[keyIndex];
        } else if (keyIndex > index) {
          newViaCoords[keyIndex - 1] = viaCoords[keyIndex];
        }
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

        const distanceResponse = await apiRequest('POST', '/api/calculate-distance', {
          origins: `${fromCoords.lat},${fromCoords.lon}`,
          destinations: `${toCoords.lat},${toCoords.lon}`
        });
        
        const distanceData = await distanceResponse.json();
        
        if (!pricingRules || Object.keys(pricingRules).length === 0) {
          throw new Error('No pricing rules configured. Please contact support.');
        }

        const pricePromises = Object.keys(pricingRules).map(async (vehicleTypeSlug) => {
          try {
            const priceResponse = await apiRequest('POST', '/api/calculate-price', {
              vehicleType: vehicleTypeSlug,
              serviceType: 'transfer',
              distance: distanceData.distance,
              date,
              time,
              userId: user?.id
            });
            const priceData = await priceResponse.json();
            const finalPrice = priceData.price || priceData.finalPrice;
            return { 
              vehicleType: vehicleTypeSlug, 
              price: finalPrice,
              breakdown: {
                regularPrice: priceData.regularPrice || finalPrice,
                discountAmount: priceData.discountAmount || '0',
                finalPrice: finalPrice
              }
            };
          } catch (error) {
            console.error(`Failed to calculate price for ${vehicleTypeSlug}:`, error);
            return { vehicleType: vehicleTypeSlug, price: null, breakdown: null };
          }
        });

        const prices = await Promise.all(pricePromises);
        const priceMap = prices.reduce((acc, { vehicleType, price }) => {
          if (price) acc[vehicleType] = price;
          return acc;
        }, {} as Record<string, string>);
        const breakdownMap = prices.reduce((acc, { vehicleType, breakdown }) => {
          if (breakdown) acc[vehicleType] = breakdown;
          return acc;
        }, {} as Record<string, { regularPrice: string; discountAmount: string; finalPrice: string }>);

        setCalculatedPrices(priceMap);
        setPriceBreakdowns(breakdownMap);

        return {
          ...distanceData,
          prices: priceMap
        };
      } else {
        if (!pickupCoords || !duration) {
          throw new Error('Please fill in all required fields');
        }

        if (!pricingRules || Object.keys(pricingRules).length === 0) {
          throw new Error('No pricing rules configured. Please contact support.');
        }

        const pricePromises = Object.keys(pricingRules).map(async (vehicleTypeSlug) => {
          try {
            const priceResponse = await apiRequest('POST', '/api/calculate-price', {
              vehicleType: vehicleTypeSlug,
              serviceType: 'hourly',
              hours: duration,
              date,
              time,
              userId: user?.id
            });
            const priceData = await priceResponse.json();
            const finalPrice = priceData.price || priceData.finalPrice;
            return { 
              vehicleType: vehicleTypeSlug, 
              price: finalPrice,
              breakdown: {
                regularPrice: priceData.regularPrice || finalPrice,
                discountAmount: priceData.discountAmount || '0',
                finalPrice: finalPrice
              }
            };
          } catch (error) {
            console.error(`Failed to calculate price for ${vehicleTypeSlug}:`, error);
            return { vehicleType: vehicleTypeSlug, price: null, breakdown: null };
          }
        });

        const prices = await Promise.all(pricePromises);
        const priceMap = prices.reduce((acc, { vehicleType, price }) => {
          if (price) acc[vehicleType] = price;
          return acc;
        }, {} as Record<string, string>);
        const breakdownMap = prices.reduce((acc, { vehicleType, breakdown }) => {
          if (breakdown) acc[vehicleType] = breakdown;
          return acc;
        }, {} as Record<string, { regularPrice: string; discountAmount: string; finalPrice: string }>);

        setCalculatedPrices(priceMap);
        setPriceBreakdowns(breakdownMap);

        return {
          distanceKm: 0,
          durationMinutes: parseInt(duration) * 60,
          prices: priceMap
        };
      }
    },
    onSuccess: (data) => {
      setQuoteData(data);
      setCalculatedPrices(data.prices || {});
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

      const selectedVehicleName = vehicleTypes?.find(v => v.id === selectedVehicle)?.name || '';
      const selectedVehicleSlug = getVehicleSlug(selectedVehicleName);
      const totalPrice = calculatedPrices[selectedVehicleSlug] || '0';

      const bookingData = {
        vehicleTypeId: selectedVehicle,
        bookingType: activeTab,
        scheduledDateTime: new Date(`${date}T${time}`),
        totalAmount: totalPrice,
        ...(activeTab === 'transfer' ? {
          pickupAddress: fromAddress,
          pickupLat: fromCoords?.lat.toString(),
          pickupLon: fromCoords?.lon.toString(),
          destinationAddress: toAddress,
          destinationLat: toCoords?.lat.toString(),
          destinationLon: toCoords?.lon.toString(),
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
        bookingFor,
        passengerName: passengerName || undefined,
        passengerPhone: passengerPhone || undefined,
        passengerEmail: passengerEmail || undefined,
        passengerCount,
        luggageCount,
        babySeat,
        specialInstructions: specialInstructions || undefined,
        ...(selectedFlight && {
          flightNumber: selectedFlight.flightNumber,
          flightAirline: selectedFlight.airline,
          flightDeparture: selectedFlight.departure,
          flightArrival: selectedFlight.arrival,
          flightOrigin: selectedFlight.origin,
          flightDestination: selectedFlight.destination,
        }),
      };

      const response = await apiRequest('POST', '/api/bookings', bookingData);
      return await response.json();
    },
    onSuccess: (booking) => {
      const hasSavedCards = paymentMethods && paymentMethods.length > 0;
      
      if (!hasSavedCards) {
        toast({
          title: "Booking Confirmed",
          description: "Booking confirmed! Please add a payment method in your account settings for future payments.",
          variant: "default",
        });
      } else {
        toast({
          title: "Booking Confirmed",
          description: "Your booking has been confirmed. You can pay after the trip is completed.",
        });
      }
      
      setTimeout(() => {
        setLocation('/mobile-passenger');
      }, 1000);
    },
    onError: (error: Error) => {
      if (error.message.includes('sign in')) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to complete your booking",
          variant: "destructive",
        });
        setTimeout(() => {
          setLocation('/mobile-login?role=passenger');
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

  // Flight search handler
  const handleFlightSearch = async () => {
    if (!flightSearchInput.trim()) {
      toast({
        title: "Flight Number Required",
        description: "Please enter a flight number (e.g., KL30, UA2346, DL3427)",
        variant: "destructive",
      });
      return;
    }

    setIsSearchingFlight(true);
    
    let timeoutId: NodeJS.Timeout | undefined;
    try {
      const flightNumber = flightSearchInput.trim().toUpperCase();
      
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const queryParams = new URLSearchParams({ flightNumber });
      if (date) {
        queryParams.append('date', date);
      }
      
      const response = await fetch(
        `/api/flights/search?${queryParams.toString()}`,
        { signal: controller.signal }
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        
        if (response.status === 504 || response.status === 503) {
          throw new Error('The flight search service is currently slow or unavailable. Please try again in a moment.');
        } else if (response.status === 500 && errorData.error?.includes('not configured')) {
          throw new Error('Flight search is not configured. Please contact support.');
        } else {
          throw new Error(errorData.error || 'Flight search failed');
        }
      }

      const data = await response.json();
      
      let flightItems = [];
      
      if (Array.isArray(data)) {
        flightItems = data;
      } else if (data.items) {
        flightItems = data.items;
      }
      
      if (flightItems.length === 0) {
        toast({
          title: "No Flights Found",
          description: `No flights found for ${flightNumber}`,
          variant: "destructive",
        });
        return;
      }

      const airlineNames: Record<string, string> = {
        'AA': 'American Airlines',
        'UA': 'United Airlines',
        'DL': 'Delta Air Lines',
        'BA': 'British Airways',
        'EK': 'Emirates',
        'KL': 'KLM Royal Dutch Airlines',
        'AF': 'Air France',
        'LH': 'Lufthansa',
        'QR': 'Qatar Airways',
        'SQ': 'Singapore Airlines',
        'CX': 'Cathay Pacific',
        'JL': 'Japan Airlines',
        'NH': 'All Nippon Airways',
      };

      const flights = flightItems.map((flight: any, index: number) => {
        const flightNum = flight.number || flightNumber;
        const airlineCode = flightNum.trim().split(' ')[0] || flightNum.substring(0, 2);
        const airlineName = airlineNames[airlineCode] || flight.airline?.name || airlineCode;
        
        const departure = flight.departure || {};
        const arrival = flight.arrival || {};
        
        const departureAirport = departure.airport?.name || departure.airport?.iata || 'N/A';
        const arrivalAirport = arrival.airport?.name || arrival.airport?.iata || 'N/A';
        
        const departureTime = departure.scheduledTimeLocal || departure.scheduledTime || 'N/A';
        const arrivalTime = arrival.scheduledTimeLocal || arrival.scheduledTime || 'N/A';
        
        const departureTerminal = departure.terminal || 'N/A';
        const arrivalTerminal = arrival.terminal || 'N/A';
        const arrivalBaggage = arrival.baggageClaim || 'N/A';
        
        const aircraftModel = flight.aircraft?.model || 'N/A';
        
        return {
          id: index + 1,
          flightNumber: flightNum.trim(),
          airline: airlineName,
          departureAirport,
          arrivalAirport,
          departureTime,
          arrivalTime,
          departureTerminal,
          arrivalTerminal,
          baggageClaim: arrivalBaggage,
          aircraft: aircraftModel,
        };
      });

      if (flights.length === 1) {
        setSelectedFlight(flights[0]);
        toast({
          title: "Flight Found",
          description: `${flights[0].airline} ${flights[0].flightNumber} has been added to your booking`,
        });
      } else {
        setFlightResults(flights);
        setShowFlightDialog(true);
      }
      
    } catch (error: any) {
      console.error('Flight search error:', error);
      
      if (error.name === 'AbortError') {
        toast({
          title: "Request Timeout",
          description: "The flight search is taking too long. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Search Failed",
          description: error.message || "Unable to search for flights. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      setIsSearchingFlight(false);
    }
  };

  const handleGetQuote = () => {
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
    if (!selectedVehicle) {
      toast({
        title: "Vehicle Not Selected",
        description: "Please select a vehicle to continue.",
        variant: "destructive",
      });
      return;
    }

    if (!isAuthenticated || !user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to continue with your booking",
        variant: "destructive",
      });
      
      setTimeout(() => {
        setLocation('/mobile-login?role=passenger');
      }, 1000);
      return;
    }
    
    setStep(3);
  };
  
  const handleConfirmBooking = () => {
    if (!passengerName || !passengerPhone || !passengerEmail) {
      toast({
        title: "Missing Information",
        description: "Please provide passenger name, phone, and email to continue.",
        variant: "destructive",
      });
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(passengerEmail)) {
      toast({
        title: "Invalid Email",
        description: "Please provide a valid email address.",
        variant: "destructive",
      });
      return;
    }
    
    bookingMutation.mutate();
  };

  const handleBackButton = () => {
    if (step === 1) {
      setLocation('/mobile-passenger');
    } else {
      setStep(step - 1);
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1:
        return 'Trip Details';
      case 2:
        return 'Select Vehicle';
      case 3:
        return 'Passenger Information';
      default:
        return 'Book a Ride';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20">
      {/* Header with Progress */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white shadow-xl sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBackButton}
              className="text-white hover:bg-white/20 flex-shrink-0"
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-lg font-bold">{getStepTitle()}</h1>
              <p className="text-xs text-blue-100">Step {step} of 3</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="flex gap-1">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-all ${
                  s <= step ? 'bg-white' : 'bg-white/30'
                }`}
                data-testid={`progress-${s}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 pb-20">
        {/* Step 1: Trip Details */}
        {step === 1 && (
          <div className="space-y-4">
            {/* Service Type Selection */}
            <div className="bg-white rounded-2xl p-4 shadow-md">
              <Label className="text-sm font-semibold text-gray-700 mb-3 block">Service Type</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setActiveTab('transfer')}
                  className={`p-4 rounded-xl border-2 transition-all min-h-[60px] ${
                    activeTab === 'transfer'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  data-testid="service-type-transfer"
                >
                  <Car className="w-5 h-5 mx-auto mb-1" />
                  <div className="text-sm font-semibold">Point to Point</div>
                </button>
                <button
                  onClick={() => setActiveTab('hourly')}
                  className={`p-4 rounded-xl border-2 transition-all min-h-[60px] ${
                    activeTab === 'hourly'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  data-testid="service-type-hourly"
                >
                  <Clock className="w-5 h-5 mx-auto mb-1" />
                  <div className="text-sm font-semibold">Hourly</div>
                </button>
              </div>
            </div>

            {/* Address Inputs */}
            {activeTab === 'transfer' ? (
              <div className="space-y-3">
                {/* From Address */}
                <div className="bg-white rounded-2xl p-4 shadow-md">
                  <Label htmlFor="from-address" className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    Pickup Location
                  </Label>
                  <div className="relative">
                    <Input
                      id="from-address"
                      placeholder="Enter pickup address"
                      value={fromAddress}
                      onChange={(e) => {
                        setFromAddress(e.target.value);
                        handleAddressInput('from', e.target.value);
                      }}
                      className="min-h-[48px] text-base"
                      data-testid="input-from-address"
                    />
                    {showSuggestions['from'] && suggestions['from']?.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto z-20">
                        {suggestions['from'].map((suggestion, idx) => (
                          <button
                            key={idx}
                            onClick={() => selectSuggestion('from', suggestion)}
                            className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b last:border-b-0 text-sm min-h-[48px]"
                            data-testid={`suggestion-from-${idx}`}
                          >
                            <div className="font-medium">{suggestion.display_name}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Via Points */}
                {viaPoints.map((viaPoint, index) => (
                  <div key={index} className="bg-white rounded-2xl p-4 shadow-md">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-orange-600" />
                        Stop {index + 1}
                      </Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeViaPoint(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        data-testid={`button-remove-via-${index}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="relative">
                      <Input
                        placeholder={`Enter stop ${index + 1} address`}
                        value={viaPoint}
                        onChange={(e) => updateViaPoint(index, e.target.value)}
                        className="min-h-[48px] text-base"
                        data-testid={`input-via-${index}`}
                      />
                      {showSuggestions[`via-${index}`] && suggestions[`via-${index}`]?.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto z-20">
                          {suggestions[`via-${index}`].map((suggestion, idx) => (
                            <button
                              key={idx}
                              onClick={() => selectSuggestion(`via-${index}`, suggestion)}
                              className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b last:border-b-0 text-sm min-h-[48px]"
                              data-testid={`suggestion-via-${index}-${idx}`}
                            >
                              <div className="font-medium">{suggestion.display_name}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {viaPoints.length < 3 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addViaPoint}
                    className="w-full min-h-[48px] border-2 border-dashed border-blue-300 text-blue-600 hover:bg-blue-50"
                    data-testid="button-add-via-point"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Stop
                  </Button>
                )}

                {/* To Address */}
                <div className="bg-white rounded-2xl p-4 shadow-md">
                  <Label htmlFor="to-address" className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-green-600" />
                    Dropoff Location
                  </Label>
                  <div className="relative">
                    <Input
                      id="to-address"
                      placeholder="Enter dropoff address"
                      value={toAddress}
                      onChange={(e) => {
                        setToAddress(e.target.value);
                        handleAddressInput('to', e.target.value);
                      }}
                      className="min-h-[48px] text-base"
                      data-testid="input-to-address"
                    />
                    {showSuggestions['to'] && suggestions['to']?.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto z-20">
                        {suggestions['to'].map((suggestion, idx) => (
                          <button
                            key={idx}
                            onClick={() => selectSuggestion('to', suggestion)}
                            className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b last:border-b-0 text-sm min-h-[48px]"
                            data-testid={`suggestion-to-${idx}`}
                          >
                            <div className="font-medium">{suggestion.display_name}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Pickup Address for Hourly */}
                <div className="bg-white rounded-2xl p-4 shadow-md">
                  <Label htmlFor="pickup-address" className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    Pickup Location
                  </Label>
                  <div className="relative">
                    <Input
                      id="pickup-address"
                      placeholder="Enter pickup address"
                      value={pickupAddress}
                      onChange={(e) => {
                        setPickupAddress(e.target.value);
                        handleAddressInput('pickup', e.target.value);
                      }}
                      className="min-h-[48px] text-base"
                      data-testid="input-pickup-address"
                    />
                    {showSuggestions['pickup'] && suggestions['pickup']?.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto z-20">
                        {suggestions['pickup'].map((suggestion, idx) => (
                          <button
                            key={idx}
                            onClick={() => selectSuggestion('pickup', suggestion)}
                            className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b last:border-b-0 text-sm min-h-[48px]"
                            data-testid={`suggestion-pickup-${idx}`}
                          >
                            <div className="font-medium">{suggestion.display_name}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Duration */}
                <div className="bg-white rounded-2xl p-4 shadow-md">
                  <Label htmlFor="duration" className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    Duration (Hours)
                  </Label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger id="duration" className="min-h-[48px] text-base" data-testid="select-duration">
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      {[...Array(12)].map((_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          {i + 1} {i + 1 === 1 ? 'Hour' : 'Hours'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Date and Time */}
            <div className="bg-white rounded-2xl p-4 shadow-md">
              <Label className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                Date & Time
              </Label>
              <div className="space-y-3">
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="min-h-[48px] text-base"
                  data-testid="input-date"
                />
                <div className="grid grid-cols-3 gap-2">
                  <Select value={hour} onValueChange={setHour}>
                    <SelectTrigger className="min-h-[48px] text-base" data-testid="select-hour">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                        <SelectItem key={h} value={h.toString()}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={minute} onValueChange={setMinute}>
                    <SelectTrigger className="min-h-[48px] text-base" data-testid="select-minute">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['00', '15', '30', '45'].map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={period} onValueChange={(v) => setPeriod(v as 'AM' | 'PM')}>
                    <SelectTrigger className="min-h-[48px] text-base" data-testid="select-period">
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

            {/* Continue Button */}
            <Button
              onClick={handleGetQuote}
              disabled={quoteMutation.isPending}
              className="w-full min-h-[56px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-lg font-semibold rounded-2xl shadow-lg"
              data-testid="button-get-quote"
            >
              {quoteMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Calculating...
                </div>
              ) : (
                'Continue to Vehicles'
              )}
            </Button>
          </div>
        )}

        {/* Step 2: Vehicle Selection */}
        {step === 2 && quoteData && (
          <div className="space-y-4">
            {/* Trip Summary */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 shadow-md">
              <h3 className="text-sm font-bold text-blue-900 mb-3">Trip Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Date & Time:</span>
                  <span className="font-semibold text-gray-900" data-testid="summary-datetime">
                    {date} at {time}
                  </span>
                </div>
                {activeTab === 'transfer' ? (
                  <>
                    <div className="flex justify-between items-start">
                      <span className="text-gray-700 flex-shrink-0">From:</span>
                      <span className="font-semibold text-gray-900 text-right ml-2" data-testid="summary-from">
                        {fromAddress}
                      </span>
                    </div>
                    {viaPoints.length > 0 && viaPoints.map((viaPoint, index) => 
                      viaPoint && (
                        <div key={index} className="flex justify-between items-start">
                          <span className="text-gray-700 flex-shrink-0">Stop {index + 1}:</span>
                          <span className="font-semibold text-gray-900 text-right ml-2" data-testid={`summary-via-${index}`}>
                            {viaPoint}
                          </span>
                        </div>
                      )
                    )}
                    <div className="flex justify-between items-start">
                      <span className="text-gray-700 flex-shrink-0">To:</span>
                      <span className="font-semibold text-gray-900 text-right ml-2" data-testid="summary-to">
                        {toAddress}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-start">
                      <span className="text-gray-700 flex-shrink-0">Pickup:</span>
                      <span className="font-semibold text-gray-900 text-right ml-2" data-testid="summary-pickup">
                        {pickupAddress}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Duration:</span>
                      <span className="font-semibold text-gray-900" data-testid="summary-duration">
                        {duration} {parseInt(duration) === 1 ? 'hour' : 'hours'}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Vehicle Cards */}
            <div className="space-y-3">
              {vehicleTypes
                ?.filter(vehicle => {
                  const vehicleSlug = getVehicleSlug(vehicle.name);
                  const hasPricing = pricingRules && pricingRules[vehicleSlug];
                  const hasCalculatedPrice = calculatedPrices[vehicleSlug];
                  return hasPricing && hasCalculatedPrice;
                })
                .sort((a, b) => {
                  const slugA = getVehicleSlug(a.name);
                  const slugB = getVehicleSlug(b.name);
                  const priceA = parseFloat(calculatedPrices[slugA] || '0');
                  const priceB = parseFloat(calculatedPrices[slugB] || '0');
                  return priceA - priceB;
                })
                .map((vehicle) => {
                  const vehicleSlug = getVehicleSlug(vehicle.name);
                  const calculatedPrice = calculatedPrices[vehicleSlug];
                  const breakdown = priceBreakdowns[vehicleSlug];
                  const hasDiscount = breakdown && parseFloat(breakdown.discountAmount) > 0;
                  const isSelected = selectedVehicle === vehicle.id;
                  
                  return (
                    <button
                      key={vehicle.id}
                      onClick={() => setSelectedVehicle(vehicle.id)}
                      className={`w-full bg-white rounded-2xl p-4 shadow-md border-2 transition-all text-left ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                      data-testid={`vehicle-card-${vehicle.id}`}
                    >
                      <div className="flex gap-4">
                        {/* Vehicle Image */}
                        {vehicle.imageUrl && (
                          <div className="w-24 h-20 flex-shrink-0">
                            <img 
                              src={vehicle.imageUrl} 
                              alt={vehicle.name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          </div>
                        )}
                        
                        {/* Vehicle Info */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-bold text-gray-900 text-base mb-1">
                                {vehicle.name}
                              </h4>
                              <p className="text-xs text-gray-600">
                                Up to {vehicle.passengerCapacity} passengers
                              </p>
                              <p className="text-xs text-gray-600">
                                {vehicle.luggageCapacity}
                              </p>
                            </div>
                            {isSelected && (
                              <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                                <Check className="w-4 h-4 text-white" />
                              </div>
                            )}
                          </div>
                          
                          {/* Price */}
                          <div className="mt-3">
                            {hasDiscount ? (
                              <div className="space-y-0.5">
                                <p className="text-xs text-gray-500 line-through">
                                  ${breakdown.regularPrice}
                                </p>
                                <p className="text-xs text-green-600 font-semibold">
                                  Save ${breakdown.discountAmount}
                                </p>
                                <p className="text-xl font-bold text-blue-600" data-testid={`price-${vehicle.id}`}>
                                  ${breakdown.finalPrice}
                                </p>
                              </div>
                            ) : (
                              <p className="text-xl font-bold text-blue-600" data-testid={`price-${vehicle.id}`}>
                                ${calculatedPrice}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
            </div>

            {/* Includes Info */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-4 shadow-md">
              <h4 className="text-sm font-bold text-gray-900 mb-3">All Rides Include:</h4>
              <div className="grid grid-cols-1 gap-2 text-xs">
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                  <span className="text-gray-700">Free cancellation (2hr before)</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                  <span className="text-gray-700">Meet & Greet service</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                  <span className="text-gray-700">Complimentary WiFi & water</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                  <span className="text-gray-700">Free wait time (15min city, 1hr airport)</span>
                </div>
              </div>
            </div>

            {/* Continue Button */}
            <Button
              onClick={handleContinueBooking}
              disabled={!selectedVehicle}
              className="w-full min-h-[56px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-lg font-semibold rounded-2xl shadow-lg disabled:opacity-50"
              data-testid="button-continue-booking"
            >
              Continue to Details
            </Button>
          </div>
        )}

        {/* Step 3: Passenger Information */}
        {step === 3 && (
          <div className="space-y-4">
            {/* Booking For */}
            <div className="bg-white rounded-2xl p-4 shadow-md">
              <Label className="text-sm font-semibold text-gray-700 mb-3 block">Booking For</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setBookingFor('self')}
                  className={`p-3 rounded-xl border-2 transition-all min-h-[48px] ${
                    bookingFor === 'self'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  data-testid="booking-for-self"
                >
                  <div className="text-sm font-semibold">Myself</div>
                </button>
                <button
                  onClick={() => setBookingFor('someone_else')}
                  className={`p-3 rounded-xl border-2 transition-all min-h-[48px] ${
                    bookingFor === 'someone_else'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  data-testid="booking-for-someone-else"
                >
                  <div className="text-sm font-semibold">Someone Else</div>
                </button>
              </div>
            </div>

            {/* Passenger Details */}
            <div className="bg-white rounded-2xl p-4 shadow-md space-y-3">
              <Label htmlFor="passenger-name" className="text-sm font-semibold text-gray-700">
                Passenger Name *
              </Label>
              <Input
                id="passenger-name"
                placeholder="Full Name"
                value={passengerName}
                onChange={(e) => setPassengerName(e.target.value)}
                className="min-h-[48px] text-base"
                data-testid="input-passenger-name"
              />

              <Label htmlFor="passenger-phone" className="text-sm font-semibold text-gray-700">
                Phone Number *
              </Label>
              <Input
                id="passenger-phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={passengerPhone}
                onChange={(e) => setPassengerPhone(e.target.value)}
                className="min-h-[48px] text-base"
                data-testid="input-passenger-phone"
              />

              <Label htmlFor="passenger-email" className="text-sm font-semibold text-gray-700">
                Email Address *
              </Label>
              <Input
                id="passenger-email"
                type="email"
                placeholder="email@example.com"
                value={passengerEmail}
                onChange={(e) => setPassengerEmail(e.target.value)}
                className="min-h-[48px] text-base"
                data-testid="input-passenger-email"
              />
            </div>

            {/* Additional Details */}
            <div className="bg-white rounded-2xl p-4 shadow-md space-y-4">
              <h3 className="text-sm font-bold text-gray-900">Additional Details</h3>
              
              <div>
                <Label htmlFor="passenger-count" className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  Number of Passengers
                </Label>
                <Select value={passengerCount.toString()} onValueChange={(v) => setPassengerCount(parseInt(v))}>
                  <SelectTrigger id="passenger-count" className="min-h-[48px] text-base" data-testid="select-passenger-count">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                      <SelectItem key={n} value={n.toString()}>
                        {n} {n === 1 ? 'Passenger' : 'Passengers'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="luggage-count" className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  Number of Luggage
                </Label>
                <Select value={luggageCount.toString()} onValueChange={(v) => setLuggageCount(parseInt(v))}>
                  <SelectTrigger id="luggage-count" className="min-h-[48px] text-base" data-testid="select-luggage-count">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2, 3, 4, 5, 6].map((n) => (
                      <SelectItem key={n} value={n.toString()}>
                        {n} {n === 1 ? 'Bag' : 'Bags'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Checkbox
                  id="baby-seat"
                  checked={babySeat}
                  onCheckedChange={(checked) => setBabySeat(checked as boolean)}
                  className="w-5 h-5"
                  data-testid="checkbox-baby-seat"
                />
                <Label htmlFor="baby-seat" className="text-sm font-medium flex items-center gap-2 cursor-pointer">
                  <Baby className="w-4 h-4 text-blue-600" />
                  Baby Seat Required
                </Label>
              </div>

              <div>
                <Label htmlFor="special-instructions" className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Special Instructions (Optional)
                </Label>
                <Textarea
                  id="special-instructions"
                  placeholder="Any special requests or notes..."
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  className="min-h-[80px] text-base"
                  data-testid="textarea-special-instructions"
                />
              </div>
            </div>

            {/* Flight Search (Optional) */}
            <div className="bg-white rounded-2xl p-4 shadow-md">
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Plane className="w-4 h-4 text-blue-600" />
                Flight Information (Optional)
              </h3>
              {selectedFlight ? (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-blue-900">{selectedFlight.airline}</p>
                      <p className="text-sm text-blue-700">{selectedFlight.flightNumber}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedFlight(null)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      data-testid="button-remove-flight"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-blue-700">
                    {selectedFlight.departureAirport} → {selectedFlight.arrivalAirport}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <Input
                    placeholder="Flight number (e.g., UA2346)"
                    value={flightSearchInput}
                    onChange={(e) => setFlightSearchInput(e.target.value)}
                    className="min-h-[48px] text-base"
                    data-testid="input-flight-number"
                  />
                  <Button
                    onClick={handleFlightSearch}
                    disabled={isSearchingFlight}
                    variant="outline"
                    className="w-full min-h-[48px] border-2"
                    data-testid="button-search-flight"
                  >
                    {isSearchingFlight ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        Searching...
                      </div>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Search Flight
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* Confirm Button */}
            <Button
              onClick={handleConfirmBooking}
              disabled={bookingMutation.isPending}
              className="w-full min-h-[56px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-lg font-semibold rounded-2xl shadow-lg"
              data-testid="button-confirm-booking"
            >
              {bookingMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Confirming...
                </div>
              ) : (
                'Confirm Booking'
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Flight Selection Dialog */}
      <Dialog open={showFlightDialog} onOpenChange={setShowFlightDialog}>
        <DialogContent className="max-w-[90vw] max-h-[80vh] overflow-auto bg-white">
          <DialogHeader>
            <DialogTitle>Select Your Flight</DialogTitle>
            <DialogDescription>
              Multiple flights found. Please select the correct one.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {flightResults.map((flight) => (
              <button
                key={flight.id}
                onClick={() => {
                  setSelectedFlight(flight);
                  setShowFlightDialog(false);
                  toast({
                    title: "Flight Selected",
                    description: `${flight.airline} ${flight.flightNumber} added to booking`,
                  });
                }}
                className="w-full text-left p-3 bg-white hover:bg-blue-50 border border-gray-200 rounded-lg transition-all"
                data-testid={`flight-option-${flight.id}`}
              >
                <div className="font-semibold text-gray-900">{flight.airline}</div>
                <div className="text-sm text-gray-700">{flight.flightNumber}</div>
                <div className="text-xs text-gray-600 mt-1">
                  {flight.departureAirport} → {flight.arrivalAirport}
                </div>
                <div className="text-xs text-gray-500">
                  Departs: {flight.departureTime} | Arrives: {flight.arrivalTime}
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
