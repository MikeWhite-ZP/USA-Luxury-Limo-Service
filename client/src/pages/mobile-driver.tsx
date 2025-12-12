import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Car, DollarSign, MapPin, Star, Calendar, User, FileText, Settings, CheckCircle2, Navigation2, Phone, MessageSquare, MoreVertical, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import { ThemeToggleMobile } from '@/components/ThemeToggle';

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
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
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
            <Car className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2 text-foreground">Driver Profile Not Found</h2>
            <p className="text-muted-foreground mb-4">
              You need to complete your driver profile to access this dashboard.
            </p>
            <Button 
              onClick={() => setLocation('/driver-dashboard')}
              className="bg-red-600 hover:bg-red-700 text-white"
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
      {/* Header */}
      <div className="bg-background border-b border-border p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/mobile-splash')}
            className="text-muted-foreground hover:bg-muted"
            data-testid="button-back"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground" data-testid="header-title">Driver Dashboard</h1>
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
                onClick={() => setLocation('/mobile-driver/documents')}
                className="flex items-center gap-2 cursor-pointer hover:bg-muted"
                data-testid="menu-documents"
              >
                <FileText className="w-4 h-4 text-red-600" />
                <span className="text-muted-foreground">Documents</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setLocation('/mobile-driver/profile')}
                className="flex items-center gap-2 cursor-pointer hover:bg-muted"
                data-testid="menu-profile"
              >
                <User className="w-4 h-4 text-red-600" />
                <span className="text-muted-foreground">Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setLocation('/mobile-driver/account')}
                className="flex items-center gap-2 cursor-pointer hover:bg-muted"
                data-testid="menu-account"
              >
                <Settings className="w-4 h-4 text-red-600" />
                <span className="text-muted-foreground">Account</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </div>

        {/* Availability Toggle */}
        <Card className="rounded-lg overflow-hidden shadow-sm border border-border bg-background">
          <CardContent className="p-0">
            <button
              onClick={() => {
                if (!toggleAvailabilityMutation.isPending) {
                  toggleAvailabilityMutation.mutate(!driver.isAvailable);
                }
              }}
              disabled={toggleAvailabilityMutation.isPending}
              className="w-full px-4 py-3 text-left transition-all active:scale-[0.98] cursor-pointer hover:bg-muted"
              data-testid="button-toggle-availability"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className={`w-3 h-3 rounded-full transition-all ${
                    toggleAvailabilityMutation.isPending 
                      ? 'bg-yellow-400 animate-pulse' 
                      : driver.isAvailable 
                        ? 'bg-emerald-500 shadow-sm' 
                        : 'bg-gray-300'
                  }`}></div>
                  <span className="font-bold text-base text-foreground">
                    {toggleAvailabilityMutation.isPending 
                      ? (driver.isAvailable ? 'Going Offline...' : 'Going Online...') 
                      : (driver.isAvailable ? 'Go Offline' : 'Go Online')
                    }
                  </span>
                </div>
                <Switch
                  checked={driver.isAvailable}
                  disabled={toggleAvailabilityMutation.isPending}
                  className="pointer-events-none scale-110"
                  data-testid="switch-availability"
                />
              </div>
            </button>

            {driver.isAvailable && (
              <div className="flex items-center space-x-1.5 text-xs border-t border-border px-4 py-2 bg-muted">
                <Navigation2 className={`w-3 h-3 ${currentLocation ? 'text-emerald-600 animate-pulse' : 'text-gray-400'}`} />
                <span data-testid="text-gps-status">
                  {locationError ? (
                    <span className="text-red-600">{locationError}</span>
                  ) : currentLocation ? (
                    <span className="font-medium text-muted-foreground">
                      GPS Active ({hasActiveRide(bookings) ? '30s' : '60s'} updates)
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Activating GPS...</span>
                  )}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
              className="data-[state=active]:bg-red-600 data-[state=active]:text-white rounded-md font-medium transition-all text-muted-foreground relative"
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
              className="data-[state=active]:bg-red-600 data-[state=active]:text-white rounded-md font-medium transition-all text-muted-foreground"
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
                            <span className="text-base font-bold text-red-600">
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
                          <div className="w-2.5 h-2.5 rounded-full bg-red-500 mt-1 flex-shrink-0"></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Dropoff</p>
                            <p className="text-sm font-medium text-foreground line-clamp-2">{booking.destinationAddress}</p>
                          </div>
                          {isTripActive(booking.status) && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <button
                                  className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors border border-red-200"
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
                              ? 'bg-red-600 hover:bg-red-700 text-white' 
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
    </div>
  );
}
