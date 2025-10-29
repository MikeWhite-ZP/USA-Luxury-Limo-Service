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
  Info,
  Calendar,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
    | "on_the_way"
    | "arrived"
    | "on_board"
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
  reminderSentAt?: string;
  onTheWayAt?: string;
  arrivedAt?: string;
  onBoardAt?: string;
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

interface EarningsData {
  today: number;
  week: number;
  month: number;
  year: number;
  allTime: number;
  currentDate: string;
  completedRidesCount: number;
}

export default function DriverDashboard() {
  const { toast } = useToast();
  const { user, isLoading, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<
    "home" | "documents" | "assigned-jobs" | "settings"
  >("home");
  const [earningsDialogOpen, setEarningsDialogOpen] = useState(false);
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

  // Fetch driver earnings
  const { data: earnings, isLoading: earningsLoading } = useQuery<EarningsData>({
    queryKey: ["/api/driver/earnings"],
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
    <div className="min-h-screen bg-gray-50">
      {/* DARK HEADER - Modern Professional */}
      <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700 shadow-xl">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Professional Icon */}
              <div className="w-14 h-14 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <Car className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white" data-testid="driver-title">
                  Driver Portal
                </h1>
                <p className="text-slate-300 text-sm mt-0.5" data-testid="driver-subtitle">
                  Welcome, <span className="font-semibold">{user?.firstName || user?.email}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                className={driver?.isAvailable 
                  ? "bg-green-600 hover:bg-green-600 text-white px-4 py-2 text-sm font-semibold" 
                  : "bg-slate-700 text-slate-300 px-4 py-2 text-sm"}
                data-testid="driver-status"
              >
                {driver?.isAvailable ? "● Available" : "○ Offline"}
              </Badge>
              <Button
                onClick={() => (window.location.href = "/api/logout")}
                variant="outline"
                className="bg-slate-800 hover:bg-slate-700 text-white border-slate-600 hover:border-slate-500 px-5"
                data-testid="button-logout"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        {/* DARK NAVIGATION MENU */}
        <div className="bg-slate-900 border-t border-slate-700">
          <div className="max-w-7xl mx-auto px-6">
            <nav className="flex gap-1">
              <button
                onClick={() => setActiveTab("home")}
                className={`relative py-4 px-6 font-medium text-sm flex items-center gap-2 transition-all duration-300 rounded-t-xl whitespace-nowrap ${
                  activeTab === "home"
                    ? 'text-green-400 bg-gradient-to-b from-slate-800/80 to-transparent'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
                data-testid="nav-home"
              >
                {activeTab === "home" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-600 to-emerald-600" />
                )}
                <Home className="w-5 h-5" />
                Home
              </button>
              <button
                onClick={() => setActiveTab("documents")}
                className={`relative py-4 px-6 font-medium text-sm flex items-center gap-2 transition-all duration-300 rounded-t-xl whitespace-nowrap ${
                  activeTab === "documents"
                    ? 'text-green-400 bg-gradient-to-b from-slate-800/80 to-transparent'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
                data-testid="nav-documents"
              >
                {activeTab === "documents" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-600 to-emerald-600" />
                )}
                <FileText className="w-5 h-5" />
                Documents
              </button>
              <button
                onClick={() => setActiveTab("assigned-jobs")}
                className={`relative py-4 px-6 font-medium text-sm flex items-center gap-2 transition-all duration-300 rounded-t-xl whitespace-nowrap ${
                  activeTab === "assigned-jobs"
                    ? 'text-green-400 bg-gradient-to-b from-slate-800/80 to-transparent'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
                data-testid="nav-assigned-jobs"
              >
                {activeTab === "assigned-jobs" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-600 to-emerald-600" />
                )}
                <Briefcase className="w-5 h-5" />
                Assigned Jobs
              </button>
              <button
                onClick={() => setActiveTab("settings")}
                className={`relative py-4 px-6 font-medium text-sm flex items-center gap-2 transition-all duration-300 rounded-t-xl whitespace-nowrap ${
                  activeTab === "settings"
                    ? 'text-green-400 bg-gradient-to-b from-slate-800/80 to-transparent'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
                data-testid="nav-settings"
              >
                {activeTab === "settings" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-600 to-emerald-600" />
                )}
                <Settings className="w-5 h-5" />
                Account Settings
              </button>
            </nav>
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-7xl mx-auto p-8 space-y-8">
        {/* HOME TAB */}
        {activeTab === "home" && (
          <>
            {/* Performance Stats */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl opacity-10 group-hover:opacity-20 blur transition-opacity duration-500" />
                <Card className="relative bg-white border-gray-200 shadow-lg hover:shadow-xl transition-shadow" data-testid="stat-earnings">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center shadow-md">
                          <DollarSign className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 flex items-center gap-2 font-medium">
                            <Calendar className="w-3 h-3" />
                            {earnings?.currentDate 
                              ? new Date(earnings.currentDate).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric', 
                                  year: 'numeric' 
                                })
                              : "Today"}
                          </p>
                          <p
                            className="text-2xl font-bold text-[#29b24a]"
                            data-testid="today-earnings"
                          >
                            {earningsLoading ? (
                              <span className="text-gray-400">Loading...</span>
                            ) : (
                              `$${earnings?.today?.toFixed(2) || '0.00'}`
                            )}
                          </p>
                        </div>
                      </div>
                    <Dialog open={earningsDialogOpen} onOpenChange={setEarningsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          data-testid="button-earnings-details"
                        >
                          <Info className="w-4 h-4 text-blue-600" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg sm:max-w-md bg-[#ffffff]" data-testid="dialog-earnings-details">
                        <DialogHeader>
                          <DialogTitle>Earnings Breakdown</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">Today</p>
                              <p className="text-2xl font-bold text-green-600" data-testid="earnings-today">
                                ${earnings?.today?.toFixed(2) || '0.00'}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">This Week</p>
                              <p className="text-2xl font-bold text-blue-600" data-testid="earnings-week">
                                ${earnings?.week?.toFixed(2) || '0.00'}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">This Month</p>
                              <p className="text-2xl font-bold text-purple-600" data-testid="earnings-month">
                                ${earnings?.month?.toFixed(2) || '0.00'}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">This Year</p>
                              <p className="text-2xl font-bold text-orange-600" data-testid="earnings-year">
                                ${earnings?.year?.toFixed(2) || '0.00'}
                              </p>
                            </div>
                          </div>
                          <div className="pt-4 border-t">
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">All-Time Earnings</p>
                              <p className="text-3xl font-bold" data-testid="earnings-all-time">
                                ${earnings?.allTime?.toFixed(2) || '0.00'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                From {earnings?.completedRidesCount || 0} completed rides
                              </p>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
              </div>

              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl opacity-10 group-hover:opacity-20 blur transition-opacity duration-500" />
                <Card className="relative bg-white border-gray-200 shadow-lg hover:shadow-xl transition-shadow" data-testid="stat-rides">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center shadow-md">
                        <MapPin className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 font-medium">
                          Completed Rides
                        </p>
                        <p
                          className="text-2xl font-bold text-gray-900"
                          data-testid="completed-rides"
                        >
                          {completedRides}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-2xl opacity-10 group-hover:opacity-20 blur transition-opacity duration-500" />
                <Card className="relative bg-white border-gray-200 shadow-lg hover:shadow-xl transition-shadow" data-testid="stat-rating">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center shadow-md">
                        <Star className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Rating</p>
                        <p
                          className="text-2xl font-bold text-gray-900"
                          data-testid="driver-rating"
                        >
                          {driver?.rating || "0"}/5
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Accepted/Assigned Jobs */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl opacity-10 group-hover:opacity-20 blur transition-opacity duration-500" />
              <Card className="relative bg-white border-gray-200 shadow-lg hover:shadow-xl transition-shadow" data-testid="accepted-jobs">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-md">
                      <Briefcase className="w-5 h-5 text-white" />
                    </div>
                    Accepted Jobs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {assignedBookings && assignedBookings.length > 0 ? (
                    <div className="space-y-4">
                      {assignedBookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-5 border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all space-y-3"
                          data-testid={`accepted-job-${booking.id}`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="space-y-2 text-sm flex-1">
                              <div className="text-gray-900" data-testid={`accepted-pickup-${booking.id}`}>
                                <strong className="text-gray-700">Pickup:</strong> {booking.pickupAddress}
                              </div>
                              {booking.destinationAddress && (
                                <div
                                  className="text-gray-900"
                                  data-testid={`accepted-destination-${booking.id}`}
                                >
                                  <strong className="text-gray-700">Destination:</strong>{" "}
                                  {booking.destinationAddress}
                                </div>
                              )}
                              <div className="text-gray-900" data-testid={`accepted-time-${booking.id}`}>
                                <strong className="text-gray-700">Scheduled:</strong>{" "}
                                {new Date(
                                  booking.scheduledDateTime,
                                ).toLocaleString()}
                              </div>
                              <div className="text-gray-900" data-testid={`accepted-amount-${booking.id}`}>
                                <strong className="text-gray-700">Your Payment:</strong>{" "}
                                <span className="text-[#29b24a] font-bold">
                                  ${booking.driverPayment || "Not set"}
                                </span>
                              </div>
                            </div>
                            <Badge
                              variant="default"
                              className="bg-purple-600 text-white"
                              data-testid={`accepted-status-${booking.id}`}
                            >
                              {booking.status}
                            </Badge>
                          </div>
                          {booking.status === "in_progress" && (
                            <div className="flex space-x-2 pt-3 border-t border-gray-200">
                              <Button
                                onClick={() => handleCompleteRide(booking.id)}
                                disabled={updateBookingMutation.isPending}
                                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white"
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
                      className="text-center p-12"
                      data-testid="no-accepted-jobs"
                    >
                      <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-600 text-lg font-medium">No accepted jobs yet</p>
                      <p className="text-gray-500 text-sm mt-2">New job assignments will appear here</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* DOCUMENTS TAB */}
        {activeTab === "documents" && (
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl opacity-10 group-hover:opacity-20 blur transition-opacity duration-500" />
            <Card
              data-testid="document-verification"
              className="relative bg-white border-gray-200 shadow-lg hover:shadow-xl transition-shadow"
            >
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center shadow-md">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  Document Verification
                </CardTitle>
              </CardHeader>
              <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                {/* Driver's License */}
                <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-2xl border border-blue-100 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-blue-200">
                    <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-white" />
                      </div>
                      Driver's License
                    </h4>
                    {getDocumentByType("driver_license") && (
                      <Badge
                        variant={getStatusBadgeVariant(
                          getDocumentByType("driver_license")!.status,
                        )}
                        className="font-medium"
                        data-testid="status-driver-license"
                      >
                        {getDocumentByType("driver_license")!.status}
                      </Badge>
                    )}
                  </div>

                  {getDocumentByType("driver_license") && (
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-700">
                          Expiration Date:
                        </span>
                        <span
                          className="text-sm font-medium text-gray-900"
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
                          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-700">
                              <strong className="font-semibold">Rejection Reason:</strong>{" "}
                              {
                                getDocumentByType("driver_license")!
                                  .rejectionReason
                              }
                            </p>
                          </div>
                        )}
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Uploaded:{" "}
                        {new Date(
                          getDocumentByType("driver_license")!.uploadedAt,
                        ).toLocaleDateString()}
                      </div>
                    </div>
                  )}

                  <div className="space-y-4 pt-2">
                    <div>
                      <Label htmlFor="driver-license-file" className="text-gray-700 font-medium mb-2">
                        {getDocumentByType("driver_license")
                          ? "Re-upload Document"
                          : "Upload Document"}{" "}
                        <span className="text-gray-500 font-normal">(PDF/Image, max 2MB)</span>
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
                        className="mt-2 bg-white border-gray-300 hover:border-blue-400 transition-colors"
                        data-testid="input-driver-license-file"
                      />
                    </div>
                    <div>
                      <Label htmlFor="driver-license-expiry" className="text-gray-700 font-medium mb-2">
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
                        className="mt-2 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        data-testid="input-driver-license-expiry"
                      />
                    </div>
                    <Button
                      onClick={() => handleDocumentUpload("driver_license")}
                      disabled={uploadingDoc === "driver_license"}
                      className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold py-3 rounded-xl shadow-md hover:shadow-lg transition-all"
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
                <div className="bg-gradient-to-br from-green-50 to-white p-6 rounded-2xl border border-green-100 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-green-200">
                    <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-white" />
                      </div>
                      Limo License
                    </h4>
                    {getDocumentByType("limo_license") && (
                      <Badge
                        variant={getStatusBadgeVariant(
                          getDocumentByType("limo_license")!.status,
                        )}
                        className="font-medium"
                        data-testid="status-limo-license"
                      >
                        {getDocumentByType("limo_license")!.status}
                      </Badge>
                    )}
                  </div>

                  {getDocumentByType("limo_license") && (
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-700">
                          Expiration Date:
                        </span>
                        <span
                          className="text-sm font-medium text-gray-900"
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
                          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-700">
                              <strong className="font-semibold">Rejection Reason:</strong>{" "}
                              {getDocumentByType("limo_license")!.rejectionReason}
                            </p>
                          </div>
                        )}
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Uploaded:{" "}
                        {new Date(
                          getDocumentByType("limo_license")!.uploadedAt,
                        ).toLocaleDateString()}
                      </div>
                    </div>
                  )}

                  <div className="space-y-4 pt-2">
                    <div>
                      <Label htmlFor="limo-license-file" className="text-gray-700 font-medium mb-2">
                        {getDocumentByType("limo_license")
                          ? "Re-upload Document"
                          : "Upload Document"}{" "}
                        <span className="text-gray-500 font-normal">(PDF/Image, max 2MB)</span>
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
                        className="mt-2 bg-white border-gray-300 hover:border-green-400 transition-colors"
                        data-testid="input-limo-license-file"
                      />
                    </div>
                    <div>
                      <Label htmlFor="limo-license-expiry" className="text-gray-700 font-medium mb-2">
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
                        className="mt-2 bg-white border-gray-300 focus:border-green-500 focus:ring-green-500"
                        data-testid="input-limo-license-expiry"
                      />
                    </div>
                    <Button
                      onClick={() => handleDocumentUpload("limo_license")}
                      disabled={uploadingDoc === "limo_license"}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold py-3 rounded-xl shadow-md hover:shadow-lg transition-all"
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
                <div className="bg-gradient-to-br from-purple-50 to-white p-6 rounded-2xl border border-purple-100 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-purple-200">
                    <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-white" />
                      </div>
                      Insurance Certificate
                    </h4>
                    {getDocumentByType("insurance_certificate") && (
                      <Badge
                        variant={getStatusBadgeVariant(
                          getDocumentByType("insurance_certificate")!.status,
                        )}
                        className="font-medium"
                        data-testid="status-insurance"
                      >
                        {getDocumentByType("insurance_certificate")!.status}
                      </Badge>
                    )}
                  </div>

                  {getDocumentByType("insurance_certificate") && (
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-700">
                          Expiration Date:
                        </span>
                        <span
                          className="text-sm font-medium text-gray-900"
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
                          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-700">
                              <strong className="font-semibold">Rejection Reason:</strong>{" "}
                              {
                                getDocumentByType("insurance_certificate")!
                                  .rejectionReason
                              }
                            </p>
                          </div>
                        )}
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Uploaded:{" "}
                        {new Date(
                          getDocumentByType(
                            "insurance_certificate",
                          )!.uploadedAt,
                        ).toLocaleDateString()}
                      </div>
                    </div>
                  )}

                  <div className="space-y-4 pt-2">
                    <div>
                      <Label htmlFor="insurance-file" className="text-gray-700 font-medium mb-2">
                        {getDocumentByType("insurance_certificate")
                          ? "Re-upload Document"
                          : "Upload Document"}{" "}
                        <span className="text-gray-500 font-normal">(PDF/Image, max 2MB)</span>
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
                        className="mt-2 bg-white border-gray-300 hover:border-purple-400 transition-colors"
                        data-testid="input-insurance-file"
                      />
                    </div>
                    <div>
                      <Label htmlFor="insurance-expiry" className="text-gray-700 font-medium mb-2">Expiration Date</Label>
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
                        className="mt-2 bg-white border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                        data-testid="input-insurance-expiry"
                      />
                    </div>
                    <Button
                      onClick={() =>
                        handleDocumentUpload("insurance_certificate")
                      }
                      disabled={uploadingDoc === "insurance_certificate"}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold py-3 rounded-xl shadow-md hover:shadow-lg transition-all"
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
                <div className="bg-gradient-to-br from-orange-50 to-white p-6 rounded-2xl border border-orange-100 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-orange-200">
                    <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center">
                        <Car className="w-4 h-4 text-white" />
                      </div>
                      Vehicle Image
                    </h4>
                    {getDocumentByType("vehicle_image") && (
                      <Badge
                        variant={getStatusBadgeVariant(
                          getDocumentByType("vehicle_image")!.status,
                        )}
                        className="font-medium"
                        data-testid="status-vehicle-image"
                      >
                        {getDocumentByType("vehicle_image")!.status}
                      </Badge>
                    )}
                  </div>

                  {getDocumentByType("vehicle_image") && (
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-700">
                          Vehicle Plate:
                        </span>
                        <span
                          className="text-sm font-medium text-gray-900"
                          data-testid="plate-vehicle-image"
                        >
                          {getDocumentByType("vehicle_image")!.vehiclePlate ||
                            "N/A"}
                        </span>
                      </div>
                      {getDocumentByType("vehicle_image")!.status ===
                        "rejected" &&
                        getDocumentByType("vehicle_image")!.rejectionReason && (
                          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-700">
                              <strong className="font-semibold">Rejection Reason:</strong>{" "}
                              {
                                getDocumentByType("vehicle_image")!
                                  .rejectionReason
                              }
                            </p>
                          </div>
                        )}
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Uploaded:{" "}
                        {new Date(
                          getDocumentByType("vehicle_image")!.uploadedAt,
                        ).toLocaleDateString()}
                      </div>
                    </div>
                  )}

                  <div className="space-y-4 pt-2">
                    <div>
                      <Label htmlFor="vehicle-image-file" className="text-gray-700 font-medium mb-2">
                        {getDocumentByType("vehicle_image")
                          ? "Re-upload Image"
                          : "Upload Image"}{" "}
                        <span className="text-gray-500 font-normal">(JPG/PNG, max 2MB)</span>
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
                        className="mt-2 bg-white border-gray-300 hover:border-orange-400 transition-colors"
                        data-testid="input-vehicle-image-file"
                      />
                    </div>
                    <div>
                      <Label htmlFor="vehicle-image-plate" className="text-gray-700 font-medium mb-2">Vehicle Plate</Label>
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
                        className="mt-2 bg-white border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                        data-testid="input-vehicle-image-expiry"
                        placeholder="Enter vehicle plate number"
                      />
                    </div>
                    <Button
                      onClick={() => handleDocumentUpload("vehicle_image")}
                      disabled={uploadingDoc === "vehicle_image"}
                      className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-semibold py-3 rounded-xl shadow-md hover:shadow-lg transition-all"
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
          </div>
        )}

        {/* ASSIGNED JOBS TAB */}
        {activeTab === "assigned-jobs" && (
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl opacity-10 group-hover:opacity-20 blur transition-opacity duration-500" />
            <Card className="relative bg-white border-gray-200 shadow-lg hover:shadow-xl transition-shadow" data-testid="assigned-jobs-tab">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center shadow-md">
                    <Briefcase className="w-5 h-5 text-white" />
                  </div>
                  My Assigned Jobs
                </CardTitle>
              </CardHeader>
              <CardContent>
              {assignedBookings && assignedBookings.length > 0 ? (
                <div className="space-y-4">
                  {assignedBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-5 border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all space-y-3"
                      data-testid={`assigned-booking-${booking.id}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-2 text-sm flex-1">
                          <div className="text-gray-900" data-testid={`assigned-pickup-${booking.id}`}>
                            <strong className="text-gray-700">Pickup:</strong> {booking.pickupAddress}
                          </div>
                          {booking.destinationAddress && (
                            <div
                              className="text-gray-900"
                              data-testid={`assigned-destination-${booking.id}`}
                            >
                              <strong className="text-gray-700">Destination:</strong>{" "}
                              {booking.destinationAddress}
                            </div>
                          )}
                          <div className="text-gray-900" data-testid={`assigned-time-${booking.id}`}>
                            <strong className="text-gray-700">Scheduled:</strong>{" "}
                            {new Date(
                              booking.scheduledDateTime,
                            ).toLocaleString()}
                          </div>
                          <div className="text-gray-900" data-testid={`assigned-amount-${booking.id}`}>
                            <strong className="text-gray-700">Your Payment:</strong>{" "}
                            <span className="text-[#29b24a] font-bold">
                              ${booking.driverPayment || "Not set"}
                            </span>
                          </div>
                        </div>
                        <Badge
                          variant={
                            booking.status === "pending_driver_acceptance"
                              ? "secondary"
                              : "default"
                          }
                          className={booking.status === "pending_driver_acceptance" ? "bg-orange-600 text-white" : "bg-orange-600 text-white"}
                          data-testid={`assigned-status-${booking.id}`}
                        >
                          {booking.status === "pending_driver_acceptance"
                            ? "Awaiting Your Response"
                            : booking.status}
                        </Badge>
                      </div>

                      {/* Accept/Decline buttons for pending acceptance */}
                      {booking.status === "pending_driver_acceptance" && (
                        <div className="flex space-x-2 pt-3 border-t border-gray-200">
                          <Button
                            onClick={() => handleAcceptRide(booking.id)}
                            disabled={
                              acceptBookingMutation.isPending ||
                              declineBookingMutation.isPending
                            }
                            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold"
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
                            className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-semibold"
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
                        <div className="flex space-x-2 pt-3 border-t border-gray-200">
                          <Button
                            onClick={() => handleCompleteRide(booking.id)}
                            disabled={updateBookingMutation.isPending}
                            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold"
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
                  className="text-center p-12"
                  data-testid="no-assigned-jobs-tab"
                >
                  <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-600 text-lg font-medium">No assigned jobs</p>
                  <p className="text-gray-500 text-sm mt-2">New job assignments will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === "settings" && (
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl opacity-10 group-hover:opacity-20 blur transition-opacity duration-500" />
            <Card className="relative bg-white border-gray-200 shadow-lg hover:shadow-xl transition-shadow" data-testid="menu-account">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-md">
                    <Settings className="w-5 h-5 text-white" />
                  </div>
                  Account Settings
                </CardTitle>
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
          </div>
        )}
      </div>
    </div>
  );
}
