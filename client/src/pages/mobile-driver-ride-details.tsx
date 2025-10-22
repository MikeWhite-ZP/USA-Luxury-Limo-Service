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
  pickupLng: number | null;
  viaAddress: string | null;
  viaLat: number | null;
  viaLng: number | null;
  dropoffAddress: string;
  dropoffLat: number | null;
  dropoffLng: number | null;
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

  // Update booking status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const response = await apiRequest('PATCH', `/api/bookings/${id}/status`, { status });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings', id] });
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
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusNextAction = (status: string) => {
    switch (status) {
      case 'confirmed': return { label: 'Start Ride', nextStatus: 'in_progress', icon: Clock };
      case 'in_progress': return { label: 'Complete Ride', nextStatus: 'completed', icon: CheckCircle2 };
      default: return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading ride details...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <MapPin className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Ride Not Found</h2>
            <p className="text-gray-600 mb-4">
              This ride could not be found or you don't have access to it.
            </p>
            <Button 
              onClick={() => setLocation('/mobile-driver')}
              className="bg-green-600 hover:bg-green-700"
              data-testid="button-back-to-dashboard"
            >
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const nextAction = getStatusNextAction(booking.status);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white pb-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/mobile-driver')}
            className="text-white hover:bg-white/20"
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
              <User className="w-5 h-5 mr-2 text-green-600" />
              Passenger Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {booking.passengerName && (
              <div className="flex items-center">
                <User className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-gray-900 font-medium" data-testid="text-passenger-name">
                  {booking.passengerName}
                </span>
              </div>
            )}
            {booking.passengerPhone && (
              <div className="flex items-center">
                <Phone className="w-4 h-4 mr-2 text-gray-500" />
                <a 
                  href={`tel:${booking.passengerPhone}`}
                  className="text-green-600 font-medium hover:underline"
                  data-testid="link-passenger-phone"
                >
                  {booking.passengerPhone}
                </a>
              </div>
            )}
            {booking.passengerEmail && (
              <div className="flex items-center">
                <Mail className="w-4 h-4 mr-2 text-gray-500" />
                <a 
                  href={`mailto:${booking.passengerEmail}`}
                  className="text-green-600 text-sm hover:underline"
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
              <MapPin className="w-5 h-5 mr-2 text-green-600" />
              Trip Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="w-4 h-4 mr-2" />
              <span data-testid="text-scheduled-time">
                {format(new Date(booking.scheduledTime), 'EEEE, MMMM d, yyyy \'at\' h:mm a')}
              </span>
            </div>

            {/* Pickup Address */}
            <div 
              className="border-l-4 border-green-500 pl-4 py-2 bg-green-50/50 rounded-r cursor-pointer hover:bg-green-50 transition-colors"
              onClick={() => openNavigation(booking.pickupAddress, booking.pickupLat, booking.pickupLng)}
              data-testid="button-navigate-pickup"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">Pickup Location</p>
                  <p className="text-sm font-medium text-gray-900">{booking.pickupAddress}</p>
                </div>
                <Navigation className="w-5 h-5 text-green-600 ml-2 flex-shrink-0" />
              </div>
            </div>

            {/* Via Address */}
            {booking.viaAddress && (
              <div 
                className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50/50 rounded-r cursor-pointer hover:bg-blue-50 transition-colors"
                onClick={() => openNavigation(booking.viaAddress!, booking.viaLat, booking.viaLng)}
                data-testid="button-navigate-via"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">Via</p>
                    <p className="text-sm font-medium text-gray-900">{booking.viaAddress}</p>
                  </div>
                  <Navigation className="w-5 h-5 text-blue-600 ml-2 flex-shrink-0" />
                </div>
              </div>
            )}

            {/* Dropoff Address */}
            <div 
              className="border-l-4 border-red-500 pl-4 py-2 bg-red-50/50 rounded-r cursor-pointer hover:bg-red-50 transition-colors"
              onClick={() => openNavigation(booking.dropoffAddress, booking.dropoffLat, booking.dropoffLng)}
              data-testid="button-navigate-dropoff"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">Dropoff Location</p>
                  <p className="text-sm font-medium text-gray-900">{booking.dropoffAddress}</p>
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
              <DollarSign className="w-5 h-5 mr-2 text-green-600" />
              Service Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500">Service Type</p>
                <p className="text-sm font-medium text-gray-900 capitalize" data-testid="text-service-type">
                  {booking.serviceType}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Vehicle Type</p>
                <p className="text-sm font-medium text-gray-900 capitalize" data-testid="text-vehicle-type">
                  {booking.vehicleType.replace(/_/g, ' ')}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Passengers</p>
                <p className="text-sm font-medium text-gray-900" data-testid="text-passengers">
                  {booking.passengers}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Luggage</p>
                <p className="text-sm font-medium text-gray-900 flex items-center" data-testid="text-luggage">
                  <Package className="w-3 h-3 mr-1" />
                  {booking.luggage}
                </p>
              </div>
            </div>

            {booking.babySeat && (
              <div className="flex items-center text-sm">
                <Baby className="w-4 h-4 mr-2 text-blue-600" />
                <span className="text-gray-900 font-medium" data-testid="text-baby-seat">Baby seat required</span>
              </div>
            )}

            {booking.serviceType === 'hourly' && booking.duration && (
              <div>
                <p className="text-xs text-gray-500">Duration</p>
                <p className="text-sm font-medium text-gray-900" data-testid="text-duration">
                  {booking.duration} hours
                </p>
              </div>
            )}

            {booking.specialRequests && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Special Requests</p>
                <p className="text-sm text-gray-900 bg-yellow-50 p-2 rounded border border-yellow-200" data-testid="text-special-requests">
                  {booking.specialRequests}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Action Button */}
        {nextAction && (
          <Button
            onClick={() => updateStatusMutation.mutate(nextAction.nextStatus)}
            disabled={updateStatusMutation.isPending}
            className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg font-semibold shadow-lg"
            data-testid={`button-${nextAction.nextStatus}`}
          >
            <nextAction.icon className="w-5 h-5 mr-2" />
            {nextAction.label}
          </Button>
        )}
      </div>
    </div>
  );
}
