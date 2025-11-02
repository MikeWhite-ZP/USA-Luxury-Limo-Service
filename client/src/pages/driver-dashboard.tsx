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
import defaultUserImage from "@/assets/default-user.png";
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
  User,
  Download,
  Camera,
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
  passengerName?: string;
  passengerPhone?: string;
  passengerEmail?: string;
  bookingFor?: "self" | "someone_else";
}

interface DriverDocument {
  id: string;
  documentType:
    | "driver_license"
    | "limo_license"
    | "insurance_certificate"
    | "vehicle_image"
    | "profile_photo";
  documentUrl: string;
  expirationDate?: string;
  vehiclePlate?: string;
  whatsappNumber?: string;
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
  const [uploadDialogOpen, setUploadDialogOpen] = useState<string | null>(null);

  // Form data for mobile-style documents upload
  const [formData, setFormData] = useState({
    driverLicense: { file: null as File | null, expirationDate: "" },
    limoLicense: { file: null as File | null, expirationDate: "" },
    insuranceCertificate: { file: null as File | null, expirationDate: "" },
    vehicleImage: { file: null as File | null, vehiclePlate: "" },
    profilePhoto: { file: null as File | null },
    whatsappNumber: "",
  });
  const [uploading, setUploading] = useState<string | null>(null);

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

  // Fetch site logo from CMS
  const { data: siteLogoData } = useQuery<{ logo?: { url: string; alt?: string } }>({
    queryKey: ['/api/site-logo'],
    retry: false,
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

      // For vehicle_image, send as vehiclePlate; for profile_photo, send as whatsappNumber
      if (expirationDate) {
        if (documentType === "vehicle_image") {
          formData.append("vehiclePlate", expirationDate);
        } else if (documentType === "profile_photo") {
          formData.append("whatsappNumber", expirationDate);
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
      queryClient.invalidateQueries({ queryKey: ["/api/driver/profile"] });
      toast({
        title: "Document Uploaded",
        description: `Your ${variables.documentType.replace(/_/g, " ")} has been uploaded successfully.`,
      });
      setUploadingDoc(null);
      setUploading(null);
      setUploadDialogOpen(null);
      
      // Clear both form states
      setDocumentForms((prev) => ({
        ...prev,
        [variables.documentType]: { file: null, expirationDate: "" },
      }));

      // Clear the formData state based on document type
      switch (variables.documentType) {
        case "driver_license":
          setFormData(prev => ({ ...prev, driverLicense: { file: null, expirationDate: "" } }));
          break;
        case "limo_license":
          setFormData(prev => ({ ...prev, limoLicense: { file: null, expirationDate: "" } }));
          break;
        case "insurance_certificate":
          setFormData(prev => ({ ...prev, insuranceCertificate: { file: null, expirationDate: "" } }));
          break;
        case "vehicle_image":
          setFormData(prev => ({ ...prev, vehicleImage: { file: null, vehiclePlate: "" } }));
          break;
        case "profile_photo":
          setFormData(prev => ({ ...prev, profilePhoto: { file: null }, whatsappNumber: "" }));
          break;
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
      setUploadingDoc(null);
      setUploading(null);
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

  // Auto-cancel expired bookings mutation
  const autoCancelExpiredMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        "POST",
        "/api/bookings/auto-cancel-expired",
        {},
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to auto-cancel expired bookings");
      }
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.cancelledCount > 0) {
        console.log(`[AUTO-CANCEL] ${data.cancelledCount} expired booking(s) cancelled`);
        queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      }
    },
    onError: (error: Error) => {
      console.error('[AUTO-CANCEL] Error:', error);
    },
  });

  // Auto-cancel expired bookings when dashboard loads
  useEffect(() => {
    if (isAuthenticated && user?.role === "driver") {
      autoCancelExpiredMutation.mutate();
    }
  }, [isAuthenticated, user?.role]);

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

  const getStatusBadge = (status: string) => {
    const variant = getStatusBadgeVariant(status);
    return (
      <Badge variant={variant as any} className="capitalize">
        {status}
      </Badge>
    );
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

  const handleUpload = (documentType: string) => {
    let file: File | null = null;
    let expirationDate: string | undefined = undefined;
    let vehiclePlate: string | undefined = undefined;
    let whatsappNumber: string | undefined = undefined;

    switch (documentType) {
      case "driver_license":
        file = formData.driverLicense.file;
        expirationDate = formData.driverLicense.expirationDate;
        break;
      case "limo_license":
        file = formData.limoLicense.file;
        expirationDate = formData.limoLicense.expirationDate;
        break;
      case "insurance_certificate":
        file = formData.insuranceCertificate.file;
        expirationDate = formData.insuranceCertificate.expirationDate;
        break;
      case "vehicle_image":
        file = formData.vehicleImage.file;
        vehiclePlate = formData.vehicleImage.vehiclePlate;
        break;
      case "profile_photo":
        file = formData.profilePhoto.file;
        whatsappNumber = formData.whatsappNumber;
        break;
    }

    if (!file) {
      toast({
        title: "Missing File",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    if (!expirationDate && documentType !== "vehicle_image" && documentType !== "profile_photo") {
      toast({
        title: "Missing Expiration Date",
        description: "Please provide an expiration date",
        variant: "destructive",
      });
      return;
    }

    setUploading(documentType);
    uploadDocumentMutation.mutate({
      documentType,
      file,
      expirationDate: vehiclePlate || expirationDate || whatsappNumber,
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
  // Show ALL bookings assigned to this driver (except completed/cancelled/past-due)
  const now = new Date();
  const assignedBookings =
    bookings?.filter(
      (b) => {
        const isPast = new Date(b.scheduledDateTime) < now;
        return (
          b.status !== "completed" &&
          b.status !== "cancelled" &&
          b.status !== "pending" &&
          !isPast
        );
      }
    ) || [];

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Subtle Light Background Pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-40">
        <div className="absolute inset-0 bg-gradient-to-br from-red-50 via-white to-gray-50" />
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgb(220 38 38 / 0.05) 1px, transparent 0)', backgroundSize: '48px 48px' }} />
      </div>

      {/* Modern Header */}
      <header className="relative z-10 border-b border-gray-200 backdrop-blur-xl bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-5">
              {/* Clean Logo Display */}
              {siteLogoData?.logo?.url ? (
                <img 
                  src={siteLogoData.logo.url} 
                  alt={siteLogoData.logo.alt || "USA Luxury Limo"} 
                  className="h-16 w-auto object-contain"
                  data-testid="dashboard-logo"
                />
              ) : (
                <div className="w-16 h-16 bg-white border border-gray-200 rounded-lg flex items-center justify-center">
                  <User className="w-8 h-8 text-gray-600" />
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold text-black" data-testid="driver-title">
                  Driver Portal
                </h1>
                <p className="text-gray-600 text-lg mt-1" data-testid="driver-subtitle">
                  Welcome, <span className="text-red-600 font-medium">{user?.firstName || user?.email}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge
                variant={driver?.isAvailable ? "secondary" : "outline"}
                className={driver?.isAvailable ? "bg-red-600 text-white px-4 py-2 text-sm font-medium" : "border-gray-300 text-gray-600 px-4 py-2 text-sm"}
                data-testid="driver-status"
              >
                {driver?.isAvailable ? "Available" : "Offline"}
              </Badge>
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 to-red-800 rounded-xl opacity-0 group-hover:opacity-75 blur transition-opacity duration-300" />
                <Button
                  onClick={() => (window.location.href = "/api/logout")}
                  className="relative bg-black hover:bg-gray-900 text-white border border-gray-800 hover:border-red-600 px-6 py-3 rounded-xl font-medium transition-all duration-300"
                  data-testid="button-logout"
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Navigation Menu */}
        <div className="relative z-10 border-b border-gray-200 backdrop-blur-xl bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <nav className="flex space-x-2 overflow-x-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db transparent' }}>
              <button
                onClick={() => setActiveTab("home")}
                className={`relative py-4 px-6 font-medium text-sm flex items-center gap-2 transition-all duration-300 rounded-t-xl whitespace-nowrap ${
                  activeTab === "home"
                    ? 'text-red-600 bg-gradient-to-b from-red-50/80 to-transparent'
                    : 'text-gray-600 hover:text-black hover:bg-gray-50'
                }`}
                data-testid="nav-home"
              >
                {activeTab === "home" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-600 to-red-800" />
                )}
                <Home className="w-5 h-5" />
                Home
              </button>
              <button
                onClick={() => setActiveTab("documents")}
                className={`relative py-4 px-6 font-medium text-sm flex items-center gap-2 transition-all duration-300 rounded-t-xl whitespace-nowrap ${
                  activeTab === "documents"
                    ? 'text-red-600 bg-gradient-to-b from-red-50/80 to-transparent'
                    : 'text-gray-600 hover:text-black hover:bg-gray-50'
                }`}
                data-testid="nav-documents"
              >
                {activeTab === "documents" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-600 to-red-800" />
                )}
                <FileText className="w-5 h-5" />
                Documents
              </button>
              <button
                onClick={() => setActiveTab("assigned-jobs")}
                className={`relative py-4 px-6 font-medium text-sm flex items-center gap-2 transition-all duration-300 rounded-t-xl whitespace-nowrap ${
                  activeTab === "assigned-jobs"
                    ? 'text-red-600 bg-gradient-to-b from-red-50/80 to-transparent'
                    : 'text-gray-600 hover:text-black hover:bg-gray-50'
                }`}
                data-testid="nav-assigned-jobs"
              >
                {activeTab === "assigned-jobs" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-600 to-red-800" />
                )}
                <Briefcase className="w-5 h-5" />
                Assigned Jobs
              </button>
              <button
                onClick={() => setActiveTab("settings")}
                className={`relative py-4 px-6 font-medium text-sm flex items-center gap-2 transition-all duration-300 rounded-t-xl whitespace-nowrap ${
                  activeTab === "settings"
                    ? 'text-red-600 bg-gradient-to-b from-red-50/80 to-transparent'
                    : 'text-gray-600 hover:text-black hover:bg-gray-50'
                }`}
                data-testid="nav-settings"
              >
                {activeTab === "settings" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-600 to-red-800" />
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
                <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 to-red-700 rounded-2xl opacity-10 group-hover:opacity-20 blur transition-opacity duration-500" />
                <Card className="relative bg-white border-gray-200 shadow-lg hover:shadow-xl transition-shadow" data-testid="stat-earnings">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-md">
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
                            className="text-2xl font-bold text-red-600"
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
                              <p className="text-2xl font-bold text-red-600" data-testid="earnings-today">
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
                          className="relative group"
                          data-testid={`accepted-job-${booking.id}`}
                        >
                          {/* Glow effect */}
                          <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 via-red-600 to-red-700 rounded-2xl opacity-20 group-hover:opacity-30 blur transition-opacity duration-300" />
                          
                          {/* Main card */}
                          <div className="relative bg-white rounded-2xl p-6 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
                            {/* Header with status badge */}
                            <div className="flex items-start justify-between mb-5 pb-4 border-b border-gray-100">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-md">
                                  <Car className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                  <h3 className="font-bold text-gray-900 text-lg">Booking #{booking.id.slice(0, 8)}</h3>
                                  <p className="text-sm text-gray-500">
                                    {booking.bookingType === 'hourly' ? 'Hourly Service' : 'Transfer Service'}
                                  </p>
                                  {booking.passengerName && (
                                    <div className="flex items-center gap-2 mt-1">
                                      <User className="w-3.5 h-3.5 text-blue-600" />
                                      <span className="text-sm font-medium text-blue-700" data-testid={`passenger-name-${booking.id}`}>
                                        {booking.passengerName}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <Badge
                                variant="default"
                                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium px-3 py-1 shadow-md"
                                data-testid={`accepted-status-${booking.id}`}
                              >
                                {booking.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                              </Badge>
                            </div>

                            {/* Trip details */}
                            <div className="space-y-4 mb-5">
                              {/* Pickup */}
                              <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <MapPin className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-blue-700 mb-1">PICKUP LOCATION</p>
                                  <p className="text-sm text-gray-900 font-medium" data-testid={`accepted-pickup-${booking.id}`}>
                                    {booking.pickupAddress}
                                  </p>
                                </div>
                              </div>

                              {/* Destination */}
                              {booking.destinationAddress && (
                                <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <MapPin className="w-4 h-4 text-white" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-purple-700 mb-1">DESTINATION</p>
                                    <p className="text-sm text-gray-900 font-medium" data-testid={`accepted-destination-${booking.id}`}>
                                      {booking.destinationAddress}
                                    </p>
                                  </div>
                                </div>
                              )}

                              {/* Time and Payment row */}
                              <div className="grid grid-cols-2 gap-3">
                                {/* Scheduled time */}
                                <div className="flex items-start gap-2 p-3 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-100">
                                  <Clock className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-orange-700 mb-1">SCHEDULED</p>
                                    <p className="text-sm text-gray-900 font-medium" data-testid={`accepted-time-${booking.id}`}>
                                      {new Date(booking.scheduledDateTime).toLocaleString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: 'numeric',
                                        minute: '2-digit'
                                      })}
                                    </p>
                                  </div>
                                </div>

                                {/* Payment */}
                                <div className="flex items-start gap-2 p-3 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200">
                                  <DollarSign className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-red-700 mb-1">YOUR PAYMENT</p>
                                    <p className="text-lg text-red-700 font-bold" data-testid={`accepted-amount-${booking.id}`}>
                                      ${booking.driverPayment || "Not set"}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Action buttons */}
                            {booking.status === "pending_driver_acceptance" && (
                              <div className="flex gap-3 pt-4 border-t border-gray-100">
                                <Button
                                  onClick={() => handleAcceptRide(booking.id)}
                                  disabled={
                                    acceptBookingMutation.isPending ||
                                    declineBookingMutation.isPending
                                  }
                                  className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-semibold py-3 rounded-xl shadow-md hover:shadow-lg transition-all"
                                  data-testid={`button-accept-${booking.id}`}
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
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
                                  className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-semibold py-3 rounded-xl shadow-md hover:shadow-lg transition-all"
                                  data-testid={`button-decline-${booking.id}`}
                                >
                                  <AlertCircle className="w-4 h-4 mr-2" />
                                  {declineBookingMutation.isPending
                                    ? "Declining..."
                                    : "Decline"}
                                </Button>
                              </div>
                            )}
                            
                            {booking.status === "in_progress" && (
                              <div className="pt-4 border-t border-gray-100">
                                <Button
                                  onClick={() => handleCompleteRide(booking.id)}
                                  disabled={updateBookingMutation.isPending}
                                  className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-semibold py-3 rounded-xl shadow-md hover:shadow-lg transition-all"
                                  data-testid={`button-complete-${booking.id}`}
                                >
                                  <CheckCircle className="w-5 h-5 mr-2" />
                                  Complete Ride
                                </Button>
                              </div>
                            )}
                          </div>
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
          <div className="p-4 space-y-4">
            {/* Driver License */}
            <Card className="bg-white border-gray-200 shadow-lg hover:shadow-xl transition-shadow" data-testid="card-driver-license">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Driver License</h3>
                      <p className="text-xs text-gray-500">Required document</p>
                    </div>
                  </div>
                  {getDocumentByType('driver_license') && getStatusBadge(getDocumentByType('driver_license')!.status)}
                </div>

                {getDocumentByType('driver_license') && (
                  <div className="bg-red-50 rounded-lg p-3 space-y-2 text-sm border border-red-100">
                    {getDocumentByType('driver_license')!.expirationDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Expires:</span>
                        <span className="font-medium text-gray-900">
                          {new Date(getDocumentByType('driver_license')!.expirationDate!).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {getDocumentByType('driver_license')!.rejectionReason && (
                      <div className="p-3 bg-red-100 border border-red-300 rounded-lg">
                        <p className="text-sm text-red-700">
                          <strong>Reason:</strong> {getDocumentByType('driver_license')!.rejectionReason}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="driver-license-file" className="text-gray-700 font-medium mb-2 block">
                      {getDocumentByType('driver_license') ? 'Replace Document' : 'Upload Document'}
                    </Label>
                    <Input
                      id="driver-license-file"
                      type="file"
                      accept="image/*,application/pdf"
                      capture="environment"
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        driverLicense: { ...prev.driverLicense, file: e.target.files?.[0] || null }
                      }))}
                      className="bg-white border-gray-300"
                      data-testid="input-driver-license-file"
                    />
                    <p className="text-xs text-gray-500 mt-1">Image or PDF, max 2MB</p>
                  </div>
                  <div>
                    <Label htmlFor="driver-license-expiry" className="text-gray-700 font-medium mb-2 block">
                      Expiration Date
                    </Label>
                    <Input
                      id="driver-license-expiry"
                      type="date"
                      value={formData.driverLicense.expirationDate}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        driverLicense: { ...prev.driverLicense, expirationDate: e.target.value }
                      }))}
                      className="bg-white border-gray-300"
                      data-testid="input-driver-license-expiry"
                    />
                  </div>
                  <Button
                    onClick={() => handleUpload('driver_license')}
                    disabled={!formData.driverLicense.file || uploading === 'driver_license'}
                    className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white h-12 text-base font-semibold rounded-xl shadow-md"
                    data-testid="button-upload-driver-license"
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    {uploading === 'driver_license' ? 'Uploading...' : 'Upload License'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Limo License */}
            <Card className="bg-white border-gray-200 shadow-lg hover:shadow-xl transition-shadow" data-testid="card-limo-license">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Limo License</h3>
                      <p className="text-xs text-gray-500">Required document</p>
                    </div>
                  </div>
                  {getDocumentByType('limo_license') && getStatusBadge(getDocumentByType('limo_license')!.status)}
                </div>

                {getDocumentByType('limo_license') && (
                  <div className="bg-red-50 rounded-lg p-3 space-y-2 text-sm border border-red-100">
                    {getDocumentByType('limo_license')!.expirationDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Expires:</span>
                        <span className="font-medium text-gray-900">
                          {new Date(getDocumentByType('limo_license')!.expirationDate!).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {getDocumentByType('limo_license')!.rejectionReason && (
                      <div className="p-3 bg-red-100 border border-red-300 rounded-lg">
                        <p className="text-sm text-red-700">
                          <strong>Reason:</strong> {getDocumentByType('limo_license')!.rejectionReason}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="limo-license-file" className="text-gray-700 font-medium mb-2 block">
                      {getDocumentByType('limo_license') ? 'Replace Document' : 'Upload Document'}
                    </Label>
                    <Input
                      id="limo-license-file"
                      type="file"
                      accept="image/*,application/pdf"
                      capture="environment"
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        limoLicense: { ...prev.limoLicense, file: e.target.files?.[0] || null }
                      }))}
                      className="bg-white border-gray-300"
                      data-testid="input-limo-license-file"
                    />
                    <p className="text-xs text-gray-500 mt-1">Image or PDF, max 2MB</p>
                  </div>
                  <div>
                    <Label htmlFor="limo-license-expiry" className="text-gray-700 font-medium mb-2 block">
                      Expiration Date
                    </Label>
                    <Input
                      id="limo-license-expiry"
                      type="date"
                      value={formData.limoLicense.expirationDate}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        limoLicense: { ...prev.limoLicense, expirationDate: e.target.value }
                      }))}
                      className="bg-white border-gray-300"
                      data-testid="input-limo-license-expiry"
                    />
                  </div>
                  <Button
                    onClick={() => handleUpload('limo_license')}
                    disabled={!formData.limoLicense.file || uploading === 'limo_license'}
                    className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white h-12 text-base font-semibold rounded-xl shadow-md"
                    data-testid="button-upload-limo-license"
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    {uploading === 'limo_license' ? 'Uploading...' : 'Upload License'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Insurance Certificate */}
            <Card className="bg-white border-gray-200 shadow-lg hover:shadow-xl transition-shadow" data-testid="card-insurance-certificate">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Insurance Certificate</h3>
                      <p className="text-xs text-gray-500">Required document</p>
                    </div>
                  </div>
                  {getDocumentByType('insurance_certificate') && getStatusBadge(getDocumentByType('insurance_certificate')!.status)}
                </div>

                {getDocumentByType('insurance_certificate') && (
                  <div className="bg-red-50 rounded-lg p-3 space-y-2 text-sm border border-red-100">
                    {getDocumentByType('insurance_certificate')!.expirationDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Expires:</span>
                        <span className="font-medium text-gray-900">
                          {new Date(getDocumentByType('insurance_certificate')!.expirationDate!).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {getDocumentByType('insurance_certificate')!.rejectionReason && (
                      <div className="p-3 bg-red-100 border border-red-300 rounded-lg">
                        <p className="text-sm text-red-700">
                          <strong>Reason:</strong> {getDocumentByType('insurance_certificate')!.rejectionReason}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="insurance-certificate-file" className="text-gray-700 font-medium mb-2 block">
                      {getDocumentByType('insurance_certificate') ? 'Replace Document' : 'Upload Document'}
                    </Label>
                    <Input
                      id="insurance-certificate-file"
                      type="file"
                      accept="image/*,application/pdf"
                      capture="environment"
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        insuranceCertificate: { ...prev.insuranceCertificate, file: e.target.files?.[0] || null }
                      }))}
                      className="bg-white border-gray-300"
                      data-testid="input-insurance-certificate-file"
                    />
                    <p className="text-xs text-gray-500 mt-1">Image or PDF, max 2MB</p>
                  </div>
                  <div>
                    <Label htmlFor="insurance-certificate-expiry" className="text-gray-700 font-medium mb-2 block">
                      Expiration Date
                    </Label>
                    <Input
                      id="insurance-certificate-expiry"
                      type="date"
                      value={formData.insuranceCertificate.expirationDate}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        insuranceCertificate: { ...prev.insuranceCertificate, expirationDate: e.target.value }
                      }))}
                      className="bg-white border-gray-300"
                      data-testid="input-insurance-certificate-expiry"
                    />
                  </div>
                  <Button
                    onClick={() => handleUpload('insurance_certificate')}
                    disabled={!formData.insuranceCertificate.file || uploading === 'insurance_certificate'}
                    className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white h-12 text-base font-semibold rounded-xl shadow-md"
                    data-testid="button-upload-insurance-certificate"
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    {uploading === 'insurance_certificate' ? 'Uploading...' : 'Upload Certificate'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Vehicle Image */}
            <Card className="bg-white border-gray-200 shadow-lg hover:shadow-xl transition-shadow" data-testid="card-vehicle-image">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                      <Car className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Vehicle Image</h3>
                      <p className="text-xs text-gray-500">Optional document</p>
                    </div>
                  </div>
                  {getDocumentByType('vehicle_image') && getStatusBadge(getDocumentByType('vehicle_image')!.status)}
                </div>

                {getDocumentByType('vehicle_image') && (
                  <div className="bg-red-50 rounded-lg p-3 space-y-2 text-sm border border-red-100">
                    {getDocumentByType('vehicle_image')!.vehiclePlate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Vehicle Plate:</span>
                        <span className="font-medium text-gray-900">
                          {getDocumentByType('vehicle_image')!.vehiclePlate}
                        </span>
                      </div>
                    )}
                    {getDocumentByType('vehicle_image')!.rejectionReason && (
                      <div className="p-3 bg-red-100 border border-red-300 rounded-lg">
                        <p className="text-sm text-red-700">
                          <strong>Reason:</strong> {getDocumentByType('vehicle_image')!.rejectionReason}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="vehicle-image-file" className="text-gray-700 font-medium mb-2 block">
                      {getDocumentByType('vehicle_image') ? 'Replace Image' : 'Upload Image'}
                    </Label>
                    <Input
                      id="vehicle-image-file"
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        vehicleImage: { ...prev.vehicleImage, file: e.target.files?.[0] || null }
                      }))}
                      className="bg-white border-gray-300"
                      data-testid="input-vehicle-image-file"
                    />
                    <p className="text-xs text-gray-500 mt-1">Image only, max 2MB</p>
                  </div>
                  <div>
                    <Label htmlFor="vehicle-plate" className="text-gray-700 font-medium mb-2 block">
                      Vehicle Plate Number
                    </Label>
                    <Input
                      id="vehicle-plate"
                      type="text"
                      placeholder="Enter plate number"
                      value={formData.vehicleImage.vehiclePlate}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        vehicleImage: { ...prev.vehicleImage, vehiclePlate: e.target.value }
                      }))}
                      className="bg-white border-gray-300"
                      data-testid="input-vehicle-plate"
                    />
                  </div>
                  <Button
                    onClick={() => handleUpload('vehicle_image')}
                    disabled={!formData.vehicleImage.file || uploading === 'vehicle_image'}
                    className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white h-12 text-base font-semibold rounded-xl shadow-md"
                    data-testid="button-upload-vehicle-image"
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    {uploading === 'vehicle_image' ? 'Uploading...' : 'Upload Image'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Profile Photo */}
            <Card className="bg-white border-gray-200 shadow-lg hover:shadow-xl transition-shadow" data-testid="card-profile-photo">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                      <Camera className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Profile Photo</h3>
                      <p className="text-xs text-gray-500">Optional</p>
                    </div>
                  </div>
                  {getDocumentByType('profile_photo') && getStatusBadge(getDocumentByType('profile_photo')!.status)}
                </div>

                {/* Avatar Preview */}
                <div className="flex justify-center py-4">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-red-100 shadow-lg bg-white">
                      <img
                        src={getDocumentByType('profile_photo')?.status === 'approved' && getDocumentByType('profile_photo')?.documentUrl ? getDocumentByType('profile_photo')!.documentUrl : defaultUserImage}
                        alt="Profile"
                        className="w-full h-full object-cover"
                        data-testid="img-profile-preview"
                      />
                    </div>
                    <div className="absolute bottom-0 right-0 w-10 h-10 bg-red-600 rounded-full flex items-center justify-center shadow-md border-2 border-white">
                      <Camera className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>

                {getDocumentByType('profile_photo') && (
                  <div className="bg-red-50 rounded-lg p-3 space-y-2 text-sm border border-red-100">
                    {getDocumentByType('profile_photo')!.whatsappNumber && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">WhatsApp:</span>
                        <span className="font-medium text-gray-900">
                          {getDocumentByType('profile_photo')!.whatsappNumber}
                        </span>
                      </div>
                    )}
                    {getDocumentByType('profile_photo')!.rejectionReason && (
                      <div className="p-3 bg-red-100 border border-red-300 rounded-lg">
                        <p className="text-sm text-red-700">
                          <strong>Reason:</strong> {getDocumentByType('profile_photo')!.rejectionReason}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="profile-photo-file" className="text-gray-700 font-medium mb-2 block">
                      {getDocumentByType('profile_photo') ? 'Replace Photo' : 'Upload Photo'}
                    </Label>
                    <Input
                      id="profile-photo-file"
                      type="file"
                      accept="image/*"
                      capture="user"
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        profilePhoto: { file: e.target.files?.[0] || null }
                      }))}
                      className="bg-white border-gray-300"
                      data-testid="input-profile-photo-file"
                    />
                    <p className="text-xs text-gray-500 mt-1">Image only, max 2MB</p>
                  </div>
                  <div>
                    <Label htmlFor="whatsapp-number" className="text-gray-700 font-medium mb-2 block">
                      WhatsApp Number (Optional)
                    </Label>
                    <Input
                      id="whatsapp-number"
                      type="tel"
                      placeholder="+1 234 567 8900"
                      value={formData.whatsappNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, whatsappNumber: e.target.value }))}
                      className="bg-white border-gray-300"
                      data-testid="input-whatsapp-number"
                    />
                  </div>
                  <Button
                    onClick={() => handleUpload('profile_photo')}
                    disabled={!formData.profilePhoto.file || uploading === 'profile_photo'}
                    className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white h-12 text-base font-semibold rounded-xl shadow-md"
                    data-testid="button-upload-profile-photo"
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    {uploading === 'profile_photo' ? 'Uploading...' : 'Upload Photo'}
                  </Button>
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
                            <span className="text-red-600 font-bold">
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
                            className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-semibold"
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
                            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-semibold"
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
