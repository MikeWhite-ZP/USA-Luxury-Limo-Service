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
import { CreditCard, Clock, Search, Plane, Banknote } from "lucide-react";

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

interface BookingFormProps {
  isQuickBooking?: boolean; // True when used in hero section
}

export default function BookingForm({ isQuickBooking = false }: BookingFormProps = {}) {
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
  const [billReference, setBillReference] = useState(''); // Customer reference for invoicing
  
  // Flight search state
  const [flightSearchInput, setFlightSearchInput] = useState('');
  const [selectedFlight, setSelectedFlight] = useState<any>(null);
  const [flightResults, setFlightResults] = useState<any[]>([]);
  const [showFlightDialog, setShowFlightDialog] = useState(false);
  const [isSearchingFlight, setIsSearchingFlight] = useState(false);
  
  // Payment method required dialog state
  const [showPaymentMethodRequired, setShowPaymentMethodRequired] = useState(false);
  
  // Partial credit payment state
  const [useCredits, setUseCredits] = useState(false);
  const [creditAmount, setCreditAmount] = useState('0');
  
  const suggestionTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Fetch user's payment methods to check if they have saved cards
  const { data: paymentData, refetch: refetchPaymentMethods } = useQuery<PaymentMethodsResponse>({
    queryKey: ['/api/payment-methods'],
    enabled: isAuthenticated && step === 4, // Fetch on payment step to check if user has saved cards
  });

  const paymentMethods = paymentData?.paymentMethods || [];

  // Fetch user's ride credits for partial payment
  const { data: rideCreditsData } = useQuery<{ balance: string; hasCredits: boolean }>({
    queryKey: ['/api/ride-credits'],
    enabled: isAuthenticated && step === 4,
  });

  const rideCreditsBalance = parseFloat(rideCreditsData?.balance || '0');
  const hasRideCredits = rideCreditsData?.hasCredits === true && rideCreditsBalance > 0;

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

  // Set minimum date to today and restore saved booking data
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setDate(today);
    
    // Check for URL parameters for pre-filled addresses
    const urlParams = new URLSearchParams(window.location.search);
    const fromParam = urlParams.get('from');
    const toParam = urlParams.get('to');
    const returnToPayment = urlParams.get('returnToPayment');
    
    if (fromParam) {
      setFromAddress(fromParam);
      setPickupAddress(fromParam);
    }
    if (toParam) {
      setToAddress(toParam);
    }
    
    // Clear URL parameters after setting the addresses
    if (fromParam || toParam || returnToPayment) {
      window.history.replaceState({}, '', window.location.pathname);
    }
    
    // Check if returning from checkout page - restore payment step (step 4)
    if (returnToPayment === 'true') {
      const paymentBookingData = localStorage.getItem('pendingBookingForPayment');
      if (paymentBookingData) {
        try {
          const data = JSON.parse(paymentBookingData);
          
          // Restore all form state from pendingBookingForPayment
          setActiveTab(data.bookingType || 'transfer');
          setFromAddress(data.pickupAddress || '');
          setToAddress(data.destinationAddress || '');
          setPickupAddress(data.pickupAddress || '');
          
          // Parse scheduled date time
          if (data.scheduledDateTime) {
            const scheduledDate = new Date(data.scheduledDateTime);
            setDate(scheduledDate.toISOString().split('T')[0]);
            const hours24 = scheduledDate.getHours();
            const mins = scheduledDate.getMinutes();
            const isPM = hours24 >= 12;
            const hours12 = hours24 === 0 ? 12 : hours24 > 12 ? hours24 - 12 : hours24;
            setHour(hours12.toString());
            setMinute(mins.toString().padStart(2, '0'));
            setPeriod(isPM ? 'PM' : 'AM');
            setTime(`${hours24.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`);
          }
          
          setDuration(data.requestedHours?.toString() || '');
          setSelectedVehicle(data.vehicleTypeId || '');
          setPassengerName(data.passengerName || '');
          setPassengerPhone(data.passengerPhone || '');
          setPassengerEmail(data.passengerEmail || '');
          setPassengerCount(data.passengerCount?.toString() || '1');
          setLuggageCount(data.luggageCount || 0);
          setBabySeat(data.babySeat || 0);
          setSpecialInstructions(data.specialInstructions || '');
          if (data.bookingFor) setBookingFor(data.bookingFor);
          
          // Restore quote data and calculated prices
          if (data.quoteData) setQuoteData(data.quoteData);
          if (data.calculatedPrices) setCalculatedPrices(data.calculatedPrices);
          if (data.fromCoords) setFromCoords(data.fromCoords);
          if (data.toCoords) setToCoords(data.toCoords);
          if (data.pickupCoords) setPickupCoords(data.pickupCoords);
          
          // Set step to 4 (payment selection)
          setStep(4);
          
          toast({
            title: "Returned to Payment",
            description: "Please select your preferred payment method.",
          });
          
          return; // Don't process other saved data
        } catch (error) {
          console.error('Error restoring payment booking data:', error);
        }
      }
    }
    
    // Check for saved booking data from localStorage
    const savedBookingData = localStorage.getItem('pendingBookingData');
    if (savedBookingData) {
      try {
        const data = JSON.parse(savedBookingData);
        
        // Restore all form state - Step 1 & 2
        setActiveTab(data.activeTab);
        setStep(data.step);
        setFromAddress(data.fromAddress || '');
        setToAddress(data.toAddress || '');
        setPickupAddress(data.pickupAddress || '');
        setDate(data.date || today);
        setTime(data.time || '');
        
        // Parse time into hour, minute, period if not already saved
        if (data.hour && data.minute && data.period) {
          setHour(data.hour);
          setMinute(data.minute);
          setPeriod(data.period);
        } else if (data.time) {
          // Parse 24-hour time format into 12-hour components
          const [hours24, mins] = data.time.split(':').map(Number);
          const isPM = hours24 >= 12;
          const hours12 = hours24 === 0 ? 12 : hours24 > 12 ? hours24 - 12 : hours24;
          setHour(hours12.toString());
          setMinute(mins.toString().padStart(2, '0'));
          setPeriod(isPM ? 'PM' : 'AM');
        } else {
          setHour('12');
          setMinute('00');
          setPeriod('PM');
        }
        
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
        if (data.passengerCount) setPassengerCount(data.passengerCount);
        if (data.luggageCount !== undefined) setLuggageCount(data.luggageCount);
        if (data.babySeat !== undefined) setBabySeat(data.babySeat);
        if (data.specialInstructions) setSpecialInstructions(data.specialInstructions);
        
        // Show success message
        toast({
          title: "Booking Restored",
          description: "Your booking details have been restored. Please continue with your booking.",
        });
        
        // Clear the saved data after successful restoration to prevent unintended future auto-population
        localStorage.removeItem('pendingBookingData');
      } catch (error) {
        console.error('Error restoring booking data:', error);
      }
    }
  }, [toast]);

  // Track if we've auto-filled on initial entry to step 3
  const [hasAutoFilled, setHasAutoFilled] = useState(false);

  // Auto-fill passenger details with logged-in user's information when reaching step 3
  useEffect(() => {
    if (step === 3 && isAuthenticated && user && !hasAutoFilled) {
      // Only auto-fill if fields are empty and bookingFor is 'self' (default)
      if (!passengerName && !passengerPhone && !passengerEmail && bookingFor === 'self') {
        setPassengerName(`${user.firstName || ''} ${user.lastName || ''}`.trim());
        setPassengerPhone(user.phone || '');
        setPassengerEmail(user.email || '');
        setHasAutoFilled(true); // Prevent re-running
      }
    }
    // Reset flag when leaving step 3
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
      
      // If this is quick booking from hero section, save state and redirect to full booking page
      if (isQuickBooking) {
        const bookingDataToSave = {
          activeTab,
          step: 2, // Move to step 2 on the full page
          fromAddress,
          toAddress,
          pickupAddress,
          date,
          time,
          hour,
          minute,
          period,
          duration,
          selectedVehicle: '',
          viaPoints,
          viaCoords,
          fromCoords,
          toCoords,
          pickupCoords,
          quoteData: data,
          calculatedPrices: data.prices || {}, // Use fresh prices from data, not stale state
        };
        localStorage.setItem('pendingBookingData', JSON.stringify(bookingDataToSave));
        
        toast({
          title: "Quote Calculated",
          description: "Redirecting to booking page...",
        });
        
        // Small delay for toast to show
        setTimeout(() => {
          setLocation('/booking');
        }, 500);
      } else {
        // Normal flow for full booking page
        setStep(2);
        toast({
          title: "Quote Calculated",
          description: "Please select your vehicle to see pricing.",
        });
      }
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

      // Get the total price for the selected vehicle
      const selectedVehicleName = vehicleTypes?.find(v => v.id === selectedVehicle)?.name || '';
      const selectedVehicleSlug = getVehicleSlug(selectedVehicleName);
      const totalPrice = calculatedPrices[selectedVehicleSlug] || '0';

      // Calculate credit amount to apply based on current state
      const totalPriceNum = parseFloat(totalPrice) || 0;
      const currentCreditBalance = parseFloat(rideCreditsData?.balance || '0');
      const maxCredits = Math.min(currentCreditBalance, totalPriceNum);
      const creditToApply = useCredits ? Math.min(Math.max(0, parseFloat(creditAmount) || 0), maxCredits) : 0;

      const bookingData = {
        vehicleTypeId: selectedVehicle,
        bookingType: activeTab,
        scheduledDateTime: new Date(`${date}T${time}`),
        totalAmount: totalPrice,
        // Include partial credit amount if using credits
        ...(creditToApply > 0 && {
          creditAmountApplied: creditToApply.toFixed(2),
        }),
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
        passengerCount,
        luggageCount,
        babySeat,
        specialInstructions: specialInstructions || undefined,
        billReference: billReference || undefined,
        // Flight information if selected
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
      // Clear saved booking data from localStorage after successful booking
      localStorage.removeItem('pendingBookingData');
      
      // Check if user has saved payment methods
      const hasSavedCards = paymentMethods && paymentMethods.length > 0;
      
      if (!hasSavedCards) {
        // Warn user they need to add a card for future payments
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
      // Redirect to home page
      setTimeout(() => {
        setLocation('/');  // Change to '/' for home or '/dashboard' if that's your route
      }, 1000);
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
          hour,
          minute,
          period,
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
      
      // Call backend API to search flights with timeout, include date for detailed info
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
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
        
        // Handle specific error cases
        if (response.status === 504 || response.status === 503) {
          throw new Error('The flight search service is currently slow or unavailable. Please try again in a moment.');
        } else if (response.status === 500 && errorData.error?.includes('not configured')) {
          throw new Error('Flight search is not configured. Please contact support.');
        } else {
          throw new Error(errorData.error || 'Flight search failed');
        }
      }

      const data = await response.json();
      
      // Handle both detailed and simple search responses
      let flightItems = [];
      
      // Check if this is a detailed response (array of flights with detailed info)
      if (Array.isArray(data)) {
        flightItems = data;
      } else if (data.items) {
        // Simple search response structure: { searchBy, count, items: [...] }
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

      // Map common airline codes to names
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

      // Transform API response to our flight format
      const flights = flightItems.map((flight: any, index: number) => {
        // Extract flight number and airline code
        const flightNum = flight.number || flightNumber;
        const airlineCode = flightNum.trim().split(' ')[0] || flightNum.substring(0, 2);
        const airlineName = airlineNames[airlineCode] || flight.airline?.name || airlineCode;
        
        // Extract detailed information if available
        const departure = flight.departure || {};
        const arrival = flight.arrival || {};
        
        // Get IATA codes for large display
        const departureIata = departure.airport?.iata || '';
        const arrivalIata = arrival.airport?.iata || '';
        
        const departureAirport = departure.airport?.name || departure.airport?.iata || 'N/A';
        const arrivalAirport = arrival.airport?.name || arrival.airport?.iata || 'N/A';
        
        // Get actual or scheduled times
        const departureTimeActual = departure.actualTimeLocal || departure.actualTime?.local;
        const departureTimeScheduled = departure.scheduledTimeLocal || departure.scheduledTime?.local || departure.scheduledTime;
        const arrivalTimeActual = arrival.actualTimeLocal || arrival.actualTime?.local;
        const arrivalTimeScheduled = arrival.scheduledTimeLocal || arrival.scheduledTime?.local || arrival.scheduledTime;
        
        const departureTime = departureTimeActual || departureTimeScheduled || 'N/A';
        const arrivalTime = arrivalTimeActual || arrivalTimeScheduled || 'N/A';
        
        const departureTerminal = departure.terminal || '';
        const arrivalTerminal = arrival.terminal || '';
        const arrivalBaggage = arrival.baggageClaim || '';
        
        const aircraftModel = flight.aircraft?.model || '';
        const flightStatus = flight.status || 'Scheduled';
        
        return {
          id: index + 1,
          flightNumber: flightNum.trim(),
          airline: airlineName,
          departureIata,
          arrivalIata,
          departureAirport,
          arrivalAirport,
          departureTime,
          arrivalTime,
          departureTerminal,
          arrivalTerminal,
          baggageClaim: arrivalBaggage,
          aircraft: aircraftModel,
          status: flightStatus,
        };
      });

      // If only 1 flight found, auto-select it. If multiple, show selection dialog
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
      
      // Handle abort/timeout error
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
    // Check if user is logged in before proceeding to step 3
    if (!isAuthenticated || !user) {
      // Save booking data to localStorage before redirecting to login
      const bookingDataToSave = {
        activeTab,
        step: 3, // Will resume at step 3 after login
        fromAddress,
        toAddress,
        pickupAddress,
        date,
        time,
        hour,
        minute,
        period,
        duration,
        selectedVehicle,
        viaPoints,
        viaCoords,
        fromCoords,
        toCoords,
        pickupCoords,
        quoteData,
        calculatedPrices,
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
    
    // Pre-fill step 3 data with user info if booking for self
    if (user && bookingFor === 'self') {
      setPassengerName(`${user.firstName || ''} ${user.lastName || ''}`.trim());
      setPassengerPhone(user.phone || '');
      setPassengerEmail(user.email || '');
    }
    setStep(3);
  };
  
  const handleProceedToPayment = () => {
    // Validation for step 3 - required fields for all bookings
    if (!passengerName || !passengerPhone || !passengerEmail) {
      toast({
        title: "Missing Information",
        description: "Please provide passenger name, phone, and email to continue.",
        variant: "destructive",
      });
      return;
    }
    
    // Additional validation for email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(passengerEmail)) {
      toast({
        title: "Invalid Email",
        description: "Please provide a valid email address.",
        variant: "destructive",
      });
      return;
    }
    
    // Move to Step 4 (Payment) instead of creating booking immediately
    setStep(4);
  };

  if (step === 2 && quoteData) {
    return (
      <div className="space-y-6">
        {/* Trip Details */}
        <div className="bg-muted p-4 rounded-lg" data-testid="trip-details">
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
                      <div className="text-sm text-muted-foreground mt-1">
                        {capacityText} • {luggageText}
                      </div>
                    </div>
                    
                    {/* Price */}
                    <div className="text-right">
                      {(() => {
                        const breakdown = priceBreakdowns[vehicleSlug];
                        const hasDiscount = breakdown && parseFloat(breakdown.discountAmount) > 0;
                        
                        return hasDiscount ? (
                          <div className="space-y-0.5">
                            <p className="text-xs text-muted-foreground line-through">
                              ${breakdown.regularPrice}
                            </p>
                            <p className="text-xs text-green-600 font-semibold">
                              - ${breakdown.discountAmount} discount
                            </p>
                            <p className="text-2xl font-bold text-primary" data-testid={`price-${vehicle.id}`}>
                              ${breakdown.finalPrice}
                            </p>
                            <p className="text-xs text-muted-foreground">Your Price</p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-2xl font-bold text-primary" data-testid={`price-${vehicle.id}`}>
                              ${calculatedPrice}
                            </p>
                            <p className="text-xs text-muted-foreground">Total Price</p>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Service Includes Section */}
        <div className="bg-muted border border-border rounded-xl p-6">
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
          
          <div className="mt-6 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg">
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
    // Get the total price for the selected vehicle
    const selectedVehicleName = vehicleTypes?.find(v => v.id === selectedVehicle)?.name || '';
    const selectedVehicleSlug = getVehicleSlug(selectedVehicleName);
    const totalPrice = calculatedPrices[selectedVehicleSlug] || '0';

    return (
      <div className="space-y-6">
        {/* Trip Summary - Compact */}
        <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-3 rounded-xl border-2 border-primary/20 text-[10px]" data-testid="trip-summary">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-bold text-primary">Booking Summary</h3>
            <p className="text-lg font-bold text-primary">${totalPrice}</p>
          </div>
          
          {/* Compact Grid Layout */}
          <div className="space-y-1">
            {/* Service & Vehicle */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-muted-foreground uppercase">Service</p>
                <p className="font-semibold text-foreground">{activeTab === 'transfer' ? 'Transfer' : 'Hourly'}</p>
              </div>
              {selectedVehicle && vehicleTypes && (
                <div>
                  <p className="text-muted-foreground uppercase">Vehicle</p>
                  <p className="font-semibold text-foreground">{selectedVehicleName}</p>
                </div>
              )}
            </div>

            {/* Date & Time */}
            <div className="border-t border-border pt-1">
              <p className="text-muted-foreground uppercase">Date & Time</p>
              <p className="font-semibold text-foreground">
                {new Date(`${date}T${time}`).toLocaleString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit'
                })}
              </p>
            </div>

            {/* Route Information */}
            <div className="border-t border-border pt-1">
              {activeTab === 'transfer' ? (
                <>
                  <p className="text-muted-foreground uppercase mb-1">Route</p>
                  <div className="space-y-0.5">
                    <div className="flex items-start gap-1">
                      <span className="text-green-600">●</span>
                      <p className="font-medium text-foreground leading-tight">{fromAddress}</p>
                    </div>
                    {viaPoints.filter(point => point.trim()).map((viaPoint, index) => (
                      <div key={index} className="flex items-start gap-1">
                        <span className="text-blue-600">●</span>
                        <p className="font-medium text-foreground leading-tight">{viaPoint}</p>
                      </div>
                    ))}
                    <div className="flex items-start gap-1">
                      <span className="text-red-600 dark:text-red-400">●</span>
                      <p className="font-medium text-foreground leading-tight">{toAddress}</p>
                    </div>
                  </div>
                  {quoteData.distanceKm && (
                    <p className="text-muted-foreground mt-1">
                      {quoteData.distanceKm} km ({(quoteData.distanceKm * 0.621371).toFixed(1)} mi)
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p className="text-muted-foreground uppercase">Pickup</p>
                  <p className="font-medium text-foreground">{pickupAddress}</p>
                  <p className="text-muted-foreground">Duration: {duration} hrs</p>
                </>
              )}
            </div>

            {/* Trip Details */}
            <div className="border-t border-border pt-1">
              <div className="flex gap-3">
                <span className="text-muted-foreground">Passengers: <span className="font-semibold text-foreground">{passengerCount}</span></span>
                <span className="text-muted-foreground">Luggage: <span className="font-semibold text-foreground">{luggageCount}</span></span>
                {babySeat && <span className="text-muted-foreground">✓ Baby seat</span>}
              </div>
            </div>
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
                  : 'border-border hover:border-border'
              }`}
              data-testid="radio-booking-self"
            >
              <div className="flex items-center gap-2">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  bookingFor === 'self' ? 'border-primary' : 'border-border'
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
                  : 'border-border hover:border-border'
              }`}
              data-testid="radio-booking-someone-else"
            >
              <div className="flex items-center gap-2">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  bookingFor === 'someone_else' ? 'border-primary' : 'border-border'
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

        {/* Flight Search */}
        <div data-testid="flight-search-section">
          <h4 className="font-semibold mb-3">Flight Information (Optional)</h4>
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                placeholder="Enter flight number (e.g., UA2346, DL3427)"
                value={flightSearchInput}
                onChange={(e) => setFlightSearchInput(e.target.value.toUpperCase())}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleFlightSearch();
                  }
                }}
                className="text-base"
                data-testid="input-flight-search"
              />
            </div>
            <Button
              onClick={handleFlightSearch}
              disabled={isSearchingFlight || !flightSearchInput.trim()}
              className="bg-primary hover:bg-primary/90 text-white px-6"
              data-testid="button-find-flight"
            >
              {isSearchingFlight ? (
                <>Searching...</>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Find Flight
                </>
              )}
            </Button>
          </div>
          {selectedFlight && (
            <div className="mt-3 p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-700 rounded-xl" data-testid="selected-flight-info">
              {/* Header with airline and remove button */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                    <Plane className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-green-800 text-sm">
                      {selectedFlight.airline} - {selectedFlight.flightNumber}
                    </p>
                    <p className="text-xs text-green-600">{selectedFlight.status || 'Scheduled'}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedFlight(null);
                    setFlightSearchInput('');
                  }}
                  className="text-green-600 hover:text-green-800 text-sm font-medium"
                  data-testid="button-clear-flight"
                >
                  Clear
                </button>
              </div>
              
              {/* Route Display with Airport Codes */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <h4 className="text-2xl font-bold text-foreground">
                    {selectedFlight.departureIata || 'N/A'}
                  </h4>
                  <p className="text-xs text-muted-foreground">{selectedFlight.departureAirport}</p>
                </div>

                <div className="flex-1 flex justify-center px-2">
                  <div className="relative w-full max-w-[100px]">
                    <div className="h-0.5 bg-green-600 w-full rounded"></div>
                    <Plane className="absolute -top-2 right-0 text-green-600" size={18} />
                  </div>
                </div>

                <div className="flex-1 text-right">
                  <h4 className="text-2xl font-bold text-foreground">
                    {selectedFlight.arrivalIata || 'N/A'}
                  </h4>
                  <p className="text-xs text-muted-foreground">{selectedFlight.arrivalAirport}</p>
                </div>
              </div>

              {/* Time and Terminal Grid */}
              <div className="grid grid-cols-2 gap-4 text-sm border-t border-green-200 dark:border-green-700 pt-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Departed</p>
                    <p className="text-lg font-bold text-green-600">
                      {selectedFlight.departureTime && selectedFlight.departureTime !== 'N/A' 
                        ? new Date(selectedFlight.departureTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
                        : '--:--'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Terminal</p>
                    <p className="text-lg font-bold text-foreground">
                      {selectedFlight.departureTerminal || '-'}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Arrival</p>
                    <p className="text-lg font-bold text-green-600">
                      {selectedFlight.arrivalTime && selectedFlight.arrivalTime !== 'N/A' 
                        ? new Date(selectedFlight.arrivalTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
                        : '--:--'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Terminal</p>
                    <p className="text-lg font-bold text-foreground">
                      {selectedFlight.arrivalTerminal || '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              {(selectedFlight.aircraft || selectedFlight.baggageClaim) && (
                <div className="flex gap-4 mt-3 pt-2 border-t border-green-200 dark:border-green-700 text-xs text-muted-foreground">
                  {selectedFlight.aircraft && <span>Aircraft: <strong className="text-foreground">{selectedFlight.aircraft}</strong></span>}
                  {selectedFlight.baggageClaim && <span>Baggage: <strong className="text-foreground">{selectedFlight.baggageClaim}</strong></span>}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Passenger Count */}
        <div data-testid="passenger-count-section">
          <div className="flex justify-between items-center">
            <span className="font-semibold">Passenger</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPassengerCount(Math.max(1, passengerCount - 1))}
                className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted"
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
                className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted"
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
              <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-background rounded-full transition-transform peer-checked:translate-x-6"></div>
            </label>
          </div>
        </div>

        {/* Bill Reference (Optional) */}
        <div data-testid="bill-reference-section">
          <h4 className="font-semibold mb-2">Bill Reference (Optional)</h4>
          <input
            type="text"
            placeholder="Your reference number for invoicing (e.g., PO#, Job#)"
            value={billReference}
            onChange={(e) => setBillReference(e.target.value)}
            className="w-full p-3 border border-border rounded-lg"
            maxLength={100}
            data-testid="input-bill-reference"
          />
        </div>

        {/* Special Instructions */}
        <div data-testid="special-instructions-section">
          <h4 className="font-semibold mb-2">Special Instructions</h4>
          <textarea
            placeholder="Is there anything else we need to know?"
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            className="w-full p-3 border border-border rounded-lg resize-none h-24"
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

  // Step 4: Payment
  if (step === 4 && quoteData) {
    const selectedVehicleName = vehicleTypes?.find(v => v.id === selectedVehicle)?.name || '';
    const selectedVehicleSlug = getVehicleSlug(selectedVehicleName);
    const totalPrice = calculatedPrices[selectedVehicleSlug] || '0';
    const totalPriceNum = parseFloat(totalPrice) || 0;
    
    // Calculate max usable credits (minimum of balance and total price)
    const maxUsableCredits = Math.min(rideCreditsBalance, totalPriceNum);
    
    // Calculate actual credit amount to apply (clamped within valid range)
    const parsedCreditAmount = parseFloat(creditAmount) || 0;
    const creditsApplied = useCredits ? Math.min(Math.max(0, parsedCreditAmount), maxUsableCredits) : 0;
    
    // Calculate remaining amount to pay
    const remainingAmount = Math.max(0, totalPriceNum - creditsApplied);
    
    // Handler for credit amount input changes with validation
    const handleCreditAmountChange = (value: string) => {
      const numValue = parseFloat(value) || 0;
      // Clamp to valid range
      if (numValue < 0) {
        setCreditAmount('0');
      } else if (numValue > maxUsableCredits) {
        setCreditAmount(maxUsableCredits.toFixed(2));
      } else {
        setCreditAmount(value);
      }
    };
    
    // Handler for toggling use credits checkbox
    const handleUseCreditsToggle = (checked: boolean) => {
      setUseCredits(checked);
      if (checked) {
        // Pre-fill with max usable amount
        setCreditAmount(maxUsableCredits.toFixed(2));
      } else {
        setCreditAmount('0');
      }
    };

    return (
      <div className="space-y-6">
        {/* Step Indicator */}
        <div className="bg-background p-4 rounded-lg border-2 border-primary/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Step 4 of 4</span>
            <span className="text-sm font-bold text-primary">Payment</span>
          </div>
          <div className="w-full bg-muted-foreground/20 rounded-full h-2">
            <div className="bg-primary h-2 rounded-full" style={{ width: '100%' }}></div>
          </div>
        </div>

        {/* Booking Summary */}
        <div className="bg-muted p-4 rounded-lg" data-testid="payment-booking-summary">
          <h4 className="font-semibold mb-3">Booking Summary</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Service:</span>
              <span className="font-semibold">{activeTab === 'transfer' ? 'Transfer' : 'Hourly'}</span>
            </div>
            <div className="flex justify-between">
              <span>Vehicle:</span>
              <span className="font-semibold">{selectedVehicleName}</span>
            </div>
            <div className="flex justify-between">
              <span>Date & Time:</span>
              <span className="font-semibold">{date} at {time}</span>
            </div>
            {activeTab === 'transfer' ? (
              <>
                <div className="flex justify-between">
                  <span>From:</span>
                  <span className="font-semibold text-right">{fromAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span>To:</span>
                  <span className="font-semibold text-right">{toAddress}</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between">
                  <span>Pickup:</span>
                  <span className="font-semibold text-right">{pickupAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span className="font-semibold">{duration} hours</span>
                </div>
              </>
            )}
            <div className="flex justify-between">
              <span>Passenger:</span>
              <span className="font-semibold">{passengerName}</span>
            </div>
            <div className="border-t pt-2 mt-2 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold">Total Price:</span>
                <span className="text-xl font-bold text-foreground">${totalPrice}</span>
              </div>
              {useCredits && creditsApplied > 0 && (
                <>
                  <div className="flex justify-between items-center text-green-600">
                    <span className="font-medium">Less: Credits Applied</span>
                    <span className="font-semibold">-${creditsApplied.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center border-t pt-2">
                    <span className="text-lg font-bold">Remaining to Pay:</span>
                    <span className="text-2xl font-bold text-primary">${remainingAmount.toFixed(2)}</span>
                  </div>
                </>
              )}
              {(!useCredits || creditsApplied === 0) && (
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">Amount to Pay:</span>
                  <span className="text-2xl font-bold text-primary">${totalPrice}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Use Account Credits Section - Always visible for authenticated users */}
        {isAuthenticated && (
          <div className={`p-4 rounded-lg border ${hasRideCredits ? 'bg-gradient-to-r from-green-50 dark:from-green-900/30 to-emerald-50 dark:to-emerald-900/30 border-green-200 dark:border-green-700' : 'bg-muted border-border'}`} data-testid="use-credits-section">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="use-credits"
                  checked={useCredits}
                  onChange={(e) => handleUseCreditsToggle(e.target.checked)}
                  disabled={!hasRideCredits}
                  className={`w-5 h-5 rounded focus:ring-green-500 ${hasRideCredits ? 'text-green-600 border-green-300' : 'text-muted-foreground border-border cursor-not-allowed'}`}
                  data-testid="checkbox-use-credits"
                />
                <label htmlFor="use-credits" className={`font-semibold cursor-pointer ${hasRideCredits ? 'text-green-800' : 'text-muted-foreground'}`}>
                  Use Account Credits
                </label>
              </div>
              <span className={`text-sm font-medium px-3 py-1 rounded-full ${hasRideCredits ? 'text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30' : 'text-muted-foreground bg-muted-foreground/20'}`}>
                Balance: ${rideCreditsBalance.toFixed(2)}
              </span>
            </div>
            
            {!hasRideCredits && (
              <p className="text-sm text-muted-foreground">
                You don't have any account credits. Credits can be added by an administrator or earned through promotions.
              </p>
            )}
            
            {useCredits && hasRideCredits && (
              <div className="mt-3 space-y-2">
                <label htmlFor="credit-amount" className="text-sm font-medium text-muted-foreground">
                  Amount to use (max ${maxUsableCredits.toFixed(2)}):
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-muted-foreground">$</span>
                  <input
                    type="number"
                    id="credit-amount"
                    value={creditAmount}
                    onChange={(e) => handleCreditAmountChange(e.target.value)}
                    onBlur={() => {
                      // On blur, format to 2 decimal places if valid
                      const numValue = parseFloat(creditAmount);
                      if (!isNaN(numValue)) {
                        setCreditAmount(Math.min(numValue, maxUsableCredits).toFixed(2));
                      }
                    }}
                    min="0"
                    max={maxUsableCredits}
                    step="0.01"
                    className="flex-1 p-3 border-2 border-green-300 rounded-lg focus:border-green-500 focus:ring-green-500 text-lg font-semibold"
                    data-testid="input-credit-amount"
                  />
                  <button
                    type="button"
                    onClick={() => setCreditAmount(maxUsableCredits.toFixed(2))}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    data-testid="button-use-max-credits"
                  >
                    Use Max
                  </button>
                </div>
                {creditsApplied > 0 && (
                  <p className="text-sm text-green-700 dark:text-green-300">
                    You'll pay ${remainingAmount.toFixed(2)} {remainingAmount > 0 ? 'with your selected payment method' : '- fully covered by credits!'}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Payment Options */}
        <div className="space-y-4">
          <h4 className="font-semibold text-lg">Select Payment Method</h4>
          
          {/* Pay Now Option - Always shown */}
          <button
            onClick={() => {
              // Save all booking data to localStorage for checkout page
              const bookingDataForCheckout = {
                vehicleTypeId: selectedVehicle,
                bookingType: activeTab,
                scheduledDateTime: new Date(`${date}T${time}`).toISOString(),
                totalAmount: totalPrice,
                // Include partial credit info
                ...(useCredits && creditsApplied > 0 && {
                  creditAmountApplied: creditsApplied.toFixed(2),
                }),
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
                passengerName,
                passengerPhone,
                passengerEmail,
                passengerCount,
                luggageCount,
                babySeat,
                specialInstructions: specialInstructions || undefined,
                billReference: billReference || undefined,
                ...(selectedFlight && {
                  flightNumber: selectedFlight.flightNumber,
                  flightAirline: selectedFlight.airline,
                  flightDeparture: selectedFlight.departure,
                  flightArrival: selectedFlight.arrival,
                  flightOrigin: selectedFlight.origin,
                  flightDestination: selectedFlight.destination,
                }),
              };
              
              // Store in localStorage for checkout page
              localStorage.setItem('pendingBookingForPayment', JSON.stringify(bookingDataForCheckout));
              
              // Redirect to checkout page in "create mode" with remaining amount to charge
              const amountToCharge = useCredits && creditsApplied > 0 ? remainingAmount.toFixed(2) : totalPrice;
              setLocation(`/checkout?mode=create&amount=${amountToCharge}`);
            }}
            className="w-full p-6 border-2 border-primary rounded-lg hover:bg-primary/5 transition-all group"
            data-testid="button-pay-now-step4"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div className="text-left flex-1">
                <h3 className="text-lg font-bold text-primary">Pay Now</h3>
                <p className="text-sm text-muted-foreground">Complete payment to confirm your booking</p>
              </div>
            </div>
          </button>

          {/* Pay Later Option - Only show if user has pay later enabled */}
          {user?.payLaterEnabled && user.role === 'passenger' && (() => {
            const hasSavedCards = paymentMethods && paymentMethods.length > 0;
            return (
              <button
                onClick={() => {
                  if (!hasSavedCards) {
                    // Show dialog to prompt adding payment method
                    setShowPaymentMethodRequired(true);
                  } else {
                    // Create booking with status "confirmed" (unpaid)
                    bookingMutation.mutate();
                  }
                }}
                className={`w-full p-6 border-2 rounded-lg transition-all group relative ${
                  hasSavedCards 
                    ? 'border-border hover:border-primary hover:bg-primary/5 cursor-pointer' 
                    : 'border-border bg-muted cursor-not-allowed opacity-70'
                }`}
                data-testid="button-pay-later-step4"
              >
                {/* Warning badge for no payment method */}
                {!hasSavedCards && (
                  <div className="absolute -top-3 left-4 bg-amber-50 dark:bg-amber-900/200 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                    Payment Card Required
                  </div>
                )}
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    hasSavedCards 
                      ? 'bg-muted group-hover:bg-primary/10 group-hover:scale-110' 
                      : 'bg-muted-foreground/20'
                  }`}>
                    <Clock className={`w-6 h-6 ${hasSavedCards ? 'text-muted-foreground group-hover:text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className={`text-lg font-bold ${hasSavedCards ? 'text-foreground group-hover:text-primary' : 'text-muted-foreground'}`}>
                      Pay Later
                    </h3>
                    <p className={`text-sm ${hasSavedCards ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                      {hasSavedCards 
                        ? "Pay after your trip is completed" 
                        : "You must add a payment card first"}
                    </p>
                    {!hasSavedCards && (
                      <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-md">
                        <p className="text-xs text-amber-700 dark:text-amber-300 font-medium flex items-center gap-1">
                          <CreditCard className="w-3 h-3" />
                          Click here to add a payment card to enable Pay Later
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })()}

          {/* Pay with Cash Option - Only show if user has cash payment enabled */}
          {user?.cashPaymentEnabled && user.role === 'passenger' && (
            <button
              onClick={() => {
                // Create booking with cash payment (no payment method required)
                bookingMutation.mutate();
              }}
              className="w-full p-6 border-2 border-green-300 rounded-lg hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 dark:bg-green-900/20 transition-all group"
              data-testid="button-pay-cash-step4"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 group-hover:bg-green-200 rounded-full flex items-center justify-center group-hover:scale-110 transition-all">
                  <Banknote className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="text-lg font-bold text-green-800 group-hover:text-green-900">Pay with Cash</h3>
                  <p className="text-sm text-muted-foreground">Pay with cash when your trip is completed</p>
                </div>
              </div>
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => setStep(3)}
            className="flex-1"
            data-testid="button-back-step4"
          >
            Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="backdrop-blur-sm rounded-2xl shadow-2xl bg-background w-full max-w-full p-4 sm:p-6 lg:p-8">
      {/* Enhanced Service Type Tabs */}
      <div className="flex mb-6 border-b-2 border-border">
        <button
          onClick={() => setActiveTab('transfer')}
          className="flex-1 py-4 px-6 text-lg transition-all border-b-4 border-primary font-bold text-[#fa0202]"
          data-testid="tab-transfer"
        >
          Transfer Only
        </button>
        <button
          onClick={() => setActiveTab('hourly')}
          className={`flex-1 py-4 px-6 text-lg font-semibold transition-all border-b-4 ${
            activeTab === 'hourly'
              ? 'text-primary border-primary font-bold'
              : 'text-gray-300 border-transparent hover:text-muted-foreground'
          }`}
          data-testid="tab-hourly"
        >
          Hourly
        </button>
      </div>
      {/* Transfer Form */}
      {activeTab === 'transfer' && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-primary mb-4">Book Your Transfer</h3>
          
          {/* From Address */}
          <div className="relative">
            <Label htmlFor="from" className="text-base font-semibold text-muted-foreground">From *</Label>
            <Input
              id="from"
              value={fromAddress}
              onChange={(e) => {
                setFromAddress(e.target.value);
                handleAddressInput('from', e.target.value);
              }}
              placeholder="Pickup location"
              autoComplete="off"
              className="mt-2 p-3 text-base border-2 border-border rounded-lg focus:border-primary"
              data-testid="input-from"
            />
            {showSuggestions.from && suggestions.from?.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-background border border-border border-t-0 rounded-b-lg max-h-48 overflow-y-auto z-50 shadow-lg">
                {suggestions.from.map((suggestion, index) => (
                  <div
                    key={index}
                    className="p-3 cursor-pointer border-b border-border hover:bg-muted transition-colors"
                    onClick={() => selectSuggestion('from', suggestion)}
                    data-testid={`suggestion-from-${index}`}
                  >
                    <div className="font-semibold text-foreground">{suggestion.display_name}</div>
                  </div>
                ))}
              </div>
            )}
            {fromCoords && (
              <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded text-[8px] text-green-700 dark:text-green-300 font-mono" data-testid="from-coordinates">
                <span>Lat: {fromCoords.lat.toFixed(6)}, Lng: {fromCoords.lon.toFixed(6)}</span>
              </div>
            )}
          </div>

          {/* Via Points Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-base font-semibold text-muted-foreground">+ Via Point (Optional)</Label>
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
                    className="p-3 text-base border-2 border-border rounded-lg focus:border-primary"
                    data-testid={`input-via-${index}`}
                  />
                  {showSuggestions[`via-${index}`] && suggestions[`via-${index}`]?.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-background border border-border border-t-0 rounded-b-lg max-h-48 overflow-y-auto z-50 shadow-lg">
                      {suggestions[`via-${index}`].map((suggestion, sugIndex) => (
                        <div
                          key={sugIndex}
                          className="p-3 cursor-pointer border-b border-border hover:bg-muted transition-colors"
                          onClick={() => selectSuggestion(`via-${index}`, suggestion)}
                          data-testid={`suggestion-via-${index}-${sugIndex}`}
                        >
                          <div className="font-semibold text-foreground">{suggestion.display_name}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {viaCoords && viaCoords[index] && (
                    <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded text-[8px] text-green-700 dark:text-green-300 font-mono" data-testid={`via-${index}-coordinates`}>
                      <span>Lat: {viaCoords[index].lat.toFixed(6)}, Lng: {viaCoords[index].lon.toFixed(6)}</span>
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  onClick={() => removeViaPoint(index)}
                  className="px-3 py-2 bg-red-50 dark:bg-red-900/200 text-white rounded-lg hover:bg-red-600"
                  data-testid={`button-remove-via-${index}`}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>

          {/* To Address */}
          <div className="relative">
            <Label htmlFor="to" className="text-base font-semibold text-muted-foreground">To *</Label>
            <Input
              id="to"
              value={toAddress}
              onChange={(e) => {
                setToAddress(e.target.value);
                handleAddressInput('to', e.target.value);
              }}
              placeholder="Destination"
              autoComplete="off"
              className="mt-2 p-3 text-base border-2 border-border rounded-lg focus:border-primary"
              data-testid="input-to"
            />
            {showSuggestions.to && suggestions.to?.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-background border border-border border-t-0 rounded-b-lg max-h-48 overflow-y-auto z-50 shadow-lg">
                {suggestions.to.map((suggestion, index) => (
                  <div
                    key={index}
                    className="p-3 cursor-pointer border-b border-border hover:bg-muted transition-colors"
                    onClick={() => selectSuggestion('to', suggestion)}
                    data-testid={`suggestion-to-${index}`}
                  >
                    <div className="font-semibold text-foreground">{suggestion.display_name}</div>
                  </div>
                ))}
              </div>
            )}
            {toCoords && (
              <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded text-[8px] text-green-700 dark:text-green-300 font-mono" data-testid="to-coordinates">
                <span>Lat: {toCoords.lat.toFixed(6)}, Lng: {toCoords.lon.toFixed(6)}</span>
              </div>
            )}
          </div>

          {/* Date and Time Row */}
          <div className="grid grid-cols-[2fr_3fr] gap-4">
            <div>
              <Label htmlFor="date" className="text-base font-semibold text-muted-foreground">Date *</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="mt-2 p-3 text-base border-2 border-border rounded-lg focus:border-primary"
                data-testid="input-date"
              />
            </div>
            <div>
              <Label className="text-base font-semibold text-muted-foreground">Time *</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <Select value={hour} onValueChange={setHour}>
                  <SelectTrigger className="p-3 text-base border-2 border-border rounded-lg" data-testid="select-hour">
                    <SelectValue placeholder="Hour" />
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
                  <SelectTrigger className="p-3 text-base border-2 border-border rounded-lg" data-testid="select-minute">
                    <SelectValue placeholder="Min" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i * 5).map((m) => (
                      <SelectItem key={m} value={m.toString().padStart(2, '0')}>
                        {m.toString().padStart(2, '0')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={period} onValueChange={(value) => setPeriod(value as 'AM' | 'PM')}>
                  <SelectTrigger className="p-3 text-base border-2 border-border rounded-lg" data-testid="select-period">
                    <SelectValue placeholder="AM/PM" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AM">AM</SelectItem>
                    <SelectItem value="PM">PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Get Quote Button */}
          <Button
            onClick={handleGetQuote}
            disabled={quoteMutation.isPending}
            className="w-full py-3 px-6 text-lg font-bold bg-accent hover:bg-accent/90 active:bg-accent/80 text-accent-foreground rounded-xl transition-all duration-300 hover:shadow-lg active:transform active:scale-95 shadow-md mt-6 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
            data-testid="button-get-quote"
          >
            {quoteMutation.isPending ? 'Calculating Quote...' : 'Get a Quote'}
          </Button>
        </div>
      )}
      {/* Hourly Form */}
      {activeTab === 'hourly' && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-primary mb-4">Book Hourly Service</h3>
          
          {/* Pickup Address */}
          <div className="relative">
            <Label htmlFor="pickup" className="text-base font-semibold text-muted-foreground">Pickup Address *</Label>
            <Input
              id="pickup"
              value={pickupAddress}
              onChange={(e) => {
                setPickupAddress(e.target.value);
                handleAddressInput('pickup', e.target.value);
              }}
              placeholder="Enter pickup location"
              autoComplete="off"
              className="mt-2 p-3 text-base border-2 border-border rounded-lg focus:border-primary"
              data-testid="input-pickup"
            />
            {showSuggestions.pickup && suggestions.pickup?.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-background border border-border border-t-0 rounded-b-lg max-h-48 overflow-y-auto z-50 shadow-lg">
                {suggestions.pickup.map((suggestion, index) => (
                  <div
                    key={index}
                    className="p-3 cursor-pointer border-b border-border hover:bg-muted transition-colors"
                    onClick={() => selectSuggestion('pickup', suggestion)}
                    data-testid={`suggestion-pickup-${index}`}
                  >
                    <div className="font-semibold text-foreground">{suggestion.display_name}</div>
                  </div>
                ))}
              </div>
            )}
            {pickupCoords && (
              <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded text-[8px] text-green-700 dark:text-green-300 font-mono" data-testid="pickup-coordinates">
                <span>Lat: {pickupCoords.lat.toFixed(6)}, Lng: {pickupCoords.lon.toFixed(6)}</span>
              </div>
            )}
          </div>

          {/* Duration */}
          <div>
            <Label htmlFor="duration" className="text-base font-semibold text-muted-foreground">Duration (2-24 hours) *</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger className="mt-2 p-3 text-base border-2 border-border rounded-lg" data-testid="select-duration">
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
          <div className="grid grid-cols-[2fr_3fr] gap-4">
            <div>
              <Label htmlFor="date" className="text-base font-semibold text-muted-foreground">Date *</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="mt-2 p-3 text-base border-2 border-border rounded-lg focus:border-primary"
                data-testid="input-date"
              />
            </div>
            <div>
              <Label className="text-base font-semibold text-muted-foreground">Time *</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <Select value={hour} onValueChange={setHour}>
                  <SelectTrigger className="p-3 text-base border-2 border-border rounded-lg" data-testid="select-hour">
                    <SelectValue placeholder="Hour" />
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
                  <SelectTrigger className="p-3 text-base border-2 border-border rounded-lg" data-testid="select-minute">
                    <SelectValue placeholder="Min" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i * 5).map((m) => (
                      <SelectItem key={m} value={m.toString().padStart(2, '0')}>
                        {m.toString().padStart(2, '0')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={period} onValueChange={(value) => setPeriod(value as 'AM' | 'PM')}>
                  <SelectTrigger className="p-3 text-base border-2 border-border rounded-lg" data-testid="select-period">
                    <SelectValue placeholder="AM/PM" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AM">AM</SelectItem>
                    <SelectItem value="PM">PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Get Quote Button */}
          <Button
            onClick={handleGetQuote}
            disabled={quoteMutation.isPending}
            className="w-full py-3 px-6 text-lg font-bold bg-accent hover:bg-accent/90 active:bg-accent/80 text-accent-foreground rounded-xl transition-all duration-300 hover:shadow-lg active:transform active:scale-95 shadow-md mt-6 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
            data-testid="button-get-quote"
          >
            {quoteMutation.isPending ? 'Calculating Quote...' : 'Get a Quote'}
          </Button>
        </div>
      )}
      {/* Flight Selection Dialog */}
      <Dialog open={showFlightDialog} onOpenChange={setShowFlightDialog}>
        <DialogContent className="sm:max-w-3xl bg-background max-h-[90vh] overflow-y-auto" data-testid="flight-selection-dialog">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Flight Detail</DialogTitle>
            <DialogDescription>
              {flightResults.length > 1 
                ? `We found ${flightResults.length} flights matching "${flightSearchInput}". Select your flight to add it to your booking.`
                : `Select your flight to add it to your booking.`
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {flightResults.map((flight) => {
              const formatFlightTime = (dateString: string) => {
                if (!dateString || dateString === 'N/A') return '--:--';
                try {
                  const date = new Date(dateString);
                  return date.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: false 
                  });
                } catch {
                  return '--:--';
                }
              };

              const formatFlightDate = (dateString: string) => {
                if (!dateString || dateString === 'N/A') return '';
                try {
                  const date = new Date(dateString);
                  return date.toLocaleDateString('en-GB', { 
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  }).replace(/ /g, ' ');
                } catch {
                  return '';
                }
              };

              return (
                <button
                  key={flight.id}
                  onClick={() => {
                    setSelectedFlight(flight);
                    setShowFlightDialog(false);
                    toast({
                      title: "Flight Selected",
                      description: `${flight.airline} ${flight.flightNumber} has been added to your booking`,
                    });
                  }}
                  className="w-full p-6 border-2 border-border rounded-xl hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 dark:bg-green-900/20/30 transition-all text-left group"
                  data-testid={`flight-option-${flight.id}`}
                >
                  {/* Route Header with Large Airport Codes */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex-1">
                      <h3 className="text-4xl md:text-5xl font-bold text-foreground">
                        {flight.departureIata || 'N/A'}
                      </h3>
                      <p className="text-muted-foreground mt-1 text-sm">
                        {flight.departureAirport} {formatFlightDate(flight.departureTime) && `- ${formatFlightDate(flight.departureTime)}`}
                      </p>
                    </div>

                    <div className="flex-1 flex justify-center px-4">
                      <div className="relative w-full max-w-[200px]">
                        <div className="h-1 bg-green-600 w-full rounded"></div>
                        <Plane className="absolute -top-3 right-0 text-green-600 transform rotate-0" size={28} />
                      </div>
                    </div>

                    <div className="flex-1 text-right">
                      <h3 className="text-4xl md:text-5xl font-bold text-foreground">
                        {flight.arrivalIata || 'N/A'}
                      </h3>
                      <p className="text-muted-foreground mt-1 text-sm">
                        {flight.arrivalAirport} {formatFlightDate(flight.arrivalTime) && `- ${formatFlightDate(flight.arrivalTime)}`}
                      </p>
                    </div>
                  </div>

                  {/* Time and Terminal Grid */}
                  <div className="grid grid-cols-2 gap-6 border-t pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-muted-foreground text-sm mb-1">Departed</p>
                        <p className="text-2xl md:text-3xl font-bold text-green-600">
                          {formatFlightTime(flight.departureTime)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-sm mb-1">Terminal</p>
                        <p className="text-2xl md:text-3xl font-bold text-foreground">
                          {flight.departureTerminal || '-'}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-muted-foreground text-sm mb-1">Arrival</p>
                        <p className="text-2xl md:text-3xl font-bold text-green-600">
                          {formatFlightTime(flight.arrivalTime)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-sm mb-1">Terminal</p>
                        <p className="text-2xl md:text-3xl font-bold text-foreground">
                          {flight.arrivalTerminal || '-'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Flight Info Footer */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t">
                    <div className="bg-muted p-2 rounded-lg">
                      <p className="text-xs text-muted-foreground">Flight Number</p>
                      <p className="text-sm font-bold text-foreground">{flight.flightNumber}</p>
                    </div>
                    <div className="bg-muted p-2 rounded-lg">
                      <p className="text-xs text-muted-foreground">Airline</p>
                      <p className="text-sm font-bold text-foreground">{flight.airline}</p>
                    </div>
                    {flight.aircraft && (
                      <div className="bg-muted p-2 rounded-lg">
                        <p className="text-xs text-muted-foreground">Aircraft</p>
                        <p className="text-sm font-bold text-foreground">{flight.aircraft}</p>
                      </div>
                    )}
                    <div className="bg-muted p-2 rounded-lg">
                      <p className="text-xs text-muted-foreground">Status</p>
                      <p className="text-sm font-bold text-green-600">{flight.status}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
      {/* Payment Method Required Dialog */}
      <Dialog open={showPaymentMethodRequired} onOpenChange={setShowPaymentMethodRequired}>
        <DialogContent className="sm:max-w-md bg-background" data-testid="payment-method-required-dialog">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-amber-600">Payment Method Required</DialogTitle>
            <DialogDescription>
              To complete your booking with "Pay Later" option, you need to add a payment method to your account.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Why is this required?</strong>
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Adding a payment method ensures seamless payment processing after your trip is completed. 
                Your card will be securely stored and charged only after you've enjoyed your luxury transportation service.
              </p>
            </div>
            
            <div className="space-y-3">
              <Button
                onClick={() => {
                  setShowPaymentMethodRequired(false);
                  setLocation('/account-settings');
                }}
                className="w-full bg-primary hover:bg-primary/90 text-white py-6"
                data-testid="button-add-payment-method"
              >
                <CreditCard className="w-5 h-5 mr-2" />
                Add Payment Method in Account Settings
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  setShowPaymentMethodRequired(false);
                }}
                className="w-full py-6"
                data-testid="button-cancel-payment-method"
              >
                Cancel
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground text-center mt-2">
              Alternatively, you can choose "Pay Now" to complete payment immediately.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
