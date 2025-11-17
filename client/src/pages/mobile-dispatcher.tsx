import { useState } from 'react';
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
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [fleetDialogOpen, setFleetDialogOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dispatcher/stats'],
  });

  // Fetch all bookings
  const { data: bookings, isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ['/api/admin/bookings'],
  });

  // Fetch all drivers
  const { data: drivers, isLoading: driversLoading } = useQuery<Driver[]>({
    queryKey: ['/api/admin/drivers'],
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

  if (statsLoading || bookingsLoading || driversLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-primary/90 to-primary/80 dark:from-primary dark:via-primary/95 dark:to-primary/85 flex items-center justify-center">
        <div className="text-primary-foreground text-center">
          <Activity className="w-12 h-12 animate-spin mx-auto mb-4" />
          <p>Loading dispatcher dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/90 to-primary/80 dark:from-primary dark:via-primary/95 dark:to-primary/85">
      {/* Header */}
      <div className="bg-primary-foreground/10 dark:bg-primary-foreground/15 backdrop-blur border-b border-primary-foreground/20 dark:border-primary-foreground/25 sticky top-0 z-10">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/')}
              className="text-primary-foreground hover:bg-primary-foreground/20"
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-primary-foreground">Dispatch Center</h1>
              <p className="text-xs text-primary-foreground/80">Fleet Management</p>
            </div>
          </div>
          <Button
            onClick={() => setFleetDialogOpen(true)}
            className="bg-primary-foreground/20 dark:bg-primary-foreground/25 hover:bg-primary-foreground/30 dark:bg-primary-foreground/35 text-primary-foreground"
            size="sm"
            data-testid="button-fleet-monitor"
          >
            <MapPin className="w-4 h-4 mr-1" />
            Fleet
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="p-4 grid grid-cols-2 gap-3">
        <Card className="bg-primary-foreground/10 dark:bg-primary-foreground/15 border-primary-foreground/20 dark:border-primary-foreground/25 backdrop-blur">
          <CardContent className="p-4 text-center">
            <Car className="w-6 h-6 text-green-300 mx-auto mb-2" />
            <p className="text-2xl font-bold text-primary-foreground" data-testid="stat-active-drivers">{stats?.activeDrivers || 0}</p>
            <p className="text-xs text-primary-foreground/80">Active Drivers</p>
          </CardContent>
        </Card>
        <Card className="bg-primary-foreground/10 dark:bg-primary-foreground/15 border-primary-foreground/20 dark:border-primary-foreground/25 backdrop-blur">
          <CardContent className="p-4 text-center">
            <Activity className="w-6 h-6 text-blue-300 mx-auto mb-2" />
            <p className="text-2xl font-bold text-primary-foreground" data-testid="stat-active-rides">{stats?.activeRides || 0}</p>
            <p className="text-xs text-primary-foreground/80">Active Rides</p>
          </CardContent>
        </Card>
        <Card className="bg-primary-foreground/10 dark:bg-primary-foreground/15 border-primary-foreground/20 dark:border-primary-foreground/25 backdrop-blur">
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 text-orange-300 mx-auto mb-2" />
            <p className="text-2xl font-bold text-primary-foreground" data-testid="stat-pending-requests">{stats?.pendingRequests || 0}</p>
            <p className="text-xs text-primary-foreground/80">Pending</p>
          </CardContent>
        </Card>
        <Card className="bg-primary-foreground/10 dark:bg-primary-foreground/15 border-primary-foreground/20 dark:border-primary-foreground/25 backdrop-blur">
          <CardContent className="p-4 text-center">
            <Users className="w-6 h-6 text-primary-foreground/90 mx-auto mb-2" />
            <p className="text-2xl font-bold text-primary-foreground" data-testid="stat-utilization">{stats?.fleetUtilization || '0%'}</p>
            <p className="text-xs text-primary-foreground/80">Utilization</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Rides */}
      <div className="p-4">
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-primary-foreground/10 dark:bg-primary-foreground/15 backdrop-blur">
            <TabsTrigger value="pending" className="data-[state=active]:bg-card data-[state=active]:text-primary" data-testid="tab-pending">
              Pending ({pendingBookings.length})
            </TabsTrigger>
            <TabsTrigger value="assigned" className="data-[state=active]:bg-card data-[state=active]:text-primary" data-testid="tab-assigned">
              Assigned ({assignedBookings.length})
            </TabsTrigger>
            <TabsTrigger value="active" className="data-[state=active]:bg-card data-[state=active]:text-primary" data-testid="tab-active">
              Active ({activeBookings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4 space-y-3">
            {pendingBookings.length === 0 ? (
              <Card className="bg-primary-foreground/10 dark:bg-primary-foreground/15 border-primary-foreground/20 dark:border-primary-foreground/25 backdrop-blur">
                <CardContent className="p-8 text-center">
                  <Clock className="w-12 h-12 text-primary-foreground/50 mx-auto mb-3" />
                  <p className="text-primary-foreground/80">No pending bookings</p>
                </CardContent>
              </Card>
            ) : (
              pendingBookings.map((booking) => (
                <Card key={booking.id} className="bg-card border-0 shadow-lg" data-testid={`booking-pending-${booking.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-foreground">{booking.passengerFirstName} {booking.passengerLastName}</p>
                        <Badge variant="outline" className="mt-1">{booking.vehicleTypeName}</Badge>
                      </div>
                      <Badge className="bg-orange-500">{booking.bookingType}</Badge>
                    </div>
                    <div className="space-y-2 text-sm text-foreground mb-3">
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
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
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
              <Card className="bg-primary-foreground/10 dark:bg-primary-foreground/15 border-primary-foreground/20 dark:border-primary-foreground/25 backdrop-blur">
                <CardContent className="p-8 text-center">
                  <CheckCircle2 className="w-12 h-12 text-primary-foreground/50 mx-auto mb-3" />
                  <p className="text-primary-foreground/80">No assigned bookings</p>
                </CardContent>
              </Card>
            ) : (
              assignedBookings.map((booking) => (
                <Card key={booking.id} className="bg-card border-0 shadow-lg" data-testid={`booking-assigned-${booking.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-foreground">{booking.passengerFirstName} {booking.passengerLastName}</p>
                        <p className="text-sm text-primary font-medium">
                          Driver: {booking.driverFirstName} {booking.driverLastName}
                        </p>
                      </div>
                      <Badge className="bg-blue-500">Assigned</Badge>
                    </div>
                    <div className="space-y-2 text-sm text-foreground mb-3">
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
                      className="w-full"
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
              <Card className="bg-primary-foreground/10 dark:bg-primary-foreground/15 border-primary-foreground/20 dark:border-primary-foreground/25 backdrop-blur">
                <CardContent className="p-8 text-center">
                  <Activity className="w-12 h-12 text-primary-foreground/50 mx-auto mb-3" />
                  <p className="text-primary-foreground/80">No active rides</p>
                </CardContent>
              </Card>
            ) : (
              activeBookings.map((booking) => (
                <Card key={booking.id} className="bg-card border-0 shadow-lg" data-testid={`booking-active-${booking.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-foreground">{booking.passengerFirstName} {booking.passengerLastName}</p>
                        <p className="text-sm text-primary font-medium">
                          Driver: {booking.driverFirstName} {booking.driverLastName}
                        </p>
                      </div>
                      <Badge className={booking.status === 'in_progress' ? 'bg-green-500' : 'bg-blue-500'}>
                        {booking.status === 'in_progress' ? 'In Progress' : 'Confirmed'}
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm text-foreground">
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
        <DialogContent className="max-w-sm bg-card">
          <DialogHeader>
            <DialogTitle className="text-primary">Assign Driver</DialogTitle>
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
              className="w-full bg-primary hover:bg-primary/90"
              data-testid="button-confirm-assign"
            >
              {assignDriverMutation.isPending ? 'Assigning...' : 'Confirm Assignment'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fleet Monitor Dialog */}
      <Dialog open={fleetDialogOpen} onOpenChange={setFleetDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto bg-card">
          <DialogHeader>
            <DialogTitle className="text-primary">Fleet Monitor</DialogTitle>
            <DialogDescription>Real-time driver locations and status</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {allActiveDrivers.length === 0 ? (
              <div className="text-center p-6">
                <Car className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No drivers available</p>
              </div>
            ) : (
              allActiveDrivers.map((driver) => {
                const location = parseLocation(driver.currentLocation);
                return (
                  <Card key={driver.id} className="border" data-testid={`driver-card-${driver.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <div className={`w-2 h-2 rounded-full ${driver.isAvailable ? 'bg-green-500' : 'bg-gray-400'}`} />
                            <p className="font-semibold text-foreground">{driver.firstName} {driver.lastName}</p>
                          </div>
                          <p className="text-xs text-muted-foreground">{driver.email}</p>
                          {driver.phone && (
                            <a href={`tel:${driver.phone}`} className="text-xs text-primary flex items-center space-x-1 mt-1">
                              <Phone className="w-3 h-3" />
                              <span>{driver.phone}</span>
                            </a>
                          )}
                        </div>
                        <Badge variant={driver.isAvailable ? "default" : "secondary"}>
                          {driver.isAvailable ? 'Available' : 'Busy'}
                        </Badge>
                      </div>
                      
                      {driver.rating && (
                        <div className="text-sm text-muted-foreground mb-2">
                          Rating: {driver.rating}★ • {driver.totalRides || 0} rides
                        </div>
                      )}

                      {location && driver.isAvailable && (
                        <Button
                          onClick={() => openNavigation(driver)}
                          variant="outline"
                          size="sm"
                          className="w-full mt-2"
                          data-testid={`button-navigate-${driver.id}`}
                        >
                          <Navigation2 className="w-4 h-4 mr-2" />
                          View on Map
                        </Button>
                      )}

                      {!location && driver.isAvailable && (
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground mt-2">
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
