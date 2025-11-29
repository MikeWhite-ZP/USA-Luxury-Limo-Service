import { useLocation, useParams } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, MapPin, User, Phone, Mail, Calendar, DollarSign, Package, Baby, Navigation, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';

interface Booking {
  id: number;
  passengerId: number;
  pickupAddress: string;
  pickupLat: number | null;
  pickupLon: number | null;
  viaAddress: string | null;
  viaLat: number | null;
  viaLon: number | null;
  destinationAddress: string;
  destinationLat: number | null;
  destinationLon: number | null;
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
  specialRequests?: string;
}

export default function MobileDriverRideDetails() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch booking details
  const { data: booking, isLoading } = useQuery<Booking>({
    queryKey: ['/api/bookings', id],
    retry: false,
  });

  // Helper function to get current GPS coordinates
  const getCurrentLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          reject(error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  // Journey event mutations
  const acceptJobMutation = useMutation({
    mutationFn: async () => {
      const location = await getCurrentLocation();
      const response = await apiRequest('POST', '/api/driver/job/accept', {
        bookingId: id,
        lat: location.lat,
        lng: location.lng,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      toast({
        title: "Job Accepted",
        description: "You have accepted this job",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to accept job. Please enable location access.",
        variant: "destructive",
      });
    },
  });

  const startTripMutation = useMutation({
    mutationFn: async () => {
      const location = await getCurrentLocation();
      const response = await apiRequest('POST', '/api/driver/job/start', {
        bookingId: id,
        lat: location.lat,
        lng: location.lng,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      toast({
        title: "Trip Started",
        description: "Trip has been started",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start trip. Please enable location access.",
        variant: "destructive",
      });
    },
  });

  const dodMutation = useMutation({
    mutationFn: async () => {
      const location = await getCurrentLocation();
      const response = await apiRequest('POST', '/api/driver/job/dod', {
        bookingId: id,
        lat: location.lat,
        lng: location.lng,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      toast({
        title: "Driver On Destination",
        description: "You have arrived at the pickup location",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update DOD. Please enable location access.",
        variant: "destructive",
      });
    },
  });

  const pobMutation = useMutation({
    mutationFn: async () => {
      const location = await getCurrentLocation();
      const response = await apiRequest('POST', '/api/driver/job/pob', {
        bookingId: id,
        lat: location.lat,
        lng: location.lng,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      toast({
        title: "Passenger On Board",
        description: "Passenger is on board",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update POB. Please enable location access.",
        variant: "destructive",
      });
    },
  });

  const endTripMutation = useMutation({
    mutationFn: async () => {
      const location = await getCurrentLocation();
      const response = await apiRequest('POST', '/api/driver/job/end', {
        bookingId: id,
        lat: location.lat,
        lng: location.lng,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      toast({
        title: "Trip Completed",
        description: "Trip has been completed successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to end trip. Please enable location access.",
        variant: "destructive",
      });
    },
  });

  const openNavigation = (address: string, lat: number | null, lng: number | null) => {
    // If we have coordinates, use them for more accurate navigation
    if (lat && lng) {
      // Universal link that works on both iOS and Android
      // iOS will open Apple Maps, Android will offer Google Maps
      const url = `https://maps.google.com/maps?daddr=${lat},${lng}`;
      window.open(url, '_blank');
    } else {
      // Fallback to address-based navigation
      const encodedAddress = encodeURIComponent(address);
      const url = `https://maps.google.com/maps?daddr=${encodedAddress}`;
      window.open(url, '_blank');
    }
    
    toast({
      title: "Opening Navigation",
      description: "Launching your device's navigation app...",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-primary/10 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-muted text-gray-800';
    }
  };

  // Determine next journey action based on current booking data
  const getNextJourneyAction = (booking: any) => {
    // Check if driver has accepted the job
    if (!booking.acceptedAt) {
      return { 
        label: 'Accept Job', 
        mutation: acceptJobMutation,
        icon: CheckCircle2,
        color: 'bg-blue-600 hover:bg-blue-700'
      };
    }
    
    // Check if trip has started
    if (!booking.startedAt) {
      return { 
        label: 'Start Trip', 
        mutation: startTripMutation,
        icon: Clock,
        color: 'bg-primary hover:bg-primary/90'
      };
    }
    
    // Check if driver is on destination
    if (!booking.dodAt) {
      return { 
        label: 'Driver On Destination', 
        mutation: dodMutation,
        icon: MapPin,
        color: 'bg-purple-600 hover:bg-purple-700'
      };
    }
    
    // Check if passenger is on board
    if (!booking.pobAt) {
      return { 
        label: 'Passenger On Board', 
        mutation: pobMutation,
        icon: User,
        color: 'bg-yellow-600 hover:bg-yellow-700'
      };
    }
    
    // Check if trip has ended
    if (!booking.endedAt) {
      return { 
        label: 'End Trip', 
        mutation: endTripMutation,
        icon: CheckCircle2,
        color: 'bg-red-600 hover:bg-red-700'
      };
    }
    
    // Trip is completed
    return null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-accent/5 dark:from-background dark:to-primary/5 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading ride details...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-accent/5 dark:from-background dark:to-primary/5 flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <MapPin className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Ride Not Found</h2>
            <p className="text-muted-foreground mb-4">
              This ride could not be found or you don't have access to it.
            </p>
            <Button 
              onClick={() => setLocation('/mobile-driver')}
              className="bg-primary hover:bg-primary/90"
              data-testid="button-back-to-dashboard"
            >
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const nextAction = getNextJourneyAction(booking);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent/5 dark:from-background dark:to-primary/5 pb-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-primary-foreground p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/mobile-driver')}
            className="text-primary-foreground hover:bg-primary-foreground/20"
            data-testid="button-back"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-xl font-bold" data-testid="header-title">Ride Details</h1>
          <div className="w-10"></div>
        </div>

        <div className="flex items-center justify-between">
          <Badge className={`${getStatusColor(booking.status)} text-sm`} data-testid="badge-status">
            {booking.status.replace('_', ' ')}
          </Badge>
          <p className="text-2xl font-bold">${booking.finalPrice.toFixed(2)}</p>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Passenger Information */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <User className="w-5 h-5 mr-2 text-primary" />
              Passenger Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {booking.passengerName && (
              <div className="flex items-center">
                <User className="w-4 h-4 mr-2 text-muted-foreground" />
                <span className="text-foreground font-medium" data-testid="text-passenger-name">
                  {booking.passengerName}
                </span>
              </div>
            )}
            {booking.passengerPhone && (
              <div className="flex items-center">
                <Phone className="w-4 h-4 mr-2 text-muted-foreground" />
                <a 
                  href={`tel:${booking.passengerPhone}`}
                  className="text-primary font-medium hover:underline"
                  data-testid="link-passenger-phone"
                >
                  {booking.passengerPhone}
                </a>
              </div>
            )}
            {booking.passengerEmail && (
              <div className="flex items-center">
                <Mail className="w-4 h-4 mr-2 text-muted-foreground" />
                <a 
                  href={`mailto:${booking.passengerEmail}`}
                  className="text-primary text-sm hover:underline"
                  data-testid="link-passenger-email"
                >
                  {booking.passengerEmail}
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trip Details */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-primary" />
              Trip Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="w-4 h-4 mr-2" />
              <span data-testid="text-scheduled-time">
                {format(new Date(booking.scheduledTime), 'EEEE, MMMM d, yyyy \'at\' h:mm a')}
              </span>
            </div>

            {/* Pickup Address */}
            <div 
              className="border-l-4 border-green-500 pl-4 py-2 bg-primary/5/50 rounded-r cursor-pointer hover:bg-primary/5 transition-colors"
              onClick={() => openNavigation(booking.pickupAddress, booking.pickupLat, booking.pickupLon)}
              data-testid="button-navigate-pickup"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-1">Pickup Location</p>
                  <p className="text-sm font-medium text-foreground">{booking.pickupAddress}</p>
                </div>
                <Navigation className="w-5 h-5 text-primary ml-2 flex-shrink-0" />
              </div>
            </div>

            {/* Via Address */}
            {booking.viaAddress && (
              <div 
                className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50/50 rounded-r cursor-pointer hover:bg-blue-50 transition-colors"
                onClick={() => openNavigation(booking.viaAddress!, booking.viaLat, booking.viaLon)}
                data-testid="button-navigate-via"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-1">Via</p>
                    <p className="text-sm font-medium text-foreground">{booking.viaAddress}</p>
                  </div>
                  <Navigation className="w-5 h-5 text-blue-600 ml-2 flex-shrink-0" />
                </div>
              </div>
            )}

            {/* Dropoff Address */}
            <div 
              className="border-l-4 border-red-500 pl-4 py-2 bg-red-50/50 rounded-r cursor-pointer hover:bg-red-50 transition-colors"
              onClick={() => openNavigation(booking.destinationAddress, booking.destinationLat, booking.destinationLon)}
              data-testid="button-navigate-dropoff"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-1">Dropoff Location</p>
                  <p className="text-sm font-medium text-foreground">{booking.destinationAddress}</p>
                </div>
                <Navigation className="w-5 h-5 text-red-600 ml-2 flex-shrink-0" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Details */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-primary" />
              Service Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Service Type</p>
                <p className="text-sm font-medium text-foreground capitalize" data-testid="text-service-type">
                  {booking.serviceType}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Vehicle Type</p>
                <p className="text-sm font-medium text-foreground capitalize" data-testid="text-vehicle-type">
                  {booking.vehicleType.replace(/_/g, ' ')}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Passengers</p>
                <p className="text-sm font-medium text-foreground" data-testid="text-passengers">
                  {booking.passengers}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Luggage</p>
                <p className="text-sm font-medium text-foreground flex items-center" data-testid="text-luggage">
                  <Package className="w-3 h-3 mr-1" />
                  {booking.luggage}
                </p>
              </div>
            </div>

            {booking.babySeat && (
              <div className="flex items-center text-sm">
                <Baby className="w-4 h-4 mr-2 text-blue-600" />
                <span className="text-foreground font-medium" data-testid="text-baby-seat">Baby seat required</span>
              </div>
            )}

            {booking.serviceType === 'hourly' && booking.duration && (
              <div>
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="text-sm font-medium text-foreground" data-testid="text-duration">
                  {booking.duration} hours
                </p>
              </div>
            )}

            {booking.specialRequests && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Special Requests</p>
                <p className="text-sm text-foreground bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded border border-yellow-200 dark:border-yellow-800" data-testid="text-special-requests">
                  {booking.specialRequests}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Journey Action Button */}
        {nextAction && (
          <Button
            onClick={() => nextAction.mutation.mutate()}
            disabled={nextAction.mutation.isPending}
            className={`w-full ${nextAction.color} h-12 text-lg font-semibold shadow-lg`}
            data-testid={`button-${nextAction.label.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <nextAction.icon className="w-5 h-5 mr-2" />
            {nextAction.mutation.isPending ? 'Processing...' : nextAction.label}
          </Button>
        )}
      </div>
    </div>
  );
}
