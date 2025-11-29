import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Car, MapPin, Clock, Activity, Users, CheckCircle2, AlertCircle, Navigation2, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface DashboardStats {
  activeDrivers: number;
  activeRides: number;
  pendingRequests: number;
  fleetUtilization: string;
}

interface Booking {
  id: string;
  status: string;
  passengerFirstName: string;
  passengerLastName: string;
  passengerPhone?: string;
  passengerEmail?: string;
  pickupAddress: string;
  destinationAddress?: string;
  scheduledDateTime: string;
  vehicleTypeName: string;
  bookingType: string;
  totalPrice: string;
  driverId?: string;
  driverFirstName?: string;
  driverLastName?: string;
}

interface Driver {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  isAvailable: boolean;
  verificationStatus: string;
  currentLocation?: string;
  rating?: string;
  totalRides?: number;
}

export default function MobileDispatcher() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [fleetDialogOpen, setFleetDialogOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      setLocation('/mobile-login?role=dispatcher');
    }
  }, [user, authLoading, setLocation]);

  // Fetch dashboard stats - enabled when auth is loaded and user exists
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dispatcher/stats'],
    enabled: !authLoading && !!user,
  });

  // Fetch all bookings - enabled when auth is loaded and user exists
  const { data: bookings, isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ['/api/admin/bookings'],
    enabled: !authLoading && !!user,
  });

  // Fetch all drivers - enabled when auth is loaded and user exists
  const { data: drivers, isLoading: driversLoading } = useQuery<Driver[]>({
    queryKey: ['/api/admin/drivers'],
    enabled: !authLoading && !!user,
  });

  // Filter bookings (exclude past-due bookings)
  const now = new Date();
  const pendingBookings = bookings?.filter((b) => {
    const isPast = new Date(b.scheduledDateTime) < now;
    return b.status === 'pending' && !b.driverId && !isPast;
  }) || [];
  const assignedBookings = bookings?.filter((b) => {
    const isPast = new Date(b.scheduledDateTime) < now;
    return b.status === 'pending' && b.driverId && !isPast;
  }) || [];
  const activeBookings = bookings?.filter((b) => {
    const isPast = new Date(b.scheduledDateTime) < now;
    const activeStatuses = ['confirmed', 'in_progress', 'on_the_way', 'arrived', 'on_board', 'pending_driver_acceptance'];
    return activeStatuses.includes(b.status) && !isPast;
  }) || [];
  
  // Filter drivers
  const availableDrivers = drivers?.filter((d) => d.isAvailable && d.verificationStatus === 'verified') || [];
  const allActiveDrivers = drivers?.filter((d) => d.verificationStatus === 'verified') || [];

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
      queryClient.invalidateQueries({ queryKey: ['/api/dispatcher/stats'] });
      setAssignDialogOpen(false);
      setSelectedBookingId(null);
      setSelectedDriverId("");
      toast({
        title: "Driver Assigned",
        description: "Driver successfully assigned to the ride",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Assignment Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAssignClick = (bookingId: string) => {
    setSelectedBookingId(bookingId);
    setAssignDialogOpen(true);
  };

  const handleAssignSubmit = () => {
    if (!selectedBookingId || !selectedDriverId) {
      toast({
        title: "Selection Required",
        description: "Please select a driver",
        variant: "destructive",
      });
      return;
    }
    assignDriverMutation.mutate({ bookingId: selectedBookingId, driverId: selectedDriverId });
  };

  const parseLocation = (locationStr?: string): { lat: number; lng: number } | null => {
    if (!locationStr) return null;
    try {
      return JSON.parse(locationStr);
    } catch {
      return null;
    }
  };

  const openNavigation = (driver: Driver) => {
    const location = parseLocation(driver.currentLocation);
    if (location) {
      window.open(`https://maps.google.com/maps?q=${location.lat},${location.lng}`, '_blank');
      toast({ title: "Opening Maps" });
    } else {
      toast({ title: "No Location", description: "Driver location not available", variant: "destructive" });
    }
  };

  if (authLoading || statsLoading || bookingsLoading || driversLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-900 text-center">
          <Activity className="w-12 h-12 animate-spin mx-auto mb-4 text-red-600" />
          <p>Loading dispatcher dashboard...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated, show nothing (redirect will happen via useEffect)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50/50 to-gray-100">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-40">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation('/')}
              className="h-9 w-9 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl touch-manipulation"
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Dispatch Center</h1>
              <p className="text-xs text-gray-500">Fleet Management</p>
            </div>
          </div>
          <Button
            onClick={() => setFleetDialogOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md shadow-blue-600/20 rounded-xl touch-manipulation"
            size="sm"
            data-testid="button-fleet-monitor"
          >
            <MapPin className="w-4 h-4 mr-1.5" />
            Fleet
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="p-4 grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-2xl p-4 border border-emerald-100">
          <div className="flex items-center justify-center mb-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Car className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-700 text-center" data-testid="stat-active-drivers">{stats?.activeDrivers || 0}</p>
          <p className="text-xs text-emerald-600/70 text-center font-medium">Active Drivers</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-4 border border-blue-100">
          <div className="flex items-center justify-center mb-2">
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-blue-700 text-center" data-testid="stat-active-rides">{stats?.activeRides || 0}</p>
          <p className="text-xs text-blue-600/70 text-center font-medium">Active Rides</p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-2xl p-4 border border-amber-100">
          <div className="flex items-center justify-center mb-2">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-700 text-center" data-testid="stat-pending-requests">{stats?.pendingRequests || 0}</p>
          <p className="text-xs text-amber-600/70 text-center font-medium">Pending</p>
        </div>
        <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl p-4 border border-gray-200">
          <div className="flex items-center justify-center mb-2">
            <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-gray-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-700 text-center" data-testid="stat-utilization">{stats?.fleetUtilization || '0%'}</p>
          <p className="text-xs text-gray-500 text-center font-medium">Utilization</p>
        </div>
      </div>

      {/* Tabs for Rides */}
      <div className="px-4 pb-6">
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-100/80 p-1 rounded-xl">
            <TabsTrigger value="pending" className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm rounded-lg text-xs font-medium" data-testid="tab-pending">
              Pending ({pendingBookings.length})
            </TabsTrigger>
            <TabsTrigger value="assigned" className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm rounded-lg text-xs font-medium" data-testid="tab-assigned">
              Assigned ({assignedBookings.length})
            </TabsTrigger>
            <TabsTrigger value="active" className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm rounded-lg text-xs font-medium" data-testid="tab-active">
              Active ({activeBookings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4 space-y-3">
            {pendingBookings.length === 0 ? (
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardContent className="p-8 text-center">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No pending bookings</p>
                </CardContent>
              </Card>
            ) : (
              pendingBookings.map((booking) => (
                <Card key={booking.id} className="bg-white border-gray-200 shadow-md" data-testid={`booking-pending-${booking.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-gray-900">{booking.passengerFirstName} {booking.passengerLastName}</p>
                        <Badge variant="outline" className="mt-1 border-gray-300">{booking.vehicleTypeName}</Badge>
                      </div>
                      <Badge className="bg-orange-100 text-orange-700 border border-orange-200">{booking.bookingType}</Badge>
                    </div>
                    <div className="space-y-2 text-sm text-gray-900 mb-3">
                      <div className="flex items-start space-x-2">
                        <MapPin className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
                        <span className="line-clamp-1">{booking.pickupAddress}</span>
                      </div>
                      {booking.destinationAddress && (
                        <div className="flex items-start space-x-2">
                          <MapPin className="w-4 h-4 mt-0.5 text-red-600 flex-shrink-0" />
                          <span className="line-clamp-1">{booking.destinationAddress}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span>{new Date(booking.scheduledDateTime).toLocaleString()}</span>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleAssignClick(booking.id)}
                      className="w-full bg-red-600 hover:bg-red-700 text-white"
                      size="sm"
                      data-testid={`button-assign-${booking.id}`}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Assign Driver
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="assigned" className="mt-4 space-y-3">
            {assignedBookings.length === 0 ? (
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardContent className="p-8 text-center">
                  <CheckCircle2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No assigned bookings</p>
                </CardContent>
              </Card>
            ) : (
              assignedBookings.map((booking) => (
                <Card key={booking.id} className="bg-white border-gray-200 shadow-md" data-testid={`booking-assigned-${booking.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-gray-900">{booking.passengerFirstName} {booking.passengerLastName}</p>
                        <p className="text-sm text-red-600 font-medium">
                          Driver: {booking.driverFirstName} {booking.driverLastName}
                        </p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-700 border border-blue-200">Assigned</Badge>
                    </div>
                    <div className="space-y-2 text-sm text-gray-900 mb-3">
                      <div className="flex items-start space-x-2">
                        <MapPin className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
                        <span className="line-clamp-1">{booking.pickupAddress}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span>{new Date(booking.scheduledDateTime).toLocaleString()}</span>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleAssignClick(booking.id)}
                      variant="outline"
                      className="w-full border-gray-300 hover:bg-gray-50"
                      size="sm"
                      data-testid={`button-reassign-${booking.id}`}
                    >
                      Reassign Driver
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="active" className="mt-4 space-y-3">
            {activeBookings.length === 0 ? (
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardContent className="p-8 text-center">
                  <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No active rides</p>
                </CardContent>
              </Card>
            ) : (
              activeBookings.map((booking) => (
                <Card key={booking.id} className="bg-white border-gray-200 shadow-md" data-testid={`booking-active-${booking.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-gray-900">{booking.passengerFirstName} {booking.passengerLastName}</p>
                        <p className="text-sm text-red-600 font-medium">
                          Driver: {booking.driverFirstName} {booking.driverLastName}
                        </p>
                      </div>
                      <Badge className={booking.status === 'in_progress' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-blue-100 text-blue-700 border border-blue-200'}>
                        {booking.status === 'in_progress' ? 'In Progress' : 'Confirmed'}
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm text-gray-900">
                      <div className="flex items-start space-x-2">
                        <MapPin className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
                        <span className="line-clamp-1">{booking.pickupAddress}</span>
                      </div>
                      {booking.destinationAddress && (
                        <div className="flex items-start space-x-2">
                          <MapPin className="w-4 h-4 mt-0.5 text-red-600 flex-shrink-0" />
                          <span className="line-clamp-1">{booking.destinationAddress}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Assign Driver Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-sm bg-white">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Assign Driver</DialogTitle>
            <DialogDescription>Select an available driver for this ride</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
              <SelectTrigger data-testid="select-driver">
                <SelectValue placeholder="Choose a driver" />
              </SelectTrigger>
              <SelectContent>
                {availableDrivers.map((driver) => (
                  <SelectItem key={driver.id} value={driver.id} data-testid={`option-driver-${driver.id}`}>
                    {driver.firstName} {driver.lastName} {driver.rating && `(${driver.rating}★)`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleAssignSubmit}
              disabled={assignDriverMutation.isPending || !selectedDriverId}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
              data-testid="button-confirm-assign"
            >
              {assignDriverMutation.isPending ? 'Assigning...' : 'Confirm Assignment'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fleet Monitor Dialog */}
      <Dialog open={fleetDialogOpen} onOpenChange={setFleetDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Fleet Monitor</DialogTitle>
            <DialogDescription>Real-time driver locations and status</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {allActiveDrivers.length === 0 ? (
              <div className="text-center p-6">
                <Car className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No drivers available</p>
              </div>
            ) : (
              allActiveDrivers.map((driver) => {
                const location = parseLocation(driver.currentLocation);
                return (
                  <Card key={driver.id} className="border border-gray-200 bg-white shadow-sm" data-testid={`driver-card-${driver.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <div className={`w-2 h-2 rounded-full ${driver.isAvailable ? 'bg-green-500' : 'bg-gray-400'}`} />
                            <p className="font-semibold text-gray-900">{driver.firstName} {driver.lastName}</p>
                          </div>
                          <p className="text-xs text-gray-600">{driver.email}</p>
                          {driver.phone && (
                            <a href={`tel:${driver.phone}`} className="text-xs text-red-600 flex items-center space-x-1 mt-1">
                              <Phone className="w-3 h-3" />
                              <span>{driver.phone}</span>
                            </a>
                          )}
                        </div>
                        <Badge variant={driver.isAvailable ? "default" : "secondary"} className={driver.isAvailable ? "bg-green-100 text-green-700 border border-green-200" : ""}>
                          {driver.isAvailable ? 'Available' : 'Busy'}
                        </Badge>
                      </div>
                      
                      {driver.rating && (
                        <div className="text-sm text-gray-600 mb-2">
                          Rating: {driver.rating}★ • {driver.totalRides || 0} rides
                        </div>
                      )}

                      {location && driver.isAvailable && (
                        <Button
                          onClick={() => openNavigation(driver)}
                          variant="outline"
                          size="sm"
                          className="w-full mt-2 border-gray-300 hover:bg-gray-50"
                          data-testid={`button-navigate-${driver.id}`}
                        >
                          <Navigation2 className="w-4 h-4 mr-2" />
                          View on Map
                        </Button>
                      )}

                      {!location && driver.isAvailable && (
                        <div className="flex items-center space-x-1 text-xs text-gray-500 mt-2">
                          <AlertCircle className="w-3 h-3" />
                          <span>Location not available</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
