import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
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
  Plus,
  X,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { RouteLayer } from './RouteLayer';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import FlightSearch, { FlightInfo } from "./FlightSearch";

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
  regularPrice: string;
  discountPercentage: string;
  discountAmount: string;
  baseFare: string;
  gratuityAmount: string;
  airportFeeAmount: string;
  surgePricingMultiplier: string;
  surgePricingAmount: string;
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
  flightDepartureTerminal: string;
  flightArrivalTerminal: string;
  flightBaggageClaim: string;
  specialInstructions: string;
  billReference: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  paymentMethod: 'pay_now' | 'pay_later' | 'cash' | 'ride_credit';
  creditAmountApplied?: string;
  adminDiscount: string;
  customPriceItems: Array<{
    description: string;
    amount: number;
    addedBy?: string;
    addedAt?: string;
  }>;
}

interface BookingDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: BookingFormData;
  setFormData: React.Dispatch<React.SetStateAction<BookingFormData>>;
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
  onToggleNoShow?: (bookingId: string, noShow: boolean) => void;
  onSendRefundInvoice?: (bookingId: string) => void;
  onMarkCompleted?: (bookingId: string) => void;
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
  onToggleNoShow,
  onSendRefundInvoice,
  onMarkCompleted,
}: BookingDetailsDialogProps) {
  
  // State for change driver mode
  const [isChangingDriver, setIsChangingDriver] = useState(false);
  const [tempSelectedDriverId, setTempSelectedDriverId] = useState('');
  const [tempDriverPayment, setTempDriverPayment] = useState('');
  
  // Tab navigation for mobile
  const [activeTab, setActiveTab] = useState<'passenger' | 'journey' | 'schedule' | 'pricing'>('passenger');
  
  // State for additional charges
  const [showAdditionalChargeForm, setShowAdditionalChargeForm] = useState(false);
  const [chargeDescription, setChargeDescription] = useState('');
  const [chargeAmount, setChargeAmount] = useState('');
  
  // State for custom price items
  const [showCustomItemForm, setShowCustomItemForm] = useState(false);
  const [customItemDescription, setCustomItemDescription] = useState('');
  const [customItemAmount, setCustomItemAmount] = useState('');
  
  // State for account credits
  const [useCredits, setUseCredits] = useState(false);
  const [creditAmount, setCreditAmount] = useState('0.00');
  
  // Get current user for role checking
  const { user } = useAuth();
  const { toast } = useToast();
  const canManageCharges = user?.role === 'admin' || user?.role === 'dispatcher';
  
  // Query to fetch selected passenger's ride credits
  const { data: passengerCreditsData } = useQuery<{ balance: string; hasCredits: boolean }>({
    queryKey: ['/api/admin/users', formData.passengerId, 'ride-credits'],
    queryFn: async () => {
      if (!formData.passengerId) return { balance: '0.00', hasCredits: false };
      const response = await apiRequest('GET', `/api/admin/users/${formData.passengerId}/ride-credits`);
      return response.json();
    },
    enabled: !!formData.passengerId && canManageCharges,
  });
  
  const passengerCreditsBalance = parseFloat(passengerCreditsData?.balance || '0') || 0;
  const hasPassengerCredits = passengerCreditsData?.hasCredits === true && passengerCreditsBalance > 0;
  
  // Calculate max usable credits (min of balance and total amount)
  const parsedTotalAmount = parseFloat(formData.totalAmount || '0');
  const safeTotalAmount = isNaN(parsedTotalAmount) ? 0 : parsedTotalAmount;
  const maxUsableCredits = safeTotalAmount > 0 ? Math.min(passengerCreditsBalance, safeTotalAmount) : 0;
  const parsedCreditAmount = parseFloat(creditAmount) || 0;
  const creditsApplied = useCredits && maxUsableCredits > 0 ? Math.min(parsedCreditAmount, maxUsableCredits) : 0;
  const remainingAmount = safeTotalAmount - creditsApplied;
  
  // Reset credits when passenger changes
  useEffect(() => {
    setUseCredits(false);
    setCreditAmount('0.00');
  }, [formData.passengerId]);
  
  // Update credit amount when max usable changes
  useEffect(() => {
    if (useCredits && maxUsableCredits > 0) {
      setCreditAmount(maxUsableCredits.toFixed(2));
    }
  }, [maxUsableCredits, useCredits]);
  
  // Handle credits toggle
  const handleUseCreditsToggle = (checked: boolean) => {
    setUseCredits(checked);
    if (checked && maxUsableCredits > 0) {
      setCreditAmount(maxUsableCredits.toFixed(2));
    } else {
      setCreditAmount('0.00');
    }
  };
  
  // Handle credit amount change
  const handleCreditAmountChange = (value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) {
      setCreditAmount('0.00');
    } else if (numValue > maxUsableCredits) {
      setCreditAmount(maxUsableCredits.toFixed(2));
    } else {
      setCreditAmount(value);
    }
  };
  
  // Sync creditAmountApplied to formData when credits change
  useEffect(() => {
    if (useCredits && creditsApplied > 0) {
      setFormData(prev => ({ ...prev, creditAmountApplied: creditsApplied.toFixed(2) }));
    } else {
      setFormData(prev => ({ ...prev, creditAmountApplied: undefined }));
    }
  }, [useCredits, creditsApplied, setFormData]);
  
  // Mutation for adding additional charges
  const addChargeMutation = useMutation({
    mutationFn: async ({ bookingId, description, amount }: { bookingId: string; description: string; amount: number }) => {
      const response = await apiRequest('POST', `/api/bookings/${bookingId}/additional-charge`, {
        description,
        amount
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Charge Added",
        description: "Additional charge has been added successfully",
      });
      setShowAdditionalChargeForm(false);
      setChargeDescription('');
      setChargeAmount('');
      // Refresh booking data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/bookings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dispatcher/bookings'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add additional charge",
        variant: "destructive",
      });
    },
  });
  
  // Mutation for authorizing payment
  const authorizePaymentMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const response = await apiRequest('POST', `/api/bookings/${bookingId}/authorize-payment`);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Payment Authorized",
        description: `Successfully charged $${data.amount}`,
      });
      // Refresh booking data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/bookings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dispatcher/bookings'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to authorize payment",
        variant: "destructive",
      });
    },
  });
  
  // Handle adding additional charge
  const handleAddCharge = () => {
    if (!editingBooking) return;
    
    const amount = parseFloat(chargeAmount);
    if (!chargeDescription.trim() || !chargeAmount || amount <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please provide a valid description and amount",
        variant: "destructive",
      });
      return;
    }
    
    addChargeMutation.mutate({
      bookingId: editingBooking.id,
      description: chargeDescription,
      amount
    });
  };
  
  // Handle authorizing payment
  const handleAuthorizePayment = () => {
    if (!editingBooking) return;
    authorizePaymentMutation.mutate(editingBooking.id);
  };
  
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
      <DialogContent className="w-full max-w-full sm:max-w-[95vw] md:max-w-[900px] lg:max-w-[1100px] h-[100dvh] sm:h-[95vh] sm:max-h-[95vh] overflow-hidden p-0 bg-background sm:rounded-xl rounded-none">
        <VisuallyHidden>
          <DialogTitle>{editingBooking ? 'Edit Booking' : 'New Booking'}</DialogTitle>
          <DialogDescription>Create or edit a booking with passenger, journey, and pricing details</DialogDescription>
        </VisuallyHidden>
        
        {/* Mobile Header - Sticky with safe area padding for phone sensors */}
        <div className="sticky top-0 z-50 bg-gradient-to-r from-blue-600 to-indigo-600 px-4 pt-[30px] pb-3 sm:px-6 sm:pt-4 sm:pb-4 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                {editingBooking ? 'Edit Booking' : 'New Booking'}
              </h2>
              {editingBooking && (
                <p className="text-xs text-white/80 font-mono">#{editingBooking.id.substring(0, 8)}</p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-white hover:bg-white/20 p-2 h-auto"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Mobile Tab Navigation - adjusted for safe area padding */}
        <div className="lg:hidden sticky top-[84px] sm:top-[68px] z-40 bg-background border-b text-[12px]">
          <div className="flex overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveTab('passenger')}
              className={`flex-1 min-w-[80px] px-3 py-3 text-xs sm:text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === 'passenger' 
                  ? 'border-blue-600 text-blue-600 bg-blue-50' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <User className="w-4 h-4 mx-auto mb-1" />
              Passenger
            </button>
            <button
              onClick={() => setActiveTab('journey')}
              className={`flex-1 min-w-[80px] px-3 py-3 text-xs sm:text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === 'journey' 
                  ? 'border-blue-600 text-blue-600 bg-blue-50' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <MapPin className="w-4 h-4 mx-auto mb-1" />
              Journey
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`flex-1 min-w-[80px] px-3 py-3 text-xs sm:text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === 'schedule' 
                  ? 'border-blue-600 text-blue-600 bg-blue-50' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Clock className="w-4 h-4 mx-auto mb-1" />
              Schedule
            </button>
            <button
              onClick={() => setActiveTab('pricing')}
              className={`flex-1 min-w-[80px] px-3 py-3 text-xs sm:text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === 'pricing' 
                  ? 'border-blue-600 text-blue-600 bg-blue-50' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <DollarSign className="w-4 h-4 mx-auto mb-1" />
              Pricing
            </button>
          </div>
        </div>
        
        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto">
          {/* Desktop: Two Column Layout / Mobile: Tab Content */}
          <div className="lg:grid lg:grid-cols-[1.2fr_1fr] h-full">
            
            {/* LEFT PANEL - Journey Details (Desktop always visible, Mobile tab-based) */}
            <div className={`lg:block lg:overflow-y-auto lg:border-r bg-background ${
              activeTab === 'pricing' ? 'hidden' : 'block'
            }`}>
              <div className="p-3 sm:p-4 space-y-3 pb-28 lg:pb-4">

            {/* Journey Details Section - Ultra Compact Professional Design */}
            <div className="space-y-3">
              {/* Section Header - Compact */}
              <div className="flex items-center gap-2 pb-1.5 border-b border-border">
                <div className="w-6 h-6 bg-primary/10 rounded flex items-center justify-center">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                </div>
                <h3 className="text-sm font-bold text-foreground">Journey Details</h3>
              </div>
              
              <div className="space-y-2.5">
                  {/* Passenger Selection */}
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Passenger *
                    </Label>
                    <div className="relative">
                      <Input
                        placeholder="Search name, email, phone..."
                        value={(() => {
                          if (userSearchQuery && userSearchQuery.trim()) return userSearchQuery;
                          if (formData.passengerId) {
                            const selectedPassenger = allUsers?.find(u => u.id === formData.passengerId);
                            if (selectedPassenger) {
                              return `${selectedPassenger.firstName} ${selectedPassenger.lastName} (${selectedPassenger.email})`;
                            }
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
                          if (!formData.passengerId && !userSearchQuery) {
                            setUserSearchQuery(' ');
                          }
                        }}
                        className="h-8 text-sm"
                        data-testid="input-passenger-search"
                      />
                      {userSearchQuery && allUsers && (
                        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {(() => {
                            const query = userSearchQuery.trim().toLowerCase();
                            const filteredPassengers = allUsers
                              .filter(u => u.role === 'passenger')
                              .filter(u => {
                                if (!query) return true;
                                return (
                                  u.firstName?.toLowerCase().includes(query) ||
                                  u.lastName?.toLowerCase().includes(query) ||
                                  u.email?.toLowerCase().includes(query) ||
                                  u.phone?.toLowerCase().includes(query) ||
                                  `${u.firstName} ${u.lastName}`.toLowerCase().includes(query)
                                );
                              })
                              .slice(0, 8);
                            
                            if (filteredPassengers.length === 0) {
                              return (
                                <div className="px-3 py-2 text-sm text-muted-foreground text-center">
                                  No passengers found
                                </div>
                              );
                            }
                            
                            return filteredPassengers.map((passenger) => (
                              <button
                                key={passenger.id}
                                type="button"
                                className="w-full text-left px-3 py-2 hover:bg-muted border-b border-border last:border-0 text-sm transition-colors"
                                onClick={() => {
                                  setFormData({ ...formData, passengerId: passenger.id });
                                  setUserSearchQuery('');
                                }}
                                data-testid={`passenger-option-${passenger.id}`}
                              >
                                <div className="font-medium text-foreground text-sm">{passenger.firstName} {passenger.lastName}</div>
                                <div className="text-xs text-muted-foreground">{passenger.email} {passenger.phone && `• ${passenger.phone}`}</div>
                              </button>
                            ));
                          })()}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Booking Type & Vehicle - Ultra Compact Row */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Type *
                      </Label>
                      <Select
                        value={formData.bookingType}
                        onValueChange={(value) => setFormData({ ...formData, bookingType: value as 'transfer' | 'hourly' })}
                      >
                        <SelectTrigger data-testid="select-booking-type" className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="transfer">Transfer</SelectItem>
                          <SelectItem value="hourly">Hourly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Vehicle *
                      </Label>
                      <Select
                        value={formData.vehicleTypeId}
                        onValueChange={(value) => setFormData({ ...formData, vehicleTypeId: value })}
                      >
                        <SelectTrigger data-testid="select-vehicle-type" className="h-8 text-sm">
                          <SelectValue placeholder="Select" />
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

                  {/* Addresses Section */}
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                        Pickup *
                      </Label>
                      <AddressAutocomplete
                        id="pickup-address"
                        label=""
                        value={formData.pickupAddress}
                        onChange={(value, coords) => {
                          setFormData({ ...formData, pickupAddress: value, pickupCoords: coords || null });
                        }}
                        placeholder="Enter pickup address"
                        userId={formData.passengerId}
                        required={true}
                        data-testid="input-pickup-address"
                      />
                    </div>

                    {/* Via Points Section - Hidden for Hourly Service */}
                    {formData.bookingType !== 'hourly' && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                            Stops
                          </Label>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const newViaPoints = [...(formData.viaPoints || []), { address: '', lat: 0, lon: 0 }];
                              setFormData({ ...formData, viaPoints: newViaPoints });
                            }}
                            data-testid="button-add-via-point"
                            className="h-6 text-[10px] text-primary hover:text-primary px-1.5"
                          >
                            <Plus className="w-3 h-3 mr-0.5" />
                            Add
                          </Button>
                        </div>
                        
                        {formData.viaPoints && formData.viaPoints.length > 0 && (
                          <div className="space-y-2 pl-3 border-l-2 border-amber-200 dark:border-amber-800">
                            {formData.viaPoints.map((viaPoint, index) => (
                              <div key={index} className="relative">
                                <AddressAutocomplete
                                  id={`via-point-${index}`}
                                  label=""
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
                                  placeholder={`Stop ${index + 1}`}
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
                                  className="absolute top-1/2 -translate-y-1/2 right-1 h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                  data-testid={`button-remove-via-point-${index}`}
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Destination Address - Hidden for Hourly Service */}
                    {formData.bookingType !== 'hourly' && (
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                          Destination *
                        </Label>
                        <AddressAutocomplete
                          id="destination-address"
                          label=""
                          value={formData.destinationAddress}
                          onChange={(value, coords) => {
                            setFormData({ ...formData, destinationAddress: value, destinationCoords: coords || null });
                          }}
                          placeholder="Enter destination address"
                          userId={formData.passengerId}
                          required={true}
                          data-testid="input-destination-address"
                        />
                      </div>
                    )}

                    {/* Duration for Hourly */}
                    {formData.bookingType === 'hourly' && (
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          Duration *
                        </Label>
                        <Select
                          value={formData.requestedHours}
                          onValueChange={(value) => setFormData({ ...formData, requestedHours: value })}
                        >
                          <SelectTrigger data-testid="select-requested-hours" className="h-8 text-sm">
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
                  </div>

                  {/* Schedule Section - Compact */}
                  <div className="space-y-2 pt-2 border-t border-border">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Date *
                      </Label>
                      <DatePicker
                        selected={formData.scheduledDateTime ? new Date(formData.scheduledDateTime) : null}
                        onChange={(date: Date | null) => {
                          if (date) {
                            // Extract existing time or use default
                            let hour = 9;
                            let minute = 0;
                            let period = 'AM';
                            
                            if (formData.scheduledDateTime) {
                              const existingDate = new Date(formData.scheduledDateTime);
                              const existingHours = existingDate.getHours();
                              hour = existingHours === 0 ? 12 : existingHours > 12 ? existingHours - 12 : existingHours;
                              minute = existingDate.getMinutes();
                              period = existingHours >= 12 ? 'PM' : 'AM';
                            }
                            
                            // Convert to 24-hour format
                            let hours24 = hour;
                            if (period === 'AM' && hour === 12) hours24 = 0;
                            else if (period === 'PM' && hour !== 12) hours24 = hour + 12;
                            
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const day = String(date.getDate()).padStart(2, '0');
                            const formattedDateTime = `${year}-${month}-${day}T${String(hours24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
                            setFormData({ ...formData, scheduledDateTime: formattedDateTime });
                          }
                        }}
                        dateFormat="MMMM d, yyyy"
                        minDate={new Date()}
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500"
                        placeholderText="Select date"
                        wrapperClassName="w-full"
                        data-testid="input-scheduled-date"
                      />
                    </div>

                    {/* Time Selection - Compact */}
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <Clock className="w-3 h-3 text-indigo-600" />
                        Time *
                      </Label>
                      <div className="grid grid-cols-3 gap-2">
                        {/* Hour */}
                        <div>
                          <Select
                            value={(() => {
                              if (!formData.scheduledDateTime) return "9";
                              const date = new Date(formData.scheduledDateTime);
                              const hours = date.getHours();
                              return String(hours === 0 ? 12 : hours > 12 ? hours - 12 : hours);
                            })()}
                            onValueChange={(value) => {
                              const date = formData.scheduledDateTime ? new Date(formData.scheduledDateTime) : new Date();
                              const currentMinute = date.getMinutes();
                              const currentHours = date.getHours();
                              const period = currentHours >= 12 ? 'PM' : 'AM';
                              
                              let hours24 = parseInt(value);
                              if (period === 'AM' && hours24 === 12) hours24 = 0;
                              else if (period === 'PM' && hours24 !== 12) hours24 = hours24 + 12;
                              
                              const year = date.getFullYear();
                              const month = String(date.getMonth() + 1).padStart(2, '0');
                              const day = String(date.getDate()).padStart(2, '0');
                              const formattedDateTime = `${year}-${month}-${day}T${String(hours24).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
                              setFormData({ ...formData, scheduledDateTime: formattedDateTime });
                            }}
                          >
                            <SelectTrigger data-testid="select-hour" className="h-8 text-sm bg-background border-border">
                              <SelectValue placeholder="Hr" />
                            </SelectTrigger>
                            <SelectContent>
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(hour => (
                                <SelectItem key={hour} value={String(hour)}>{String(hour).padStart(2, '0')}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Minute */}
                        <div>
                          <Select
                            value={(() => {
                              if (!formData.scheduledDateTime) return "00";
                              const date = new Date(formData.scheduledDateTime);
                              return String(date.getMinutes()).padStart(2, '0');
                            })()}
                            onValueChange={(value) => {
                              const date = formData.scheduledDateTime ? new Date(formData.scheduledDateTime) : new Date();
                              const currentHours = date.getHours();
                              
                              const year = date.getFullYear();
                              const month = String(date.getMonth() + 1).padStart(2, '0');
                              const day = String(date.getDate()).padStart(2, '0');
                              const formattedDateTime = `${year}-${month}-${day}T${String(currentHours).padStart(2, '0')}:${value}`;
                              setFormData({ ...formData, scheduledDateTime: formattedDateTime });
                            }}
                          >
                            <SelectTrigger data-testid="select-minute" className="h-8 text-sm bg-background border-border">
                              <SelectValue placeholder="Min" />
                            </SelectTrigger>
                            <SelectContent>
                              {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map(min => (
                                <SelectItem key={min} value={min}>{min}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* AM/PM */}
                        <div>
                          <Select
                            value={(() => {
                              if (!formData.scheduledDateTime) return "AM";
                              const date = new Date(formData.scheduledDateTime);
                              return date.getHours() >= 12 ? 'PM' : 'AM';
                            })()}
                            onValueChange={(value) => {
                              const date = formData.scheduledDateTime ? new Date(formData.scheduledDateTime) : new Date();
                              const currentHours = date.getHours();
                              const currentMinute = date.getMinutes();
                              
                              // Get 12-hour format hour
                              const hour12 = currentHours === 0 ? 12 : currentHours > 12 ? currentHours - 12 : currentHours;
                              
                              // Convert to 24-hour based on new AM/PM
                              let hours24 = hour12;
                              if (value === 'AM' && hour12 === 12) hours24 = 0;
                              else if (value === 'PM' && hour12 !== 12) hours24 = hour12 + 12;
                              
                              const year = date.getFullYear();
                              const month = String(date.getMonth() + 1).padStart(2, '0');
                              const day = String(date.getDate()).padStart(2, '0');
                              const formattedDateTime = `${year}-${month}-${day}T${String(hours24).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
                              setFormData({ ...formData, scheduledDateTime: formattedDateTime });
                            }}
                          >
                            <SelectTrigger data-testid="select-period" className="h-8 text-sm bg-background border-border">
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
                  </div>

                  {/* Passenger & Luggage Section - Compact */}
                  <div className="space-y-2 pt-2 border-t border-border">
                    <div className="flex items-center gap-2 pb-1">
                      <div className="w-5 h-5 bg-purple-100 dark:bg-purple-900/30 rounded flex items-center justify-center">
                        <User className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                      </div>
                      <h3 className="text-sm font-bold text-foreground">Passengers</h3>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Pax *</Label>
                        <Input
                          type="number"
                          min="1"
                          value={formData.passengerCount}
                          onChange={(e) => setFormData({ ...formData, passengerCount: parseInt(e.target.value) || 1 })}
                          className="h-8 text-sm"
                          data-testid="input-passenger-count"
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Bags</Label>
                        <Input
                          type="number"
                          min="0"
                          value={formData.luggageCount}
                          onChange={(e) => setFormData({ ...formData, luggageCount: parseInt(e.target.value) || 0 })}
                          className="h-8 text-sm"
                          data-testid="input-luggage-count"
                        />
                      </div>
                      
                      <div className="flex items-center gap-1.5 pt-5">
                        <input
                          id="baby-seat"
                          type="checkbox"
                          checked={formData.babySeat}
                          onChange={(e) => setFormData({ ...formData, babySeat: e.target.checked })}
                          className="w-3.5 h-3.5 rounded border-border"
                        data-testid="checkbox-baby-seat"
                      />
                      <Label htmlFor="baby-seat" className="text-xs">Seat</Label>
                    </div>
                  </div>

                    {/* Book for Another Person */}
                    <div className="flex items-center gap-2 mt-3">
                      <input
                        id="booking-for-toggle"
                        type="checkbox"
                        checked={formData.bookingFor === 'someone_else'}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          bookingFor: e.target.checked ? 'someone_else' : 'self' 
                        })}
                        className="w-4 h-4 rounded border-border"
                        data-testid="checkbox-booking-for"
                      />
                      <Label htmlFor="booking-for-toggle" className="text-sm">Book for another person</Label>
                    </div>
                    
                    {formData.bookingFor === 'someone_else' && (
                      <div className="space-y-2 mt-2 pl-6 border-l-2 border-purple-200 dark:border-purple-800">
                        <Input
                          placeholder="Passenger Name"
                          value={formData.passengerName}
                          onChange={(e) => setFormData({ ...formData, passengerName: e.target.value })}
                          className="h-9"
                          data-testid="input-passenger-name"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="email"
                            placeholder="Email"
                            value={formData.passengerEmail}
                            onChange={(e) => setFormData({ ...formData, passengerEmail: e.target.value })}
                            className="h-9"
                            data-testid="input-passenger-email"
                          />
                          <Input
                            type="tel"
                            placeholder="Phone"
                            value={formData.passengerPhone}
                            onChange={(e) => setFormData({ ...formData, passengerPhone: e.target.value })}
                            className="h-9"
                            data-testid="input-passenger-phone"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Flight Information Section */}
                  <div className="space-y-3 pt-2 border-t border-border">
                    <div className="flex items-center gap-3 pb-2">
                      <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                        <Plane className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      </div>
                      <h3 className="text-base font-semibold text-foreground">Flight Information</h3>
                      <span className="text-xs text-muted-foreground">(Optional)</span>
                    </div>
                  <FlightSearch
                    selectedFlight={selectedFlight as FlightInfo | null}
                    onFlightSelect={(flight) => {
                      setSelectedFlight(flight);
                      if (flight) {
                        setFormData({
                          ...formData,
                          flightNumber: flight.flightNumber,
                          flightAirline: flight.airline,
                          flightDepartureAirport: flight.departureAirport,
                          flightArrivalAirport: flight.arrivalAirport,
                          flightDepartureTerminal: flight.departureTerminal || '',
                          flightArrivalTerminal: flight.arrivalTerminal || '',
                          flightBaggageClaim: flight.baggageClaim || '',
                        });
                        setFlightSearchInput(flight.flightNumber);
                      } else {
                        setFormData({
                          ...formData,
                          flightNumber: '',
                          flightAirline: '',
                          flightDepartureAirport: '',
                          flightArrivalAirport: '',
                          flightDepartureTerminal: '',
                          flightArrivalTerminal: '',
                          flightBaggageClaim: '',
                        });
                        setFlightSearchInput('');
                      }
                    }}
                    bookingDate={formData.scheduledDateTime ? formData.scheduledDateTime.split('T')[0] : undefined}
                  />
                  </div>

                  {/* Journey Log Timeline */}
                  {editingBooking && (
                    <div className="space-y-3 pt-2 border-t border-border">
                      <div className="flex items-center gap-3 pb-2">
                        <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                          <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <h3 className="text-base font-semibold text-foreground">Journey Log</h3>
                      </div>
                      <div className="space-y-2 text-xs pl-2 border-l-2 border-amber-200 dark:border-amber-800">
                      {/* Booked By */}
                      {editingBooking.bookedBy && (
                        <div>
                          <span className="font-semibold">Booked By {editingBooking.bookedBy === 'admin' ? 'Admin' : editingBooking.bookedBy === 'passenger' ? 'Passenger' : editingBooking.bookedBy}</span>
                        </div>
                      )}

                      {/* Booked At */}
                      {editingBooking.bookedAt && (
                        <div>
                          <span className="font-semibold">Booked At </span>
                          <span>{new Date(editingBooking.bookedAt).toLocaleString('en-US', {
                            month: '2-digit',
                            day: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}</span>
                        </div>
                      )}

                      {/* Booking Confirmed */}
                      {editingBooking.confirmedAt && (
                        <div>
                          <span className="font-semibold">Booking Confirmed </span>
                          <span>{new Date(editingBooking.confirmedAt).toLocaleString('en-US', {
                            month: '2-digit',
                            day: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}</span>
                        </div>
                      )}

                      {/* Job Assigned */}
                      {editingBooking.assignedAt && (
                        <div>
                          <span className="font-semibold">Job Assigned </span>
                          <span>{new Date(editingBooking.assignedAt).toLocaleString('en-US', {
                            month: '2-digit',
                            day: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}</span>
                        </div>
                      )}

                      {/* Job Accepted */}
                      {editingBooking.acceptedAt && (
                        <div>
                          <span className="font-semibold">Job Accepted </span>
                          <span>{new Date(editingBooking.acceptedAt).toLocaleString('en-US', {
                            month: '2-digit',
                            day: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}</span>
                          {editingBooking.acceptedLocation && typeof editingBooking.acceptedLocation === 'object' && (
                            <span className="text-blue-600 ml-1">
                              ({editingBooking.acceptedLocation.lat}, {editingBooking.acceptedLocation.lng})
                            </span>
                          )}
                        </div>
                      )}

                      {/* Job Decline History - shown only when job is pending reassignment (not accepted) */}
                      {(editingBooking.declineReason || editingBooking.declineNotes) && 
                       editingBooking.driverAcceptanceStatus !== 'accepted' && 
                       !editingBooking.acceptedAt && (
                        <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-lg p-3 space-y-2">
                          <div className="flex items-center text-amber-700 dark:text-amber-400">
                            <AlertCircle className="w-4 h-4 mr-2" />
                            <span className="font-semibold">Previous Driver Declined</span>
                          </div>
                          {editingBooking.declinedAt && (
                            <div className="text-sm text-amber-600 dark:text-amber-400">
                              <span className="font-medium">When: </span>
                              {new Date(editingBooking.declinedAt).toLocaleString('en-US', {
                                month: '2-digit',
                                day: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                              })}
                            </div>
                          )}
                          {editingBooking.declineReason && (
                            <div className="text-sm">
                              <span className="font-medium text-amber-600 dark:text-amber-400">Reason: </span>
                              <span className="text-amber-700 dark:text-amber-300 capitalize">
                                {editingBooking.declineReason.replace(/_/g, ' ')}
                              </span>
                            </div>
                          )}
                          {editingBooking.declineNotes && (
                            <div className="text-sm">
                              <span className="font-medium text-amber-600 dark:text-amber-400">Decline History: </span>
                              <div className="mt-1 space-y-2">
                                {(() => {
                                  try {
                                    const history = JSON.parse(editingBooking.declineNotes);
                                    if (Array.isArray(history)) {
                                      return history.map((entry: any, index: number) => (
                                        <div key={index} className="bg-amber-100 dark:bg-amber-900/50 p-2 rounded text-xs">
                                          <div className="font-medium text-amber-800 dark:text-amber-200">
                                            {entry.driverName || 'Driver'}
                                          </div>
                                          <div className="text-amber-700 dark:text-amber-300">
                                            {entry.reasonDisplay || entry.reason?.replace(/_/g, ' ') || 'No reason'}
                                          </div>
                                          {entry.notes && (
                                            <div className="text-amber-600 dark:text-amber-400 italic mt-1">
                                              "{entry.notes}"
                                            </div>
                                          )}
                                          {entry.declinedAt && (
                                            <div className="text-amber-500 dark:text-amber-500 mt-1">
                                              {new Date(entry.declinedAt).toLocaleString()}
                                            </div>
                                          )}
                                        </div>
                                      ));
                                    }
                                    return <span className="text-amber-700 dark:text-amber-300">{editingBooking.declineNotes}</span>;
                                  } catch {
                                    return <span className="text-amber-700 dark:text-amber-300">{editingBooking.declineNotes}</span>;
                                  }
                                })()}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Driver Acceptance Pending */}
                      {editingBooking.driverAcceptanceStatus === 'pending' && editingBooking.driverId && (
                        <div className="text-amber-600 dark:text-amber-400 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-2" />
                          <span className="font-semibold">Awaiting Driver Acceptance</span>
                        </div>
                      )}

                      {/* Start At */}
                      {editingBooking.startedAt && (
                        <div>
                          <span className="font-semibold">Start At </span>
                          <span>{new Date(editingBooking.startedAt).toLocaleString('en-US', {
                            month: '2-digit',
                            day: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}</span>
                          {editingBooking.startedLocation && typeof editingBooking.startedLocation === 'object' && (
                            <span className="text-blue-600 ml-1">
                              ({editingBooking.startedLocation.lat}, {editingBooking.startedLocation.lng})
                            </span>
                          )}
                        </div>
                      )}

                      {/* DOD - Driver On Destination */}
                      {editingBooking.dodAt && (
                        <div>
                          <span className="font-semibold">DOD </span>
                          <span>{new Date(editingBooking.dodAt).toLocaleString('en-US', {
                            month: '2-digit',
                            day: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}</span>
                          {editingBooking.dodLocation && typeof editingBooking.dodLocation === 'object' && (
                            <span className="text-blue-600 ml-1">
                              ({editingBooking.dodLocation.lat}, {editingBooking.dodLocation.lng})
                            </span>
                          )}
                        </div>
                      )}

                      {/* No Show */}
                      {editingBooking.noShow && (
                        <div className="text-red-600 dark:text-red-400 font-semibold">
                          No Show-up
                        </div>
                      )}

                      {/* POB - Passenger On Board */}
                      {editingBooking.pobAt && (
                        <div>
                          <span className="font-semibold">POB </span>
                          <span>{new Date(editingBooking.pobAt).toLocaleString('en-US', {
                            month: '2-digit',
                            day: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}</span>
                          {editingBooking.pobLocation && typeof editingBooking.pobLocation === 'object' && (
                            <span className="text-blue-600 ml-1">
                              ({editingBooking.pobLocation.lat}, {editingBooking.pobLocation.lng})
                            </span>
                          )}
                        </div>
                      )}

                      {/* Trip Ended */}
                      {editingBooking.endedAt && (
                        <div>
                          <span className="font-semibold">Trip Ended </span>
                          <span>{new Date(editingBooking.endedAt).toLocaleString('en-US', {
                            month: '2-digit',
                            day: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}</span>
                          {editingBooking.endedLocation && typeof editingBooking.endedLocation === 'object' && (
                            <span className="text-blue-600 ml-1">
                              ({editingBooking.endedLocation.lat}, {editingBooking.endedLocation.lng})
                            </span>
                          )}
                        </div>
                      )}

                      {/* Payment */}
                      {editingBooking.paymentAt && (
                        <div>
                          <span className="font-semibold">Payment </span>
                          <span>{new Date(editingBooking.paymentAt).toLocaleString('en-US', {
                            month: '2-digit',
                            day: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}</span>
                        </div>
                      )}

                      {/* Cancelled */}
                      {editingBooking.status === 'cancelled' && (
                        <div className="text-red-600 dark:text-red-400 font-semibold">
                          Cancelled
                        </div>
                      )}

                      {/* Cancel Reason */}
                      {editingBooking.cancelReason && (
                        <div>
                          <span className="font-semibold">Cancel Reason </span>
                          <span>{editingBooking.cancelReason || '-'}</span>
                        </div>
                      )}

                      {/* Refund Invoice */}
                      {editingBooking.refundInvoiceSent && (
                        <div className="text-green-600 font-semibold">
                          Refund Invoice Sent
                        </div>
                      )}

                      {/* Mark Completed */}
                      {editingBooking.markedCompletedAt && (
                        <div>
                          <span className="font-semibold">Mark Completed </span>
                          <span>{new Date(editingBooking.markedCompletedAt).toLocaleString('en-US', {
                            month: '2-digit',
                            day: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}</span>
                        </div>
                      )}

                      {/* Admin Actions */}
                      <div className="mt-4 pt-4 border-t space-y-2">
                        <p className="font-semibold text-sm mb-2">Admin Actions:</p>
                        
                        <Button
                          type="button"
                          variant={editingBooking.noShow ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            if (onToggleNoShow && editingBooking) {
                              onToggleNoShow(editingBooking.id, !editingBooking.noShow);
                            }
                          }}
                          className={`w-full ${editingBooking.noShow ? 'bg-red-600 hover:bg-red-700' : ''}`}
                          data-testid="button-toggle-no-show"
                        >
                          {editingBooking.noShow ? 'Clear No-Show' : 'Mark No-Show'}
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (onSendRefundInvoice && editingBooking) {
                              onSendRefundInvoice(editingBooking.id);
                            }
                          }}
                          disabled={editingBooking.refundInvoiceSent}
                          className="w-full"
                          data-testid="button-send-refund-invoice"
                        >
                          {editingBooking.refundInvoiceSent ? 'Refund Invoice Sent' : 'Send Refund Invoice'}
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (onMarkCompleted && editingBooking) {
                              onMarkCompleted(editingBooking.id);
                            }
                          }}
                          disabled={!!editingBooking.markedCompletedAt}
                          className="w-full"
                          data-testid="button-mark-completed"
                        >
                          {editingBooking.markedCompletedAt ? 'Already Marked Completed' : 'Mark Completed'}
                        </Button>
                      </div>
                      </div>
                    </div>
                  )}

                  {/* Special Instructions & Bill Reference Section */}
                  <div className="space-y-3 pt-2 border-t border-border">
                    <div className="flex items-center gap-3 pb-2">
                      <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                        <FileText className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                      </div>
                      <h3 className="text-base font-semibold text-foreground">Additional Info</h3>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Special Instructions</Label>
                        <Textarea
                          value={formData.specialInstructions}
                          onChange={(e) => setFormData({ ...formData, specialInstructions: e.target.value })}
                          placeholder="Any special requests or notes..."
                          className="min-h-[60px] resize-none"
                          data-testid="textarea-special-instructions"
                        />
                      </div>
                      
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Bill Reference</Label>
                        <Input
                          value={formData.billReference}
                          onChange={(e) => setFormData({ ...formData, billReference: e.target.value })}
                          placeholder="PO#, Job#, etc."
                          className="h-9"
                          maxLength={100}
                          data-testid="input-bill-reference"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </div>

          {/* RIGHT PANEL - Dispatch & Invoice (Desktop always visible, Mobile only on pricing tab) */}
          <div className={`lg:block lg:overflow-y-auto p-4 sm:p-6 bg-background ${
            activeTab === 'pricing' ? 'block' : 'hidden'
          }`}>
            

            {/* Invoice Section - Clean Professional Design */}
            <div className="space-y-5 pb-32 lg:pb-6">
              {/* Invoice Header */}
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">Invoice</h3>
                </div>
                {editingBooking && (
                  <Badge variant={editingBooking.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                    {editingBooking.status === 'pending' ? 'UNPAID' : 
                     editingBooking.status === 'completed' ? 'PAID' : 'IN PROGRESS'}
                  </Badge>
                )}
              </div>

              {/* Invoice Number */}
              {editingBooking && (
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Invoice Number</Label>
                  <p className="text-lg font-mono font-bold text-foreground">#{editingBooking.id.substring(0, 8).toUpperCase()}</p>
                </div>
              )}

              {/* Payment Method Section */}
              <div className="space-y-3 pt-2 border-t border-border">
                <div className="flex items-center gap-3 pb-2">
                  <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">Payment Method</h3>
                </div>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(value: 'pay_now' | 'pay_later' | 'cash') => setFormData({ ...formData, paymentMethod: value })}
                >
                  <SelectTrigger className="h-10 bg-background border-border" data-testid="select-payment-method">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pay_now">
                      <span className="font-medium">Pay with Card Now</span>
                    </SelectItem>
                    <SelectItem value="pay_later">
                      <span className="font-medium">Pay Later with Card</span>
                    </SelectItem>
                    <SelectItem value="cash">
                      <span className="font-medium">Pay with Cash</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Account Credits Section - Show when passenger is selected */}
              {formData.passengerId && (
                <div className="space-y-3 pt-2 border-t border-border" data-testid="admin-use-credits-section">
                  <div className="flex items-center gap-3 pb-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${hasPassengerCredits ? 'bg-green-100 dark:bg-green-900/30' : 'bg-muted'}`}>
                      <DollarSign className={`w-4 h-4 ${hasPassengerCredits ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`} />
                    </div>
                    <h3 className="text-base font-semibold text-foreground">Account Credits</h3>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${hasPassengerCredits ? 'text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30' : 'text-muted-foreground bg-muted'}`}>
                      ${passengerCreditsBalance.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="admin-use-credits"
                      checked={useCredits}
                      onChange={(e) => handleUseCreditsToggle(e.target.checked)}
                      disabled={!hasPassengerCredits}
                      className={`w-4 h-4 rounded ${hasPassengerCredits ? 'text-green-600 border-green-300' : 'text-muted-foreground border-border cursor-not-allowed'}`}
                      data-testid="checkbox-admin-use-credits"
                    />
                    <label htmlFor="admin-use-credits" className={`text-sm cursor-pointer ${hasPassengerCredits ? 'text-foreground' : 'text-muted-foreground'}`}>
                      Use Passenger's Account Credits
                    </label>
                  </div>
                  
                  {!hasPassengerCredits && (
                    <p className="text-xs text-muted-foreground">
                      This passenger doesn't have any account credits available.
                    </p>
                  )}
                  
                  {useCredits && hasPassengerCredits && (
                    <div className="space-y-2 pl-7">
                      <Label className="text-xs text-muted-foreground">
                        Amount to use (max ${maxUsableCredits.toFixed(2)}):
                      </Label>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-600" />
                          <Input
                            type="number"
                            id="admin-credit-amount"
                            value={creditAmount}
                            onChange={(e) => handleCreditAmountChange(e.target.value)}
                            onBlur={() => {
                              const numValue = parseFloat(creditAmount);
                              if (!isNaN(numValue)) {
                                setCreditAmount(Math.min(numValue, maxUsableCredits).toFixed(2));
                              }
                            }}
                            min="0"
                            max={maxUsableCredits}
                            step="0.01"
                            className="h-9 pl-9 bg-background border-border"
                            data-testid="input-admin-credit-amount"
                          />
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => setCreditAmount(maxUsableCredits.toFixed(2))}
                          className="h-9 bg-green-600 hover:bg-green-700 text-white text-xs"
                          data-testid="button-admin-use-max-credits"
                        >
                          Use Max
                        </Button>
                      </div>
                      {creditsApplied > 0 && (
                        <div className="bg-background rounded-lg border border-border p-2 space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Credits to Apply:</span>
                            <span className="font-semibold text-green-600">-${creditsApplied.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground font-medium">Remaining to Pay:</span>
                            <span className="font-bold text-foreground">${remainingAmount.toFixed(2)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Journey Fare Section */}
              <div className="space-y-3 pt-2 border-t border-border">
                <div className="flex items-center gap-3 pb-2">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">Journey Fare</h3>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.totalAmount}
                      onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                      placeholder="0.00"
                      className="h-10 pl-9 bg-background border-border"
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
                    className="h-10 bg-blue-600 hover:bg-blue-700 text-white"
                    data-testid="button-calculate-price"
                  >
                    {isCalculatingPrice ? 'Calculating...' : 'Calculate'}
                  </Button>
                </div>
                {calculatedPrice && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                    <span>Calculated: ${calculatedPrice} (editable)</span>
                  </div>
                )}
              </div>

              {/* Admin Discount Section (Admin/Dispatcher only) */}
              {canManageCharges && (
                <div className="space-y-3 pt-2 border-t border-border">
                  <div className="flex items-center gap-3 pb-2">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground">Admin Discount</h3>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Fixed discount amount (subtracts from total)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-600" />
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.adminDiscount}
                        onChange={(e) => setFormData({ ...formData, adminDiscount: e.target.value })}
                        placeholder="0.00"
                        className="h-10 pl-9 bg-background border-border"
                        data-testid="input-admin-discount"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Custom Price Items Section (Admin/Dispatcher only) */}
              {canManageCharges && (
                <div className="space-y-3 pt-2 border-t border-border">
                  <div className="flex items-center gap-3 pb-2">
                    <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                      <Plus className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground">Custom Price Items</h3>
                  </div>
                  
                  {/* Display existing custom items */}
                  {formData.customPriceItems && formData.customPriceItems.length > 0 && (
                    <div className="space-y-2">
                      {formData.customPriceItems.map((item, index) => (
                        <div key={index} className="flex justify-between items-center text-sm p-2 bg-background rounded-lg border border-border">
                          <span className="text-muted-foreground">{item.description}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-purple-600">+${item.amount.toFixed(2)}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newItems = formData.customPriceItems.filter((_, i) => i !== index);
                                setFormData({ ...formData, customPriceItems: newItems });
                              }}
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                              data-testid={`button-remove-custom-item-${index}`}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Add Custom Item Button/Form */}
                  {!showCustomItemForm ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCustomItemForm(true)}
                      className="w-full h-9 border-border text-muted-foreground hover:bg-muted"
                      data-testid="button-show-custom-item-form"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Custom Item
                    </Button>
                  ) : (
                    <div className="space-y-3 p-3 bg-background rounded-lg border border-border">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wide">Description</Label>
                        <Input
                          type="text"
                          value={customItemDescription}
                          onChange={(e) => setCustomItemDescription(e.target.value)}
                          placeholder="e.g., Special service, Premium upgrade, etc."
                          className="h-9 bg-background border-border"
                          data-testid="input-custom-item-description"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wide">Amount (adds to total)</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-600" />
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={customItemAmount}
                            onChange={(e) => setCustomItemAmount(e.target.value)}
                            placeholder="0.00"
                            className="h-9 pl-9 bg-background border-border"
                            data-testid="input-custom-item-amount"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowCustomItemForm(false);
                            setCustomItemDescription('');
                            setCustomItemAmount('');
                          }}
                          className="flex-1 h-9 border-border"
                          data-testid="button-cancel-custom-item"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            if (customItemDescription && customItemAmount && parseFloat(customItemAmount) > 0) {
                              const newItem = {
                                description: customItemDescription,
                                amount: parseFloat(customItemAmount),
                                addedBy: user?.username || 'admin',
                                addedAt: new Date().toISOString()
                              };
                              setFormData({
                                ...formData,
                                customPriceItems: [...(formData.customPriceItems || []), newItem]
                              });
                              setShowCustomItemForm(false);
                              setCustomItemDescription('');
                              setCustomItemAmount('');
                              toast({
                                title: "Custom item added",
                                description: `Added ${customItemDescription}: $${parseFloat(customItemAmount).toFixed(2)}`
                              });
                            }
                          }}
                          disabled={!customItemDescription || !customItemAmount || parseFloat(customItemAmount) <= 0}
                          className="flex-1 h-9 bg-purple-600 hover:bg-purple-700 text-white"
                          data-testid="button-add-custom-item"
                        >
                          Add Item
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Fare Breakdown Section */}
              {((formData.baseFare && calculatedPrice) || (editingBooking && editingBooking.baseFare)) && (
                <div className="space-y-3 pt-2 border-t border-border">
                  <div className="flex items-center gap-3 pb-2">
                    <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                      <FileText className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground">Fare Breakdown</h3>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    {/* Base Fare */}
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Base Fare:</span>
                      <span className="font-semibold text-foreground">${formData.baseFare || editingBooking?.baseFare}</span>
                    </div>

                    {/* Surge Pricing */}
                    {((formData.surgePricingMultiplier && parseFloat(formData.surgePricingMultiplier) > 1) || 
                      (editingBooking?.surgePricingMultiplier && parseFloat(editingBooking.surgePricingMultiplier) > 1)) && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">
                          Surge ({formData.surgePricingMultiplier || editingBooking?.surgePricingMultiplier}x):
                        </span>
                        <span className="font-semibold text-orange-600">+${formData.surgePricingAmount || editingBooking?.surgePricingAmount}</span>
                      </div>
                    )}

                    {/* Gratuity */}
                    {((formData.gratuityAmount && parseFloat(formData.gratuityAmount) > 0) ||
                      (editingBooking?.gratuityAmount && parseFloat(editingBooking.gratuityAmount) > 0)) && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Gratuity:</span>
                        <span className="font-semibold text-foreground">+${formData.gratuityAmount || editingBooking?.gratuityAmount}</span>
                      </div>
                    )}

                    {/* Airport Fee */}
                    {((formData.airportFeeAmount && parseFloat(formData.airportFeeAmount) > 0) ||
                      (editingBooking?.airportFeeAmount && parseFloat(editingBooking.airportFeeAmount) > 0)) && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Airport Fee:</span>
                        <span className="font-semibold text-foreground">+${formData.airportFeeAmount || editingBooking?.airportFeeAmount}</span>
                      </div>
                    )}

                    {/* Custom Price Items in breakdown */}
                    {formData.customPriceItems && formData.customPriceItems.length > 0 && (
                      <>
                        {formData.customPriceItems.map((item, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <span className="text-muted-foreground">{item.description}:</span>
                            <span className="font-semibold text-purple-600">+${item.amount.toFixed(2)}</span>
                          </div>
                        ))}
                      </>
                    )}

                    {/* Subtotal */}
                    <div className="flex justify-between items-center pt-2 border-t border-border">
                      <span className="font-semibold text-foreground">Subtotal:</span>
                      <span className="font-bold text-foreground">${formData.regularPrice || editingBooking?.regularPrice || formData.totalAmount || editingBooking?.totalAmount}</span>
                    </div>

                    {/* Discount if applicable */}
                    {(parseFloat(formData.discountAmount || editingBooking?.discountAmount || '0') > 0) && (
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-green-600">
                          Discount ({formData.discountPercentage || editingBooking?.discountPercentage}%):
                        </span>
                        <span className="font-bold text-green-600">-${formData.discountAmount || editingBooking?.discountAmount}</span>
                      </div>
                    )}

                    {/* Admin Discount in breakdown */}
                    {parseFloat(formData.adminDiscount || editingBooking?.adminDiscount || '0') > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-green-600">Admin Discount:</span>
                        <span className="font-bold text-green-600">-${formData.adminDiscount || editingBooking?.adminDiscount}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Legacy Discount Breakdown */}
              {editingBooking && !editingBooking.baseFare && (editingBooking.discountPercentage || editingBooking.regularPrice) && parseFloat(editingBooking.discountAmount || '0') > 0 && (
                <div className="space-y-3 pt-2 border-t border-border">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pricing Details</Label>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Regular Price:</span>
                      <span className="font-semibold text-foreground">${editingBooking.regularPrice || editingBooking.totalAmount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-green-600">
                        Discount ({editingBooking.discountPercentage}%):
                      </span>
                      <span className="font-bold text-green-600">-${editingBooking.discountAmount}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Additional Charges Section */}
              {editingBooking && editingBooking.surcharges && (editingBooking.surcharges as any[]).length > 0 && (
                <div className="space-y-3 pt-2 border-t border-border">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Additional Charges</Label>
                  <div className="space-y-2">
                    {((editingBooking.surcharges as any[]) || []).map((charge: any, index: number) => (
                      <div key={index} className="flex justify-between items-center text-sm p-2 bg-background rounded-lg border border-border">
                        <span className="text-muted-foreground">{charge.description}</span>
                        <span className="font-semibold text-foreground">+${charge.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Additional Charge (Admin/Dispatcher only) */}
              {editingBooking && canManageCharges && (
                <div className="pt-2 border-t border-border">
                  {!showAdditionalChargeForm ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAdditionalChargeForm(true)}
                      className="w-full h-9 border-border text-muted-foreground hover:bg-muted"
                      data-testid="button-show-additional-charge-form"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Additional Charge
                    </Button>
                  ) : (
                    <div className="space-y-3 p-3 bg-background rounded-lg border border-border">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Add Additional Charge</Label>
                      <div className="space-y-2">
                        <Input
                          type="text"
                          value={chargeDescription}
                          onChange={(e) => setChargeDescription(e.target.value)}
                          placeholder="e.g., Airport fee, Wait time, etc."
                          className="h-9 bg-background border-border"
                          data-testid="input-charge-description"
                        />
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={chargeAmount}
                            onChange={(e) => setChargeAmount(e.target.value)}
                            placeholder="0.00"
                            className="h-9 pl-9 bg-background border-border"
                            data-testid="input-charge-amount"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowAdditionalChargeForm(false);
                            setChargeDescription('');
                            setChargeAmount('');
                          }}
                          className="flex-1 h-9 border-border"
                          data-testid="button-cancel-charge"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleAddCharge}
                          disabled={addChargeMutation.isPending}
                          className="flex-1 h-9 bg-blue-600 hover:bg-blue-700 text-white"
                          data-testid="button-add-charge"
                        >
                          {addChargeMutation.isPending ? 'Adding...' : 'Add Charge'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Total Fare Section */}
              <div className="space-y-3 pt-3 border-t-2 border-border">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-foreground">Total Fare</span>
                  <span className="text-2xl font-bold text-primary">
                    ${(() => {
                      const baseAmount = parseFloat(formData.totalAmount) || 0;
                      const customItemsTotal = (formData.customPriceItems || []).reduce((sum, item) => sum + item.amount, 0);
                      const adminDiscountAmount = parseFloat(formData.adminDiscount) || 0;
                      const finalTotal = Math.max(0, baseAmount + customItemsTotal - adminDiscountAmount);
                      return finalTotal.toFixed(2);
                    })()}
                  </span>
                </div>
                {/* Show breakdown if there are adjustments */}
                {((formData.customPriceItems && formData.customPriceItems.length > 0) || parseFloat(formData.adminDiscount) > 0) && (
                  <div className="space-y-1 text-xs text-muted-foreground">
                    {parseFloat(formData.totalAmount) > 0 && (
                      <div className="flex justify-between">
                        <span>Base fare:</span>
                        <span>${formData.totalAmount}</span>
                      </div>
                    )}
                    {formData.customPriceItems && formData.customPriceItems.length > 0 && (
                      <div className="flex justify-between text-purple-600">
                        <span>+ Custom items:</span>
                        <span>+${(formData.customPriceItems || []).reduce((sum, item) => sum + item.amount, 0).toFixed(2)}</span>
                      </div>
                    )}
                    {parseFloat(formData.adminDiscount) > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>- Admin discount:</span>
                        <span>-${formData.adminDiscount}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <Button
                onClick={onSave}
                disabled={isSaving}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-base"
                data-testid="button-submit-driver"
              >
                {isSaving ? 'Submitting...' : (editingBooking ? 'Update the booking' : 'CREATE BOOKING')}
              </Button>

              {/* Payment Actions (Admin/Dispatcher only) */}
              {editingBooking && canManageCharges && (
                <div className="space-y-2 pt-2 border-t border-border">
                  <Button 
                    onClick={handleAuthorizePayment}
                    disabled={authorizePaymentMutation.isPending}
                    className="w-full h-10 bg-red-600 hover:bg-red-700 text-white font-semibold"
                    data-testid="button-authorize-payment"
                  >
                    {authorizePaymentMutation.isPending ? 'Processing...' : 'Authorize & Capture Payment'}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full h-10 border-border text-muted-foreground hover:bg-muted"
                    data-testid="button-send-proforma"
                  >
                    Send Proforma Invoice
                  </Button>
                </div>
              )}
            </div>
          </div>

          </div>
        </div>

        {/* Mobile Sticky Footer with Navigation and Save */}
        <div className="lg:hidden sticky bottom-0 left-0 right-0 bg-background border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] p-3 safe-area-inset-bottom">
          <div className="flex items-center gap-2">
            {/* Navigation buttons */}
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const tabs: ('passenger' | 'journey' | 'schedule' | 'pricing')[] = ['passenger', 'journey', 'schedule', 'pricing'];
                  const currentIndex = tabs.indexOf(activeTab);
                  if (currentIndex > 0) {
                    setActiveTab(tabs[currentIndex - 1]);
                  }
                }}
                disabled={activeTab === 'passenger'}
                className="px-3"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const tabs: ('passenger' | 'journey' | 'schedule' | 'pricing')[] = ['passenger', 'journey', 'schedule', 'pricing'];
                  const currentIndex = tabs.indexOf(activeTab);
                  if (currentIndex < tabs.length - 1) {
                    setActiveTab(tabs[currentIndex + 1]);
                  }
                }}
                disabled={activeTab === 'pricing'}
                className="px-3"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Save Button */}
            <Button
              onClick={onSave}
              disabled={isSaving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3"
            >
              {isSaving ? 'Saving...' : (editingBooking ? 'Update Booking' : 'Create Booking')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
