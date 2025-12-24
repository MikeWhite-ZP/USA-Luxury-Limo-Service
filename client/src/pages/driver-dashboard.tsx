import { useEffect, useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
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
import DriverTaxInfoSection from "@/components/DriverTaxInfoSection";

const defaultUserImage = '/images/default-user_1762118764894.png';

import {
  DollarSign,
  MapPin,
  Clock,
  Star,
  Upload,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
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
  Eye,
  Phone,
  Plane,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

// Decline reason options matching the document requirements
const DECLINE_REASONS = [
  { value: 'timing_conflict', label: 'Timing Conflict', description: 'The job time doesn\'t work with my schedule' },
  { value: 'pricing_too_low', label: 'Pricing Too Low', description: 'The offered rate is not acceptable' },
  { value: 'too_far_away', label: 'Too Far Away', description: 'The distance/location is outside my preferred area' },
  { value: 'vehicle_not_suitable', label: 'Vehicle Not Suitable', description: 'My vehicle doesn\'t meet the job requirements' },
  { value: 'already_booked', label: 'Already Booked', description: 'I have another commitment at this time' },
  { value: 'personal_reasons', label: 'Personal Reasons', description: 'Other personal circumstances' },
] as const;

interface DriverData {
  id: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  limoLicenseNumber?: string;
  limoLicenseExpiry?: string;
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
  flightNumber?: string;
  flightAirline?: string;
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
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<
    "home" | "documents" | "settings"
  >("home");
  const [earningsDialogOpen, setEarningsDialogOpen] = useState(false);
  const [selectedBookingForDetails, setSelectedBookingForDetails] = useState<Booking | null>(null);
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
    driverLicense: { file: null as File | null, expirationDate: "", licenseNumber: "" },
    limoLicense: { file: null as File | null, expirationDate: "", licenseNumber: "" },
    insuranceCertificate: { file: null as File | null, expirationDate: "" },
    vehicleImage: { file: null as File | null, vehiclePlate: "" },
    profilePhoto: { file: null as File | null },
    whatsappNumber: "",
  });
  const [uploading, setUploading] = useState<string | null>(null);
  
  // Auto-save status tracking: 'idle' | 'saving' | 'saved' | 'error'
  const [saveStatus, setSaveStatus] = useState<Record<string, 'idle' | 'saving' | 'saved' | 'error'>>({
    driver_license: 'idle',
    limo_license: 'idle',
    insurance_certificate: 'idle',
    vehicle_image: 'idle',
    profile_photo: 'idle',
  });
  const saveTimeoutRefs = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  
  // Job list sub-tabs state
  const [jobListTab, setJobListTab] = useState<"new" | "accepted" | "completed" | "cancelled" | "declined">("new");
  
  // Document preview state
  const [selectedDocumentPreview, setSelectedDocumentPreview] = useState<DriverDocument | null>(null);

  // Decline dialog state
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [declineBookingId, setDeclineBookingId] = useState<string | null>(null);
  const [selectedDeclineReason, setSelectedDeclineReason] = useState<string>('');
  const [declineNotes, setDeclineNotes] = useState('');

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

  // Fetch tax info to check completion status
  const { data: taxInfo } = useQuery<{
    taxInfoComplete: boolean;
    taxInfoCompletedAt: string | null;
  }>({
    queryKey: ["/api/driver/tax-info"],
    retry: false,
    enabled: isAuthenticated && user?.role === "driver",
  });

  // Fetch document status to check if all required docs are uploaded
  const { data: documentStatus } = useQuery<{
    documentsComplete: boolean;
    documentsReady: boolean;
    missingDocuments: string[];
    pendingDocuments: string[];
    rejectedDocuments: string[];
    expiredDocuments: string[];
  }>({
    queryKey: ["/api/driver/document-status"],
    retry: false,
    enabled: isAuthenticated && user?.role === "driver",
  });

  // Initialize credentials, vehicle plate, and license numbers when driver data loads
  useEffect(() => {
    if (!driver) return; // Only run when driver data is available
    
    if (driver.driverCredentials) {
      setCredentialsValue(driver.driverCredentials);
    }
    if (driver.vehiclePlate) {
      setVehiclePlateValue(driver.vehiclePlate);
    }
    // Hydrate license numbers and expiration dates from driver profile
    setFormData(prev => ({
      ...prev,
      driverLicense: {
        ...prev.driverLicense,
        licenseNumber: driver.licenseNumber || prev.driverLicense.licenseNumber,
        expirationDate: driver.licenseExpiry 
          ? new Date(driver.licenseExpiry).toISOString().split('T')[0] 
          : prev.driverLicense.expirationDate
      },
      limoLicense: {
        ...prev.limoLicense,
        licenseNumber: driver.limoLicenseNumber || prev.limoLicense.licenseNumber,
        expirationDate: driver.limoLicenseExpiry 
          ? new Date(driver.limoLicenseExpiry).toISOString().split('T')[0] 
          : prev.limoLicense.expirationDate
      }
    }));
  }, [driver]);

  // Fetch driver bookings with automatic polling for new jobs
  const { data: bookings, isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
    retry: false,
    enabled: isAuthenticated && user?.role === "driver",
    refetchInterval: 30000, // Poll every 30 seconds for new jobs
    refetchIntervalInBackground: false, // Only poll when tab is active
  });

  // Fetch driver documents
  const { data: documents, isLoading: documentsLoading } = useQuery<
    DriverDocument[]
  >({
    queryKey: ["/api/driver/documents"],
    retry: false,
    enabled: isAuthenticated && user?.role === "driver",
  });

  // Fetch driver's declined bookings history
  interface DeclinedBooking {
    declineId: string;
    bookingId: string;
    reason: string;
    reasonDisplay: string;
    additionalNotes: string | null;
    declinedAt: string;
    pickupAddress: string;
    destinationAddress: string | null;
    scheduledDateTime: string;
    passengerName: string | null;
    bookingType: string;
    driverPayment: string | null;
    totalAmount: string | null;
  }
  
  const { data: declinedBookings } = useQuery<DeclinedBooking[]>({
    queryKey: ["/api/driver/declined-bookings"],
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
      vehiclePlate,
      whatsappNumber,
      licenseNumber,
    }: {
      documentType: string;
      file: File;
      expirationDate?: string;
      vehiclePlate?: string;
      whatsappNumber?: string;
      licenseNumber?: string;
    }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", documentType);

      if (expirationDate) {
        formData.append("expirationDate", expirationDate);
      }
      if (vehiclePlate) {
        formData.append("vehiclePlate", vehiclePlate);
      }
      if (whatsappNumber) {
        formData.append("whatsappNumber", whatsappNumber);
      }
      if (licenseNumber) {
        formData.append("licenseNumber", licenseNumber);
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
          setFormData(prev => ({ ...prev, driverLicense: { file: null, expirationDate: "", licenseNumber: "" } }));
          break;
        case "limo_license":
          setFormData(prev => ({ ...prev, limoLicense: { file: null, expirationDate: "", licenseNumber: "" } }));
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
      reasonDisplay,
      notes,
    }: {
      bookingId: string;
      reason?: string;
      reasonDisplay?: string;
      notes?: string;
    }) => {
      const response = await apiRequest(
        "POST",
        `/api/bookings/${bookingId}/decline`,
        { reason, reasonDisplay, notes },
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to decline booking");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/driver/declined-bookings"] });
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

  // Auto-save document metadata mutation
  const saveDocumentMetadataMutation = useMutation({
    mutationFn: async ({
      documentType,
      licenseNumber,
      expirationDate,
      vehiclePlate,
      whatsappNumber,
    }: {
      documentType: string;
      licenseNumber?: string;
      expirationDate?: string;
      vehiclePlate?: string;
      whatsappNumber?: string;
    }) => {
      const response = await apiRequest(
        "PATCH",
        `/api/driver/documents/${documentType}/metadata`,
        { licenseNumber, expirationDate, vehiclePlate, whatsappNumber },
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save");
      }
      return { documentType };
    },
    onSuccess: ({ documentType }) => {
      setSaveStatus(prev => ({ ...prev, [documentType]: 'saved' }));
      // Reset to idle after 2 seconds
      setTimeout(() => {
        setSaveStatus(prev => ({ ...prev, [documentType]: 'idle' }));
      }, 2000);
      // Refresh driver data and documents to show updated values
      queryClient.invalidateQueries({ queryKey: ["/api/driver/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/driver/documents"] });
    },
    onError: (error: Error, variables) => {
      setSaveStatus(prev => ({ ...prev, [variables.documentType]: 'error' }));
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Debounced auto-save function
  const debouncedSave = useCallback((
    documentType: string,
    data: { licenseNumber?: string; expirationDate?: string; vehiclePlate?: string; whatsappNumber?: string }
  ) => {
    // Clear existing timeout for this document type
    if (saveTimeoutRefs.current[documentType]) {
      clearTimeout(saveTimeoutRefs.current[documentType]);
    }
    
    // Set saving status
    setSaveStatus(prev => ({ ...prev, [documentType]: 'saving' }));
    
    // Debounce for 1.5 seconds
    saveTimeoutRefs.current[documentType] = setTimeout(() => {
      saveDocumentMetadataMutation.mutate({
        documentType,
        ...data,
      });
    }, 1500);
  }, [saveDocumentMetadataMutation]);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(saveTimeoutRefs.current).forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  const handleAcceptRide = (bookingId: string) => {
    // Check if all required documents are uploaded
    if (!documentStatus?.documentsComplete) {
      toast({
        title: "Documents Required",
        description: "Please upload all required documents in the Documents tab before accepting jobs.",
        variant: "destructive",
      });
      return;
    }
    // Check if tax info is complete
    if (!taxInfo?.taxInfoComplete) {
      toast({
        title: "Tax Information Required",
        description: "Please complete your tax information in Settings before accepting jobs.",
        variant: "destructive",
      });
      return;
    }
    // Check if user account is active
    if (!user?.isActive) {
      toast({
        title: "Account Pending Activation",
        description: "Your account must be activated by an administrator before you can accept jobs.",
        variant: "destructive",
      });
      return;
    }
    acceptBookingMutation.mutate(bookingId);
  };

  const handleDeclineRide = (bookingId: string) => {
    // Open decline dialog with reason selection
    setDeclineBookingId(bookingId);
    setSelectedDeclineReason('');
    setDeclineNotes('');
    setShowDeclineDialog(true);
  };

  const handleDeclineSubmit = () => {
    if (!declineBookingId || !selectedDeclineReason) return;
    
    // Find the display label for the selected reason
    const reasonObj = DECLINE_REASONS.find(r => r.value === selectedDeclineReason);
    const reasonDisplay = reasonObj ? `${reasonObj.label} - ${reasonObj.description}` : selectedDeclineReason;
    
    declineBookingMutation.mutate({ 
      bookingId: declineBookingId,
      reason: selectedDeclineReason,
      reasonDisplay,
      notes: declineNotes || undefined
    });
    
    // Close dialog and reset state
    setShowDeclineDialog(false);
    setDeclineBookingId(null);
    setSelectedDeclineReason('');
    setDeclineNotes('');
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
        return <Clock className="w-4 h-4 text-muted-foreground" />;
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

  const getDocumentTypeColor = (docType: string): string => {
    switch (docType) {
      case 'driver_license':
        return 'text-red-600';
      case 'limo_license':
        return 'text-blue-600';
      case 'insurance_certificate':
        return 'text-emerald-600';
      case 'vehicle_image':
        return 'text-purple-600';
      case 'profile_photo':
        return 'text-amber-600';
      default:
        return 'text-red-600';
    }
  };

  // Render save status indicator
  const renderSaveStatus = (documentType: string) => {
    const status = saveStatus[documentType];
    if (status === 'idle') return null;
    
    return (
      <span className={`text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 ${
        status === 'saving' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
        status === 'saved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      }`}>
        {status === 'saving' && <span className="animate-spin">⟳</span>}
        {status === 'saving' ? 'Saving...' : status === 'saved' ? '✓ Saved' : '✕ Error'}
      </span>
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
    let licenseNumber: string | undefined = undefined;

    switch (documentType) {
      case "driver_license":
        file = formData.driverLicense.file;
        expirationDate = formData.driverLicense.expirationDate;
        licenseNumber = formData.driverLicense.licenseNumber;
        break;
      case "limo_license":
        file = formData.limoLicense.file;
        expirationDate = formData.limoLicense.expirationDate;
        licenseNumber = formData.limoLicense.licenseNumber;
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
      expirationDate,
      vehiclePlate,
      whatsappNumber,
      licenseNumber,
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
  
  // Filter bookings by category
  const now = new Date();
  
  // New jobs: Pending driver acceptance (assigned but not yet accepted)
  const newJobs =
    bookings?.filter(
      (b) => b.status === "pending_driver_acceptance"
    ) || [];
  
  // Accepted jobs: Driver accepted but not completed (explicit accepted statuses only)
  const acceptedStatuses = ["driver_accepted", "confirmed", "on_the_way", "on_board", "in_progress"];
  const acceptedJobs =
    bookings?.filter(
      (b) => acceptedStatuses.includes(b.status)
    ) || [];
  
  // Completed jobs
  const completedJobs = bookings?.filter((b) => b.status === "completed") || [];
  
  // Cancelled jobs
  const cancelledJobs = bookings?.filter((b) => b.status === "cancelled") || [];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Subtle Light Background Pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-40">
        <div className="absolute inset-0 bg-gradient-to-br from-red-50 via-background to-muted dark:from-red-950/20 dark:via-background dark:to-muted" />
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgb(220 38 38 / 0.05) 1px, transparent 0)', backgroundSize: '48px 48px' }} />
      </div>

      {/* Modern Header */}
      <header className="relative z-10 border-b border-border backdrop-blur-xl bg-background shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-5">
              {/* Clean Logo Display */}
              {siteLogoData?.logo?.url ? (
                <img 
                  src={siteLogoData.logo.url} 
                  alt={siteLogoData.logo.alt || "Luxury Transportation"} 
                  className="h-16 w-auto object-contain"
                  data-testid="dashboard-logo"
                />
              ) : (
                <div className="w-16 h-16 bg-background border border-border rounded-lg flex items-center justify-center">
                  <User className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold text-foreground" data-testid="driver-title">
                  Driver Portal
                </h1>
                <p className="text-muted-foreground text-lg mt-1" data-testid="driver-subtitle">
                  Welcome, <span className="text-red-600 font-medium">{user?.firstName || user?.email}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Driver Profile Picture */}
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-red-100 shadow-md bg-background">
                <img
                  src={
                    getDocumentByType('profile_photo')?.status === 'approved' && getDocumentByType('profile_photo')?.documentUrl 
                      ? (getDocumentByType('profile_photo')!.documentUrl.startsWith('/') 
                          ? getDocumentByType('profile_photo')!.documentUrl 
                          : `/${getDocumentByType('profile_photo')!.documentUrl}`)
                      : defaultUserImage
                  }
                  alt="Driver Profile"
                  className="w-full h-full object-cover"
                  data-testid="img-header-profile"
                />
              </div>
              <Badge
                variant={driver?.isAvailable ? "secondary" : "outline"}
                className={driver?.isAvailable ? "bg-red-600 text-white px-4 py-2 text-sm font-medium" : "border-border text-muted-foreground px-4 py-2 text-sm"}
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
        <div className="relative z-10 border-b border-border backdrop-blur-xl bg-background">
          <div className="max-w-7xl mx-auto px-6">
            <nav className="flex space-x-2 overflow-x-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db transparent' }}>
              <button
                onClick={() => setActiveTab("home")}
                className={`relative py-4 px-6 font-medium text-sm flex items-center gap-2 transition-all duration-300 rounded-t-xl whitespace-nowrap ${
                  activeTab === "home"
                    ? 'text-red-600 bg-gradient-to-b from-red-50/80 dark:from-red-900/30 to-transparent'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
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
                    ? 'text-red-600 bg-gradient-to-b from-red-50/80 dark:from-red-900/30 to-transparent'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
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
                onClick={() => setActiveTab("settings")}
                className={`relative py-4 px-6 font-medium text-sm flex items-center gap-2 transition-all duration-300 rounded-t-xl whitespace-nowrap ${
                  activeTab === "settings"
                    ? 'text-red-600 bg-gradient-to-b from-red-50/80 dark:from-red-900/30 to-transparent'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
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
            {/* Document Upload Alert */}
            {!documentStatus?.documentsComplete && (
              <Alert variant="destructive" className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Upload Required Documents</AlertTitle>
                <AlertDescription>
                  You must upload all required documents before your account can be activated.
                  {documentStatus?.missingDocuments && documentStatus.missingDocuments.length > 0 && (
                    <span className="block mt-1 text-sm">
                      Missing: {documentStatus.missingDocuments.map(d => d.replace(/_/g, ' ')).join(', ')}
                    </span>
                  )}
                  {" "}
                  <button 
                    onClick={() => setActiveTab("documents")} 
                    className="underline font-medium hover:no-underline"
                  >
                    Go to Documents
                  </button>
                </AlertDescription>
              </Alert>
            )}

            {/* Tax Info Alert */}
            {documentStatus?.documentsComplete && !taxInfo?.taxInfoComplete && (
              <Alert variant="destructive" className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Complete Your Tax Information</AlertTitle>
                <AlertDescription>
                  You must complete your tax information in the Settings tab before your account can be activated and you can start earning.{" "}
                  <button 
                    onClick={() => setActiveTab("settings")} 
                    className="underline font-medium hover:no-underline"
                  >
                    Go to Settings
                  </button>
                </AlertDescription>
              </Alert>
            )}

            {/* Pending Activation Alert */}
            {documentStatus?.documentsComplete && taxInfo?.taxInfoComplete && !user?.isActive && (
              <Alert className="mb-6 border-yellow-200 bg-yellow-50">
                <Clock className="h-4 w-4 text-yellow-600" />
                <AlertTitle className="text-yellow-800">Pending Activation</AlertTitle>
                <AlertDescription className="text-yellow-700">
                  Your documents and tax information are complete. Please wait for an administrator to review and activate your account before you can start accepting jobs.
                </AlertDescription>
              </Alert>
            )}

            {/* Performance Stats */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 to-red-700 rounded-2xl opacity-10 group-hover:opacity-20 blur transition-opacity duration-500" />
                <Card className="relative bg-card border-border shadow-lg hover:shadow-xl transition-shadow" data-testid="stat-earnings">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-md">
                          <DollarSign className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground flex items-center gap-2 font-medium">
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
                              <span className="text-muted-foreground">Loading...</span>
                            ) : (
                              `$${earnings?.today?.toFixed(2) || '0.00'}`
                            )}
                          </p>
                        </div>
                      </div>
                    <Dialog open={earningsDialogOpen} onOpenChange={setEarningsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          data-testid="button-earnings-details"
                        >
                          <Info className="w-3 h-3 mr-1" />
                          Details
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
                <Card className="relative bg-card border-border shadow-lg hover:shadow-xl transition-shadow" data-testid="stat-rides">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center shadow-md">
                        <MapPin className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground font-medium">
                          Completed Rides
                        </p>
                        <p
                          className="text-2xl font-bold text-foreground"
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
                <Card className="relative bg-card border-border shadow-lg hover:shadow-xl transition-shadow" data-testid="stat-rating">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center shadow-md">
                        <Star className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground font-medium">Rating</p>
                        <p
                          className="text-2xl font-bold text-foreground"
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
              <Card className="relative bg-card border-border shadow-lg hover:shadow-xl transition-shadow" data-testid="accepted-jobs">
                <CardHeader className="pb-2">
                  <CardTitle className="text-2xl font-bold text-foreground flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-md">
                      <Briefcase className="w-5 h-5 text-white" />
                    </div>
                    My Jobs
                  </CardTitle>
                  {/* Job List Sub-Tabs */}
                  <div className="flex gap-1 mt-4 bg-muted/50 p-1 rounded-lg">
                    <button
                      onClick={() => setJobListTab("new")}
                      className={`flex-1 py-2 px-2 rounded-md text-sm font-medium transition-all ${
                        jobListTab === "new"
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      data-testid="tab-new-jobs"
                    >
                      New Jobs ({newJobs.length})
                    </button>
                    <button
                      onClick={() => setJobListTab("accepted")}
                      className={`flex-1 py-2 px-2 rounded-md text-sm font-medium transition-all ${
                        jobListTab === "accepted"
                          ? "bg-purple-600 text-white shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      data-testid="tab-accepted-jobs"
                    >
                      Accepted ({acceptedJobs.length})
                    </button>
                    <button
                      onClick={() => setJobListTab("completed")}
                      className={`flex-1 py-2 px-2 rounded-md text-sm font-medium transition-all ${
                        jobListTab === "completed"
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      data-testid="tab-completed-jobs"
                    >
                      Completed ({completedJobs.length})
                    </button>
                    <button
                      onClick={() => setJobListTab("cancelled")}
                      className={`flex-1 py-2 px-2 rounded-md text-sm font-medium transition-all ${
                        jobListTab === "cancelled"
                          ? "bg-red-600 text-white shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      data-testid="tab-cancelled-jobs"
                    >
                      Cancelled ({cancelledJobs.length})
                    </button>
                    <button
                      onClick={() => setJobListTab("declined")}
                      className={`flex-1 py-2 px-2 rounded-md text-sm font-medium transition-all ${
                        jobListTab === "declined"
                          ? "bg-amber-600 text-white shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      data-testid="tab-declined-jobs"
                    >
                      Declined ({declinedBookings?.length || 0})
                    </button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* New Jobs Tab - Pending driver acceptance */}
                  {jobListTab === "new" && (
                    <>
                      {newJobs.length > 0 ? (
                        <div className="space-y-4">
                          {newJobs.map((booking) => (
                            <div
                              key={booking.id}
                              className="relative group"
                              data-testid={`new-job-${booking.id}`}
                            >
                              <div className="bg-card rounded-xl p-4 border border-blue-200 dark:border-blue-800 shadow-sm hover:shadow-md transition-all duration-200">
                                <div className="flex items-center justify-between gap-2 mb-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-semibold text-foreground">#{booking.id.slice(0, 8)}</span>
                                    <Badge className="bg-blue-600 text-white font-medium text-xs px-2 py-0.5">
                                      New Assignment
                                    </Badge>
                                    <Badge variant="outline" className="text-xs px-2 py-0.5 border-muted-foreground/30">
                                      {booking.bookingType === 'hourly' ? 'Hourly' : 'Transfer'}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400" data-testid={`new-amount-${booking.id}`}>
                                      {booking.driverPayment ? `$${booking.driverPayment}` : "Not set"}
                                    </span>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setSelectedBookingForDetails(booking)}
                                      className="h-7 px-2 text-xs"
                                      data-testid={`button-view-details-${booking.id}`}
                                    >
                                      <Eye className="w-3 h-3 mr-1" />
                                      Details
                                    </Button>
                                  </div>
                                </div>

                                <div className="flex items-center gap-4 text-sm mb-3">
                                  {booking.passengerName && (
                                    <div className="flex items-center gap-1.5">
                                      <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                      <span className="font-medium text-foreground" data-testid={`passenger-name-${booking.id}`}>
                                        {booking.passengerName}
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span data-testid={`new-time-${booking.id}`}>
                                      {new Date(booking.scheduledDateTime).toLocaleString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: 'numeric',
                                        minute: '2-digit'
                                      })}
                                    </span>
                                  </div>
                                </div>

                                <div className="bg-blue-50 dark:bg-blue-900/40 rounded-lg p-2.5 mb-3">
                                  <div className="flex items-start gap-2">
                                    <div className="flex flex-col items-center gap-0.5 pt-1">
                                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                      <div className="w-0.5 h-6 bg-border" />
                                      <div className="w-2 h-2 rounded-full bg-red-500" />
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-1">
                                      <p className="text-xs text-blue-900 dark:text-blue-100 truncate" data-testid={`new-pickup-${booking.id}`}>
                                        {booking.pickupAddress}
                                      </p>
                                      {booking.destinationAddress && (
                                        <p className="text-xs text-blue-700 dark:text-blue-300 truncate" data-testid={`new-destination-${booking.id}`}>
                                          {booking.destinationAddress}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => handleAcceptRide(booking.id)}
                                    disabled={acceptBookingMutation.isPending || declineBookingMutation.isPending}
                                    className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-semibold h-10 rounded-lg text-sm"
                                    data-testid={`button-accept-${booking.id}`}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-1.5" />
                                    {acceptBookingMutation.isPending ? "Accepting..." : "Accept Job"}
                                  </Button>
                                  <Button
                                    onClick={() => handleDeclineRide(booking.id)}
                                    disabled={acceptBookingMutation.isPending || declineBookingMutation.isPending}
                                    variant="outline"
                                    className="flex-1 h-10 rounded-lg text-sm border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                                    data-testid={`button-decline-${booking.id}`}
                                  >
                                    <AlertCircle className="w-4 h-4 mr-1.5" />
                                    {declineBookingMutation.isPending ? "..." : "Decline"}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center p-12" data-testid="no-new-jobs">
                          <Briefcase className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                          <p className="text-muted-foreground text-lg font-medium">No new jobs</p>
                          <p className="text-muted-foreground text-sm mt-2">New job assignments will appear here when dispatched to you</p>
                        </div>
                      )}
                    </>
                  )}

                  {/* Accepted Jobs Tab */}
                  {jobListTab === "accepted" && (
                    <>
                      {acceptedJobs.length > 0 ? (
                        <div className="space-y-4">
                          {acceptedJobs.map((booking) => (
                            <div
                              key={booking.id}
                              className="relative group"
                              data-testid={`accepted-job-${booking.id}`}
                            >
                              <div className="bg-card rounded-xl p-4 border border-purple-200 dark:border-purple-800 shadow-sm hover:shadow-md transition-all duration-200">
                                <div className="flex items-center justify-between gap-2 mb-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-semibold text-foreground">#{booking.id.slice(0, 8)}</span>
                                    <Badge
                                      variant="default"
                                      className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium text-xs px-2 py-0.5"
                                      data-testid={`accepted-status-${booking.id}`}
                                    >
                                      {booking.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs px-2 py-0.5 border-muted-foreground/30">
                                      {booking.bookingType === 'hourly' ? 'Hourly' : 'Transfer'}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg font-bold text-purple-600 dark:text-purple-400" data-testid={`accepted-amount-${booking.id}`}>
                                      {booking.driverPayment ? `$${booking.driverPayment}` : "Not set"}
                                    </span>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setSelectedBookingForDetails(booking)}
                                      className="h-7 px-2 text-xs"
                                      data-testid={`button-view-details-${booking.id}`}
                                    >
                                      <Eye className="w-3 h-3 mr-1" />
                                      Details
                                    </Button>
                                  </div>
                                </div>

                                <div className="flex items-center gap-4 text-sm mb-3">
                                  {booking.passengerName && (
                                    <div className="flex items-center gap-1.5">
                                      <User className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                                      <span className="font-medium text-foreground" data-testid={`passenger-name-${booking.id}`}>
                                        {booking.passengerName}
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span data-testid={`accepted-time-${booking.id}`}>
                                      {new Date(booking.scheduledDateTime).toLocaleString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: 'numeric',
                                        minute: '2-digit'
                                      })}
                                    </span>
                                  </div>
                                </div>

                                <div className="bg-purple-50 dark:bg-purple-900/40 rounded-lg p-2.5 mb-3">
                                  <div className="flex items-start gap-2">
                                    <div className="flex flex-col items-center gap-0.5 pt-1">
                                      <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                                      <div className="w-0.5 flex-1 min-h-[16px] bg-border" />
                                      <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-3">
                                      <p className="text-xs text-purple-900 dark:text-purple-100 leading-relaxed" data-testid={`accepted-pickup-${booking.id}`}>
                                        {booking.pickupAddress}
                                      </p>
                                      {booking.destinationAddress && (
                                        <p className="text-xs text-purple-700 dark:text-purple-300 leading-relaxed" data-testid={`accepted-destination-${booking.id}`}>
                                          {booking.destinationAddress}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {booking.status === "in_progress" && (
                                  <Button
                                    onClick={() => handleCompleteRide(booking.id)}
                                    disabled={updateBookingMutation.isPending}
                                    className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-semibold h-9 rounded-lg text-sm"
                                    data-testid={`button-complete-${booking.id}`}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-1.5" />
                                    Complete Ride
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center p-12" data-testid="no-accepted-jobs">
                          <CheckCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                          <p className="text-muted-foreground text-lg font-medium">No accepted jobs</p>
                          <p className="text-muted-foreground text-sm mt-2">Jobs you've accepted will appear here</p>
                        </div>
                      )}
                    </>
                  )}

                  {/* Completed Jobs Tab */}
                  {jobListTab === "completed" && (
                    <>
                      {completedJobs.length > 0 ? (
                        <div className="space-y-4">
                          {completedJobs.map((booking) => (
                            <div
                              key={booking.id}
                              className="bg-card rounded-xl p-4 border border-emerald-200 dark:border-emerald-800 shadow-sm"
                              data-testid={`completed-job-${booking.id}`}
                            >
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-semibold text-foreground">#{booking.id.slice(0, 8)}</span>
                                  <Badge className="bg-emerald-600 text-white font-medium text-xs px-2 py-0.5">
                                    Completed
                                  </Badge>
                                  <Badge variant="outline" className="text-xs px-2 py-0.5 border-muted-foreground/30">
                                    {booking.bookingType === 'hourly' ? 'Hourly' : 'Transfer'}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                                    {booking.driverPayment ? `$${booking.driverPayment}` : "Not set"}
                                  </span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedBookingForDetails(booking)}
                                    className="h-7 px-2 text-xs"
                                  >
                                    <Eye className="w-3 h-3 mr-1" />
                                    Details
                                  </Button>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 text-sm mb-2">
                                {booking.passengerName && (
                                  <div className="flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                    <span className="font-medium text-foreground">{booking.passengerName}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>
                                    {new Date(booking.scheduledDateTime).toLocaleString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: 'numeric',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                              </div>
                              <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-lg p-2.5">
                                <p className="text-xs text-foreground truncate">{booking.pickupAddress}</p>
                                {booking.destinationAddress && (
                                  <p className="text-xs text-muted-foreground truncate mt-1">{booking.destinationAddress}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center p-12" data-testid="no-completed-jobs">
                          <CheckCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                          <p className="text-muted-foreground text-lg font-medium">No completed jobs</p>
                          <p className="text-muted-foreground text-sm mt-2">Your completed rides will appear here</p>
                        </div>
                      )}
                    </>
                  )}

                  {/* Cancelled Jobs Tab */}
                  {jobListTab === "cancelled" && (
                    <>
                      {cancelledJobs.length > 0 ? (
                        <div className="space-y-4">
                          {cancelledJobs.map((booking) => (
                            <div
                              key={booking.id}
                              className="bg-card rounded-xl p-4 border border-red-200 dark:border-red-800 shadow-sm opacity-75"
                              data-testid={`cancelled-job-${booking.id}`}
                            >
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-semibold text-foreground">#{booking.id.slice(0, 8)}</span>
                                  <Badge className="bg-red-600 text-white font-medium text-xs px-2 py-0.5">
                                    Cancelled
                                  </Badge>
                                  <Badge variant="outline" className="text-xs px-2 py-0.5 border-muted-foreground/30">
                                    {booking.bookingType === 'hourly' ? 'Hourly' : 'Transfer'}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-lg font-bold text-muted-foreground line-through">
                                    {booking.driverPayment ? `$${booking.driverPayment}` : "Not set"}
                                  </span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedBookingForDetails(booking)}
                                    className="h-7 px-2 text-xs"
                                  >
                                    <Eye className="w-3 h-3 mr-1" />
                                    Details
                                  </Button>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 text-sm mb-2">
                                {booking.passengerName && (
                                  <div className="flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                                    <span className="font-medium text-foreground">{booking.passengerName}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>
                                    {new Date(booking.scheduledDateTime).toLocaleString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: 'numeric',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                              </div>
                              {(booking as any).cancelReason && (
                                <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-2.5 mb-2">
                                  <p className="text-xs text-red-600 dark:text-red-400">
                                    <span className="font-medium">Reason:</span> {(booking as any).cancelReason}
                                  </p>
                                </div>
                              )}
                              <div className="bg-muted/50 rounded-lg p-2.5">
                                <p className="text-xs text-foreground truncate">{booking.pickupAddress}</p>
                                {booking.destinationAddress && (
                                  <p className="text-xs text-muted-foreground truncate mt-1">{booking.destinationAddress}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center p-12" data-testid="no-cancelled-jobs">
                          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                          <p className="text-muted-foreground text-lg font-medium">No cancelled jobs</p>
                          <p className="text-muted-foreground text-sm mt-2">Cancelled rides will appear here</p>
                        </div>
                      )}
                    </>
                  )}

                  {/* Declined Jobs Tab */}
                  {jobListTab === "declined" && (
                    <>
                      {(declinedBookings?.length || 0) > 0 ? (
                        <div className="space-y-4">
                          {declinedBookings?.map((declined) => (
                            <div
                              key={declined.declineId}
                              className="bg-card rounded-xl p-4 border border-amber-200 dark:border-amber-800 shadow-sm"
                              data-testid={`declined-job-${declined.bookingId}`}
                            >
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-semibold text-foreground">#{declined.bookingId.slice(0, 8)}</span>
                                  <Badge className="bg-amber-600 text-white font-medium text-xs px-2 py-0.5">
                                    Declined
                                  </Badge>
                                  <Badge variant="outline" className="text-xs px-2 py-0.5 border-muted-foreground/30">
                                    {declined.bookingType === 'hourly' ? 'Hourly' : 'Transfer'}
                                  </Badge>
                                </div>
                                <span className="text-lg font-bold text-muted-foreground line-through">
                                  {declined.driverPayment ? `$${declined.driverPayment}` : "Not set"}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-sm mb-2">
                                {declined.passengerName && (
                                  <div className="flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                    <span className="font-medium text-foreground">{declined.passengerName}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>
                                    {new Date(declined.scheduledDateTime).toLocaleString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: 'numeric',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                              </div>
                              <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-2.5 mb-2">
                                <p className="text-xs text-amber-700 dark:text-amber-400">
                                  <span className="font-medium">Reason: </span>
                                  {declined.reasonDisplay}
                                </p>
                                {declined.additionalNotes && (
                                  <p className="text-xs text-amber-600 dark:text-amber-500 mt-1 italic">
                                    "{declined.additionalNotes}"
                                  </p>
                                )}
                                <p className="text-xs text-amber-500 dark:text-amber-600 mt-1">
                                  Declined: {new Date(declined.declinedAt).toLocaleString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: 'numeric',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                              <div className="bg-muted/50 rounded-lg p-2.5">
                                <p className="text-xs text-foreground truncate">{declined.pickupAddress}</p>
                                {declined.destinationAddress && (
                                  <p className="text-xs text-muted-foreground truncate mt-1">{declined.destinationAddress}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center p-12" data-testid="no-declined-jobs">
                          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                          <p className="text-muted-foreground text-lg font-medium">No declined jobs</p>
                          <p className="text-muted-foreground text-sm mt-2">Jobs you've declined will appear here</p>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* DOCUMENTS TAB */}
        {activeTab === "documents" && (
          <>
            {/* Document Preview Modal */}
            <Dialog open={!!selectedDocumentPreview} onOpenChange={(open) => !open && setSelectedDocumentPreview(null)}>
              <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <FileText className={`w-5 h-5 ${selectedDocumentPreview ? getDocumentTypeColor(selectedDocumentPreview.documentType) : 'text-red-600'}`} />
                    {selectedDocumentPreview?.documentType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </DialogTitle>
                </DialogHeader>
                {selectedDocumentPreview && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(selectedDocumentPreview.status)}
                      <span className="text-xs text-muted-foreground">
                        Uploaded {new Date(selectedDocumentPreview.uploadedAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="relative bg-muted/30 rounded-xl overflow-hidden border border-border">
                      {selectedDocumentPreview.documentUrl?.toLowerCase().endsWith('.pdf') ? (
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                          <FileText className="w-20 h-20 mb-4" />
                          <p className="text-base font-medium">PDF Document</p>
                          <p className="text-sm mt-1">Click download to view</p>
                        </div>
                      ) : (
                        <img
                          src={selectedDocumentPreview.documentUrl?.startsWith('http') || selectedDocumentPreview.documentUrl?.startsWith('/') 
                            ? selectedDocumentPreview.documentUrl 
                            : `/${selectedDocumentPreview.documentUrl}`}
                          alt={selectedDocumentPreview.documentType}
                          className="w-full h-auto max-h-[50vh] object-contain"
                          data-testid="document-preview-image"
                        />
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm bg-muted/20 rounded-lg p-3">
                      {selectedDocumentPreview.expirationDate && (
                        <div>
                          <span className="text-muted-foreground text-xs">Expires</span>
                          <p className="font-medium">{new Date(selectedDocumentPreview.expirationDate).toLocaleDateString()}</p>
                        </div>
                      )}
                      {selectedDocumentPreview.vehiclePlate && (
                        <div>
                          <span className="text-muted-foreground text-xs">Vehicle Plate</span>
                          <p className="font-medium">{selectedDocumentPreview.vehiclePlate}</p>
                        </div>
                      )}
                      {selectedDocumentPreview.whatsappNumber && (
                        <div>
                          <span className="text-muted-foreground text-xs">WhatsApp</span>
                          <p className="font-medium">{selectedDocumentPreview.whatsappNumber}</p>
                        </div>
                      )}
                    </div>
                    
                    {selectedDocumentPreview.rejectionReason && (
                      <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-sm text-red-700 dark:text-red-300">
                          <strong>Rejection Reason:</strong> {selectedDocumentPreview.rejectionReason}
                        </p>
                      </div>
                    )}
                    
                    <Button
                      onClick={() => {
                        if (selectedDocumentPreview?.documentUrl) {
                          const url = selectedDocumentPreview.documentUrl.startsWith('http') || selectedDocumentPreview.documentUrl.startsWith('/') 
                            ? selectedDocumentPreview.documentUrl 
                            : `/${selectedDocumentPreview.documentUrl}`;
                          const link = document.createElement('a');
                          link.href = url;
                          link.download = `${selectedDocumentPreview.documentType}_${selectedDocumentPreview.id}`;
                          link.target = '_blank';
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }
                      }}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white h-11 font-semibold rounded-lg"
                      data-testid="button-download-document"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Document
                    </Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {/* Documents Grid */}
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {/* Driver License */}
              <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow" data-testid="card-driver-license">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-950/40 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-red-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm text-foreground">Driver License</h3>
                          {renderSaveStatus('driver_license')}
                        </div>
                        <p className="text-[10px] text-muted-foreground">Required</p>
                      </div>
                    </div>
                    {getDocumentByType('driver_license') ? getStatusBadge(getDocumentByType('driver_license')!.status) : (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">Missing</Badge>
                    )}
                  </div>
                  
                  {getDocumentByType('driver_license') && (
                    <div className="flex items-center justify-between text-xs mb-3 py-2 px-2.5 bg-muted/50 rounded-lg">
                      <div className="space-y-0.5">
                        {driver?.licenseNumber && <p className="font-mono text-foreground">{driver.licenseNumber}</p>}
                        {getDocumentByType('driver_license')!.expirationDate && (
                          <p className="text-muted-foreground">Exp: {new Date(getDocumentByType('driver_license')!.expirationDate!).toLocaleDateString()}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedDocumentPreview(getDocumentByType('driver_license')!)}
                        className="h-7 px-2 text-xs"
                        data-testid="button-preview-driver-license"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="text"
                        placeholder="License #"
                        value={formData.driverLicense.licenseNumber}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFormData(prev => ({ ...prev, driverLicense: { ...prev.driverLicense, licenseNumber: value } }));
                          debouncedSave('driver_license', { licenseNumber: value, expirationDate: formData.driverLicense.expirationDate });
                        }}
                        className="h-8 text-xs font-mono"
                        data-testid="input-driver-license-number"
                      />
                      <Input
                        type="date"
                        value={formData.driverLicense.expirationDate}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFormData(prev => ({ ...prev, driverLicense: { ...prev.driverLicense, expirationDate: value } }));
                          debouncedSave('driver_license', { licenseNumber: formData.driverLicense.licenseNumber, expirationDate: value });
                        }}
                        className="h-8 text-xs"
                        data-testid="input-driver-license-expiry"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="file"
                        accept="image/*,application/pdf"
                        capture="environment"
                        onChange={(e) => setFormData(prev => ({ ...prev, driverLicense: { ...prev.driverLicense, file: e.target.files?.[0] || null } }))}
                        className="h-8 text-xs flex-1"
                        data-testid="input-driver-license-file"
                      />
                      <Button
                        onClick={() => handleUpload('driver_license')}
                        disabled={!formData.driverLicense.file || uploading === 'driver_license'}
                        size="sm"
                        className="h-8 px-3 bg-red-600 hover:bg-red-700 text-white text-xs"
                        data-testid="button-upload-driver-license"
                      >
                        <Upload className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Limo License */}
              <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow" data-testid="card-limo-license">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm text-foreground">Limo License</h3>
                          {renderSaveStatus('limo_license')}
                        </div>
                        <p className="text-[10px] text-muted-foreground">Required</p>
                      </div>
                    </div>
                    {getDocumentByType('limo_license') ? getStatusBadge(getDocumentByType('limo_license')!.status) : (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">Missing</Badge>
                    )}
                  </div>
                  
                  {getDocumentByType('limo_license') && (
                    <div className="flex items-center justify-between text-xs mb-3 py-2 px-2.5 bg-muted/50 rounded-lg">
                      <div className="space-y-0.5">
                        {driver?.limoLicenseNumber && <p className="font-mono text-foreground">{driver.limoLicenseNumber}</p>}
                        {getDocumentByType('limo_license')!.expirationDate && (
                          <p className="text-muted-foreground">Exp: {new Date(getDocumentByType('limo_license')!.expirationDate!).toLocaleDateString()}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedDocumentPreview(getDocumentByType('limo_license')!)}
                        className="h-7 px-2 text-xs"
                        data-testid="button-preview-limo-license"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="text"
                        placeholder="License #"
                        value={formData.limoLicense.licenseNumber}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFormData(prev => ({ ...prev, limoLicense: { ...prev.limoLicense, licenseNumber: value } }));
                          debouncedSave('limo_license', { licenseNumber: value, expirationDate: formData.limoLicense.expirationDate });
                        }}
                        className="h-8 text-xs font-mono"
                        data-testid="input-limo-license-number"
                      />
                      <Input
                        type="date"
                        value={formData.limoLicense.expirationDate}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFormData(prev => ({ ...prev, limoLicense: { ...prev.limoLicense, expirationDate: value } }));
                          debouncedSave('limo_license', { licenseNumber: formData.limoLicense.licenseNumber, expirationDate: value });
                        }}
                        className="h-8 text-xs"
                        data-testid="input-limo-license-expiry"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="file"
                        accept="image/*,application/pdf"
                        capture="environment"
                        onChange={(e) => setFormData(prev => ({ ...prev, limoLicense: { ...prev.limoLicense, file: e.target.files?.[0] || null } }))}
                        className="h-8 text-xs flex-1"
                        data-testid="input-limo-license-file"
                      />
                      <Button
                        onClick={() => handleUpload('limo_license')}
                        disabled={!formData.limoLicense.file || uploading === 'limo_license'}
                        size="sm"
                        className="h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs"
                        data-testid="button-upload-limo-license"
                      >
                        <Upload className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Insurance Certificate */}
              <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow" data-testid="card-insurance-certificate">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm text-foreground">Insurance</h3>
                          {renderSaveStatus('insurance_certificate')}
                        </div>
                        <p className="text-[10px] text-muted-foreground">Required</p>
                      </div>
                    </div>
                    {getDocumentByType('insurance_certificate') ? getStatusBadge(getDocumentByType('insurance_certificate')!.status) : (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">Missing</Badge>
                    )}
                  </div>
                  
                  {getDocumentByType('insurance_certificate') && (
                    <div className="flex items-center justify-between text-xs mb-3 py-2 px-2.5 bg-muted/50 rounded-lg">
                      <div className="space-y-0.5">
                        {getDocumentByType('insurance_certificate')!.expirationDate && (
                          <p className="text-muted-foreground">Exp: {new Date(getDocumentByType('insurance_certificate')!.expirationDate!).toLocaleDateString()}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedDocumentPreview(getDocumentByType('insurance_certificate')!)}
                        className="h-7 px-2 text-xs"
                        data-testid="button-preview-insurance-certificate"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Input
                      type="date"
                      value={formData.insuranceCertificate.expirationDate}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData(prev => ({ ...prev, insuranceCertificate: { ...prev.insuranceCertificate, expirationDate: value } }));
                        debouncedSave('insurance_certificate', { expirationDate: value });
                      }}
                      className="h-8 text-xs"
                      data-testid="input-insurance-certificate-expiry"
                    />
                    <div className="flex gap-2">
                      <Input
                        type="file"
                        accept="image/*,application/pdf"
                        capture="environment"
                        onChange={(e) => setFormData(prev => ({ ...prev, insuranceCertificate: { ...prev.insuranceCertificate, file: e.target.files?.[0] || null } }))}
                        className="h-8 text-xs flex-1"
                        data-testid="input-insurance-certificate-file"
                      />
                      <Button
                        onClick={() => handleUpload('insurance_certificate')}
                        disabled={!formData.insuranceCertificate.file || uploading === 'insurance_certificate'}
                        size="sm"
                        className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                        data-testid="button-upload-insurance-certificate"
                      >
                        <Upload className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Vehicle Image */}
              <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow" data-testid="card-vehicle-image">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/40 flex items-center justify-center">
                        <Car className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm text-foreground">Vehicle Photo</h3>
                          {renderSaveStatus('vehicle_image')}
                        </div>
                        <p className="text-[10px] text-muted-foreground">Optional</p>
                      </div>
                    </div>
                    {getDocumentByType('vehicle_image') ? getStatusBadge(getDocumentByType('vehicle_image')!.status) : (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">Not uploaded</Badge>
                    )}
                  </div>
                  
                  {getDocumentByType('vehicle_image') && (
                    <div className="flex items-center justify-between text-xs mb-3 py-2 px-2.5 bg-muted/50 rounded-lg">
                      <div className="space-y-0.5">
                        {getDocumentByType('vehicle_image')!.vehiclePlate && (
                          <p className="font-mono text-foreground">{getDocumentByType('vehicle_image')!.vehiclePlate}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedDocumentPreview(getDocumentByType('vehicle_image')!)}
                        className="h-7 px-2 text-xs"
                        data-testid="button-preview-vehicle-image"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Input
                      type="text"
                      placeholder="Plate number"
                      value={formData.vehicleImage.vehiclePlate}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData(prev => ({ ...prev, vehicleImage: { ...prev.vehicleImage, vehiclePlate: value } }));
                        debouncedSave('vehicle_image', { vehiclePlate: value });
                      }}
                      className="h-8 text-xs font-mono"
                      data-testid="input-vehicle-plate"
                    />
                    <div className="flex gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => setFormData(prev => ({ ...prev, vehicleImage: { ...prev.vehicleImage, file: e.target.files?.[0] || null } }))}
                        className="h-8 text-xs flex-1"
                        data-testid="input-vehicle-image-file"
                      />
                      <Button
                        onClick={() => handleUpload('vehicle_image')}
                        disabled={!formData.vehicleImage.file || uploading === 'vehicle_image'}
                        size="sm"
                        className="h-8 px-3 bg-purple-600 hover:bg-purple-700 text-white text-xs"
                        data-testid="button-upload-vehicle-image"
                      >
                        <Upload className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Profile Photo */}
              <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow" data-testid="card-profile-photo">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center overflow-hidden">
                        {getDocumentByType('profile_photo')?.status === 'approved' && getDocumentByType('profile_photo')?.documentUrl ? (
                          <img
                            src={getDocumentByType('profile_photo')!.documentUrl.startsWith('/') 
                              ? getDocumentByType('profile_photo')!.documentUrl 
                              : `/${getDocumentByType('profile_photo')!.documentUrl}`}
                            alt="Profile"
                            className="w-full h-full object-cover"
                            data-testid="img-profile-preview"
                          />
                        ) : (
                          <Camera className="w-4 h-4 text-amber-600" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm text-foreground">Profile Photo</h3>
                          {renderSaveStatus('profile_photo')}
                        </div>
                        <p className="text-[10px] text-muted-foreground">Optional</p>
                      </div>
                    </div>
                    {getDocumentByType('profile_photo') ? getStatusBadge(getDocumentByType('profile_photo')!.status) : (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">Not uploaded</Badge>
                    )}
                  </div>
                  
                  {getDocumentByType('profile_photo') && (
                    <div className="flex items-center justify-between text-xs mb-3 py-2 px-2.5 bg-muted/50 rounded-lg">
                      <div className="space-y-0.5">
                        {getDocumentByType('profile_photo')!.whatsappNumber && (
                          <p className="text-muted-foreground">{getDocumentByType('profile_photo')!.whatsappNumber}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedDocumentPreview(getDocumentByType('profile_photo')!)}
                        className="h-7 px-2 text-xs"
                        data-testid="button-preview-profile-photo"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Input
                      type="tel"
                      placeholder="WhatsApp (optional)"
                      value={formData.whatsappNumber}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData(prev => ({ ...prev, whatsappNumber: value }));
                        debouncedSave('profile_photo', { whatsappNumber: value });
                      }}
                      className="h-8 text-xs"
                      data-testid="input-whatsapp-number"
                    />
                    <div className="flex gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        capture="user"
                        onChange={(e) => setFormData(prev => ({ ...prev, profilePhoto: { file: e.target.files?.[0] || null } }))}
                        className="h-8 text-xs flex-1"
                        data-testid="input-profile-photo-file"
                      />
                      <Button
                        onClick={() => handleUpload('profile_photo')}
                        disabled={!formData.profilePhoto.file || uploading === 'profile_photo'}
                        size="sm"
                        className="h-8 px-3 bg-amber-600 hover:bg-amber-700 text-white text-xs"
                        data-testid="button-upload-profile-photo"
                      >
                        <Upload className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}


        {/* SETTINGS TAB */}
        {activeTab === "settings" && (
          <div className="space-y-6" data-testid="menu-account">
            {/* Profile Header Card */}
            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-0 shadow-xl overflow-hidden">
              <CardContent className="p-0">
                <div className="relative">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.02)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px]" />
                  
                  <div className="relative p-6 md:p-8">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                      {/* Profile Avatar */}
                      <div className="relative">
                        <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg ring-4 ring-white/10">
                          {user?.profileImageUrl ? (
                            <img 
                              src={user.profileImageUrl.startsWith('http') || user.profileImageUrl.startsWith('/') 
                                ? user.profileImageUrl 
                                : `/${user.profileImageUrl}`}
                              alt="Profile"
                              className="w-full h-full object-cover rounded-2xl"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <User className={`w-12 h-12 text-white ${user?.profileImageUrl ? 'hidden' : ''}`} />
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg">
                          <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      
                      {/* Profile Info */}
                      <div className="flex-1 text-center md:text-left">
                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">
                          {user?.firstName} {user?.lastName}
                        </h2>
                        <p className="text-slate-400 mb-3">{user?.email}</p>
                        <div className="flex flex-wrap justify-center md:justify-start gap-3">
                          <Badge className="bg-white/10 text-white border-0 px-3 py-1">
                            <Star className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                            {driver?.rating || "0"}/5 Rating
                          </Badge>
                          <Badge className="bg-white/10 text-white border-0 px-3 py-1">
                            <Car className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
                            {driver?.totalRides || 0} Rides
                          </Badge>
                          <Badge className={`border-0 px-3 py-1 ${user?.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                            {user?.isActive ? 'Active Driver' : 'Pending Activation'}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Quick Stats */}
                      <div className="hidden lg:flex gap-4">
                        <div className="text-center px-6 py-3 bg-white/5 rounded-xl">
                          <p className="text-2xl font-bold text-white">${earnings?.month?.toFixed(0) || '0'}</p>
                          <p className="text-xs text-slate-400">This Month</p>
                        </div>
                        <div className="text-center px-6 py-3 bg-white/5 rounded-xl">
                          <p className="text-2xl font-bold text-white">${earnings?.allTime?.toFixed(0) || '0'}</p>
                          <p className="text-xs text-slate-400">All Time</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Two Column Layout */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Account Information */}
              <Card className="bg-card border-border shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-md">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    Account Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">#</span>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Driver ID</p>
                          <p className="text-sm font-mono font-medium text-foreground" data-testid="setting-driver-id" title={driver?.id || ""}>
                            {driver?.id || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                          <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Full Name</p>
                          <p className="text-sm font-medium text-foreground" data-testid="setting-name">
                            {`${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                          <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400">@</span>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Email Address</p>
                          <p className="text-sm font-medium text-foreground" data-testid="setting-email">
                            {user?.email || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                            <FileText className="w-4 h-4 text-red-600 dark:text-red-400" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Driver License #</p>
                            <p className="text-sm font-mono font-medium text-foreground" data-testid="setting-driver-license">
                              {driver?.licenseNumber || "Not provided"}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Limo License #</p>
                            <p className="text-sm font-mono font-medium text-foreground" data-testid="setting-limo-license">
                              {driver?.limoLicenseNumber || "Not provided"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                          <Star className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Current Rating</p>
                          <p className="text-sm font-medium text-foreground" data-testid="setting-rating">
                            {driver?.rating || "0"} / 5.0
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                          <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Total Rides</p>
                          <p className="text-sm font-medium text-foreground" data-testid="setting-total-rides">
                            {driver?.totalRides || 0} completed
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Vehicle Information */}
              <Card className="bg-card border-border shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center shadow-md">
                      <Car className="w-5 h-5 text-white" />
                    </div>
                    Vehicle Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                          <Car className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <Label className="text-sm font-medium">Vehicle Plate Number</Label>
                      </div>
                      {!editingVehiclePlate ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingVehiclePlate(true)}
                          className="h-8 px-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          data-testid="button-edit-vehicle-plate"
                        >
                          <Pencil className="w-3.5 h-3.5 mr-1.5" />
                          Edit
                        </Button>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingVehiclePlate(false);
                              setVehiclePlateValue(driver?.vehiclePlate || "");
                            }}
                            className="h-8 px-3"
                            data-testid="button-cancel-vehicle-plate"
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => updateVehiclePlateMutation.mutate(vehiclePlateValue)}
                            disabled={updateVehiclePlateMutation.isPending}
                            className="h-8 px-4 bg-emerald-600 hover:bg-emerald-700"
                            data-testid="button-save-vehicle-plate"
                          >
                            {updateVehiclePlateMutation.isPending ? "Saving..." : "Save"}
                          </Button>
                        </div>
                      )}
                    </div>
                    {editingVehiclePlate ? (
                      <Input
                        id="vehicle-plate"
                        value={vehiclePlateValue}
                        onChange={(e) => setVehiclePlateValue(e.target.value.toUpperCase())}
                        placeholder="Enter plate (e.g., ABC1234)"
                        className="font-mono text-lg tracking-wider bg-background"
                        data-testid="input-vehicle-plate"
                      />
                    ) : (
                      <div className="flex items-center gap-3 p-3 bg-background rounded-lg border border-border">
                        <span className="text-lg font-mono font-bold tracking-wider text-foreground" data-testid="text-vehicle-plate">
                          {driver?.vehiclePlate || "Not Set"}
                        </span>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Shared with passengers when assigned to their booking
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Driver Credentials */}
            <Card className="bg-card border-border shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center shadow-md">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    Driver Credentials
                  </CardTitle>
                  {!editingCredentials ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingCredentials(true)}
                      className="h-9"
                      data-testid="button-edit-credentials"
                    >
                      <Pencil className="w-3.5 h-3.5 mr-1.5" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingCredentials(false);
                          setCredentialsValue(driver?.driverCredentials || "");
                        }}
                        data-testid="button-cancel-credentials"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => updateCredentialsMutation.mutate(credentialsValue)}
                        disabled={updateCredentialsMutation.isPending}
                        className="bg-emerald-600 hover:bg-emerald-700"
                        data-testid="button-save-credentials"
                      >
                        {updateCredentialsMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {editingCredentials ? (
                  <textarea
                    id="credentials"
                    className="w-full min-h-[120px] p-4 border border-border bg-background rounded-xl text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={credentialsValue}
                    onChange={(e) => setCredentialsValue(e.target.value)}
                    placeholder="Enter your credentials (e.g., CDL License #, TLC License #, certifications, years of experience, languages spoken, etc.)"
                    data-testid="input-credentials"
                  />
                ) : (
                  <div className="p-4 bg-muted/50 rounded-xl min-h-[80px]">
                    <p className="text-sm text-foreground whitespace-pre-wrap" data-testid="text-credentials">
                      {driver?.driverCredentials || (
                        <span className="text-muted-foreground italic">
                          No credentials added yet. Click Edit to add your professional qualifications.
                        </span>
                      )}
                    </p>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" />
                  These credentials are shared with passengers when you're assigned to their booking
                </p>
              </CardContent>
            </Card>

            {/* Tax Information Section */}
            <DriverTaxInfoSection />

            {/* Quick Actions */}
            <Card className="bg-gradient-to-r from-emerald-600 to-teal-600 border-0 shadow-xl overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4 text-white">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                      <DollarSign className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">View Your Earnings</h3>
                      <p className="text-emerald-100">Access detailed earnings reports and download 1099 forms</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => setLocation('/driver/earnings')}
                    size="lg"
                    className="bg-white text-emerald-700 hover:bg-emerald-50 font-semibold px-6 shadow-lg"
                  >
                    <DollarSign className="w-5 h-5 mr-2" />
                    View Earnings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Booking Details Dialog */}
      <Dialog open={!!selectedBookingForDetails} onOpenChange={(open) => !open && setSelectedBookingForDetails(null)}>
        <DialogContent className="max-w-md bg-background border-border" data-testid="dialog-booking-details">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Briefcase className="w-5 h-5 text-red-600" />
              Job Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedBookingForDetails && (
            <div className="space-y-4 py-2">
              {/* Booking ID and Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Booking ID</span>
                <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded">
                  #{selectedBookingForDetails.id.slice(0, 8)}
                </code>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant="secondary" className="capitalize">
                  {selectedBookingForDetails.status.replace(/_/g, ' ')}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Type</span>
                <span className="text-sm text-foreground font-medium">
                  {selectedBookingForDetails.bookingType === 'hourly' ? 'Hourly Service' : 'Transfer'}
                </span>
              </div>

              {/* Schedule */}
              <div className="border-t border-border pt-3">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-foreground">Schedule</span>
                </div>
                <p className="text-sm text-muted-foreground pl-6">
                  {new Date(selectedBookingForDetails.scheduledDateTime).toLocaleString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                </p>
              </div>

              {/* Route */}
              <div className="border-t border-border pt-3">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span className="font-medium text-foreground">Route</span>
                </div>
                <div className="pl-6 space-y-2">
                  <div>
                    <span className="text-xs text-muted-foreground uppercase">Pickup</span>
                    <p className="text-sm text-foreground">{selectedBookingForDetails.pickupAddress}</p>
                  </div>
                  {selectedBookingForDetails.destinationAddress && (
                    <div>
                      <span className="text-xs text-muted-foreground uppercase">Destination</span>
                      <p className="text-sm text-foreground">{selectedBookingForDetails.destinationAddress}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Passenger Info */}
              <div className="border-t border-border pt-3">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-purple-600" />
                  <span className="font-medium text-foreground">Passenger</span>
                </div>
                <div className="pl-6 space-y-1">
                  {selectedBookingForDetails.passengerName && (
                    <p className="text-sm text-foreground">{selectedBookingForDetails.passengerName}</p>
                  )}
                  {selectedBookingForDetails.passengerPhone && (
                    <a 
                      href={`tel:${selectedBookingForDetails.passengerPhone}`}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      {selectedBookingForDetails.passengerPhone}
                    </a>
                  )}
                  {selectedBookingForDetails.passengerEmail && (
                    <p className="text-sm text-muted-foreground">{selectedBookingForDetails.passengerEmail}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {selectedBookingForDetails.passengerCount} passenger{selectedBookingForDetails.passengerCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* Payment */}
              <div className="border-t border-border pt-3">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-foreground">Payment</span>
                </div>
                <div className="pl-6 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Your Payment</span>
                    <span className="text-sm font-bold text-red-600 dark:text-red-400">
                      {selectedBookingForDetails.driverPayment ? `$${selectedBookingForDetails.driverPayment}` : 'Not set'}
                    </span>
                  </div>
                  {selectedBookingForDetails.totalAmount && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Fare</span>
                      <span className="text-sm text-foreground">${selectedBookingForDetails.totalAmount}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Flight Info */}
              {selectedBookingForDetails.flightNumber && (
                <div className="border-t border-border pt-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Plane className="w-4 h-4 text-sky-600" />
                    <span className="font-medium text-foreground">Flight Information</span>
                  </div>
                  <div className="pl-6">
                    <p className="text-sm text-foreground">
                      {selectedBookingForDetails.flightAirline} {selectedBookingForDetails.flightNumber}
                    </p>
                  </div>
                </div>
              )}

              {/* Special Instructions */}
              {selectedBookingForDetails.specialInstructions && (
                <div className="border-t border-border pt-3">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span className="font-medium text-foreground">Special Instructions</span>
                  </div>
                  <p className="pl-6 text-sm text-muted-foreground">
                    {selectedBookingForDetails.specialInstructions}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Decline Reason Dialog */}
      <Dialog open={showDeclineDialog} onOpenChange={(open) => {
        if (!open) {
          setShowDeclineDialog(false);
          setDeclineBookingId(null);
          setSelectedDeclineReason('');
          setDeclineNotes('');
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Decline Job</DialogTitle>
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
                  <RadioGroupItem value={reason.value} id={`decline-${reason.value}`} className="mt-0.5" />
                  <Label htmlFor={`decline-${reason.value}`} className="flex-1 cursor-pointer">
                    <span className="font-medium block text-foreground">{reason.label}</span>
                    <span className="text-sm text-muted-foreground">{reason.description}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>

            {/* Always show notes field for additional comments */}
            <div className="space-y-2">
              <Label htmlFor="decline-notes">Additional Notes (optional)</Label>
              <Textarea
                id="decline-notes"
                placeholder="Provide any additional details..."
                value={declineNotes}
                onChange={(e) => setDeclineNotes(e.target.value)}
                className="resize-none"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeclineDialog(false);
                setDeclineBookingId(null);
                setSelectedDeclineReason('');
                setDeclineNotes('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeclineSubmit}
              disabled={!selectedDeclineReason || declineBookingMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {declineBookingMutation.isPending ? 'Declining...' : 'Confirm Decline'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
