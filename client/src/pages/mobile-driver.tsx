import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Car, DollarSign, MapPin, Star, Calendar, User, FileText, Settings, CheckCircle2, Navigation2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';

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
  dropoffAddress: string;
  scheduledTime: string;
  serviceType: 'transfer' | 'hourly';
  duration: number | null;
  vehicleType: string;
  passengers: number;
  luggage: number;
  babySeat: boolean;
  finalPrice: number;
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

  // Fetch driver profile
  const { data: driver, isLoading: driverLoading } = useQuery<DriverData>({
    queryKey: ['/api/driver/profile'],
    retry: false,
  });

  // Fetch driver bookings
  const { data: bookings, isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ['/api/bookings'],
    retry: false,
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

  // GPS Tracking
  useEffect(() => {
    if (!driver?.isAvailable) {
      // Stop tracking when driver goes offline
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    // Check if geolocation is supported
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your device');
      return;
    }

    // Request location permission and start watching
    const watchId = navigator.geolocation.watchPosition(
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
        maximumAge: 30000, // Update every 30 seconds max
      }
    );

    watchIdRef.current = watchId;

    // Cleanup on unmount
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [driver?.isAvailable]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusNextAction = (status: string) => {
    switch (status) {
      case 'confirmed': return { label: 'Start Ride', nextStatus: 'in_progress' };
      case 'in_progress': return { label: 'Complete Ride', nextStatus: 'completed' };
      default: return null;
    }
  };

  // Filter bookings
  const upcomingBookings = bookings?.filter(b => 
    ['confirmed', 'in_progress'].includes(b.status)
  ) || [];
  
  const completedBookings = bookings?.filter(b => 
    b.status === 'completed'
  ) || [];

  // Calculate today's earnings
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEarnings = completedBookings
    .filter(b => new Date(b.scheduledTime) >= today)
    .reduce((sum, b) => sum + b.finalPrice, 0);

  const completedToday = completedBookings
    .filter(b => new Date(b.scheduledTime) >= today).length;

  if (driverLoading || bookingsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading driver dashboard...</p>
        </div>
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <Car className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Driver Profile Not Found</h2>
            <p className="text-gray-600 mb-4">
              You need to complete your driver profile to access this dashboard.
            </p>
            <Button 
              onClick={() => setLocation('/driver-dashboard')}
              className="bg-green-600 hover:bg-green-700"
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
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/mobile-splash')}
            className="text-white hover:bg-white/20"
            data-testid="button-back"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-2xl font-bold" data-testid="header-title">Driver Dashboard</h1>
          <Settings 
            className="w-6 h-6 cursor-pointer" 
            onClick={() => setLocation('/driver-dashboard')}
            data-testid="icon-settings"
          />
        </div>

        {/* Availability Toggle */}
        <Card className="bg-white/10 border-white/20 backdrop-blur overflow-hidden">
          <CardContent className="p-0">
            <button
              onClick={() => {
                if (!toggleAvailabilityMutation.isPending) {
                  toggleAvailabilityMutation.mutate(!driver.isAvailable);
                }
              }}
              disabled={toggleAvailabilityMutation.isPending}
              className={`w-full px-4 py-3 text-left transition-all active:scale-[0.98] ${
                toggleAvailabilityMutation.isPending ? 'opacity-70 cursor-wait' : 'cursor-pointer active:bg-white/5'
              }`}
              data-testid="button-toggle-availability"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className={`w-2.5 h-2.5 rounded-full transition-all ${
                    toggleAvailabilityMutation.isPending 
                      ? 'bg-yellow-400 animate-pulse' 
                      : driver.isAvailable 
                        ? 'bg-green-400 shadow-md shadow-green-400/50' 
                        : 'bg-gray-400'
                  }`}></div>
                  <span className="font-semibold text-white text-sm">
                    {toggleAvailabilityMutation.isPending 
                      ? (driver.isAvailable ? 'Going Offline...' : 'Going Online...') 
                      : (driver.isAvailable ? 'Available' : 'Offline')
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
              <div className="flex items-center space-x-1.5 text-xs text-white/80 border-t border-white/10 px-4 py-2 bg-white/5">
                <Navigation2 className={`w-3 h-3 ${currentLocation ? 'text-green-400 animate-pulse' : 'text-gray-400'}`} />
                <span data-testid="text-gps-status">
                  {locationError ? (
                    <span className="text-red-300">{locationError}</span>
                  ) : currentLocation ? (
                    <span className="text-green-300">GPS Active</span>
                  ) : (
                    <span className="text-yellow-300">Activating GPS...</span>
                  )}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stats Cards */}
      <div className="px-6 py-4 grid grid-cols-3 gap-3 origin-center">
        {/* Earnings Card */}
        <div 
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 to-green-100/50 border border-emerald-200/60 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 scale-[0.6] origin-center" 
          data-testid="stat-earnings"
        >
          <div className="p-3 text-center">
            <div className="w-9 h-9 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-emerald-800 uppercase tracking-wide mb-0.5 font-bold text-[14px]">Today</p>
            <p className="text-xs font-bold text-emerald-900" data-testid="text-today-earnings">
              ${todayEarnings.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Rides Card - Entire card 60% size */}
        <div 
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-50 to-blue-100/50 border border-sky-200/60 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 scale-[0.6] origin-center" 
          data-testid="stat-rides"
        >
          <div className="p-3 text-center">
            <div className="w-9 h-9 rounded-full bg-sky-500/10 flex items-center justify-center mx-auto mb-2">
              <MapPin className="w-5 h-5 text-sky-600" />
            </div>
            <p className="text-xs font-medium text-sky-800 uppercase tracking-wide mb-0.5">Rides</p>
            <p className="text-xl font-bold text-sky-900" data-testid="text-completed-today">
              {completedToday}
            </p>
          </div>
        </div>

        {/* Rating Card */}
        <div 
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 to-yellow-100/50 border border-amber-200/60 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 scale-[0.6] origin-center" 
          data-testid="stat-rating"
        >
          <div className="p-3 text-center">
            <div className="w-9 h-9 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-2">
              <Star className="w-5 h-5 text-amber-600 fill-amber-600" />
            </div>
            <p className="text-xs font-medium text-amber-800 uppercase tracking-wide mb-0.5">Rating</p>
            <p className="text-xl font-bold text-amber-900" data-testid="text-rating">
              {driver.rating || '0'}/5
            </p>
          </div>
        </div>
      </div>

      {/* Rides Tabs */}
      <div className="px-6">
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="upcoming" data-testid="tab-upcoming">
              Upcoming ({upcomingBookings.length})
            </TabsTrigger>
            <TabsTrigger value="completed" data-testid="tab-completed">
              Completed ({completedBookings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4 mt-4">
            {upcomingBookings.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Car className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600" data-testid="text-no-upcoming">
                    No upcoming rides
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {driver.isAvailable ? 'Waiting for new assignments...' : 'Go online to receive rides'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              upcomingBookings.map((booking) => {
                const nextAction = getStatusNextAction(booking.status);
                
                return (
                  <Card 
                    key={booking.id} 
                    className="shadow-md cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setLocation(`/mobile-driver/rides/${booking.id}`)}
                    data-testid={`card-booking-${booking.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getStatusColor(booking.status)} data-testid={`badge-status-${booking.id}`}>
                              {booking.status.replace('_', ' ')}
                            </Badge>
                            <p className="text-sm font-semibold text-gray-900">
                              ${booking.finalPrice.toFixed(2)}
                            </p>
                          </div>
                          <div className="flex items-center text-xs text-gray-600 mb-1">
                            <Calendar className="w-3 h-3 mr-1" />
                            {format(new Date(booking.scheduledTime), 'MMM d, h:mm a')}
                          </div>
                          {booking.passengerName && (
                            <div className="flex items-center text-xs text-gray-600">
                              <User className="w-3 h-3 mr-1" />
                              {booking.passengerName}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2 mb-3">
                        <div className="flex items-start">
                          <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 mr-2"></div>
                          <div className="flex-1">
                            <p className="text-xs text-gray-500">Pickup</p>
                            <p className="text-sm font-medium text-gray-900">{booking.pickupAddress}</p>
                          </div>
                        </div>

                        {booking.viaAddress && (
                          <div className="flex items-start">
                            <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 mr-2"></div>
                            <div className="flex-1">
                              <p className="text-xs text-gray-500">Via</p>
                              <p className="text-sm font-medium text-gray-900">{booking.viaAddress}</p>
                            </div>
                          </div>
                        )}

                        <div className="flex items-start">
                          <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 mr-2"></div>
                          <div className="flex-1">
                            <p className="text-xs text-gray-500">Dropoff</p>
                            <p className="text-sm font-medium text-gray-900">{booking.dropoffAddress}</p>
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
                          disabled={updateStatusMutation.isPending}
                          className="w-full bg-green-600 hover:bg-green-700"
                          data-testid={`button-${nextAction.nextStatus}-${booking.id}`}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          {nextAction.label}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4 mt-4">
            {completedBookings.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600" data-testid="text-no-completed">
                    No completed rides yet
                  </p>
                </CardContent>
              </Card>
            ) : (
              completedBookings.slice(0, 10).map((booking) => (
                <Card 
                  key={booking.id}
                  className="shadow-md cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setLocation(`/mobile-driver/rides/${booking.id}`)}
                  data-testid={`card-completed-${booking.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-green-100 text-green-800">Completed</Badge>
                          <p className="text-sm font-semibold text-gray-900">
                            ${booking.finalPrice.toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center text-xs text-gray-600">
                          <Calendar className="w-3 h-3 mr-1" />
                          {format(new Date(booking.scheduledTime), 'MMM d, h:mm a')}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-start text-sm">
                        <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 mr-2"></div>
                        <p className="text-gray-900 line-clamp-1">{booking.pickupAddress}</p>
                      </div>
                      <div className="flex items-start text-sm">
                        <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 mr-2"></div>
                        <p className="text-gray-900 line-clamp-1">{booking.dropoffAddress}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Quick Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4">
        <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
          <Button
            variant="outline"
            onClick={() => setLocation('/driver-dashboard')}
            className="flex items-center justify-center space-x-2"
            data-testid="button-documents"
          >
            <FileText className="w-4 h-4" />
            <span>Documents</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => setLocation('/driver-dashboard')}
            className="flex items-center justify-center space-x-2"
            data-testid="button-account"
          >
            <User className="w-4 h-4" />
            <span>Account</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
