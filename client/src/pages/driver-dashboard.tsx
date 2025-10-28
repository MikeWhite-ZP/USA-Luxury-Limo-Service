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
import {
  DollarSign,
  MapPin,
  Clock,
  Star,
  Upload,
  CheckCircle,
  AlertCircle,
  FileText,
  Car,
  Home,
  Settings,
  Briefcase,
  Pencil,
} from "lucide-react";

interface DriverData {
  id: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  licenseDocumentUrl?: string;
  insuranceDocumentUrl?: string;
  vehiclePlate?: string;
  backgroundCheckStatus: "pending" | "approved" | "rejected";
  verificationStatus: "pending" | "verified" | "rejected";
  rating: string;
  totalRides: number;
  isAvailable: boolean;
  driverCredentials?: string;
}

interface Booking {
  id: string;
  driverId?: string;
  bookingType: "transfer" | "hourly";
  status:
    | "pending"
    | "pending_driver_acceptance"
    | "confirmed"
    | "in_progress"
    | "completed"
    | "cancelled";
  pickupAddress: string;
  destinationAddress?: string;
  scheduledDateTime: string;
  passengerCount: number;
  totalAmount: string;
  driverPayment?: string;
  specialInstructions?: string;
}

interface DriverDocument {
  id: string;
  documentType:
    | "driver_license"
    | "limo_license"
    | "insurance_certificate"
    | "vehicle_image";
  documentUrl: string;
  expirationDate?: string;
  vehiclePlate?: string;
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  uploadedAt: string;
}

export default function DriverDashboard() {
  const { toast } = useToast();
  const { user, isLoading, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [todayEarnings] = useState(485); // This would come from API
  const [activeTab, setActiveTab] = useState<
    "home" | "documents" | "assigned-jobs" | "settings"
  >("home");
  const [editingCredentials, setEditingCredentials] = useState(false);
  const [credentialsValue, setCredentialsValue] = useState("");
  const [editingVehiclePlate, setEditingVehiclePlate] = useState(false);
  const [vehiclePlateValue, setVehiclePlateValue] = useState("");

  // Document upload state with expiration dates
  const [documentForms, setDocumentForms] = useState({
    driver_license: { file: null as File | null, expirationDate: "" },
    limo_license: { file: null as File | null, expirationDate: "" },
    insurance_certificate: { file: null as File | null, expirationDate: "" },
    vehicle_image: { file: null as File | null, expirationDate: "" },
  });
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  // Redirect to home if not authenticated or not driver
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== "driver")) {
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
    queryKey: ["/api/driver/profile"],
    retry: false,
    enabled: isAuthenticated && user?.role === "driver",
  });

  // Initialize credentials and vehicle plate values when driver data loads
  useEffect(() => {
    if (driver?.driverCredentials) {
      setCredentialsValue(driver.driverCredentials);
    }
    if (driver?.vehiclePlate) {
      setVehiclePlateValue(driver.vehiclePlate);
    }
  }, [driver]);

  // Fetch driver bookings
  const { data: bookings, isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
    retry: false,
    enabled: isAuthenticated && user?.role === "driver",
  });

  // Fetch driver documents
  const { data: documents, isLoading: documentsLoading } = useQuery<
    DriverDocument[]
  >({
    queryKey: ["/api/driver/documents"],
    retry: false,
    enabled: isAuthenticated && user?.role === "driver",
  });

  // Document upload mutation
  const uploadDocumentMutation = useMutation({
    mutationFn: async ({
      documentType,
      file,
      expirationDate,
    }: {
      documentType: string;
      file: File;
      expirationDate?: string;
    }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", documentType);

      // For vehicle_image, send as vehiclePlate; for others, send as expirationDate
      if (expirationDate) {
        if (documentType === "vehicle_image") {
          formData.append("vehiclePlate", expirationDate);
        } else {
          formData.append("expirationDate", expirationDate);
        }
      }

      const response = await fetch("/api/driver/documents/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Upload failed");
      }

      return await response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/driver/documents"] });
      toast({
        title: "Document Uploaded",
        description: `Your ${variables.documentType.replace("_", " ")} has been uploaded successfully.`,
      });
      setUploadingDoc(null);
      // Clear form
      setDocumentForms((prev) => ({
        ...prev,
        [variables.documentType]: { file: null, expirationDate: "" },
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
      const response = await apiRequest("PATCH", `/api/bookings/${id}/status`, {
        status,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
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

  // Update driver credentials mutation
  const updateCredentialsMutation = useMutation({
    mutationFn: async (driverCredentials: string) => {
      const response = await apiRequest("PATCH", "/api/driver/credentials", {
        driverCredentials,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update credentials");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/driver/profile"] });
      setEditingCredentials(false);
      toast({
        title: "Credentials Updated",
        description: "Your driver credentials have been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update credentials",
        variant: "destructive",
      });
    },
  });

  // Update driver vehicle plate mutation
  const updateVehiclePlateMutation = useMutation({
    mutationFn: async (vehiclePlate: string) => {
      const response = await apiRequest("PATCH", "/api/driver/vehicle-plate", {
        vehiclePlate,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update vehicle plate");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/driver/profile"] });
      setEditingVehiclePlate(false);
      toast({
        title: "Vehicle Plate Updated",
        description: "Your vehicle plate has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update vehicle plate",
        variant: "destructive",
      });
    },
  });

  // Accept booking mutation
  const acceptBookingMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const response = await apiRequest(
        "POST",
        `/api/bookings/${bookingId}/accept`,
        {},
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to accept booking");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      toast({
        title: "Booking Accepted",
        description: "You have successfully accepted this booking.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to accept booking",
        variant: "destructive",
      });
    },
  });

  // Decline booking mutation
  const declineBookingMutation = useMutation({
    mutationFn: async ({
      bookingId,
      reason,
    }: {
      bookingId: string;
      reason?: string;
    }) => {
      const response = await apiRequest(
        "POST",
        `/api/bookings/${bookingId}/decline`,
        { reason },
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to decline booking");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      toast({
        title: "Booking Declined",
        description:
          "You have declined this booking. It will be reassigned to another driver.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to decline booking",
        variant: "destructive",
      });
    },
  });

  const handleAcceptRide = (bookingId: string) => {
    acceptBookingMutation.mutate(bookingId);
  };

  const handleDeclineRide = (bookingId: string) => {
    // Could add a confirmation dialog here with reason input
    declineBookingMutation.mutate({ bookingId });
  };

  const handleCompleteRide = (bookingId: string) => {
    updateBookingMutation.mutate({ id: bookingId, status: "completed" });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "default";
      case "confirmed":
        return "secondary";
      case "in_progress":
        return "default";
      case "completed":
        return "secondary";
      case "cancelled":
        return "destructive";
      default:
        return "default";
    }
  };

  const getVerificationStatusIcon = (status: string) => {
    switch (status) {
      case "verified":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "pending":
        return <Clock className="w-4 h-4 text-amber-600" />;
      case "rejected":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getDocumentByType = (type: string) => {
    return documents?.find((doc) => doc.documentType === type);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "approved":
        return "default";
      case "pending":
        return "secondary";
      case "rejected":
        return "destructive";
      default:
        return "outline";
    }
  };

  const formatDocumentLabel = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
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

    if (!form.expirationDate && documentType !== "vehicle_image") {
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

  if (!isAuthenticated || user?.role !== "driver") {
    return null;
  }

  const completedRides =
    bookings?.filter((b) => b.status === "completed").length || 0;
  const pendingBookings = bookings?.filter((b) => b.status === "pending") || [];
  const activeBooking = bookings?.find((b) => b.status === "in_progress");
  // Show ALL bookings assigned to this driver (except completed/cancelled)
  const assignedBookings =
    bookings?.filter(
      (b) =>
        b.status !== "completed" &&
        b.status !== "cancelled" &&
        b.status !== "pending",
    ) || [];

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
              <h1 className="text-2xl font-bold" data-testid="driver-title">
                Driver Portal
              </h1>
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
              {driver?.isAvailable ? "Available" : "Offline"}
            </Badge>
            <Button
              onClick={() => (window.location.href = "/api/logout")}
              variant="secondary"
              data-testid="button-logout"
            >
              Sign Out
            </Button>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="max-w-7xl mx-auto mt-4 flex space-x-1 bg-white/10 rounded-lg p-1">
          <Button
            variant={activeTab === "home" ? "secondary" : "ghost"}
            className={`flex-1 ${activeTab === "home" ? "bg-white text-blue-600" : "text-white hover:bg-white/20"}`}
            onClick={() => setActiveTab("home")}
            data-testid="nav-home"
          >
            <Home className="w-4 h-4 mr-2" />
            Home
          </Button>
          <Button
            variant={activeTab === "documents" ? "secondary" : "ghost"}
            className={`flex-1 ${activeTab === "documents" ? "bg-white text-blue-600" : "text-white hover:bg-white/20"}`}
            onClick={() => setActiveTab("documents")}
            data-testid="nav-documents"
          >
            <FileText className="w-4 h-4 mr-2" />
            Documents
          </Button>
          <Button
            variant={activeTab === "assigned-jobs" ? "secondary" : "ghost"}
            className={`flex-1 ${activeTab === "assigned-jobs" ? "bg-white text-blue-600" : "text-white hover:bg-white/20"}`}
            onClick={() => setActiveTab("assigned-jobs")}
            data-testid="nav-assigned-jobs"
          >
            <Briefcase className="w-4 h-4 mr-2" />
            Assigned Jobs
          </Button>
          <Button
            variant={activeTab === "settings" ? "secondary" : "ghost"}
            className={`flex-1 ${activeTab === "settings" ? "bg-white text-blue-600" : "text-white hover:bg-white/20"}`}
            onClick={() => setActiveTab("settings")}
            data-testid="nav-settings"
          >
            <Settings className="w-4 h-4 mr-2" />
            Account Settings
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* HOME TAB */}
        {activeTab === "home" && (
          <>
            {/* Performance Stats */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card data-testid="stat-earnings">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <DollarSign className="w-8 h-8 text-green-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Today's Earnings
                      </p>
                      <p
                        className="text-xl font-bold"
                        data-testid="today-earnings"
                      >
                        ${todayEarnings}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="stat-rides">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Completed Rides
                      </p>
                      <p
                        className="text-xl font-bold"
                        data-testid="completed-rides"
                      >
                        {completedRides}
                      </p>
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
                      <p
                        className="text-xl font-bold"
                        data-testid="driver-rating"
                      >
                        {driver?.rating || "0"}/5
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Accepted/Assigned Jobs */}
            <Card data-testid="accepted-jobs">
              <CardHeader>
                <CardTitle>Accepted Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                {assignedBookings && assignedBookings.length > 0 ? (
                  <div className="space-y-4">
                    {assignedBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="border rounded-lg p-4 space-y-3"
                        data-testid={`accepted-job-${booking.id}`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="space-y-1 text-sm">
                            <div data-testid={`accepted-pickup-${booking.id}`}>
                              <strong>Pickup:</strong> {booking.pickupAddress}
                            </div>
                            {booking.destinationAddress && (
                              <div
                                data-testid={`accepted-destination-${booking.id}`}
                              >
                                <strong>Destination:</strong>{" "}
                                {booking.destinationAddress}
                              </div>
                            )}
                            <div data-testid={`accepted-time-${booking.id}`}>
                              <strong>Scheduled:</strong>{" "}
                              {new Date(
                                booking.scheduledDateTime,
                              ).toLocaleString()}
                            </div>
                            <div data-testid={`accepted-amount-${booking.id}`}>
                              <strong>Your Payment:</strong> $
                              {booking.driverPayment || "Not set"}
                            </div>
                          </div>
                          <Badge
                            variant="default"
                            data-testid={`accepted-status-${booking.id}`}
                          >
                            {booking.status}
                          </Badge>
                        </div>
                        {booking.status === "in_progress" && (
                          <div className="flex space-x-2">
                            <Button
                              onClick={() => handleCompleteRide(booking.id)}
                              disabled={updateBookingMutation.isPending}
                              data-testid={`button-complete-${booking.id}`}
                            >
                              Complete Ride
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    className="text-center p-8 text-muted-foreground"
                    data-testid="no-accepted-jobs"
                  >
                    No accepted jobs yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* DOCUMENTS TAB */}
        {activeTab === "documents" && (
          <Card
            data-testid="document-verification"
            className="rounded-lg border shadow-sm bg-[#ffffff] text-[#23252f]"
          >
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
                    {getDocumentByType("driver_license") && (
                      <Badge
                        variant={getStatusBadgeVariant(
                          getDocumentByType("driver_license")!.status,
                        )}
                        data-testid="status-driver-license"
                      >
                        {getDocumentByType("driver_license")!.status}
                      </Badge>
                    )}
                  </h4>

                  {getDocumentByType("driver_license") && (
                    <div className="p-4 border rounded-lg bg-muted/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Expiration Date:
                        </span>
                        <span
                          className="text-sm"
                          data-testid="expiry-driver-license"
                        >
                          {getDocumentByType("driver_license")!.expirationDate
                            ? new Date(
                                getDocumentByType(
                                  "driver_license",
                                )!.expirationDate!,
                              ).toLocaleDateString()
                            : "N/A"}
                        </span>
                      </div>
                      {getDocumentByType("driver_license")!.status ===
                        "rejected" &&
                        getDocumentByType("driver_license")!
                          .rejectionReason && (
                          <div className="text-sm text-red-600 mt-2">
                            <strong>Rejection Reason:</strong>{" "}
                            {
                              getDocumentByType("driver_license")!
                                .rejectionReason
                            }
                          </div>
                        )}
                      <div className="text-xs text-muted-foreground">
                        Uploaded:{" "}
                        {new Date(
                          getDocumentByType("driver_license")!.uploadedAt,
                        ).toLocaleString()}
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="driver-license-file">
                        {getDocumentByType("driver_license")
                          ? "Re-upload Document"
                          : "Upload Document"}{" "}
                        (PDF/Image, max 2MB)
                      </Label>
                      <Input
                        id="driver-license-file"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) =>
                          setDocumentForms((prev) => ({
                            ...prev,
                            driver_license: {
                              ...prev.driver_license,
                              file: e.target.files?.[0] || null,
                            },
                          }))
                        }
                        data-testid="input-driver-license-file"
                      />
                    </div>
                    <div>
                      <Label htmlFor="driver-license-expiry">
                        Expiration Date
                      </Label>
                      <Input
                        id="driver-license-expiry"
                        type="date"
                        value={documentForms.driver_license.expirationDate}
                        onChange={(e) =>
                          setDocumentForms((prev) => ({
                            ...prev,
                            driver_license: {
                              ...prev.driver_license,
                              expirationDate: e.target.value,
                            },
                          }))
                        }
                        data-testid="input-driver-license-expiry"
                      />
                    </div>
                    <Button
                      onClick={() => handleDocumentUpload("driver_license")}
                      disabled={uploadingDoc === "driver_license"}
                      className="w-full"
                      data-testid="button-upload-driver-license"
                    >
                      {uploadingDoc === "driver_license"
                        ? "Uploading..."
                        : getDocumentByType("driver_license")
                          ? "Update & Upload"
                          : "Save & Upload"}
                    </Button>
                  </div>
                </div>

                {/* Limo License */}
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center justify-between">
                    <span>Limo License</span>
                    {getDocumentByType("limo_license") && (
                      <Badge
                        variant={getStatusBadgeVariant(
                          getDocumentByType("limo_license")!.status,
                        )}
                        data-testid="status-limo-license"
                      >
                        {getDocumentByType("limo_license")!.status}
                      </Badge>
                    )}
                  </h4>

                  {getDocumentByType("limo_license") && (
                    <div className="p-4 border rounded-lg bg-muted/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Expiration Date:
                        </span>
                        <span
                          className="text-sm"
                          data-testid="expiry-limo-license"
                        >
                          {getDocumentByType("limo_license")!.expirationDate
                            ? new Date(
                                getDocumentByType(
                                  "limo_license",
                                )!.expirationDate!,
                              ).toLocaleDateString()
                            : "N/A"}
                        </span>
                      </div>
                      {getDocumentByType("limo_license")!.status ===
                        "rejected" &&
                        getDocumentByType("limo_license")!.rejectionReason && (
                          <div className="text-sm text-red-600 mt-2">
                            <strong>Rejection Reason:</strong>{" "}
                            {getDocumentByType("limo_license")!.rejectionReason}
                          </div>
                        )}
                      <div className="text-xs text-muted-foreground">
                        Uploaded:{" "}
                        {new Date(
                          getDocumentByType("limo_license")!.uploadedAt,
                        ).toLocaleString()}
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="limo-license-file">
                        {getDocumentByType("limo_license")
                          ? "Re-upload Document"
                          : "Upload Document"}{" "}
                        (PDF/Image, max 2MB)
                      </Label>
                      <Input
                        id="limo-license-file"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) =>
                          setDocumentForms((prev) => ({
                            ...prev,
                            limo_license: {
                              ...prev.limo_license,
                              file: e.target.files?.[0] || null,
                            },
                          }))
                        }
                        data-testid="input-limo-license-file"
                      />
                    </div>
                    <div>
                      <Label htmlFor="limo-license-expiry">
                        Expiration Date
                      </Label>
                      <Input
                        id="limo-license-expiry"
                        type="date"
                        value={documentForms.limo_license.expirationDate}
                        onChange={(e) =>
                          setDocumentForms((prev) => ({
                            ...prev,
                            limo_license: {
                              ...prev.limo_license,
                              expirationDate: e.target.value,
                            },
                          }))
                        }
                        data-testid="input-limo-license-expiry"
                      />
                    </div>
                    <Button
                      onClick={() => handleDocumentUpload("limo_license")}
                      disabled={uploadingDoc === "limo_license"}
                      className="w-full"
                      data-testid="button-upload-limo-license"
                    >
                      {uploadingDoc === "limo_license"
                        ? "Uploading..."
                        : getDocumentByType("limo_license")
                          ? "Update & Upload"
                          : "Save & Upload"}
                    </Button>
                  </div>
                </div>

                {/* Insurance Certificate */}
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center justify-between">
                    <span>Insurance Certificate</span>
                    {getDocumentByType("insurance_certificate") && (
                      <Badge
                        variant={getStatusBadgeVariant(
                          getDocumentByType("insurance_certificate")!.status,
                        )}
                        data-testid="status-insurance"
                      >
                        {getDocumentByType("insurance_certificate")!.status}
                      </Badge>
                    )}
                  </h4>

                  {getDocumentByType("insurance_certificate") && (
                    <div className="p-4 border rounded-lg bg-muted/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Expiration Date:
                        </span>
                        <span
                          className="text-sm"
                          data-testid="expiry-insurance"
                        >
                          {getDocumentByType("insurance_certificate")!
                            .expirationDate
                            ? new Date(
                                getDocumentByType(
                                  "insurance_certificate",
                                )!.expirationDate!,
                              ).toLocaleDateString()
                            : "N/A"}
                        </span>
                      </div>
                      {getDocumentByType("insurance_certificate")!.status ===
                        "rejected" &&
                        getDocumentByType("insurance_certificate")!
                          .rejectionReason && (
                          <div className="text-sm text-red-600 mt-2">
                            <strong>Rejection Reason:</strong>{" "}
                            {
                              getDocumentByType("insurance_certificate")!
                                .rejectionReason
                            }
                          </div>
                        )}
                      <div className="text-xs text-muted-foreground">
                        Uploaded:{" "}
                        {new Date(
                          getDocumentByType(
                            "insurance_certificate",
                          )!.uploadedAt,
                        ).toLocaleString()}
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="insurance-file">
                        {getDocumentByType("insurance_certificate")
                          ? "Re-upload Document"
                          : "Upload Document"}{" "}
                        (PDF/Image, max 2MB)
                      </Label>
                      <Input
                        id="insurance-file"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) =>
                          setDocumentForms((prev) => ({
                            ...prev,
                            insurance_certificate: {
                              ...prev.insurance_certificate,
                              file: e.target.files?.[0] || null,
                            },
                          }))
                        }
                        data-testid="input-insurance-file"
                      />
                    </div>
                    <div>
                      <Label htmlFor="insurance-expiry">Expiration Date</Label>
                      <Input
                        id="insurance-expiry"
                        type="date"
                        value={
                          documentForms.insurance_certificate.expirationDate
                        }
                        onChange={(e) =>
                          setDocumentForms((prev) => ({
                            ...prev,
                            insurance_certificate: {
                              ...prev.insurance_certificate,
                              expirationDate: e.target.value,
                            },
                          }))
                        }
                        data-testid="input-insurance-expiry"
                      />
                    </div>
                    <Button
                      onClick={() =>
                        handleDocumentUpload("insurance_certificate")
                      }
                      disabled={uploadingDoc === "insurance_certificate"}
                      className="w-full"
                      data-testid="button-upload-insurance"
                    >
                      {uploadingDoc === "insurance_certificate"
                        ? "Uploading..."
                        : getDocumentByType("insurance_certificate")
                          ? "Update & Upload"
                          : "Save & Upload"}
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
                    {getDocumentByType("vehicle_image") && (
                      <Badge
                        variant={getStatusBadgeVariant(
                          getDocumentByType("vehicle_image")!.status,
                        )}
                        data-testid="status-vehicle-image"
                      >
                        {getDocumentByType("vehicle_image")!.status}
                      </Badge>
                    )}
                  </h4>

                  {getDocumentByType("vehicle_image") && (
                    <div className="p-4 border rounded-lg bg-muted/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Vehicle Plate:
                        </span>
                        <span
                          className="text-sm"
                          data-testid="plate-vehicle-image"
                        >
                          {getDocumentByType("vehicle_image")!.vehiclePlate ||
                            "N/A"}
                        </span>
                      </div>
                      {getDocumentByType("vehicle_image")!.status ===
                        "rejected" &&
                        getDocumentByType("vehicle_image")!.rejectionReason && (
                          <div className="text-sm text-red-600 mt-2">
                            <strong>Rejection Reason:</strong>{" "}
                            {
                              getDocumentByType("vehicle_image")!
                                .rejectionReason
                            }
                          </div>
                        )}
                      <div className="text-xs text-muted-foreground">
                        Uploaded:{" "}
                        {new Date(
                          getDocumentByType("vehicle_image")!.uploadedAt,
                        ).toLocaleString()}
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="vehicle-image-file">
                        {getDocumentByType("vehicle_image")
                          ? "Re-upload Image"
                          : "Upload Image"}{" "}
                        (JPG/PNG, max 2MB)
                      </Label>
                      <Input
                        id="vehicle-image-file"
                        type="file"
                        accept=".jpg,.jpeg,.png"
                        onChange={(e) =>
                          setDocumentForms((prev) => ({
                            ...prev,
                            vehicle_image: {
                              ...prev.vehicle_image,
                              file: e.target.files?.[0] || null,
                            },
                          }))
                        }
                        data-testid="input-vehicle-image-file"
                      />
                    </div>
                    <div>
                      <Label htmlFor="vehicle-image-plate">Vehicle Plate</Label>
                      <Input
                        id="vehicle-image-plate"
                        type="text"
                        value={documentForms.vehicle_image.expirationDate}
                        onChange={(e) =>
                          setDocumentForms((prev) => ({
                            ...prev,
                            vehicle_image: {
                              ...prev.vehicle_image,
                              expirationDate: e.target.value,
                            },
                          }))
                        }
                        data-testid="input-vehicle-image-expiry"
                        placeholder="Enter vehicle plate number"
                      />
                    </div>
                    <Button
                      onClick={() => handleDocumentUpload("vehicle_image")}
                      disabled={uploadingDoc === "vehicle_image"}
                      className="w-full"
                      data-testid="button-upload-vehicle-image"
                    >
                      {uploadingDoc === "vehicle_image"
                        ? "Uploading..."
                        : getDocumentByType("vehicle_image")
                          ? "Update & Upload"
                          : "Save & Upload"}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ASSIGNED JOBS TAB */}
        {activeTab === "assigned-jobs" && (
          <Card data-testid="assigned-jobs-tab">
            <CardHeader>
              <CardTitle>My Assigned Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              {assignedBookings && assignedBookings.length > 0 ? (
                <div className="space-y-4">
                  {assignedBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="border rounded-lg p-4 space-y-3"
                      data-testid={`assigned-booking-${booking.id}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-1 text-sm">
                          <div data-testid={`assigned-pickup-${booking.id}`}>
                            <strong>Pickup:</strong> {booking.pickupAddress}
                          </div>
                          {booking.destinationAddress && (
                            <div
                              data-testid={`assigned-destination-${booking.id}`}
                            >
                              <strong>Destination:</strong>{" "}
                              {booking.destinationAddress}
                            </div>
                          )}
                          <div data-testid={`assigned-time-${booking.id}`}>
                            <strong>Scheduled:</strong>{" "}
                            {new Date(
                              booking.scheduledDateTime,
                            ).toLocaleString()}
                          </div>
                          <div data-testid={`assigned-amount-${booking.id}`}>
                            <strong>Your Payment:</strong> $
                            {booking.driverPayment || "Not set"}
                          </div>
                        </div>
                        <Badge
                          variant={
                            booking.status === "pending_driver_acceptance"
                              ? "secondary"
                              : "default"
                          }
                          data-testid={`assigned-status-${booking.id}`}
                        >
                          {booking.status === "pending_driver_acceptance"
                            ? "Awaiting Your Response"
                            : booking.status}
                        </Badge>
                      </div>

                      {/* Accept/Decline buttons for pending acceptance */}
                      {booking.status === "pending_driver_acceptance" && (
                        <div className="flex space-x-2 pt-2">
                          <Button
                            onClick={() => handleAcceptRide(booking.id)}
                            disabled={
                              acceptBookingMutation.isPending ||
                              declineBookingMutation.isPending
                            }
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            data-testid={`button-accept-${booking.id}`}
                          >
                            {acceptBookingMutation.isPending
                              ? "Accepting..."
                              : "Accept Ride"}
                          </Button>
                          <Button
                            onClick={() => handleDeclineRide(booking.id)}
                            disabled={
                              acceptBookingMutation.isPending ||
                              declineBookingMutation.isPending
                            }
                            variant="destructive"
                            className="flex-1"
                            data-testid={`button-decline-${booking.id}`}
                          >
                            {declineBookingMutation.isPending
                              ? "Declining..."
                              : "Decline"}
                          </Button>
                        </div>
                      )}

                      {/* Complete button for in-progress rides */}
                      {booking.status === "in_progress" && (
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => handleCompleteRide(booking.id)}
                            disabled={updateBookingMutation.isPending}
                            data-testid={`button-complete-${booking.id}`}
                          >
                            Complete Ride
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className="text-center p-8 text-muted-foreground"
                  data-testid="no-assigned-jobs-tab"
                >
                  No assigned jobs.
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* SETTINGS TAB */}
        {activeTab === "settings" && (
          <Card data-testid="menu-account">
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Driver ID</Label>
                  <Input
                    value={driver?.id || ""}
                    disabled
                    data-testid="setting-driver-id"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    value={user?.email || ""}
                    disabled
                    data-testid="setting-email"
                  />
                </div>
                <div>
                  <Label>Name</Label>
                  <Input
                    value={`${user?.firstName || ""} ${user?.lastName || ""}`}
                    disabled
                    data-testid="setting-name"
                  />
                </div>
                <div>
                  <Label>License Number</Label>
                  <Input
                    value={driver?.licenseNumber || "Not provided"}
                    disabled
                    data-testid="setting-license"
                  />
                </div>
                <div className="pt-2">
                  <div className="flex justify-between items-center mb-2">
                    <Label htmlFor="vehicle-plate">Vehicle Plate Number</Label>
                    {!editingVehiclePlate ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingVehiclePlate(true)}
                        data-testid="button-edit-vehicle-plate"
                      >
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingVehiclePlate(false);
                            setVehiclePlateValue(driver?.vehiclePlate || "");
                          }}
                          data-testid="button-cancel-vehicle-plate"
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() =>
                            updateVehiclePlateMutation.mutate(vehiclePlateValue)
                          }
                          disabled={updateVehiclePlateMutation.isPending}
                          data-testid="button-save-vehicle-plate"
                        >
                          {updateVehiclePlateMutation.isPending
                            ? "Saving..."
                            : "Save"}
                        </Button>
                      </div>
                    )}
                  </div>
                  {editingVehiclePlate ? (
                    <Input
                      id="vehicle-plate"
                      value={vehiclePlateValue}
                      onChange={(e) => setVehiclePlateValue(e.target.value)}
                      placeholder="Enter vehicle plate number (e.g., ABC123)"
                      className="font-mono"
                      data-testid="input-vehicle-plate"
                    />
                  ) : (
                    <p
                      className="text-sm p-2 bg-muted rounded-md font-mono"
                      data-testid="text-vehicle-plate"
                    >
                      {driver?.vehiclePlate || "No vehicle plate added yet"}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Your vehicle plate number will be shared with passengers
                    when you are assigned to their booking.
                  </p>
                </div>
                <div>
                  <Label>Rating</Label>
                  <Input
                    value={`${driver?.rating || "0"}/5`}
                    disabled
                    data-testid="setting-rating"
                  />
                </div>
                <div>
                  <Label>Total Rides</Label>
                  <Input
                    value={driver?.totalRides?.toString() || "0"}
                    disabled
                    data-testid="setting-total-rides"
                  />
                </div>
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center mb-2">
                    <Label htmlFor="credentials">Driver Credentials</Label>
                    {!editingCredentials ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingCredentials(true)}
                        data-testid="button-edit-credentials"
                      >
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingCredentials(false);
                            setCredentialsValue(
                              driver?.driverCredentials || "",
                            );
                          }}
                          data-testid="button-cancel-credentials"
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() =>
                            updateCredentialsMutation.mutate(credentialsValue)
                          }
                          disabled={updateCredentialsMutation.isPending}
                          data-testid="button-save-credentials"
                        >
                          {updateCredentialsMutation.isPending
                            ? "Saving..."
                            : "Save"}
                        </Button>
                      </div>
                    )}
                  </div>
                  {editingCredentials ? (
                    <textarea
                      id="credentials"
                      className="w-full min-h-[100px] p-2 border rounded-md"
                      value={credentialsValue}
                      onChange={(e) => setCredentialsValue(e.target.value)}
                      placeholder="Enter your driver credentials (e.g., CDL License #, TLC License #, certifications, etc.)"
                      data-testid="input-credentials"
                    />
                  ) : (
                    <p
                      className="text-sm p-2 bg-muted rounded-md"
                      data-testid="text-credentials"
                    >
                      {driver?.driverCredentials || "No credentials added yet"}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    These credentials will be shared with passengers when you
                    are assigned to their booking.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
