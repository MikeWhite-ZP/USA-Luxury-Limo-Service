import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TrendingUp, Users, Car, Star, Settings, MessageSquare, DollarSign, ArrowRight, Key, Edit2, Trash2, Plus, Check, X, Pencil, FileText, Plane, Search } from "lucide-react";
import { AdminNav } from "@/components/AdminNav";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";

interface DashboardStats {
  totalRevenue: string;
  totalCommission: string;
  activeBookings: number;
  totalDrivers: number;
  activeDrivers: number;
  averageRating: string;
  pendingBookings: number;
  pendingDrivers: number;
  revenueGrowth: string;
  ratingImprovement: string;
}

interface ContactSubmission {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  serviceType?: string;
  message: string;
  status: 'new' | 'contacted' | 'resolved';
  createdAt: string;
}

interface PaymentSystem {
  id: string;
  provider: 'stripe' | 'paypal' | 'square';
  isActive: boolean;
  publicKey: string | null;
  secretKey: string | null;
  webhookSecret: string | null;
  config: any;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: 'passenger' | 'driver' | 'dispatcher' | 'admin';
  isActive: boolean;
  payLaterEnabled: boolean;
  discountType?: 'percentage' | 'fixed' | null;
  discountValue?: string | null;
  createdAt: string;
}

interface DriverDocument {
  id: string;
  driverId: string;
  documentType: 'driver_license' | 'limo_license' | 'profile_photo';
  documentUrl: string;
  expirationDate: string | null;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason: string | null;
  whatsappNumber: string | null;
  uploadedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  driverInfo?: {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

function AdminEmailSettings({ user }: { user: any }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [adminEmail, setAdminEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch current admin email setting
  const { data: emailSetting } = useQuery({
    queryKey: ['/api/system-settings', 'ADMIN_EMAIL'],
    enabled: !!user && user.role === 'admin',
  });

  useEffect(() => {
    if (emailSetting && typeof emailSetting === 'object' && 'value' in emailSetting) {
      setAdminEmail((emailSetting as any).value || '');
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, [emailSetting]);

  const updateEmailMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest('PUT', '/api/system-settings/ADMIN_EMAIL', { value: email });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to update admin email' }));
        throw new Error(error.message || 'Failed to update admin email');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Email updated",
        description: "System admin email has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/system-settings', 'ADMIN_EMAIL'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update admin email. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleUpdate = () => {
    if (!adminEmail || !adminEmail.includes('@')) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }
    updateEmailMutation.mutate(adminEmail);
  };

  return (
    <Card id="settings-section" data-testid="email-settings">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="w-5 h-5" />
          <span>Email Settings</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Configure the system-wide admin email address. Contact form submissions will be sent to this email address.
            </p>

            <div className="max-w-md space-y-3">
              <div>
                <Label htmlFor="admin-email">Admin Email Address</Label>
                <Input
                  id="admin-email"
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@example.com"
                  data-testid="input-admin-email"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Current value: {emailSetting && typeof emailSetting === 'object' && 'value' in emailSetting ? (emailSetting as any).value : 'Not set'}
                </p>
              </div>

              <Button
                onClick={handleUpdate}
                disabled={updateEmailMutation.isPending}
                data-testid="button-update-email"
              >
                {updateEmailMutation.isPending ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Update Email
                  </>
                )}
              </Button>
            </div>

            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h4 className="font-semibold text-sm mb-2">Usage:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• This email receives all contact form submissions from passengers</li>
                <li>• Make sure the email address is monitored regularly</li>
                <li>• You can update this email at any time</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const { user, isLoading, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  
  const [settings, setSettings] = useState({
    STRIPE_SECRET_KEY: '',
    STRIPE_PUBLIC_KEY: '',
    TOMTOM_API_KEY: ''
  });

  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [loadingValue, setLoadingValue] = useState(false);
  const [visibleCredentialsSection, setVisibleCredentialsSection] = useState<'api' | 'payment' | null>(null);
  const [visibleSettingsSection, setVisibleSettingsSection] = useState<'commission' | 'email' | null>(null);
  const [showBookings, setShowBookings] = useState(false);
  const [selectedUserType, setSelectedUserType] = useState<'all' | 'passenger' | 'driver' | 'dispatcher' | 'admin'>('all');
  const [showUserManager, setShowUserManager] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [commissionPercentage, setCommissionPercentage] = useState<string>('');
  
  // User dialog state
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userFormData, setUserFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'passenger' as 'passenger' | 'driver' | 'dispatcher' | 'admin',
    isActive: true,
    payLaterEnabled: false,
    discountType: null as 'percentage' | 'fixed' | null,
    discountValue: '0',
  });

  // Payment configuration dialog state
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<'stripe' | 'paypal' | 'square' | null>(null);
  const [paymentCredentials, setPaymentCredentials] = useState({
    publicKey: '',
    secretKey: '',
    webhookSecret: '',
    clientId: '', // For PayPal
    clientSecret: '', // For PayPal
    applicationId: '', // For Square
    accessToken: '', // For Square
    locationId: '', // For Square
  });

  // Driver documents dialog state
  const [documentsDialogOpen, setDocumentsDialogOpen] = useState(false);
  const [selectedDriverForDocs, setSelectedDriverForDocs] = useState<User | null>(null);
  const [uploadingForDriver, setUploadingForDriver] = useState(false);
  const [uploadFormData, setUploadFormData] = useState({
    file: null as File | null,
    documentType: 'driver_license' as 'driver_license' | 'limo_license' | 'profile_photo',
    expirationDate: '',
    whatsappNumber: '',
  });

  // Bookings management state
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all');
  const [bookingDateFrom, setBookingDateFrom] = useState('');
  const [bookingDateTo, setBookingDateTo] = useState('');
  const [bookingSearch, setBookingSearch] = useState('');
  const [assignDriverDialogOpen, setAssignDriverDialogOpen] = useState(false);
  const [assigningBookingId, setAssigningBookingId] = useState<string | null>(null);
  const [selectedDriverForAssignment, setSelectedDriverForAssignment] = useState('');
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<any | null>(null);
  const [bookingFormData, setBookingFormData] = useState({
    passengerId: '',
    pickupAddress: '',
    destinationAddress: '',
    scheduledDateTime: '',
    totalAmount: '',
    vehicleTypeId: '',
    bookingType: 'transfer' as 'transfer' | 'hourly',
    status: 'pending' as 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled',
    pickupCoords: null as { lat: number; lon: number } | null,
    destinationCoords: null as { lat: number; lon: number } | null,
    requestedHours: '2',
    // Additional information fields
    bookingFor: 'self' as 'self' | 'someone_else',
    passengerName: '',
    passengerPhone: '',
    passengerEmail: '',
    passengerCount: 1,
    luggageCount: 0,
    babySeat: false,
    specialInstructions: '',
    // Flight information
    flightNumber: '',
    flightAirline: '',
    flightDepartureAirport: '',
    flightArrivalAirport: '',
  });
  const [calculatedPrice, setCalculatedPrice] = useState<string>('');
  const [calculatingPrice, setCalculatingPrice] = useState(false);
  
  // Flight search state
  const [flightSearchInput, setFlightSearchInput] = useState('');
  const [selectedFlight, setSelectedFlight] = useState<any>(null);
  const [isSearchingFlight, setIsSearchingFlight] = useState(false);

  // Redirect to home if not authenticated or not admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'admin')) {
      toast({
        title: "Unauthorized",
        description: "Admin access required. Redirecting to login...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, user, isLoading, toast]);

  // Fetch existing system settings
  const { data: settingsData } = useQuery<{
    credentials: Array<{
      key: string;
      hasValue: boolean;
      usesEnv: boolean;
      canDelete: boolean;
      updatedAt?: string;
    }>;
  }>({
    queryKey: ['/api/admin/settings'],
    retry: false,
    enabled: isAuthenticated && user?.role === 'admin',
  });

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/admin/dashboard'],
    retry: false,
    enabled: isAuthenticated && user?.role === 'admin',
  });

  // Fetch contact submissions
  const { data: contacts, isLoading: contactsLoading } = useQuery<ContactSubmission[]>({
    queryKey: ['/api/admin/contacts'],
    retry: false,
    enabled: isAuthenticated && user?.role === 'admin',
  });

  // Fetch all bookings
  const { data: bookings, isLoading: bookingsLoading } = useQuery<any[]>({
    queryKey: ['/api/admin/bookings'],
    retry: false,
    enabled: isAuthenticated && user?.role === 'admin',
  });

  // Fetch active drivers for assignment
  const { data: activeDrivers } = useQuery<any[]>({
    queryKey: ['/api/admin/active-drivers'],
    retry: false,
    enabled: isAuthenticated && user?.role === 'admin',
  });

  // Fetch vehicle types for booking dialog
  const { data: vehicleTypes } = useQuery<any[]>({
    queryKey: ['/api/vehicle-types'],
    retry: false,
    enabled: isAuthenticated && user?.role === 'admin',
  });

  // Fetch payment systems
  const { data: paymentSystems = [], isLoading: paymentSystemsLoading } = useQuery<PaymentSystem[]>({
    queryKey: ['/api/payment-systems'],
    retry: false,
    enabled: isAuthenticated && user?.role === 'admin',
  });

  // Fetch all users
  const { data: allUsers = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    retry: false,
    enabled: isAuthenticated && user?.role === 'admin',
  });

  // Fetch all driver documents
  const { data: allDriverDocuments = [], isLoading: documentsLoading } = useQuery<DriverDocument[]>({
    queryKey: ['/api/admin/driver-documents'],
    enabled: !!user && user.role === 'admin' && documentsDialogOpen,
  });

  // Fetch system commission
  const { data: systemCommission, isLoading: commissionLoading } = useQuery<{
    percentage: number;
    description: string;
  }>({
    queryKey: ['/api/admin/system-commission'],
    retry: false,
    enabled: isAuthenticated && user?.role === 'admin',
  });

  // Update system commission when data is loaded
  useEffect(() => {
    if (systemCommission) {
      setCommissionPercentage(systemCommission.percentage.toString());
    }
  }, [systemCommission]);

  // Update single credential mutation
  const updateCredentialMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const response = await apiRequest('POST', '/api/admin/settings', { settings: { [key]: value } });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
      setEditingKey(null);
      setNewKeyValue('');
      setIsAddingNew(false);
      setNewKeyName('');
      toast({
        title: "Credential Updated",
        description: "Credential has been saved successfully.",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      } else {
        toast({
          title: "Error",
          description: "Failed to update credential.",
          variant: "destructive",
        });
      }
    },
  });

  // Delete credential mutation
  const deleteCredentialMutation = useMutation({
    mutationFn: async (key: string) => {
      const response = await apiRequest('DELETE', `/api/admin/settings/${key}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
      toast({
        title: "Credential Deleted",
        description: "Credential has been removed successfully.",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  // Update contact status mutation
  const updateContactMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest('PATCH', `/api/admin/contacts/${id}`, { status });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/contacts'] });
      toast({
        title: "Status Updated",
        description: "Contact status has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update contact status",
        variant: "destructive",
      });
    },
  });

  // Update booking status mutation
  const updateBookingStatusMutation = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string; status: string }) => {
      const response = await apiRequest('PATCH', `/api/admin/bookings/${bookingId}/status`, { status });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update booking status');
      }
      const text = await response.text();
      return text ? JSON.parse(text) : {};
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/bookings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/dashboard'] });
      toast({
        title: "Booking Updated",
        description: "Booking status has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update booking status",
        variant: "destructive",
      });
    },
  });

  // Assign driver mutation
  const assignDriverMutation = useMutation({
    mutationFn: async ({ bookingId, driverId }: { bookingId: string; driverId: string }) => {
      const response = await apiRequest('PATCH', `/api/admin/bookings/${bookingId}/assign-driver`, { driverId });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to assign driver');
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/bookings'] });
      setAssignDriverDialogOpen(false);
      setAssigningBookingId(null);
      setSelectedDriverForAssignment('');
      toast({
        title: "Driver Assigned",
        description: "Driver has been successfully assigned to the booking.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign driver",
        variant: "destructive",
      });
    },
  });

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Calculate price based on booking details
  const handleCalculatePrice = async () => {
    if (!bookingFormData.vehicleTypeId) {
      toast({
        title: "Missing Information",
        description: "Please select a vehicle type first",
        variant: "destructive",
      });
      return;
    }

    try {
      setCalculatingPrice(true);
      
      const vehicleTypeName = vehicleTypes?.find(v => v.id === bookingFormData.vehicleTypeId)?.name || '';
      const vehicleSlug = vehicleTypeName.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_').replace(/[^a-z0-9_]/g, '');
      
      let requestData: any = {
        vehicleType: vehicleSlug,
        serviceType: bookingFormData.bookingType,
        userId: bookingFormData.passengerId || undefined,
      };

      if (bookingFormData.scheduledDateTime) {
        const dateTime = new Date(bookingFormData.scheduledDateTime);
        requestData.date = dateTime.toISOString().split('T')[0];
        requestData.time = dateTime.toTimeString().split(' ')[0].substring(0, 5);
      }

      if (bookingFormData.bookingType === 'transfer') {
        if (!bookingFormData.pickupCoords || !bookingFormData.destinationCoords) {
          toast({
            title: "Missing Coordinates",
            description: "Please select addresses from the autocomplete to get coordinates",
            variant: "destructive",
          });
          return;
        }

        const distance = calculateDistance(
          bookingFormData.pickupCoords.lat,
          bookingFormData.pickupCoords.lon,
          bookingFormData.destinationCoords.lat,
          bookingFormData.destinationCoords.lon
        );
        requestData.distance = distance.toFixed(2);
      } else {
        requestData.hours = parseInt(bookingFormData.requestedHours);
      }

      const response = await apiRequest('POST', '/api/calculate-price', requestData);
      const data = await response.json();

      if (data.price) {
        setCalculatedPrice(data.price);
        setBookingFormData({ ...bookingFormData, totalAmount: data.price });
        toast({
          title: "Price Calculated",
          description: `Total: $${data.price}`,
        });
      }
    } catch (error) {
      console.error('Price calculation error:', error);
      toast({
        title: "Calculation Failed",
        description: "Unable to calculate price. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCalculatingPrice(false);
    }
  };

  // Flight search handler
  const handleFlightSearch = async () => {
    console.log('🔍 FLIGHT SEARCH STARTED');
    console.log('Flight Search Input:', flightSearchInput);
    console.log('Current Booking Form Data:', bookingFormData);
    console.log('Editing Booking:', editingBooking);
    console.log('Selected Flight State:', selectedFlight);
    
    if (!flightSearchInput.trim()) {
      console.warn('⚠️ Flight search aborted: No flight number entered');
      toast({
        title: "Flight Number Required",
        description: "Please enter a flight number (e.g., KL30, UA2346, DL3427)",
        variant: "destructive",
      });
      return;
    }

    setIsSearchingFlight(true);
    
    try {
      const flightNumber = flightSearchInput.trim().toUpperCase();
      console.log('📝 Processed Flight Number:', flightNumber);
      
      const queryParams = new URLSearchParams({ flightNumber });
      if (bookingFormData.scheduledDateTime) {
        const dateOnly = bookingFormData.scheduledDateTime.split('T')[0];
        queryParams.append('date', dateOnly);
        console.log('📅 Search Date:', dateOnly);
      }
      
      const apiUrl = `/api/flights/search?${queryParams.toString()}`;
      console.log('🌐 API Request URL:', apiUrl);
      
      const response = await fetch(apiUrl);
      console.log('📡 API Response Status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ API Error Response:', errorData);
        throw new Error(errorData.error || 'Flight search failed');
      }

      const data = await response.json();
      console.log('📦 Raw API Response Data:', data);
      
      let flightItems = Array.isArray(data) ? data : (data.items || []);
      console.log('✈️ Flight Items Array:', flightItems);
      console.log('Number of flights found:', flightItems.length);
      
      if (flightItems.length === 0) {
        console.warn('⚠️ No flights found for:', flightNumber);
        toast({
          title: "No Flights Found",
          description: `No flights found for ${flightNumber}`,
          variant: "destructive",
        });
        return;
      }

      const airlineNames: Record<string, string> = {
        'AA': 'American Airlines', 'UA': 'United Airlines', 'DL': 'Delta Air Lines',
        'BA': 'British Airways', 'EK': 'Emirates', 'KL': 'KLM Royal Dutch Airlines',
        'AF': 'Air France', 'LH': 'Lufthansa', 'QR': 'Qatar Airways',
        'SQ': 'Singapore Airlines', 'CX': 'Cathay Pacific', 'JL': 'Japan Airlines',
        'NH': 'All Nippon Airways',
      };

      const flight = flightItems[0];
      console.log('🎯 Selected Flight (first item):', flight);
      
      const flightNum = flight.number || flightNumber;
      const airlineCode = flightNum.trim().split(' ')[0] || flightNum.substring(0, 2);
      const airlineName = airlineNames[airlineCode] || flight.airline?.name || airlineCode;
      console.log('🏢 Airline Code:', airlineCode, '→ Airline Name:', airlineName);
      
      const departure = flight.departure || {};
      const arrival = flight.arrival || {};
      console.log('🛫 Departure Data:', departure);
      console.log('🛬 Arrival Data:', arrival);
      
      const selectedFlightData = {
        flightNumber: flightNum.trim(),
        airline: airlineName,
        departureAirport: departure.airport?.name || departure.airport?.iata || 'N/A',
        arrivalAirport: arrival.airport?.name || arrival.airport?.iata || 'N/A',
        departureTime: departure.scheduledTimeLocal || departure.scheduledTime || 'N/A',
        arrivalTime: arrival.scheduledTimeLocal || arrival.scheduledTime || 'N/A',
        departureTerminal: departure.terminal || 'N/A',
        arrivalTerminal: arrival.terminal || 'N/A',
        baggageClaim: arrival.baggageClaim || 'N/A',
        aircraft: flight.aircraft?.model || 'N/A',
      };
      console.log('📋 Selected Flight Data Object:', selectedFlightData);
      
      console.log('💾 Setting selectedFlight state...');
      setSelectedFlight(selectedFlightData);
      
      // Update form with flight info
      const updatedFormData = {
        ...bookingFormData,
        flightNumber: selectedFlightData.flightNumber,
        flightAirline: selectedFlightData.airline,
        flightDepartureAirport: selectedFlightData.departureAirport,
        flightArrivalAirport: selectedFlightData.arrivalAirport,
      };
      console.log('📝 Updating Booking Form Data with:', updatedFormData);
      setBookingFormData(updatedFormData);
      
      console.log('✅ Flight search completed successfully');
      toast({
        title: "Flight Found",
        description: `${selectedFlightData.airline} ${selectedFlightData.flightNumber}`,
      });
    } catch (error: any) {
      console.error('💥 FLIGHT SEARCH ERROR:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      toast({
        title: "Flight Search Failed",
        description: error.message || "Unable to search for flights. Please try again.",
        variant: "destructive",
      });
    } finally {
      console.log('🏁 Flight search process ended, setting isSearchingFlight to false');
      setIsSearchingFlight(false);
    }
  };

  // Create/Update booking mutation
  const saveBookingMutation = useMutation({
    mutationFn: async (data: any) => {
      const method = editingBooking ? 'PATCH' : 'POST';
      const url = editingBooking ? `/api/admin/bookings/${editingBooking.id}` : '/api/admin/bookings';
      const response = await apiRequest(method, url, data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Failed to ${editingBooking ? 'update' : 'create'} booking`);
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/bookings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/dashboard'] });
      setBookingDialogOpen(false);
      setEditingBooking(null);
      setBookingFormData({
        passengerId: '',
        pickupAddress: '',
        destinationAddress: '',
        scheduledDateTime: '',
        totalAmount: '',
        vehicleTypeId: '',
        bookingType: 'transfer',
        status: 'pending',
        pickupCoords: null,
        destinationCoords: null,
        requestedHours: '2',
        bookingFor: 'self',
        passengerName: '',
        passengerPhone: '',
        passengerEmail: '',
        passengerCount: 1,
        luggageCount: 0,
        babySeat: false,
        specialInstructions: '',
        flightNumber: '',
        flightAirline: '',
        flightDepartureAirport: '',
        flightArrivalAirport: '',
      });
      setCalculatedPrice('');
      setFlightSearchInput('');
      setSelectedFlight(null);
      toast({
        title: editingBooking ? "Booking Updated" : "Booking Created",
        description: `Booking has been ${editingBooking ? 'updated' : 'created'} successfully.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete booking mutation
  const deleteBookingMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const response = await apiRequest('DELETE', `/api/bookings/${bookingId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete booking');
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/bookings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/dashboard'] });
      toast({
        title: "Booking Deleted",
        description: "Booking has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter bookings based on criteria
  const filteredBookings = bookings?.filter((booking) => {
    // Status filter
    if (bookingStatusFilter !== 'all' && booking.status !== bookingStatusFilter) {
      return false;
    }

    // Date range filter
    if (bookingDateFrom) {
      const bookingDate = new Date(booking.scheduledDateTime);
      const fromDate = new Date(bookingDateFrom);
      if (bookingDate < fromDate) return false;
    }

    if (bookingDateTo) {
      const bookingDate = new Date(booking.scheduledDateTime);
      const toDate = new Date(bookingDateTo);
      toDate.setHours(23, 59, 59);
      if (bookingDate > toDate) return false;
    }

    // Search filter
    if (bookingSearch) {
      const searchLower = bookingSearch.toLowerCase();
      const matchesSearch = 
        booking.id?.toLowerCase().includes(searchLower) ||
        booking.passengerName?.toLowerCase().includes(searchLower) ||
        booking.driverName?.toLowerCase().includes(searchLower) ||
        booking.pickupAddress?.toLowerCase().includes(searchLower) ||
        booking.destinationAddress?.toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;
    }

    return true;
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<User> }) => {
      const response = await apiRequest('PUT', `/api/admin/users/${id}`, updates);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "User Updated",
        description: "User account has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    },
  });

  // Payment system mutations
  const updatePaymentSystemMutation = useMutation({
    mutationFn: async ({ provider, updates }: { provider: string; updates: Partial<PaymentSystem> }) => {
      const response = await apiRequest('PUT', `/api/payment-systems/${provider}`, updates);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payment-systems'] });
      setConfigDialogOpen(false);
      setSelectedProvider(null);
      setPaymentCredentials({
        publicKey: '',
        secretKey: '',
        webhookSecret: '',
        clientId: '',
        clientSecret: '',
        applicationId: '',
        accessToken: '',
        locationId: '',
      });
      toast({
        title: "Payment System Updated",
        description: "Payment system configuration has been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update payment system",
        variant: "destructive",
      });
    },
  });

  const setActivePaymentSystemMutation = useMutation({
    mutationFn: async (provider: string) => {
      const response = await apiRequest('PUT', `/api/payment-systems/${provider}/activate`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payment-systems'] });
      toast({
        title: "Active Payment System Changed",
        description: "The active payment system has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to change active payment system",
        variant: "destructive",
      });
    },
  });

  const createPaymentSystemMutation = useMutation({
    mutationFn: async (system: Partial<PaymentSystem>) => {
      const response = await apiRequest('POST', '/api/payment-systems', system);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payment-systems'] });
      setConfigDialogOpen(false);
      setSelectedProvider(null);
      setPaymentCredentials({
        publicKey: '',
        secretKey: '',
        webhookSecret: '',
        clientId: '',
        clientSecret: '',
        applicationId: '',
        accessToken: '',
        locationId: '',
      });
      toast({
        title: "Payment System Created",
        description: "Payment system has been added successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create payment system",
        variant: "destructive",
      });
    },
  });

  // Open configuration dialog for a provider
  const openConfigDialog = (provider: 'stripe' | 'paypal' | 'square') => {
    setSelectedProvider(provider);
    
    // Check if system already exists and prefill form
    const existingSystem = paymentSystems.find(s => s.provider === provider);
    if (existingSystem) {
      // Prefill based on provider type
      if (provider === 'stripe') {
        setPaymentCredentials({
          publicKey: existingSystem.publicKey || '',
          secretKey: '', // Don't prefill secrets
          webhookSecret: '',
          clientId: '',
          clientSecret: '',
          applicationId: '',
          accessToken: '',
          locationId: '',
        });
      } else if (provider === 'paypal') {
        setPaymentCredentials({
          publicKey: '',
          secretKey: '',
          webhookSecret: '',
          clientId: existingSystem.publicKey || '', // clientId stored as publicKey
          clientSecret: '', // Don't prefill secret
          applicationId: '',
          accessToken: '',
          locationId: '',
        });
      } else if (provider === 'square') {
        setPaymentCredentials({
          publicKey: '',
          secretKey: '',
          webhookSecret: '',
          clientId: '',
          clientSecret: '',
          applicationId: existingSystem.publicKey || '', // applicationId stored as publicKey
          accessToken: '', // Don't prefill token
          locationId: existingSystem.config?.locationId || '',
        });
      }
    }
    
    setConfigDialogOpen(true);
  };

  // Handle payment configuration submission
  const handlePaymentConfig = () => {
    if (!selectedProvider) return;

    const existingSystem = paymentSystems.find(s => s.provider === selectedProvider);
    let systemData: Partial<PaymentSystem> = {};

    // Configure based on provider type
    if (selectedProvider === 'stripe') {
      if (!existingSystem && (!paymentCredentials.publicKey || !paymentCredentials.secretKey)) {
        toast({
          title: "Missing Credentials",
          description: "Please provide both Publishable Key and Secret Key for Stripe.",
          variant: "destructive",
        });
        return;
      }
      if (paymentCredentials.publicKey) systemData.publicKey = paymentCredentials.publicKey;
      if (paymentCredentials.secretKey) systemData.secretKey = paymentCredentials.secretKey;
      if (paymentCredentials.webhookSecret) systemData.webhookSecret = paymentCredentials.webhookSecret;
    } else if (selectedProvider === 'paypal') {
      if (!existingSystem && (!paymentCredentials.clientId || !paymentCredentials.clientSecret)) {
        toast({
          title: "Missing Credentials",
          description: "Please provide both Client ID and Client Secret for PayPal.",
          variant: "destructive",
        });
        return;
      }
      if (paymentCredentials.clientId) systemData.publicKey = paymentCredentials.clientId;
      if (paymentCredentials.clientSecret) systemData.secretKey = paymentCredentials.clientSecret;
      if (paymentCredentials.webhookSecret) systemData.webhookSecret = paymentCredentials.webhookSecret;
    } else if (selectedProvider === 'square') {
      if (!existingSystem && (!paymentCredentials.applicationId || !paymentCredentials.accessToken)) {
        toast({
          title: "Missing Credentials",
          description: "Please provide both Application ID and Access Token for Square.",
          variant: "destructive",
        });
        return;
      }
      if (paymentCredentials.applicationId) systemData.publicKey = paymentCredentials.applicationId;
      if (paymentCredentials.accessToken) systemData.secretKey = paymentCredentials.accessToken;
      if (paymentCredentials.locationId) {
        systemData.config = { locationId: paymentCredentials.locationId };
      }
    }

    // Use update if system exists, create if new
    if (existingSystem) {
      updatePaymentSystemMutation.mutate({ 
        provider: selectedProvider, 
        updates: systemData 
      });
    } else {
      createPaymentSystemMutation.mutate({
        provider: selectedProvider,
        isActive: false,
        ...systemData
      });
    }
  };

  const handleUpdateCredential = (key: string) => {
    if (!newKeyValue) {
      toast({
        title: "Missing Value",
        description: "Please provide a value for the credential",
        variant: "destructive",
      });
      return;
    }
    updateCredentialMutation.mutate({ key, value: newKeyValue });
  };

  const handleAddNewCredential = () => {
    if (!newKeyName || !newKeyValue) {
      toast({
        title: "Missing Information",
        description: "Please provide both credential name and value",
        variant: "destructive",
      });
      return;
    }
    updateCredentialMutation.mutate({ key: newKeyName.toUpperCase().replace(/\s+/g, '_'), value: newKeyValue });
  };

  // Booking management functions
  const openAddBookingDialog = () => {
    setEditingBooking(null);
    setBookingFormData({
      passengerId: '',
      pickupAddress: '',
      destinationAddress: '',
      scheduledDateTime: '',
      totalAmount: '',
      vehicleTypeId: '',
      bookingType: 'transfer',
      status: 'pending',
      pickupCoords: null,
      destinationCoords: null,
      requestedHours: '2',
      bookingFor: 'self',
      passengerName: '',
      passengerPhone: '',
      passengerEmail: '',
      passengerCount: 1,
      luggageCount: 0,
      babySeat: false,
      specialInstructions: '',
      flightNumber: '',
      flightAirline: '',
      flightDepartureAirport: '',
      flightArrivalAirport: '',
    });
    setCalculatedPrice('');
    setFlightSearchInput('');
    setSelectedFlight(null);
    setBookingDialogOpen(true);
  };

  const openEditBookingDialog = (booking: any) => {
    console.log('📝 OPENING EDIT BOOKING DIALOG');
    console.log('Booking to edit:', booking);
    
    setEditingBooking(booking);
    const scheduledDate = new Date(booking.scheduledDateTime);
    const formattedDateTime = scheduledDate.toISOString().slice(0, 16);
    setBookingFormData({
      passengerId: booking.passengerId || '',
      pickupAddress: booking.pickupAddress || '',
      destinationAddress: booking.destinationAddress || '',
      scheduledDateTime: formattedDateTime,
      totalAmount: booking.totalAmount?.toString() || '',
      vehicleTypeId: booking.vehicleTypeId || '',
      bookingType: booking.bookingType || 'transfer',
      status: booking.status || 'pending',
      pickupCoords: null,
      destinationCoords: null,
      requestedHours: booking.requestedHours?.toString() || '2',
      bookingFor: booking.bookingFor || 'self',
      passengerName: booking.passengerName || '',
      passengerPhone: booking.passengerPhone || '',
      passengerEmail: booking.passengerEmail || '',
      passengerCount: booking.passengerCount || 1,
      luggageCount: booking.luggageCount || booking.luggage_count || 0,
      babySeat: booking.babySeat || booking.baby_seat || false,
      specialInstructions: booking.specialInstructions || booking.special_instructions || '',
      flightNumber: booking.flightNumber || booking.flight_number || '',
      flightAirline: booking.flightAirline || booking.flight_airline || '',
      flightDepartureAirport: booking.flightDepartureAirport || booking.flight_departure_airport || '',
      flightArrivalAirport: booking.flightArrivalAirport || booking.flight_arrival_airport || '',
    });
    setCalculatedPrice('');
    
    // Restore flight information if available
    // Note: Backend returns snake_case field names from database
    console.log('✈️ CHECKING FOR FLIGHT DATA IN BOOKING');
    const flightNum = booking.flightNumber || booking.flight_number;
    const flightAir = booking.flightAirline || booking.flight_airline;
    const deptAirport = booking.flightDepartureAirport || booking.flight_departure_airport;
    const arrAirport = booking.flightArrivalAirport || booking.flight_arrival_airport;
    
    console.log('Flight Number found:', flightNum);
    console.log('Flight Airline found:', flightAir);
    console.log('Departure Airport found:', deptAirport);
    console.log('Arrival Airport found:', arrAirport);
    
    if (flightNum && flightAir) {
      console.log('✅ Flight data exists, restoring flight information');
      const restoredFlight = {
        flightNumber: flightNum,
        airline: flightAir,
        departureAirport: deptAirport || 'N/A',
        arrivalAirport: arrAirport || 'N/A',
        departureTime: 'N/A',
        arrivalTime: 'N/A',
        departureTerminal: 'N/A',
        arrivalTerminal: 'N/A',
        baggageClaim: 'N/A',
        aircraft: 'N/A',
      };
      console.log('Restored flight object:', restoredFlight);
      setFlightSearchInput(flightNum);
      setSelectedFlight(restoredFlight);
    } else {
      console.log('❌ No flight data found in booking, clearing flight state');
      setFlightSearchInput('');
      setSelectedFlight(null);
    }
    
    console.log('📂 Opening booking dialog...');
    setBookingDialogOpen(true);
  };

  // User management functions
  const openAddUserDialog = () => {
    setEditingUser(null);
    setUserFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: selectedUserType !== 'all' ? selectedUserType : 'passenger',
      isActive: true,
      payLaterEnabled: false,
      discountType: null,
      discountValue: '0',
    });
    setUserDialogOpen(true);
  };

  const openEditUserDialog = (user: User) => {
    setEditingUser(user);
    setUserFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      isActive: user.isActive,
      payLaterEnabled: user.payLaterEnabled,
      discountType: user.discountType as 'percentage' | 'fixed' | null,
      discountValue: user.discountValue || '0',
    });
    setUserDialogOpen(true);
  };

  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof userFormData) => {
      const response = await apiRequest('POST', '/api/admin/users', userData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setUserDialogOpen(false);
      toast({
        title: "User Created",
        description: "The user has been successfully created.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest('DELETE', `/api/admin/users/${userId}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "User Deleted",
        description: "The user has been successfully deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  const backfillDriversMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/admin/backfill-drivers');
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "Driver Records Updated",
        description: data.message || `${data.created} driver records created`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to backfill driver records",
        variant: "destructive",
      });
    },
  });

  const updateDocumentStatusMutation = useMutation({
    mutationFn: async ({ documentId, status, rejectionReason }: { documentId: string; status: string; rejectionReason?: string }) => {
      const response = await apiRequest('PUT', `/api/admin/driver-documents/${documentId}/status`, {
        status,
        rejectionReason,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/driver-documents'] });
      toast({
        title: "Document Updated",
        description: "Document status has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update document status",
        variant: "destructive",
      });
    },
  });

  const adminUploadDocumentMutation = useMutation({
    mutationFn: async ({ userId, file, documentType, expirationDate, whatsappNumber }: {
      userId: string;
      file: File;
      documentType: string;
      expirationDate?: string;
      whatsappNumber?: string;
    }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId);
      formData.append('documentType', documentType);
      if (expirationDate) formData.append('expirationDate', expirationDate);
      if (whatsappNumber) formData.append('whatsappNumber', whatsappNumber);

      const response = await fetch('/api/admin/driver-documents/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/driver-documents'] });
      toast({
        title: "Document Uploaded",
        description: "Document uploaded successfully for the driver.",
      });
      setUploadingForDriver(false);
      setUploadFormData({
        file: null,
        documentType: 'driver_license',
        expirationDate: '',
        whatsappNumber: '',
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update system commission mutation
  const updateCommissionMutation = useMutation({
    mutationFn: async (percentage: string) => {
      const response = await apiRequest('PUT', '/api/admin/system-commission', { 
        percentage: parseFloat(percentage) 
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/system-commission'] });
      toast({
        title: "Commission Updated",
        description: "System commission percentage has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update commission",
        variant: "destructive",
      });
    },
  });

  const handleUpdateCommission = () => {
    const percentage = parseFloat(commissionPercentage);
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      toast({
        title: "Invalid Percentage",
        description: "Please enter a percentage between 0 and 100",
        variant: "destructive",
      });
      return;
    }
    updateCommissionMutation.mutate(commissionPercentage);
  };

  const handleSaveUser = () => {
    if (!userFormData.firstName || !userFormData.email) {
      toast({
        title: "Missing Information",
        description: "Please provide at least first name and email",
        variant: "destructive",
      });
      return;
    }

    if (editingUser) {
      // Update existing user
      updateUserMutation.mutate({ 
        id: editingUser.id, 
        updates: userFormData 
      });
      setUserDialogOpen(false);
    } else {
      // Create new user
      createUserMutation.mutate(userFormData);
    }
  };

  const handleDeleteCredential = (key: string) => {
    if (confirm(`Are you sure you want to delete the ${key} credential?`)) {
      deleteCredentialMutation.mutate(key);
    }
  };

  const handleEditCredential = async (key: string) => {
    setEditingKey(key);
    setLoadingValue(true);
    
    try {
      // Fetch the actual credential value from the database
      const response = await fetch(`/api/admin/settings/${key}/value`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setNewKeyValue(data.value || '');
      } else if (response.status === 404) {
        // Credential not found in DB (env-only), show empty field
        setNewKeyValue('');
        toast({
          title: "Environment Variable",
          description: "This credential is from environment variables. Enter a new value to override it in the database.",
        });
      } else if (response.status === 401 || response.status === 403) {
        // Unauthorized - redirect to login
        setEditingKey(null);
        setNewKeyValue('');
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      } else {
        // Other error
        setNewKeyValue('');
        toast({
          title: "Error",
          description: "Failed to load credential value",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to fetch credential value:', error);
      setNewKeyValue('');
      toast({
        title: "Error",
        description: "Failed to load credential value",
        variant: "destructive",
      });
    } finally {
      setLoadingValue(false);
    }
  };

  // Credential metadata mapping for better UI display (Stripe keys moved to Payment Systems section)
  const credentialMetadata: Record<string, { label: string; description: string; category: string }> = {
    'TOMTOM_API_KEY': { 
      label: 'TomTom API Key',
      description: 'Geocoding and routing services',
      category: 'Maps'
    },
    'RAPIDAPI_KEY': { 
      label: 'RapidAPI Key',
      description: 'AeroDataBox flight search API',
      category: 'External APIs'
    },
  };

  // Build enhanced credentials list from API data
  const credentials = (settingsData?.credentials || []).map(cred => {
    const meta = credentialMetadata[cred.key] || {
      label: cred.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      description: 'Custom API credential',
      category: 'Custom'
    };
    
    return {
      ...cred,
      ...meta,
    };
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNav 
        onCredentialsClick={(section) => {
          setVisibleCredentialsSection(section);
          setVisibleSettingsSection(null);
          setShowUserManager(false);
          setShowBookings(false);
          setTimeout(() => {
            const targetId = section === 'api' ? 'credentials-section' : 'payment-section';
            document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }}
        onUserManagerClick={(type) => {
          setSelectedUserType(type);
          setShowUserManager(true);
          setVisibleCredentialsSection(null);
          setVisibleSettingsSection(null);
          setShowBookings(false);
          setTimeout(() => document.getElementById('user-manager-section')?.scrollIntoView({ behavior: 'smooth' }), 100);
        }}
        onBookingsClick={() => {
          setVisibleCredentialsSection(null);
          setVisibleSettingsSection(null);
          setShowUserManager(false);
          setShowBookings(true);
          setTimeout(() => document.getElementById('bookings-section')?.scrollIntoView({ behavior: 'smooth' }), 100);
        }}
        onSettingsClick={(section) => {
          setVisibleSettingsSection(section);
          setVisibleCredentialsSection(null);
          setShowUserManager(false);
          setShowBookings(false);
          setTimeout(() => {
            document.getElementById('settings-section')?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }}
      />

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card data-testid="stat-revenue">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold" data-testid="total-revenue">
                    ${statsLoading ? '...' : stats?.totalRevenue || '0'}
                  </p>
                  {!statsLoading && stats && parseFloat(stats.revenueGrowth) !== 0 && (
                    <p className={`text-xs ${parseFloat(stats.revenueGrowth) > 0 ? 'text-green-600' : 'text-red-600'}`} data-testid="revenue-growth">
                      {parseFloat(stats.revenueGrowth) > 0 ? '+' : ''}{stats.revenueGrowth}% from last month
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-commission">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Commission</p>
                  <p className="text-2xl font-bold" data-testid="total-commission">
                    ${statsLoading ? '...' : stats?.totalCommission || '0'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-bookings">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Active Bookings</p>
                  <p className="text-2xl font-bold" data-testid="active-bookings">
                    {statsLoading ? '...' : stats?.activeBookings || 0}
                  </p>
                  {!statsLoading && stats && stats.pendingBookings > 0 && (
                    <p className="text-xs text-blue-600" data-testid="pending-bookings">
                      {stats.pendingBookings} pending approval{stats.pendingBookings !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-drivers">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Car className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Drivers</p>
                  <p className="text-2xl font-bold" data-testid="active-drivers">
                    {statsLoading ? '...' : `${stats?.activeDrivers || 0}/${stats?.totalDrivers || 0}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Active/Total
                  </p>
                  {!statsLoading && stats && stats.pendingDrivers > 0 && (
                    <p className="text-xs text-primary" data-testid="pending-drivers">
                      {stats.pendingDrivers} pending verification
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-satisfaction">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Star className="w-8 h-8 text-yellow-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Customer Satisfaction</p>
                  <p className="text-2xl font-bold" data-testid="customer-satisfaction">
                    {statsLoading ? '...' : stats?.averageRating || '0'}/5
                  </p>
                  {!statsLoading && stats && parseFloat(stats.ratingImprovement) !== 0 && (
                    <p className={`text-xs ${parseFloat(stats.ratingImprovement) > 0 ? 'text-green-600' : 'text-red-600'}`} data-testid="rating-improvement">
                      {parseFloat(stats.ratingImprovement) > 0 ? '+' : ''}{stats.ratingImprovement} this month
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* API Credentials Management */}
        {visibleCredentialsSection === 'api' && (
          <Card id="credentials-section" data-testid="credentials-management">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Key className="w-5 h-5" />
                <span>API Credentials</span>
              </CardTitle>
              <Button
                onClick={() => setIsAddingNew(true)}
                variant="outline"
                size="sm"
                data-testid="button-add-credential"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Credential
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Existing Credentials (excluding Stripe - moved to Payment Systems) */}
            <div className="space-y-3">
              {credentials.filter(c => !c.key.includes('STRIPE')).map((credential) => (
                <div
                  key={credential.key}
                  className="border rounded-lg p-4"
                  data-testid={`credential-${credential.key.toLowerCase()}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold" data-testid={`credential-label-${credential.key.toLowerCase()}`}>
                          {credential.label}
                        </h4>
                        <Badge variant="outline" className="text-xs">
                          {credential.category}
                        </Badge>
                        {credential.hasValue && (
                          <Badge 
                            variant={credential.usesEnv ? "secondary" : "default"}
                            className="text-xs"
                            data-testid={`credential-status-${credential.key.toLowerCase()}`}
                          >
                            {credential.usesEnv ? 'ENV' : 'DB'}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {credential.description}
                      </p>
                      
                      {editingKey === credential.key ? (
                        <div className="mt-3 space-y-2">
                          {loadingValue ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
                              Loading current value...
                            </div>
                          ) : (
                            <Input
                              type="text"
                              placeholder="Enter new value"
                              value={newKeyValue}
                              onChange={(e) => setNewKeyValue(e.target.value)}
                              data-testid={`input-edit-${credential.key.toLowerCase()}`}
                            />
                          )}
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleUpdateCredential(credential.key)}
                              disabled={updateCredentialMutation.isPending || loadingValue}
                              data-testid={`button-save-${credential.key.toLowerCase()}`}
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingKey(null);
                                setNewKeyValue('');
                              }}
                              data-testid={`button-cancel-${credential.key.toLowerCase()}`}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2 text-xs text-muted-foreground">
                          {credential.hasValue 
                            ? `Configured ${credential.usesEnv ? '(from environment variable)' : '(from database)'}`
                            : 'Not configured'}
                        </div>
                      )}
                    </div>
                    
                    {editingKey !== credential.key && (
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditCredential(credential.key)}
                          data-testid={`button-edit-${credential.key.toLowerCase()}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        {credential.canDelete && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteCredential(credential.key)}
                            disabled={deleteCredentialMutation.isPending}
                            data-testid={`button-delete-${credential.key.toLowerCase()}`}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add New Credential Form */}
            {isAddingNew && (
              <div className="border border-dashed rounded-lg p-4 space-y-3" data-testid="add-credential-form">
                <h4 className="font-semibold">Add New Credential</h4>
                <div className="space-y-2">
                  <div>
                    <Label htmlFor="new-key-name">Credential Name</Label>
                    <Input
                      id="new-key-name"
                      placeholder="e.g., MAILGUN_API_KEY"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      data-testid="input-new-credential-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-key-value">Credential Value</Label>
                    <Input
                      id="new-key-value"
                      type="password"
                      placeholder="Enter credential value"
                      value={newKeyValue}
                      onChange={(e) => setNewKeyValue(e.target.value)}
                      data-testid="input-new-credential-value"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleAddNewCredential}
                    disabled={updateCredentialMutation.isPending}
                    data-testid="button-save-new-credential"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Add Credential
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsAddingNew(false);
                      setNewKeyName('');
                      setNewKeyValue('');
                    }}
                    data-testid="button-cancel-new-credential"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
          </Card>
        )}

        {/* Payment Systems Configuration */}
        {visibleCredentialsSection === 'payment' && (
          <Card id="payment-section" data-testid="payment-systems">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5" />
              <span>Payment Systems</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {paymentSystemsLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : (
              <div className="space-y-6">
                <p className="text-sm text-muted-foreground">
                  Configure and manage payment providers. Only one provider can be active at a time for system-wide payments.
                </p>

                {/* Payment System Cards */}
                <div className="grid gap-4">
                  {['stripe', 'paypal', 'square'].map((provider) => {
                    const system = paymentSystems.find(s => s.provider === provider);
                    const isActive = system?.isActive || false;
                    const providerLabels: Record<string, string> = {
                      stripe: 'Stripe',
                      paypal: 'PayPal',
                      square: 'Square'
                    };

                    return (
                      <div
                        key={provider}
                        className={`border rounded-lg p-4 ${isActive ? 'border-primary bg-primary/5' : ''}`}
                        data-testid={`payment-system-${provider}`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <h4 className="font-semibold text-lg" data-testid={`payment-provider-${provider}`}>
                              {providerLabels[provider]}
                            </h4>
                            {isActive && (
                              <Badge className="bg-green-600" data-testid={`badge-active-${provider}`}>
                                Active
                              </Badge>
                            )}
                            {system && !isActive && (
                              <Badge variant="outline" data-testid={`badge-configured-${provider}`}>
                                Configured
                              </Badge>
                            )}
                          </div>
                          {!isActive && system && (
                            <Button
                              size="sm"
                              onClick={() => setActivePaymentSystemMutation.mutate(provider)}
                              disabled={setActivePaymentSystemMutation.isPending}
                              data-testid={`button-activate-${provider}`}
                            >
                              Set as Active
                            </Button>
                          )}
                        </div>

                        {system ? (
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Public Key:</span>
                              <span className="font-mono text-xs">
                                {system.publicKey ? '••••••••' : 'Not set'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Secret Key:</span>
                              <span className="font-mono text-xs">
                                {system.secretKey ? '••••••••' : 'Not set'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Webhook Secret:</span>
                              <span className="font-mono text-xs">
                                {system.webhookSecret ? '••••••••' : 'Not set'}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            Not configured. Add credentials to enable this payment provider.
                          </div>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-3"
                          onClick={() => openConfigDialog(provider as 'stripe' | 'paypal' | 'square')}
                          data-testid={`button-configure-${provider}`}
                        >
                          {system ? (
                            <>
                              <Edit2 className="w-4 h-4 mr-1" />
                              Edit Configuration
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4 mr-1" />
                              Configure {providerLabels[provider]}
                            </>
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>

                {/* Help Text */}
                <div className="text-xs text-muted-foreground mt-4 p-3 bg-muted rounded-lg">
                  <strong>Note:</strong> Only one payment system can be active at a time. The active system will be used for all payment processing throughout the application.
                  Set environment variables STRIPE_SECRET_KEY and STRIPE_PUBLIC_KEY for Stripe integration.
                </div>
              </div>
            )}
          </CardContent>
          </Card>
        )}

        {/* System Settings */}
        {visibleSettingsSection === 'commission' && (
          <Card id="settings-section" data-testid="system-settings">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>System Commission Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {commissionLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {systemCommission?.description || 'Configure the commission percentage applied to ride total costs for driver payments when prices are not manually updated during dispatching.'}
                  </p>

                  <div className="max-w-md space-y-3">
                    <div>
                      <Label htmlFor="commission-percentage">Commission Percentage (%)</Label>
                      <Input
                        id="commission-percentage"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={commissionPercentage}
                        onChange={(e) => setCommissionPercentage(e.target.value)}
                        placeholder="Enter percentage (0-100)"
                        data-testid="input-commission-percentage"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Current value: {systemCommission?.percentage || 0}%
                      </p>
                    </div>

                    <Button
                      onClick={handleUpdateCommission}
                      disabled={updateCommissionMutation.isPending}
                      data-testid="button-update-commission"
                    >
                      {updateCommissionMutation.isPending ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Update Commission
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="mt-6 p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold text-sm mb-2">How it works:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• When a booking is created, the system calculates the total ride cost</li>
                      <li>• The commission percentage is applied to determine the driver's payment</li>
                      <li>• Admins and dispatchers can manually override this during dispatching</li>
                      <li>• This setting provides a default when manual updates aren't made</li>
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Email Settings */}
        {visibleSettingsSection === 'email' && <AdminEmailSettings user={user} />}

        {/* Bookings Management */}
        {showBookings && (
        <Card id="bookings-section" data-testid="bookings-management" className="rounded-lg border text-card-foreground shadow-sm bg-[#f2f1e1] mt-[5px] mb-[5px] text-[12px]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5" />
                <span>Bookings Management</span>
              </CardTitle>
              <Button
                onClick={openAddBookingDialog}
                size="sm"
                data-testid="button-add-booking"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Booking
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Status Filter</Label>
                <Select value={bookingStatusFilter} onValueChange={setBookingStatusFilter}>
                  <SelectTrigger className="bg-[#ffffff]" data-testid="filter-booking-status">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Date From</Label>
                <Input
                  className="bg-[#ffffff]"
                  type="date"
                  value={bookingDateFrom}
                  onChange={(e) => setBookingDateFrom(e.target.value)}
                  data-testid="filter-date-from"
                />
              </div>
              
              <div>
                <Label>Date To</Label>
                <Input
                  className="bg-[#ffffff]"
                  type="date"
                  value={bookingDateTo}
                  onChange={(e) => setBookingDateTo(e.target.value)}
                  data-testid="filter-date-to"
                />
              </div>
              
              <div>
                <Label>Search</Label>
                <Input
                  className="bg-[#ffffff]"
                  placeholder="Passenger, Driver, ID..."
                  value={bookingSearch}
                  onChange={(e) => setBookingSearch(e.target.value)}
                  data-testid="filter-booking-search"
                />
              </div>
            </div>

            {bookingsLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : filteredBookings && filteredBookings.length > 0 ? (
              <div className="space-y-4">
                {filteredBookings.map((booking) => (
                  <div 
                    key={booking.id}
                    className="border rounded-lg p-4 space-y-3 bg-[#e2f2e1]"
                    data-testid={`booking-${booking.id}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold" data-testid={`booking-id-${booking.id}`}>
                            #{booking.id.substring(0, 8)}
                          </h4>
                          <Badge 
                            variant={
                              booking.status === 'pending' ? 'outline' :
                              booking.status === 'confirmed' ? 'default' :
                              booking.status === 'in_progress' ? 'secondary' :
                              booking.status === 'completed' ? 'default' : 'destructive'
                            }
                            className={booking.status === 'pending' ? 'bg-[#f79952]' : ''}
                            data-testid={`booking-status-${booking.id}`}
                          >
                            {booking.status}
                          </Badge>
                          <Badge variant="outline" className="bg-[#cceb8a]" data-testid={`booking-type-${booking.id}`}>
                            {booking.bookingType}
                          </Badge>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Passenger</p>
                            <p className="font-medium" data-testid={`booking-passenger-${booking.id}`}>
                              {booking.passengerName || 'Not assigned'}
                            </p>
                          </div>
                          
                          <div>
                            <p className="text-muted-foreground">Driver</p>
                            <p className="font-medium" data-testid={`booking-driver-${booking.id}`}>
                              {booking.driverName || 'Not assigned'}
                            </p>
                          </div>
                          
                          <div>
                            <p className="text-muted-foreground">Pickup</p>
                            <p className="font-medium" data-testid={`booking-pickup-${booking.id}`}>
                              {booking.pickupAddress}
                            </p>
                          </div>
                          
                          <div>
                            <p className="text-muted-foreground">Destination</p>
                            <p className="font-medium" data-testid={`booking-destination-${booking.id}`}>
                              {booking.destinationAddress || 'Hourly Service'}
                            </p>
                          </div>
                          
                          <div>
                            <p className="text-muted-foreground">Scheduled Time</p>
                            <p className="font-medium" data-testid={`booking-schedule-${booking.id}`}>
                              {new Date(booking.scheduledDateTime).toLocaleString()}
                            </p>
                          </div>
                          
                          <div>
                            <p className="text-muted-foreground">Total Amount</p>
                            <p className="font-bold text-lg" data-testid={`booking-amount-${booking.id}`}>
                              ${booking.totalAmount}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2 ml-4">
                        <Select 
                          value={booking.status}
                          onValueChange={(value) => updateBookingStatusMutation.mutate({ 
                            bookingId: booking.id, 
                            status: value 
                          })}
                          disabled={updateBookingStatusMutation.isPending}
                        >
                          <SelectTrigger className="w-40 bg-[#ffffff]" data-testid={`select-status-${booking.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        {!booking.driverId && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setAssigningBookingId(booking.id);
                              setAssignDriverDialogOpen(true);
                            }}
                            data-testid={`button-assign-driver-${booking.id}`}
                            className="bg-[#53a3f5]"
                          >
                            <Car className="w-4 h-4 mr-2" />
                            Assign Driver
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditBookingDialog(booking)}
                          data-testid={`button-edit-booking-${booking.id}`}
                          className="bg-[#6dd670]"
                        >
                          <Edit2 className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete booking #${booking.id.substring(0, 8)}?`)) {
                              deleteBookingMutation.mutate(booking.id);
                            }
                          }}
                          disabled={deleteBookingMutation.isPending}
                          data-testid={`button-delete-booking-${booking.id}`}
                          className="bg-[#f24949]"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                    
                    {booking.specialInstructions && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground">Special Instructions:</p>
                        <p className="text-sm" data-testid={`booking-instructions-${booking.id}`}>
                          {booking.specialInstructions}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-8 text-muted-foreground" data-testid="no-bookings">
                No bookings found.
              </div>
            )}
          </CardContent>
        </Card>
        )}

        {/* Assign Driver Dialog */}
        <Dialog open={assignDriverDialogOpen} onOpenChange={setAssignDriverDialogOpen}>
          <DialogContent className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg bg-[#ffffff]">
            <DialogHeader>
              <DialogTitle>Assign Driver</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Select Driver</Label>
                <Select value={selectedDriverForAssignment} onValueChange={setSelectedDriverForAssignment}>
                  <SelectTrigger data-testid="select-driver-assignment">
                    <SelectValue placeholder="Choose a driver" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeDrivers?.map((driver) => (
                      <SelectItem key={driver.id} value={driver.id}>
                        {driver.firstName} {driver.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setAssignDriverDialogOpen(false)}
                  data-testid="button-cancel-assign"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (assigningBookingId && selectedDriverForAssignment) {
                      assignDriverMutation.mutate({
                        bookingId: assigningBookingId,
                        driverId: selectedDriverForAssignment
                      });
                    }
                  }}
                  disabled={!selectedDriverForAssignment || assignDriverMutation.isPending}
                  data-testid="button-confirm-assign"
                >
                  {assignDriverMutation.isPending ? 'Assigning...' : 'Assign Driver'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add/Edit Booking Dialog */}
        <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
          <DialogContent className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-4xl translate-x-[-50%] translate-y-[-50%] gap-4 border p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg max-h-[90vh] overflow-y-auto bg-[#e1faaf]">
            <DialogHeader className="flex flex-col space-y-1.5 text-center sm:text-left bg-[#e1faaf] text-[#d82527] font-bold text-[18px]">
              <DialogTitle className="text-lg leading-none tracking-tight font-bold">{editingBooking ? 'Edit Booking' : 'Add New Booking'}</DialogTitle>
              <DialogDescription className="text-[black] font-normal text-[12px]">
                {editingBooking ? 'Update the booking details below.' : 'Fill in the details to create a new booking.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 pt-[5px] pb-[5px] bg-[#e1faaf]">
              <div className="space-y-2">
                <Label htmlFor="passenger">Passenger *</Label>
                <Select
                  value={bookingFormData.passengerId}
                  onValueChange={(value) => setBookingFormData({ ...bookingFormData, passengerId: value })}
                >
                  <SelectTrigger id="passenger" className="bg-[#ffffff] text-[12px] pt-[5px] pb-[5px] pl-[5px] pr-[5px] mt-[5px] mb-[5px] text-[#000000]" data-testid="select-passenger">
                    <SelectValue placeholder="Select passenger" />
                  </SelectTrigger>
                  <SelectContent>
                    {allUsers
                      .filter(u => u.role === 'passenger')
                      .map((passenger) => (
                        <SelectItem key={passenger.id} value={passenger.id}>
                          {passenger.firstName} {passenger.lastName} ({passenger.email})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="booking-type">Booking Type *</Label>
                  <Select
                    value={bookingFormData.bookingType}
                    onValueChange={(value) => setBookingFormData({ ...bookingFormData, bookingType: value as 'transfer' | 'hourly' })}
                  >
                    <SelectTrigger id="booking-type" className="bg-[#ffffff] text-[12px] pt-[5px] pb-[5px] pl-[5px] pr-[5px] mt-[5px] mb-[5px] text-[#000000]" data-testid="select-booking-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="transfer">Transfer</SelectItem>
                      <SelectItem value="hourly">Hourly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="vehicle-type">Vehicle Type *</Label>
                  <Select
                    value={bookingFormData.vehicleTypeId}
                    onValueChange={(value) => setBookingFormData({ ...bookingFormData, vehicleTypeId: value })}
                  >
                    <SelectTrigger id="vehicle-type" className="bg-[#ffffff] text-[12px] pt-[5px] pb-[5px] pl-[5px] pr-[5px] mt-[5px] mb-[5px] text-[#000000]" data-testid="select-vehicle-type">
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
              
              <AddressAutocomplete
                id="pickup-address"
                label="Pickup Address"
                value={bookingFormData.pickupAddress}
                onChange={(value, coords) => {
                  setBookingFormData({ ...bookingFormData, pickupAddress: value, pickupCoords: coords || null });
                }}
                placeholder="Enter pickup address"
                userId={bookingFormData.passengerId}
                required={true}
                data-testid="input-pickup-address"
              />
              
              <AddressAutocomplete
                id="destination-address"
                label="Destination Address"
                value={bookingFormData.destinationAddress}
                onChange={(value, coords) => {
                  setBookingFormData({ ...bookingFormData, destinationAddress: value, destinationCoords: coords || null });
                }}
                placeholder={bookingFormData.bookingType === 'hourly' ? 'N/A for hourly service' : 'Enter destination address'}
                userId={bookingFormData.passengerId}
                disabled={bookingFormData.bookingType === 'hourly'}
                required={bookingFormData.bookingType === 'transfer'}
                data-testid="input-destination-address"
              />
              
              {bookingFormData.bookingType === 'hourly' && (
                <div className="space-y-2">
                  <Label htmlFor="requested-hours">Duration (Hours) *</Label>
                  <Select
                    value={bookingFormData.requestedHours}
                    onValueChange={(value) => setBookingFormData({ ...bookingFormData, requestedHours: value })}
                  >
                    <SelectTrigger id="requested-hours" className="bg-[#ffffff] text-[12px] pt-[5px] pb-[5px] pl-[5px] pr-[5px] mt-[5px] mb-[5px] text-[#000000]" data-testid="select-requested-hours">
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
                      <SelectItem value="24">24 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="scheduled-datetime">Scheduled Date & Time *</Label>
                  <Input
                    id="scheduled-datetime"
                    type="datetime-local"
                    value={bookingFormData.scheduledDateTime}
                    onChange={(e) => setBookingFormData({ ...bookingFormData, scheduledDateTime: e.target.value })}
                    data-testid="input-scheduled-datetime"
                    className="pl-[5px] pr-[5px] pt-[5px] pb-[5px] mt-[5px] mb-[5px] bg-[#ffffff]"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="total-amount">Total Amount *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="total-amount"
                      type="number"
                      step="0.01"
                      value={bookingFormData.totalAmount}
                      onChange={(e) => setBookingFormData({ ...bookingFormData, totalAmount: e.target.value })}
                      placeholder="0.00"
                      data-testid="input-total-amount"
                      className="flex-1 pl-[5px] pr-[5px] pt-[5px] pb-[5px] mt-[5px] mb-[5px] bg-[#ffffff]"
                    />
                    <Button
                      type="button"
                      onClick={handleCalculatePrice}
                      disabled={
                        calculatingPrice ||
                        !bookingFormData.vehicleTypeId ||
                        !bookingFormData.pickupAddress ||
                        (bookingFormData.bookingType === 'transfer' && !bookingFormData.destinationAddress)
                      }
                      variant="outline"
                      data-testid="button-calculate-price"
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 pt-[5px] pb-[5px] pl-[5px] pr-[5px] text-[12px] bg-[#3c82bb] text-[#ffffff] font-bold"
                    >
                      {calculatingPrice ? 'Calculating...' : 'Calculate'}
                    </Button>
                  </div>
                  {calculatedPrice && (
                    <p className="text-xs text-muted-foreground">
                      Calculated: ${calculatedPrice} (editable)
                    </p>
                  )}
                </div>
              </div>
              
              {/* Passenger Details Section */}
              <div className="border-t pt-4 mt-4 bg-[#e1faaf] text-[12px]">
                <h3 className="text-[#d82527] text-[16px] mt-[5px] mb-[5px] font-bold">Passenger & Luggage Details</h3>
                
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label htmlFor="passenger-count">Passengers *</Label>
                    <Input
                      id="passenger-count"
                      type="number"
                      min="1"
                      value={bookingFormData.passengerCount}
                      onChange={(e) => setBookingFormData({ ...bookingFormData, passengerCount: parseInt(e.target.value) || 1 })}
                      data-testid="input-passenger-count"
                      className="pl-[5px] pr-[5px] pt-[5px] pb-[5px] mt-[5px] mb-[5px] bg-[#ffffff]"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="luggage-count">Luggage Count</Label>
                    <Input
                      id="luggage-count"
                      type="number"
                      min="0"
                      value={bookingFormData.luggageCount}
                      onChange={(e) => setBookingFormData({ ...bookingFormData, luggageCount: parseInt(e.target.value) || 0 })}
                      data-testid="input-luggage-count"
                      className="pl-[5px] pr-[5px] pt-[5px] pb-[5px] mt-[5px] mb-[5px] bg-[#ffffff]"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="baby-seat" className="flex items-center gap-2">
                      <input
                        id="baby-seat"
                        type="checkbox"
                        checked={bookingFormData.babySeat}
                        onChange={(e) => setBookingFormData({ ...bookingFormData, babySeat: e.target.checked })}
                        className="w-4 h-4"
                        data-testid="checkbox-baby-seat"
                      />
                      Baby Seat
                    </Label>
                  </div>
                </div>
              </div>
              
              {/* Book for Another Person Section */}
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <input
                    id="booking-for-toggle"
                    type="checkbox"
                    checked={bookingFormData.bookingFor === 'someone_else'}
                    onChange={(e) => setBookingFormData({ 
                      ...bookingFormData, 
                      bookingFor: e.target.checked ? 'someone_else' : 'self' 
                    })}
                    className="w-4 h-4"
                    data-testid="checkbox-booking-for"
                  />
                  <Label htmlFor="booking-for-toggle" className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-[#1c73ba] font-bold text-[16px]">Book for Another Person</Label>
                </div>
                
                {bookingFormData.bookingFor === 'someone_else' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="passenger-name">Passenger Name *</Label>
                      <Input
                        id="passenger-name"
                        value={bookingFormData.passengerName}
                        onChange={(e) => setBookingFormData({ ...bookingFormData, passengerName: e.target.value })}
                        placeholder="Full name"
                        data-testid="input-passenger-name"
                        className="pl-[5px] pr-[5px] pt-[5px] pb-[5px] mt-[5px] mb-[5px] bg-[#ffffff]"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="passenger-email">Passenger Email *</Label>
                        <Input
                          id="passenger-email"
                          type="email"
                          value={bookingFormData.passengerEmail}
                          onChange={(e) => setBookingFormData({ ...bookingFormData, passengerEmail: e.target.value })}
                          placeholder="email@example.com"
                          data-testid="input-passenger-email"
                          className="pl-[5px] pr-[5px] pt-[5px] pb-[5px] mt-[5px] mb-[5px] bg-[#ffffff]"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="passenger-phone">Passenger Phone *</Label>
                        <Input
                          id="passenger-phone"
                          type="tel"
                          value={bookingFormData.passengerPhone}
                          onChange={(e) => setBookingFormData({ ...bookingFormData, passengerPhone: e.target.value })}
                          placeholder="+1234567890"
                          data-testid="input-passenger-phone"
                          className="pl-[5px] pr-[5px] pt-[5px] pb-[5px] mt-[5px] mb-[5px] bg-[#ffffff]"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Flight Information Section */}
              <div className="border-t pt-4 mt-4 bg-[#e1faaf] text-[12px]">
                <h3 className="text-[#d82527] text-[16px] mt-[5px] mb-[5px] font-bold">Flight Information (Optional)</h3>
                
                {/* Show existing flight info when editing */}
                {editingBooking && bookingFormData.flightNumber && !selectedFlight && (
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg" data-testid="existing-flight-info">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Plane className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="font-bold text-blue-800">Current Flight Information</p>
                          <p className="text-sm text-blue-700">
                            {bookingFormData.flightAirline} - Flight {bookingFormData.flightNumber}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm mt-3">
                      {bookingFormData.flightDepartureAirport && (
                        <div>
                          <p className="text-xs text-blue-600 font-medium">Departure</p>
                          <p className="text-blue-800">{bookingFormData.flightDepartureAirport}</p>
                        </div>
                      )}
                      {bookingFormData.flightArrivalAirport && (
                        <div>
                          <p className="text-xs text-blue-600 font-medium">Arrival</p>
                          <p className="text-blue-800">{bookingFormData.flightArrivalAirport}</p>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-blue-600 mt-3 italic">
                      This is the recorded flight information. Search below to update.
                    </p>
                  </div>
                )}
                
                <p className="text-sm text-muted-foreground mb-3">
                  {editingBooking && bookingFormData.flightNumber 
                    ? 'Search for a new flight to update the flight information.'
                    : 'Search for a flight by entering the flight number below. The system will automatically populate flight details.'}
                </p>
                
                <div className="flex gap-2 mb-3">
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
                      data-testid="input-flight-search"
                      className="pl-[5px] pr-[5px] pt-[5px] pb-[5px] mt-[5px] mb-[5px] bg-[#ffffff]"
                    />
                  </div>
                  <Button
                    onClick={handleFlightSearch}
                    disabled={isSearchingFlight || !flightSearchInput.trim()}
                    className="hover:bg-primary/90 text-white px-6 bg-[#3d82ba] font-bold"
                    data-testid="button-find-flight"
                  >
                    {isSearchingFlight ? (
                      'Searching...'
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        {editingBooking && bookingFormData.flightNumber ? 'Update Flight' : 'Find Flight'}
                      </>
                    )}
                  </Button>
                </div>
                
                {/* Recorded Flight Information Display */}
                <div className="mt-6 mb-4">
                  {!editingBooking && !bookingFormData.flightNumber && !selectedFlight && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg" data-testid="no-flight-warning">
                      <p className="text-red-600 font-medium text-sm">
                        If you need to add flight information, please use search above!
                      </p>
                    </div>
                  )}
                  
                  {!editingBooking && bookingFormData.flightNumber && !selectedFlight && (
                    <div className="p-4 bg-white border border-gray-300 rounded-lg" data-testid="recorded-flight-display">
                      <div className="flex items-center gap-2 mb-3">
                        <Plane className="w-5 h-5 text-gray-700" />
                        <div>
                          <p className="font-bold text-black">Recorded Flight Information</p>
                          <p className="text-sm text-black">
                            {bookingFormData.flightAirline} - Flight {bookingFormData.flightNumber}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {bookingFormData.flightDepartureAirport && (
                          <div>
                            <p className="text-xs text-gray-600 font-medium">Departure</p>
                            <p className="text-black">{bookingFormData.flightDepartureAirport}</p>
                          </div>
                        )}
                        {bookingFormData.flightArrivalAirport && (
                          <div>
                            <p className="text-xs text-gray-600 font-medium">Arrival</p>
                            <p className="text-black">{bookingFormData.flightArrivalAirport}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {selectedFlight && (
                  <div className="mt-3 p-5 bg-green-50 border border-green-200 rounded-lg" data-testid="selected-flight-info">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Plane className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="font-bold text-green-800">
                            {selectedFlight.airline}
                          </p>
                          <p className="text-sm font-semibold text-green-700">
                            Flight {selectedFlight.flightNumber}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedFlight(null);
                          setFlightSearchInput('');
                          setBookingFormData({
                            ...bookingFormData,
                            flightNumber: '',
                            flightAirline: '',
                            flightDepartureAirport: '',
                            flightArrivalAirport: '',
                          });
                        }}
                        className="text-green-600 hover:text-green-800 text-sm font-medium"
                        data-testid="button-clear-flight"
                      >
                        Clear
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-green-600 font-medium">Departure</p>
                          <p className="text-green-800 font-semibold">{selectedFlight.departureAirport}</p>
                          {selectedFlight.departureTime !== 'N/A' && (
                            <p className="text-green-700 text-xs">{new Date(selectedFlight.departureTime).toLocaleString()}</p>
                          )}
                          {selectedFlight.departureTerminal !== 'N/A' && (
                            <p className="text-green-600 text-xs">Terminal: {selectedFlight.departureTerminal}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-green-600 font-medium">Arrival</p>
                          <p className="text-green-800 font-semibold">{selectedFlight.arrivalAirport}</p>
                          {selectedFlight.arrivalTime !== 'N/A' && (
                            <p className="text-green-700 text-xs">{new Date(selectedFlight.arrivalTime).toLocaleString()}</p>
                          )}
                          {selectedFlight.arrivalTerminal !== 'N/A' && (
                            <p className="text-green-600 text-xs">Terminal: {selectedFlight.arrivalTerminal}</p>
                          )}
                          {selectedFlight.baggageClaim !== 'N/A' && (
                            <p className="text-green-600 text-xs">Baggage: {selectedFlight.baggageClaim}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {selectedFlight.aircraft !== 'N/A' && (
                      <div className="mt-3 pt-3 border-t border-green-200">
                        <p className="text-xs text-green-600">Aircraft: <span className="text-green-700 font-medium">{selectedFlight.aircraft}</span></p>
                      </div>
                    )}
                    
                    <p className="text-xs text-green-600 mt-3 italic">
                      {editingBooking ? 'Updated flight information will be saved to your booking' : 'Flight information added to your booking'}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Additional Information Section */}
              <div className="border-t pt-4 mt-4 bg-[#e1faaf] text-[12px]">
                <h3 className="text-[#d82527] text-[16px] mt-[5px] mb-[5px] font-bold">Special Instructions / Notes</h3>
                <div className="space-y-2">
                  <textarea
                    id="special-instructions"
                    value={bookingFormData.specialInstructions}
                    onChange={(e) => setBookingFormData({ ...bookingFormData, specialInstructions: e.target.value })}
                    placeholder="Any special requests, dietary requirements, or accessibility needs..."
                    className="w-full min-h-[100px] p-2 border rounded-md"
                    data-testid="textarea-special-instructions"
                  />
                </div>
              </div>
              
              <div className="border-t pt-4 mt-4 space-y-2 bg-[#e1faaf] text-[12px]">
                <h3 className="text-[#d82527] text-[16px] mt-[5px] mb-[5px] font-bold">Status *</h3>
                <Select
                  value={bookingFormData.status}
                  onValueChange={(value) => setBookingFormData({ ...bookingFormData, status: value as any })}
                >
                  <SelectTrigger id="booking-status" className="bg-[#ffffff] text-[12px] pt-[5px] pb-[5px] pl-[5px] pr-[5px] mt-[5px] mb-[5px] text-[#000000]" data-testid="select-booking-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setBookingDialogOpen(false)}
                data-testid="button-cancel-booking"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const bookingData = {
                    passengerId: bookingFormData.passengerId,
                    vehicleTypeId: bookingFormData.vehicleTypeId,
                    bookingType: bookingFormData.bookingType,
                    pickupAddress: bookingFormData.pickupAddress,
                    destinationAddress: bookingFormData.bookingType === 'transfer' ? bookingFormData.destinationAddress : undefined,
                    scheduledDateTime: new Date(bookingFormData.scheduledDateTime),
                    totalAmount: bookingFormData.totalAmount.toString(),
                    status: bookingFormData.status,
                    bookingFor: bookingFormData.bookingFor,
                    passengerName: bookingFormData.passengerName || undefined,
                    passengerPhone: bookingFormData.passengerPhone || undefined,
                    passengerEmail: bookingFormData.passengerEmail || undefined,
                    passengerCount: bookingFormData.passengerCount,
                    luggageCount: bookingFormData.luggageCount,
                    babySeat: bookingFormData.babySeat,
                    specialInstructions: bookingFormData.specialInstructions || undefined,
                    flightNumber: bookingFormData.flightNumber || undefined,
                    flightAirline: bookingFormData.flightAirline || undefined,
                    flightDepartureAirport: bookingFormData.flightDepartureAirport || undefined,
                    flightArrivalAirport: bookingFormData.flightArrivalAirport || undefined,
                  };
                  saveBookingMutation.mutate(bookingData);
                }}
                disabled={
                  saveBookingMutation.isPending || 
                  !bookingFormData.passengerId ||
                  !bookingFormData.pickupAddress || 
                  !bookingFormData.scheduledDateTime || 
                  !bookingFormData.totalAmount || 
                  !bookingFormData.vehicleTypeId ||
                  (bookingFormData.bookingType === 'transfer' && !bookingFormData.destinationAddress)
                }
                data-testid="button-save-booking"
              >
                {saveBookingMutation.isPending ? 'Saving...' : (editingBooking ? 'Update Booking' : 'Create Booking')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* User Accounts Management */}
        {showUserManager && (
          <Card id="user-manager-section" data-testid="user-accounts">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>
                  {selectedUserType === 'all' ? 'All Users' : 
                   selectedUserType === 'passenger' ? 'Passengers' :
                   selectedUserType === 'driver' ? 'Drivers' :
                   selectedUserType === 'dispatcher' ? 'Dispatchers' : 'Admins'}
                </span>
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => backfillDriversMutation.mutate()}
                  disabled={backfillDriversMutation.isPending}
                  variant="outline"
                  size="sm"
                  data-testid="button-backfill-drivers"
                >
                  {backfillDriversMutation.isPending ? (
                    <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full mr-2" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  Fix Driver Records
                </Button>
                <Button
                  onClick={openAddUserDialog}
                  size="sm"
                  data-testid="button-add-user"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add User
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : allUsers && allUsers.length > 0 ? (
              <div className="space-y-4">
                {/* Search Input */}
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    placeholder="Search by name, email, or phone..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="max-w-md"
                    data-testid="input-search-users"
                  />
                </div>
                
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 text-sm font-semibold">User</th>
                        <th className="text-left p-3 text-sm font-semibold">Email</th>
                        <th className="text-left p-3 text-sm font-semibold">Role</th>
                        <th className="text-left p-3 text-sm font-semibold">Status</th>
                        <th className="text-left p-3 text-sm font-semibold">Star Rating</th>
                        <th className="text-left p-3 text-sm font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allUsers
                        .filter(u => selectedUserType === 'all' || u.role === selectedUserType)
                        .filter(u => {
                          if (!userSearchQuery) return true;
                          const query = userSearchQuery.toLowerCase();
                          return (
                            u.firstName?.toLowerCase().includes(query) ||
                            u.lastName?.toLowerCase().includes(query) ||
                            u.email?.toLowerCase().includes(query) ||
                            u.phone?.toLowerCase().includes(query) ||
                            `${u.firstName} ${u.lastName}`.toLowerCase().includes(query)
                          );
                        })
                        .map((u) => (
                        <tr 
                          key={u.id}
                          className="border-t hover:bg-muted/20 transition-colors"
                          data-testid={`user-row-${u.id}`}
                        >
                          <td className="p-3">
                            <div>
                              <p className="font-medium" data-testid={`user-name-${u.id}`}>
                                {u.firstName} {u.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Joined {new Date(u.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </td>
                          <td className="p-3">
                            <p className="text-sm" data-testid={`user-email-${u.id}`}>{u.email}</p>
                            {u.phone && (
                              <p className="text-xs text-muted-foreground">{u.phone}</p>
                            )}
                          </td>
                          <td className="p-3">
                            <Select
                              value={u.role}
                              onValueChange={(role) => updateUserMutation.mutate({ id: u.id, updates: { role: role as 'passenger' | 'driver' | 'dispatcher' | 'admin' } })}
                              disabled={updateUserMutation.isPending}
                            >
                              <SelectTrigger className="w-32" data-testid={`select-role-${u.id}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="passenger">Passenger</SelectItem>
                                <SelectItem value="driver">Driver</SelectItem>
                                <SelectItem value="dispatcher">Dispatcher</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="p-3">
                            <Select
                              value={u.isActive ? 'active' : 'inactive'}
                              onValueChange={(value) => updateUserMutation.mutate({ id: u.id, updates: { isActive: value === 'active' } })}
                              disabled={updateUserMutation.isPending}
                            >
                              <SelectTrigger className="w-28" data-testid={`select-status-${u.id}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="p-3">
                            {u.role === 'driver' && (u as any).driverInfo ? (
                              <div className="flex items-center gap-1" data-testid={`driver-rating-${u.id}`}>
                                <span className="text-sm font-medium">{parseFloat((u as any).driverInfo.rating || '0').toFixed(1)}</span>
                                <div className="flex">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <svg
                                      key={star}
                                      className={`w-4 h-4 ${
                                        star <= Math.round(parseFloat((u as any).driverInfo?.rating || '0'))
                                          ? 'text-yellow-400 fill-current'
                                          : 'text-gray-300'
                                      }`}
                                      fill="none"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                    </svg>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">N/A</span>
                            )}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              {u.role === 'driver' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedDriverForDocs(u);
                                    setDocumentsDialogOpen(true);
                                  }}
                                  data-testid={`button-documents-${u.id}`}
                                >
                                  <FileText className="w-3 h-3 mr-1" />
                                  Documents
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditUserDialog(u)}
                                data-testid={`button-edit-user-${u.id}`}
                              >
                                <Pencil className="w-3 h-3 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete ${u.firstName} ${u.lastName}?`)) {
                                    deleteUserMutation.mutate(u.id);
                                  }
                                }}
                                disabled={deleteUserMutation.isPending}
                                data-testid={`button-delete-user-${u.id}`}
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="text-xs text-muted-foreground p-3 bg-muted rounded-lg">
                  <strong>Star Rating:</strong> Shows the average rating for drivers based on passenger feedback after completed rides. Ratings are on a 5-star scale, with ratings displayed only for drivers.
                </div>
              </div>
            ) : (
              <div className="text-center p-8 text-muted-foreground" data-testid="no-users">
                No users found.
              </div>
            )}
          </CardContent>
          </Card>
        )}

      </div>

      {/* Payment Configuration Dialog */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg bg-[#ffffff]">
          <DialogHeader>
            <DialogTitle>
              Configure {selectedProvider === 'stripe' ? 'Stripe' : selectedProvider === 'paypal' ? 'PayPal' : 'Square'} Payment
            </DialogTitle>
            <DialogDescription>
              Enter your {selectedProvider === 'stripe' ? 'Stripe' : selectedProvider === 'paypal' ? 'PayPal' : 'Square'} platform credentials. These will be securely stored.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedProvider === 'stripe' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="stripe-public-key">Publishable Key *</Label>
                  <Input
                    id="stripe-public-key"
                    placeholder="pk_live_..."
                    value={paymentCredentials.publicKey}
                    onChange={(e) => setPaymentCredentials({ ...paymentCredentials, publicKey: e.target.value })}
                    data-testid="input-stripe-public-key"
                  />
                  <p className="text-xs text-muted-foreground">
                    Found in Stripe Dashboard → Developers → API keys
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stripe-secret-key">Secret Key *</Label>
                  <Input
                    id="stripe-secret-key"
                    type="password"
                    placeholder="sk_live_..."
                    value={paymentCredentials.secretKey}
                    onChange={(e) => setPaymentCredentials({ ...paymentCredentials, secretKey: e.target.value })}
                    data-testid="input-stripe-secret-key"
                  />
                  <p className="text-xs text-muted-foreground">
                    Keep this secure - never share publicly
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stripe-webhook-secret">Webhook Signing Secret (Optional)</Label>
                  <Input
                    id="stripe-webhook-secret"
                    type="password"
                    placeholder="whsec_..."
                    value={paymentCredentials.webhookSecret}
                    onChange={(e) => setPaymentCredentials({ ...paymentCredentials, webhookSecret: e.target.value })}
                    data-testid="input-stripe-webhook-secret"
                  />
                  <p className="text-xs text-muted-foreground">
                    For webhook event verification (recommended for production)
                  </p>
                </div>
              </>
            )}

            {selectedProvider === 'paypal' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="paypal-client-id">Client ID *</Label>
                  <Input
                    id="paypal-client-id"
                    placeholder="AYSq3RDGsmBLJE-otTkBtM-jBRd1TCQwFf9RGfwddNXWz0uFU9ztymylOhRS..."
                    value={paymentCredentials.clientId}
                    onChange={(e) => setPaymentCredentials({ ...paymentCredentials, clientId: e.target.value })}
                    data-testid="input-paypal-client-id"
                  />
                  <p className="text-xs text-muted-foreground">
                    Found in PayPal Developer Dashboard → My Apps & Credentials
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paypal-client-secret">Client Secret *</Label>
                  <Input
                    id="paypal-client-secret"
                    type="password"
                    placeholder="Enter your PayPal client secret..."
                    value={paymentCredentials.clientSecret}
                    onChange={(e) => setPaymentCredentials({ ...paymentCredentials, clientSecret: e.target.value })}
                    data-testid="input-paypal-client-secret"
                  />
                  <p className="text-xs text-muted-foreground">
                    Keep this secure - never share publicly
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paypal-webhook-secret">Webhook ID (Optional)</Label>
                  <Input
                    id="paypal-webhook-secret"
                    placeholder="Enter webhook ID..."
                    value={paymentCredentials.webhookSecret}
                    onChange={(e) => setPaymentCredentials({ ...paymentCredentials, webhookSecret: e.target.value })}
                    data-testid="input-paypal-webhook-id"
                  />
                  <p className="text-xs text-muted-foreground">
                    For webhook event verification
                  </p>
                </div>
              </>
            )}

            {selectedProvider === 'square' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="square-app-id">Application ID *</Label>
                  <Input
                    id="square-app-id"
                    placeholder="sq0idp-..."
                    value={paymentCredentials.applicationId}
                    onChange={(e) => setPaymentCredentials({ ...paymentCredentials, applicationId: e.target.value })}
                    data-testid="input-square-app-id"
                  />
                  <p className="text-xs text-muted-foreground">
                    Found in Square Developer Dashboard → Applications
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="square-access-token">Access Token *</Label>
                  <Input
                    id="square-access-token"
                    type="password"
                    placeholder="Enter your Square access token..."
                    value={paymentCredentials.accessToken}
                    onChange={(e) => setPaymentCredentials({ ...paymentCredentials, accessToken: e.target.value })}
                    data-testid="input-square-access-token"
                  />
                  <p className="text-xs text-muted-foreground">
                    Personal Access Token or Production Access Token
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="square-location-id">Location ID (Optional)</Label>
                  <Input
                    id="square-location-id"
                    placeholder="Enter location ID..."
                    value={paymentCredentials.locationId}
                    onChange={(e) => setPaymentCredentials({ ...paymentCredentials, locationId: e.target.value })}
                    data-testid="input-square-location-id"
                  />
                  <p className="text-xs text-muted-foreground">
                    Specific location for payments (if applicable)
                  </p>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setConfigDialogOpen(false);
                setSelectedProvider(null);
                setPaymentCredentials({
                  publicKey: '',
                  secretKey: '',
                  webhookSecret: '',
                  clientId: '',
                  clientSecret: '',
                  applicationId: '',
                  accessToken: '',
                  locationId: '',
                });
              }}
              data-testid="button-cancel-config"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePaymentConfig}
              disabled={createPaymentSystemMutation.isPending}
              data-testid="button-save-config"
            >
              {createPaymentSystemMutation.isPending ? 'Saving...' : 'Save Configuration'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit User Dialog */}
      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
        <DialogContent className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg bg-[#ffffff]">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Edit User' : 'Add New User'}
            </DialogTitle>
            <DialogDescription>
              {editingUser ? 'Update user information and settings.' : 'Create a new user account with role and permissions.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="user-first-name">First Name *</Label>
                <Input
                  id="user-first-name"
                  placeholder="John"
                  value={userFormData.firstName}
                  onChange={(e) => setUserFormData({ ...userFormData, firstName: e.target.value })}
                  data-testid="input-user-first-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-last-name">Last Name</Label>
                <Input
                  id="user-last-name"
                  placeholder="Doe"
                  value={userFormData.lastName}
                  onChange={(e) => setUserFormData({ ...userFormData, lastName: e.target.value })}
                  data-testid="input-user-last-name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-email">Email *</Label>
              <Input
                id="user-email"
                type="email"
                placeholder="user@example.com"
                value={userFormData.email}
                onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                data-testid="input-user-email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-phone">Phone Number</Label>
              <Input
                id="user-phone"
                placeholder="+1 234 567 8900"
                value={userFormData.phone}
                onChange={(e) => setUserFormData({ ...userFormData, phone: e.target.value })}
                data-testid="input-user-phone"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-role">Role *</Label>
              <Select
                value={userFormData.role}
                onValueChange={(value) => setUserFormData({ ...userFormData, role: value as typeof userFormData.role })}
              >
                <SelectTrigger id="user-role" data-testid="select-user-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="passenger">Passenger</SelectItem>
                  <SelectItem value="driver">Driver</SelectItem>
                  <SelectItem value="dispatcher">Dispatcher</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-status">Status</Label>
              <Select
                value={userFormData.isActive ? 'active' : 'inactive'}
                onValueChange={(value) => setUserFormData({ ...userFormData, isActive: value === 'active' })}
              >
                <SelectTrigger id="user-status" data-testid="select-user-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {userFormData.role === 'passenger' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="user-paylater">Pay Later Ability</Label>
                  <Select
                    value={userFormData.payLaterEnabled ? 'enabled' : 'disabled'}
                    onValueChange={(value) => setUserFormData({ ...userFormData, payLaterEnabled: value === 'enabled' })}
                  >
                    <SelectTrigger id="user-paylater" data-testid="select-user-paylater">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="enabled">Enabled</SelectItem>
                      <SelectItem value="disabled">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Allow passenger to complete trips and pay afterwards
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user-discount-type">Discount Type</Label>
                  <Select
                    value={userFormData.discountType || 'none'}
                    onValueChange={(value) => setUserFormData({ 
                      ...userFormData, 
                      discountType: value === 'none' ? null : value as 'percentage' | 'fixed',
                      discountValue: value === 'none' ? '0' : userFormData.discountValue
                    })}
                  >
                    <SelectTrigger id="user-discount-type" data-testid="select-user-discount-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Discount</SelectItem>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Select how the discount should be applied
                  </p>
                </div>

                {userFormData.discountType && (
                  <div className="space-y-2">
                    <Label htmlFor="user-discount-value">
                      Discount Value {userFormData.discountType === 'percentage' ? '(%)' : '($)'}
                    </Label>
                    <Input
                      id="user-discount-value"
                      type="number"
                      min="0"
                      max={userFormData.discountType === 'percentage' ? '100' : undefined}
                      step={userFormData.discountType === 'percentage' ? '1' : '0.01'}
                      placeholder={userFormData.discountType === 'percentage' ? '10' : '5.00'}
                      value={userFormData.discountValue}
                      onChange={(e) => setUserFormData({ ...userFormData, discountValue: e.target.value })}
                      data-testid="input-user-discount-value"
                    />
                    <p className="text-xs text-muted-foreground">
                      {userFormData.discountType === 'percentage' 
                        ? 'Enter percentage discount (0-100)'
                        : 'Enter fixed discount amount in dollars'}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUserDialogOpen(false)}
              data-testid="button-cancel-user"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveUser}
              disabled={createUserMutation.isPending || updateUserMutation.isPending}
              data-testid="button-save-user"
            >
              {(createUserMutation.isPending || updateUserMutation.isPending) ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Driver Documents Dialog */}
      <Dialog open={documentsDialogOpen} onOpenChange={setDocumentsDialogOpen}>
        <DialogContent className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg bg-[#ffffff] sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Driver Documents - {selectedDriverForDocs?.firstName} {selectedDriverForDocs?.lastName}
            </DialogTitle>
            <DialogDescription>
              View and manage driver verification documents
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Upload Form for Admin */}
            <Card className="bg-muted/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Upload Document for Driver</CardTitle>
                  <Button
                    size="sm"
                    variant={uploadingForDriver ? "default" : "outline"}
                    onClick={() => setUploadingForDriver(!uploadingForDriver)}
                    data-testid="button-toggle-upload"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    {uploadingForDriver ? 'Cancel' : 'Upload New'}
                  </Button>
                </div>
              </CardHeader>
              {uploadingForDriver && (
                <CardContent>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Document Type</Label>
                      <Select
                        value={uploadFormData.documentType}
                        onValueChange={(value) => setUploadFormData({ ...uploadFormData, documentType: value as typeof uploadFormData.documentType })}
                      >
                        <SelectTrigger data-testid="select-doc-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="driver_license">Driver License</SelectItem>
                          <SelectItem value="limo_license">Limo License</SelectItem>
                          <SelectItem value="profile_photo">Profile Photo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>File</Label>
                      <Input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => setUploadFormData({ ...uploadFormData, file: e.target.files?.[0] || null })}
                        data-testid="input-doc-file"
                      />
                    </div>

                    {uploadFormData.documentType !== 'profile_photo' && (
                      <div className="space-y-2">
                        <Label>Expiration Date</Label>
                        <Input
                          type="date"
                          value={uploadFormData.expirationDate}
                          onChange={(e) => setUploadFormData({ ...uploadFormData, expirationDate: e.target.value })}
                          data-testid="input-expiration-date"
                        />
                      </div>
                    )}

                    {uploadFormData.documentType === 'profile_photo' && (
                      <div className="space-y-2">
                        <Label>WhatsApp Number</Label>
                        <Input
                          type="tel"
                          placeholder="+1234567890"
                          value={uploadFormData.whatsappNumber}
                          onChange={(e) => setUploadFormData({ ...uploadFormData, whatsappNumber: e.target.value })}
                          data-testid="input-whatsapp"
                        />
                      </div>
                    )}

                    <Button
                      onClick={() => {
                        if (!uploadFormData.file || !selectedDriverForDocs) {
                          toast({
                            title: "Missing Information",
                            description: "Please select a file to upload",
                            variant: "destructive",
                          });
                          return;
                        }
                        adminUploadDocumentMutation.mutate({
                          userId: selectedDriverForDocs.id,
                          file: uploadFormData.file,
                          documentType: uploadFormData.documentType,
                          expirationDate: uploadFormData.expirationDate || undefined,
                          whatsappNumber: uploadFormData.whatsappNumber || undefined,
                        });
                      }}
                      disabled={adminUploadDocumentMutation.isPending || !uploadFormData.file}
                      className="w-full"
                      data-testid="button-submit-upload"
                    >
                      {adminUploadDocumentMutation.isPending ? 'Uploading...' : 'Upload Document'}
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Existing Documents */}
            {documentsLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : allDriverDocuments && allDriverDocuments.length > 0 ? (
              <>
                {allDriverDocuments
                  .filter(doc => doc.driverInfo?.userId === selectedDriverForDocs?.id)
                  .map((doc) => (
                    <Card key={doc.id} data-testid={`document-card-${doc.id}`}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              <h3 className="font-semibold capitalize">
                                {doc.documentType.replace('_', ' ')}
                              </h3>
                              <Badge
                                variant={
                                  doc.status === 'approved' ? 'default' :
                                  doc.status === 'rejected' ? 'destructive' :
                                  'secondary'
                                }
                                data-testid={`document-status-${doc.id}`}
                              >
                                {doc.status}
                              </Badge>
                            </div>
                            
                            <div className="text-sm text-muted-foreground space-y-1">
                              {doc.expirationDate && (
                                <p>Expires: {new Date(doc.expirationDate).toLocaleDateString()}</p>
                              )}
                              {doc.whatsappNumber && (
                                <p>WhatsApp: {doc.whatsappNumber}</p>
                              )}
                              <p>Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                              {doc.rejectionReason && (
                                <p className="text-destructive">Rejection Reason: {doc.rejectionReason}</p>
                              )}
                            </div>

                            <div className="flex items-center gap-2 mt-3">
                              {doc.status !== 'approved' && (
                                <Button
                                  size="sm"
                                  onClick={() => updateDocumentStatusMutation.mutate({ 
                                    documentId: doc.id, 
                                    status: 'approved' 
                                  })}
                                  disabled={updateDocumentStatusMutation.isPending}
                                  data-testid={`button-approve-${doc.id}`}
                                >
                                  <Check className="w-3 h-3 mr-1" />
                                  Approve
                                </Button>
                              )}
                              {doc.status !== 'rejected' && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    const reason = prompt('Enter rejection reason:');
                                    if (reason) {
                                      updateDocumentStatusMutation.mutate({ 
                                        documentId: doc.id, 
                                        status: 'rejected',
                                        rejectionReason: reason
                                      });
                                    }
                                  }}
                                  disabled={updateDocumentStatusMutation.isPending}
                                  data-testid={`button-reject-${doc.id}`}
                                >
                                  <X className="w-3 h-3 mr-1" />
                                  Reject
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </>
            ) : (
              <div className="text-center p-8 text-muted-foreground" data-testid="no-documents">
                No documents uploaded yet.
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDocumentsDialogOpen(false);
                setSelectedDriverForDocs(null);
              }}
              data-testid="button-close-documents"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
