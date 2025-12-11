import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useBranding } from '@/hooks/useBranding';
import type { Booking as BookingType } from '@shared/schema';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Car,
  Settings,
  LogOut,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Search,
  Filter,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  User,
  Shield,
  Loader2,
  RefreshCw,
  Eye,
  Edit2,
  Trash2,
  Plus,
  X,
  Check,
  Image,
  Palette,
  Menu,
  Navigation,
  UserCheck,
} from 'lucide-react';
import { format } from 'date-fns';
import { BookingDetailsDialog } from '@/components/BookingDetailsDialog';

type AdminSection = 'dashboard' | 'bookings' | 'users' | 'vehicles' | 'settings';

interface BookingFormData {
  passengerId: string;
  bookingType: 'transfer' | 'hourly';
  vehicleTypeId: string;
  pickupAddress: string;
  pickupCoords: { lat: number; lon: number } | null;
  destinationAddress: string;
  destinationCoords: { lat: number; lon: number } | null;
  viaPoints: { address: string; lat: number; lon: number }[];
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
  specialInstructions: string;
  billReference: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  paymentMethod: 'pay_now' | 'pay_later' | 'cash' | 'ride_credit';
}

const defaultFormData: BookingFormData = {
  passengerId: '',
  bookingType: 'transfer',
  vehicleTypeId: '',
  pickupAddress: '',
  pickupCoords: null,
  destinationAddress: '',
  destinationCoords: null,
  viaPoints: [],
  scheduledDateTime: '',
  totalAmount: '',
  regularPrice: '',
  discountPercentage: '',
  discountAmount: '',
  baseFare: '',
  gratuityAmount: '',
  airportFeeAmount: '',
  surgePricingMultiplier: '1',
  surgePricingAmount: '0',
  requestedHours: '',
  passengerCount: 1,
  luggageCount: 0,
  babySeat: false,
  bookingFor: 'self',
  passengerName: '',
  passengerEmail: '',
  passengerPhone: '',
  flightNumber: '',
  flightAirline: '',
  flightDepartureAirport: '',
  flightArrivalAirport: '',
  specialInstructions: '',
  billReference: '',
  status: 'pending',
  paymentMethod: 'pay_now',
};

interface DashboardStats {
  totalRevenue: string;
  monthlyRevenue: string;
  activeBookings: number;
  totalDrivers: number;
  activeDrivers: number;
  pendingBookings: number;
  awaitingDriverApproval: number;
}

interface ViaPoint {
  address: string;
  lat: number;
  lon: number;
}

interface Booking {
  id: string;
  status: string;
  pickupAddress: string;
  dropoffAddress?: string;
  destinationAddress?: string;
  pickupDate?: string;
  scheduledDateTime?: string;
  totalAmount: string;
  passengerName?: string;
  driverName?: string;
  driverId?: string;
  vehicleType?: string;
  vehicleTypeId?: string;
  viaPoints?: ViaPoint[];
  pickupLat?: string;
  pickupLon?: string;
  destinationLat?: string;
  destinationLon?: string;
  passengerCount?: number;
  luggageCount?: number;
  babySeat?: boolean;
  specialInstructions?: string;
  bookingType?: 'transfer' | 'hourly';
  passengerId?: string;
  passengerEmail?: string;
  passengerPhone?: string;
  flightNumber?: string;
  flightAirline?: string;
  flightDepartureAirport?: string;
  flightArrivalAirport?: string;
  paymentMethod?: string;
  regularPrice?: string;
  discountPercentage?: string;
  discountAmount?: string;
  baseFare?: string;
  gratuityAmount?: string;
  airportFeeAmount?: string;
  surgePricingMultiplier?: string;
  surgePricingAmount?: string;
  requestedHours?: string;
  billReference?: string;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface Vehicle {
  id: string;
  name: string;
  type: string;
  baseRate: string;
  perMileRate: string;
  capacity: number;
  isActive: boolean;
  imageUrl?: string;
}

export default function MobileAdmin() {
  const [, navigate] = useLocation();
  const { user, isLoading: authLoading, logoutMutation } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { logoUrl: brandingLogoUrl } = useBranding();
  
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: string; id: string; name: string } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Booking dialog states
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [bookingFormData, setBookingFormData] = useState<BookingFormData>(defaultFormData);
  const [editingBooking, setEditingBooking] = useState<any | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [manualDriverPayment, setManualDriverPayment] = useState('');
  const [calculatingPrice, setCalculatingPrice] = useState(false);
  const [calculatedPrice, setCalculatedPrice] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedFlight, setSelectedFlight] = useState<any | null>(null);
  const [flightSearchInput, setFlightSearchInput] = useState('');
  const [isSearchingFlight, setIsSearchingFlight] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      navigate('/mobile-admin-login');
    }
  }, [user, authLoading, navigate]);

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery<DashboardStats>({
    queryKey: ['/api/admin/dashboard-stats'],
    enabled: !!user && user.role === 'admin',
  });

  const { data: bookings, isLoading: bookingsLoading, refetch: refetchBookings } = useQuery<Booking[]>({
    queryKey: ['/api/admin/bookings'],
    enabled: !!user && user.role === 'admin',
  });

  const { data: users, isLoading: usersLoading, refetch: refetchUsers } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    enabled: !!user && user.role === 'admin',
  });

  const { data: vehicles, isLoading: vehiclesLoading, refetch: refetchVehicles } = useQuery<Vehicle[]>({
    queryKey: ['/api/admin/vehicle-types'],
    enabled: !!user && user.role === 'admin',
  });

  // Query for active drivers (needed for BookingDetailsDialog)
  const { data: activeDrivers } = useQuery<any[]>({
    queryKey: ['/api/admin/active-drivers'],
    enabled: !!user && user.role === 'admin',
  });

  // Query for all users (needed for BookingDetailsDialog passenger selection)
  const { data: allUsers } = useQuery<any[]>({
    queryKey: ['/api/admin/users'],
    enabled: !!user && user.role === 'admin',
  });

  const updateBookingMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest('PATCH', `/api/admin/bookings/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/bookings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/dashboard-stats'] });
      toast({ title: 'Success', description: 'Booking updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<User> }) => {
      const response = await apiRequest('PATCH', `/api/admin/users/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setShowUserDialog(false);
      setSelectedUser(null);
      toast({ title: 'Success', description: 'User updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Save booking mutation for creating/updating bookings
  const saveBookingMutation = useMutation({
    mutationFn: async (formData: BookingFormData) => {
      const bookingData = {
        passengerId: formData.passengerId || null,
        bookingType: formData.bookingType,
        vehicleTypeId: formData.vehicleTypeId,
        pickupAddress: formData.pickupAddress,
        pickupLat: formData.pickupCoords?.lat?.toString() || null,
        pickupLon: formData.pickupCoords?.lon?.toString() || null,
        destinationAddress: formData.destinationAddress,
        destinationLat: formData.destinationCoords?.lat?.toString() || null,
        destinationLon: formData.destinationCoords?.lon?.toString() || null,
        viaPoints: formData.viaPoints,
        scheduledDateTime: formData.scheduledDateTime || null,
        totalAmount: formData.totalAmount,
        regularPrice: formData.regularPrice || null,
        discountPercentage: formData.discountPercentage || null,
        discountAmount: formData.discountAmount || null,
        baseFare: formData.baseFare || null,
        gratuityAmount: formData.gratuityAmount || null,
        airportFeeAmount: formData.airportFeeAmount || null,
        surgePricingMultiplier: formData.surgePricingMultiplier || '1',
        surgePricingAmount: formData.surgePricingAmount || '0',
        requestedHours: formData.bookingType === 'hourly' ? formData.requestedHours : null,
        passengerCount: formData.passengerCount,
        luggageCount: formData.luggageCount,
        babySeat: formData.babySeat,
        bookingFor: formData.bookingFor,
        passengerName: formData.passengerName,
        passengerEmail: formData.passengerEmail,
        passengerPhone: formData.passengerPhone,
        flightNumber: formData.flightNumber || null,
        flightAirline: formData.flightAirline || null,
        flightDepartureAirport: formData.flightDepartureAirport || null,
        flightArrivalAirport: formData.flightArrivalAirport || null,
        specialInstructions: formData.specialInstructions || null,
        status: formData.status,
        paymentMethod: formData.paymentMethod,
      };

      if (editingBooking) {
        const response = await apiRequest('PATCH', `/api/admin/bookings/${editingBooking.id}`, bookingData);
        return response.json();
      } else {
        const response = await apiRequest('POST', '/api/admin/bookings', bookingData);
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/bookings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/dashboard-stats'] });
      setBookingDialogOpen(false);
      setBookingFormData(defaultFormData);
      setEditingBooking(null);
      toast({ 
        title: 'Success', 
        description: editingBooking ? 'Booking updated successfully' : 'Booking created successfully' 
      });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Handle calculate price
  const handleCalculatePrice = async () => {
    if (!bookingFormData.pickupCoords || !bookingFormData.destinationCoords || !bookingFormData.vehicleTypeId) {
      toast({ title: 'Missing Info', description: 'Please fill pickup, destination, and vehicle type', variant: 'destructive' });
      return;
    }
    setCalculatingPrice(true);
    try {
      const response = await apiRequest('POST', '/api/calculate-price', {
        pickupLat: bookingFormData.pickupCoords.lat,
        pickupLon: bookingFormData.pickupCoords.lon,
        destinationLat: bookingFormData.destinationCoords.lat,
        destinationLon: bookingFormData.destinationCoords.lon,
        vehicleTypeId: bookingFormData.vehicleTypeId,
        bookingType: bookingFormData.bookingType,
        requestedHours: bookingFormData.requestedHours,
      });
      const data = await response.json();
      setCalculatedPrice(data.totalAmount || '0');
      setBookingFormData(prev => ({ ...prev, totalAmount: data.totalAmount || '0' }));
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to calculate price', variant: 'destructive' });
    } finally {
      setCalculatingPrice(false);
    }
  };

  // Handle flight search
  const handleFlightSearch = async () => {
    if (!flightSearchInput.trim()) return;
    setIsSearchingFlight(true);
    try {
      const response = await apiRequest('GET', `/api/flights/search?flightNumber=${encodeURIComponent(flightSearchInput)}`);
      const data = await response.json();
      if (data && data.length > 0) {
        setSelectedFlight(data[0]);
        setBookingFormData(prev => ({
          ...prev,
          flightNumber: data[0].flightNumber || flightSearchInput,
          flightAirline: data[0].airline || '',
          flightDepartureAirport: data[0].departureAirport || '',
          flightArrivalAirport: data[0].arrivalAirport || '',
        }));
      } else {
        toast({ title: 'Not Found', description: 'Flight not found' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to search flight', variant: 'destructive' });
    } finally {
      setIsSearchingFlight(false);
    }
  };

  // Delete booking mutation
  const deleteBookingMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/admin/bookings/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/bookings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/dashboard-stats'] });
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
      toast({ title: 'Success', description: 'Booking deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Assign driver mutation
  const assignDriverMutation = useMutation({
    mutationFn: async ({ bookingId, driverId, driverPayment }: { bookingId: string; driverId: string; driverPayment: string }) => {
      const response = await apiRequest('POST', `/api/admin/bookings/${bookingId}/assign-driver`, {
        driverId,
        driverPayment: parseFloat(driverPayment) || 0,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/bookings'] });
      toast({ title: 'Success', description: 'Driver assigned successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Open new booking dialog
  const handleOpenNewBooking = () => {
    setEditingBooking(null);
    setBookingFormData(defaultFormData);
    setSelectedDriverId('');
    setManualDriverPayment('');
    setCalculatedPrice('');
    setSelectedFlight(null);
    setFlightSearchInput('');
    setBookingDialogOpen(true);
  };

  // Handle edit booking - pre-fill form with booking data
  const handleEditBooking = (booking: Booking) => {
    setEditingBooking(booking);
    setBookingFormData({
      passengerId: booking.passengerId || '',
      bookingType: booking.bookingType || 'transfer',
      vehicleTypeId: booking.vehicleTypeId || '',
      pickupAddress: booking.pickupAddress || '',
      pickupCoords: booking.pickupLat && booking.pickupLon 
        ? { lat: parseFloat(booking.pickupLat), lon: parseFloat(booking.pickupLon) } 
        : null,
      destinationAddress: booking.destinationAddress || booking.dropoffAddress || '',
      destinationCoords: booking.destinationLat && booking.destinationLon
        ? { lat: parseFloat(booking.destinationLat), lon: parseFloat(booking.destinationLon) }
        : null,
      viaPoints: booking.viaPoints || [],
      scheduledDateTime: booking.scheduledDateTime || '',
      totalAmount: booking.totalAmount || '',
      regularPrice: booking.regularPrice || '',
      discountPercentage: booking.discountPercentage || '',
      discountAmount: booking.discountAmount || '',
      baseFare: booking.baseFare || '',
      gratuityAmount: booking.gratuityAmount || '',
      airportFeeAmount: booking.airportFeeAmount || '',
      surgePricingMultiplier: booking.surgePricingMultiplier || '1',
      surgePricingAmount: booking.surgePricingAmount || '0',
      requestedHours: booking.requestedHours || '',
      passengerCount: booking.passengerCount || 1,
      luggageCount: booking.luggageCount || 0,
      babySeat: booking.babySeat || false,
      bookingFor: 'self',
      passengerName: booking.passengerName || '',
      passengerEmail: booking.passengerEmail || '',
      passengerPhone: booking.passengerPhone || '',
      flightNumber: booking.flightNumber || '',
      flightAirline: booking.flightAirline || '',
      flightDepartureAirport: booking.flightDepartureAirport || '',
      flightArrivalAirport: booking.flightArrivalAirport || '',
      specialInstructions: booking.specialInstructions || '',
      billReference: booking.billReference || '',
      status: (booking.status as any) || 'pending',
      paymentMethod: (booking.paymentMethod as any) || 'pay_now',
    });
    setSelectedDriverId(booking.driverId || '');
    setCalculatedPrice(booking.totalAmount || '');
    setBookingDialogOpen(true);
  };

  // Handle delete confirmation
  const handleDeleteBooking = (booking: Booking) => {
    setItemToDelete({ type: 'booking', id: booking.id, name: booking.passengerName || 'Booking' });
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete && itemToDelete.type === 'booking') {
      deleteBookingMutation.mutate(itemToDelete.id);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      navigate('/mobile-admin-login');
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to logout', variant: 'destructive' });
    }
  };

  const handleRefresh = () => {
    refetchStats();
    refetchBookings();
    refetchUsers();
    refetchVehicles();
    toast({ title: 'Refreshed', description: 'Data has been updated' });
  };

  const filteredBookings = bookings?.filter(booking => {
    const matchesSearch = searchQuery === '' || 
      booking.pickupAddress?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.dropoffAddress?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.destinationAddress?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.passengerName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const filteredUsers = users?.filter(user => {
    const matchesSearch = searchQuery === '' ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  }) || [];

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      confirmed: { color: 'bg-blue-100 text-blue-800', label: 'Confirmed' },
      in_progress: { color: 'bg-purple-100 text-purple-800', label: 'In Progress' },
      completed: { color: 'bg-green-100 text-green-800', label: 'Completed' },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled' },
    };
    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: status };
    return <Badge className={`${config.color} font-medium`}>{config.label}</Badge>;
  };

  const getRoleBadge = (role: string) => {
    const roleConfig: Record<string, { color: string; label: string }> = {
      admin: { color: 'bg-purple-100 text-purple-800', label: 'Admin' },
      driver: { color: 'bg-blue-100 text-blue-800', label: 'Driver' },
      dispatcher: { color: 'bg-orange-100 text-orange-800', label: 'Dispatcher' },
      passenger: { color: 'bg-green-100 text-green-800', label: 'Passenger' },
    };
    const config = roleConfig[role] || { color: 'bg-gray-100 text-gray-800', label: role };
    return <Badge className={`${config.color} font-medium`}>{config.label}</Badge>;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900 to-blue-900 text-white px-4 py-4 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {brandingLogoUrl ? (
              <img 
                src={brandingLogoUrl} 
                alt="Admin" 
                className="h-8 w-auto brightness-0 invert"
              />
            ) : (
              <Shield className="w-8 h-8" />
            )}
            <div>
              <h1 className="font-bold text-lg">Admin Panel</h1>
              <p className="text-xs text-blue-200">Welcome, {user.firstName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
              onClick={handleRefresh}
            >
              <RefreshCw className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
              onClick={() => setMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Menu Drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setMenuOpen(false)}>
          <div 
            className="absolute right-0 top-0 h-full w-64 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b bg-slate-50">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Menu</h2>
                <Button variant="ghost" size="icon" onClick={() => setMenuOpen(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
            <div className="p-4 space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleLogout}
              >
                <LogOut className="w-5 h-5 mr-3" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="px-4 py-4">
        {activeSection === 'dashboard' && (
          <div className="space-y-4">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 opacity-80" />
                    <span className="text-xs opacity-80">Revenue</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {statsLoading ? '...' : `$${parseFloat(stats?.monthlyRevenue || '0').toLocaleString()}`}
                  </p>
                  <p className="text-xs opacity-70 mt-1">This Month</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 opacity-80" />
                    <span className="text-xs opacity-80">Bookings</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {statsLoading ? '...' : stats?.activeBookings || 0}
                  </p>
                  <p className="text-xs opacity-70 mt-1">Active</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 opacity-80" />
                    <span className="text-xs opacity-80">Drivers</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {statsLoading ? '...' : stats?.activeDrivers || 0}
                  </p>
                  <p className="text-xs opacity-70 mt-1">Active</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 opacity-80" />
                    <span className="text-xs opacity-80">Pending</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {statsLoading ? '...' : stats?.pendingBookings || 0}
                  </p>
                  <p className="text-xs opacity-70 mt-1">Needs Action</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Bookings */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Recent Bookings</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setActiveSection('bookings')}
                    className="text-blue-600"
                  >
                    View All
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {bookingsLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  </div>
                ) : filteredBookings.slice(0, 5).map((booking) => (
                  <div 
                    key={booking.id}
                    className="p-3 bg-slate-50 rounded-lg"
                    onClick={() => setSelectedBooking(booking)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{booking.passengerName || 'Guest'}</p>
                        <p className="text-xs text-slate-500 truncate">{booking.pickupAddress}</p>
                      </div>
                      {getStatusBadge(booking.status)}
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{booking.pickupDate ? format(new Date(booking.pickupDate), 'MMM d, h:mm a') : 'No date'}</span>
                      <span className="font-medium text-slate-900">${booking.totalAmount}</span>
                    </div>
                  </div>
                ))}
                {!bookingsLoading && filteredBookings.length === 0 && (
                  <p className="text-center text-slate-500 py-4">No bookings found</p>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => setActiveSection('bookings')}
                  >
                    <Calendar className="w-6 h-6 text-blue-600" />
                    <span className="text-sm">Manage Bookings</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => setActiveSection('users')}
                  >
                    <Users className="w-6 h-6 text-green-600" />
                    <span className="text-sm">Manage Users</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => setActiveSection('vehicles')}
                  >
                    <Car className="w-6 h-6 text-purple-600" />
                    <span className="text-sm">Vehicle Types</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => setActiveSection('settings')}
                  >
                    <Settings className="w-6 h-6 text-orange-600" />
                    <span className="text-sm">Settings</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeSection === 'bookings' && (
          <div className="space-y-4">
            {/* Header with Add Button */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Bookings</h2>
              <Button
                onClick={handleOpenNewBooking}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Booking
              </Button>
            </div>

            {/* Search and Filter */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search bookings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bookings List */}
            <div className="space-y-3">
              {bookingsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              ) : filteredBookings.map((booking) => (
                <Card key={booking.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold">{booking.passengerName || 'Guest'}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-slate-500">{booking.vehicleType || 'Standard'}</p>
                          {booking.driverName && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                              Driver: {booking.driverName}
                            </span>
                          )}
                        </div>
                      </div>
                      {getStatusBadge(booking.status)}
                    </div>
                    
                    <div className="space-y-2 text-sm mb-3">
                      {/* Pickup Address */}
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-slate-600">{booking.pickupAddress}</span>
                      </div>
                      
                      {/* Via Points */}
                      {booking.viaPoints && booking.viaPoints.length > 0 && (
                        booking.viaPoints.map((via, index) => (
                          <div key={index} className="flex items-start gap-2 pl-2 border-l-2 border-orange-300 ml-1.5">
                            <Navigation className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                            <span className="text-slate-500 text-xs">{via.address}</span>
                          </div>
                        ))
                      )}
                      
                      {/* Destination Address */}
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <span className="text-slate-600">
                          {booking.destinationAddress || booking.dropoffAddress || 'No destination'}
                        </span>
                      </div>
                    </div>

                    {/* Date/Time and Price */}
                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Clock className="w-4 h-4" />
                        {booking.scheduledDateTime 
                          ? format(new Date(booking.scheduledDateTime), 'MMM d, yyyy h:mm a')
                          : booking.pickupDate 
                            ? format(new Date(booking.pickupDate), 'MMM d, yyyy h:mm a')
                            : 'No date'}
                      </div>
                      <span className="font-bold text-lg">${booking.totalAmount}</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-3 pt-3 border-t">
                      {/* Edit Button */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditBooking(booking)}
                      >
                        <Edit2 className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      
                      {/* Assign Driver (only if no driver assigned and not cancelled/completed) */}
                      {!booking.driverId && !['cancelled', 'completed'].includes(booking.status) && (
                        <Select
                          value=""
                          onValueChange={(driverId) => {
                            if (driverId) {
                              assignDriverMutation.mutate({
                                bookingId: booking.id,
                                driverId,
                                driverPayment: (parseFloat(booking.totalAmount) * 0.7).toFixed(2),
                              });
                            }
                          }}
                        >
                          <SelectTrigger className="h-8 text-sm flex-1">
                            <SelectValue placeholder="Assign Driver" />
                          </SelectTrigger>
                          <SelectContent>
                            {activeDrivers?.filter(driver => driver.id).map((driver) => (
                              <SelectItem key={driver.id} value={driver.id}>
                                {driver.firstName} {driver.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      
                      {/* Status Actions */}
                      {booking.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => updateBookingMutation.mutate({ id: booking.id, status: 'confirmed' })}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-orange-600 border-orange-200"
                            onClick={() => updateBookingMutation.mutate({ id: booking.id, status: 'cancelled' })}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      
                      {/* Delete Button */}
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-200"
                        onClick={() => handleDeleteBooking(booking)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {!bookingsLoading && filteredBookings.length === 0 && (
                <Card>
                  <CardContent className="py-8 text-center text-slate-500">
                    No bookings found
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {activeSection === 'users' && (
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Users List */}
            <div className="space-y-3">
              {usersLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              ) : filteredUsers.map((userItem) => (
                <Card key={userItem.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-slate-500" />
                        </div>
                        <div>
                          <p className="font-semibold">{userItem.firstName} {userItem.lastName}</p>
                          <p className="text-sm text-slate-500">{userItem.email}</p>
                        </div>
                      </div>
                      {getRoleBadge(userItem.role)}
                    </div>
                    
                    <div className="flex items-center justify-between pt-3 border-t mt-3">
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        {userItem.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5" />
                            <span>{userItem.phone}</span>
                          </div>
                        )}
                        <Badge variant={userItem.isActive ? 'default' : 'secondary'}>
                          {userItem.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => {
                          setSelectedUser(userItem);
                          setShowUserDialog(true);
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {!usersLoading && filteredUsers.length === 0 && (
                <Card>
                  <CardContent className="py-8 text-center text-slate-500">
                    No users found
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {activeSection === 'vehicles' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Vehicle Types</h2>
            </div>

            <div className="space-y-3">
              {vehiclesLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              ) : vehicles?.map((vehicle) => (
                <Card key={vehicle.id}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {vehicle.imageUrl ? (
                        <img 
                          src={vehicle.imageUrl} 
                          alt={vehicle.name}
                          className="w-20 h-16 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-20 h-16 bg-slate-100 rounded-lg flex items-center justify-center">
                          <Car className="w-8 h-8 text-slate-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold">{vehicle.name}</p>
                            <p className="text-sm text-slate-500">{vehicle.type}</p>
                          </div>
                          <Badge variant={vehicle.isActive ? 'default' : 'secondary'}>
                            {vehicle.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="text-slate-600">
                            Base: <span className="font-medium">${vehicle.baseRate}</span>
                          </span>
                          <span className="text-slate-600">
                            Per Mile: <span className="font-medium">${vehicle.perMileRate}</span>
                          </span>
                          <span className="text-slate-600">
                            Seats: <span className="font-medium">{vehicle.capacity}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {!vehiclesLoading && (!vehicles || vehicles.length === 0) && (
                <Card>
                  <CardContent className="py-8 text-center text-slate-500">
                    No vehicle types found
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {activeSection === 'settings' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Settings</h2>

            <Card>
              <CardContent className="p-4 space-y-4">
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-4"
                  onClick={() => navigate('/admin-pricing')}
                >
                  <DollarSign className="w-5 h-5 mr-3 text-green-600" />
                  <div className="text-left">
                    <p className="font-medium">Pricing Rules</p>
                    <p className="text-sm text-slate-500">Manage pricing and rates</p>
                  </div>
                  <ChevronRight className="w-5 h-5 ml-auto text-slate-400" />
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-4"
                  onClick={() => navigate('/admin-dashboard')}
                >
                  <Palette className="w-5 h-5 mr-3 text-purple-600" />
                  <div className="text-left">
                    <p className="font-medium">Branding & CMS</p>
                    <p className="text-sm text-slate-500">Logo, colors, and content</p>
                  </div>
                  <ChevronRight className="w-5 h-5 ml-auto text-slate-400" />
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-4"
                  onClick={() => navigate('/admin-dashboard')}
                >
                  <Mail className="w-5 h-5 mr-3 text-blue-600" />
                  <div className="text-left">
                    <p className="font-medium">Email & Notifications</p>
                    <p className="text-sm text-slate-500">Configure email settings</p>
                  </div>
                  <ChevronRight className="w-5 h-5 ml-auto text-slate-400" />
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-4"
                  onClick={() => navigate('/admin-dashboard')}
                >
                  <FileText className="w-5 h-5 mr-3 text-orange-600" />
                  <div className="text-left">
                    <p className="font-medium">Payment Systems</p>
                    <p className="text-sm text-slate-500">Manage payment providers</p>
                  </div>
                  <ChevronRight className="w-5 h-5 ml-auto text-slate-400" />
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-slate-50">
              <CardContent className="p-4">
                <p className="text-sm text-slate-600 text-center">
                  For advanced settings, use the full admin dashboard on desktop.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
        <div className="flex items-center justify-around py-2">
          <button
            onClick={() => { setActiveSection('dashboard'); setSearchQuery(''); }}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
              activeSection === 'dashboard' ? 'text-blue-600' : 'text-slate-500'
            }`}
          >
            <LayoutDashboard className="w-6 h-6" />
            <span className="text-xs font-medium">Dashboard</span>
          </button>
          <button
            onClick={() => { setActiveSection('bookings'); setSearchQuery(''); }}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
              activeSection === 'bookings' ? 'text-blue-600' : 'text-slate-500'
            }`}
          >
            <Calendar className="w-6 h-6" />
            <span className="text-xs font-medium">Bookings</span>
          </button>
          <button
            onClick={() => { setActiveSection('users'); setSearchQuery(''); }}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
              activeSection === 'users' ? 'text-blue-600' : 'text-slate-500'
            }`}
          >
            <Users className="w-6 h-6" />
            <span className="text-xs font-medium">Users</span>
          </button>
          <button
            onClick={() => { setActiveSection('vehicles'); setSearchQuery(''); }}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
              activeSection === 'vehicles' ? 'text-blue-600' : 'text-slate-500'
            }`}
          >
            <Car className="w-6 h-6" />
            <span className="text-xs font-medium">Vehicles</span>
          </button>
          <button
            onClick={() => { setActiveSection('settings'); setSearchQuery(''); }}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
              activeSection === 'settings' ? 'text-blue-600' : 'text-slate-500'
            }`}
          >
            <Settings className="w-6 h-6" />
            <span className="text-xs font-medium">Settings</span>
          </button>
        </div>
      </nav>

      {/* Booking Details Dialog */}
      <BookingDetailsDialog
        open={bookingDialogOpen}
        onOpenChange={setBookingDialogOpen}
        formData={bookingFormData}
        setFormData={setBookingFormData}
        editingBooking={editingBooking}
        onSave={() => saveBookingMutation.mutate(bookingFormData)}
        isSaving={saveBookingMutation.isPending}
        vehicleTypes={vehicles || []}
        allUsers={allUsers || []}
        activeDrivers={activeDrivers || []}
        selectedDriverId={selectedDriverId}
        setSelectedDriverId={setSelectedDriverId}
        driverPayment={manualDriverPayment}
        setDriverPayment={setManualDriverPayment}
        onCalculatePrice={handleCalculatePrice}
        isCalculatingPrice={calculatingPrice}
        calculatedPrice={calculatedPrice}
        userSearchQuery={userSearchQuery}
        setUserSearchQuery={setUserSearchQuery}
        selectedFlight={selectedFlight}
        setSelectedFlight={setSelectedFlight}
        flightSearchInput={flightSearchInput}
        setFlightSearchInput={setFlightSearchInput}
        onFlightSearch={handleFlightSearch}
        isSearchingFlight={isSearchingFlight}
      />

      {/* User Edit Dialog */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user details and permissions
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>First Name</Label>
                  <Input
                    value={selectedUser.firstName}
                    onChange={(e) => setSelectedUser({ ...selectedUser, firstName: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Last Name</Label>
                  <Input
                    value={selectedUser.lastName}
                    onChange={(e) => setSelectedUser({ ...selectedUser, lastName: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={selectedUser.email}
                  onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={selectedUser.phone}
                  onChange={(e) => setSelectedUser({ ...selectedUser, phone: e.target.value })}
                />
              </div>
              <div>
                <Label>Role</Label>
                <Select 
                  value={selectedUser.role} 
                  onValueChange={(value) => setSelectedUser({ ...selectedUser, role: value })}
                >
                  <SelectTrigger>
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
              <div className="flex items-center justify-between">
                <Label>Active Status</Label>
                <Button
                  variant={selectedUser.isActive ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedUser({ ...selectedUser, isActive: !selectedUser.isActive })}
                >
                  {selectedUser.isActive ? 'Active' : 'Inactive'}
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUserDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (selectedUser) {
                  updateUserMutation.mutate({ 
                    id: selectedUser.id, 
                    data: {
                      firstName: selectedUser.firstName,
                      lastName: selectedUser.lastName,
                      email: selectedUser.email,
                      phone: selectedUser.phone,
                      role: selectedUser.role,
                      isActive: selectedUser.isActive,
                    }
                  });
                }
              }}
              disabled={updateUserMutation.isPending}
            >
              {updateUserMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the booking
              {itemToDelete?.name && ` for "${itemToDelete.name}"`}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteBookingMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
