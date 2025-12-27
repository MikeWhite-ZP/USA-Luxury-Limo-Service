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
  LayoutGrid
} from 'lucide-react';
import { format } from 'date-fns';
import { BookingDetailsDialog } from '@/components/BookingDetailsDialog';
import { ThemeToggleMobile } from '@/components/ThemeToggle';

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
  flightDepartureTerminal: '',
  flightArrivalTerminal: '',
  flightBaggageClaim: '',
  specialInstructions: '',
  billReference: '',
  status: 'pending',
  paymentMethod: 'pay_now',
  adminDiscount: '',
  customPriceItems: [],
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
  driverPayment?: string;
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
  flightDepartureTerminal?: string;
  flightArrivalTerminal?: string;
  flightBaggageClaim?: string;
  paymentMethod?: string;
  regularPrice?: string;
  adminDiscount?: string;
  customPriceItems?: Array<{ description: string; amount: number; addedBy?: string; addedAt?: string; }>;
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
  
  // Driver assignment dialog states
  const [assignDriverDialogOpen, setAssignDriverDialogOpen] = useState(false);
  const [assigningBooking, setAssigningBooking] = useState<Booking | null>(null);
  const [assignDialogDriverId, setAssignDialogDriverId] = useState('');
  const [assignDialogTotalPrice, setAssignDialogTotalPrice] = useState('');
  const [assignDialogDriverPayment, setAssignDialogDriverPayment] = useState('');

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
        requestedHours: formData.bookingType === 'hourly' ? parseInt(formData.requestedHours) || null : null,
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
        flightDepartureTerminal: formData.flightDepartureTerminal || null,
        flightArrivalTerminal: formData.flightArrivalTerminal || null,
        flightBaggageClaim: formData.flightBaggageClaim || null,
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
        requestedHours: bookingFormData.requestedHours ? parseInt(bookingFormData.requestedHours) : undefined,
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
          flightDepartureTerminal: data[0].departureTerminal || '',
          flightArrivalTerminal: data[0].arrivalTerminal || '',
          flightBaggageClaim: data[0].baggageClaim || '',
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
      const response = await fetch(`/api/admin/bookings/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete booking');
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/bookings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/dashboard-stats'] });
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
      toast({ title: 'Success', description: 'Booking deleted successfully' });
    },
    onError: (error: Error) => {
      setDeleteConfirmOpen(false);
      toast({ 
        title: 'Cannot Delete Booking', 
        description: error.message, 
        variant: 'destructive',
        duration: 6000,
      });
    },
  });

  // Assign driver mutation
  const assignDriverMutation = useMutation({
    mutationFn: async ({ bookingId, driverId, driverPayment, totalAmount }: { bookingId: string; driverId: string; driverPayment: string; totalAmount?: string }) => {
      const response = await apiRequest('PATCH', `/api/admin/bookings/${bookingId}/assign-driver`, {
        driverId,
        driverPayment: parseFloat(driverPayment) || 0,
        totalAmount: totalAmount ? parseFloat(totalAmount) : undefined,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/bookings'] });
      setAssignDriverDialogOpen(false);
      setAssigningBooking(null);
      toast({ title: 'Success', description: 'Driver assigned successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Open assign driver dialog
  const handleOpenAssignDriver = (booking: Booking) => {
    setAssigningBooking(booking);
    setAssignDialogDriverId(booking.driverId || '');
    setAssignDialogTotalPrice(booking.totalAmount || '0');
    // Use existing driver payment if available, otherwise calculate 70% of total
    const existingDriverPayment = booking.driverPayment;
    if (existingDriverPayment && parseFloat(existingDriverPayment) > 0) {
      setAssignDialogDriverPayment(existingDriverPayment);
    } else {
      setAssignDialogDriverPayment((parseFloat(booking.totalAmount || '0') * 0.7).toFixed(2));
    }
    setAssignDriverDialogOpen(true);
  };

  // Confirm driver assignment from dialog
  const handleConfirmAssignDriver = () => {
    if (!assigningBooking || !assignDialogDriverId) {
      toast({ title: 'Error', description: 'Please select a driver', variant: 'destructive' });
      return;
    }
    assignDriverMutation.mutate({
      bookingId: assigningBooking.id,
      driverId: assignDialogDriverId,
      driverPayment: assignDialogDriverPayment,
      totalAmount: assignDialogTotalPrice,
    });
  };

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
      flightDepartureTerminal: booking.flightDepartureTerminal || '',
      flightArrivalTerminal: booking.flightArrivalTerminal || '',
      flightBaggageClaim: booking.flightBaggageClaim || '',
      specialInstructions: booking.specialInstructions || '',
      billReference: booking.billReference || '',
      status: (booking.status as any) || 'pending',
      paymentMethod: (booking.paymentMethod as any) || 'pay_now',
      adminDiscount: booking.adminDiscount || '',
      customPriceItems: booking.customPriceItems || [],
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
    const config = statusConfig[status] || { color: 'bg-muted text-foreground', label: status };
    return <Badge className={`${config.color} font-medium`}>{config.label}</Badge>;
  };

  const getRoleBadge = (role: string) => {
    const roleConfig: Record<string, { color: string; label: string }> = {
      admin: { color: 'bg-purple-100 text-purple-800', label: 'Admin' },
      driver: { color: 'bg-blue-100 text-blue-800', label: 'Driver' },
      dispatcher: { color: 'bg-orange-100 text-orange-800', label: 'Dispatcher' },
      passenger: { color: 'bg-green-100 text-green-800', label: 'Passenger' },
    };
    const config = roleConfig[role] || { color: 'bg-muted text-foreground', label: role };
    return <Badge className={`${config.color} font-medium`}>{config.label}</Badge>;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-muted pb-20">
      {/* Header with safe area for phone notch/camera */}
      <header className="bg-gradient-to-r from-slate-900 to-blue-900 text-white px-4 pb-4 pt-[54px] sticky top-0 z-40">
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
              <h1 className="font-bold text-[16px]">Admin Panel</h1>
              <p className="text-xs text-blue-200">Welcome, {user.firstName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggleMobile className="bg-white/10 hover:bg-white/20" />
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-background/10"
              onClick={handleRefresh}
            >
              <RefreshCw className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-background/10"
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
            className="absolute right-0 top-0 h-full w-64 bg-background shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b bg-muted">
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
            {/* Stats Grid - Professional Ultra-Compact 6-Column */}
            <div className="grid grid-cols-6 gap-1 mb-4">
              <Card className="col-span-1 border-0 shadow-sm bg-background p-0">
                <CardContent className="p-1.5 flex flex-col items-center justify-center text-center">
                  <DollarSign className="h-3.5 w-3.5 text-blue-600 mb-0.5" />
                  <p className="text-[10px] font-medium text-muted-foreground leading-none">Rev</p>
                  <p className="text-sm font-bold text-foreground mt-0.5">${statsLoading ? '...' : Math.round(parseFloat(stats?.monthlyRevenue || '0') / 1000) + 'k'}</p>
                </CardContent>
              </Card>

              <Card className="col-span-1 border-0 shadow-sm bg-background p-0">
                <CardContent className="p-1.5 flex flex-col items-center justify-center text-center">
                  <Calendar className="h-3.5 w-3.5 text-green-600 mb-0.5" />
                  <p className="text-[10px] font-medium text-muted-foreground leading-none">Rides</p>
                  <p className="text-sm font-bold text-foreground mt-0.5">{statsLoading ? '...' : stats?.activeBookings || 0}</p>
                </CardContent>
              </Card>

              <Card className="col-span-1 border-0 shadow-sm bg-background p-0">
                <CardContent className="p-1.5 flex flex-col items-center justify-center text-center">
                  <Users className="h-3.5 w-3.5 text-purple-600 mb-0.5" />
                  <p className="text-[10px] font-medium text-muted-foreground leading-none">Driv</p>
                  <p className="text-sm font-bold text-foreground mt-0.5">{statsLoading ? '...' : stats?.activeDrivers || 0}</p>
                </CardContent>
              </Card>

              <Card className="col-span-1 border-0 shadow-sm bg-background p-0">
                <CardContent className="p-1.5 flex flex-col items-center justify-center text-center">
                  <AlertCircle className="h-3.5 w-3.5 text-orange-600 mb-0.5" />
                  <p className="text-[10px] font-medium text-muted-foreground leading-none">Pend</p>
                  <p className="text-sm font-bold text-foreground mt-0.5 text-orange-600">{statsLoading ? '...' : stats?.pendingBookings || 0}</p>
                </CardContent>
              </Card>

              <Card className="col-span-1 border-0 shadow-sm bg-background p-0">
                <CardContent className="p-1.5 flex flex-col items-center justify-center text-center">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 mb-0.5" />
                  <p className="text-[10px] font-medium text-muted-foreground leading-none">Done</p>
                  <p className="text-sm font-bold text-foreground mt-0.5">24</p>
                </CardContent>
              </Card>

              <Card className="col-span-1 border-0 shadow-sm bg-background p-0">
                <CardContent className="p-1.5 flex flex-col items-center justify-center text-center">
                  <Clock className="h-3.5 w-3.5 text-indigo-600 mb-0.5" />
                  <p className="text-[10px] font-medium text-muted-foreground leading-none">Soon</p>
                  <p className="text-sm font-bold text-foreground mt-0.5">3</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Bookings - Professional Compact List */}
            <Card className="border-0 shadow-sm overflow-hidden">
              <CardHeader className="pb-2 pt-4 px-4 bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Recent Activity</CardTitle>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setActiveSection('bookings')}
                    className="h-7 px-2 text-[11px] font-bold text-[#1d06c7] bg-[#d1ddeb] hover:bg-blue-50"
                  >
                    VIEW ALL
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {bookingsLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {filteredBookings.slice(0, 5).map((booking) => (
                      <div 
                        key={booking.id}
                        className="p-3 bg-background hover:bg-muted/30 transition-colors flex items-center gap-3 active:bg-muted/50 touch-manipulation"
                        onClick={() => setSelectedBooking(booking)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <p className="font-bold text-foreground truncate text-[10px]">{booking.passengerName || 'Guest'}</p>
                            <span className="font-bold text-[12px] text-[#1fa308]">${booking.totalAmount}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <MapPin className="w-3 h-3 flex-shrink-0" />
                              <p className="truncate text-[#0000f7] text-[12px] text-left font-thin">{booking.pickupAddress}</p>
                            </div>
                            <div className="flex items-center gap-1.5 ml-2">
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                                booking.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                                booking.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                                booking.status === 'completed' ? 'bg-green-100 text-green-700' :
                                'bg-muted text-muted-foreground'
                              }`}>
                                {booking.status?.split('_')[0]}
                              </span>
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                )}
                {!bookingsLoading && filteredBookings.length === 0 && (
                  <p className="text-center text-xs text-muted-foreground py-6">No recent activity</p>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions - Professional High-Density Grid */}
            <Card className="border-0 shadow-sm bg-background">
              <CardHeader className="pb-2 pt-4 px-4 bg-muted/30">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4 text-blue-600" />
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Quick Actions</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-3">
                <div className="grid grid-cols-4 gap-2">
                  <Button
                    variant="outline"
                    className="h-auto py-3 flex flex-col items-center gap-1 border-muted hover:bg-muted/50 transition-all active:scale-95 px-1"
                    onClick={() => setActiveSection('bookings')}
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-[10px] font-bold text-foreground uppercase tracking-tight">Rides</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-3 flex flex-col items-center gap-1 border-muted hover:bg-muted/50 transition-all active:scale-95 px-1"
                    onClick={() => setActiveSection('users')}
                  >
                    <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                      <Users className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-[10px] font-bold text-foreground uppercase tracking-tight">Users</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-3 flex flex-col items-center gap-1 border-muted hover:bg-muted/50 transition-all active:scale-95 px-1"
                    onClick={() => setActiveSection('vehicles')}
                  >
                    <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center">
                      <Car className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className="text-[10px] font-bold text-foreground uppercase tracking-tight">Fleet</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-3 flex flex-col items-center gap-1 border-muted hover:bg-muted/50 transition-all active:scale-95 px-1"
                    onClick={() => setActiveSection('settings')}
                  >
                    <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center">
                      <Settings className="w-4 h-4 text-orange-600" />
                    </div>
                    <span className="text-[10px] font-bold text-foreground uppercase tracking-tight">Setup</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeSection === 'bookings' && (
          <div className="space-y-2">
            {/* Compact Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Bookings</h2>
              </div>
              <Button
                onClick={handleOpenNewBooking}
                size="sm"
                className="h-7 px-2 text-[11px] font-bold bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                NEW
              </Button>
            </div>

            {/* Compact Search and Filter */}
            <div className="flex gap-1.5">
              <div className="flex-1 relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-24 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="in_progress">Active</SelectItem>
                  <SelectItem value="completed">Done</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Ultra-Compact Bookings List */}
            <Card className="border-0 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                {bookingsLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {filteredBookings.map((booking) => (
                      <div 
                        key={booking.id}
                        className="p-2.5 bg-background hover:bg-muted/30 transition-colors"
                      >
                        {/* Row 1: Name, Status, Price */}
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <p className="font-bold text-[11px] text-foreground truncate">{booking.passengerName || 'Guest'}</p>
                            <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase flex-shrink-0 ${
                              booking.status === 'pending' || booking.status === 'pending_driver_acceptance' ? 'bg-orange-100 text-orange-700' :
                              booking.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                              booking.status === 'in_progress' ? 'bg-indigo-100 text-indigo-700' :
                              booking.status === 'completed' ? 'bg-green-100 text-green-700' :
                              booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                              'bg-muted text-muted-foreground'
                            }`}>
                              {booking.status?.replace('pending_driver_acceptance', 'pending').split('_')[0]}
                            </span>
                          </div>
                          <span className="font-bold text-[12px] text-green-600 flex-shrink-0">${booking.totalAmount}</span>
                        </div>
                        
                        {/* Row 2: Route Summary */}
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1.5">
                          <MapPin className="w-3 h-3 text-green-600 flex-shrink-0" />
                          <span className="truncate flex-1">{booking.pickupAddress?.split(',')[0]}</span>
                          <ChevronRight className="w-3 h-3 flex-shrink-0" />
                          <MapPin className="w-3 h-3 text-red-600 flex-shrink-0" />
                          <span className="truncate flex-1">{(booking.destinationAddress || booking.dropoffAddress)?.split(',')[0] || 'TBD'}</span>
                        </div>

                        {/* Row 3: Date/Time and Driver */}
                        <div className="flex items-center justify-between text-[9px] text-muted-foreground mb-1.5">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{booking.scheduledDateTime 
                              ? format(new Date(booking.scheduledDateTime), 'MMM d, h:mm a')
                              : booking.pickupDate 
                                ? format(new Date(booking.pickupDate), 'MMM d, h:mm a')
                                : 'No date'}</span>
                          </div>
                          {booking.driverName && (
                            <span className="text-[8px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                              {booking.driverName.split(' ')[0]}
                            </span>
                          )}
                        </div>

                        {/* Row 4: Ultra-Compact Action Icons */}
                        <div className="flex items-center gap-1 pt-1.5 border-t border-border/50">
                          <button
                            onClick={() => handleEditBooking(booking)}
                            className="p-1.5 rounded bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          
                          {!['cancelled', 'completed'].includes(booking.status) && (
                            <button
                              onClick={() => handleOpenAssignDriver(booking)}
                              className={`p-1.5 rounded transition-colors ${
                                booking.driverId 
                                  ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' 
                                  : 'bg-blue-600 text-white hover:bg-blue-700'
                              }`}
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                            </button>
                          )}
                          
                          {(booking.status === 'pending' || booking.status === 'pending_driver_acceptance') && (
                            <>
                              <button
                                onClick={() => updateBookingMutation.mutate({ id: booking.id, status: 'confirmed' })}
                                className="p-1.5 rounded bg-green-600 text-white hover:bg-green-700 transition-colors"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => updateBookingMutation.mutate({ id: booking.id, status: 'cancelled' })}
                                className="p-1.5 rounded bg-orange-100 text-orange-600 hover:bg-orange-200 transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          
                          <button
                            onClick={() => handleDeleteBooking(booking)}
                            className="p-1.5 rounded bg-red-50 text-red-600 hover:bg-red-100 transition-colors ml-auto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {!bookingsLoading && filteredBookings.length === 0 && (
                  <p className="text-center text-xs text-muted-foreground py-6">No bookings found</p>
                )}
              </CardContent>
            </Card>
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
                        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-semibold">{userItem.firstName} {userItem.lastName}</p>
                          <p className="text-sm text-muted-foreground">{userItem.email}</p>
                        </div>
                      </div>
                      {getRoleBadge(userItem.role)}
                    </div>
                    
                    <div className="flex items-center justify-between pt-3 border-t mt-3">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
                  <CardContent className="py-8 text-center text-muted-foreground">
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
                        <div className="w-20 h-16 bg-muted rounded-lg flex items-center justify-center">
                          <Car className="w-8 h-8 text-slate-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold">{vehicle.name}</p>
                            <p className="text-sm text-muted-foreground">{vehicle.type}</p>
                          </div>
                          <Badge variant={vehicle.isActive ? 'default' : 'secondary'}>
                            {vehicle.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="text-muted-foreground">
                            Base: <span className="font-medium">${vehicle.baseRate}</span>
                          </span>
                          <span className="text-muted-foreground">
                            Per Mile: <span className="font-medium">${vehicle.perMileRate}</span>
                          </span>
                          <span className="text-muted-foreground">
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
                  <CardContent className="py-8 text-center text-muted-foreground">
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
                    <p className="text-sm text-muted-foreground">Manage pricing and rates</p>
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
                    <p className="text-sm text-muted-foreground">Logo, colors, and content</p>
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
                    <p className="text-sm text-muted-foreground">Configure email settings</p>
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
                    <p className="text-sm text-muted-foreground">Manage payment providers</p>
                  </div>
                  <ChevronRight className="w-5 h-5 ml-auto text-slate-400" />
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-muted">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground text-center">
                  For advanced settings, use the full admin dashboard on desktop.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
      {/* Bottom Navigation - Ultra Compact for iPhone SE */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg z-50 safe-area-pb">
        <div className="flex items-center justify-evenly py-1.5 px-1">
          <button
            onClick={() => { setActiveSection('dashboard'); setSearchQuery(''); }}
            className={`flex flex-col items-center gap-0.5 py-1.5 px-1 min-w-0 flex-1 rounded transition-colors ${
              activeSection === 'dashboard' ? 'text-blue-600' : 'text-muted-foreground'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] font-medium truncate">Home</span>
          </button>
          <button
            onClick={() => { setActiveSection('bookings'); setSearchQuery(''); }}
            className={`flex flex-col items-center gap-0.5 py-1.5 px-1 min-w-0 flex-1 rounded transition-colors ${
              activeSection === 'bookings' ? 'text-blue-600' : 'text-muted-foreground'
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span className="text-[10px] font-medium truncate">Rides</span>
          </button>
          <button
            onClick={() => { setActiveSection('users'); setSearchQuery(''); }}
            className={`flex flex-col items-center gap-0.5 py-1.5 px-1 min-w-0 flex-1 rounded transition-colors ${
              activeSection === 'users' ? 'text-blue-600' : 'text-muted-foreground'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px] font-medium truncate">Users</span>
          </button>
          <button
            onClick={() => { setActiveSection('vehicles'); setSearchQuery(''); }}
            className={`flex flex-col items-center gap-0.5 py-1.5 px-1 min-w-0 flex-1 rounded transition-colors ${
              activeSection === 'vehicles' ? 'text-blue-600' : 'text-muted-foreground'
            }`}
          >
            <Car className="w-5 h-5" />
            <span className="text-[10px] font-medium truncate">Fleet</span>
          </button>
          <button
            onClick={() => { setActiveSection('settings'); setSearchQuery(''); }}
            className={`flex flex-col items-center gap-0.5 py-1.5 px-1 min-w-0 flex-1 rounded transition-colors ${
              activeSection === 'settings' ? 'text-blue-600' : 'text-muted-foreground'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="text-[10px] font-medium truncate">Setup</span>
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
      {/* Assign Driver Dialog */}
      <Dialog open={assignDriverDialogOpen} onOpenChange={setAssignDriverDialogOpen}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle>
              {assigningBooking?.driverId ? 'Reassign Driver' : 'Assign Driver'}
            </DialogTitle>
            <DialogDescription>
              Select a driver and adjust pricing if needed
            </DialogDescription>
          </DialogHeader>
          
          {assigningBooking && (
            <div className="space-y-4 py-4">
              {/* Booking Info */}
              <div className="bg-muted p-3 rounded-lg text-sm">
                <p className="font-medium">{assigningBooking.passengerName || 'Guest'}</p>
                <p className="text-muted-foreground truncate">{assigningBooking.pickupAddress}</p>
                <p className="text-muted-foreground truncate">→ {assigningBooking.destinationAddress || 'No destination'}</p>
              </div>

              {/* Current Driver (if reassigning) */}
              {assigningBooking.driverName && (
                <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">Current: <strong>{assigningBooking.driverName}</strong></span>
                </div>
              )}

              {/* Select Driver */}
              <div>
                <Label>Select Driver</Label>
                <Select 
                  value={assignDialogDriverId} 
                  onValueChange={setAssignDialogDriverId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a driver" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeDrivers?.filter(driver => driver.id).map((driver) => (
                      <SelectItem key={driver.id} value={driver.id}>
                        {driver.firstName} {driver.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Total Price (Editable) */}
              <div>
                <Label>Total Price ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={assignDialogTotalPrice}
                  onChange={(e) => {
                    setAssignDialogTotalPrice(e.target.value);
                    // Auto-calculate driver payment at 70%
                    const total = parseFloat(e.target.value) || 0;
                    setAssignDialogDriverPayment((total * 0.7).toFixed(2));
                  }}
                  placeholder="Enter total price"
                />
              </div>

              {/* Driver Payment (Editable) */}
              <div>
                <Label>Driver Payment ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={assignDialogDriverPayment}
                  onChange={(e) => setAssignDialogDriverPayment(e.target.value)}
                  placeholder="Enter driver payment"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {assignDialogTotalPrice && assignDialogDriverPayment ? 
                    `${((parseFloat(assignDialogDriverPayment) / parseFloat(assignDialogTotalPrice)) * 100).toFixed(0)}% of total` : 
                    'Default: 70% of total'
                  }
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setAssignDriverDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmAssignDriver}
              disabled={assignDriverMutation.isPending || !assignDialogDriverId}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {assignDriverMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4 mr-2" />
                  {assigningBooking?.driverId ? 'Reassign Driver' : 'Assign Driver'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
