import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Car, DollarSign, MapPin, Star, Calendar, User, FileText, Settings, CheckCircle2, Navigation2, Phone, MessageSquare, MoreVertical, Bell, LogOut, Upload, CheckCircle, XCircle, Clock, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import { ThemeToggleMobile } from '@/components/ThemeToggle';

interface DriverDocument {
  id: string;
  driverId: string;
  documentType: 'driver_license' | 'limo_license' | 'insurance_certificate' | 'vehicle_image' | 'profile_photo';
  documentUrl: string;
  expirationDate: string | null;
  vehiclePlate?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason: string | null;
  uploadedAt: string;
}

interface DriverData {
  id: number;
  userId: number;
  licenseNumber: string;
  vehicleType: string;
  isAvailable: boolean;
  isVerified: boolean;
  rating: number;
  completedRides: number;
}

interface Booking {
  id: number;
  passengerId: number;
  pickupAddress: string;
  viaAddress: string | null;
  destinationAddress: string;
  scheduledDateTime: string;
  serviceType: 'transfer' | 'hourly';
  duration: number | null;
  vehicleType: string;
  passengers: number;
  luggage: number;
  babySeat: boolean;
  finalPrice: number;
  driverPayment: string | null;
  status: string;
  passengerName?: string;
  passengerPhone?: string;
  passengerEmail?: string;
}

export default function MobileDriver() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  
  // View state for inline sections (home, documents, profile, account)
  const [currentView, setCurrentView] = useState<'home' | 'documents'>('home');
  
  // Document upload state
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [docFormData, setDocFormData] = useState({
    driverLicense: { file: null as File | null, expirationDate: '' },
    limoLicense: { file: null as File | null, expirationDate: '' },
    insuranceCertificate: { file: null as File | null, expirationDate: '' },
    vehicleImage: { file: null as File | null, vehiclePlate: '' },
    profilePhoto: { file: null as File | null },
  });

  // Fetch driver profile
  const { data: driver, isLoading: driverLoading } = useQuery<DriverData>({
    queryKey: ['/api/driver/profile'],
    retry: false,
  });

  // Track previous pending jobs count for new job notifications
  const prevPendingCountRef = useRef<number | null>(null);
  const [newJobAlert, setNewJobAlert] = useState(false);

  // Fetch driver bookings with 30-second auto-refresh
  const { data: bookings, isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ['/api/bookings'],
    retry: false,
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    refetchIntervalInBackground: false, // Only refresh when tab is visible
  });

  // Fetch driver documents
  const { data: documents, isLoading: documentsLoading } = useQuery<DriverDocument[]>({
    queryKey: ['/api/driver/documents'],
    retry: false,
    enabled: currentView === 'documents',
  });

  // Document upload mutation
  const uploadDocMutation = useMutation({
    mutationFn: async ({ documentType, file, expirationDate, vehiclePlate }: {
      documentType: string;
      file: File;
      expirationDate?: string;
      vehiclePlate?: string;
    }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);
      if (documentType === 'vehicle_image' && vehiclePlate) {
        formData.append('vehiclePlate', vehiclePlate);
      } else if (expirationDate) {
        formData.append('expirationDate', expirationDate);
      }
      const response = await fetch('/api/driver/documents/upload', {
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/driver/documents'] });
      if (variables.documentType === 'profile_photo') {
        queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      }
      toast({ title: "Document Uploaded", description: "Your document has been uploaded successfully." });
      setUploadingDoc(null);
      // Reset form for that document type
      setDocFormData(prev => ({
        ...prev,
        [variables.documentType === 'driver_license' ? 'driverLicense' :
         variables.documentType === 'limo_license' ? 'limoLicense' :
         variables.documentType === 'insurance_certificate' ? 'insuranceCertificate' :
         variables.documentType === 'vehicle_image' ? 'vehicleImage' : 'profilePhoto']: 
         variables.documentType === 'vehicle_image' ? { file: null, vehiclePlate: '' } : { file: null, expirationDate: '' }
      }));
    },
    onError: (error: Error) => {
      toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
      setUploadingDoc(null);
    },
  });

  // Helper functions for documents
  const getDocByType = (type: string) => documents?.find(doc => doc.documentType === type);
  const getDocStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge className="bg-green-600 text-white text-[8px] px-1.5 py-0.5"><CheckCircle className="w-2.5 h-2.5 mr-0.5" />OK</Badge>;
      case 'rejected': return <Badge variant="destructive" className="text-[8px] px-1.5 py-0.5"><XCircle className="w-2.5 h-2.5 mr-0.5" />Rej</Badge>;
      default: return <Badge variant="secondary" className="text-[8px] px-1.5 py-0.5"><Clock className="w-2.5 h-2.5 mr-0.5" />Pend</Badge>;
    }
  };
  const handleDocUpload = (docType: 'driver_license' | 'limo_license' | 'insurance_certificate' | 'vehicle_image' | 'profile_photo') => {
    let file: File | null = null;
    let expirationDate: string | undefined;
    let vehiclePlate: string | undefined;
    if (docType === 'driver_license') { file = docFormData.driverLicense.file; expirationDate = docFormData.driverLicense.expirationDate || undefined; }
    else if (docType === 'limo_license') { file = docFormData.limoLicense.file; expirationDate = docFormData.limoLicense.expirationDate || undefined; }
    else if (docType === 'insurance_certificate') { file = docFormData.insuranceCertificate.file; expirationDate = docFormData.insuranceCertificate.expirationDate || undefined; }
    else if (docType === 'vehicle_image') { file = docFormData.vehicleImage.file; vehiclePlate = docFormData.vehicleImage.vehiclePlate || undefined; }
    else if (docType === 'profile_photo') { file = docFormData.profilePhoto.file; }
    if (!file) { toast({ title: "No File", description: "Please select a file.", variant: "destructive" }); return; }
    if (file.size > 2 * 1024 * 1024) { toast({ title: "Too Large", description: "Max 2MB.", variant: "destructive" }); return; }
    setUploadingDoc(docType);
    uploadDocMutation.mutate({ documentType: docType, file, expirationDate, vehiclePlate });
  };

  // Detect new job assignments and show notification
  useEffect(() => {
    if (!bookings) return;
    
    const pendingJobs = bookings.filter(b => b.status === 'pending_driver_acceptance');
    const currentPendingCount = pendingJobs.length;
    
    // Check if new jobs arrived (compare with previous count)
    if (prevPendingCountRef.current !== null && currentPendingCount > prevPendingCountRef.current) {
      const newJobsCount = currentPendingCount - prevPendingCountRef.current;
      
      // Show visual notification
      setNewJobAlert(true);
      
      // Show toast notification
      toast({
        title: `${newJobsCount} New Job${newJobsCount > 1 ? 's' : ''} Available!`,
        description: "You have new job assignments waiting for acceptance.",
      });
      
      // Clear alert after 5 seconds
      setTimeout(() => setNewJobAlert(false), 5000);
    }
    
    // Update ref with current count
    prevPendingCountRef.current = currentPendingCount;
  }, [bookings, toast]);

  // Toggle availability mutation
  const toggleAvailabilityMutation = useMutation({
    mutationFn: async (isAvailable: boolean) => {
      const response = await apiRequest('PATCH', '/api/driver/availability', { isAvailable });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/driver/profile'] });
      toast({
        title: driver?.isAvailable ? "Going Offline" : "Going Online",
        description: driver?.isAvailable 
          ? "You won't receive new ride requests" 
          : "You're now available for new rides",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update availability",
        variant: "destructive",
      });
    },
  });

  // Update booking status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: number; status: string }) => {
      const response = await apiRequest('PATCH', `/api/bookings/${bookingId}/status`, { status });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/driver/profile'] });
      toast({
        title: "Status Updated",
        description: "Ride status has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    },
  });

  // Update driver location mutation
  const updateLocationMutation = useMutation({
    mutationFn: async (location: { lat: number; lng: number }) => {
      const response = await apiRequest('PATCH', '/api/driver/location', location);
      return await response.json();
    },
    onError: (error: Error) => {
      console.error('Failed to update driver location:', error);
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/logout');
      return response;
    },
    onSuccess: () => {
      queryClient.clear();
      setLocation('/mobile-splash');
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to logout",
        variant: "destructive",
      });
    },
  });

  // Check if driver has active bookings
  const hasActiveRide = (bookings: Booking[] | undefined) => {
    if (!bookings) return false;
    return bookings.some(b => 
      ['on_the_way', 'arrived', 'on_board', 'in_progress'].includes(b.status)
    );
  };

  // GPS Tracking with dynamic intervals
  useEffect(() => {
    // Always clear existing intervals first
    if (intervalIdRef.current !== null) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }

    const isOnDuty = hasActiveRide(bookings);
    
    // Track location if driver is available OR has active rides
    const shouldTrack = driver?.isAvailable || isOnDuty;
    
    if (!shouldTrack) {
      // Stop tracking when driver goes offline AND has no active rides
      return;
    }

    // Check if geolocation is supported
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your device');
      return;
    }

    // Determine update interval based on driver status
    const updateInterval = isOnDuty ? 30000 : 60000; // 30s on duty, 60s idle

    // Function to update location
    const updateLocation = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCurrentLocation(location);
          setLocationError(null);

          // Send location to backend
          updateLocationMutation.mutate(location);
        },
        (error) => {
          console.error('Geolocation error:', error);
          setLocationError(error.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000,
        }
      );
    };

    // Get initial location immediately
    updateLocation();

    // Set up interval for periodic updates
    intervalIdRef.current = setInterval(updateLocation, updateInterval);

    // Cleanup on unmount or dependency change
    return () => {
      if (intervalIdRef.current !== null) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    };
  }, [driver?.isAvailable, bookings]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_driver_acceptance': return 'bg-purple-50 text-purple-700 border border-purple-200';
      case 'confirmed': return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'on_the_way': return 'bg-indigo-50 text-indigo-700 border border-indigo-200';
      case 'arrived': return 'bg-cyan-50 text-cyan-700 border border-cyan-200';
      case 'on_board': return 'bg-teal-50 text-teal-700 border border-teal-200';
      case 'in_progress': return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'completed': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'cancelled': return 'bg-red-50 text-red-700 border border-red-200';
      default: return 'bg-muted text-muted-foreground border border-border';
    }
  };

  const getStatusNextAction = (status: string) => {
    switch (status) {
      case 'pending_driver_acceptance': return { label: 'Accept Job', nextStatus: 'confirmed' };
      case 'confirmed': return { label: 'Start Trip', nextStatus: 'on_the_way' };
      case 'on_the_way': return { label: 'Arrived', nextStatus: 'arrived' };
      case 'arrived': return { label: 'Passenger On Board', nextStatus: 'on_board' };
      case 'on_board': return { label: 'Start Service', nextStatus: 'in_progress' };
      case 'in_progress': return { label: 'Complete Ride', nextStatus: 'completed' };
      default: return null;
    }
  };

  // Check if driver can start trip (within 150 minutes of scheduled time)
  const canStartTrip = (booking: Booking) => {
    if (booking.status !== 'confirmed' || !booking.scheduledDateTime) return true;
    
    const now = new Date();
    const scheduledTime = new Date(booking.scheduledDateTime);
    const minutesUntilPickup = (scheduledTime.getTime() - now.getTime()) / (1000 * 60);
    
    return minutesUntilPickup <= 150;
  };

  // Get minutes until trip can be started
  const getMinutesUntilCanStart = (booking: Booking) => {
    if (!booking.scheduledDateTime) return 0;
    
    const now = new Date();
    const scheduledTime = new Date(booking.scheduledDateTime);
    const minutesUntilPickup = (scheduledTime.getTime() - now.getTime()) / (1000 * 60);
    const minutesUntilCanStart = minutesUntilPickup - 150;
    
    return Math.max(0, Math.ceil(minutesUntilCanStart));
  };

  // Check if trip has started (determines if contact buttons are active)
  const isTripActive = (status: string) => {
    return ['on_the_way', 'arrived', 'on_board', 'in_progress'].includes(status);
  };

  // Open navigation with specific app - supports Google Maps, Apple Maps, and Waze
  const openNavigationApp = (address: string, app: 'google' | 'apple' | 'waze') => {
    const encodedAddress = encodeURIComponent(address);
    
    const urls = {
      google: `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`,
      apple: `http://maps.apple.com/?daddr=${encodedAddress}`,
      waze: `https://waze.com/ul?q=${encodedAddress}&navigate=yes`
    };
    
    switch (app) {
      case 'google':
        window.open(urls.google, '_blank');
        break;
      case 'apple':
        // Apple Maps URL works on iOS and redirects to maps app
        window.open(urls.apple, '_blank');
        break;
      case 'waze':
        window.open(urls.waze, '_blank');
        break;
    }
  };

  // Filter bookings - include all active driver workflow statuses
  const upcomingBookings = bookings?.filter(b => 
    ['pending_driver_acceptance', 'confirmed', 'on_the_way', 'arrived', 'on_board', 'in_progress'].includes(b.status)
  ) || [];
  
  const completedBookings = bookings?.filter(b => 
    b.status === 'completed'
  ) || [];

  // Calculate today's earnings
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEarnings = completedBookings
    .filter(b => b.scheduledDateTime && new Date(b.scheduledDateTime) >= today)
    .reduce((sum, b) => sum + (parseFloat(b.driverPayment || '0') || 0), 0);

  const completedToday = completedBookings
    .filter(b => b.scheduledDateTime && new Date(b.scheduledDateTime) >= today).length;

  if (driverLoading || bookingsLoading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-3" style={{ borderColor: 'var(--brand-accent-hex)', borderTopColor: 'transparent' }}></div>
          <p className="text-muted-foreground">Loading driver dashboard...</p>
        </div>
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center p-6">
        <Card className="max-w-md w-full bg-background shadow-sm border border-border">
          <CardContent className="p-6 text-center">
            <Car className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--brand-accent-hex)' }} />
            <h2 className="text-xl font-bold mb-2 text-foreground">Driver Profile Not Found</h2>
            <p className="text-muted-foreground mb-4">
              You need to complete your driver profile to access this dashboard.
            </p>
            <Button 
              onClick={() => setLocation('/driver-dashboard')}
              className="text-white" style={{ backgroundColor: 'var(--brand-button-primary-hex)' }}
              data-testid="button-setup-profile"
            >
              Set Up Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      {/* Header with safe area for phone notch/camera */}
      <div className="bg-background border-b border-border p-6 pt-[54px] shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-bold text-foreground text-[22px]" data-testid="header-title">Driver Dashboard</h1>
          <div className="flex items-center gap-2">
            <ThemeToggleMobile />
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:bg-muted"
                data-testid="button-menu"
              >
                <Settings className="w-6 h-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-background">
              <DropdownMenuItem
                onClick={() => setCurrentView('documents')}
                className="flex items-center gap-2 cursor-pointer hover:bg-muted"
                data-testid="menu-documents"
              >
                <FileText className="w-4 h-4" style={{ color: 'var(--brand-accent-hex)' }} />
                <span className="text-muted-foreground">Documents</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setLocation('/mobile-driver/profile')}
                className="flex items-center gap-2 cursor-pointer hover:bg-muted"
                data-testid="menu-profile"
              >
                <User className="w-4 h-4" style={{ color: 'var(--brand-accent-hex)' }} />
                <span className="text-muted-foreground">Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setLocation('/mobile-driver/account')}
                className="flex items-center gap-2 cursor-pointer hover:bg-muted"
                data-testid="menu-account"
              >
                <Settings className="w-4 h-4" style={{ color: 'var(--brand-accent-hex)' }} />
                <span className="text-muted-foreground">Account</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => logoutMutation.mutate()}
                className="flex items-center gap-2 cursor-pointer hover:bg-destructive/10 text-destructive"
                data-testid="menu-logout"
                disabled={logoutMutation.isPending}
              >
                <LogOut className="w-4 h-4" />
                <span>{logoutMutation.isPending ? 'Logging out...' : 'Logout'}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </div>

        {/* Availability Toggle - Ultra Compact */}
        <button
          onClick={() => {
            if (!toggleAvailabilityMutation.isPending) {
              toggleAvailabilityMutation.mutate(!driver.isAvailable);
            }
          }}
          disabled={toggleAvailabilityMutation.isPending}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border transition-all active:scale-[0.98] ${
            driver.isAvailable 
              ? 'bg-emerald-50 border-emerald-200' 
              : 'bg-gray-50 border-gray-200'
          }`}
          data-testid="button-toggle-availability"
        >
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              toggleAvailabilityMutation.isPending 
                ? 'bg-yellow-400 animate-pulse' 
                : driver.isAvailable 
                  ? 'bg-emerald-500' 
                  : 'bg-gray-400'
            }`} />
            <span className={`text-xs font-semibold ${driver.isAvailable ? 'text-emerald-700' : 'text-gray-600'}`}>
              {toggleAvailabilityMutation.isPending 
                ? (driver.isAvailable ? 'Going Offline...' : 'Going Online...') 
                : (driver.isAvailable ? 'Online' : 'Offline')
              }
            </span>
            {driver.isAvailable && (
              <span className="flex items-center gap-1 text-[10px] text-emerald-600" data-testid="text-gps-status">
                <Navigation2 className={`w-2.5 h-2.5 ${currentLocation ? 'animate-pulse' : 'opacity-50'}`} />
                {locationError ? 'GPS Error' : currentLocation ? `GPS ${hasActiveRide(bookings) ? '30s' : '60s'}` : 'GPS...'}
              </span>
            )}
          </div>
          <Switch
            checked={driver.isAvailable}
            disabled={toggleAvailabilityMutation.isPending}
            className="pointer-events-none scale-90"
            data-testid="switch-availability"
          />
        </button>
      </div>
      {/* Documents View - Inline */}
      {currentView === 'documents' && (
        <div className="px-3 py-3 space-y-2">
          {/* Back to Home Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentView('home')}
            className="mb-2 text-xs text-muted-foreground hover:bg-muted"
          >
            <ArrowLeft className="w-3 h-3 mr-1" />
            Back to Dashboard
          </Button>

          <h2 className="text-sm font-bold text-foreground mb-2">My Documents</h2>

          {documentsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Driver License */}
              <Card className="border border-border bg-background">
                <CardContent className="p-2.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-green-600" />
                      <span className="text-xs font-semibold text-foreground">Driver License</span>
                    </div>
                    {getDocByType('driver_license') && getDocStatusBadge(getDocByType('driver_license')!.status)}
                  </div>
                  {getDocByType('driver_license')?.expirationDate && (
                    <p className="text-[10px] text-muted-foreground">Exp: {new Date(getDocByType('driver_license')!.expirationDate!).toLocaleDateString()}</p>
                  )}
                  <div className="flex gap-1.5">
                    <Input
                      type="file"
                      accept="image/*,application/pdf"
                      capture="environment"
                      onChange={(e) => setDocFormData(prev => ({ ...prev, driverLicense: { ...prev.driverLicense, file: e.target.files?.[0] || null } }))}
                      className="h-7 text-[10px] flex-1"
                    />
                    <Input
                      type="date"
                      placeholder="Exp"
                      value={docFormData.driverLicense.expirationDate}
                      onChange={(e) => setDocFormData(prev => ({ ...prev, driverLicense: { ...prev.driverLicense, expirationDate: e.target.value } }))}
                      className="h-7 text-[10px] w-24"
                    />
                  </div>
                  <Button
                    onClick={() => handleDocUpload('driver_license')}
                    disabled={!docFormData.driverLicense.file || uploadingDoc === 'driver_license'}
                    size="sm"
                    className="w-full h-7 text-[10px] bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Upload className="w-3 h-3 mr-1" />
                    {uploadingDoc === 'driver_license' ? 'Uploading...' : 'Upload'}
                  </Button>
                </CardContent>
              </Card>

              {/* Limo License */}
              <Card className="border border-border bg-background">
                <CardContent className="p-2.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-green-600" />
                      <span className="text-xs font-semibold text-foreground">Limo License</span>
                    </div>
                    {getDocByType('limo_license') && getDocStatusBadge(getDocByType('limo_license')!.status)}
                  </div>
                  {getDocByType('limo_license')?.expirationDate && (
                    <p className="text-[10px] text-muted-foreground">Exp: {new Date(getDocByType('limo_license')!.expirationDate!).toLocaleDateString()}</p>
                  )}
                  <div className="flex gap-1.5">
                    <Input
                      type="file"
                      accept="image/*,application/pdf"
                      capture="environment"
                      onChange={(e) => setDocFormData(prev => ({ ...prev, limoLicense: { ...prev.limoLicense, file: e.target.files?.[0] || null } }))}
                      className="h-7 text-[10px] flex-1"
                    />
                    <Input
                      type="date"
                      placeholder="Exp"
                      value={docFormData.limoLicense.expirationDate}
                      onChange={(e) => setDocFormData(prev => ({ ...prev, limoLicense: { ...prev.limoLicense, expirationDate: e.target.value } }))}
                      className="h-7 text-[10px] w-24"
                    />
                  </div>
                  <Button
                    onClick={() => handleDocUpload('limo_license')}
                    disabled={!docFormData.limoLicense.file || uploadingDoc === 'limo_license'}
                    size="sm"
                    className="w-full h-7 text-[10px] bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Upload className="w-3 h-3 mr-1" />
                    {uploadingDoc === 'limo_license' ? 'Uploading...' : 'Upload'}
                  </Button>
                </CardContent>
              </Card>

              {/* Insurance Certificate */}
              <Card className="border border-border bg-background">
                <CardContent className="p-2.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-green-600" />
                      <span className="text-xs font-semibold text-foreground">Insurance</span>
                    </div>
                    {getDocByType('insurance_certificate') && getDocStatusBadge(getDocByType('insurance_certificate')!.status)}
                  </div>
                  {getDocByType('insurance_certificate')?.expirationDate && (
                    <p className="text-[10px] text-muted-foreground">Exp: {new Date(getDocByType('insurance_certificate')!.expirationDate!).toLocaleDateString()}</p>
                  )}
                  <div className="flex gap-1.5">
                    <Input
                      type="file"
                      accept="image/*,application/pdf"
                      capture="environment"
                      onChange={(e) => setDocFormData(prev => ({ ...prev, insuranceCertificate: { ...prev.insuranceCertificate, file: e.target.files?.[0] || null } }))}
                      className="h-7 text-[10px] flex-1"
                    />
                    <Input
                      type="date"
                      placeholder="Exp"
                      value={docFormData.insuranceCertificate.expirationDate}
                      onChange={(e) => setDocFormData(prev => ({ ...prev, insuranceCertificate: { ...prev.insuranceCertificate, expirationDate: e.target.value } }))}
                      className="h-7 text-[10px] w-24"
                    />
                  </div>
                  <Button
                    onClick={() => handleDocUpload('insurance_certificate')}
                    disabled={!docFormData.insuranceCertificate.file || uploadingDoc === 'insurance_certificate'}
                    size="sm"
                    className="w-full h-7 text-[10px] bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Upload className="w-3 h-3 mr-1" />
                    {uploadingDoc === 'insurance_certificate' ? 'Uploading...' : 'Upload'}
                  </Button>
                </CardContent>
              </Card>

              {/* Vehicle Image */}
              <Card className="border border-border bg-background">
                <CardContent className="p-2.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4 text-green-600" />
                      <span className="text-xs font-semibold text-foreground">Vehicle Photo</span>
                    </div>
                    {getDocByType('vehicle_image') && getDocStatusBadge(getDocByType('vehicle_image')!.status)}
                  </div>
                  {getDocByType('vehicle_image')?.vehiclePlate && (
                    <p className="text-[10px] text-muted-foreground">Plate: {getDocByType('vehicle_image')!.vehiclePlate}</p>
                  )}
                  <div className="flex gap-1.5">
                    <Input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => setDocFormData(prev => ({ ...prev, vehicleImage: { ...prev.vehicleImage, file: e.target.files?.[0] || null } }))}
                      className="h-7 text-[10px] flex-1"
                    />
                    <Input
                      type="text"
                      placeholder="Plate#"
                      value={docFormData.vehicleImage.vehiclePlate}
                      onChange={(e) => setDocFormData(prev => ({ ...prev, vehicleImage: { ...prev.vehicleImage, vehiclePlate: e.target.value } }))}
                      className="h-7 text-[10px] w-20"
                    />
                  </div>
                  <Button
                    onClick={() => handleDocUpload('vehicle_image')}
                    disabled={!docFormData.vehicleImage.file || uploadingDoc === 'vehicle_image'}
                    size="sm"
                    className="w-full h-7 text-[10px] bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Upload className="w-3 h-3 mr-1" />
                    {uploadingDoc === 'vehicle_image' ? 'Uploading...' : 'Upload'}
                  </Button>
                </CardContent>
              </Card>

              {/* Profile Photo */}
              <Card className="border border-border bg-background">
                <CardContent className="p-2.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Camera className="w-4 h-4 text-green-600" />
                      <span className="text-xs font-semibold text-foreground">Profile Photo</span>
                    </div>
                    {getDocByType('profile_photo') && getDocStatusBadge(getDocByType('profile_photo')!.status)}
                  </div>
                  <Input
                    type="file"
                    accept="image/*"
                    capture="user"
                    onChange={(e) => setDocFormData(prev => ({ ...prev, profilePhoto: { file: e.target.files?.[0] || null } }))}
                    className="h-7 text-[10px]"
                  />
                  <Button
                    onClick={() => handleDocUpload('profile_photo')}
                    disabled={!docFormData.profilePhoto.file || uploadingDoc === 'profile_photo'}
                    size="sm"
                    className="w-full h-7 text-[10px] bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Upload className="w-3 h-3 mr-1" />
                    {uploadingDoc === 'profile_photo' ? 'Uploading...' : 'Upload'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
      {/* Main Home View */}
      {currentView === 'home' && (
      <>
      {/* Stats Cards */}
      <div className="px-6 py-4 grid grid-cols-3 gap-3">
        {/* Earnings Card */}
        <div 
          className="relative overflow-hidden rounded-xl bg-background border border-emerald-200 shadow-sm hover:shadow-md transition-all duration-300" 
          data-testid="stat-earnings"
        >
          <div className="p-3 text-center">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-1.5">
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide mb-0.5">Today</p>
            <p className="text-sm font-bold text-emerald-900" data-testid="text-today-earnings">
              ${todayEarnings.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Rides Card */}
        <div 
          className="relative overflow-hidden rounded-xl bg-background border border-blue-200 shadow-sm hover:shadow-md transition-all duration-300" 
          data-testid="stat-rides"
        >
          <div className="p-3 text-center">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-1.5">
              <MapPin className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-[10px] font-bold text-blue-800 uppercase tracking-wide mb-0.5">Rides</p>
            <p className="text-sm font-bold text-blue-900" data-testid="text-completed-today">
              {completedToday}
            </p>
          </div>
        </div>

        {/* Rating Card */}
        <div 
          className="relative overflow-hidden rounded-xl bg-background border border-amber-200 shadow-sm hover:shadow-md transition-all duration-300" 
          data-testid="stat-rating"
        >
          <div className="p-3 text-center">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-1.5">
              <Star className="w-4 h-4 text-amber-600 fill-amber-600" />
            </div>
            <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wide mb-0.5">Rating</p>
            <p className="text-sm font-bold text-amber-900" data-testid="text-rating">
              {driver.rating || '0'}/5
            </p>
          </div>
        </div>
      </div>
      {/* Rides Tabs */}
      <div className="px-6 pb-4">
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="w-full grid grid-cols-2 bg-background border border-border p-1 rounded-lg shadow-sm">
            <TabsTrigger 
              value="upcoming" 
              data-testid="tab-upcoming"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md font-medium transition-all text-muted-foreground relative"
            >
              Upcoming ({upcomingBookings.length})
              {newJobAlert && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="completed" 
              data-testid="tab-completed"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md font-medium transition-all text-muted-foreground"
            >
              Completed ({completedBookings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-3 mt-4">
            {upcomingBookings.length === 0 ? (
              <div className="bg-background rounded-xl border border-border p-8 text-center shadow-sm">
                <Car className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-foreground font-medium mb-1" data-testid="text-no-upcoming">
                  No upcoming rides
                </p>
                <p className="text-sm text-muted-foreground">
                  {driver.isAvailable ? 'Waiting for new assignments...' : 'Go online to receive rides'}
                </p>
              </div>
            ) : (
              upcomingBookings.map((booking) => {
                const nextAction = getStatusNextAction(booking.status);
                
                return (
                  <div 
                    key={booking.id} 
                    className="bg-background rounded-xl border border-border overflow-hidden hover:shadow-lg transition-all duration-200 hover:border-red-300"
                    onClick={() => setLocation(`/mobile-driver/rides/${booking.id}`)}
                    data-testid={`card-booking-${booking.id}`}
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <Badge className={`${getStatusColor(booking.status)} font-medium text-xs px-2.5 py-1`} data-testid={`badge-status-${booking.id}`}>
                              {booking.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </Badge>
                            <span className="text-base font-bold" style={{ color: 'var(--brand-accent-hex)' }}>
                              ${booking.driverPayment && Number.isFinite(parseFloat(booking.driverPayment)) ? parseFloat(booking.driverPayment).toFixed(2) : '0.00'}
                            </span>
                          </div>
                          <div className="flex items-center text-xs text-muted-foreground mb-1.5">
                            <Calendar className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                            <span className="font-medium">
                              {booking.scheduledDateTime ? format(new Date(booking.scheduledDateTime), 'MMM d, h:mm a') : 'Not scheduled'}
                            </span>
                          </div>
                          {booking.passengerName && (
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <div className="flex items-center">
                                <User className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                                <span className="font-medium">{booking.passengerName}</span>
                              </div>
                              {booking.passengerPhone && (
                                <div className="flex items-center gap-2">
                                  <a
                                    href={isTripActive(booking.status) ? `tel:${booking.passengerPhone}` : undefined}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (!isTripActive(booking.status)) {
                                        e.preventDefault();
                                      }
                                    }}
                                    className={`flex items-center justify-center w-7 h-7 rounded-full transition-all ${
                                      isTripActive(booking.status)
                                        ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 cursor-pointer border border-emerald-200'
                                        : 'bg-muted text-gray-400 cursor-not-allowed border border-border'
                                    }`}
                                    aria-label={isTripActive(booking.status) ? `Call ${booking.passengerName}` : 'Call passenger (available after trip starts)'}
                                    title={isTripActive(booking.status) ? 'Call passenger' : 'Available after trip starts'}
                                    data-testid={`button-call-${booking.id}`}
                                  >
                                    <Phone className="w-3.5 h-3.5" />
                                  </a>
                                  <a
                                    href={isTripActive(booking.status) ? `sms:${booking.passengerPhone}` : undefined}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (!isTripActive(booking.status)) {
                                        e.preventDefault();
                                      }
                                    }}
                                    className={`flex items-center justify-center w-7 h-7 rounded-full transition-all ${
                                      isTripActive(booking.status)
                                        ? 'bg-blue-50 text-blue-600 hover:bg-blue-100 cursor-pointer border border-blue-200'
                                        : 'bg-muted text-gray-400 cursor-not-allowed border border-border'
                                    }`}
                                    aria-label={isTripActive(booking.status) ? `Text ${booking.passengerName}` : 'Text passenger (available after trip starts)'}
                                    title={isTripActive(booking.status) ? 'Text passenger' : 'Available after trip starts'}
                                    data-testid={`button-text-${booking.id}`}
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                  </a>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2.5 mb-4 bg-muted rounded-lg p-3 border border-border">
                        <div className="flex items-start gap-2.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 flex-shrink-0"></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Pickup</p>
                            <p className="text-sm font-medium text-foreground line-clamp-2">{booking.pickupAddress}</p>
                          </div>
                          {isTripActive(booking.status) && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <button
                                  className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-600 hover:bg-emerald-200 transition-colors border border-emerald-200"
                                  aria-label="Navigate to pickup"
                                  title="Navigate to pickup"
                                  data-testid={`button-nav-pickup-${booking.id}`}
                                >
                                  <Navigation2 className="w-4 h-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                <DropdownMenuItem onClick={() => openNavigationApp(booking.pickupAddress, 'google')}>
                                  <MapPin className="w-4 h-4 mr-2" /> Google Maps
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openNavigationApp(booking.pickupAddress, 'apple')}>
                                  <MapPin className="w-4 h-4 mr-2" /> Apple Maps
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openNavigationApp(booking.pickupAddress, 'waze')}>
                                  <Navigation2 className="w-4 h-4 mr-2" /> Waze
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>

                        {booking.viaAddress && (
                          <div className="flex items-start gap-2.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1 flex-shrink-0"></div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Via</p>
                              <p className="text-sm font-medium text-foreground line-clamp-2">{booking.viaAddress}</p>
                            </div>
                            {isTripActive(booking.status) && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <button
                                    className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors border border-blue-200"
                                    aria-label="Navigate to via point"
                                    title="Navigate to via point"
                                    data-testid={`button-nav-via-${booking.id}`}
                                  >
                                    <Navigation2 className="w-4 h-4" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                  <DropdownMenuItem onClick={() => openNavigationApp(booking.viaAddress!, 'google')}>
                                    <MapPin className="w-4 h-4 mr-2" /> Google Maps
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openNavigationApp(booking.viaAddress!, 'apple')}>
                                    <MapPin className="w-4 h-4 mr-2" /> Apple Maps
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openNavigationApp(booking.viaAddress!, 'waze')}>
                                    <Navigation2 className="w-4 h-4 mr-2" /> Waze
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        )}

                        <div className="flex items-start gap-2.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-primary mt-1 flex-shrink-0"></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">
                              Dropoff
                              {(booking as any).bookingType === 'hourly' && (booking as any).requestedHours && (
                                <span className="ml-2 text-primary font-bold">
                                  ({(booking as any).requestedHours} {(booking as any).requestedHours === 1 ? 'Hour' : 'Hours'})
                                </span>
                              )}
                            </p>
                            <p className="text-sm font-medium text-foreground line-clamp-2">{booking.destinationAddress}</p>
                          </div>
                          {isTripActive(booking.status) && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <button
                                  className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary/10 hover:bg-primary/20 transition-colors border border-primary/20" style={{ color: 'var(--brand-accent-hex)' }}
                                  aria-label="Navigate to dropoff"
                                  title="Navigate to dropoff"
                                  data-testid={`button-nav-dropoff-${booking.id}`}
                                >
                                  <Navigation2 className="w-4 h-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                <DropdownMenuItem onClick={() => openNavigationApp(booking.destinationAddress, 'google')}>
                                  <MapPin className="w-4 h-4 mr-2" /> Google Maps
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openNavigationApp(booking.destinationAddress, 'apple')}>
                                  <MapPin className="w-4 h-4 mr-2" /> Apple Maps
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openNavigationApp(booking.destinationAddress, 'waze')}>
                                  <Navigation2 className="w-4 h-4 mr-2" /> Waze
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>

                      {nextAction && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateStatusMutation.mutate({
                              bookingId: booking.id,
                              status: nextAction.nextStatus,
                            });
                          }}
                          disabled={updateStatusMutation.isPending || !canStartTrip(booking)}
                          className={`w-full font-semibold shadow-sm hover:shadow-md transition-all ${
                            canStartTrip(booking) 
                              ? 'bg-primary hover:bg-primary/90 text-primary-foreground' 
                              : 'bg-gray-200 text-muted-foreground cursor-not-allowed'
                          }`}
                          data-testid={`button-${nextAction.nextStatus}-${booking.id}`}
                        >
                          <div className="flex items-center justify-center w-full">
                            <CheckCircle2 className="w-4 h-4 mr-2 flex-shrink-0" />
                            <div className="flex flex-col items-start">
                              <span>{nextAction.label}</span>
                              {booking.status === 'confirmed' && !canStartTrip(booking) && (
                                <span className="text-xs font-normal -mt-0.5">
                                  Available in {getMinutesUntilCanStart(booking)} min (2.5h before)
                                </span>
                              )}
                            </div>
                          </div>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-3 mt-4">
            {completedBookings.length === 0 ? (
              <div className="bg-background rounded-xl border border-border p-8 text-center shadow-sm">
                <CheckCircle2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-foreground font-medium" data-testid="text-no-completed">
                  No completed rides yet
                </p>
              </div>
            ) : (
              completedBookings.slice(0, 10).map((booking) => (
                <div 
                  key={booking.id}
                  className="bg-background rounded-xl border border-border overflow-hidden hover:shadow-lg transition-all duration-200 hover:border-emerald-300 cursor-pointer"
                  onClick={() => setLocation(`/mobile-driver/rides/${booking.id}`)}
                  data-testid={`card-completed-${booking.id}`}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium text-xs px-2.5 py-1">
                            Completed
                          </Badge>
                          <span className="text-base font-bold text-emerald-700">
                            ${booking.driverPayment && Number.isFinite(parseFloat(booking.driverPayment)) ? parseFloat(booking.driverPayment).toFixed(2) : '0.00'}
                          </span>
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Calendar className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                          <span className="font-medium">
                            {booking.scheduledDateTime ? format(new Date(booking.scheduledDateTime), 'MMM d, h:mm a') : 'Not scheduled'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 bg-muted rounded-lg p-3 border border-border">
                      <div className="flex items-start gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 flex-shrink-0"></div>
                        <p className="text-sm font-medium text-foreground line-clamp-1 flex-1">{booking.pickupAddress}</p>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 mt-1 flex-shrink-0"></div>
                        <p className="text-sm font-medium text-foreground line-clamp-1 flex-1">{booking.destinationAddress}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
      </>
      )}
    </div>
  );
}
