import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Car, DollarSign, MapPin, Star, Calendar, User, FileText, Settings, CheckCircle2, Navigation2, Phone, MessageSquare, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';

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
  const { user, isLoading: authLoading } = useAuth();
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      setLocation('/mobile-login?role=driver');
    }
  }, [user, authLoading, setLocation]);

  // Fetch driver profile - enabled when auth is loaded and user exists
  const { data: driver, isLoading: driverLoading } = useQuery<DriverData>({
    queryKey: ['/api/driver/profile'],
    retry: false,
    enabled: !authLoading && !!user,
  });

  // Fetch driver bookings - enabled when auth is loaded and user exists
  const { data: bookings, isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ['/api/bookings'],
    retry: false,
    enabled: !authLoading && !!user,
  });

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
      default: return 'bg-gray-50 text-gray-700 border border-gray-200';
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

  if (authLoading || driverLoading || bookingsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading driver dashboard...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated, show nothing (redirect will happen via useEffect)
  if (!user) {
    return null;
  }

  if (!driver) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full bg-white shadow-sm border border-gray-200">
          <CardContent className="p-6 text-center">
            <Car className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2 text-gray-900">Driver Profile Not Found</h2>
            <p className="text-gray-600 mb-4">
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
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50/50 to-gray-100">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-40">
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation('/mobile-splash')}
              className="h-9 w-9 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl touch-manipulation"
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-bold text-gray-900" data-testid="header-title">Driver Dashboard</h1>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl touch-manipulation"
                  data-testid="button-menu"
                >
                  <Settings className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-white shadow-lg border-gray-100 rounded-xl">
                <DropdownMenuItem
                  onClick={() => setLocation('/mobile-driver/documents')}
                  className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded-lg touch-manipulation"
                  data-testid="menu-documents"
                >
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span className="text-gray-700">Documents</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setLocation('/mobile-driver/profile')}
                  className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded-lg touch-manipulation"
                  data-testid="menu-profile"
                >
                  <User className="w-4 h-4 text-blue-600" />
                  <span className="text-gray-700">Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setLocation('/mobile-driver/account')}
                  className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded-lg touch-manipulation"
                  data-testid="menu-account"
                >
                  <Settings className="w-4 h-4 text-blue-600" />
                  <span className="text-gray-700">Account</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Availability Toggle */}
          <Card className="rounded-2xl overflow-hidden shadow-sm border border-gray-100 bg-white">
            <CardContent className="p-0">
              <button
                onClick={() => {
                  if (!toggleAvailabilityMutation.isPending) {
                    toggleAvailabilityMutation.mutate(!driver.isAvailable);
                  }
                }}
                disabled={toggleAvailabilityMutation.isPending}
                className="w-full px-4 py-4 text-left transition-all active:scale-[0.98] cursor-pointer hover:bg-gray-50 touch-manipulation"
                data-testid="button-toggle-availability"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3.5 h-3.5 rounded-full transition-all ${
                      toggleAvailabilityMutation.isPending 
                        ? 'bg-yellow-400 animate-pulse' 
                        : driver.isAvailable 
                          ? 'bg-emerald-500 shadow-sm shadow-emerald-200' 
                          : 'bg-gray-300'
                    }`}></div>
                    <span className="font-semibold text-base text-gray-900">
                      {toggleAvailabilityMutation.isPending 
                        ? (driver.isAvailable ? 'Going Offline...' : 'Going Online...') 
                        : (driver.isAvailable ? 'Online' : 'Offline')
                      }
                    </span>
                  </div>
                  <Switch
                    checked={driver.isAvailable}
                    disabled={toggleAvailabilityMutation.isPending}
                    className="pointer-events-none"
                    data-testid="switch-availability"
                  />
                </div>
              </button>

              {driver.isAvailable && (
                <div className="flex items-center space-x-1.5 text-xs border-t border-gray-100 px-4 py-2.5 bg-emerald-50/50">
                  <Navigation2 className={`w-3.5 h-3.5 ${currentLocation ? 'text-emerald-600 animate-pulse' : 'text-gray-400'}`} />
                  <span data-testid="text-gps-status">
                    {locationError ? (
                      <span className="text-red-600">{locationError}</span>
                    ) : currentLocation ? (
                      <span className="font-medium text-emerald-700">
                        GPS Active ({hasActiveRide(bookings) ? '30s' : '60s'} updates)
                      </span>
                    ) : (
                      <span className="text-gray-500">Activating GPS...</span>
                    )}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-6 py-4 grid grid-cols-3 gap-3">
        {/* Earnings Card */}
        <div 
          className="relative overflow-hidden rounded-xl bg-white border border-emerald-200 shadow-sm hover:shadow-md transition-all duration-300" 
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
          className="relative overflow-hidden rounded-xl bg-white border border-blue-200 shadow-sm hover:shadow-md transition-all duration-300" 
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
          className="relative overflow-hidden rounded-xl bg-white border border-amber-200 shadow-sm hover:shadow-md transition-all duration-300" 
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
      <div className="px-5 pb-6">
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="w-full grid grid-cols-2 bg-gray-100/80 p-1 rounded-xl">
            <TabsTrigger 
              value="upcoming" 
              data-testid="tab-upcoming"
              className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm rounded-lg font-medium transition-all text-gray-500 text-sm"
            >
              Active ({upcomingBookings.length})
            </TabsTrigger>
            <TabsTrigger 
              value="completed" 
              data-testid="tab-completed"
              className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm rounded-lg font-medium transition-all text-gray-500 text-sm"
            >
              Completed ({completedBookings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-3 mt-4">
            {upcomingBookings.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm">
                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Car className="w-7 h-7 text-gray-400" />
                </div>
                <p className="text-gray-900 font-semibold mb-1" data-testid="text-no-upcoming">
                  No upcoming rides
                </p>
                <p className="text-sm text-gray-500">
                  {driver.isAvailable ? 'Waiting for new assignments...' : 'Go online to receive rides'}
                </p>
              </div>
            ) : (
              upcomingBookings.map((booking) => {
                const nextAction = getStatusNextAction(booking.status);
                
                return (
                  <div 
                    key={booking.id} 
                    className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200 touch-manipulation"
                    onClick={() => setLocation(`/mobile-driver/rides/${booking.id}`)}
                    data-testid={`card-booking-${booking.id}`}
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <Badge className={`${getStatusColor(booking.status)} font-medium text-xs px-2.5 py-1 rounded-lg`} data-testid={`badge-status-${booking.id}`}>
                              {booking.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </Badge>
                            <span className="text-base font-bold text-emerald-600">
                              ${booking.driverPayment && Number.isFinite(parseFloat(booking.driverPayment)) ? parseFloat(booking.driverPayment).toFixed(2) : '0.00'}
                            </span>
                          </div>
                          <div className="flex items-center text-xs text-gray-600 mb-1.5">
                            <Calendar className="w-3.5 h-3.5 mr-1.5 text-gray-500" />
                            <span className="font-medium">
                              {booking.scheduledDateTime ? format(new Date(booking.scheduledDateTime), 'MMM d, h:mm a') : 'Not scheduled'}
                            </span>
                          </div>
                          {booking.passengerName && (
                            <div className="flex items-center justify-between text-xs text-gray-600">
                              <div className="flex items-center">
                                <User className="w-3.5 h-3.5 mr-1.5 text-gray-500" />
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
                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
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
                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
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

                      <div className="space-y-2.5 mb-4 bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="flex items-start gap-2.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 flex-shrink-0"></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide mb-0.5">Pickup</p>
                            <p className="text-sm font-medium text-gray-900 line-clamp-2">{booking.pickupAddress}</p>
                          </div>
                        </div>

                        {booking.viaAddress && (
                          <div className="flex items-start gap-2.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1 flex-shrink-0"></div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide mb-0.5">Via</p>
                              <p className="text-sm font-medium text-gray-900 line-clamp-2">{booking.viaAddress}</p>
                            </div>
                          </div>
                        )}

                        <div className="flex items-start gap-2.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-red-500 mt-1 flex-shrink-0"></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide mb-0.5">Dropoff</p>
                            <p className="text-sm font-medium text-gray-900 line-clamp-2">{booking.destinationAddress}</p>
                          </div>
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
                          className={`w-full font-semibold rounded-xl transition-all touch-manipulation ${
                            canStartTrip(booking) 
                              ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md shadow-blue-600/20' 
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
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
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center shadow-sm">
                <CheckCircle2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-900 font-medium" data-testid="text-no-completed">
                  No completed rides yet
                </p>
              </div>
            ) : (
              completedBookings.slice(0, 10).map((booking) => (
                <div 
                  key={booking.id}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 hover:border-emerald-300 cursor-pointer"
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
                        <div className="flex items-center text-xs text-gray-600">
                          <Calendar className="w-3.5 h-3.5 mr-1.5 text-gray-500" />
                          <span className="font-medium">
                            {booking.scheduledDateTime ? format(new Date(booking.scheduledDateTime), 'MMM d, h:mm a') : 'Not scheduled'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="flex items-start gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 flex-shrink-0"></div>
                        <p className="text-sm font-medium text-gray-900 line-clamp-1 flex-1">{booking.pickupAddress}</p>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 mt-1 flex-shrink-0"></div>
                        <p className="text-sm font-medium text-gray-900 line-clamp-1 flex-1">{booking.destinationAddress}</p>
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
