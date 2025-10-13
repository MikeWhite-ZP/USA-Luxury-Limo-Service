import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ObjectUploader } from "../components/ObjectUploader";
import { DollarSign, MapPin, Clock, Star, Upload, CheckCircle, AlertCircle } from "lucide-react";

interface DriverData {
  id: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  licenseDocumentUrl?: string;
  insuranceDocumentUrl?: string;
  backgroundCheckStatus: 'pending' | 'approved' | 'rejected';
  verificationStatus: 'pending' | 'verified' | 'rejected';
  rating: string;
  totalRides: number;
  isAvailable: boolean;
}

interface Booking {
  id: string;
  bookingType: 'transfer' | 'hourly';
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  pickupAddress: string;
  destinationAddress?: string;
  scheduledDateTime: string;
  passengerCount: number;
  totalAmount: string;
  specialInstructions?: string;
}

export default function DriverDashboard() {
  const { toast } = useToast();
  const { user, isLoading, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [todayEarnings] = useState(485); // This would come from API

  // Redirect to home if not authenticated or not driver
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'driver')) {
      toast({
        title: "Unauthorized",
        description: "Driver access required. Redirecting to login...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, user, isLoading, toast]);

  // Fetch driver profile
  const { data: driver, isLoading: driverLoading } = useQuery<DriverData>({
    queryKey: ['/api/driver/profile'],
    retry: false,
    enabled: isAuthenticated && user?.role === 'driver',
  });

  // Fetch driver bookings
  const { data: bookings, isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ['/api/bookings'],
    retry: false,
    enabled: isAuthenticated && user?.role === 'driver',
  });

  // Update booking status mutation
  const updateBookingMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest('PATCH', `/api/bookings/${id}/status`, { status });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      toast({
        title: "Booking Updated",
        description: "Booking status has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to update booking status",
        variant: "destructive",
      });
    },
  });

  const handleAcceptRide = (bookingId: string) => {
    updateBookingMutation.mutate({ id: bookingId, status: 'confirmed' });
  };

  const handleDeclineRide = (bookingId: string) => {
    updateBookingMutation.mutate({ id: bookingId, status: 'cancelled' });
  };

  const handleCompleteRide = (bookingId: string) => {
    updateBookingMutation.mutate({ id: bookingId, status: 'completed' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'default';
      case 'confirmed': return 'secondary';
      case 'in_progress': return 'default';
      case 'completed': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'default';
    }
  };

  const getVerificationStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-amber-600" />;
      case 'rejected': return <AlertCircle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  if (isLoading || driverLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'driver') {
    return null;
  }

  const completedRides = bookings?.filter(b => b.status === 'completed').length || 0;
  const pendingBookings = bookings?.filter(b => b.status === 'pending') || [];
  const activeBooking = bookings?.find(b => b.status === 'in_progress');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-blue-600 text-white p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-lg font-bold">D</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold" data-testid="driver-title">Driver Portal</h1>
              <p className="text-blue-100" data-testid="driver-subtitle">
                Welcome, {user?.firstName || user?.email}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Badge 
              variant={driver?.isAvailable ? "secondary" : "outline"} 
              className={driver?.isAvailable ? "bg-green-500 text-white" : ""}
              data-testid="driver-status"
            >
              {driver?.isAvailable ? 'Available' : 'Offline'}
            </Badge>
            <Button 
              onClick={() => window.location.href = '/api/logout'}
              variant="secondary"
              data-testid="button-logout"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Performance Stats */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card data-testid="stat-earnings">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <DollarSign className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Today's Earnings</p>
                  <p className="text-xl font-bold" data-testid="today-earnings">${todayEarnings}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-rides">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <MapPin className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Completed Rides</p>
                  <p className="text-xl font-bold" data-testid="completed-rides">{completedRides}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-rating">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <Star className="w-8 h-8 text-yellow-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Rating</p>
                  <p className="text-xl font-bold" data-testid="driver-rating">{driver?.rating || '0'}/5</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Document Verification */}
        <Card data-testid="document-verification" className="rounded-lg border shadow-sm bg-[#ffffff] text-[#23252f]">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="w-5 h-5" />
              <span>Document Verification</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold flex items-center space-x-2">
                  <span>Driver's License</span>
                  {driver?.licenseDocumentUrl && getVerificationStatusIcon('verified')}
                </h4>
                {driver?.licenseDocumentUrl ? (
                  <div className="border-2 border-green-200 bg-green-50 rounded-lg p-4 text-center">
                    <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-sm text-green-700">Document Uploaded</p>
                    <p className="text-xs text-green-600 mt-1">✓ Verified</p>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    <ObjectUploader
                      maxNumberOfFiles={1}
                      maxFileSize={10485760}
                      onGetUploadParameters={async () => {
                        const response = await apiRequest('POST', '/api/objects/upload');
                        const data = await response.json();
                        return {
                          method: 'PUT' as const,
                          url: data.uploadURL,
                        };
                      }}
                      onComplete={async (result: { successful: Array<{ uploadURL: string }> }) => {
                        if (result.successful[0]) {
                          const uploadURL = result.successful[0].uploadURL;
                          // Update driver profile with document URL
                          await apiRequest('PUT', '/api/driver/license', { licenseDocumentUrl: uploadURL });
                          queryClient.invalidateQueries({ queryKey: ['/api/driver/profile'] });
                        }
                      }}
                      buttonClassName="w-full"
                      data-testid="upload-license"
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <Upload className="w-6 h-6" />
                        <span>Upload Driver's License</span>
                      </div>
                    </ObjectUploader>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold flex items-center space-x-2">
                  <span>Insurance Certificate</span>
                  {driver?.insuranceDocumentUrl && getVerificationStatusIcon('pending')}
                </h4>
                {driver?.insuranceDocumentUrl ? (
                  <div className="border-2 border-amber-200 bg-amber-50 rounded-lg p-4 text-center">
                    <Clock className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                    <p className="text-sm text-amber-700">Document Uploaded</p>
                    <p className="text-xs text-amber-600 mt-1">⏳ Pending Review</p>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    <ObjectUploader
                      maxNumberOfFiles={1}
                      maxFileSize={10485760}
                      onGetUploadParameters={async () => {
                        const response = await apiRequest('POST', '/api/objects/upload');
                        const data = await response.json();
                        return {
                          method: 'PUT' as const,
                          url: data.uploadURL,
                        };
                      }}
                      onComplete={async (result: { successful: Array<{ uploadURL: string }> }) => {
                        if (result.successful[0]) {
                          const uploadURL = result.successful[0].uploadURL;
                          // Update driver profile with document URL
                          await apiRequest('PUT', '/api/driver/insurance', { insuranceDocumentUrl: uploadURL });
                          queryClient.invalidateQueries({ queryKey: ['/api/driver/profile'] });
                        }
                      }}
                      buttonClassName="w-full"
                      data-testid="upload-insurance"
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <Upload className="w-6 h-6" />
                        <span>Upload Insurance Certificate</span>
                      </div>
                    </ObjectUploader>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Assignment */}
        {activeBooking && (
          <Card data-testid="current-assignment" className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-primary">Current Assignment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm space-y-1">
                <div data-testid="assignment-pickup">
                  <strong>Pickup:</strong> {activeBooking.pickupAddress}
                </div>
                {activeBooking.destinationAddress && (
                  <div data-testid="assignment-destination">
                    <strong>Destination:</strong> {activeBooking.destinationAddress}
                  </div>
                )}
                <div data-testid="assignment-time">
                  <strong>Scheduled:</strong> {new Date(activeBooking.scheduledDateTime).toLocaleString()}
                </div>
                <div data-testid="assignment-passengers">
                  <strong>Passengers:</strong> {activeBooking.passengerCount}
                </div>
                {activeBooking.specialInstructions && (
                  <div data-testid="assignment-instructions">
                    <strong>Special Instructions:</strong> {activeBooking.specialInstructions}
                  </div>
                )}
              </div>
              <div className="flex space-x-2">
                <Button 
                  onClick={() => handleCompleteRide(activeBooking.id)}
                  disabled={updateBookingMutation.isPending}
                  data-testid="button-complete-ride"
                >
                  Complete Ride
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pending Bookings */}
        {pendingBookings.length > 0 && (
          <Card data-testid="pending-bookings">
            <CardHeader>
              <CardTitle>Pending Assignments ({pendingBookings.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingBookings.map((booking) => (
                <div 
                  key={booking.id}
                  className="border rounded-lg p-4 space-y-3"
                  data-testid={`pending-booking-${booking.id}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1 text-sm">
                      <div data-testid={`booking-pickup-${booking.id}`}>
                        <strong>Pickup:</strong> {booking.pickupAddress}
                      </div>
                      {booking.destinationAddress && (
                        <div data-testid={`booking-destination-${booking.id}`}>
                          <strong>Destination:</strong> {booking.destinationAddress}
                        </div>
                      )}
                      <div data-testid={`booking-time-${booking.id}`}>
                        <strong>Scheduled:</strong> {new Date(booking.scheduledDateTime).toLocaleString()}
                      </div>
                      <div data-testid={`booking-amount-${booking.id}`}>
                        <strong>Fare:</strong> ${booking.totalAmount}
                      </div>
                    </div>
                    <Badge variant={getStatusColor(booking.status)} data-testid={`booking-status-${booking.id}`}>
                      {booking.status}
                    </Badge>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      size="sm"
                      onClick={() => handleAcceptRide(booking.id)}
                      disabled={updateBookingMutation.isPending}
                      data-testid={`button-accept-${booking.id}`}
                    >
                      Accept
                    </Button>
                    <Button 
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeclineRide(booking.id)}
                      disabled={updateBookingMutation.isPending}
                      data-testid={`button-decline-${booking.id}`}
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Recent Completed Rides */}
        <Card data-testid="recent-rides">
          <CardHeader>
            <CardTitle>Recent Rides</CardTitle>
          </CardHeader>
          <CardContent>
            {bookingsLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : bookings && bookings.length > 0 ? (
              <div className="space-y-3">
                {bookings
                  .filter(b => b.status === 'completed')
                  .slice(0, 5)
                  .map((booking) => (
                    <div 
                      key={booking.id}
                      className="flex justify-between items-center p-3 bg-muted rounded-lg"
                      data-testid={`completed-ride-${booking.id}`}
                    >
                      <div>
                        <p className="font-medium" data-testid={`ride-route-${booking.id}`}>
                          {booking.pickupAddress} → {booking.destinationAddress || 'Hourly Service'}
                        </p>
                        <p className="text-sm text-muted-foreground" data-testid={`ride-date-${booking.id}`}>
                          {new Date(booking.scheduledDateTime).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600" data-testid={`ride-amount-${booking.id}`}>
                          ${booking.totalAmount}
                        </p>
                        <Badge variant="secondary" data-testid={`ride-type-${booking.id}`}>
                          {booking.bookingType}
                        </Badge>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center p-8 text-muted-foreground" data-testid="no-rides">
                No completed rides yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
