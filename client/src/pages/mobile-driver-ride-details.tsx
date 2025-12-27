import { useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, MapPin, User, Phone, Mail, Calendar, DollarSign, Package, Baby, Navigation, CheckCircle2, Clock, Plane, Users, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';

// Decline reason options
const DECLINE_REASONS = [
  { value: 'timing_conflict', label: 'Timing Conflict', description: 'Schedule doesn\'t work for me' },
  { value: 'pricing_issue', label: 'Pricing Issue', description: 'Fare is too low for this trip' },
  { value: 'too_far_away', label: 'Too Far Away', description: 'Pickup location is too far' },
  { value: 'vehicle_unavailable', label: 'Vehicle Unavailable', description: 'My vehicle is not available' },
  { value: 'personal_emergency', label: 'Personal Emergency', description: 'I have an emergency situation' },
  { value: 'other', label: 'Other Reason', description: 'Something else' },
] as const;

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
  bookingType: 'transfer' | 'hourly';
  requestedHours: number | null;
  vehicleTypeId: string;
  vehicleTypeName?: string;
  passengerCount: number;
  luggageCount: number;
  babySeat: boolean;
  finalPrice: number;
  driverPayment?: number | string | null;
  status: string;
  passengerName?: string;
  passengerPhone?: string;
  passengerEmail?: string;
  specialRequests?: string;
  acceptedAt?: string | null;
  driverAcceptanceStatus?: 'pending' | 'accepted' | 'declined' | null;
  declinedAt?: string | null;
  declineReason?: string | null;
  declineNotes?: string | null;
  startedAt?: string | null;
  dodAt?: string | null;
  pobAt?: string | null;
  endedAt?: string | null;
  flightNumber?: string | null;
  flightAirline?: string | null;
  flightDepartureAirport?: string | null;
  flightArrivalAirport?: string | null;
  flightDepartureTerminal?: string | null;
  flightArrivalTerminal?: string | null;
  flightBaggageClaim?: string | null;
}

export default function MobileDriverRideDetails() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Decline dialog state
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [selectedDeclineReason, setSelectedDeclineReason] = useState<string>('');
  const [declineNotes, setDeclineNotes] = useState('');

  // Fetch booking details
  const { data: booking, isLoading, isError, error } = useQuery<Booking>({
    queryKey: ['/api/bookings', id],
    retry: false,
    enabled: !!id,
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

  // Decline job mutation
  const declineJobMutation = useMutation({
    mutationFn: async ({ reason, notes }: { reason: string; notes?: string }) => {
      const response = await apiRequest('POST', '/api/driver/job/decline', {
        bookingId: id,
        reason,
        notes,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      setShowDeclineDialog(false);
      setSelectedDeclineReason('');
      setDeclineNotes('');
      toast({
        title: "Job Declined",
        description: "You have declined this job",
      });
      // Navigate back to dashboard since job is no longer assigned
      setLocation('/mobile-driver');
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to decline job.",
        variant: "destructive",
      });
    },
  });

  const handleDeclineSubmit = () => {
    if (!selectedDeclineReason) {
      toast({
        title: "Select a Reason",
        description: "Please select a reason for declining this job.",
        variant: "destructive",
      });
      return;
    }
    declineJobMutation.mutate({ 
      reason: selectedDeclineReason, 
      notes: declineNotes || undefined 
    });
  };

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

  // Check if driver can start trip (within 150 minutes of scheduled time)
  const canStartTrip = (booking: any) => {
    // Use scheduledTime or scheduledDateTime (API returns scheduledDateTime)
    const scheduledTimeValue = booking.scheduledTime || booking.scheduledDateTime;
    if (booking.status !== 'confirmed' || !scheduledTimeValue) return true;
    
    const now = new Date();
    const scheduledTime = new Date(scheduledTimeValue);
    const minutesUntilPickup = (scheduledTime.getTime() - now.getTime()) / (1000 * 60);
    
    return minutesUntilPickup <= 150;
  };

  // Get minutes until trip can be started
  const getMinutesUntilCanStart = (booking: any) => {
    // Use scheduledTime or scheduledDateTime (API returns scheduledDateTime)
    const scheduledTimeValue = booking.scheduledTime || booking.scheduledDateTime;
    if (!scheduledTimeValue) return 0;
    
    const now = new Date();
    const scheduledTime = new Date(scheduledTimeValue);
    const minutesUntilPickup = (scheduledTime.getTime() - now.getTime()) / (1000 * 60);
    const minutesUntilCanStart = minutesUntilPickup - 150;
    
    return Math.max(0, Math.ceil(minutesUntilCanStart));
  };

  // Format minutes into hours and minutes display
  const formatWaitingTime = (totalMinutes: number) => {
    if (totalMinutes <= 0) return 'Available now';
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
  };

  // Check if job needs acceptance/decline decision
  const needsAcceptanceDecision = (booking: any) => {
    // If booking status is 'confirmed' or beyond, job has been accepted
    // This handles cases where job was accepted from dashboard or other pages
    if (booking.status === 'confirmed' || booking.status === 'in_progress' || booking.status === 'completed') {
      return false;
    }
    
    // Cancelled jobs don't need decision
    if (booking.status === 'cancelled') {
      return false;
    }
    
    // If driverAcceptanceStatus is explicitly 'accepted' or 'declined', no decision needed
    if (booking.driverAcceptanceStatus === 'accepted' || booking.driverAcceptanceStatus === 'declined') {
      return false;
    }
    
    // If acceptedAt timestamp exists, job was accepted (legacy data)
    if (booking.acceptedAt) {
      return false;
    }
    
    // Job needs decision ONLY if status is pending_driver_acceptance AND driverAcceptanceStatus is pending (or not set)
    if (booking.status === 'pending_driver_acceptance') {
      // Only show if not already declined/accepted
      return booking.driverAcceptanceStatus === 'pending' || !booking.driverAcceptanceStatus;
    }
    
    // Default: no decision needed (safe fallback)
    return false;
  };

  // Determine next journey action based on current booking data
  const getNextJourneyAction = (booking: any) => {
    // If job needs acceptance decision, return null - we'll show accept/decline buttons separately
    if (needsAcceptanceDecision(booking)) {
      return null;
    }

    // Job was declined - no actions available
    if (booking.driverAcceptanceStatus === 'declined') {
      return null;
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

  if (!id) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-accent/5 dark:from-background dark:to-primary/5 flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <MapPin className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Invalid Ride</h2>
            <p className="text-muted-foreground mb-4">
              No ride ID was provided.
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

  if (isError || !booking) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-accent/5 dark:from-background dark:to-primary/5 flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <MapPin className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Ride Not Found</h2>
            <p className="text-muted-foreground mb-4">
              {isError && error instanceof Error 
                ? error.message.includes('403') 
                  ? "You don't have access to this ride."
                  : error.message.includes('404')
                    ? "This ride could not be found."
                    : "An error occurred while loading ride details."
                : "This ride could not be found or you don't have access to it."}
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
      {/* Header with safe area for phone notch/camera */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-primary-foreground p-6 pt-[calc(30px+1.5rem)] shadow-lg">
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
          <Badge className={`${getStatusColor(booking.status || '')} text-sm`} data-testid="badge-status">
            {(booking.status || 'Unknown').replace('_', ' ')}
          </Badge>
          <p className="text-2xl font-bold">${parseFloat(String(booking.driverPayment ?? 0)).toFixed(2)}</p>
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
                {booking.scheduledTime 
                  ? format(new Date(booking.scheduledTime), 'EEEE, MMMM d, yyyy \'at\' h:mm a')
                  : 'Time not set'}
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
                  {booking.bookingType === 'hourly' ? 'Hourly' : 'Transfer'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Vehicle Type</p>
                <p className="text-sm font-medium text-foreground capitalize" data-testid="text-vehicle-type">
                  {booking.vehicleTypeName || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Passengers</p>
                <p className="text-sm font-medium text-foreground flex items-center" data-testid="text-passengers">
                  <Users className="w-3 h-3 mr-1" />
                  {booking.passengerCount ?? 1}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Luggage</p>
                <p className="text-sm font-medium text-foreground flex items-center" data-testid="text-luggage">
                  <Package className="w-3 h-3 mr-1" />
                  {booking.luggageCount ?? 0}
                </p>
              </div>
            </div>

            {booking.babySeat && (
              <div className="flex items-center text-sm">
                <Baby className="w-4 h-4 mr-2 text-blue-600" />
                <span className="text-foreground font-medium" data-testid="text-baby-seat">Baby seat required</span>
              </div>
            )}

            {booking.bookingType === 'hourly' && booking.requestedHours && (
              <div>
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="text-sm font-medium text-foreground" data-testid="text-duration">
                  {booking.requestedHours} hours
                </p>
              </div>
            )}

            {booking.flightNumber && (
              <div className="border-t pt-3 mt-3">
                <div className="flex items-center mb-2">
                  <Plane className="w-4 h-4 mr-2 text-blue-600" />
                  <span className="text-sm font-medium text-foreground">Flight Information</span>
                </div>
                <div className="grid grid-cols-2 gap-3 bg-blue-50 dark:bg-slate-800 p-3 rounded-lg border dark:border-slate-700">
                  <div>
                    <p className="text-xs text-muted-foreground">Flight Number</p>
                    <p className="text-sm font-bold text-foreground" data-testid="text-flight-number">
                      {booking.flightNumber}
                    </p>
                  </div>
                  {booking.flightAirline && (
                    <div>
                      <p className="text-xs text-muted-foreground">Airline</p>
                      <p className="text-sm font-medium text-foreground" data-testid="text-flight-airline">
                        {booking.flightAirline}
                      </p>
                    </div>
                  )}
                  {booking.flightDepartureAirport && (
                    <div>
                      <p className="text-xs text-muted-foreground">From</p>
                      <p className="text-sm font-medium text-foreground" data-testid="text-flight-departure">
                        {booking.flightDepartureAirport}
                        {booking.flightDepartureTerminal && (
                          <span className="text-muted-foreground ml-1">(T{booking.flightDepartureTerminal})</span>
                        )}
                      </p>
                    </div>
                  )}
                  {booking.flightArrivalAirport && (
                    <div>
                      <p className="text-xs text-muted-foreground">To</p>
                      <p className="text-sm font-medium text-foreground" data-testid="text-flight-arrival">
                        {booking.flightArrivalAirport}
                        {booking.flightArrivalTerminal && (
                          <span className="text-muted-foreground ml-1">(T{booking.flightArrivalTerminal})</span>
                        )}
                      </p>
                    </div>
                  )}
                  {booking.flightBaggageClaim && (
                    <div>
                      <p className="text-xs text-muted-foreground">Baggage Claim</p>
                      <p className="text-sm font-bold text-foreground" data-testid="text-flight-baggage">
                        {booking.flightBaggageClaim}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {booking.specialRequests && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Special Requests</p>
                <p className="text-sm text-foreground bg-yellow-100 dark:bg-amber-900/40 p-2 rounded border border-yellow-200 dark:border-amber-700" data-testid="text-special-requests">
                  {booking.specialRequests}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Accept/Decline Buttons - shown when job needs decision */}
        {needsAcceptanceDecision(booking) && (
          <div className="space-y-3">
            <Button
              onClick={() => acceptJobMutation.mutate()}
              disabled={acceptJobMutation.isPending || declineJobMutation.isPending}
              className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg font-semibold shadow-lg"
              data-testid="button-accept-job"
            >
              <CheckCircle2 className="w-5 h-5 mr-2" />
              {acceptJobMutation.isPending ? 'Accepting...' : 'Accept Job'}
            </Button>
            <Button
              onClick={() => setShowDeclineDialog(true)}
              disabled={acceptJobMutation.isPending || declineJobMutation.isPending}
              variant="outline"
              className="w-full border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 h-12 text-lg font-semibold shadow-lg"
              data-testid="button-decline-job"
            >
              <XCircle className="w-5 h-5 mr-2" />
              Decline Job
            </Button>
          </div>
        )}

        {/* Journey Action Button - shown after job accepted */}
        {nextAction && (
          <>
            {/* Show waiting time card when Start Trip is not yet available */}
            {nextAction.label === 'Start Trip' && !canStartTrip(booking) ? (
              <div className="space-y-3">
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-800 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-amber-800 dark:text-amber-300">Waiting for Start Time</h4>
                      <p className="text-sm text-amber-600 dark:text-amber-400">Trip can start 2.5 hours before pickup</p>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-amber-950/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Available to start in</p>
                    <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                      {formatWaitingTime(getMinutesUntilCanStart(booking))}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-center p-3 bg-green-100 dark:bg-green-900/40 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                  <span className="text-green-700 dark:text-green-400 font-medium text-sm">Job Accepted</span>
                </div>
              </div>
            ) : (
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
          </>
        )}

        {/* Accepted Badge - shown when job is accepted and completed */}
        {booking.driverAcceptanceStatus === 'accepted' && !nextAction && (
          <div className="flex items-center justify-center p-4 bg-green-100 dark:bg-green-900/40 rounded-lg">
            <CheckCircle2 className="w-5 h-5 mr-2 text-green-600" />
            <span className="text-green-700 dark:text-green-400 font-semibold">Job Completed</span>
          </div>
        )}
      </div>

      {/* Decline Reason Dialog */}
      <Dialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Decline Job</DialogTitle>
            <DialogDescription>
              Please select a reason for declining this job. This helps us improve future assignments.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <RadioGroup
              value={selectedDeclineReason}
              onValueChange={setSelectedDeclineReason}
              className="space-y-3"
            >
              {DECLINE_REASONS.map((reason) => (
                <div
                  key={reason.value}
                  className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedDeclineReason === reason.value
                      ? 'border-red-500 bg-red-50 dark:bg-red-950/50'
                      : 'border-border hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedDeclineReason(reason.value)}
                >
                  <RadioGroupItem value={reason.value} id={reason.value} className="mt-0.5" />
                  <Label htmlFor={reason.value} className="flex-1 cursor-pointer">
                    <span className="font-medium block">{reason.label}</span>
                    <span className="text-sm text-muted-foreground">{reason.description}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>

            {selectedDeclineReason === 'other' && (
              <div className="space-y-2">
                <Label htmlFor="decline-notes">Additional Notes (optional)</Label>
                <Textarea
                  id="decline-notes"
                  placeholder="Please provide more details..."
                  value={declineNotes}
                  onChange={(e) => setDeclineNotes(e.target.value)}
                  className="resize-none"
                  rows={3}
                />
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeclineDialog(false);
                setSelectedDeclineReason('');
                setDeclineNotes('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeclineSubmit}
              disabled={!selectedDeclineReason || declineJobMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {declineJobMutation.isPending ? 'Declining...' : 'Confirm Decline'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
