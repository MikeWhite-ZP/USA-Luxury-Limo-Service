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
import { useBranding } from "@/hooks/useBranding";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
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
  ChevronRight,
  CalendarDays,
  Users,
  CreditCard,
  AlertTriangle,
  Check
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { RouteLayer } from './RouteLayer';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import FlightSearch, { FlightInfo } from "./FlightSearch";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

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
  
  const [isChangingDriver, setIsChangingDriver] = useState(false);
  const [tempSelectedDriverId, setTempSelectedDriverId] = useState('');
  const [tempDriverPayment, setTempDriverPayment] = useState('');
  
  const [activeTab, setActiveTab] = useState<'trip' | 'passenger' | 'pricing'>('trip');
  const TAB_LABELS = {
    trip: 'Trip Details',
    passenger: 'Passenger Info',
    pricing: 'Pricing'
  };
  
  const [showAdditionalChargeForm, setShowAdditionalChargeForm] = useState(false);
  const [chargeDescription, setChargeDescription] = useState('');
  const [chargeAmount, setChargeAmount] = useState('');
  const [showMarkPaidDialog, setShowMarkPaidDialog] = useState(false);
  
  const [showCustomItemForm, setShowCustomItemForm] = useState(false);
  const [customItemDescription, setCustomItemDescription] = useState('');
  const [customItemAmount, setCustomItemAmount] = useState('');
  
  const [useCredits, setUseCredits] = useState(false);
  const [creditAmount, setCreditAmount] = useState('0.00');
  
  const { user } = useAuth();
  const { toast } = useToast();
  const { companyName: brandCompanyName } = useBranding();
  const canManageCharges = user?.role === 'admin' || user?.role === 'dispatcher';
  
  const selectedVehicleType = vehicleTypes?.find((vt: any) => vt.id === formData.vehicleTypeId);
  const maxLuggageCapacity = selectedVehicleType?.luggageCapacity ? parseInt(selectedVehicleType.luggageCapacity) : 99;
  const isAtMaxLuggage = formData.luggageCount >= maxLuggageCapacity;
  const companyName = brandCompanyName || 'our company';
  
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
  
  const parsedTotalAmount = parseFloat(formData.totalAmount || '0');
  const safeTotalAmount = isNaN(parsedTotalAmount) ? 0 : parsedTotalAmount;
  const maxUsableCredits = safeTotalAmount > 0 ? Math.min(passengerCreditsBalance, safeTotalAmount) : 0;
  const parsedCreditAmount = parseFloat(creditAmount) || 0;
  const creditsApplied = useCredits && maxUsableCredits > 0 ? Math.min(parsedCreditAmount, maxUsableCredits) : 0;
  const remainingAmount = safeTotalAmount - creditsApplied;
  
  useEffect(() => {
    setUseCredits(false);
    setCreditAmount('0.00');
  }, [formData.passengerId]);
  
  useEffect(() => {
    if (useCredits && maxUsableCredits > 0) {
      setCreditAmount(maxUsableCredits.toFixed(2));
    }
  }, [maxUsableCredits, useCredits]);
  
  const handleUseCreditsToggle = (checked: boolean) => {
    setUseCredits(checked);
    if (checked && maxUsableCredits > 0) {
      setCreditAmount(maxUsableCredits.toFixed(2));
    } else {
      setCreditAmount('0.00');
    }
  };
  
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
  
  useEffect(() => {
    if (useCredits && creditsApplied > 0) {
      setFormData(prev => ({ ...prev, creditAmountApplied: creditsApplied.toFixed(2) }));
    } else {
      setFormData(prev => ({ ...prev, creditAmountApplied: undefined }));
    }
  }, [useCredits, creditsApplied, setFormData]);
  
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
  
  const handleAuthorizePayment = () => {
    if (!editingBooking) return;
    authorizePaymentMutation.mutate(editingBooking.id);
  };
  
  // Mark booking as paid mutation (for cash payments)
  const markBookingPaidMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const response = await apiRequest('POST', `/api/admin/bookings/${bookingId}/mark-paid`);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Payment Confirmed",
        description: "The booking has been successfully marked as paid",
      });
      setShowMarkPaidDialog(false);
      // Invalidate all relevant booking and invoice queries
      queryClient.invalidateQueries({ queryKey: ['/api/admin/bookings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dispatcher/bookings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      // Invalidate specific booking detail if the query exists
      if (editingBooking?.id) {
        queryClient.invalidateQueries({ queryKey: [`/api/bookings/${editingBooking.id}`] });
        queryClient.invalidateQueries({ queryKey: ['/api/bookings', editingBooking.id] });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to mark booking as paid",
        variant: "destructive",
      });
      setShowMarkPaidDialog(false);
    },
  });

  const handleMarkBookingPaid = () => {
    if (!editingBooking) return;
    setShowMarkPaidDialog(true);
  };

  const confirmMarkBookingPaid = () => {
    if (!editingBooking) return;
    markBookingPaidMutation.mutate(editingBooking.id);
  };
  
  const getMapConfig = () => {
    const { pickupCoords, destinationCoords, viaPoints = [] } = formData;
    
    const allPoints: Array<[number, number]> = [];
    if (pickupCoords) allPoints.push([pickupCoords.lat, pickupCoords.lon]);
    viaPoints.forEach(via => allPoints.push([via.lat, via.lon]));
    if (destinationCoords) allPoints.push([destinationCoords.lat, destinationCoords.lon]);
    
    if (allPoints.length >= 2) {
      const avgLat = allPoints.reduce((sum, p) => sum + p[0], 0) / allPoints.length;
      const avgLon = allPoints.reduce((sum, p) => sum + p[1], 0) / allPoints.length;
      
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
    
    return {
      center: [39.8283, -98.5795] as [number, number],
      zoom: 4,
      showRoute: false,
      routePositions: []
    };
  };

  const mapConfig = getMapConfig();
  
  const calculateDistance = () => {
    if (!formData.pickupCoords || !formData.destinationCoords) return null;
    
    const { lat: lat1, lon: lon1 } = formData.pickupCoords;
    const { lat: lat2, lon: lon2 } = formData.destinationCoords;
    
    const R = 3959;
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

  useEffect(() => {
    if (selectedDriverId && formData.totalAmount && systemCommission) {
      const totalAmount = parseFloat(formData.totalAmount);
      if (!isNaN(totalAmount) && totalAmount > 0) {
        const commissionPct = systemCommission.percentage;
        const calculatedPayment = totalAmount * (1 - commissionPct / 100);
        
        if (!driverPayment || parseFloat(driverPayment) !== calculatedPayment) {
          setDriverPayment(calculatedPayment.toFixed(2));
        }
      }
    }
  }, [selectedDriverId, formData.totalAmount, systemCommission]);

  const addViaPoint = () => {
    setFormData({ 
      ...formData, 
      viaPoints: [...formData.viaPoints, { address: '', lat: 0, lon: 0 }] 
    });
  };

  const removeViaPoint = (index: number) => {
    const newViaPoints = formData.viaPoints.filter((_, i) => i !== index);
    setFormData({ ...formData, viaPoints: newViaPoints });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-[600px] md:max-w-[700px] max-h-[85vh] overflow-hidden p-0 bg-background rounded-lg">
        <VisuallyHidden>
          <DialogTitle>{editingBooking ? 'Edit Booking' : 'New Booking'}</DialogTitle>
          <DialogDescription>Create or edit a booking with passenger, journey, and pricing details</DialogDescription>
        </VisuallyHidden>
        
        <div className="sticky top-0 z-50 bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 flex items-center justify-between shadow-md">
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

        <div className="flex-1 overflow-y-auto">
          <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'trip' | 'passenger' | 'pricing')} className="w-full">
            <div className="sticky top-0 z-40 bg-background border-b px-3 py-2">
              <TabsList className="grid w-full grid-cols-3 h-10">
                <TabsTrigger 
                  value="trip" 
                  className="text-xs sm:text-sm font-semibold data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  <Car className="w-4 h-4 mr-1.5 hidden sm:inline" />
                  Trip Details
                </TabsTrigger>
                <TabsTrigger 
                  value="passenger" 
                  className="text-xs sm:text-sm font-semibold data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  <User className="w-4 h-4 mr-1.5 hidden sm:inline" />
                  Passenger Info
                </TabsTrigger>
                <TabsTrigger 
                  value="pricing" 
                  className="text-xs sm:text-sm font-semibold data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  <DollarSign className="w-4 h-4 mr-1.5 hidden sm:inline" />
                  Pricing
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="trip" className="p-4 space-y-4 pb-24 m-0">
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <User className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-foreground">Passenger</h3>
                </div>
                <div className="relative">
                  <Input
                    placeholder="Search passenger..."
                    value={(() => {
                      if (userSearchQuery && userSearchQuery.trim()) return userSearchQuery;
                      if (formData.passengerId) {
                        const selectedPassenger = allUsers?.find(u => u.id === formData.passengerId);
                        if (selectedPassenger) {
                          return `${selectedPassenger.firstName} ${selectedPassenger.lastName}`;
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
                    className="h-10"
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

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Type</Label>
                  <Select
                    value={formData.bookingType}
                    onValueChange={(value) => setFormData({ ...formData, bookingType: value as 'transfer' | 'hourly' })}
                  >
                    <SelectTrigger data-testid="select-booking-type" className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="transfer">Transfer</SelectItem>
                      <SelectItem value="hourly">Hourly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Vehicle</Label>
                  <Select
                    value={formData.vehicleTypeId}
                    onValueChange={(value) => {
                      const newVehicle = vehicleTypes?.find((vt: any) => vt.id === value);
                      const newMaxLuggage = newVehicle?.luggageCapacity ? parseInt(newVehicle.luggageCapacity) : 99;
                      const adjustedLuggage = formData.luggageCount > newMaxLuggage ? newMaxLuggage : formData.luggageCount;
                      setFormData({ ...formData, vehicleTypeId: value, luggageCount: adjustedLuggage });
                    }}
                  >
                    <SelectTrigger data-testid="select-vehicle-type" className="h-10">
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
                
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pax</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.passengerCount}
                    onChange={(e) => setFormData({ ...formData, passengerCount: parseInt(e.target.value) || 1 })}
                    className="h-10"
                    data-testid="input-passenger-count"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Bags</Label>
                  <Input
                    type="number"
                    min="0"
                    max={maxLuggageCapacity}
                    value={formData.luggageCount}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      const cappedValue = Math.min(value, maxLuggageCapacity);
                      setFormData({ ...formData, luggageCount: cappedValue });
                    }}
                    className="h-10"
                    data-testid="input-luggage-count"
                  />
                </div>
              </div>
              
              {isAtMaxLuggage && selectedVehicleType && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-800 dark:text-amber-200">
                      <p className="font-medium mb-1">Maximum luggage capacity reached ({maxLuggageCapacity} bags)</p>
                      <p className="text-amber-700 dark:text-amber-300">
                        Need more space? Consider selecting a larger vehicle type, or add your special requirements in the{' '}
                        <button 
                          type="button"
                          onClick={() => setActiveTab('passenger')}
                          className="underline font-medium hover:text-amber-900 dark:hover:text-amber-100"
                        >
                          Additional Info
                        </button>
                        {' '}section. You can also{' '}
                        <Link href="/contact" className="underline font-medium hover:text-amber-900 dark:hover:text-amber-100">
                          contact {companyName}
                        </Link>
                        {' '}for assistance.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <MapPin className="w-4 h-4 text-green-600" />
                  <h3 className="text-sm font-bold text-foreground">Pickup</h3>
                </div>
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

              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b">
                  <div className="flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-orange-500" />
                    <h3 className="text-sm font-bold text-foreground">Stops</h3>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addViaPoint}
                    className="h-7 text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add
                  </Button>
                </div>
                {formData.viaPoints.map((via, index) => (
                  <div key={index} className="flex gap-2">
                    <AddressAutocomplete
                      id={`via-point-${index}`}
                      label=""
                      value={via.address}
                      onChange={(value, coords) => {
                        const newViaPoints = [...formData.viaPoints];
                        newViaPoints[index] = { 
                          address: value, 
                          lat: coords?.lat || 0, 
                          lon: coords?.lon || 0 
                        };
                        setFormData({ ...formData, viaPoints: newViaPoints });
                      }}
                      placeholder={`Stop ${index + 1}`}
                      userId={formData.passengerId}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeViaPoint(index)}
                      className="h-10 px-2 text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <MapPin className="w-4 h-4 text-red-600" />
                  <h3 className="text-sm font-bold text-foreground">Destination</h3>
                </div>
                <AddressAutocomplete
                  id="destination-address"
                  label=""
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
              </div>

              {formData.bookingType === 'hourly' && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Duration (Hours)</Label>
                  <Select
                    value={formData.requestedHours}
                    onValueChange={(value) => setFormData({ ...formData, requestedHours: value })}
                  >
                    <SelectTrigger className="h-10" data-testid="select-requested-hours">
                      <SelectValue placeholder="Select hours" />
                    </SelectTrigger>
                    <SelectContent>
                      {[2, 3, 4, 5, 6, 8, 10, 12, 24].map(h => (
                        <SelectItem key={h} value={String(h)}>{h} hours</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <CalendarDays className="w-4 h-4 text-purple-600" />
                  <h3 className="text-sm font-bold text-foreground">Schedule</h3>
                </div>
                <div className="flex items-center gap-2">
                  <DatePicker
                    selected={formData.scheduledDateTime ? new Date(formData.scheduledDateTime) : null}
                    onChange={(date: Date | null) => {
                      if (date) {
                        let hour = 9, minute = 0, period = 'AM';
                        if (formData.scheduledDateTime) {
                          const existingDate = new Date(formData.scheduledDateTime);
                          const existingHours = existingDate.getHours();
                          hour = existingHours === 0 ? 12 : existingHours > 12 ? existingHours - 12 : existingHours;
                          minute = existingDate.getMinutes();
                          period = existingHours >= 12 ? 'PM' : 'AM';
                        }
                        let hours24 = hour;
                        if (period === 'AM' && hour === 12) hours24 = 0;
                        else if (period === 'PM' && hour !== 12) hours24 = hour + 12;
                        
                        const formattedDateTime = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(hours24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
                        setFormData({ ...formData, scheduledDateTime: formattedDateTime });
                      }
                    }}
                    dateFormat="MMM d, yyyy"
                    minDate={new Date()}
                    className="flex-1 h-10 px-3 text-sm border border-border rounded-md bg-background"
                    placeholderText="Select date"
                    wrapperClassName="flex-1"
                  />
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
                      
                      const formattedDateTime = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(hours24).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
                      setFormData({ ...formData, scheduledDateTime: formattedDateTime });
                    }}
                  >
                    <SelectTrigger className="w-16 h-10">
                      <SelectValue placeholder="Hr" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(hour => (
                        <SelectItem key={hour} value={String(hour)}>{String(hour).padStart(2, '0')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={(() => {
                      if (!formData.scheduledDateTime) return "00";
                      const date = new Date(formData.scheduledDateTime);
                      return String(date.getMinutes()).padStart(2, '0');
                    })()}
                    onValueChange={(value) => {
                      const date = formData.scheduledDateTime ? new Date(formData.scheduledDateTime) : new Date();
                      const currentHours = date.getHours();
                      
                      const formattedDateTime = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(currentHours).padStart(2, '0')}:${value}`;
                      setFormData({ ...formData, scheduledDateTime: formattedDateTime });
                    }}
                  >
                    <SelectTrigger className="w-16 h-10">
                      <SelectValue placeholder="Min" />
                    </SelectTrigger>
                    <SelectContent>
                      {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map(min => (
                        <SelectItem key={min} value={min}>{min}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      
                      const hour12 = currentHours === 0 ? 12 : currentHours > 12 ? currentHours - 12 : currentHours;
                      
                      let hours24 = hour12;
                      if (value === 'AM' && hour12 === 12) hours24 = 0;
                      else if (value === 'PM' && hour12 !== 12) hours24 = hour12 + 12;
                      
                      const formattedDateTime = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(hours24).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
                      setFormData({ ...formData, scheduledDateTime: formattedDateTime });
                    }}
                  >
                    <SelectTrigger className="w-16 h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AM">AM</SelectItem>
                      <SelectItem value="PM">PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="passenger" className="p-4 space-y-4 pb-24 m-0">
              <div className="flex items-center gap-4 pb-3 border-b">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.babySeat}
                    onChange={(e) => setFormData({ ...formData, babySeat: e.target.checked })}
                    className="w-4 h-4 rounded border-border"
                    data-testid="checkbox-baby-seat"
                  />
                  <span className="text-sm font-medium flex items-center gap-1">
                    <Baby className="w-4 h-4 text-pink-500" />
                    Baby Seat
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.bookingFor === 'someone_else'}
                    onChange={(e) => setFormData({ ...formData, bookingFor: e.target.checked ? 'someone_else' : 'self' })}
                    className="w-4 h-4 rounded border-border"
                    data-testid="checkbox-booking-for"
                  />
                  <span className="text-sm font-medium text-blue-600">Book for other</span>
                </label>
              </div>

              {formData.bookingFor === 'someone_else' && (
                <div className="space-y-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Passenger Name</Label>
                    <Input
                      value={formData.passengerName}
                      onChange={(e) => setFormData({ ...formData, passengerName: e.target.value })}
                      placeholder="Full name"
                      className="h-10 bg-background"
                      data-testid="input-passenger-name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Email</Label>
                      <Input
                        type="email"
                        value={formData.passengerEmail}
                        onChange={(e) => setFormData({ ...formData, passengerEmail: e.target.value })}
                        placeholder="email@example.com"
                        className="h-10 bg-background"
                        data-testid="input-passenger-email"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Phone</Label>
                      <Input
                        type="tel"
                        value={formData.passengerPhone}
                        onChange={(e) => setFormData({ ...formData, passengerPhone: e.target.value })}
                        placeholder="+1 (555) 000-0000"
                        className="h-10 bg-background"
                        data-testid="input-passenger-phone"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Plane className="w-4 h-4 text-sky-500" />
                  <h3 className="text-sm font-bold text-foreground">Flight (Optional)</h3>
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

              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <FileText className="w-4 h-4 text-orange-500" />
                  <h3 className="text-sm font-bold text-foreground">Additional Info</h3>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Special Instructions</Label>
                  <Textarea
                    value={formData.specialInstructions}
                    onChange={(e) => setFormData({ ...formData, specialInstructions: e.target.value })}
                    placeholder="Any special requests or notes..."
                    className="min-h-[80px] resize-none"
                    data-testid="textarea-special-instructions"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Bill Reference</Label>
                  <Input
                    value={formData.billReference}
                    onChange={(e) => setFormData({ ...formData, billReference: e.target.value })}
                    placeholder="PO#, Job#, etc."
                    className="h-10"
                    maxLength={100}
                    data-testid="input-bill-reference"
                  />
                </div>
              </div>

              {editingBooking && (
                <div className="space-y-3 pt-2 border-t border-border">
                  <div className="flex items-center gap-3 pb-2">
                    <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                      <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground">Journey Log</h3>
                  </div>
                  <div className="space-y-2 text-xs pl-2 border-l-2 border-amber-200 dark:border-amber-800">
                    {editingBooking.bookedBy && (
                      <div>
                        <span className="font-semibold">Booked By {editingBooking.bookedBy === 'admin' ? 'Admin' : editingBooking.bookedBy === 'passenger' ? 'Passenger' : editingBooking.bookedBy}</span>
                      </div>
                    )}
                    {editingBooking.bookedAt && (
                      <div>
                        <span className="font-semibold">Booked At </span>
                        <span>{new Date(editingBooking.bookedAt).toLocaleString('en-US', {
                          month: '2-digit', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
                        })}</span>
                      </div>
                    )}
                    {editingBooking.confirmedAt && (
                      <div>
                        <span className="font-semibold">Booking Confirmed </span>
                        <span>{new Date(editingBooking.confirmedAt).toLocaleString('en-US', {
                          month: '2-digit', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
                        })}</span>
                      </div>
                    )}
                    {editingBooking.assignedAt && (
                      <div>
                        <span className="font-semibold">Job Assigned </span>
                        <span>{new Date(editingBooking.assignedAt).toLocaleString('en-US', {
                          month: '2-digit', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
                        })}</span>
                      </div>
                    )}
                    {editingBooking.startedAt && (
                      <div>
                        <span className="font-semibold">Start At </span>
                        <span>{new Date(editingBooking.startedAt).toLocaleString('en-US', {
                          month: '2-digit', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
                        })}</span>
                      </div>
                    )}
                    {editingBooking.endedAt && (
                      <div>
                        <span className="font-semibold">Trip Ended </span>
                        <span>{new Date(editingBooking.endedAt).toLocaleString('en-US', {
                          month: '2-digit', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
                        })}</span>
                      </div>
                    )}
                    {editingBooking.status === 'cancelled' && (
                      <div className="text-red-600 dark:text-red-400 font-semibold">Cancelled</div>
                    )}
                  </div>

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
              )}
            </TabsContent>

            <TabsContent value="pricing" className="p-4 space-y-4 pb-32 m-0">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-bold text-foreground">Invoice</h3>
                  </div>
                  {editingBooking && (
                    <Badge variant={editingBooking.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                      {editingBooking.status === 'pending' ? 'UNPAID' : 
                       editingBooking.status === 'completed' ? 'PAID' : 'IN PROGRESS'}
                    </Badge>
                  )}
                </div>
                {editingBooking && (
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Invoice Number</Label>
                    <p className="text-lg font-mono font-bold text-foreground">#{editingBooking.id.substring(0, 8).toUpperCase()}</p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <CreditCard className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-foreground">Payment Method</h3>
                </div>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(value: 'pay_now' | 'pay_later' | 'cash') => setFormData({ ...formData, paymentMethod: value })}
                >
                  <SelectTrigger className="h-10" data-testid="select-payment-method">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pay_now">Pay with Card Now</SelectItem>
                    <SelectItem value="pay_later">Pay Later with Card</SelectItem>
                    <SelectItem value="cash">Pay with Cash</SelectItem>
                  </SelectContent>
                </Select>

                {hasPassengerCredits && (
                  <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-green-700 dark:text-green-300">
                        Use Ride Credits (${passengerCreditsBalance.toFixed(2)} available)
                      </span>
                      <input
                        type="checkbox"
                        checked={useCredits}
                        onChange={(e) => handleUseCreditsToggle(e.target.checked)}
                        className="w-4 h-4 rounded border-green-300"
                      />
                    </div>
                    {useCredits && (
                      <div className="mt-2">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max={maxUsableCredits}
                          value={creditAmount}
                          onChange={(e) => handleCreditAmountChange(e.target.value)}
                          className="h-9 bg-background"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <h3 className="text-sm font-bold text-foreground">Journey Fare</h3>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.totalAmount}
                      onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                      className="h-10 pl-9 text-lg font-bold"
                      placeholder="0.00"
                      data-testid="input-total-amount"
                    />
                  </div>
                  <Button
                    onClick={onCalculatePrice}
                    disabled={isCalculatingPrice}
                    className="h-10 bg-blue-600 hover:bg-blue-700 text-white"
                    data-testid="button-calculate-price"
                  >
                    {isCalculatingPrice ? 'Calculating...' : 'Calculate'}
                  </Button>
                </div>
                {calculatedPrice && (
                  <div className="p-2 bg-green-50 dark:bg-green-950 rounded border border-green-200 dark:border-green-800">
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Calculated: <span className="font-bold">${calculatedPrice}</span>
                    </p>
                  </div>
                )}
              </div>

              {canManageCharges && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <h3 className="text-sm font-bold text-foreground">Admin Discount</h3>
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
                        className="h-10 pl-9"
                        data-testid="input-admin-discount"
                      />
                    </div>
                  </div>
                </div>
              )}

              {canManageCharges && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <Plus className="w-4 h-4 text-purple-600" />
                    <h3 className="text-sm font-bold text-foreground">Custom Price Items</h3>
                  </div>
                  
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
                          placeholder="e.g., Special service, Premium upgrade"
                          className="h-9"
                          data-testid="input-custom-item-description"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wide">Amount</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-600" />
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={customItemAmount}
                            onChange={(e) => setCustomItemAmount(e.target.value)}
                            placeholder="0.00"
                            className="h-9 pl-9"
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
                          className="flex-1 h-9"
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

              <Button
                onClick={onSave}
                disabled={isSaving}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-base"
                data-testid="button-submit-driver"
              >
                {isSaving ? 'Submitting...' : (editingBooking ? 'UPDATE BOOKING' : 'CREATE BOOKING')}
              </Button>

              {editingBooking && canManageCharges && (
                <div className="space-y-2 pt-2 border-t border-border">
                  {/* Payment Button - shows different states based on payment method and status */}
                  {editingBooking.paymentStatus === 'paid' ? (
                    // Already Paid - show non-clickable green PAID button
                    <Button 
                      disabled
                      className="w-full h-10 bg-emerald-600 text-black font-semibold cursor-not-allowed"
                      data-testid="button-paid-status"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      PAID
                    </Button>
                  ) : editingBooking.paymentMethod === 'cash' ? (
                    // Cash payment - show Mark as Paid button
                    <Button 
                      onClick={handleMarkBookingPaid}
                      disabled={markBookingPaidMutation.isPending}
                      className="w-full h-10 bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                      data-testid="button-mark-as-paid"
                    >
                      {markBookingPaidMutation.isPending ? 'Processing...' : 'Mark as Paid'}
                    </Button>
                  ) : (
                    // Card payment - show Authorize & Capture button
                    <Button 
                      onClick={handleAuthorizePayment}
                      disabled={authorizePaymentMutation.isPending}
                      className="w-full h-10 bg-red-600 hover:bg-red-700 text-white font-semibold"
                      data-testid="button-authorize-payment"
                    >
                      {authorizePaymentMutation.isPending ? 'Processing...' : 'Authorize & Capture Payment'}
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    className="w-full h-10 border-border text-muted-foreground hover:bg-muted"
                    data-testid="button-send-proforma"
                  >
                    Send Proforma Invoice
                  </Button>
                </div>
              )}

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
                          placeholder="e.g., Airport fee, Wait time"
                          className="h-9"
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
                            className="h-9 pl-9"
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
                          className="flex-1 h-9"
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
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>

      {/* Mark as Paid Confirmation Dialog */}
      <AlertDialog open={showMarkPaidDialog} onOpenChange={setShowMarkPaidDialog}>
        <AlertDialogContent className="sm:max-w-[500px] bg-background">
          <AlertDialogHeader className="border-b border-amber-200 pb-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-2 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div>
                <AlertDialogTitle className="text-xl font-bold text-foreground">Mark Booking as Paid</AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground mt-0.5">
                  This action cannot be reversed
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          {editingBooking && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-900">
                    <p className="font-semibold mb-1">Are you sure you want to mark this booking as paid?</p>
                    <p className="text-amber-800">
                      Once marked as paid, this action <strong>cannot be reverted</strong>. 
                      The payment status will be permanently set to "Paid".
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-muted rounded-lg border border-border">
                <div className="space-y-2 text-sm">
                  <p className="text-foreground"><strong className="font-semibold">Booking ID:</strong> #{editingBooking.id?.toUpperCase().substring(0, 8)}</p>
                  <p className="text-foreground"><strong className="font-semibold">Amount:</strong> ${parseFloat(editingBooking.totalAmount || '0').toFixed(2)}</p>
                  <p className="text-foreground"><strong className="font-semibold">Payment Method:</strong> Cash</p>
                </div>
              </div>
            </div>
          )}
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel 
              onClick={() => setShowMarkPaidDialog(false)}
              data-testid="button-cancel-mark-paid"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmMarkBookingPaid}
              disabled={markBookingPaidMutation.isPending}
              className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white"
              data-testid="button-confirm-mark-paid"
            >
              {markBookingPaidMutation.isPending ? "Processing..." : "Yes, Mark as Paid"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
