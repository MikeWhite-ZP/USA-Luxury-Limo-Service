import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { LogOut, Car, MapPin, Clock, Activity, Users, CheckCircle2, AlertCircle, Navigation2, Phone, Mail, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggleMobile } from '@/components/ThemeToggle';
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
  isActive?: boolean;
  verificationStatus: string;
  currentLocation?: string;
  rating?: string;
  totalRides?: number;
}

export default function MobileDispatcher() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { logoutMutation } = useAuth();
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
  
  // Filter drivers - match website behavior using isActive
  const availableDrivers = drivers?.filter((d) => d.isAvailable && d.isActive !== false) || [];
  const allActiveDrivers = drivers?.filter((d) => d.isActive !== false) || [];

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
        title: t('notifications.driverAssigned'),
        description: t('driver.assignDriver'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
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
        title: t('common.required'),
        description: t('common.select'),
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground text-center">
          <Activity className="w-10 h-10 animate-spin mx-auto mb-3" style={{ color: 'var(--brand-accent-hex)' }} />
          <p>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      {/* Header with safe area for phone notch/camera */}
      <header className="bg-gradient-to-r from-slate-900 to-blue-900 text-white px-4 pb-4 pt-[54px] sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-[18px]">{t('roles.dispatcher')}</h1>
            <p className="text-xs text-blue-200">{t('admin.fleetManagement')}</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggleMobile className="bg-white/10 hover:bg-white/20" />
            <Button
              onClick={() => setFleetDialogOpen(true)}
              className="bg-white/10 hover:bg-white/20 text-white border-0"
              size="sm"
              data-testid="button-fleet-monitor"
            >
              <MapPin className="w-4 h-4 mr-1" />
              {t('nav.fleet')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                try {
                  await logoutMutation.mutateAsync();
                  setLocation('/');
                } catch {
                  toast({ title: 'Error', description: 'Failed to logout', variant: 'destructive' });
                }
              }}
              className="text-white hover:bg-white/10"
              data-testid="button-logout"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>
      {/* Stats Grid */}
      <div className="p-3 grid grid-cols-2 gap-2 sm:gap-3 sm:p-4">
        <Card className="bg-background border-green-200 shadow-sm">
          <CardContent className="p-3 sm:p-4 text-center">
            <Car className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 mx-auto mb-1 sm:mb-2" />
            <p className="text-xl sm:text-2xl font-bold text-foreground" data-testid="stat-active-drivers">{stats?.activeDrivers || 0}</p>
            <p className="text-xs text-muted-foreground">{t('admin.activeDrivers')}</p>
          </CardContent>
        </Card>
        <Card className="bg-background border-blue-200 shadow-sm">
          <CardContent className="p-3 sm:p-4 text-center">
            <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 mx-auto mb-1 sm:mb-2" />
            <p className="text-xl sm:text-2xl font-bold text-foreground" data-testid="stat-active-rides">{stats?.activeRides || 0}</p>
            <p className="text-xs text-muted-foreground">{t('admin.activeBookings')}</p>
          </CardContent>
        </Card>
        <Card className="bg-background border-orange-200 shadow-sm">
          <CardContent className="p-3 sm:p-4 text-center">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 mx-auto mb-1 sm:mb-2" />
            <p className="text-xl sm:text-2xl font-bold text-foreground" data-testid="stat-pending-requests">{stats?.pendingRequests || 0}</p>
            <p className="text-xs text-muted-foreground">{t('status.pending')}</p>
          </CardContent>
        </Card>
        <Card className="bg-background border-border shadow-sm">
          <CardContent className="p-3 sm:p-4 text-center">
            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground mx-auto mb-1 sm:mb-2" />
            <p className="text-xl sm:text-2xl font-bold text-foreground" data-testid="stat-utilization">{stats?.fleetUtilization || '0%'}</p>
            <p className="text-xs text-muted-foreground">Utilization</p>
          </CardContent>
        </Card>
      </div>
      {/* Tabs for Rides */}
      <div className="p-3 sm:p-4">
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-muted">
            <TabsTrigger value="pending" className="data-[state=active]:bg-background data-[state=active]:text-primary" data-testid="tab-pending">
              {t('status.pending')} ({pendingBookings.length})
            </TabsTrigger>
            <TabsTrigger value="assigned" className="data-[state=active]:bg-background data-[state=active]:text-primary" data-testid="tab-assigned">
              {t('status.confirmed')} ({assignedBookings.length})
            </TabsTrigger>
            <TabsTrigger value="active" className="data-[state=active]:bg-background data-[state=active]:text-primary" data-testid="tab-active">
              {t('status.active')} ({activeBookings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4 space-y-3">
            {pendingBookings.length === 0 ? (
              <Card className="bg-background border-border shadow-sm">
                <CardContent className="p-8 text-center">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-muted-foreground">{t('status.pending')}: 0</p>
                </CardContent>
              </Card>
            ) : (
              pendingBookings.map((booking) => (
                <Card key={booking.id} className="bg-background border-border shadow-md" data-testid={`booking-pending-${booking.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-foreground">{booking.passengerFirstName} {booking.passengerLastName}</p>
                        <Badge variant="outline" className="mt-1 border-border">{booking.vehicleTypeName}</Badge>
                      </div>
                      <Badge className="bg-orange-100 text-orange-700 border border-orange-200">{booking.bookingType}</Badge>
                    </div>
                    <div className="space-y-2 text-sm text-foreground mb-3">
                      <div className="flex items-start space-x-2">
                        <MapPin className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
                        <span className="line-clamp-1">{booking.pickupAddress}</span>
                      </div>
                      {booking.destinationAddress && (
                        <div className="flex items-start space-x-2">
                          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--brand-accent-hex)' }} />
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
                      {t('driver.assignDriver')}
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="assigned" className="mt-4 space-y-3">
            {assignedBookings.length === 0 ? (
              <Card className="bg-background border-border shadow-sm">
                <CardContent className="p-8 text-center">
                  <CheckCircle2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-muted-foreground">{t('status.confirmed')}: 0</p>
                </CardContent>
              </Card>
            ) : (
              assignedBookings.map((booking) => (
                <Card key={booking.id} className="bg-background border-border shadow-md" data-testid={`booking-assigned-${booking.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-foreground">{booking.passengerFirstName} {booking.passengerLastName}</p>
                        <p className="text-sm font-medium" style={{ color: 'var(--brand-accent-hex)' }}>
                          Driver: {booking.driverFirstName} {booking.driverLastName}
                        </p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-700 border border-blue-200">Assigned</Badge>
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
                      className="w-full border-border hover:bg-muted"
                      size="sm"
                      data-testid={`button-reassign-${booking.id}`}
                    >
                      {t('driver.assignDriver')}
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="active" className="mt-4 space-y-3">
            {activeBookings.length === 0 ? (
              <Card className="bg-background border-border shadow-sm">
                <CardContent className="p-8 text-center">
                  <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-muted-foreground">No active rides</p>
                </CardContent>
              </Card>
            ) : (
              activeBookings.map((booking) => (
                <Card key={booking.id} className="bg-background border-border shadow-md" data-testid={`booking-active-${booking.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-foreground">{booking.passengerFirstName} {booking.passengerLastName}</p>
                        <p className="text-sm font-medium" style={{ color: 'var(--brand-accent-hex)' }}>
                          Driver: {booking.driverFirstName} {booking.driverLastName}
                        </p>
                      </div>
                      <Badge className={booking.status === 'in_progress' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-blue-100 text-blue-700 border border-blue-200'}>
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
                          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--brand-accent-hex)' }} />
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
        <DialogContent className="max-w-sm bg-background">
          <DialogHeader>
            <DialogTitle className="text-foreground">{t('driver.assignDriver')}</DialogTitle>
            <DialogDescription>{t('common.select')}</DialogDescription>
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
              {assignDriverMutation.isPending ? t('common.loading') : t('common.confirm')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Fleet Monitor Dialog */}
      <Dialog open={fleetDialogOpen} onOpenChange={setFleetDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto bg-background">
          <DialogHeader>
            <DialogTitle className="text-foreground">{t('admin.fleetManagement')}</DialogTitle>
            <DialogDescription>{t('admin.drivers')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {allActiveDrivers.length === 0 ? (
              <div className="text-center p-6">
                <Car className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-muted-foreground">{t('admin.drivers')}: 0</p>
              </div>
            ) : (
              allActiveDrivers.map((driver) => {
                const location = parseLocation(driver.currentLocation);
                return (
                  <Card key={driver.id} className="border-0 shadow-sm" data-testid={`driver-card-${driver.id}`}>
                    <CardContent className="p-2">
                      {/* Row 1: Status dot, Name, Badge, Map button */}
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${driver.isAvailable ? 'bg-green-500' : 'bg-gray-400'}`} />
                          <span className="font-bold text-[11px] text-foreground truncate">{driver.firstName} {driver.lastName}</span>
                          <span className={`text-[7px] px-1 py-0.5 rounded-full font-bold uppercase flex-shrink-0 ${
                            driver.isAvailable ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {driver.isAvailable ? 'Free' : 'Busy'}
                          </span>
                        </div>
                        {location && driver.isAvailable && (
                          <button
                            onClick={() => openNavigation(driver)}
                            className="p-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors flex-shrink-0"
                            data-testid={`button-navigate-${driver.id}`}
                          >
                            <Navigation2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      
                      {/* Row 2: Phone, Rating, Rides */}
                      <div className="flex items-center gap-2 mt-0.5 pl-3.5 text-[9px] text-muted-foreground">
                        {driver.phone && (
                          <div className="flex items-center gap-1">
                            <a 
                              href={`tel:${driver.phone}`} 
                              className="p-1 rounded bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                              title="Call driver"
                            >
                              <Phone className="w-3 h-3" />
                            </a>
                            <a 
                              href={`sms:${driver.phone}`} 
                              className="p-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                              title="Text driver"
                            >
                              <MessageSquare className="w-3 h-3" />
                            </a>
                            <span className="text-muted-foreground">{driver.phone}</span>
                          </div>
                        )}
                        <span className="text-yellow-600">★ {driver.rating || '0.0'}</span>
                        <span>{driver.totalRides || 0} rides</span>
                        {!location && driver.isAvailable && (
                          <span className="flex items-center gap-0.5 text-orange-500">
                            <AlertCircle className="w-2.5 h-2.5" />
                            No GPS
                          </span>
                        )}
                      </div>
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
