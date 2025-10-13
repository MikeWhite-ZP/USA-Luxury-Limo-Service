import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ObjectUploader } from "../components/ObjectUploader";
import { DollarSign, MapPin, Clock, Star, Upload, CheckCircle, AlertCircle, FileText, Car } from "lucide-react";

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

interface DriverDocument {
  id: string;
  documentType: 'driver_license' | 'limo_license' | 'insurance_certificate' | 'vehicle_image';
  documentUrl: string;
  expirationDate?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  uploadedAt: string;
}

export default function DriverDashboard() {
  const { toast } = useToast();
  const { user, isLoading, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [todayEarnings] = useState(485); // This would come from API
  
  // Document upload state with expiration dates
  const [documentForms, setDocumentForms] = useState({
    driver_license: { file: null as File | null, expirationDate: '' },
    limo_license: { file: null as File | null, expirationDate: '' },
    insurance_certificate: { file: null as File | null, expirationDate: '' },
    vehicle_image: { file: null as File | null, expirationDate: '' },
  });
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

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

  // Fetch driver documents
  const { data: documents, isLoading: documentsLoading } = useQuery<DriverDocument[]>({
    queryKey: ['/api/driver/documents'],
    retry: false,
    enabled: isAuthenticated && user?.role === 'driver',
  });

  // Document upload mutation
  const uploadDocumentMutation = useMutation({
    mutationFn: async ({ documentType, file, expirationDate }: {
      documentType: string;
      file: File;
      expirationDate?: string;
    }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);
      if (expirationDate) formData.append('expirationDate', expirationDate);

      const response = await fetch('/api/driver/documents/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }

      return await response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/driver/documents'] });
      toast({
        title: "Document Uploaded",
        description: `Your ${variables.documentType.replace('_', ' ')} has been uploaded successfully.`,
      });
      setUploadingDoc(null);
      // Clear form
      setDocumentForms(prev => ({
        ...prev,
        [variables.documentType]: { file: null, expirationDate: '' }
      }));
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
      setUploadingDoc(null);
    },
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

  const getDocumentByType = (type: string) => {
    return documents?.find(doc => doc.documentType === type);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'pending': return 'secondary';
      case 'rejected': return 'destructive';
      default: return 'outline';
    }
  };

  const formatDocumentLabel = (type: string) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const handleDocumentUpload = (documentType: string) => {
    const form = documentForms[documentType as keyof typeof documentForms];
    
    if (!form.file) {
      toast({
        title: "Missing File",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    if (!form.expirationDate && documentType !== 'vehicle_image') {
      toast({
        title: "Missing Expiration Date",
        description: "Please provide an expiration date",
        variant: "destructive",
      });
      return;
    }

    setUploadingDoc(documentType);
    uploadDocumentMutation.mutate({
      documentType,
      file: form.file,
      expirationDate: form.expirationDate || undefined,
    });
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
              <FileText className="w-5 h-5" />
              <span>Document Verification</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Driver's License */}
              <div className="space-y-4">
                <h4 className="font-semibold flex items-center justify-between">
                  <span>Driver's License</span>
                  {getDocumentByType('driver_license') && (
                    <Badge variant={getStatusBadgeVariant(getDocumentByType('driver_license')!.status)} data-testid="status-driver-license">
                      {getDocumentByType('driver_license')!.status}
                    </Badge>
                  )}
                </h4>
                
                {getDocumentByType('driver_license') && (
                  <div className="p-4 border rounded-lg bg-muted/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Expiration Date:</span>
                      <span className="text-sm" data-testid="expiry-driver-license">
                        {getDocumentByType('driver_license')!.expirationDate 
                          ? new Date(getDocumentByType('driver_license')!.expirationDate!).toLocaleDateString()
                          : 'N/A'}
                      </span>
                    </div>
                    {getDocumentByType('driver_license')!.status === 'rejected' && getDocumentByType('driver_license')!.rejectionReason && (
                      <div className="text-sm text-red-600 mt-2">
                        <strong>Rejection Reason:</strong> {getDocumentByType('driver_license')!.rejectionReason}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      Uploaded: {new Date(getDocumentByType('driver_license')!.uploadedAt).toLocaleString()}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="driver-license-file">
                      {getDocumentByType('driver_license') ? 'Re-upload Document' : 'Upload Document'} (PDF/Image, max 2MB)
                    </Label>
                    <Input
                      id="driver-license-file"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setDocumentForms(prev => ({
                        ...prev,
                        driver_license: { ...prev.driver_license, file: e.target.files?.[0] || null }
                      }))}
                      data-testid="input-driver-license-file"
                    />
                  </div>
                  <div>
                    <Label htmlFor="driver-license-expiry">Expiration Date</Label>
                    <Input
                      id="driver-license-expiry"
                      type="date"
                      value={documentForms.driver_license.expirationDate}
                      onChange={(e) => setDocumentForms(prev => ({
                        ...prev,
                        driver_license: { ...prev.driver_license, expirationDate: e.target.value }
                      }))}
                      data-testid="input-driver-license-expiry"
                    />
                  </div>
                  <Button
                    onClick={() => handleDocumentUpload('driver_license')}
                    disabled={uploadingDoc === 'driver_license'}
                    className="w-full"
                    data-testid="button-upload-driver-license"
                  >
                    {uploadingDoc === 'driver_license' ? 'Uploading...' : (getDocumentByType('driver_license') ? 'Update & Upload' : 'Save & Upload')}
                  </Button>
                </div>
              </div>

              {/* Limo License */}
              <div className="space-y-4">
                <h4 className="font-semibold flex items-center justify-between">
                  <span>Limo License</span>
                  {getDocumentByType('limo_license') && (
                    <Badge variant={getStatusBadgeVariant(getDocumentByType('limo_license')!.status)} data-testid="status-limo-license">
                      {getDocumentByType('limo_license')!.status}
                    </Badge>
                  )}
                </h4>
                
                {getDocumentByType('limo_license') && (
                  <div className="p-4 border rounded-lg bg-muted/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Expiration Date:</span>
                      <span className="text-sm" data-testid="expiry-limo-license">
                        {getDocumentByType('limo_license')!.expirationDate 
                          ? new Date(getDocumentByType('limo_license')!.expirationDate!).toLocaleDateString()
                          : 'N/A'}
                      </span>
                    </div>
                    {getDocumentByType('limo_license')!.status === 'rejected' && getDocumentByType('limo_license')!.rejectionReason && (
                      <div className="text-sm text-red-600 mt-2">
                        <strong>Rejection Reason:</strong> {getDocumentByType('limo_license')!.rejectionReason}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      Uploaded: {new Date(getDocumentByType('limo_license')!.uploadedAt).toLocaleString()}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="limo-license-file">
                      {getDocumentByType('limo_license') ? 'Re-upload Document' : 'Upload Document'} (PDF/Image, max 2MB)
                    </Label>
                    <Input
                      id="limo-license-file"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setDocumentForms(prev => ({
                        ...prev,
                        limo_license: { ...prev.limo_license, file: e.target.files?.[0] || null }
                      }))}
                      data-testid="input-limo-license-file"
                    />
                  </div>
                  <div>
                    <Label htmlFor="limo-license-expiry">Expiration Date</Label>
                    <Input
                      id="limo-license-expiry"
                      type="date"
                      value={documentForms.limo_license.expirationDate}
                      onChange={(e) => setDocumentForms(prev => ({
                        ...prev,
                        limo_license: { ...prev.limo_license, expirationDate: e.target.value }
                      }))}
                      data-testid="input-limo-license-expiry"
                    />
                  </div>
                  <Button
                    onClick={() => handleDocumentUpload('limo_license')}
                    disabled={uploadingDoc === 'limo_license'}
                    className="w-full"
                    data-testid="button-upload-limo-license"
                  >
                    {uploadingDoc === 'limo_license' ? 'Uploading...' : (getDocumentByType('limo_license') ? 'Update & Upload' : 'Save & Upload')}
                  </Button>
                </div>
              </div>

              {/* Insurance Certificate */}
              <div className="space-y-4">
                <h4 className="font-semibold flex items-center justify-between">
                  <span>Insurance Certificate</span>
                  {getDocumentByType('insurance_certificate') && (
                    <Badge variant={getStatusBadgeVariant(getDocumentByType('insurance_certificate')!.status)} data-testid="status-insurance">
                      {getDocumentByType('insurance_certificate')!.status}
                    </Badge>
                  )}
                </h4>
                
                {getDocumentByType('insurance_certificate') && (
                  <div className="p-4 border rounded-lg bg-muted/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Expiration Date:</span>
                      <span className="text-sm" data-testid="expiry-insurance">
                        {getDocumentByType('insurance_certificate')!.expirationDate 
                          ? new Date(getDocumentByType('insurance_certificate')!.expirationDate!).toLocaleDateString()
                          : 'N/A'}
                      </span>
                    </div>
                    {getDocumentByType('insurance_certificate')!.status === 'rejected' && getDocumentByType('insurance_certificate')!.rejectionReason && (
                      <div className="text-sm text-red-600 mt-2">
                        <strong>Rejection Reason:</strong> {getDocumentByType('insurance_certificate')!.rejectionReason}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      Uploaded: {new Date(getDocumentByType('insurance_certificate')!.uploadedAt).toLocaleString()}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="insurance-file">
                      {getDocumentByType('insurance_certificate') ? 'Re-upload Document' : 'Upload Document'} (PDF/Image, max 2MB)
                    </Label>
                    <Input
                      id="insurance-file"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setDocumentForms(prev => ({
                        ...prev,
                        insurance_certificate: { ...prev.insurance_certificate, file: e.target.files?.[0] || null }
                      }))}
                      data-testid="input-insurance-file"
                    />
                  </div>
                  <div>
                    <Label htmlFor="insurance-expiry">Expiration Date</Label>
                    <Input
                      id="insurance-expiry"
                      type="date"
                      value={documentForms.insurance_certificate.expirationDate}
                      onChange={(e) => setDocumentForms(prev => ({
                        ...prev,
                        insurance_certificate: { ...prev.insurance_certificate, expirationDate: e.target.value }
                      }))}
                      data-testid="input-insurance-expiry"
                    />
                  </div>
                  <Button
                    onClick={() => handleDocumentUpload('insurance_certificate')}
                    disabled={uploadingDoc === 'insurance_certificate'}
                    className="w-full"
                    data-testid="button-upload-insurance"
                  >
                    {uploadingDoc === 'insurance_certificate' ? 'Uploading...' : (getDocumentByType('insurance_certificate') ? 'Update & Upload' : 'Save & Upload')}
                  </Button>
                </div>
              </div>

              {/* Vehicle Image */}
              <div className="space-y-4">
                <h4 className="font-semibold flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <Car className="w-4 h-4" />
                    <span>Vehicle Image</span>
                  </span>
                  {getDocumentByType('vehicle_image') && (
                    <Badge variant={getStatusBadgeVariant(getDocumentByType('vehicle_image')!.status)} data-testid="status-vehicle-image">
                      {getDocumentByType('vehicle_image')!.status}
                    </Badge>
                  )}
                </h4>
                
                {getDocumentByType('vehicle_image') && (
                  <div className="p-4 border rounded-lg bg-muted/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Vehicle Plate:</span>
                      <span className="text-sm" data-testid="plate-vehicle-image">
                        {getDocumentByType('vehicle_image')!.expirationDate || 'N/A'}
                      </span>
                    </div>
                    {getDocumentByType('vehicle_image')!.status === 'rejected' && getDocumentByType('vehicle_image')!.rejectionReason && (
                      <div className="text-sm text-red-600 mt-2">
                        <strong>Rejection Reason:</strong> {getDocumentByType('vehicle_image')!.rejectionReason}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      Uploaded: {new Date(getDocumentByType('vehicle_image')!.uploadedAt).toLocaleString()}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="vehicle-image-file">
                      {getDocumentByType('vehicle_image') ? 'Re-upload Image' : 'Upload Image'} (JPG/PNG, max 2MB)
                    </Label>
                    <Input
                      id="vehicle-image-file"
                      type="file"
                      accept=".jpg,.jpeg,.png"
                      onChange={(e) => setDocumentForms(prev => ({
                        ...prev,
                        vehicle_image: { ...prev.vehicle_image, file: e.target.files?.[0] || null }
                      }))}
                      data-testid="input-vehicle-image-file"
                    />
                  </div>
                  <div>
                    <Label htmlFor="vehicle-image-plate">Vehicle Plate</Label>
                    <Input
                      id="vehicle-image-plate"
                      type="text"
                      value={documentForms.vehicle_image.expirationDate}
                      onChange={(e) => setDocumentForms(prev => ({
                        ...prev,
                        vehicle_image: { ...prev.vehicle_image, expirationDate: e.target.value }
                      }))}
                      data-testid="input-vehicle-image-expiry"
                      placeholder="Enter vehicle plate number"
                    />
                  </div>
                  <Button
                    onClick={() => handleDocumentUpload('vehicle_image')}
                    disabled={uploadingDoc === 'vehicle_image'}
                    className="w-full"
                    data-testid="button-upload-vehicle-image"
                  >
                    {uploadingDoc === 'vehicle_image' ? 'Uploading...' : (getDocumentByType('vehicle_image') ? 'Update & Upload' : 'Save & Upload')}
                  </Button>
                </div>
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
