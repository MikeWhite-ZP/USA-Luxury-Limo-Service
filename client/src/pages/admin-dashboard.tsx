import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  TrendingUp,
  Users,
  Car,
  Star,
  Settings,
  MessageSquare,
  DollarSign,
  ArrowRight,
  Key,
  Edit2,
  Trash2,
  Plus,
  Check,
  X,
  Pencil,
  FileText,
  Plane,
  Search,
  Image,
  Mail,
  Eye,
  EyeOff,
  Printer,
  Receipt,
  AlertCircle,
  CheckCircle2,
  Clock,
  Upload,
  FileImage,
} from "lucide-react";
import { AdminNav } from "@/components/AdminNav";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { AdminSMSSettings } from "@/components/admin-sms-settings";
import BrandSettings from "@/components/BrandSettings";
import MediaLibrary from "@/components/MediaLibrary";
import ServiceCMS from "@/components/ServiceCMS";
import { BookingDetailsDialog } from "@/components/BookingDetailsDialog";

interface DashboardStats {
  totalRevenue: string;
  monthlyRevenue: string;
  totalCommission: string;
  monthlyCommission: string;
  activeBookings: number;
  totalDrivers: number;
  activeDrivers: number;
  averageRating: string;
  pendingBookings: number;
  pendingDrivers: number;
  awaitingDriverApproval: number;
  revenueGrowth: string;
  ratingImprovement: string;
}

interface ContactSubmission {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  serviceType?: string;
  message: string;
  status: "new" | "contacted" | "resolved";
  createdAt: string;
}

interface PaymentSystem {
  id: string;
  provider: "stripe" | "paypal" | "square";
  isActive: boolean;
  publicKey: string | null;
  secretKey: string | null;
  webhookSecret: string | null;
  config: any;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: "passenger" | "driver" | "dispatcher" | "admin";
  isActive: boolean;
  payLaterEnabled: boolean;
  cashPaymentEnabled?: boolean;
  discountType?: "percentage" | "fixed" | null;
  discountValue?: string | null;
  createdAt: string;
}

interface DriverDocument {
  id: string;
  driverId: string;
  documentType: "driver_license" | "limo_license" | "profile_photo";
  documentUrl: string;
  expirationDate: string | null;
  status: "pending" | "approved" | "rejected";
  rejectionReason: string | null;
  whatsappNumber: string | null;
  uploadedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  driverInfo?: {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

function AdminEmailSettings({ user }: { user: any }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [adminEmail, setAdminEmail] = useState("");
  const [systemAdminEmail, setSystemAdminEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("admin-email");

  // SMTP Settings state
  const [smtpSettings, setSmtpSettings] = useState({
    host: "",
    port: "587",
    secure: false,
    user: "",
    password: "",
    fromEmail: "",
    fromName: "USA Luxury Limo",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [testEmail, setTestEmail] = useState("");

  // Fetch current admin email setting
  const { data: emailSetting } = useQuery({
    queryKey: ["/api/system-settings", "ADMIN_EMAIL"],
    enabled: !!user && user.role === "admin",
  });

  // Fetch system admin email for reports
  const { data: systemEmailSetting } = useQuery({
    queryKey: ["/api/system-settings", "SYSTEM_ADMIN_EMAIL"],
    enabled: !!user && user.role === "admin",
  });

  // Fetch SMTP settings
  const { data: smtpData, isLoading: smtpLoading } = useQuery<{
    host: string;
    port: string;
    secure: boolean;
    user: string;
    hasPassword: boolean;
    fromEmail: string;
    fromName: string;
  }>({
    queryKey: ["/api/admin/smtp-settings"],
    enabled: !!user && user.role === "admin",
  });

  useEffect(() => {
    if (
      emailSetting &&
      typeof emailSetting === "object" &&
      "value" in emailSetting
    ) {
      setAdminEmail((emailSetting as any).value || "");
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, [emailSetting]);

  useEffect(() => {
    if (
      systemEmailSetting &&
      typeof systemEmailSetting === "object" &&
      "value" in systemEmailSetting
    ) {
      setSystemAdminEmail((systemEmailSetting as any).value || "");
    }
  }, [systemEmailSetting]);

  useEffect(() => {
    if (smtpData) {
      setSmtpSettings({
        host: smtpData.host || "",
        port: smtpData.port || "587",
        secure: smtpData.secure || false,
        user: smtpData.user || "",
        password: "",
        fromEmail: smtpData.fromEmail || "",
        fromName: smtpData.fromName || "USA Luxury Limo",
      });
    }
  }, [smtpData]);

  const updateEmailMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest(
        "PUT",
        "/api/system-settings/ADMIN_EMAIL",
        { value: email },
      );
      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ message: "Failed to update admin email" }));
        throw new Error(error.message || "Failed to update admin email");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Email updated",
        description: "System admin email has been updated successfully.",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/system-settings", "ADMIN_EMAIL"],
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description:
          error.message || "Failed to update admin email. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateSystemAdminEmailMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest(
        "PUT",
        "/api/system-settings/SYSTEM_ADMIN_EMAIL",
        { value: email },
      );
      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ message: "Failed to update system admin email" }));
        throw new Error(error.message || "Failed to update system admin email");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Email updated",
        description: "System admin email for reports has been updated successfully.",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/system-settings", "SYSTEM_ADMIN_EMAIL"],
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description:
          error.message || "Failed to update system admin email. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateSMTPMutation = useMutation({
    mutationFn: async (settings: typeof smtpSettings) => {
      const response = await apiRequest(
        "POST",
        "/api/admin/smtp-settings",
        settings,
      );
      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ message: "Failed to update SMTP settings" }));
        throw new Error(error.message || "Failed to update SMTP settings");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "SMTP Settings Updated",
        description: "Email server settings have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/smtp-settings"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update SMTP settings.",
        variant: "destructive",
      });
    },
  });

  const testSMTPMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest("POST", "/api/admin/smtp-test", {
        testEmail: email,
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to send test email");
      }
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Test Email Sent",
        description: data.message || "Test email sent successfully!",
      });
      setTestEmail("");
    },
    onError: (error: Error) => {
      toast({
        title: "Test Failed",
        description: error.message || "Failed to send test email.",
        variant: "destructive",
      });
    },
  });

  const handleUpdate = () => {
    if (!adminEmail || !adminEmail.includes("@")) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }
    updateEmailMutation.mutate(adminEmail);
  };

  const handleSystemAdminEmailUpdate = () => {
    if (!systemAdminEmail || !systemAdminEmail.includes("@")) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }
    updateSystemAdminEmailMutation.mutate(systemAdminEmail);
  };

  const handleSMTPUpdate = () => {
    if (!smtpSettings.host || !smtpSettings.user || !smtpSettings.fromEmail) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required SMTP fields.",
        variant: "destructive",
      });
      return;
    }
    updateSMTPMutation.mutate(smtpSettings);
  };

  const handleTestEmail = () => {
    if (!testEmail || !testEmail.includes("@")) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address for testing.",
        variant: "destructive",
      });
      return;
    }
    testSMTPMutation.mutate(testEmail);
  };

  return (
    <Card id="settings-section" data-testid="email-settings" className="border-slate-200 shadow-sm hover:shadow-md transition-shadow bg-white">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50/30 border-b border-slate-200">
        <CardTitle className="flex items-center gap-3 text-slate-900">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <span>Email Settings</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full" />
          </div>
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3 bg-slate-100 p-1">
              <TabsTrigger value="admin-email" data-testid="tab-admin-email" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                Contact Email
              </TabsTrigger>
              <TabsTrigger value="system-admin-email" data-testid="tab-system-admin-email" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                Report Email
              </TabsTrigger>
              <TabsTrigger
                value="smtp-settings"
                data-testid="tab-smtp-settings"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                SMTP Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="admin-email" className="space-y-6 mt-6">
              {/* Description */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-slate-700 leading-relaxed">
                  Configure the system-wide admin email address. Contact form
                  submissions will be sent to this email address.
                </p>
              </div>

              {/* Current Value Display */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-blue-600 rounded-full p-2">
                    <Mail className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-sm font-medium text-slate-600">Current Contact Email</p>
                </div>
                <p className="text-lg font-semibold text-blue-700">
                  {emailSetting &&
                  typeof emailSetting === "object" &&
                  "value" in emailSetting
                    ? (emailSetting as any).value
                    : "Not set"}
                </p>
              </div>

              {/* Update Form */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-blue-100 p-1.5 rounded-lg">
                    <Settings className="w-4 h-4 text-blue-700" />
                  </div>
                  <h3 className="font-semibold text-slate-900">Update Contact Email</h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="admin-email" className="text-slate-700 font-medium">
                      Admin Email Address
                    </Label>
                    <Input
                      id="admin-email"
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="admin@example.com"
                      className="mt-2 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                      data-testid="input-admin-email"
                    />
                  </div>

                  <Button
                    onClick={handleUpdate}
                    disabled={updateEmailMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                    data-testid="button-update-email"
                  >
                    {updateEmailMutation.isPending ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Update Contact Email
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Usage Information */}
              <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 border border-slate-200 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-blue-600 p-1.5 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-white" />
                  </div>
                  <h4 className="font-semibold text-slate-900">Usage Information</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 bg-white rounded-lg p-3 border border-slate-200">
                    <div className="bg-blue-100 rounded-full p-1 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      This email receives all contact form submissions from passengers
                    </p>
                  </div>
                  <div className="flex items-start gap-3 bg-white rounded-lg p-3 border border-slate-200">
                    <div className="bg-indigo-100 rounded-full p-1 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-600"></div>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      Make sure the email address is monitored regularly
                    </p>
                  </div>
                  <div className="flex items-start gap-3 bg-white rounded-lg p-3 border border-slate-200">
                    <div className="bg-green-100 rounded-full p-1 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-600"></div>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      You can update this email at any time
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="system-admin-email" className="space-y-6 mt-6">
              {/* Description */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                <p className="text-sm text-slate-700 leading-relaxed">
                  Configure the system admin email address for automated email reports. 
                  All booking activity, driver status changes, and cancellation reports will be sent here.
                </p>
              </div>

              {/* Current Value Display */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-indigo-600 rounded-full p-2">
                    <Mail className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-sm font-medium text-slate-600">Current Report Email</p>
                </div>
                <p className="text-lg font-semibold text-indigo-700">
                  {systemEmailSetting &&
                  typeof systemEmailSetting === "object" &&
                  "value" in systemEmailSetting
                    ? (systemEmailSetting as any).value
                    : "Not set"}
                </p>
              </div>

              {/* Update Form */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-indigo-100 p-1.5 rounded-lg">
                    <Settings className="w-4 h-4 text-indigo-700" />
                  </div>
                  <h3 className="font-semibold text-slate-900">Update Report Email</h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="system-admin-email" className="text-slate-700 font-medium">
                      System Admin Email Address
                    </Label>
                    <Input
                      id="system-admin-email"
                      type="email"
                      value={systemAdminEmail}
                      onChange={(e) => setSystemAdminEmail(e.target.value)}
                      placeholder="reports@example.com"
                      className="mt-2 border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                      data-testid="input-system-admin-email"
                    />
                  </div>

                  <Button
                    onClick={handleSystemAdminEmailUpdate}
                    disabled={updateSystemAdminEmailMutation.isPending}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                    data-testid="button-update-system-admin-email"
                  >
                    {updateSystemAdminEmailMutation.isPending ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Update Report Email
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Report Types */}
              <div className="bg-gradient-to-br from-slate-50 to-indigo-50/30 border border-slate-200 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-indigo-600 p-1.5 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-white" />
                  </div>
                  <h4 className="font-semibold text-slate-900">Report Types</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 bg-white rounded-lg p-3 border border-slate-200">
                    <div className="bg-blue-100 rounded-full p-1 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      New booking confirmations with full details
                    </p>
                  </div>
                  <div className="flex items-start gap-3 bg-white rounded-lg p-3 border border-slate-200">
                    <div className="bg-indigo-100 rounded-full p-1 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-600"></div>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      Cancellation reports (passenger, driver, or automatic)
                    </p>
                  </div>
                  <div className="flex items-start gap-3 bg-white rounded-lg p-3 border border-slate-200">
                    <div className="bg-purple-100 rounded-full p-1 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-600"></div>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      Driver activity updates (acceptance, on the way, arrived, on board)
                    </p>
                  </div>
                  <div className="flex items-start gap-3 bg-white rounded-lg p-3 border border-slate-200">
                    <div className="bg-green-100 rounded-full p-1 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-600"></div>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      All reports include booking ID, passenger info, and timestamps
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="smtp-settings" className="space-y-6 mt-6">
              {/* Description */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="text-sm text-slate-700 leading-relaxed">
                  Configure SMTP server settings to enable email sending
                  functionality throughout the system.
                </p>
              </div>

              {smtpLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin w-6 h-6 border-4 border-green-600 border-t-transparent rounded-full" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* SMTP Configuration Form */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="bg-green-100 p-1.5 rounded-lg">
                        <Settings className="w-4 h-4 text-green-700" />
                      </div>
                      <h3 className="font-semibold text-slate-900">SMTP Server Configuration</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="smtp-host" className="text-slate-700 font-medium">SMTP Host *</Label>
                        <Input
                          id="smtp-host"
                          value={smtpSettings.host}
                          onChange={(e) =>
                            setSmtpSettings({
                              ...smtpSettings,
                              host: e.target.value,
                            })
                          }
                          placeholder="smtp.gmail.com"
                          className="mt-2 border-slate-300 focus:border-green-500 focus:ring-green-500"
                          data-testid="input-smtp-host"
                        />
                      </div>
                      <div>
                        <Label htmlFor="smtp-port" className="text-slate-700 font-medium">Port *</Label>
                        <Input
                          id="smtp-port"
                          value={smtpSettings.port}
                          onChange={(e) =>
                            setSmtpSettings({
                              ...smtpSettings,
                              port: e.target.value,
                            })
                          }
                          placeholder="587"
                          className="mt-2 border-slate-300 focus:border-green-500 focus:ring-green-500"
                          data-testid="input-smtp-port"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <input
                        type="checkbox"
                        id="smtp-secure"
                        checked={smtpSettings.secure}
                        onChange={(e) =>
                          setSmtpSettings({
                            ...smtpSettings,
                            secure: e.target.checked,
                          })
                        }
                        className="w-4 h-4 text-green-600 border-slate-300 rounded focus:ring-green-500"
                        data-testid="checkbox-smtp-secure"
                      />
                      <Label htmlFor="smtp-secure" className="cursor-pointer text-slate-700 font-medium">
                        Use SSL/TLS (port 465)
                      </Label>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="smtp-user" className="text-slate-700 font-medium">SMTP Username *</Label>
                        <Input
                          id="smtp-user"
                          value={smtpSettings.user}
                          onChange={(e) =>
                            setSmtpSettings({
                              ...smtpSettings,
                              user: e.target.value,
                            })
                          }
                          placeholder="your-email@gmail.com"
                          className="mt-2 border-slate-300 focus:border-green-500 focus:ring-green-500"
                          data-testid="input-smtp-user"
                        />
                      </div>
                      <div>
                        <Label htmlFor="smtp-password" className="text-slate-700 font-medium">SMTP Password</Label>
                        <div className="relative">
                          <Input
                            id="smtp-password"
                            type={showPassword ? "text" : "password"}
                            value={smtpSettings.password}
                            onChange={(e) =>
                              setSmtpSettings({
                                ...smtpSettings,
                                password: e.target.value,
                              })
                            }
                            placeholder={
                              smtpData?.hasPassword ? "••••••••" : "Enter password"
                            }
                            className="mt-2 border-slate-300 focus:border-green-500 focus:ring-green-500 pr-10"
                            data-testid="input-smtp-password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 mt-1 text-slate-400 hover:text-slate-600 transition-colors"
                            data-testid="button-toggle-smtp-password"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        {smtpData?.hasPassword && !smtpSettings.password && (
                          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                            Password is already set. Leave blank to keep current password.
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="smtp-from-email" className="text-slate-700 font-medium">
                          From Email Address *
                        </Label>
                        <Input
                          id="smtp-from-email"
                          type="email"
                          value={smtpSettings.fromEmail}
                          onChange={(e) =>
                            setSmtpSettings({
                              ...smtpSettings,
                              fromEmail: e.target.value,
                            })
                          }
                          placeholder="noreply@yourdomain.com"
                          className="mt-2 border-slate-300 focus:border-green-500 focus:ring-green-500"
                          data-testid="input-smtp-from-email"
                        />
                      </div>
                      <div>
                        <Label htmlFor="smtp-from-name" className="text-slate-700 font-medium">From Name</Label>
                        <Input
                          id="smtp-from-name"
                          value={smtpSettings.fromName}
                          onChange={(e) =>
                            setSmtpSettings({
                              ...smtpSettings,
                              fromName: e.target.value,
                            })
                          }
                          placeholder="USA Luxury Limo"
                          className="mt-2 border-slate-300 focus:border-green-500 focus:ring-green-500"
                          data-testid="input-smtp-from-name"
                        />
                      </div>
                    </div>

                    <Button
                      onClick={handleSMTPUpdate}
                      disabled={updateSMTPMutation.isPending}
                      className="bg-green-600 hover:bg-green-700 text-white font-semibold"
                      data-testid="button-save-smtp"
                    >
                      {updateSMTPMutation.isPending ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                          Saving Configuration...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Save SMTP Settings
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Test Email Configuration */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="bg-blue-600 p-1.5 rounded-lg">
                        <Mail className="w-4 h-4 text-white" />
                      </div>
                      <h4 className="font-semibold text-slate-900">Test Email Configuration</h4>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Send a test email to verify your SMTP settings are working correctly.
                    </p>
                    <div className="flex gap-3">
                      <Input
                        type="email"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        placeholder="test@example.com"
                        className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                        data-testid="input-test-email"
                      />
                      <Button
                        onClick={handleTestEmail}
                        disabled={testSMTPMutation.isPending}
                        variant="outline"
                        className="border-blue-300 text-blue-700 hover:bg-blue-50"
                        data-testid="button-send-test-email"
                      >
                        {testSMTPMutation.isPending ? (
                          <>
                            <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Mail className="w-4 h-4 mr-2" />
                            Send Test
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* SMTP Providers Information */}
                  <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 border border-slate-200 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="bg-slate-600 p-1.5 rounded-lg">
                        <AlertCircle className="w-4 h-4 text-white" />
                      </div>
                      <h4 className="font-semibold text-slate-900">Common SMTP Providers</h4>
                    </div>
                    <div className="space-y-3">
                      <div className="bg-white rounded-lg p-4 border border-slate-200">
                        <p className="text-sm font-semibold text-slate-900 mb-2">Gmail</p>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <span className="text-slate-500">Host:</span>{" "}
                            <span className="font-mono text-slate-700">smtp.gmail.com</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Port:</span>{" "}
                            <span className="font-mono text-slate-700">587</span>
                          </div>
                          <div>
                            <span className="text-slate-500">SSL/TLS:</span>{" "}
                            <span className="font-mono text-slate-700">No</span>
                          </div>
                        </div>
                        <p className="text-xs text-amber-700 mt-2 bg-amber-50 p-2 rounded border border-amber-200">
                          Use App Password, not regular password
                        </p>
                      </div>

                      <div className="bg-white rounded-lg p-4 border border-slate-200">
                        <p className="text-sm font-semibold text-slate-900 mb-2">Outlook/Office 365</p>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <span className="text-slate-500">Host:</span>{" "}
                            <span className="font-mono text-slate-700">smtp.office365.com</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Port:</span>{" "}
                            <span className="font-mono text-slate-700">587</span>
                          </div>
                          <div>
                            <span className="text-slate-500">SSL/TLS:</span>{" "}
                            <span className="font-mono text-slate-700">No</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-4 border border-slate-200">
                        <p className="text-sm font-semibold text-slate-900 mb-2">Yahoo</p>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <span className="text-slate-500">Host:</span>{" "}
                            <span className="font-mono text-slate-700">smtp.mail.yahoo.com</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Port:</span>{" "}
                            <span className="font-mono text-slate-700">587</span>
                          </div>
                          <div>
                            <span className="text-slate-500">SSL/TLS:</span>{" "}
                            <span className="font-mono text-slate-700">No</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-4 border border-slate-200">
                        <p className="text-sm font-semibold text-slate-900 mb-2">SendGrid</p>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <span className="text-slate-500">Host:</span>{" "}
                            <span className="font-mono text-slate-700">smtp.sendgrid.net</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Port:</span>{" "}
                            <span className="font-mono text-slate-700">587</span>
                          </div>
                          <div>
                            <span className="text-slate-500">SSL/TLS:</span>{" "}
                            <span className="font-mono text-slate-700">No</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-semibold text-amber-900 mb-1">Important Configuration Notes</p>
                          <p className="text-amber-800">
                            For Port <strong>587</strong>, set SSL/TLS to <strong>No</strong> (uses STARTTLS). 
                            For Port <strong>465</strong>, set SSL/TLS to <strong>Yes</strong> (direct SSL).
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}

// Vehicle Type Management Component
function VehicleTypeManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVehicleType, setSelectedVehicleType] = useState<any | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const imageFileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    passengerCapacity: 4,
    luggageCapacity: "3 Large, 2 Carry-on",
    imageUrl: "",
    features: [] as string[],
    isActive: true,
  });

  // Fetch all vehicle types (including inactive)
  const { data: vehicleTypes, isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/vehicle-types"],
    queryFn: async () => {
      const response = await fetch("/api/admin/vehicle-types", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch vehicle types");
      return response.json();
    },
  });

  // Create vehicle type mutation
  const createVehicleTypeMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/admin/vehicle-types", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create vehicle type");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vehicle-types"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicle-types"] });
      toast({ title: "Vehicle type created successfully" });
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create vehicle type",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update vehicle type mutation
  const updateVehicleTypeMutation = useMutation({
    mutationFn: async (data: { id: string; updates: any }) => {
      const response = await fetch(`/api/admin/vehicle-types/${data.id}`, {
        method: "PUT",
        body: JSON.stringify(data.updates),
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update vehicle type");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vehicle-types"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicle-types"] });
      toast({ title: "Vehicle type updated successfully" });
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update vehicle type",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete vehicle type mutation
  const deleteVehicleTypeMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/vehicle-types/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete vehicle type");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vehicle-types"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicle-types"] });
      toast({ title: "Vehicle type deleted successfully" });
      setDeleteDialogOpen(false);
      setSelectedVehicleType(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete vehicle type",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Upload vehicle image mutation
  const uploadVehicleImageMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/admin/cms/media/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }
      return response.json();
    },
    onSuccess: (data) => {
      // Update the imageUrl in formData with the uploaded image URL (use functional update to avoid overwriting concurrent edits)
      setFormData(prev => ({ ...prev, imageUrl: data.fileUrl }));
      setIsUploadingImage(false);
      if (imageFileInputRef.current) {
        imageFileInputRef.current.value = '';
      }
      toast({
        title: 'Success',
        description: 'Vehicle image uploaded successfully',
      });
    },
    onError: (error: Error) => {
      setIsUploadingImage(false);
      if (imageFileInputRef.current) {
        imageFileInputRef.current.value = '';
      }
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload image',
        variant: 'destructive',
      });
    },
  });

  // Handle vehicle image upload
  const handleVehicleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate file type (images only)
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file (JPEG, PNG, WebP, GIF, or HEIC)',
        variant: 'destructive',
      });
      if (imageFileInputRef.current) {
        imageFileInputRef.current.value = '';
      }
      return;
    }

    // Validate file size (2MB limit)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      toast({
        title: 'File too large',
        description: 'Image must be smaller than 2MB',
        variant: 'destructive',
      });
      if (imageFileInputRef.current) {
        imageFileInputRef.current.value = '';
      }
      return;
    }

    // Create FormData and upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'vehicles');
    formData.append('altText', `${formData.name || 'Vehicle'} image`);
    formData.append('description', `Image for ${formData.name || 'vehicle type'}`);

    setIsUploadingImage(true);
    uploadVehicleImageMutation.mutate(formData);
  };

  const filteredVehicleTypes = vehicleTypes?.filter((vt) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      vt.name.toLowerCase().includes(searchLower) ||
      vt.description?.toLowerCase().includes(searchLower)
    );
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      passengerCapacity: 4,
      luggageCapacity: "3 Large, 2 Carry-on",
      imageUrl: "",
      features: [],
      isActive: true,
    });
    setIsEditing(false);
    setSelectedVehicleType(null);
  };

  const handleAdd = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleEdit = (vehicleType: any) => {
    setSelectedVehicleType(vehicleType);
    setFormData({
      name: vehicleType.name,
      description: vehicleType.description || "",
      passengerCapacity: vehicleType.passengerCapacity,
      luggageCapacity: vehicleType.luggageCapacity || "",
      imageUrl: vehicleType.imageUrl || "",
      features: vehicleType.features || [],
      isActive: vehicleType.isActive,
    });
    setIsEditing(true);
    setDialogOpen(true);
  };

  const handleDelete = (vehicleType: any) => {
    setSelectedVehicleType(vehicleType);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = () => {
    if (isEditing && selectedVehicleType) {
      updateVehicleTypeMutation.mutate({
        id: selectedVehicleType.id,
        updates: formData,
      });
    } else {
      createVehicleTypeMutation.mutate(formData);
    }
  };

  return (
    <Card data-testid="vehicle-type-management" className="border-0 shadow-xl bg-gradient-to-br from-white via-slate-50/50 to-white backdrop-blur-sm overflow-hidden">
      {/* Premium Header with layered design */}
      <CardHeader className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-b-0 pb-8">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.05)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.1)_0%,transparent_50%)]" />
        
        <CardTitle className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Luxury icon badge with gradient */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-2xl blur-md opacity-60 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-gradient-to-br from-blue-500 to-indigo-600 p-3.5 rounded-2xl shadow-lg">
                <Car className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Fleet Management</h2>
              <p className="text-sm text-slate-300 mt-0.5 font-light">Manage your luxury vehicle collection</p>
            </div>
          </div>
          <Button
            onClick={handleAdd}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-6 py-5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
            data-testid="button-add-vehicle-type"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Vehicle
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-8 bg-gradient-to-b from-white to-slate-50/30">
        {/* Premium Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 py-6 border-slate-200 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm focus:border-blue-400 focus:ring-blue-400/20 focus:shadow-md transition-all text-base"
              data-testid="input-search-vehicle-types"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-16">
            <div className="relative">
              <div className="animate-spin w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full" />
              <div className="absolute inset-0 animate-ping w-12 h-12 border-4 border-blue-400 rounded-full opacity-20" />
            </div>
          </div>
        ) : filteredVehicleTypes && filteredVehicleTypes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVehicleTypes.map((vt) => (
              <div
                key={vt.id}
                className="group relative bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-500 overflow-hidden border border-slate-100 hover:border-slate-200 hover:-translate-y-1"
                data-testid={`vehicle-type-row-${vt.id}`}
              >
                {/* Vehicle Image */}
                <div className="relative h-48 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
                  {vt.imageUrl ? (
                    <img
                      src={vt.imageUrl}
                      alt={vt.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f1f5f9" width="400" height="300"/%3E%3Cg transform="translate(200,150)"%3E%3Cpath d="M-30,-10 L-20,-10 L-20,0 L30,0 L30,-10 L40,-10 L40,15 L-40,15 L-40,-10 L-30,-10 M-25,5 L-20,5 L-20,10 L-25,10 L-25,5 M20,5 L25,5 L25,10 L20,10 L20,5" fill="%2394a3b8"/%3E%3C/g%3E%3Ctext x="50%25" y="75%25" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8" font-family="sans-serif" font-size="14"%3E{vt.name}%3C/text%3E%3C/svg%3E';
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Car className="w-20 h-20 text-slate-300" />
                    </div>
                  )}
                  
                  {/* Status Badge - Floating */}
                  <div className="absolute top-4 right-4">
                    <Badge 
                      className={vt.isActive 
                        ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white border-0 shadow-lg px-3 py-1.5 font-semibold" 
                        : "bg-slate-500/90 text-white border-0 shadow-lg px-3 py-1.5 backdrop-blur-sm"}
                      data-testid={`vehicle-status-${vt.id}`}
                    >
                      <CheckCircle2 className={`w-3 h-3 mr-1 ${vt.isActive ? '' : 'opacity-50'}`} />
                      {vt.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6">
                  {/* Vehicle Name & Description */}
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors" data-testid={`vehicle-name-${vt.id}`}>
                      {vt.name}
                    </h3>
                    {vt.description && (
                      <p className="text-sm text-slate-500 line-clamp-2">{vt.description}</p>
                    )}
                  </div>

                  {/* Capacity Info */}
                  <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100" data-testid={`vehicle-capacity-${vt.id}`}>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Users className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium">{vt.passengerCapacity}</span>
                    </div>
                    <div className="h-4 w-px bg-slate-200" />
                    <div className="flex-1">
                      <p className="text-xs text-slate-500 font-medium">{vt.luggageCapacity}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleEdit(vt)}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-300 rounded-xl"
                      data-testid={`button-edit-${vt.id}`}
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleDelete(vt)}
                      variant="outline"
                      className="px-4 border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all duration-300 rounded-xl"
                      data-testid={`button-delete-${vt.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 border-2 border-dashed border-slate-200">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.05)_0%,transparent_70%)]" />
            <div className="relative text-center py-20 px-6">
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-blue-100 rounded-full blur-2xl opacity-50" />
                <div className="relative bg-gradient-to-br from-slate-100 to-blue-100 p-6 rounded-full">
                  <Car className="w-16 h-16 text-slate-400" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-700 mb-2">No Vehicles Yet</h3>
              <p className="text-slate-500 mb-6 max-w-sm mx-auto">Start building your luxury fleet by adding your first vehicle type.</p>
              <Button
                onClick={handleAdd}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-8 py-5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Your First Vehicle
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-700">
              <Car className="w-5 h-5" />
              {isEditing ? "Edit Vehicle Type" : "Add Vehicle Type"}
            </DialogTitle>
            <DialogDescription>
              {isEditing ? "Update the vehicle type information below." : "Enter the details for the new vehicle type."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Vehicle Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Business Sedan"
                  data-testid="input-vehicle-name"
                />
              </div>
              <div>
                <Label htmlFor="passengerCapacity">Passenger Capacity *</Label>
                <Input
                  id="passengerCapacity"
                  type="number"
                  min="1"
                  max="20"
                  value={formData.passengerCapacity}
                  onChange={(e) => setFormData({ ...formData, passengerCapacity: parseInt(e.target.value) || 1 })}
                  data-testid="input-passenger-capacity"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the vehicle type"
                rows={2}
                data-testid="input-description"
              />
            </div>

            <div>
              <Label htmlFor="luggageCapacity">Luggage Capacity</Label>
              <Input
                id="luggageCapacity"
                value={formData.luggageCapacity}
                onChange={(e) => setFormData({ ...formData, luggageCapacity: e.target.value })}
                placeholder="e.g., 3 Large, 2 Carry-on"
                data-testid="input-luggage-capacity"
              />
            </div>

            <div>
              <Label htmlFor="imageUrl">Vehicle Image</Label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    id="imageUrl"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://example.com/vehicle.jpg or upload below"
                    data-testid="input-image-url"
                    className="flex-1"
                  />
                  <input
                    ref={imageFileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/gif"
                    onChange={handleVehicleImageUpload}
                    className="hidden"
                    data-testid="input-image-file"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => imageFileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="border-blue-200 text-blue-700 hover:bg-blue-50 whitespace-nowrap"
                    data-testid="button-upload-image"
                  >
                    {isUploadingImage ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Image
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-slate-500">
                  Upload an image file (JPEG, PNG, WebP, GIF, or HEIC, max 2MB) or enter a URL manually
                </p>
                
                {/* Image Preview */}
                {formData.imageUrl && (
                  <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                    <p className="text-xs font-medium text-slate-700 mb-2">Preview:</p>
                    <img
                      src={formData.imageUrl}
                      alt="Vehicle preview"
                      className="w-full h-32 object-cover rounded-lg"
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="100"%3E%3Crect fill="%23f1f5f9" width="200" height="100"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8" font-family="sans-serif"%3EImage not found%3C/text%3E%3C/svg%3E';
                      }}
                      data-testid="image-preview"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                data-testid="checkbox-is-active"
              />
              <Label htmlFor="isActive" className="cursor-pointer">Active (visible to customers)</Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                resetForm();
              }}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                !formData.name ||
                createVehicleTypeMutation.isPending ||
                updateVehicleTypeMutation.isPending
              }
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="button-save"
            >
              {(createVehicleTypeMutation.isPending || updateVehicleTypeMutation.isPending) ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  {isEditing ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>{isEditing ? "Update Vehicle Type" : "Create Vehicle Type"}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              Delete Vehicle Type
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selectedVehicleType?.name}</strong>?
              This action cannot be undone and may affect existing pricing rules.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDeleteDialogOpen(false);
                setSelectedVehicleType(null);
              }}
              data-testid="button-cancel-delete"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedVehicleType) {
                  deleteVehicleTypeMutation.mutate(selectedVehicleType.id);
                }
              }}
              disabled={deleteVehicleTypeMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-confirm-delete"
            >
              {deleteVehicleTypeMutation.isPending ? "Deleting..." : "Delete Vehicle Type"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

// Invoice Management Component
function InvoiceManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [backfillDialogOpen, setBackfillDialogOpen] = useState(false);
  const [backfillResult, setBackfillResult] = useState<any>(null);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);
  const [editFormData, setEditFormData] = useState({
    subtotal: "",
    taxAmount: "",
    totalAmount: "",
  });

  // Fetch all invoices
  const { data: invoices, isLoading } = useQuery<any[]>({
    queryKey: ["/api/invoices"],
  });

  // Update invoice mutation
  const updateInvoiceMutation = useMutation({
    mutationFn: async (data: { id: string; updates: any }) => {
      const response = await fetch(`/api/invoices/${data.id}`, {
        method: "PUT",
        body: JSON.stringify(data.updates),
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to update invoice");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({ title: "Invoice updated successfully" });
      setEditDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update invoice",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete invoice mutation
  const deleteInvoiceMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/invoices/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete invoice");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({ title: "Invoice deleted successfully" });
      setDeleteDialogOpen(false);
      setSelectedInvoice(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete invoice",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Email invoice mutation
  const emailInvoiceMutation = useMutation({
    mutationFn: async (data: { id: string; recipientEmail: string }) => {
      const response = await fetch(`/api/invoices/${data.id}/email`, {
        method: "POST",
        body: JSON.stringify({ recipientEmail: data.recipientEmail }),
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to send invoice");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Invoice sent successfully" });
      setEmailDialogOpen(false);
      setRecipientEmail("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send invoice",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Backfill invoices mutation
  const backfillInvoicesMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/invoices/backfill", {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to backfill invoices");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      setBackfillResult(data);
      toast({ 
        title: "Backfill completed", 
        description: `Created ${data.created} invoices, skipped ${data.skipped} existing`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to backfill invoices",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter invoices
  const filteredInvoices = invoices?.filter((invoice) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      invoice.invoiceNumber?.toLowerCase().includes(searchLower) ||
      invoice.bookingId?.toLowerCase().includes(searchLower)
    );
  });

  const handleView = async (invoice: any) => {
    // Fetch booking details to get pricing breakdown
    try {
      const bookingResponse = await fetch(`/api/bookings/${invoice.bookingId}`, {
        credentials: 'include'
      });
      
      if (bookingResponse.ok) {
        const booking = await bookingResponse.json();
        setSelectedInvoice({ ...invoice, booking });
      } else {
        setSelectedInvoice(invoice);
      }
    } catch (error) {
      console.error('Error fetching booking details:', error);
      setSelectedInvoice(invoice);
    }
    setViewDialogOpen(true);
  };

  const handleEdit = (invoice: any) => {
    setSelectedInvoice(invoice);
    setEditFormData({
      subtotal: invoice.subtotal,
      taxAmount: invoice.taxAmount,
      totalAmount: invoice.totalAmount,
    });
    setEditDialogOpen(true);
  };

  const handleEmail = async (invoice: any) => {
    setSelectedInvoice(invoice);
    setIsLoadingEmail(true);
    
    // Reset recipient email first
    setRecipientEmail("");
    
    // Fetch booking to get passenger email
    let passengerEmail = "";
    let fetchSuccess = false;
    
    try {
      const bookingResponse = await fetch(`/api/bookings/${invoice.bookingId}`, {
        credentials: 'include'
      });
      
      if (!bookingResponse.ok) {
        throw new Error('Failed to fetch booking details');
      }
      
      const booking = await bookingResponse.json();
      
      // Fetch passenger (account owner) details
      const passengerResponse = await fetch(`/api/users/${booking.passengerId}`, {
        credentials: 'include'
      });
      
      if (!passengerResponse.ok) {
        throw new Error('Failed to fetch passenger details');
      }
      
      const passenger = await passengerResponse.json();
      
      if (passenger.email) {
        passengerEmail = passenger.email;
        fetchSuccess = true;
      } else {
        throw new Error('Passenger email not found');
      }
    } catch (error) {
      console.error('Error fetching passenger email:', error);
      toast({
        title: "Could not auto-populate email",
        description: error instanceof Error ? error.message : "Please enter the email manually.",
        variant: "destructive",
      });
      setIsLoadingEmail(false);
      return; // Don't open dialog if fetch failed
    }
    
    setIsLoadingEmail(false);
    
    // Only open dialog if we successfully fetched the email
    if (fetchSuccess && passengerEmail) {
      setRecipientEmail(passengerEmail);
      // Small delay to ensure state is updated before opening dialog
      setTimeout(() => {
        setEmailDialogOpen(true);
      }, 100);
    }
  };

  const handleDelete = (invoice: any) => {
    setSelectedInvoice(invoice);
    setDeleteDialogOpen(true);
  };

  const handlePrint = async (invoice: any) => {
    // Fetch booking details to get detailed pricing
    let booking = null;
    try {
      const bookingResponse = await fetch(`/api/bookings/${invoice.bookingId}`, {
        credentials: 'include'
      });
      
      if (bookingResponse.ok) {
        booking = await bookingResponse.json();
      }
    } catch (error) {
      console.error('Error fetching booking details:', error);
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    // Build detailed pricing rows
    let pricingRows = '';
    
    if (booking?.baseFare) {
      pricingRows += `
        <div class="pricing-row">
          <span class="pricing-label">Base Fare</span>
          <span class="pricing-value">$${parseFloat(booking.baseFare).toFixed(2)}</span>
        </div>
      `;
    }
    
    if (booking?.surgePricingAmount && parseFloat(booking.surgePricingAmount) > 0) {
      const multiplier = booking.surgePricingMultiplier ? ` (${booking.surgePricingMultiplier}x)` : '';
      pricingRows += `
        <div class="pricing-row">
          <span class="pricing-label">Surge Pricing${multiplier}</span>
          <span class="pricing-value pricing-surge">+$${parseFloat(booking.surgePricingAmount).toFixed(2)}</span>
        </div>
      `;
    }
    
    if (booking?.gratuityAmount && parseFloat(booking.gratuityAmount) > 0) {
      pricingRows += `
        <div class="pricing-row">
          <span class="pricing-label">Gratuity (Tip)</span>
          <span class="pricing-value">+$${parseFloat(booking.gratuityAmount).toFixed(2)}</span>
        </div>
      `;
    }
    
    if (booking?.airportFeeAmount && parseFloat(booking.airportFeeAmount) > 0) {
      pricingRows += `
        <div class="pricing-row">
          <span class="pricing-label">Airport Fee</span>
          <span class="pricing-value">+$${parseFloat(booking.airportFeeAmount).toFixed(2)}</span>
        </div>
      `;
    }
    
    if (booking?.discountAmount && parseFloat(booking.discountAmount) > 0) {
      const percentage = booking.discountPercentage ? ` (${booking.discountPercentage}%)` : '';
      pricingRows += `
        <div class="pricing-row">
          <span class="pricing-label">Discount${percentage}</span>
          <span class="pricing-value pricing-discount">-$${parseFloat(booking.discountAmount).toFixed(2)}</span>
        </div>
      `;
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice #${invoice.invoiceNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          
          @page {
            size: letter;
            margin: 0.5in;
          }
          
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            padding: 20px; 
            max-width: 100%;
            margin: 0 auto;
            background: #ffffff;
            color: #0f172a;
            line-height: 1.4;
          }
          
          .print-button {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4f46e5;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            z-index: 1000;
          }
          .print-button:hover {
            background: #4338ca;
          }
          .print-instructions {
            position: fixed;
            top: 70px;
            right: 20px;
            background: #fffbeb;
            border: 2px solid #fbbf24;
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 13px;
            color: #92400e;
            z-index: 1000;
            max-width: 300px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .print-instructions strong {
            display: block;
            margin-bottom: 4px;
            color: #78350f;
          }
          
          .header { 
            text-align: center; 
            border-bottom: 2px solid #4f46e5;
            padding-bottom: 12px; 
            margin-bottom: 20px;
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            padding: 20px;
            border-radius: 8px;
          }
          .header h1 { 
            font-size: 28px;
            font-weight: 800;
            color: #1e293b;
            margin-bottom: 6px;
            letter-spacing: -0.5px;
          }
          .header .invoice-number { 
            font-size: 16px;
            color: #4f46e5;
            font-weight: 600;
            margin-top: 8px;
          }
          
          .info-section {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 14px;
            margin-bottom: 16px;
          }
          .info-section h2 {
            font-size: 14px;
            font-weight: 700;
            color: #334155;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }
          .info-item {
            display: flex;
            flex-direction: column;
          }
          .info-label {
            font-size: 11px;
            color: #64748b;
            font-weight: 500;
            margin-bottom: 3px;
          }
          .info-value {
            font-size: 13px;
            color: #0f172a;
            font-weight: 600;
          }
          .booking-id {
            font-family: 'Courier New', monospace;
            background: #cbd5e1;
            padding: 3px 10px;
            border-radius: 4px;
            display: inline-block;
          }
          
          .pricing-section {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 14px;
            margin-bottom: 16px;
          }
          .pricing-section h2 {
            font-size: 14px;
            font-weight: 700;
            color: #334155;
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .pricing-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid #f1f5f9;
          }
          .pricing-row:last-child {
            border-bottom: none;
          }
          .pricing-label {
            font-size: 13px;
            color: #0f172a;
            font-weight: 500;
          }
          .pricing-value {
            font-size: 13px;
            color: #0f172a;
            font-weight: 600;
          }
          .pricing-surge {
            color: #ea580c;
          }
          .pricing-discount {
            color: #16a34a;
          }
          
          .total-section {
            background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%);
            border: 2px solid #3b82f6;
            border-radius: 8px;
            padding: 16px;
            margin-top: 14px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .total-label {
            font-size: 18px;
            color: #0f172a;
            font-weight: 700;
          }
          .total-value {
            font-size: 24px;
            color: #1d4ed8;
            font-weight: 800;
          }
          
          .payment-status {
            text-align: center;
            margin-top: 16px;
            padding: 14px;
            background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
            border: 2px solid #10b981;
            border-radius: 8px;
          }
          .payment-status-text {
            color: #065f46;
            font-weight: 800;
            font-size: 16px;
            letter-spacing: 1.5px;
          }
          
          .footer {
            margin-top: 20px;
            padding-top: 14px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
          }
          .footer p {
            color: #64748b;
            font-size: 11px;
            font-weight: 500;
          }
          .footer .thank-you {
            font-size: 14px;
            font-weight: 600;
            color: #334155;
            margin-bottom: 6px;
          }
          
          @media print {
            body { 
              padding: 0;
              line-height: 1.3;
            }
            .print-button,
            .print-instructions {
              display: none !important;
            }
            .header {
              padding: 16px;
              margin-bottom: 16px;
            }
            .info-section {
              padding: 12px;
              margin-bottom: 14px;
            }
            .pricing-section {
              padding: 12px;
              margin-bottom: 14px;
            }
            .footer {
              margin-top: 16px;
              padding-top: 12px;
            }
          }
        </style>
      </head>
      <body>
        <button class="print-button" onclick="window.print()">🖨️ Print Invoice</button>
        <div class="print-instructions">
          <strong>📌 How to Print:</strong>
          Click the Print button above or use:<br>
          • Windows/Linux: <strong>Ctrl + P</strong><br>
          • Mac: <strong>Cmd + P</strong>
        </div>
        
        <div class="header">
          <h1>USA Luxury Limo</h1>
          <div class="invoice-number">Invoice #${invoice.invoiceNumber}</div>
        </div>
        
        <div class="info-section">
          <h2>Invoice Information</h2>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Invoice Date</span>
              <span class="info-value">${new Date(invoice.createdAt).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Booking ID</span>
              <span class="info-value booking-id">#${invoice.bookingId.toUpperCase().substring(0, 8)}</span>
            </div>
            ${invoice.paidAt ? `
              <div class="info-item">
                <span class="info-label">Payment Date</span>
                <span class="info-value">${new Date(invoice.paidAt).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </div>
            ` : ''}
          </div>
        </div>
        
        ${booking ? `
        <div class="info-section">
          <h2>🚗 Journey Information</h2>
          <div class="info-grid">
            <div class="info-item" style="grid-column: span 2;">
              <span class="info-label">From :</span>
              <span class="info-value">${booking.pickupAddress}</span>
            </div>
            ${booking.bookingType === 'hourly' && booking.requestedHours ? `
            <div class="info-item" style="grid-column: span 2;">
              <span class="info-label">Duration:</span>
              <span class="info-value">${booking.requestedHours} ${booking.requestedHours === 1 ? 'Hour' : 'Hours'}</span>
            </div>
            ` : booking.destinationAddress ? `
            <div class="info-item" style="grid-column: span 2;">
              <span class="info-label">Destination:</span>
              <span class="info-value">${booking.destinationAddress}</span>
            </div>
            ` : ''}
          </div>
        </div>
        ` : ''}
        
        <div class="pricing-section">
          <h2>📋 Detailed Pricing Breakdown</h2>
          ${pricingRows || `
            <div class="pricing-row">
              <span class="pricing-label">Journey Fare</span>
              <span class="pricing-value">$${parseFloat(invoice.subtotal).toFixed(2)}</span>
            </div>
          `}
          
          <div class="total-section">
            <div class="total-row">
              <span class="total-label">Total Amount</span>
              <span class="total-value">$${parseFloat(invoice.totalAmount).toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        ${invoice.paidAt ? `
          <div class="payment-status">
            <div class="payment-status-text">✓ PAYMENT RECEIVED</div>
          </div>
        ` : ''}
        
        <div class="footer">
          <p class="thank-you">Thank you for choosing USA Luxury Limo!</p>
          <p>All prices include statutory taxes and transportation expenses</p>
        </div>
        
        <script>
          // Auto-print dialog on load (may be blocked by browser)
          window.onload = () => {
            // Small delay to ensure page is fully loaded
            setTimeout(() => {
              window.print();
            }, 500);
          };
          
          // Close window after printing is complete or cancelled
          window.onafterprint = () => {
            window.close();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading invoices...</div>;
  }

  return (
    <>
      {/* Action Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between gap-4">
          <Button
            onClick={() => setBackfillDialogOpen(true)}
            variant="outline"
            className="gap-2 border-indigo-300 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-400"
            data-testid="button-backfill-invoices"
          >
            <FileText className="w-4 h-4" />
            Backfill Missing Invoices
          </Button>

          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search invoices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
              data-testid="input-invoice-search"
            />
          </div>
        </div>
      </div>

      {/* Invoices Grid */}
      <div className="space-y-3">
        {/* Table Header - Hidden on mobile */}
        <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-3 bg-gradient-to-r from-slate-100 to-slate-50 rounded-lg text-sm font-semibold text-slate-900 border border-slate-200">
          <div className="col-span-2">Invoice</div>
          <div className="col-span-2">Date</div>
          <div className="col-span-2">Booking ID</div>
          <div className="col-span-2 text-right">Amount</div>
          <div className="col-span-1 text-center">Status</div>
          <div className="col-span-3 text-right">Actions</div>
        </div>

        {/* Invoice Cards */}
        {filteredInvoices && filteredInvoices.length > 0 ? (
          filteredInvoices.map((invoice) => (
            <Card key={invoice.id} className="border-slate-200 bg-white hover:shadow-md transition-all hover:border-indigo-200" data-testid={`invoice-row-${invoice.id}`}>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-12 gap-4 items-center">
                  {/* Invoice Number */}
                  <div className="col-span-12 md:col-span-2">
                    <div className="flex items-center gap-2">
                      <div className="bg-indigo-100 p-1.5 rounded-lg hidden md:block">
                        <FileText className="w-3.5 h-3.5 text-indigo-700" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 md:hidden">Invoice</p>
                        <p className="font-semibold text-slate-900">{invoice.invoiceNumber}</p>
                      </div>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="col-span-6 md:col-span-2">
                    <p className="text-xs text-slate-600 md:hidden">Date</p>
                    <p className="text-sm text-slate-700">{new Date(invoice.createdAt).toLocaleDateString()}</p>
                  </div>

                  {/* Booking ID */}
                  <div className="col-span-6 md:col-span-2">
                    <p className="text-xs text-slate-600 md:hidden">Booking</p>
                    <p className="font-mono text-sm text-slate-600 bg-slate-100 px-2 py-1 rounded inline-block" data-testid={`booking-id-${invoice.id}`}>
                      #{invoice.bookingId.toUpperCase().substring(0, 8)}
                    </p>
                  </div>

                  {/* Amount */}
                  <div className="col-span-6 md:col-span-2 md:text-right">
                    <p className="text-xs text-slate-600 md:hidden">Amount</p>
                    <p className="text-lg font-bold text-slate-900">${parseFloat(invoice.totalAmount).toFixed(2)}</p>
                  </div>

                  {/* Status */}
                  <div className="col-span-6 md:col-span-1 md:text-center">
                    <Badge 
                      className={invoice.paidAt ? "bg-green-600 text-white border-green-700 hover:bg-green-700" : "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200"}
                      data-testid={`invoice-status-${invoice.id}`}
                    >
                      {invoice.paidAt ? "Paid" : "Unpaid"}
                    </Badge>
                  </div>

                  {/* Actions */}
                  <div className="col-span-12 md:col-span-3">
                    <div className="flex items-center justify-start md:justify-end gap-1 flex-wrap">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleView(invoice)}
                        className="h-8 text-indigo-700 hover:bg-indigo-50"
                        data-testid={`button-view-${invoice.id}`}
                      >
                        <Eye className="w-3.5 h-3.5 mr-1.5" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handlePrint(invoice)}
                        className="h-8 text-slate-700 hover:bg-slate-100"
                        data-testid={`button-print-${invoice.id}`}
                      >
                        <Printer className="w-3.5 h-3.5 mr-1.5" />
                        Print
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEmail(invoice)}
                        disabled={isLoadingEmail}
                        className="h-8 text-blue-700 hover:bg-blue-50"
                        data-testid={`button-email-${invoice.id}`}
                      >
                        <Mail className="w-3.5 h-3.5 mr-1.5" />
                        {isLoadingEmail ? "..." : "Email"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(invoice)}
                        className="h-8 text-green-700 hover:bg-green-50"
                        data-testid={`button-edit-${invoice.id}`}
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(invoice)}
                        className="h-8 text-red-700 hover:bg-red-50"
                        data-testid={`button-delete-${invoice.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="border-slate-200 bg-gradient-to-br from-slate-50 to-white">
            <CardContent className="p-12">
              <div className="text-center" data-testid="no-invoices">
                <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-slate-900">No invoices found</h3>
                <p className="text-sm text-slate-600">
                  {searchQuery ? "Try adjusting your search terms" : "Invoices will appear here once created"}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-[700px] bg-white">
          <DialogHeader className="border-b border-slate-200 pb-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-lg">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-slate-900">Invoice Details</DialogTitle>
                <p className="text-sm text-slate-600 mt-0.5">Complete pricing breakdown and payment information</p>
              </div>
            </div>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-6">
              {/* Invoice Header Section */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 p-5 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-indigo-100 p-1.5 rounded-lg">
                    <FileText className="w-4 h-4 text-indigo-700" />
                  </div>
                  <h3 className="font-bold text-lg text-slate-900">Invoice Information</h3>
                </div>
                <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                  <div>
                    <p className="text-slate-600 mb-1.5 font-medium">Invoice Number</p>
                    <p className="font-bold text-slate-900" data-testid="view-invoice-number">{selectedInvoice.invoiceNumber}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 mb-1.5 font-medium">Date</p>
                    <p className="text-slate-900" data-testid="view-invoice-date">{new Date(selectedInvoice.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-slate-600 mb-1.5 font-medium">Booking ID</p>
                    <p className="font-mono text-sm bg-slate-200 text-slate-900 px-3 py-1.5 rounded-lg inline-block" data-testid="view-booking-id">
                      #{selectedInvoice.bookingId.toUpperCase().substring(0, 8)}
                    </p>
                  </div>
                  {selectedInvoice.paidAt && (
                    <div className="col-span-2">
                      <p className="text-slate-600 mb-1.5 font-medium">Payment Date</p>
                      <p className="text-slate-900" data-testid="view-payment-date">{new Date(selectedInvoice.paidAt).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Journey Information */}
              {selectedInvoice.booking && (
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50/50 p-5 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="bg-blue-100 p-1.5 rounded-lg">
                      <svg className="w-4 h-4 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                    </div>
                    <h3 className="font-bold text-lg text-slate-900">Journey Information</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-blue-900 font-semibold mb-1.5">From :</p>
                      <p className="text-slate-900 leading-relaxed" data-testid="view-pickup-address">
                        {selectedInvoice.booking.pickupAddress}
                      </p>
                    </div>
                    {selectedInvoice.booking.bookingType === 'hourly' && selectedInvoice.booking.requestedHours ? (
                      <div>
                        <p className="text-blue-900 font-semibold mb-1.5">Duration:</p>
                        <p className="text-slate-900 font-bold text-lg" data-testid="view-booking-hours">
                          {selectedInvoice.booking.requestedHours} {selectedInvoice.booking.requestedHours === 1 ? 'Hour' : 'Hours'}
                        </p>
                      </div>
                    ) : selectedInvoice.booking.destinationAddress ? (
                      <div>
                        <p className="text-blue-900 font-semibold mb-1.5">Destination:</p>
                        <p className="text-slate-900 leading-relaxed" data-testid="view-destination-address">
                          {selectedInvoice.booking.destinationAddress}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}

              {/* Detailed Pricing Breakdown */}
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-blue-100 p-1.5 rounded-lg">
                    <Receipt className="w-4 h-4 text-blue-700" />
                  </div>
                  <h3 className="font-bold text-lg text-slate-900">Detailed Pricing Breakdown</h3>
                </div>
                <div className="space-y-3">
                  {/* Base Fare */}
                  {selectedInvoice.booking?.baseFare && (
                    <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                      <span className="text-slate-900 font-medium">Base Fare</span>
                      <span className="font-semibold text-slate-900" data-testid="view-base-fare">
                        ${parseFloat(selectedInvoice.booking.baseFare).toFixed(2)}
                      </span>
                    </div>
                  )}
                  
                  {/* Surge Pricing */}
                  {selectedInvoice.booking?.surgePricingAmount && parseFloat(selectedInvoice.booking.surgePricingAmount) > 0 && (
                    <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-900 font-medium">Surge Pricing</span>
                        {selectedInvoice.booking?.surgePricingMultiplier && (
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold">
                            {selectedInvoice.booking.surgePricingMultiplier}x
                          </span>
                        )}
                      </div>
                      <span className="font-semibold text-orange-600" data-testid="view-surge-pricing">
                        +${parseFloat(selectedInvoice.booking.surgePricingAmount).toFixed(2)}
                      </span>
                    </div>
                  )}
                  
                  {/* Gratuity */}
                  {selectedInvoice.booking?.gratuityAmount && parseFloat(selectedInvoice.booking.gratuityAmount) > 0 && (
                    <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                      <span className="text-slate-900 font-medium">Gratuity (Tip)</span>
                      <span className="font-semibold text-slate-900" data-testid="view-gratuity">
                        +${parseFloat(selectedInvoice.booking.gratuityAmount).toFixed(2)}
                      </span>
                    </div>
                  )}
                  
                  {/* Airport Fee */}
                  {selectedInvoice.booking?.airportFeeAmount && parseFloat(selectedInvoice.booking.airportFeeAmount) > 0 && (
                    <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                      <span className="text-slate-900 font-medium">Airport Fee</span>
                      <span className="font-semibold text-slate-900" data-testid="view-airport-fee">
                        +${parseFloat(selectedInvoice.booking.airportFeeAmount).toFixed(2)}
                      </span>
                    </div>
                  )}
                  
                  {/* Discount */}
                  {selectedInvoice.booking?.discountAmount && parseFloat(selectedInvoice.booking.discountAmount) > 0 && (
                    <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-900 font-medium">Discount</span>
                        {selectedInvoice.booking?.discountPercentage && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                            {selectedInvoice.booking.discountPercentage}%
                          </span>
                        )}
                      </div>
                      <span className="font-semibold text-green-600" data-testid="view-discount">
                        -${parseFloat(selectedInvoice.booking.discountAmount).toFixed(2)}
                      </span>
                    </div>
                  )}
                  
                  {/* Total */}
                  <div className="flex justify-between items-center py-4 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 -mx-4 rounded-lg mt-3 border-t-2 border-blue-200">
                    <span className="font-bold text-lg text-slate-900">Total Amount</span>
                    <span className="font-bold text-xl text-blue-700" data-testid="view-total">
                      ${parseFloat(selectedInvoice.totalAmount).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Status */}
              {selectedInvoice.paidAt && (
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl">
                  <div className="flex items-center justify-center gap-2">
                    <div className="bg-green-600 p-1.5 rounded-full">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-green-800 font-bold text-lg">PAYMENT RECEIVED</p>
                  </div>
                </div>
              )}

              {/* Footer Note */}
              <div className="text-xs text-slate-500 text-center pt-2 bg-slate-50 py-3 rounded-lg border border-slate-200">
                <p className="font-medium">💡 All prices include statutory taxes and transportation expenses</p>
              </div>
            </div>
          )}
          <DialogFooter className="border-t border-slate-200 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setViewDialogOpen(false)} 
              className="border-slate-300 text-slate-700 hover:bg-slate-50"
              data-testid="button-close-view"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b border-slate-200 pb-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-2 rounded-lg shadow-md">
                <Edit2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-slate-900">Edit Invoice</DialogTitle>
                <p className="text-sm text-slate-600 mt-0.5">Update pricing details and amounts</p>
              </div>
            </div>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-6">
              {/* Invoice Information */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 p-5 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-slate-100 p-1.5 rounded-lg">
                    <FileText className="w-4 h-4 text-slate-700" />
                  </div>
                  <h3 className="font-bold text-base text-slate-900">Invoice Information</h3>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-600 mb-1 font-medium">Invoice Number</p>
                    <p className="font-bold text-slate-900">{selectedInvoice.invoiceNumber}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 mb-1 font-medium">Booking ID</p>
                    <p className="font-mono text-xs bg-slate-200 text-slate-900 px-2 py-1 rounded inline-block">
                      #{selectedInvoice.bookingId.toUpperCase().substring(0, 8)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Detailed Pricing Breakdown */}
              <div className="bg-white border-2 border-slate-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-5">
                  <div className="bg-blue-100 p-1.5 rounded-lg">
                    <Receipt className="w-4 h-4 text-blue-700" />
                  </div>
                  <h3 className="font-bold text-base text-slate-900">Detailed Pricing Breakdown</h3>
                </div>
                
                <div className="space-y-4">
                  {/* Base Fare */}
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <Label htmlFor="edit-base-fare" className="text-slate-900 font-semibold mb-2 block">
                      Base Fare
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-900 font-semibold">$</span>
                      <Input
                        id="edit-base-fare"
                        type="number"
                        step="0.01"
                        min="0"
                        value={editFormData.subtotal}
                        onChange={(e) => setEditFormData({ ...editFormData, subtotal: e.target.value })}
                        className="pl-7 h-11 border-slate-300 focus:border-slate-500 focus:ring-slate-500 bg-white text-slate-900 font-semibold"
                        data-testid="input-edit-base-fare"
                      />
                    </div>
                  </div>

                  {/* Surge Pricing */}
                  <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <Label className="text-slate-900 font-semibold mb-3 block flex items-center gap-2">
                      <span>Surge Pricing</span>
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold">
                        Optional
                      </span>
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="edit-surge-multiplier" className="text-xs text-slate-700 mb-1.5 block">
                          Multiplier (e.g., 1.5x)
                        </Label>
                        <Input
                          id="edit-surge-multiplier"
                          type="number"
                          step="0.1"
                          min="1"
                          placeholder="1.0"
                          className="h-10 border-orange-300 focus:border-orange-500 focus:ring-orange-500 bg-white"
                          data-testid="input-edit-surge-multiplier"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-surge-amount" className="text-xs text-slate-700 mb-1.5 block">
                          Amount
                        </Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-600 font-semibold">$</span>
                          <Input
                            id="edit-surge-amount"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            className="pl-7 h-10 border-orange-300 focus:border-orange-500 focus:ring-orange-500 bg-white text-orange-600 font-semibold"
                            data-testid="input-edit-surge-amount"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Gratuity */}
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <Label htmlFor="edit-gratuity" className="text-slate-900 font-semibold mb-2 block flex items-center gap-2">
                      <span>Gratuity (Tip)</span>
                      <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-semibold">
                        Optional
                      </span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-900 font-semibold">$</span>
                      <Input
                        id="edit-gratuity"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        className="pl-7 h-11 border-slate-300 focus:border-slate-500 focus:ring-slate-500 bg-white text-slate-900 font-semibold"
                        data-testid="input-edit-gratuity"
                      />
                    </div>
                  </div>

                  {/* Airport Fee */}
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <Label htmlFor="edit-airport-fee" className="text-slate-900 font-semibold mb-2 block flex items-center gap-2">
                      <span>Airport Fee</span>
                      <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-semibold">
                        Optional
                      </span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-900 font-semibold">$</span>
                      <Input
                        id="edit-airport-fee"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        className="pl-7 h-11 border-slate-300 focus:border-slate-500 focus:ring-slate-500 bg-white text-slate-900 font-semibold"
                        data-testid="input-edit-airport-fee"
                      />
                    </div>
                  </div>

                  {/* Discount */}
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <Label className="text-slate-900 font-semibold mb-3 block flex items-center gap-2">
                      <span>Discount</span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                        Optional
                      </span>
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="edit-discount-percentage" className="text-xs text-slate-700 mb-1.5 block">
                          Percentage (%)
                        </Label>
                        <Input
                          id="edit-discount-percentage"
                          type="number"
                          step="1"
                          min="0"
                          max="100"
                          placeholder="0"
                          className="h-10 border-green-300 focus:border-green-500 focus:ring-green-500 bg-white"
                          data-testid="input-edit-discount-percentage"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-discount-amount" className="text-xs text-slate-700 mb-1.5 block">
                          Amount
                        </Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600 font-semibold">$</span>
                          <Input
                            id="edit-discount-amount"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            className="pl-7 h-10 border-green-300 focus:border-green-500 focus:ring-green-500 bg-white text-green-600 font-semibold"
                            data-testid="input-edit-discount-amount"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Total Amount */}
                  <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-300 shadow-sm">
                    <Label htmlFor="edit-total" className="text-slate-900 font-bold mb-3 block text-base">
                      Total Amount
                    </Label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-700 font-bold text-lg">$</span>
                      <Input
                        id="edit-total"
                        type="number"
                        step="0.01"
                        min="0"
                        value={editFormData.totalAmount}
                        onChange={(e) => setEditFormData({ ...editFormData, totalAmount: e.target.value })}
                        className="pl-9 h-14 border-blue-400 focus:border-blue-600 focus:ring-blue-600 bg-white text-blue-700 font-bold text-xl"
                        data-testid="input-edit-total"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Helper Note */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 p-1.5 rounded-lg mt-0.5">
                    <svg className="w-4 h-4 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-sm text-blue-900 leading-relaxed">
                    <strong className="font-semibold">Pro Tip:</strong> Enter detailed pricing components for transparent invoicing. 
                    The total will be calculated automatically or can be adjusted manually if needed.
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="border-t border-slate-200 pt-4 gap-2">
            <Button 
              variant="outline" 
              onClick={() => setEditDialogOpen(false)} 
              className="border-slate-300 text-slate-700 hover:bg-slate-50"
              data-testid="button-cancel-edit"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                updateInvoiceMutation.mutate({
                  id: selectedInvoice.id,
                  updates: editFormData,
                });
              }}
              disabled={updateInvoiceMutation.isPending}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md"
              data-testid="button-save-edit"
            >
              {updateInvoiceMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white">
          <DialogHeader className="border-b border-slate-200 pb-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-600 p-2 rounded-lg">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-slate-900">Email Invoice</DialogTitle>
                <DialogDescription className="text-slate-600 mt-0.5">Send this invoice to a customer via email</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="recipient-email">Recipient Email</Label>
              <Input
                id="recipient-email"
                type="email"
                placeholder="customer@example.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                data-testid="input-recipient-email"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)} data-testid="button-cancel-email">
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedInvoice && recipientEmail) {
                  emailInvoiceMutation.mutate({
                    id: selectedInvoice.id,
                    recipientEmail,
                  });
                }
              }}
              disabled={emailInvoiceMutation.isPending || !recipientEmail}
              data-testid="button-send-email"
            >
              {emailInvoiceMutation.isPending ? "Sending..." : "Send Email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white">
          <DialogHeader className="border-b border-red-200 pb-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-red-500 to-rose-600 p-2 rounded-lg">
                <Trash2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-slate-900">Delete Invoice</DialogTitle>
                <DialogDescription className="text-slate-600 mt-0.5">
                  This action cannot be undone. The invoice will be permanently removed.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          {selectedInvoice && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="space-y-2 text-sm">
                <p className="text-slate-900"><strong className="font-semibold">Invoice #:</strong> {selectedInvoice.invoiceNumber}</p>
                <p className="text-slate-900"><strong className="font-semibold">Amount:</strong> ${parseFloat(selectedInvoice.totalAmount).toFixed(2)}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} data-testid="button-cancel-delete">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedInvoice) {
                  deleteInvoiceMutation.mutate(selectedInvoice.id);
                }
              }}
              disabled={deleteInvoiceMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteInvoiceMutation.isPending ? "Deleting..." : "Delete Invoice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Backfill Invoices Dialog */}
      <Dialog open={backfillDialogOpen} onOpenChange={setBackfillDialogOpen}>
        <DialogContent className="sm:max-w-[600px] bg-white">
          <DialogHeader className="border-b border-slate-200 pb-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-lg">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-slate-900">Backfill Missing Invoices</DialogTitle>
                <DialogDescription className="text-slate-600 mt-0.5">
                  Automatically create invoices for bookings that don't have one
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          {backfillResult ? (
            <div className="space-y-4">
              <div className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-green-600 p-1.5 rounded-full">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-bold text-green-900">Backfill Completed!</h3>
                </div>
                <div className="space-y-2 text-sm text-green-800">
                  <p><strong className="font-semibold">Total Bookings:</strong> {backfillResult.total}</p>
                  <p><strong className="font-semibold">Invoices Created:</strong> {backfillResult.created}</p>
                  <p><strong className="font-semibold">Already Existed:</strong> {backfillResult.skipped}</p>
                  {backfillResult.errors > 0 && (
                    <p className="text-red-700"><strong className="font-semibold">Errors:</strong> {backfillResult.errors}</p>
                  )}
                </div>
              </div>
              {backfillResult.errorDetails && backfillResult.errorDetails.length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-semibold text-red-900 mb-2">Error Details:</h4>
                  <div className="space-y-1 text-xs text-red-800 max-h-40 overflow-y-auto">
                    {backfillResult.errorDetails.map((error: string, index: number) => (
                      <p key={index}>{error}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 p-1.5 rounded-lg mt-0.5">
                    <AlertCircle className="w-4 h-4 text-blue-700" />
                  </div>
                  <p className="text-sm text-blue-900 leading-relaxed">
                    This operation will scan all bookings and create invoices for those that are missing one. 
                    Existing invoices will not be affected.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setBackfillDialogOpen(false);
                setBackfillResult(null);
              }} 
              data-testid="button-close-backfill"
            >
              {backfillResult ? "Close" : "Cancel"}
            </Button>
            {!backfillResult && (
              <Button
                onClick={() => backfillInvoicesMutation.mutate()}
                disabled={backfillInvoicesMutation.isPending}
                data-testid="button-confirm-backfill"
              >
                {backfillInvoicesMutation.isPending ? "Processing..." : "Start Backfill"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const { user, isLoading, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const [settings, setSettings] = useState({
    STRIPE_SECRET_KEY: "",
    STRIPE_PUBLIC_KEY: "",
    TOMTOM_API_KEY: "",
  });

  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyValue, setNewKeyValue] = useState("");
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [loadingValue, setLoadingValue] = useState(false);
  const [testingMinIO, setTestingMinIO] = useState(false);
  const [visibleCredentialsSection, setVisibleCredentialsSection] = useState<
    "api" | "payment" | "minio" | null
  >(null);
  const [visibleSettingsSection, setVisibleSettingsSection] = useState<
    "commission" | "email" | "sms" | null
  >(null);
  const [visibleCMSSection, setVisibleCMSSection] = useState<
    "pages" | "media" | null
  >(null);
  const [showBookings, setShowBookings] = useState(false);
  const [showInvoices, setShowInvoices] = useState(false);
  const [showVehicleTypes, setShowVehicleTypes] = useState(false);
  const [selectedUserType, setSelectedUserType] = useState<
    "all" | "passenger" | "driver" | "dispatcher" | "admin"
  >("all");
  const [showUserManager, setShowUserManager] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [commissionPercentage, setCommissionPercentage] = useState<string>("");

  // User dialog state
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteUserDialogOpen, setDeleteUserDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userFormData, setUserFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "passenger" as "passenger" | "driver" | "dispatcher" | "admin",
    isActive: true,
    payLaterEnabled: false,
    cashPaymentEnabled: false,
    discountType: null as "percentage" | "fixed" | null,
    discountValue: "0",
    vehiclePlate: "", // For drivers
  });

  // Payment configuration dialog state
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<
    "stripe" | "paypal" | "square" | null
  >(null);
  const [paymentCredentials, setPaymentCredentials] = useState({
    publicKey: "",
    secretKey: "",
    webhookSecret: "",
    clientId: "", // For PayPal
    clientSecret: "", // For PayPal
    applicationId: "", // For Square
    accessToken: "", // For Square
    locationId: "", // For Square
  });

  // Driver documents dialog state
  const [documentsDialogOpen, setDocumentsDialogOpen] = useState(false);
  const [selectedDriverForDocs, setSelectedDriverForDocs] =
    useState<User | null>(null);
  const [uploadingForDriver, setUploadingForDriver] = useState(false);
  const [uploadFormData, setUploadFormData] = useState({
    file: null as File | null,
    documentType: "driver_license" as
      | "driver_license"
      | "limo_license"
      | "profile_photo",
    expirationDate: "",
    whatsappNumber: "",
  });

  // Bookings management state
  const [bookingSegmentFilter, setBookingSegmentFilter] = useState<"all" | "pending" | "confirmed" | "in_progress" | "completed" | "cancelled">("all");
  const [bookingDateFrom, setBookingDateFrom] = useState("");
  const [bookingDateTo, setBookingDateTo] = useState("");
  const [bookingSearch, setBookingSearch] = useState("");
  const [assignDriverDialogOpen, setAssignDriverDialogOpen] = useState(false);
  const [assigningBookingId, setAssigningBookingId] = useState<string | null>(
    null,
  );
  const [selectedDriverForAssignment, setSelectedDriverForAssignment] =
    useState("");
  const [calculatedDriverPayment, setCalculatedDriverPayment] = useState("");
  const [manualDriverPayment, setManualDriverPayment] = useState("");
  const [isManualPaymentOverride, setIsManualPaymentOverride] = useState(false);
  const [editDriverPaymentDialogOpen, setEditDriverPaymentDialogOpen] =
    useState(false);
  const [editingDriverPaymentBookingId, setEditingDriverPaymentBookingId] =
    useState<string | null>(null);
  const [newDriverPayment, setNewDriverPayment] = useState("");
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<any | null>(null);
  const [bookingFormData, setBookingFormData] = useState({
    passengerId: "",
    pickupAddress: "",
    destinationAddress: "",
    scheduledDateTime: "",
    totalAmount: "",
    regularPrice: "",
    discountPercentage: "",
    discountAmount: "",
    baseFare: "",
    gratuityAmount: "",
    airportFeeAmount: "",
    surgePricingMultiplier: "",
    surgePricingAmount: "",
    vehicleTypeId: "",
    bookingType: "transfer" as "transfer" | "hourly",
    status: "pending" as
      | "pending"
      | "confirmed"
      | "in_progress"
      | "completed"
      | "cancelled",
    pickupCoords: null as { lat: number; lon: number } | null,
    destinationCoords: null as { lat: number; lon: number } | null,
    viaPoints: [] as Array<{ address: string; lat: number; lon: number }>,
    requestedHours: "2",
    // Additional information fields
    bookingFor: "self" as "self" | "someone_else",
    passengerName: "",
    passengerPhone: "",
    passengerEmail: "",
    passengerCount: 1,
    luggageCount: 0,
    babySeat: false,
    specialInstructions: "",
    // Flight information
    flightNumber: "",
    flightAirline: "",
    flightDepartureAirport: "",
    flightArrivalAirport: "",
  });
  const [calculatedPrice, setCalculatedPrice] = useState<string>("");
  const [calculatingPrice, setCalculatingPrice] = useState(false);

  // Flight search state
  const [flightSearchInput, setFlightSearchInput] = useState("");
  const [selectedFlight, setSelectedFlight] = useState<any>(null);
  const [isSearchingFlight, setIsSearchingFlight] = useState(false);
  const [deleteConfirmDialogOpen, setDeleteConfirmDialogOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<string | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");

  // Redirect to home if not authenticated or not admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== "admin")) {
      toast({
        title: "Unauthorized",
        description: "Admin access required. Redirecting to login...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, user, isLoading, toast]);

  // Handle hash-based navigation for direct links from other pages
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') return;
    
    const hash = window.location.hash.substring(1); // Remove the #
    if (!hash) return;

    // Parse the hash (format: section-subsection)
    const [section, subsection] = hash.split('-');

    // Trigger the appropriate section based on hash
    setTimeout(() => {
      if (section === 'credentials') {
        setVisibleCredentialsSection(subsection as 'api' | 'payment' | 'minio');
        setVisibleSettingsSection(null);
        setVisibleCMSSection(null);
        setShowUserManager(false);
        setShowBookings(false);
        setShowInvoices(false);
        setTimeout(() => {
          const targetId = 
            subsection === 'api' ? 'credentials-section' : 
            subsection === 'minio' ? 'minio-section' : 
            'payment-section';
          document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else if (section === 'users') {
        setSelectedUserType(subsection as 'all' | 'passenger' | 'driver' | 'dispatcher' | 'admin');
        setShowUserManager(true);
        setVisibleCredentialsSection(null);
        setVisibleSettingsSection(null);
        setVisibleCMSSection(null);
        setShowBookings(false);
        setShowInvoices(false);
        setTimeout(() => {
          document.getElementById('user-manager-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else if (section === 'settings') {
        setVisibleSettingsSection(subsection as 'commission' | 'email' | 'sms');
        setVisibleCredentialsSection(null);
        setVisibleCMSSection(null);
        setShowUserManager(false);
        setShowBookings(false);
        setShowInvoices(false);
        setTimeout(() => {
          document.getElementById('settings-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else if (section === 'cms') {
        setVisibleCMSSection(subsection as 'pages' | 'media');
        setVisibleCredentialsSection(null);
        setVisibleSettingsSection(null);
        setShowUserManager(false);
        setShowBookings(false);
        setShowInvoices(false);
        setTimeout(() => {
          document.getElementById('cms-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else if (section === 'bookings') {
        setShowBookings(true);
        setVisibleCredentialsSection(null);
        setVisibleSettingsSection(null);
        setVisibleCMSSection(null);
        setShowUserManager(false);
        setShowInvoices(false);
        setTimeout(() => {
          document.getElementById('bookings-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else if (section === 'invoices') {
        setShowInvoices(true);
        setVisibleCredentialsSection(null);
        setVisibleSettingsSection(null);
        setVisibleCMSSection(null);
        setShowUserManager(false);
        setShowBookings(false);
        setTimeout(() => {
          document.getElementById('invoices-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }

      // Clear the hash after processing
      window.history.replaceState(null, '', window.location.pathname);
    }, 100);
  }, [isAuthenticated, user]);

  // Fetch existing system settings
  const { data: settingsData } = useQuery<{
    credentials: Array<{
      key: string;
      hasValue: boolean;
      usesEnv: boolean;
      canDelete: boolean;
      updatedAt?: string;
    }>;
  }>({
    queryKey: ["/api/admin/settings"],
    retry: false,
    enabled: isAuthenticated && user?.role === "admin",
  });

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/dashboard"],
    retry: false,
    enabled: isAuthenticated && user?.role === "admin",
  });

  // Fetch contact submissions
  const { data: contacts, isLoading: contactsLoading } = useQuery<
    ContactSubmission[]
  >({
    queryKey: ["/api/admin/contacts"],
    retry: false,
    enabled: isAuthenticated && user?.role === "admin",
  });

  // Fetch all bookings
  const { data: bookings, isLoading: bookingsLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/bookings"],
    retry: false,
    enabled: isAuthenticated && user?.role === "admin",
  });

  // Fetch active drivers for assignment
  const { data: activeDrivers } = useQuery<any[]>({
    queryKey: ["/api/admin/active-drivers"],
    retry: false,
    enabled: isAuthenticated && user?.role === "admin",
  });

  // Fetch vehicle types for booking dialog
  const { data: vehicleTypes } = useQuery<any[]>({
    queryKey: ["/api/vehicle-types"],
    retry: false,
    enabled: isAuthenticated && user?.role === "admin",
  });

  // Fetch payment systems
  const { data: paymentSystems = [], isLoading: paymentSystemsLoading } =
    useQuery<PaymentSystem[]>({
      queryKey: ["/api/payment-systems"],
      retry: false,
      enabled: isAuthenticated && user?.role === "admin",
    });

  // Fetch all users
  const { data: allUsers = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    retry: false,
    enabled: isAuthenticated && user?.role === "admin",
  });

  // Fetch all driver documents
  const { data: allDriverDocuments = [], isLoading: documentsLoading } =
    useQuery<DriverDocument[]>({
      queryKey: ["/api/admin/driver-documents"],
      enabled: !!user && user.role === "admin" && documentsDialogOpen,
    });

  // Fetch system commission
  const { data: systemCommission, isLoading: commissionLoading } = useQuery<{
    percentage: number;
    description: string;
  }>({
    queryKey: ["/api/admin/system-commission"],
    retry: false,
    enabled: isAuthenticated && user?.role === "admin",
  });

  // Update system commission when data is loaded
  useEffect(() => {
    if (systemCommission) {
      setCommissionPercentage(systemCommission.percentage.toString());
    }
  }, [systemCommission]);

  // Auto-calculate driver payment when driver is selected
  useEffect(() => {
    if (selectedDriverForAssignment && assigningBookingId && systemCommission) {
      const booking = bookings?.find((b: any) => b.id === assigningBookingId);
      if (booking && booking.totalAmount) {
        const totalAmount = parseFloat(booking.totalAmount);
        const commissionPct = systemCommission.percentage;
        const calculatedPayment = totalAmount * (1 - commissionPct / 100);
        setCalculatedDriverPayment(calculatedPayment.toFixed(2));

        // If not manually overridden, set the manual payment to calculated
        if (!isManualPaymentOverride) {
          setManualDriverPayment(calculatedPayment.toFixed(2));
        }
      }
    }
  }, [
    selectedDriverForAssignment,
    assigningBookingId,
    systemCommission,
    bookings,
    isManualPaymentOverride,
  ]);

  // Update single credential mutation
  const updateCredentialMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const response = await apiRequest("POST", "/api/admin/settings", {
        settings: { [key]: value },
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      setEditingKey(null);
      setNewKeyValue("");
      setIsAddingNew(false);
      setNewKeyName("");
      toast({
        title: "Credential Updated",
        description: "Credential has been saved successfully.",
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
      } else {
        toast({
          title: "Error",
          description: "Failed to update credential.",
          variant: "destructive",
        });
      }
    },
  });

  // Delete credential mutation
  const deleteCredentialMutation = useMutation({
    mutationFn: async (key: string) => {
      const response = await apiRequest("DELETE", `/api/admin/settings/${key}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({
        title: "Credential Deleted",
        description: "Credential has been removed successfully.",
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
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  // Update contact status mutation
  const updateContactMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest("PATCH", `/api/admin/contacts/${id}`, {
        status,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/contacts"] });
      toast({
        title: "Status Updated",
        description: "Contact status has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update contact status",
        variant: "destructive",
      });
    },
  });

  // Update booking status mutation
  const updateBookingStatusMutation = useMutation({
    mutationFn: async ({
      bookingId,
      status,
    }: {
      bookingId: string;
      status: string;
    }) => {
      const response = await apiRequest(
        "PATCH",
        `/api/admin/bookings/${bookingId}/status`,
        { status },
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update booking status");
      }
      const text = await response.text();
      return text ? JSON.parse(text) : {};
    },
    onMutate: async ({ bookingId, status }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/admin/bookings"] });

      // Snapshot the previous value
      const previousBookings = queryClient.getQueryData([
        "/api/admin/bookings",
      ]);

      // Optimistically update to the new value
      queryClient.setQueryData(["/api/admin/bookings"], (old: any) => {
        if (!old) return old;
        return old.map((booking: any) =>
          booking.id === bookingId ? { ...booking, status } : booking,
        );
      });

      // Return a context with the snapshot
      return { previousBookings };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      toast({
        title: "Booking Updated",
        description: "Booking status has been updated successfully.",
      });
    },
    onError: (error: Error, variables, context: any) => {
      // Rollback to the previous value on error
      if (context?.previousBookings) {
        queryClient.setQueryData(
          ["/api/admin/bookings"],
          context.previousBookings,
        );
      }
      toast({
        title: "Error",
        description: error.message || "Failed to update booking status",
        variant: "destructive",
      });
    },
  });

  // Assign driver mutation
  const assignDriverMutation = useMutation({
    mutationFn: async ({
      bookingId,
      driverId,
      driverPayment,
    }: {
      bookingId: string;
      driverId: string;
      driverPayment?: string;
    }) => {
      const response = await apiRequest(
        "PATCH",
        `/api/admin/bookings/${bookingId}/assign-driver`,
        {
          driverId,
          driverPayment,
        },
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to assign driver");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bookings"] });
      setAssignDriverDialogOpen(false);
      setAssigningBookingId(null);
      setSelectedDriverForAssignment("");
      setCalculatedDriverPayment("");
      setManualDriverPayment("");
      setIsManualPaymentOverride(false);
      toast({
        title: "Driver Assigned",
        description:
          "Driver has been successfully assigned with payment amount.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign driver",
        variant: "destructive",
      });
    },
  });

  // Update driver payment mutation
  const updateDriverPaymentMutation = useMutation({
    mutationFn: async ({
      bookingId,
      driverPayment,
    }: {
      bookingId: string;
      driverPayment: string;
    }) => {
      const response = await apiRequest(
        "PATCH",
        `/api/admin/bookings/${bookingId}/driver-payment`,
        { driverPayment },
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update driver payment");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bookings"] });
      setEditDriverPaymentDialogOpen(false);
      setEditingDriverPaymentBookingId(null);
      setNewDriverPayment("");
      toast({
        title: "Driver Payment Updated",
        description: "Driver payment has been successfully updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update driver payment",
        variant: "destructive",
      });
    },
  });

  // Journey tracking mutations
  const toggleNoShowMutation = useMutation({
    mutationFn: async ({
      bookingId,
      noShow,
    }: {
      bookingId: string;
      noShow: boolean;
    }) => {
      const response = await apiRequest(
        "PATCH",
        `/api/admin/bookings/${bookingId}/no-show`,
        { noShow },
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update no-show status");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bookings"] });
      toast({
        title: "No-Show Updated",
        description: "No-show status has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update no-show status",
        variant: "destructive",
      });
    },
  });

  const sendRefundInvoiceMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const response = await apiRequest(
        "PATCH",
        `/api/admin/bookings/${bookingId}/refund-invoice`,
        {},
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to send refund invoice");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bookings"] });
      toast({
        title: "Refund Invoice Sent",
        description: "Refund invoice has been sent successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send refund invoice",
        variant: "destructive",
      });
    },
  });

  const markCompletedMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const response = await apiRequest(
        "PATCH",
        `/api/admin/bookings/${bookingId}/mark-completed`,
        {},
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to mark booking as completed");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bookings"] });
      toast({
        title: "Booking Marked Completed",
        description: "Booking has been marked as completed successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to mark booking as completed",
        variant: "destructive",
      });
    },
  });

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number => {
    const R = 3959; // Earth's radius in miles
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Calculate price based on booking details
  const handleCalculatePrice = async () => {
    if (!bookingFormData.vehicleTypeId) {
      toast({
        title: "Missing Information",
        description: "Please select a vehicle type first",
        variant: "destructive",
      });
      return;
    }

    try {
      setCalculatingPrice(true);

      const vehicleTypeName =
        vehicleTypes?.find((v) => v.id === bookingFormData.vehicleTypeId)
          ?.name || "";
      const vehicleSlug = vehicleTypeName
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/-/g, "_")
        .replace(/[^a-z0-9_]/g, "");

      let requestData: any = {
        vehicleType: vehicleSlug,
        serviceType: bookingFormData.bookingType,
        userId: bookingFormData.passengerId || undefined,
      };

      if (bookingFormData.scheduledDateTime) {
        const dateTime = new Date(bookingFormData.scheduledDateTime);
        requestData.date = dateTime.toISOString().split("T")[0];
        requestData.time = dateTime
          .toTimeString()
          .split(" ")[0]
          .substring(0, 5);
      }

      if (bookingFormData.bookingType === "transfer") {
        if (
          !bookingFormData.pickupCoords ||
          !bookingFormData.destinationCoords
        ) {
          toast({
            title: "Missing Coordinates",
            description:
              "Please select addresses from the autocomplete to get coordinates",
            variant: "destructive",
          });
          return;
        }

        const distance = calculateDistance(
          bookingFormData.pickupCoords.lat,
          bookingFormData.pickupCoords.lon,
          bookingFormData.destinationCoords.lat,
          bookingFormData.destinationCoords.lon,
        );
        requestData.distance = distance.toFixed(2);
      } else {
        requestData.hours = parseInt(bookingFormData.requestedHours);
      }

      const response = await apiRequest(
        "POST",
        "/api/calculate-price",
        requestData,
      );
      const data = await response.json();

      if (data.price) {
        setCalculatedPrice(data.finalPrice || data.price);
        
        // Build description with discount info if applicable
        let description = `Total: $${data.finalPrice || data.price}`;
        if (data.discountAmount && parseFloat(data.discountAmount) > 0) {
          description = `Regular Price: $${data.regularPrice}\nDiscount (${data.discountPercentage}%): -$${data.discountAmount}\nFinal Price: $${data.finalPrice}`;
        }
        
        setBookingFormData({
          ...bookingFormData,
          totalAmount: String(data.finalPrice || data.price),
          regularPrice: data.regularPrice,
          discountPercentage: data.discountPercentage,
          discountAmount: data.discountAmount,
          baseFare: data.baseFare,
          gratuityAmount: data.gratuityAmount,
          airportFeeAmount: data.airportFeeAmount,
          surgePricingMultiplier: data.surgePricingMultiplier,
          surgePricingAmount: data.surgePricingAmount,
        });
        toast({
          title: "Price Calculated",
          description,
        });
      }
    } catch (error) {
      console.error("Price calculation error:", error);
      toast({
        title: "Calculation Failed",
        description: "Unable to calculate price. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCalculatingPrice(false);
    }
  };

  // Flight search handler
  const handleFlightSearch = async () => {
    console.log("🔍 FLIGHT SEARCH STARTED");
    console.log("Flight Search Input:", flightSearchInput);
    console.log("Current Booking Form Data:", bookingFormData);
    console.log("Editing Booking:", editingBooking);
    console.log("Selected Flight State:", selectedFlight);

    if (!flightSearchInput.trim()) {
      console.warn("⚠️ Flight search aborted: No flight number entered");
      toast({
        title: "Flight Number Required",
        description:
          "Please enter a flight number (e.g., KL30, UA2346, DL3427)",
        variant: "destructive",
      });
      return;
    }

    setIsSearchingFlight(true);

    try {
      const flightNumber = flightSearchInput.trim().toUpperCase();
      console.log("📝 Processed Flight Number:", flightNumber);

      const queryParams = new URLSearchParams({ flightNumber });
      if (bookingFormData.scheduledDateTime) {
        const dateOnly = bookingFormData.scheduledDateTime.split("T")[0];
        queryParams.append("date", dateOnly);
        console.log("📅 Search Date:", dateOnly);
      }

      const apiUrl = `/api/flights/search?${queryParams.toString()}`;
      console.log("🌐 API Request URL:", apiUrl);

      const response = await fetch(apiUrl);
      console.log(
        "📡 API Response Status:",
        response.status,
        response.statusText,
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        console.error("❌ API Error Response:", errorData);
        throw new Error(errorData.error || "Flight search failed");
      }

      const data = await response.json();
      console.log("📦 Raw API Response Data:", data);

      let flightItems = Array.isArray(data) ? data : data.items || [];
      console.log("✈️ Flight Items Array:", flightItems);
      console.log("Number of flights found:", flightItems.length);

      if (flightItems.length === 0) {
        console.warn("⚠️ No flights found for:", flightNumber);
        toast({
          title: "No Flights Found",
          description: `No flights found for ${flightNumber}`,
          variant: "destructive",
        });
        return;
      }

      const airlineNames: Record<string, string> = {
        AA: "American Airlines",
        UA: "United Airlines",
        DL: "Delta Air Lines",
        BA: "British Airways",
        EK: "Emirates",
        KL: "KLM Royal Dutch Airlines",
        AF: "Air France",
        LH: "Lufthansa",
        QR: "Qatar Airways",
        SQ: "Singapore Airlines",
        CX: "Cathay Pacific",
        JL: "Japan Airlines",
        NH: "All Nippon Airways",
      };

      const flight = flightItems[0];
      console.log("🎯 Selected Flight (first item):", flight);

      const flightNum = flight.number || flightNumber;
      const airlineCode =
        flightNum.trim().split(" ")[0] || flightNum.substring(0, 2);
      const airlineName =
        airlineNames[airlineCode] || flight.airline?.name || airlineCode;
      console.log(
        "🏢 Airline Code:",
        airlineCode,
        "→ Airline Name:",
        airlineName,
      );

      const departure = flight.departure || {};
      const arrival = flight.arrival || {};
      console.log("🛫 Departure Data:", departure);
      console.log("🛬 Arrival Data:", arrival);

      const selectedFlightData = {
        flightNumber: flightNum.trim(),
        airline: airlineName,
        departureAirport:
          departure.airport?.name || departure.airport?.iata || "N/A",
        arrivalAirport: arrival.airport?.name || arrival.airport?.iata || "N/A",
        departureTime:
          departure.scheduledTimeLocal || departure.scheduledTime || "N/A",
        arrivalTime:
          arrival.scheduledTimeLocal || arrival.scheduledTime || "N/A",
        departureTerminal: departure.terminal || "N/A",
        arrivalTerminal: arrival.terminal || "N/A",
        baggageClaim: arrival.baggageClaim || "N/A",
        aircraft: flight.aircraft?.model || "N/A",
      };
      console.log("📋 Selected Flight Data Object:", selectedFlightData);

      console.log("💾 Setting selectedFlight state...");
      setSelectedFlight(selectedFlightData);

      // Update form with flight info
      const updatedFormData = {
        ...bookingFormData,
        flightNumber: selectedFlightData.flightNumber,
        flightAirline: selectedFlightData.airline,
        flightDepartureAirport: selectedFlightData.departureAirport,
        flightArrivalAirport: selectedFlightData.arrivalAirport,
      };
      console.log("📝 Updating Booking Form Data with:", updatedFormData);
      setBookingFormData(updatedFormData);

      console.log("✅ Flight search completed successfully");
      toast({
        title: "Flight Found",
        description: `${selectedFlightData.airline} ${selectedFlightData.flightNumber}`,
      });
    } catch (error: any) {
      console.error("💥 FLIGHT SEARCH ERROR:", error);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      toast({
        title: "Flight Search Failed",
        description:
          error.message || "Unable to search for flights. Please try again.",
        variant: "destructive",
      });
    } finally {
      console.log(
        "🏁 Flight search process ended, setting isSearchingFlight to false",
      );
      setIsSearchingFlight(false);
    }
  };

  // Create/Update booking mutation
  const saveBookingMutation = useMutation({
    mutationFn: async (data: any) => {
      // Transform string values to correct types for schema validation
      const transformedData = {
        ...data,
        // totalAmount stays as string (decimal type in schema)
        // Only convert requestedHours to number (integer type in schema)
        requestedHours: data.requestedHours
          ? parseInt(data.requestedHours)
          : undefined,
        // Convert numeric values to strings for schema validation
        surgePricingMultiplier: data.surgePricingMultiplier 
          ? String(data.surgePricingMultiplier)
          : undefined,
        discountPercentage: data.discountPercentage
          ? String(data.discountPercentage)
          : undefined,
      };

      const method = editingBooking ? "PATCH" : "POST";
      const url = editingBooking
        ? `/api/admin/bookings/${editingBooking.id}`
        : "/api/admin/bookings";
      const response = await apiRequest(method, url, transformedData);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.message ||
            `Failed to ${editingBooking ? "update" : "create"} booking`,
        );
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      setBookingDialogOpen(false);
      setEditingBooking(null);
      setBookingFormData({
        passengerId: "",
        pickupAddress: "",
        destinationAddress: "",
        scheduledDateTime: "",
        totalAmount: "",
        regularPrice: "",
        discountPercentage: "",
        discountAmount: "",
        baseFare: "",
        gratuityAmount: "",
        airportFeeAmount: "",
        surgePricingMultiplier: "",
        surgePricingAmount: "",
        vehicleTypeId: "",
        bookingType: "transfer",
        status: "pending",
        pickupCoords: null,
        destinationCoords: null,
        viaPoints: [],
        requestedHours: "2",
        bookingFor: "self",
        passengerName: "",
        passengerPhone: "",
        passengerEmail: "",
        passengerCount: 1,
        luggageCount: 0,
        babySeat: false,
        specialInstructions: "",
        flightNumber: "",
        flightAirline: "",
        flightDepartureAirport: "",
        flightArrivalAirport: "",
      });
      setCalculatedPrice("");
      setFlightSearchInput("");
      setSelectedFlight(null);
      toast({
        title: editingBooking ? "Booking Updated" : "Booking Created",
        description: `Booking has been ${editingBooking ? "updated" : "created"} successfully.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete booking mutation
  const deleteBookingMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const response = await apiRequest("DELETE", `/api/bookings/${bookingId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete booking");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      toast({
        title: "Booking Deleted",
        description: "Booking has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Cancel booking mutation
  const cancelBookingMutation = useMutation({
    mutationFn: async ({ bookingId, reason }: { bookingId: string; reason: string }) => {
      const response = await apiRequest("PATCH", `/api/bookings/${bookingId}/cancel`, { reason });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to cancel booking");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      toast({
        title: "Booking Cancelled",
        description: "Booking has been cancelled successfully.",
      });
      setCancelDialogOpen(false);
      setBookingToCancel(null);
      setCancellationReason("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter bookings based on criteria
  const filteredBookings = bookings?.filter((booking) => {
    // Segment filter - filter based on segment tabs
    if (bookingSegmentFilter === "all") {
      // "All" segment excludes completed and cancelled bookings
      if (booking.status === "completed" || booking.status === "cancelled") {
        return false;
      }
    } else {
      // Specific segment shows only that status
      if (booking.status !== bookingSegmentFilter) {
        return false;
      }
    }

    // Date range filter
    if (bookingDateFrom) {
      const bookingDate = new Date(booking.scheduledDateTime);
      const fromDate = new Date(bookingDateFrom);
      if (bookingDate < fromDate) return false;
    }

    if (bookingDateTo) {
      const bookingDate = new Date(booking.scheduledDateTime);
      const toDate = new Date(bookingDateTo);
      toDate.setHours(23, 59, 59);
      if (bookingDate > toDate) return false;
    }

    // Search filter
    if (bookingSearch) {
      const searchLower = bookingSearch.toLowerCase();
      const matchesSearch =
        booking.id?.toLowerCase().includes(searchLower) ||
        booking.passengerName?.toLowerCase().includes(searchLower) ||
        booking.driverName?.toLowerCase().includes(searchLower) ||
        booking.pickupAddress?.toLowerCase().includes(searchLower) ||
        booking.destinationAddress?.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;
    }

    return true;
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<User>;
    }) => {
      const response = await apiRequest(
        "PUT",
        `/api/admin/users/${id}`,
        updates,
      );
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User Updated",
        description: "User account has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    },
  });

  // Payment system mutations
  const updatePaymentSystemMutation = useMutation({
    mutationFn: async ({
      provider,
      updates,
    }: {
      provider: string;
      updates: Partial<PaymentSystem>;
    }) => {
      const response = await apiRequest(
        "PUT",
        `/api/payment-systems/${provider}`,
        updates,
      );
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-systems"] });
      setConfigDialogOpen(false);
      setSelectedProvider(null);
      setPaymentCredentials({
        publicKey: "",
        secretKey: "",
        webhookSecret: "",
        clientId: "",
        clientSecret: "",
        applicationId: "",
        accessToken: "",
        locationId: "",
      });
      toast({
        title: "Payment System Updated",
        description: "Payment system configuration has been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update payment system",
        variant: "destructive",
      });
    },
  });

  const setActivePaymentSystemMutation = useMutation({
    mutationFn: async (provider: string) => {
      const response = await apiRequest(
        "PUT",
        `/api/payment-systems/${provider}/activate`,
      );
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-systems"] });
      toast({
        title: "Active Payment System Changed",
        description: "The active payment system has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to change active payment system",
        variant: "destructive",
      });
    },
  });

  const createPaymentSystemMutation = useMutation({
    mutationFn: async (system: Partial<PaymentSystem>) => {
      const response = await apiRequest("POST", "/api/payment-systems", system);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-systems"] });
      setConfigDialogOpen(false);
      setSelectedProvider(null);
      setPaymentCredentials({
        publicKey: "",
        secretKey: "",
        webhookSecret: "",
        clientId: "",
        clientSecret: "",
        applicationId: "",
        accessToken: "",
        locationId: "",
      });
      toast({
        title: "Payment System Created",
        description: "Payment system has been added successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create payment system",
        variant: "destructive",
      });
    },
  });

  // Open configuration dialog for a provider
  const openConfigDialog = (provider: "stripe" | "paypal" | "square") => {
    setSelectedProvider(provider);

    // Check if system already exists and prefill form
    const existingSystem = paymentSystems.find((s) => s.provider === provider);
    if (existingSystem) {
      // Prefill based on provider type
      if (provider === "stripe") {
        setPaymentCredentials({
          publicKey: existingSystem.publicKey || "",
          secretKey: "", // Don't prefill secrets
          webhookSecret: "",
          clientId: "",
          clientSecret: "",
          applicationId: "",
          accessToken: "",
          locationId: "",
        });
      } else if (provider === "paypal") {
        setPaymentCredentials({
          publicKey: "",
          secretKey: "",
          webhookSecret: "",
          clientId: existingSystem.publicKey || "", // clientId stored as publicKey
          clientSecret: "", // Don't prefill secret
          applicationId: "",
          accessToken: "",
          locationId: "",
        });
      } else if (provider === "square") {
        setPaymentCredentials({
          publicKey: "",
          secretKey: "",
          webhookSecret: "",
          clientId: "",
          clientSecret: "",
          applicationId: existingSystem.publicKey || "", // applicationId stored as publicKey
          accessToken: "", // Don't prefill token
          locationId: existingSystem.config?.locationId || "",
        });
      }
    }

    setConfigDialogOpen(true);
  };

  // Handle payment configuration submission
  const handlePaymentConfig = () => {
    if (!selectedProvider) return;

    const existingSystem = paymentSystems.find(
      (s) => s.provider === selectedProvider,
    );
    let systemData: Partial<PaymentSystem> = {};

    // Configure based on provider type
    if (selectedProvider === "stripe") {
      if (
        !existingSystem &&
        (!paymentCredentials.publicKey || !paymentCredentials.secretKey)
      ) {
        toast({
          title: "Missing Credentials",
          description:
            "Please provide both Publishable Key and Secret Key for Stripe.",
          variant: "destructive",
        });
        return;
      }
      if (paymentCredentials.publicKey)
        systemData.publicKey = paymentCredentials.publicKey;
      if (paymentCredentials.secretKey)
        systemData.secretKey = paymentCredentials.secretKey;
      if (paymentCredentials.webhookSecret)
        systemData.webhookSecret = paymentCredentials.webhookSecret;
    } else if (selectedProvider === "paypal") {
      if (
        !existingSystem &&
        (!paymentCredentials.clientId || !paymentCredentials.clientSecret)
      ) {
        toast({
          title: "Missing Credentials",
          description:
            "Please provide both Client ID and Client Secret for PayPal.",
          variant: "destructive",
        });
        return;
      }
      if (paymentCredentials.clientId)
        systemData.publicKey = paymentCredentials.clientId;
      if (paymentCredentials.clientSecret)
        systemData.secretKey = paymentCredentials.clientSecret;
      if (paymentCredentials.webhookSecret)
        systemData.webhookSecret = paymentCredentials.webhookSecret;
    } else if (selectedProvider === "square") {
      if (
        !existingSystem &&
        (!paymentCredentials.applicationId || !paymentCredentials.accessToken)
      ) {
        toast({
          title: "Missing Credentials",
          description:
            "Please provide both Application ID and Access Token for Square.",
          variant: "destructive",
        });
        return;
      }
      if (paymentCredentials.applicationId)
        systemData.publicKey = paymentCredentials.applicationId;
      if (paymentCredentials.accessToken)
        systemData.secretKey = paymentCredentials.accessToken;
      if (paymentCredentials.locationId) {
        systemData.config = { locationId: paymentCredentials.locationId };
      }
    }

    // Use update if system exists, create if new
    if (existingSystem) {
      updatePaymentSystemMutation.mutate({
        provider: selectedProvider,
        updates: systemData,
      });
    } else {
      createPaymentSystemMutation.mutate({
        provider: selectedProvider,
        isActive: false,
        ...systemData,
      });
    }
  };

  const handleUpdateCredential = (key: string) => {
    if (!newKeyValue) {
      toast({
        title: "Missing Value",
        description: "Please provide a value for the credential",
        variant: "destructive",
      });
      return;
    }
    updateCredentialMutation.mutate({ key, value: newKeyValue });
  };

  const handleAddNewCredential = () => {
    if (!newKeyName || !newKeyValue) {
      toast({
        title: "Missing Information",
        description: "Please provide both credential name and value",
        variant: "destructive",
      });
      return;
    }
    updateCredentialMutation.mutate({
      key: newKeyName.toUpperCase().replace(/\s+/g, "_"),
      value: newKeyValue,
    });
  };

  // Booking management functions
  const openAddBookingDialog = () => {
    setEditingBooking(null);
    setBookingFormData({
      passengerId: "",
      pickupAddress: "",
      destinationAddress: "",
      scheduledDateTime: "",
      totalAmount: "",
      regularPrice: "",
      discountPercentage: "",
      discountAmount: "",
      baseFare: "",
      gratuityAmount: "",
      airportFeeAmount: "",
      surgePricingMultiplier: "",
      surgePricingAmount: "",
      vehicleTypeId: "",
      bookingType: "transfer",
      status: "pending",
      pickupCoords: null,
      destinationCoords: null,
      viaPoints: [],
      requestedHours: "2",
      bookingFor: "self",
      passengerName: "",
      passengerPhone: "",
      passengerEmail: "",
      passengerCount: 1,
      luggageCount: 0,
      babySeat: false,
      specialInstructions: "",
      flightNumber: "",
      flightAirline: "",
      flightDepartureAirport: "",
      flightArrivalAirport: "",
    });
    setCalculatedPrice("");
    setFlightSearchInput("");
    setSelectedFlight(null);
    setBookingDialogOpen(true);
  };

  const openEditBookingDialog = (booking: any) => {
    console.log("📝 OPENING EDIT BOOKING DIALOG");
    console.log("Booking to edit:", booking);
    console.log("🔍 All booking property names:", Object.keys(booking));
    console.log("🔍 Checking specific flight properties:");
    console.log("  - booking.flightNumber:", booking.flightNumber);
    console.log("  - booking.flight_number:", booking.flight_number);
    console.log("  - booking.flightAirline:", booking.flightAirline);
    console.log("  - booking.flight_airline:", booking.flight_airline);
    console.log(
      "  - booking.flightDepartureAirport:",
      booking.flightDepartureAirport,
    );
    console.log(
      "  - booking.flight_departure_airport:",
      booking.flight_departure_airport,
    );
    console.log(
      "  - booking.flightArrivalAirport:",
      booking.flightArrivalAirport,
    );
    console.log(
      "  - booking.flight_arrival_airport:",
      booking.flight_arrival_airport,
    );

    setEditingBooking(booking);
    const scheduledDate = new Date(booking.scheduledDateTime);
    const formattedDateTime = scheduledDate.toISOString().slice(0, 16);
    setBookingFormData({
      passengerId: booking.passengerId || "",
      pickupAddress: booking.pickupAddress || "",
      destinationAddress: booking.destinationAddress || "",
      scheduledDateTime: formattedDateTime,
      totalAmount: booking.totalAmount?.toString() || "",
      regularPrice: booking.regularPrice?.toString() || "",
      discountPercentage: booking.discountPercentage?.toString() || "",
      discountAmount: booking.discountAmount?.toString() || "",
      baseFare: booking.baseFare?.toString() || "",
      gratuityAmount: booking.gratuityAmount?.toString() || "",
      airportFeeAmount: booking.airportFeeAmount?.toString() || "",
      surgePricingMultiplier: booking.surgePricingMultiplier?.toString() || "",
      surgePricingAmount: booking.surgePricingAmount?.toString() || "",
      vehicleTypeId: booking.vehicleTypeId || "",
      bookingType: booking.bookingType || "transfer",
      status: booking.status || "pending",
      pickupCoords: booking.pickupCoords || null,
      destinationCoords: booking.destinationCoords || null,
      viaPoints: booking.viaPoints || [],
      requestedHours: booking.requestedHours?.toString() || "2",
      bookingFor: booking.bookingFor || "self",
      passengerName: booking.passengerName || "",
      passengerPhone: booking.passengerPhone || "",
      passengerEmail: booking.passengerEmail || "",
      passengerCount: booking.passengerCount || 1,
      luggageCount: booking.luggageCount || booking.luggage_count || 0,
      babySeat: booking.babySeat || booking.baby_seat || false,
      specialInstructions:
        booking.specialInstructions || booking.special_instructions || "",
      flightNumber: booking.flightNumber || booking.flight_number || "",
      flightAirline: booking.flightAirline || booking.flight_airline || "",
      flightDepartureAirport:
        booking.flightDepartureAirport ||
        booking.flight_departure_airport ||
        "",
      flightArrivalAirport:
        booking.flightArrivalAirport || booking.flight_arrival_airport || "",
    });
    setCalculatedPrice("");

    // Set driver information if already assigned
    if (booking.driverId) {
      setSelectedDriverForAssignment(booking.driverId);
      setManualDriverPayment(booking.driverPayment?.toString() || "");
    } else {
      setSelectedDriverForAssignment("");
      setManualDriverPayment("");
    }

    // Restore flight information if available
    // Note: Backend returns snake_case field names from database
    console.log("✈️ CHECKING FOR FLIGHT DATA IN BOOKING");
    const flightNum = booking.flightNumber || booking.flight_number;
    const flightAir = booking.flightAirline || booking.flight_airline;
    const deptAirport =
      booking.flightDepartureAirport || booking.flight_departure_airport;
    const arrAirport =
      booking.flightArrivalAirport || booking.flight_arrival_airport;

    console.log("Flight Number found:", flightNum);
    console.log("Flight Airline found:", flightAir);
    console.log("Departure Airport found:", deptAirport);
    console.log("Arrival Airport found:", arrAirport);

    if (flightNum && flightAir) {
      console.log("✅ Flight data exists, restoring flight information");
      const restoredFlight = {
        flightNumber: flightNum,
        airline: flightAir,
        departureAirport: deptAirport || "N/A",
        arrivalAirport: arrAirport || "N/A",
        departureTime: "N/A",
        arrivalTime: "N/A",
        departureTerminal: "N/A",
        arrivalTerminal: "N/A",
        baggageClaim: "N/A",
        aircraft: "N/A",
      };
      console.log("Restored flight object:", restoredFlight);
      setFlightSearchInput(flightNum);
      setSelectedFlight(restoredFlight);
    } else {
      console.log("❌ No flight data found in booking, clearing flight state");
      setFlightSearchInput("");
      setSelectedFlight(null);
    }

    console.log("📂 Opening booking dialog...");
    setBookingDialogOpen(true);
  };

  // User management functions
  const openAddUserDialog = () => {
    setEditingUser(null);
    setUserFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      role: selectedUserType !== "all" ? selectedUserType : "passenger",
      isActive: true,
      payLaterEnabled: false,
      cashPaymentEnabled: false,
      discountType: null,
      discountValue: "0",
      vehiclePlate: "",
    });
    setUserDialogOpen(true);
  };

  const openEditUserDialog = (user: User) => {
    setEditingUser(user);
    setUserFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || "",
      role: user.role,
      isActive: user.isActive,
      payLaterEnabled: user.payLaterEnabled,
      cashPaymentEnabled: user.cashPaymentEnabled || false,
      discountType: user.discountType as "percentage" | "fixed" | null,
      discountValue: user.discountValue || "0",
      vehiclePlate: (user as any).driverInfo?.vehiclePlate || "",
    });
    setUserDialogOpen(true);
  };

  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof userFormData) => {
      const response = await apiRequest("POST", "/api/admin/users", userData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setUserDialogOpen(false);
      toast({
        title: "User Created",
        description: "The user has been successfully created.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest("DELETE", `/api/admin/users/${userId}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User Deleted",
        description: "The user has been successfully deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  const backfillDriversMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/backfill-drivers");
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Driver Records Updated",
        description: data.message || `${data.created} driver records created`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to backfill driver records",
        variant: "destructive",
      });
    },
  });

  const updateDocumentStatusMutation = useMutation({
    mutationFn: async ({
      documentId,
      status,
      rejectionReason,
    }: {
      documentId: string;
      status: string;
      rejectionReason?: string;
    }) => {
      const response = await apiRequest(
        "PUT",
        `/api/admin/driver-documents/${documentId}/status`,
        {
          status,
          rejectionReason,
        },
      );
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/driver-documents"],
      });
      toast({
        title: "Document Updated",
        description: "Document status has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update document status",
        variant: "destructive",
      });
    },
  });

  const adminUploadDocumentMutation = useMutation({
    mutationFn: async ({
      userId,
      file,
      documentType,
      expirationDate,
      whatsappNumber,
    }: {
      userId: string;
      file: File;
      documentType: string;
      expirationDate?: string;
      whatsappNumber?: string;
    }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", userId);
      formData.append("documentType", documentType);
      if (expirationDate) formData.append("expirationDate", expirationDate);
      if (whatsappNumber) formData.append("whatsappNumber", whatsappNumber);

      const response = await fetch("/api/admin/driver-documents/upload", {
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
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/driver-documents"],
      });
      toast({
        title: "Document Uploaded",
        description: "Document uploaded successfully for the driver.",
      });
      setUploadingForDriver(false);
      setUploadFormData({
        file: null,
        documentType: "driver_license",
        expirationDate: "",
        whatsappNumber: "",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update system commission mutation
  const updateCommissionMutation = useMutation({
    mutationFn: async (percentage: string) => {
      const response = await apiRequest("PUT", "/api/admin/system-commission", {
        percentage: parseFloat(percentage),
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/system-commission"],
      });
      toast({
        title: "Commission Updated",
        description:
          "System commission percentage has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update commission",
        variant: "destructive",
      });
    },
  });

  const handleUpdateCommission = () => {
    const percentage = parseFloat(commissionPercentage);
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      toast({
        title: "Invalid Percentage",
        description: "Please enter a percentage between 0 and 100",
        variant: "destructive",
      });
      return;
    }
    updateCommissionMutation.mutate(commissionPercentage);
  };

  const handleSaveUser = () => {
    if (!userFormData.firstName || !userFormData.email) {
      toast({
        title: "Missing Information",
        description: "Please provide at least first name and email",
        variant: "destructive",
      });
      return;
    }

    if (editingUser) {
      // Update existing user
      updateUserMutation.mutate({
        id: editingUser.id,
        updates: userFormData,
      });
      setUserDialogOpen(false);
    } else {
      // Create new user
      createUserMutation.mutate(userFormData);
    }
  };

  const handleDeleteCredential = (key: string) => {
    if (confirm(`Are you sure you want to delete the ${key} credential?`)) {
      deleteCredentialMutation.mutate(key);
    }
  };

  const handleTestMinIOConnection = async () => {
    setTestingMinIO(true);
    
    try {
      // Fetch current MinIO credentials from database
      const minioKeys = ['MINIO_ENDPOINT', 'MINIO_ACCESS_KEY', 'MINIO_SECRET_KEY', 'MINIO_BUCKET'];
      const credentialValues: Record<string, string> = {};
      
      // Fetch all MinIO credential values
      for (const key of minioKeys) {
        try {
          const response = await fetch(`/api/admin/settings/${key}/value`, {
            credentials: "include",
          });
          
          if (response.ok) {
            const data = await response.json();
            credentialValues[key] = data.value || "";
          }
        } catch (error) {
          console.error(`Failed to fetch ${key}:`, error);
        }
      }
      
      // Validate required credentials are present
      if (!credentialValues.MINIO_ENDPOINT || !credentialValues.MINIO_ACCESS_KEY || !credentialValues.MINIO_SECRET_KEY) {
        toast({
          title: "Missing Credentials",
          description: "Please configure MinIO S3 API URL, Access Key, and Secret Key before testing the connection.",
          variant: "destructive",
        });
        return;
      }
      
      // Test the connection
      const testResponse = await fetch('/api/admin/minio/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          endpoint: credentialValues.MINIO_ENDPOINT,
          accessKey: credentialValues.MINIO_ACCESS_KEY,
          secretKey: credentialValues.MINIO_SECRET_KEY,
          bucket: credentialValues.MINIO_BUCKET || 'usa-luxury-limo',
        }),
      });
      
      const result = await testResponse.json();
      
      if (result.success) {
        toast({
          title: "Connection Successful",
          description: result.message,
        });
      } else {
        toast({
          title: "Connection Failed",
          description: result.message || "Failed to connect to MinIO. Please check your credentials.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('MinIO test error:', error);
      toast({
        title: "Test Failed",
        description: "An error occurred while testing the connection. Please try again.",
        variant: "destructive",
      });
    } finally {
      setTestingMinIO(false);
    }
  };

  const handleEditCredential = async (key: string) => {
    setEditingKey(key);
    setLoadingValue(true);

    try {
      // Fetch the actual credential value from the database
      const response = await fetch(`/api/admin/settings/${key}/value`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setNewKeyValue(data.value || "");
      } else if (response.status === 404) {
        // Credential not found in DB (env-only), show empty field
        setNewKeyValue("");
        toast({
          title: "Environment Variable",
          description:
            "This credential is from environment variables. Enter a new value to override it in the database.",
        });
      } else if (response.status === 401 || response.status === 403) {
        // Unauthorized - redirect to login
        setEditingKey(null);
        setNewKeyValue("");
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      } else {
        // Other error
        setNewKeyValue("");
        toast({
          title: "Error",
          description: "Failed to load credential value",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to fetch credential value:", error);
      setNewKeyValue("");
      toast({
        title: "Error",
        description: "Failed to load credential value",
        variant: "destructive",
      });
    } finally {
      setLoadingValue(false);
    }
  };

  // Credential metadata mapping for better UI display (Stripe keys moved to Payment Systems section)
  const credentialMetadata: Record<
    string,
    { label: string; description: string; category: string }
  > = {
    TOMTOM_API_KEY: {
      label: "TomTom API Key",
      description: "Geocoding and routing services",
      category: "Maps",
    },
    RAPIDAPI_KEY: {
      label: "RapidAPI Key",
      description: "AeroDataBox flight search API",
      category: "External APIs",
    },
    MINIO_SERVICE_NAME: {
      label: "MinIO Service Name",
      description: "Friendly name to identify your MinIO instance",
      category: "Object Storage",
    },
    MINIO_CONSOLE_URL: {
      label: "MinIO Console URL",
      description: "Web interface URL for MinIO management (e.g., https://minio.example.com:9001)",
      category: "Object Storage",
    },
    MINIO_ENDPOINT: {
      label: "MinIO S3 API URL",
      description: "S3-compatible API endpoint (e.g., https://minio.example.com:9000)",
      category: "Object Storage",
    },
    MINIO_ACCESS_KEY: {
      label: "MinIO Access Key",
      description: "Access key for MinIO authentication (username)",
      category: "Object Storage",
    },
    MINIO_SECRET_KEY: {
      label: "MinIO Secret Key",
      description: "Secret key for MinIO authentication (password)",
      category: "Object Storage",
    },
    MINIO_BUCKET: {
      label: "MinIO Bucket Name",
      description: "Default bucket name for object storage (e.g., usa-luxury-limo)",
      category: "Object Storage",
    },
  };

  // Build enhanced credentials list from API data
  const credentials = (settingsData?.credentials || []).map((cred) => {
    const meta = credentialMetadata[cred.key] || {
      label: cred.key
        .replace(/_/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase()),
      description: "Custom API credential",
      category: "Custom",
    };

    return {
      ...cred,
      ...meta,
    };
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNav
        onCredentialsClick={(section) => {
          setVisibleCredentialsSection(section);
          setVisibleSettingsSection(null);
          setVisibleCMSSection(null);
          setShowUserManager(false);
          setShowBookings(false);
          setShowInvoices(false);
          setShowVehicleTypes(false);
          setTimeout(() => {
            const targetId =
              section === "api" ? "credentials-section" : 
              section === "minio" ? "minio-section" :
              "payment-section";
            document
              .getElementById(targetId)
              ?.scrollIntoView({ behavior: "smooth" });
          }, 100);
        }}
        onUserManagerClick={(type) => {
          setSelectedUserType(type);
          setShowUserManager(true);
          setVisibleCredentialsSection(null);
          setVisibleSettingsSection(null);
          setVisibleCMSSection(null);
          setShowBookings(false);
          setShowInvoices(false);
          setShowVehicleTypes(false);
          setTimeout(
            () =>
              document
                .getElementById("user-manager-section")
                ?.scrollIntoView({ behavior: "smooth" }),
            100,
          );
        }}
        onBookingsClick={() => {
          setVisibleCredentialsSection(null);
          setVisibleSettingsSection(null);
          setVisibleCMSSection(null);
          setShowUserManager(false);
          setShowBookings(true);
          setShowInvoices(false);
          setShowVehicleTypes(false);
          setTimeout(
            () =>
              document
                .getElementById("bookings-section")
                ?.scrollIntoView({ behavior: "smooth" }),
            100,
          );
        }}
        onInvoicesClick={() => {
          setVisibleCredentialsSection(null);
          setVisibleSettingsSection(null);
          setVisibleCMSSection(null);
          setShowUserManager(false);
          setShowBookings(false);
          setShowInvoices(true);
          setShowVehicleTypes(false);
          setTimeout(
            () =>
              document
                .getElementById("invoices-section")
                ?.scrollIntoView({ behavior: "smooth" }),
            100,
          );
        }}
        onVehicleTypesClick={() => {
          setVisibleCredentialsSection(null);
          setVisibleSettingsSection(null);
          setVisibleCMSSection(null);
          setShowUserManager(false);
          setShowBookings(false);
          setShowInvoices(false);
          setShowVehicleTypes(true);
          setTimeout(
            () =>
              document
                .getElementById("vehicle-types-section")
                ?.scrollIntoView({ behavior: "smooth" }),
            100,
          );
        }}
        onSettingsClick={(section) => {
          setVisibleSettingsSection(section);
          setVisibleCredentialsSection(null);
          setVisibleCMSSection(null);
          setShowUserManager(false);
          setShowBookings(false);
          setShowInvoices(false);
          setShowVehicleTypes(false);
          setTimeout(() => {
            document
              .getElementById("settings-section")
              ?.scrollIntoView({ behavior: "smooth" });
          }, 100);
        }}
        onCMSClick={(section) => {
          setVisibleCMSSection(section);
          setVisibleCredentialsSection(null);
          setVisibleSettingsSection(null);
          setShowUserManager(false);
          setShowBookings(false);
          setShowInvoices(false);
          setShowVehicleTypes(false);
          setTimeout(() => {
            document
              .getElementById("cms-section")
              ?.scrollIntoView({ behavior: "smooth" });
          }, 100);
        }}
        onPricingClick={() => {
          window.location.href = '/admin-pricing';
        }}
      />
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Dashboard Stats - Modern Professional Design */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Revenue Card */}
          <Card
            className="group relative overflow-hidden bg-white border border-slate-200/60 shadow-sm hover:shadow-lg hover:border-slate-300 transition-all duration-300 hover:-translate-y-1"
            data-testid="stat-revenue"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/5 to-transparent rounded-full -mr-16 -mt-16" />
            <CardContent className="p-7 relative">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-2.5 rounded-xl shadow-sm shadow-amber-500/20">
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Revenue</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">This Month</p>
                  <p className="text-3xl font-bold text-slate-900 tracking-tight" data-testid="monthly-revenue">
                    ${statsLoading ? "..." : parseFloat(stats?.monthlyRevenue || "0").toFixed(2)}
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-100">
                  <p className="text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">All Time</p>
                  <p className="text-xl font-semibold text-slate-700 tracking-tight" data-testid="total-revenue">
                    ${statsLoading ? "..." : parseFloat(stats?.totalRevenue || "0").toFixed(2)}
                  </p>
                </div>
              </div>
              {!statsLoading && stats && parseFloat(stats.revenueGrowth) !== 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className={`text-sm font-semibold ${parseFloat(stats.revenueGrowth) > 0 ? "text-emerald-600" : "text-rose-600"}`} data-testid="revenue-growth">
                    {parseFloat(stats.revenueGrowth) > 0 ? "↑" : "↓"} {Math.abs(parseFloat(stats.revenueGrowth)).toFixed(2)}% <span className="text-slate-500 font-normal">from last month</span>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Commission Card */}
          <Card
            className="group relative overflow-hidden bg-white border border-slate-200/60 shadow-sm hover:shadow-lg hover:border-slate-300 transition-all duration-300 hover:-translate-y-1"
            data-testid="stat-commission"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/5 to-transparent rounded-full -mr-16 -mt-16" />
            <CardContent className="p-7 relative">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-2.5 rounded-xl shadow-sm shadow-purple-500/20">
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Commission</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">This Month</p>
                  <p className="text-3xl font-bold text-slate-900 tracking-tight" data-testid="monthly-commission">
                    ${statsLoading ? "..." : parseFloat(stats?.monthlyCommission || "0").toFixed(2)}
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-100">
                  <p className="text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">All Time</p>
                  <p className="text-xl font-semibold text-slate-700 tracking-tight" data-testid="total-commission">
                    ${statsLoading ? "..." : parseFloat(stats?.totalCommission || "0").toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Bookings Card */}
          <Card
            className="group relative overflow-hidden bg-white border border-slate-200/60 shadow-sm hover:shadow-lg hover:border-slate-300 transition-all duration-300 hover:-translate-y-1"
            data-testid="stat-bookings"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-transparent rounded-full -mr-16 -mt-16" />
            <CardContent className="p-7 relative">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2.5 rounded-xl shadow-sm shadow-blue-500/20">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Active Bookings</p>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-5xl font-bold text-slate-900 tracking-tight mb-2" data-testid="active-bookings">
                  {statsLoading ? "..." : stats?.activeBookings || 0}
                </p>
                {!statsLoading && stats && stats.pendingBookings > 0 && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                    <p className="text-sm font-medium text-blue-700" data-testid="pending-bookings">
                      {stats.pendingBookings} pending approval{stats.pendingBookings !== 1 ? "s" : ""}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Drivers Card */}
          <Card
            className="group relative overflow-hidden bg-white border border-slate-200/60 shadow-sm hover:shadow-lg hover:border-slate-300 transition-all duration-300 hover:-translate-y-1"
            data-testid="stat-drivers"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/5 to-transparent rounded-full -mr-16 -mt-16" />
            <CardContent className="p-7 relative">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-2.5 rounded-xl shadow-sm shadow-emerald-500/20">
                    <Car className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Drivers</p>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-5xl font-bold text-slate-900 tracking-tight mb-2" data-testid="active-drivers">
                  {statsLoading ? "..." : `${stats?.activeDrivers || 0}/${stats?.totalDrivers || 0}`}
                </p>
                <p className="text-sm text-slate-500 font-medium mb-3">Active / Total</p>
                {!statsLoading && stats && stats.pendingDrivers > 0 && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <p className="text-sm font-medium text-emerald-700" data-testid="pending-drivers">
                      {stats.pendingDrivers} pending verification
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Customer Satisfaction Card */}
          <Card
            className="group relative overflow-hidden bg-white border border-slate-200/60 shadow-sm hover:shadow-lg hover:border-slate-300 transition-all duration-300 hover:-translate-y-1"
            data-testid="stat-satisfaction"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/5 to-transparent rounded-full -mr-16 -mt-16" />
            <CardContent className="p-7 relative">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-2.5 rounded-xl shadow-sm shadow-orange-500/20">
                    <Star className="h-5 w-5 text-white fill-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Satisfaction</p>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-5xl font-bold text-slate-900 tracking-tight mb-2" data-testid="customer-satisfaction">
                  {statsLoading ? "..." : parseFloat(stats?.averageRating || "0").toFixed(2)}
                  <span className="text-2xl text-slate-400 ml-1">/5</span>
                </p>
                {!statsLoading && stats && parseFloat(stats.ratingImprovement) !== 0 && (
                  <p className={`text-sm font-semibold ${parseFloat(stats.ratingImprovement) > 0 ? "text-emerald-600" : "text-rose-600"}`} data-testid="rating-improvement">
                    {parseFloat(stats.ratingImprovement) > 0 ? "↑" : "↓"} {Math.abs(parseFloat(stats.ratingImprovement)).toFixed(2)} <span className="text-slate-500 font-normal">this month</span>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Awaiting Driver Approval Card */}
          <Card
            className="group relative overflow-hidden bg-white border border-slate-200/60 shadow-sm hover:shadow-lg hover:border-slate-300 transition-all duration-300 hover:-translate-y-1"
            data-testid="stat-awaiting-approval"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-rose-500/5 to-transparent rounded-full -mr-16 -mt-16" />
            <CardContent className="p-7 relative">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-rose-500 to-rose-600 p-2.5 rounded-xl shadow-sm shadow-rose-500/20">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Awaiting Approval</p>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-5xl font-bold text-slate-900 tracking-tight mb-2" data-testid="awaiting-driver-approval">
                  {statsLoading ? "..." : stats?.awaitingDriverApproval || 0}
                </p>
                <p className="text-sm text-slate-500 font-medium mb-3">Jobs waiting for drivers</p>
                {!statsLoading && stats && stats.awaitingDriverApproval > 0 && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-lg">
                    <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                    <p className="text-sm font-medium text-rose-700" data-testid="awaiting-approval-notice">
                      Requires driver acceptance
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* API Credentials Management */}
        {visibleCredentialsSection === "api" && (
          <Card id="credentials-section" data-testid="credentials-management" className="border-slate-200 shadow-sm hover:shadow-md transition-shadow bg-white">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50/30 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3 text-slate-900">
                  <div className="bg-indigo-600 p-2 rounded-lg">
                    <Key className="w-5 h-5 text-white" />
                  </div>
                  <span>API Credentials</span>
                </CardTitle>
                <Button
                  onClick={() => setIsAddingNew(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  size="sm"
                  data-testid="button-add-credential"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Credential
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <p className="text-sm text-slate-600 mb-4">
                Manage API keys and external service credentials for your application.
              </p>

              {/* Existing Credentials (excluding Stripe, SMTP, and MinIO - moved to their respective sections) */}
              <div className="space-y-3">
                {credentials
                  .filter(
                    (c) =>
                      !c.key.includes("STRIPE") &&
                      !c.key.includes("SMTP") &&
                      !c.key.includes("MINIO") &&
                      c.key !== "ADMIN_EMAIL",
                  )
                  .map((credential) => (
                    <div
                      key={credential.key}
                      className="border border-slate-200 rounded-xl p-5 bg-white hover:border-slate-300 transition-all shadow-sm hover:shadow"
                      data-testid={`credential-${credential.key.toLowerCase()}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4
                              className="font-semibold text-lg text-slate-900"
                              data-testid={`credential-label-${credential.key.toLowerCase()}`}
                            >
                              {credential.label}
                            </h4>
                            <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-200 text-xs">
                              {credential.category}
                            </Badge>
                            {credential.hasValue && (
                              <Badge
                                className={
                                  credential.usesEnv 
                                    ? "bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200 text-xs"
                                    : "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200 text-xs"
                                }
                                data-testid={`credential-status-${credential.key.toLowerCase()}`}
                              >
                                {credential.usesEnv ? "ENV" : "DB"}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 mb-2">
                            {credential.description}
                          </p>

                          {editingKey === credential.key ? (
                            <div className="mt-3 space-y-3 bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                              {loadingValue ? (
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                  <div className="animate-spin w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full" />
                                  Loading current value...
                                </div>
                              ) : (
                                <div>
                                  <Label className="text-xs text-slate-700 mb-1">New Value</Label>
                                  <Input
                                    type="text"
                                    placeholder="Enter new value"
                                    value={newKeyValue}
                                    onChange={(e) =>
                                      setNewKeyValue(e.target.value)
                                    }
                                    className="border-slate-300"
                                    data-testid={`input-edit-${credential.key.toLowerCase()}`}
                                  />
                                </div>
                              )}
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                  onClick={() =>
                                    handleUpdateCredential(credential.key)
                                  }
                                  disabled={
                                    updateCredentialMutation.isPending ||
                                    loadingValue
                                  }
                                  data-testid={`button-save-${credential.key.toLowerCase()}`}
                                >
                                  <Check className="w-4 h-4 mr-1" />
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-slate-300 hover:bg-slate-100"
                                  onClick={() => {
                                    setEditingKey(null);
                                    setNewKeyValue("");
                                  }}
                                  data-testid={`button-cancel-${credential.key.toLowerCase()}`}
                                >
                                  <X className="w-4 h-4 mr-1" />
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              {credential.hasValue ? (
                                <div className="inline-flex items-center gap-2 text-xs px-3 py-1.5 bg-green-50 text-green-700 rounded-md border border-green-200">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Configured {credential.usesEnv ? "(from environment)" : "(from database)"}</span>
                                </div>
                              ) : (
                                <div className="inline-flex items-center gap-2 text-xs px-3 py-1.5 bg-slate-100 text-slate-600 rounded-md border border-slate-200">
                                  <AlertCircle className="w-3.5 h-3.5" />
                                  <span>Not configured</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {editingKey !== credential.key && (
                          <div className="flex gap-2 ml-4">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300"
                              onClick={() =>
                                handleEditCredential(credential.key)
                              }
                              data-testid={`button-edit-${credential.key.toLowerCase()}`}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            {credential.canDelete && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                                onClick={() =>
                                  handleDeleteCredential(credential.key)
                                }
                                disabled={deleteCredentialMutation.isPending}
                                data-testid={`button-delete-${credential.key.toLowerCase()}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>

              {/* Add New Credential Form */}
              {isAddingNew && (
                <div
                  className="border-2 border-dashed border-indigo-200 rounded-xl p-5 bg-indigo-50/30 space-y-4"
                  data-testid="add-credential-form"
                >
                  <div className="flex items-center gap-2">
                    <div className="bg-indigo-600 p-1.5 rounded-lg">
                      <Plus className="w-4 h-4 text-white" />
                    </div>
                    <h4 className="font-semibold text-lg text-slate-900">Add New Credential</h4>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="new-key-name" className="text-sm text-slate-700 font-medium">Credential Name</Label>
                      <Input
                        id="new-key-name"
                        placeholder="e.g., MAILGUN_API_KEY"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        className="mt-1.5 border-slate-300"
                        data-testid="input-new-credential-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="new-key-value" className="text-sm text-slate-700 font-medium">Credential Value</Label>
                      <Input
                        id="new-key-value"
                        type="password"
                        placeholder="Enter credential value"
                        value={newKeyValue}
                        onChange={(e) => setNewKeyValue(e.target.value)}
                        className="mt-1.5 border-slate-300"
                        data-testid="input-new-credential-value"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                      onClick={handleAddNewCredential}
                      disabled={updateCredentialMutation.isPending}
                      data-testid="button-save-new-credential"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Add Credential
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-slate-300 hover:bg-slate-100"
                      onClick={() => {
                        setIsAddingNew(false);
                        setNewKeyName("");
                        setNewKeyValue("");
                      }}
                      data-testid="button-cancel-new-credential"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* MinIO Object Storage Configuration */}
        {visibleCredentialsSection === "minio" && (
          <Card id="minio-section" data-testid="minio-credentials" className="border-slate-200 shadow-sm hover:shadow-md transition-shadow bg-white">
            <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50/30 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3 text-slate-900">
                  <div className="bg-cyan-600 p-2 rounded-lg">
                    <Key className="w-5 h-5 text-white" />
                  </div>
                  <span>MinIO Object Storage</span>
                </CardTitle>
                <div className="flex gap-2">
                  <Link href="/admin/minio-browser">
                    <Button
                      className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white"
                      size="sm"
                      data-testid="button-browse-images"
                    >
                      <FileImage className="w-4 h-4 mr-2" />
                      Browse Images
                    </Button>
                  </Link>
                  <Button
                    onClick={handleTestMinIOConnection}
                    disabled={testingMinIO}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white"
                    size="sm"
                    data-testid="button-test-minio"
                  >
                    {testingMinIO ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Test Connection
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <p className="text-sm text-slate-600 mb-4">
                Configure MinIO or S3-compatible object storage for storing driver documents, invoices, and CMS media files.
              </p>

              {/* MinIO Credentials Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['MINIO_SERVICE_NAME', 'MINIO_CONSOLE_URL', 'MINIO_ENDPOINT', 'MINIO_ACCESS_KEY', 'MINIO_SECRET_KEY', 'MINIO_BUCKET'].map((key) => {
                  const credential = credentials.find((c) => c.key === key);
                  if (!credential) return null;

                  return (
                    <div
                      key={key}
                      className={`border border-slate-200 rounded-xl p-5 bg-white hover:border-slate-300 transition-all shadow-sm hover:shadow ${key === 'MINIO_SERVICE_NAME' || key === 'MINIO_CONSOLE_URL' ? 'md:col-span-1' : ''}`}
                      data-testid={`credential-${key.toLowerCase()}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4
                              className="font-semibold text-base text-slate-900"
                              data-testid={`credential-label-${key.toLowerCase()}`}
                            >
                              {credential.label}
                            </h4>
                            {credential.hasValue && (
                              <Badge
                                className={
                                  credential.usesEnv 
                                    ? "bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200 text-xs"
                                    : "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200 text-xs"
                                }
                                data-testid={`credential-status-${key.toLowerCase()}`}
                              >
                                {credential.usesEnv ? "ENV" : "DB"}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 mb-3">
                            {credential.description}
                          </p>

                          {editingKey === key ? (
                            <div className="mt-3 space-y-3 bg-cyan-50 p-4 rounded-lg border border-cyan-200">
                              {loadingValue ? (
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                  <div className="animate-spin w-4 h-4 border-2 border-cyan-600 border-t-transparent rounded-full" />
                                  Loading current value...
                                </div>
                              ) : (
                                <div>
                                  <Label className="text-xs text-slate-700 mb-1">New Value</Label>
                                  <Input
                                    type="text"
                                    placeholder="Enter new value"
                                    value={newKeyValue}
                                    onChange={(e) => setNewKeyValue(e.target.value)}
                                    className="border-slate-300 text-sm"
                                    data-testid={`input-edit-${key.toLowerCase()}`}
                                  />
                                </div>
                              )}
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  className="bg-cyan-600 hover:bg-cyan-700 text-white"
                                  onClick={() => handleUpdateCredential(key)}
                                  disabled={updateCredentialMutation.isPending || loadingValue}
                                  data-testid={`button-save-${key.toLowerCase()}`}
                                >
                                  <Check className="w-4 h-4 mr-1" />
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-slate-300 hover:bg-slate-100"
                                  onClick={() => {
                                    setEditingKey(null);
                                    setNewKeyValue("");
                                  }}
                                  data-testid={`button-cancel-${key.toLowerCase()}`}
                                >
                                  <X className="w-4 h-4 mr-1" />
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {credential.hasValue ? (
                                  <div className="inline-flex items-center gap-2 text-xs px-3 py-1.5 bg-green-50 text-green-700 rounded-md border border-green-200">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Configured</span>
                                  </div>
                                ) : (
                                  <div className="inline-flex items-center gap-2 text-xs px-3 py-1.5 bg-slate-100 text-slate-600 rounded-md border border-slate-200">
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    <span>Not set</span>
                                  </div>
                                )}
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-cyan-200 text-cyan-600 hover:bg-cyan-50 hover:border-cyan-300"
                                onClick={() => handleEditCredential(key)}
                                data-testid={`button-edit-${key.toLowerCase()}`}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 p-4 bg-cyan-50 border border-cyan-200 rounded-lg">
                <h4 className="text-sm font-semibold text-slate-900 mb-2">Connection Test</h4>
                <p className="text-xs text-slate-600 mb-3">
                  After configuring your MinIO credentials, click the "Test Connection" button above to verify:
                </p>
                <ul className="text-xs text-slate-600 space-y-1 ml-4 list-disc">
                  <li>MinIO endpoint is reachable</li>
                  <li>Access credentials are valid</li>
                  <li>Bucket exists and is accessible (or can be created)</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Systems Configuration */}
        {visibleCredentialsSection === "payment" && (
          <Card id="payment-section" data-testid="payment-systems" className="border-slate-200 shadow-sm hover:shadow-md transition-shadow bg-white">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50/30 border-b border-slate-200">
              <CardTitle className="flex items-center gap-3 text-slate-900">
                <div className="bg-green-600 p-2 rounded-lg">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <span>Payment Systems</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {paymentSystemsLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : (
                <div className="space-y-6">
                  <p className="text-sm text-muted-foreground">
                    Configure and manage payment providers. Only one provider
                    can be active at a time for system-wide payments.
                  </p>

                  {/* Payment System Cards */}
                  <div className="grid gap-4">
                    {["stripe", "paypal", "square"].map((provider) => {
                      const system = paymentSystems.find(
                        (s) => s.provider === provider,
                      );
                      const isActive = system?.isActive || false;
                      const providerLabels: Record<string, string> = {
                        stripe: "Stripe",
                        paypal: "PayPal",
                        square: "Square",
                      };

                      return (
                        <div
                          key={provider}
                          className={`border rounded-xl p-5 transition-all ${
                            isActive
                              ? "border-green-300 bg-green-50 shadow-md"
                              : "border-slate-200 bg-white hover:border-slate-300"
                          }`}
                          data-testid={`payment-system-${provider}`}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <h4
                                className="font-semibold text-lg text-slate-900"
                                data-testid={`payment-provider-${provider}`}
                              >
                                {providerLabels[provider]}
                              </h4>
                              {isActive && (
                                <Badge
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                  data-testid={`badge-active-${provider}`}
                                >
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Active
                                </Badge>
                              )}
                              {system && !isActive && (
                                <Badge
                                  className="bg-blue-100 text-blue-700 border-blue-200"
                                  data-testid={`badge-configured-${provider}`}
                                >
                                  Configured
                                </Badge>
                              )}
                            </div>
                            {!isActive && system && (
                              <Button
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={() =>
                                  setActivePaymentSystemMutation.mutate(
                                    provider,
                                  )
                                }
                                disabled={
                                  setActivePaymentSystemMutation.isPending
                                }
                                data-testid={`button-activate-${provider}`}
                              >
                                Set as Active
                              </Button>
                            )}
                          </div>

                          {system ? (
                            <div className="space-y-2.5 text-sm bg-slate-50 rounded-lg p-3 border border-slate-200">
                              <div className="flex items-center justify-between">
                                <span className="text-slate-600 font-medium">
                                  Public Key:
                                </span>
                                <span className="font-mono text-xs text-slate-900 bg-white px-2 py-1 rounded border border-slate-200">
                                  {system.publicKey ? "••••••••" : "Not set"}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-600 font-medium">
                                  Secret Key:
                                </span>
                                <span className="font-mono text-xs text-slate-900 bg-white px-2 py-1 rounded border border-slate-200">
                                  {system.secretKey ? "••••••••" : "Not set"}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-600 font-medium">
                                  Webhook Secret:
                                </span>
                                <span className="font-mono text-xs text-slate-900 bg-white px-2 py-1 rounded border border-slate-200">
                                  {system.webhookSecret
                                    ? "••••••••"
                                    : "Not set"}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
                              Not configured. Add credentials to enable this
                              payment provider.
                            </div>
                          )}

                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-4 border-slate-300 hover:bg-slate-100"
                            onClick={() =>
                              openConfigDialog(
                                provider as "stripe" | "paypal" | "square",
                              )
                            }
                            data-testid={`button-configure-${provider}`}
                          >
                            {system ? (
                              <>
                                <Edit2 className="w-4 h-4 mr-2" />
                                Edit Configuration
                              </>
                            ) : (
                              <>
                                <Plus className="w-4 h-4 mr-2" />
                                Configure {providerLabels[provider]}
                              </>
                            )}
                          </Button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Help Text */}
                  <div className="text-sm text-slate-700 mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-semibold text-blue-900">Note:</strong>{" "}
                        <span>Only one payment system can be active at a time. The active system will be used for all payment processing throughout the application. Set environment variables STRIPE_SECRET_KEY and STRIPE_PUBLIC_KEY for Stripe integration.</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* System Settings */}
        {visibleSettingsSection === "commission" && (
          <Card id="settings-section" data-testid="system-settings" className="border-slate-200 shadow-sm hover:shadow-md transition-shadow bg-white">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50/30 border-b border-slate-200">
              <CardTitle className="flex items-center gap-3 text-slate-900">
                <div className="bg-indigo-600 p-2 rounded-lg">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <span>System Commission Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {commissionLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin w-6 h-6 border-4 border-indigo-600 border-t-transparent rounded-full" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Description */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {systemCommission?.description ||
                        "Configure the commission percentage applied to ride total costs for driver payments when prices are not manually updated during dispatching."}
                    </p>
                  </div>

                  {/* Current Value Display */}
                  <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600 mb-1">Current Commission Rate</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-bold text-indigo-700">
                            {systemCommission?.percentage || 0}
                          </span>
                          <span className="text-2xl font-semibold text-indigo-600">%</span>
                        </div>
                      </div>
                      <div className="bg-white rounded-full p-4 shadow-sm">
                        <Settings className="w-8 h-8 text-indigo-600" />
                      </div>
                    </div>
                  </div>

                  {/* Update Form */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="bg-blue-100 p-1.5 rounded-lg">
                        <Settings className="w-4 h-4 text-blue-700" />
                      </div>
                      <h3 className="font-semibold text-slate-900">Update Commission</h3>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="commission-percentage" className="text-slate-700 font-medium flex items-center gap-2">
                          <span>Commission Percentage (%)</span>
                        </Label>
                        <Input
                          id="commission-percentage"
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={commissionPercentage}
                          onChange={(e) =>
                            setCommissionPercentage(e.target.value)
                          }
                          placeholder="Enter percentage (0-100)"
                          className="mt-2 border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                          data-testid="input-commission-percentage"
                        />
                        <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                          Enter a value between 0% and 100%
                        </p>
                      </div>

                      <Button
                        onClick={handleUpdateCommission}
                        disabled={updateCommissionMutation.isPending}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold w-full sm:w-auto"
                        data-testid="button-update-commission"
                      >
                        {updateCommissionMutation.isPending ? (
                          <>
                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                            Updating Commission...
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Update Commission Rate
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* How it Works */}
                  <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 border border-slate-200 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="bg-blue-600 p-1.5 rounded-lg">
                        <AlertCircle className="w-4 h-4 text-white" />
                      </div>
                      <h4 className="font-semibold text-slate-900">How Commission Works</h4>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 bg-white rounded-lg p-3 border border-slate-200">
                        <div className="bg-blue-100 rounded-full p-1 mt-0.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-slate-700 leading-relaxed">
                            When a booking is created, the system calculates the total ride cost based on distance, time, and vehicle type
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3 bg-white rounded-lg p-3 border border-slate-200">
                        <div className="bg-indigo-100 rounded-full p-1 mt-0.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-600"></div>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-slate-700 leading-relaxed">
                            The commission percentage is applied to determine the driver's payment (e.g., 25% commission means driver receives 75% of ride cost)
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3 bg-white rounded-lg p-3 border border-slate-200">
                        <div className="bg-green-100 rounded-full p-1 mt-0.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-600"></div>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-slate-700 leading-relaxed">
                            Admins and dispatchers can manually override the driver payment during dispatching for special circumstances
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3 bg-white rounded-lg p-3 border border-slate-200">
                        <div className="bg-amber-100 rounded-full p-1 mt-0.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-600"></div>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-slate-700 leading-relaxed">
                            This setting provides a consistent default commission rate when manual updates aren't made
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Email Settings */}
        {visibleSettingsSection === "email" && (
          <AdminEmailSettings user={user} />
        )}

        {/* SMS Settings */}
        {visibleSettingsSection === "sms" && <AdminSMSSettings />}

        {/* CMS - Pages Management */}
        {visibleCMSSection === "pages" && (
          <Card
            id="cms-section"
            data-testid="cms-pages-management"
            className="border-slate-200 shadow-sm hover:shadow-md transition-shadow bg-white"
          >
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50/30 border-b border-slate-200">
              <CardTitle className="flex items-center gap-3 text-slate-900">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <span>Pages Management</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <BrandSettings />
            </CardContent>
          </Card>
        )}

        {/* CMS - Media Management */}
        {visibleCMSSection === "media" && (
          <Card
            id="cms-section"
            data-testid="cms-media-management"
            className="border-slate-200 shadow-sm hover:shadow-md transition-shadow bg-white"
          >
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50/30 border-b border-slate-200">
              <CardTitle className="flex items-center gap-3 text-slate-900">
                <div className="bg-indigo-600 p-2 rounded-lg">
                  <Image className="w-5 h-5 text-white" />
                </div>
                <span>Media & Images Management</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <MediaLibrary />
            </CardContent>
          </Card>
        )}

        {/* CMS - Services Management */}
        {visibleCMSSection === "services" && (
          <Card
            id="cms-section"
            data-testid="cms-services-management"
            className="border-slate-200 shadow-sm hover:shadow-md transition-shadow bg-white"
          >
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50/30 border-b border-slate-200">
              <CardTitle className="flex items-center gap-3 text-slate-900">
                <div className="bg-purple-600 p-2 rounded-lg">
                  <Plane className="w-5 h-5 text-white" />
                </div>
                <span>Services Management</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ServiceCMS />
            </CardContent>
          </Card>
        )}

        {/* Bookings Management */}
        {showBookings && (
          <Card
            id="bookings-section"
            data-testid="bookings-management"
            className="border-slate-200 shadow-sm hover:shadow-md transition-shadow bg-white"
          >
            <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50/30 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3 text-slate-900">
                  <div className="bg-purple-600 p-2 rounded-lg">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <span>Bookings Management</span>
                </CardTitle>
                <Button
                  onClick={openAddBookingDialog}
                  size="sm"
                  data-testid="button-add-booking"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Booking
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {/* Segmented Status Menu */}
              <div className="mb-6 flex flex-wrap gap-2" data-testid="booking-segment-menu">
                <button
                  onClick={() => setBookingSegmentFilter("all")}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    bookingSegmentFilter === "all"
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                  data-testid="segment-all"
                >
                  All
                </button>
                <button
                  onClick={() => setBookingSegmentFilter("pending")}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    bookingSegmentFilter === "pending"
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                  data-testid="segment-pending"
                >
                  Pending
                </button>
                <button
                  onClick={() => setBookingSegmentFilter("confirmed")}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    bookingSegmentFilter === "confirmed"
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                  data-testid="segment-confirmed"
                >
                  Confirmed
                </button>
                <button
                  onClick={() => setBookingSegmentFilter("in_progress")}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    bookingSegmentFilter === "in_progress"
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                  data-testid="segment-in-progress"
                >
                  In Progress
                </button>
                <button
                  onClick={() => setBookingSegmentFilter("completed")}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    bookingSegmentFilter === "completed"
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                  data-testid="segment-completed"
                >
                  Completed
                </button>
                <button
                  onClick={() => setBookingSegmentFilter("cancelled")}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    bookingSegmentFilter === "cancelled"
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                  data-testid="segment-cancelled"
                >
                  Cancelled
                </button>
              </div>

              {/* Filters */}
              <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-slate-700 font-medium">Date From</Label>
                  <Input
                    className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 mt-2"
                    type="date"
                    value={bookingDateFrom}
                    onChange={(e) => setBookingDateFrom(e.target.value)}
                    data-testid="filter-date-from"
                  />
                </div>

                <div>
                  <Label className="text-slate-700 font-medium">Date To</Label>
                  <Input
                    className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 mt-2"
                    type="date"
                    value={bookingDateTo}
                    onChange={(e) => setBookingDateTo(e.target.value)}
                    data-testid="filter-date-to"
                  />
                </div>

                <div>
                  <Label className="text-slate-700 font-medium">Search</Label>
                  <Input
                    className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 mt-2"
                    placeholder="Passenger, Driver, ID..."
                    value={bookingSearch}
                    onChange={(e) => setBookingSearch(e.target.value)}
                    data-testid="filter-booking-search"
                  />
                </div>
              </div>

              {bookingsLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : filteredBookings && filteredBookings.length > 0 ? (
                <div className="space-y-4">
                  {filteredBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="border-2 border-slate-200 rounded-xl p-6 space-y-5 bg-gradient-to-br from-white to-slate-50/30 hover:shadow-lg hover:border-slate-300 transition-all"
                      data-testid={`booking-${booking.id}`}
                    >
                      <div className="flex justify-between items-start gap-6">
                        <div className="flex-1 space-y-4">
                          {/* Header Row */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4
                              className="font-bold text-slate-900 text-base"
                              data-testid={`booking-id-${booking.id}`}
                            >
                              #{booking.id.substring(0, 8).toUpperCase()}
                            </h4>
                            <Badge
                              className={
                                booking.status === "pending"
                                  ? "bg-amber-100 text-amber-800 border-amber-300 font-semibold"
                                  : booking.status === "confirmed"
                                    ? "bg-blue-100 text-blue-800 border-blue-300 font-semibold"
                                    : booking.status === "in_progress"
                                      ? "bg-purple-100 text-purple-800 border-purple-300 font-semibold"
                                      : booking.status === "completed"
                                        ? "bg-green-100 text-green-800 border-green-300 font-semibold"
                                        : "bg-red-100 text-red-800 border-red-300 font-semibold"
                              }
                              data-testid={`booking-status-${booking.id}`}
                            >
                              {booking.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                            <Badge
                              className="bg-slate-100 text-slate-800 border-slate-300 font-semibold"
                              data-testid={`booking-type-${booking.id}`}
                            >
                              {booking.bookingType.toUpperCase()}
                            </Badge>
                          </div>

                          {/* Booking Details Grid */}
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <p className="text-slate-600 text-xs font-semibold uppercase tracking-wide">Passenger</p>
                              <p
                                className="font-bold text-slate-900"
                                data-testid={`booking-passenger-${booking.id}`}
                              >
                                {booking.passengerName || "Not assigned"}
                              </p>
                            </div>

                            <div className="space-y-1">
                              <p className="text-slate-600 text-xs font-semibold uppercase tracking-wide">Pickup</p>
                              <p
                                className="font-semibold text-slate-900 leading-tight"
                                data-testid={`booking-pickup-${booking.id}`}
                              >
                                {booking.pickupAddress}
                              </p>
                            </div>

                            <div className="space-y-1">
                              <p className="text-slate-600 text-xs font-semibold uppercase tracking-wide">
                                Scheduled Time
                              </p>
                              <p
                                className="font-semibold text-slate-900"
                                data-testid={`booking-schedule-${booking.id}`}
                              >
                                {new Date(
                                  booking.scheduledDateTime,
                                ).toLocaleString()}
                              </p>
                            </div>

                            <div className="space-y-1">
                              <p className="text-slate-600 text-xs font-semibold uppercase tracking-wide">
                                Destination
                              </p>
                              <p
                                className="font-semibold text-slate-900 leading-tight"
                                data-testid={`booking-destination-${booking.id}`}
                              >
                                {booking.destinationAddress || "Hourly Service"}
                              </p>
                            </div>

                            {booking.specialInstructions && (
                              <div className="md:col-span-2 bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                                <p className="text-blue-900 font-bold text-sm mb-1.5 flex items-center gap-2">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Special Instructions
                                </p>
                                <p
                                  className="text-slate-700 leading-relaxed"
                                  data-testid={`booking-instructions-${booking.id}`}
                                >
                                  {booking.specialInstructions}
                                </p>
                              </div>
                            )}

                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-200">
                              <p className="text-slate-700 text-xs font-semibold mb-1">
                                Total Amount
                              </p>
                              <p
                                className="font-bold text-2xl text-blue-700"
                                data-testid={`booking-amount-${booking.id}`}
                              >
                                ${booking.totalAmount}
                              </p>
                            </div>

                            {booking.driverId && (
                              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-3 rounded-lg border border-green-200">
                                <p className="text-slate-700 text-xs font-semibold mb-1">
                                  Driver Payment
                                </p>
                                <p
                                  className="font-bold text-2xl text-green-700"
                                  data-testid={`booking-driver-payment-${booking.id}`}
                                >
                                  ${booking.driverPayment || "Not set"}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions Sidebar */}
                        <div className="flex flex-col gap-2.5 min-w-[180px]">
                          <Select
                            value={booking.status}
                            onValueChange={(value) =>
                              updateBookingStatusMutation.mutate({
                                bookingId: booking.id,
                                status: value,
                              })
                            }
                            disabled={updateBookingStatusMutation.isPending}
                          >
                            <SelectTrigger
                              className="w-full bg-white border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                              data-testid={`select-status-${booking.id}`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent
                              position="popper"
                              side="bottom"
                              align="start"
                              sideOffset={4}
                            >
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="confirmed">
                                Confirmed
                              </SelectItem>
                              <SelectItem value="in_progress">
                                In Progress
                              </SelectItem>
                              <SelectItem value="completed">
                                Completed
                              </SelectItem>
                              <SelectItem value="cancelled">
                                Cancelled
                              </SelectItem>
                            </SelectContent>
                          </Select>

                          {/* Driver Information */}
                          <div className="bg-white border-2 border-slate-200 rounded-lg p-3">
                            {booking.driverId ? (
                              <div
                                className="flex items-start gap-2"
                                data-testid={`booking-driver-${booking.id}`}
                              >
                                {booking.driverProfileImageUrl ? (
                                  <img
                                    src={booking.driverProfileImageUrl}
                                    alt="Driver"
                                    className="w-10 h-10 rounded-full object-cover border-2 border-slate-200"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-bold text-sm">
                                    {booking.driverFirstName?.[0]}
                                    {booking.driverLastName?.[0]}
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-slate-900 text-sm leading-tight">
                                    {booking.driverFirstName}{" "}
                                    {booking.driverLastName}
                                  </p>
                                  {booking.driverPhone && (
                                    <p className="text-xs text-slate-600 mt-0.5">
                                      {booking.driverPhone}
                                    </p>
                                  )}
                                  {booking.driverVehiclePlate && (
                                    <p className="text-xs font-mono bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded inline-block mt-1">
                                      {booking.driverVehiclePlate}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm text-slate-600 text-center py-1">
                                No driver assigned
                              </p>
                            )}
                          </div>

                          <Button
                            size="sm"
                            onClick={() => {
                              setAssigningBookingId(booking.id);
                              if (booking.driverId) {
                                setSelectedDriverForAssignment(booking.driverId);
                                setManualDriverPayment(booking.driverPayment || "");
                                setCalculatedDriverPayment(booking.driverPayment || "");
                              }
                              setAssignDriverDialogOpen(true);
                            }}
                            data-testid={`button-assign-driver-${booking.id}`}
                            className="w-full h-9 text-indigo-700 border-indigo-300 bg-indigo-50 hover:bg-indigo-100 font-semibold"
                            variant="outline"
                          >
                            <Car className="w-3.5 h-3.5 mr-1.5" />
                            {booking.driverId ? "Change" : "Assign"}
                          </Button>

                          <Button
                            size="sm"
                            onClick={() => openEditBookingDialog(booking)}
                            data-testid={`button-edit-booking-${booking.id}`}
                            className="w-full h-9 text-green-700 border-green-300 bg-green-50 hover:bg-green-100 font-semibold"
                            variant="outline"
                          >
                            <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                            Edit
                          </Button>

                          {booking.status !== "cancelled" && booking.status !== "completed" && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setBookingToCancel(booking.id);
                                setCancellationReason("");
                                setCancelDialogOpen(true);
                              }}
                              data-testid={`button-cancel-booking-${booking.id}`}
                              className="w-full h-9 text-orange-700 border-orange-300 bg-orange-50 hover:bg-orange-100 font-semibold"
                              variant="outline"
                            >
                              <X className="w-3.5 h-3.5 mr-1.5" />
                              Cancel
                            </Button>
                          )}

                          <Button
                            size="sm"
                            onClick={() => {
                              console.log('🗑️ Delete button clicked for booking:', booking.id);
                              setBookingToDelete(booking.id);
                              setDeleteConfirmDialogOpen(true);
                            }}
                            disabled={deleteBookingMutation.isPending}
                            data-testid={`button-delete-booking-${booking.id}`}
                            className="w-full h-9 text-red-700 border-red-300 bg-red-50 hover:bg-red-100 font-semibold"
                            variant="outline"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className="text-center p-12 bg-gradient-to-br from-slate-50 to-white border-2 border-slate-200 rounded-xl"
                  data-testid="no-bookings"
                >
                  <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-8 h-8 text-slate-600" />
                  </div>
                  <p className="text-slate-900 font-semibold text-lg mb-1">No bookings found</p>
                  <p className="text-slate-600">Bookings matching your filters will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Assign Driver Dialog - Unified with Payment Calculation */}
        <Dialog
          open={assignDriverDialogOpen}
          onOpenChange={(open) => {
            setAssignDriverDialogOpen(open);
            if (!open) {
              // Reset state when dialog closes
              setSelectedDriverForAssignment("");
              setCalculatedDriverPayment("");
              setManualDriverPayment("");
              setIsManualPaymentOverride(false);
            }
          }}
        >
          <DialogContent className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg bg-white">
            <DialogHeader>
              <DialogTitle>
                {assigningBookingId && bookings?.find(b => b.id === assigningBookingId)?.driverId 
                  ? "Change Driver & Update Payment" 
                  : "Assign Driver & Set Payment"}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Select a driver and review the auto-calculated payment amount
                based on system commission settings.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Select Driver</Label>
                <Select
                  value={selectedDriverForAssignment}
                  onValueChange={setSelectedDriverForAssignment}
                >
                  <SelectTrigger data-testid="select-driver-assignment">
                    <SelectValue placeholder="Choose a driver" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeDrivers?.map((driver) => (
                      <SelectItem key={driver.id} value={driver.id}>
                        {driver.firstName} {driver.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Show payment calculation when driver is selected */}
              {selectedDriverForAssignment && calculatedDriverPayment && (
                <div className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <p className="font-medium text-blue-900">
                        Driver Payment
                      </p>
                      <p className="text-xs text-blue-600">
                        Based on {systemCommission?.percentage}% system
                        commission
                      </p>
                    </div>
                    {isManualPaymentOverride && (
                      <Badge
                        variant="secondary"
                        className="bg-yellow-100 text-yellow-800"
                      >
                        Manual Override
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="driver-payment-amount">
                      Payment Amount ($)
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="driver-payment-amount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={manualDriverPayment}
                        onChange={(e) => {
                          setManualDriverPayment(e.target.value);
                          setIsManualPaymentOverride(true);
                        }}
                        placeholder="0.00"
                        data-testid="input-driver-payment-unified"
                      />
                      {isManualPaymentOverride && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setManualDriverPayment(calculatedDriverPayment);
                            setIsManualPaymentOverride(false);
                          }}
                          data-testid="button-reset-to-calculated"
                          className="whitespace-nowrap"
                        >
                          Reset
                        </Button>
                      )}
                    </div>
                    {!isManualPaymentOverride && (
                      <p className="text-xs text-blue-600">
                        Auto-calculated amount. You can edit if needed.
                      </p>
                    )}
                    {isManualPaymentOverride && (
                      <p className="text-xs text-yellow-600">
                        Original calculated: ${calculatedDriverPayment}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setAssignDriverDialogOpen(false)}
                  data-testid="button-cancel-assign"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (assigningBookingId && selectedDriverForAssignment) {
                      assignDriverMutation.mutate({
                        bookingId: assigningBookingId,
                        driverId: selectedDriverForAssignment,
                        driverPayment: manualDriverPayment || undefined,
                      });
                    }
                  }}
                  disabled={
                    !selectedDriverForAssignment ||
                    !manualDriverPayment ||
                    assignDriverMutation.isPending
                  }
                  data-testid="button-confirm-assign"
                >
                  {assignDriverMutation.isPending
                    ? (assigningBookingId && bookings?.find(b => b.id === assigningBookingId)?.driverId ? "Updating..." : "Assigning...")
                    : (assigningBookingId && bookings?.find(b => b.id === assigningBookingId)?.driverId ? "Update Driver" : "Assign Driver")}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Driver Payment Dialog */}
        <Dialog
          open={editDriverPaymentDialogOpen}
          onOpenChange={setEditDriverPaymentDialogOpen}
        >
          <DialogContent className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg bg-white">
            <DialogHeader>
              <DialogTitle>Edit Driver Payment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="driver-payment">
                  Driver Payment Amount ($)
                </Label>
                <Input
                  id="driver-payment"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newDriverPayment}
                  onChange={(e) => setNewDriverPayment(e.target.value)}
                  placeholder="0.00"
                  data-testid="input-driver-payment"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  This is the amount the driver will receive for completing this
                  ride.
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setEditDriverPaymentDialogOpen(false)}
                  data-testid="button-cancel-edit-payment"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (editingDriverPaymentBookingId && newDriverPayment) {
                      updateDriverPaymentMutation.mutate({
                        bookingId: editingDriverPaymentBookingId,
                        driverPayment: newDriverPayment,
                      });
                    }
                  }}
                  disabled={
                    !newDriverPayment || updateDriverPaymentMutation.isPending
                  }
                  data-testid="button-save-driver-payment"
                >
                  {updateDriverPaymentMutation.isPending
                    ? "Saving..."
                    : "Save Payment"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* New Redesigned Booking Details Dialog */}
        <BookingDetailsDialog
          open={bookingDialogOpen}
          onOpenChange={setBookingDialogOpen}
          formData={bookingFormData}
          setFormData={setBookingFormData}
          editingBooking={editingBooking}
          onSave={() => saveBookingMutation.mutate(bookingFormData)}
          isSaving={saveBookingMutation.isPending}
          vehicleTypes={vehicleTypes || []}
          allUsers={allUsers || []}
          activeDrivers={activeDrivers || []}
          selectedDriverId={selectedDriverForAssignment}
          setSelectedDriverId={setSelectedDriverForAssignment}
          driverPayment={manualDriverPayment}
          setDriverPayment={setManualDriverPayment}
          onCalculatePrice={handleCalculatePrice}
          isCalculatingPrice={calculatingPrice}
          calculatedPrice={calculatedPrice}
          userSearchQuery={userSearchQuery}
          setUserSearchQuery={setUserSearchQuery}
          selectedFlight={selectedFlight}
          systemCommission={systemCommission}
          setSelectedFlight={setSelectedFlight}
          flightSearchInput={flightSearchInput}
          setFlightSearchInput={setFlightSearchInput}
          onFlightSearch={handleFlightSearch}
          isSearchingFlight={isSearchingFlight}
          onAssignDriver={(bookingId, driverId, driverPayment) => {
            assignDriverMutation.mutate({ bookingId, driverId, driverPayment });
          }}
          isAssigningDriver={assignDriverMutation.isPending}
          onToggleNoShow={(bookingId, noShow) => {
            toggleNoShowMutation.mutate({ bookingId, noShow });
          }}
          onSendRefundInvoice={(bookingId) => {
            sendRefundInvoiceMutation.mutate(bookingId);
          }}
          onMarkCompleted={(bookingId) => {
            markCompletedMutation.mutate(bookingId);
          }}
        />

        {/* OLD BOOKING DIALOG - TEMPORARILY DISABLED (set open to false) */}
        <Dialog open={false} onOpenChange={() => {}}>
          <DialogContent className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-4xl translate-x-[-50%] translate-y-[-50%] gap-4 border p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg max-h-[90vh] overflow-y-auto bg-[#e1faaf]">
            <DialogHeader className="flex flex-col space-y-1.5 text-center sm:text-left bg-[#e1faaf] text-[#d82527] font-bold text-[18px]">
              <DialogTitle className="text-lg leading-none tracking-tight font-bold">
                {editingBooking ? "Edit Booking" : "Add New Booking"}
              </DialogTitle>
              <DialogDescription className="text-[black] font-normal text-[12px]">
                {editingBooking
                  ? "Update the booking details below."
                  : "Fill in the details to create a new booking."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 pt-[5px] pb-[5px] bg-[#e1faaf]">
              <div className="space-y-2">
                <Label htmlFor="passenger">Passenger *</Label>
                <div className="relative">
                  <Input
                    id="passenger"
                    type="text"
                    placeholder="Search by name, email, or phone..."
                    value={(() => {
                      if (!bookingFormData.passengerId) return "";
                      const selectedPassenger = allUsers?.find(
                        (u) => u.id === bookingFormData.passengerId,
                      );
                      if (selectedPassenger) {
                        return `${selectedPassenger.firstName} ${selectedPassenger.lastName} (${selectedPassenger.email}) - ${selectedPassenger.phone || "N/A"}`;
                      }
                      return "";
                    })()}
                    onChange={(e) => {
                      const searchQuery = e.target.value;
                      // Clear selection when user starts typing
                      if (bookingFormData.passengerId) {
                        setBookingFormData({
                          ...bookingFormData,
                          passengerId: "",
                        });
                      }
                      setUserSearchQuery(searchQuery);
                    }}
                    onFocus={() => {
                      // Open dropdown on focus by setting a space if empty
                      if (!userSearchQuery && !bookingFormData.passengerId) {
                        setUserSearchQuery(" ");
                      }
                    }}
                    className="pl-[5px] pr-[5px] pt-[5px] pb-[5px] mt-[5px] mb-[5px] bg-white"
                    data-testid="input-passenger-search"
                  />
                  {userSearchQuery && allUsers && allUsers.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {allUsers
                        .filter((u) => u.role === "passenger")
                        .filter((u) => {
                          const query = userSearchQuery.trim().toLowerCase();
                          if (!query) return true; // Show all if empty/space
                          return (
                            u.firstName?.toLowerCase().includes(query) ||
                            u.lastName?.toLowerCase().includes(query) ||
                            u.email?.toLowerCase().includes(query) ||
                            u.phone?.toLowerCase().includes(query) ||
                            `${u.firstName} ${u.lastName}`
                              .toLowerCase()
                              .includes(query)
                          );
                        })
                        .map((passenger) => (
                          <button
                            key={passenger.id}
                            type="button"
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                            onClick={() => {
                              setBookingFormData({
                                ...bookingFormData,
                                passengerId: passenger.id,
                              });
                              setUserSearchQuery("");
                            }}
                            data-testid={`passenger-option-${passenger.id}`}
                          >
                            {passenger.firstName} {passenger.lastName} (
                            {passenger.email}) - {passenger.phone || "N/A"}
                          </button>
                        ))
                        .slice(0, 10)}
                      {allUsers.filter((u) => u.role === "passenger").length ===
                        0 && (
                        <div className="p-4 text-sm text-center bg-[#ebe6d3]">
                          No passengers available
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="booking-type">Booking Type *</Label>
                  <Select
                    value={bookingFormData.bookingType}
                    onValueChange={(value) =>
                      setBookingFormData({
                        ...bookingFormData,
                        bookingType: value as "transfer" | "hourly",
                      })
                    }
                  >
                    <SelectTrigger
                      id="booking-type"
                      className="bg-white text-[12px] pt-[5px] pb-[5px] pl-[5px] pr-[5px] mt-[5px] mb-[5px] text-[#000000]"
                      data-testid="select-booking-type"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="transfer">Transfer</SelectItem>
                      <SelectItem value="hourly">Hourly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vehicle-type">Vehicle Type *</Label>
                  <Select
                    value={bookingFormData.vehicleTypeId}
                    onValueChange={(value) =>
                      setBookingFormData({
                        ...bookingFormData,
                        vehicleTypeId: value,
                      })
                    }
                  >
                    <SelectTrigger
                      id="vehicle-type"
                      className="bg-white text-[12px] pt-[5px] pb-[5px] pl-[5px] pr-[5px] mt-[5px] mb-[5px] text-[#000000]"
                      data-testid="select-vehicle-type"
                    >
                      <SelectValue placeholder="Select vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicleTypes?.map((vt) => (
                        <SelectItem key={vt.id} value={vt.id}>
                          {vt.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <AddressAutocomplete
                id="pickup-address"
                label="Pickup Address"
                value={bookingFormData.pickupAddress}
                onChange={(value, coords) => {
                  setBookingFormData({
                    ...bookingFormData,
                    pickupAddress: value,
                    pickupCoords: coords || null,
                  });
                }}
                placeholder="Enter pickup address"
                userId={bookingFormData.passengerId}
                required={true}
                data-testid="input-pickup-address"
              />

              <AddressAutocomplete
                id="destination-address"
                label="Destination Address"
                value={bookingFormData.destinationAddress}
                onChange={(value, coords) => {
                  setBookingFormData({
                    ...bookingFormData,
                    destinationAddress: value,
                    destinationCoords: coords || null,
                  });
                }}
                placeholder={
                  bookingFormData.bookingType === "hourly"
                    ? "N/A for hourly service"
                    : "Enter destination address"
                }
                userId={bookingFormData.passengerId}
                disabled={bookingFormData.bookingType === "hourly"}
                required={bookingFormData.bookingType === "transfer"}
                data-testid="input-destination-address"
              />

              {bookingFormData.bookingType === "hourly" && (
                <div className="space-y-2">
                  <Label htmlFor="requested-hours">Duration (Hours) *</Label>
                  <Select
                    value={bookingFormData.requestedHours}
                    onValueChange={(value) =>
                      setBookingFormData({
                        ...bookingFormData,
                        requestedHours: value,
                      })
                    }
                  >
                    <SelectTrigger
                      id="requested-hours"
                      className="bg-white text-[12px] pt-[5px] pb-[5px] pl-[5px] pr-[5px] mt-[5px] mb-[5px] text-[#000000]"
                      data-testid="select-requested-hours"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 hours</SelectItem>
                      <SelectItem value="3">3 hours</SelectItem>
                      <SelectItem value="4">4 hours</SelectItem>
                      <SelectItem value="5">5 hours</SelectItem>
                      <SelectItem value="6">6 hours</SelectItem>
                      <SelectItem value="8">8 hours</SelectItem>
                      <SelectItem value="10">10 hours</SelectItem>
                      <SelectItem value="12">12 hours</SelectItem>
                      <SelectItem value="24">24 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="scheduled-datetime">
                    Scheduled Date & Time *
                  </Label>
                  <Input
                    id="scheduled-datetime"
                    type="datetime-local"
                    value={bookingFormData.scheduledDateTime}
                    onChange={(e) =>
                      setBookingFormData({
                        ...bookingFormData,
                        scheduledDateTime: e.target.value,
                      })
                    }
                    data-testid="input-scheduled-datetime"
                    className="pl-[5px] pr-[5px] pt-[5px] pb-[5px] mt-[5px] mb-[5px] bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="total-amount">Total Amount *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="total-amount"
                      type="number"
                      step="0.01"
                      value={bookingFormData.totalAmount}
                      onChange={(e) =>
                        setBookingFormData({
                          ...bookingFormData,
                          totalAmount: e.target.value,
                        })
                      }
                      placeholder="0.00"
                      data-testid="input-total-amount"
                      className="flex-1 pl-[5px] pr-[5px] pt-[5px] pb-[5px] mt-[5px] mb-[5px] bg-white"
                    />
                    <Button
                      type="button"
                      onClick={handleCalculatePrice}
                      disabled={
                        calculatingPrice ||
                        !bookingFormData.vehicleTypeId ||
                        !bookingFormData.pickupAddress ||
                        (bookingFormData.bookingType === "transfer" &&
                          !bookingFormData.destinationAddress)
                      }
                      variant="outline"
                      data-testid="button-calculate-price"
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 pt-[5px] pb-[5px] pl-[5px] pr-[5px] text-[12px] bg-[#3c82bb] text-[#ffffff] font-bold"
                    >
                      {calculatingPrice ? "Calculating..." : "Calculate"}
                    </Button>
                  </div>
                  {calculatedPrice && (
                    <p className="text-xs text-muted-foreground">
                      Calculated: ${calculatedPrice} (editable)
                    </p>
                  )}
                </div>
              </div>

              {/* Passenger Details Section */}
              <div className="border-t pt-4 mt-4 bg-[#e1faaf] text-[12px]">
                <h3 className="text-[#d82527] text-[16px] mt-[5px] mb-[5px] font-bold">
                  Passenger & Luggage Details
                </h3>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label htmlFor="passenger-count">Passengers *</Label>
                    <Input
                      id="passenger-count"
                      type="number"
                      min="1"
                      value={bookingFormData.passengerCount}
                      onChange={(e) =>
                        setBookingFormData({
                          ...bookingFormData,
                          passengerCount: parseInt(e.target.value) || 1,
                        })
                      }
                      data-testid="input-passenger-count"
                      className="pl-[5px] pr-[5px] pt-[5px] pb-[5px] mt-[5px] mb-[5px] bg-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="luggage-count">Luggage Count</Label>
                    <Input
                      id="luggage-count"
                      type="number"
                      min="0"
                      value={bookingFormData.luggageCount}
                      onChange={(e) =>
                        setBookingFormData({
                          ...bookingFormData,
                          luggageCount: parseInt(e.target.value) || 0,
                        })
                      }
                      data-testid="input-luggage-count"
                      className="pl-[5px] pr-[5px] pt-[5px] pb-[5px] mt-[5px] mb-[5px] bg-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="baby-seat"
                      className="flex items-center gap-2"
                    >
                      <input
                        id="baby-seat"
                        type="checkbox"
                        checked={bookingFormData.babySeat}
                        onChange={(e) =>
                          setBookingFormData({
                            ...bookingFormData,
                            babySeat: e.target.checked,
                          })
                        }
                        className="w-4 h-4"
                        data-testid="checkbox-baby-seat"
                      />
                      Baby Seat
                    </Label>
                  </div>
                </div>
              </div>

              {/* Book for Another Person Section */}
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <input
                    id="booking-for-toggle"
                    type="checkbox"
                    checked={bookingFormData.bookingFor === "someone_else"}
                    onChange={(e) =>
                      setBookingFormData({
                        ...bookingFormData,
                        bookingFor: e.target.checked ? "someone_else" : "self",
                      })
                    }
                    className="w-4 h-4"
                    data-testid="checkbox-booking-for"
                  />
                  <Label
                    htmlFor="booking-for-toggle"
                    className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-[#1c73ba] font-bold text-[16px]"
                  >
                    Book for Another Person
                  </Label>
                </div>

                {bookingFormData.bookingFor === "someone_else" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="passenger-name">Passenger Name *</Label>
                      <Input
                        id="passenger-name"
                        value={bookingFormData.passengerName}
                        onChange={(e) =>
                          setBookingFormData({
                            ...bookingFormData,
                            passengerName: e.target.value,
                          })
                        }
                        placeholder="Full name"
                        data-testid="input-passenger-name"
                        className="pl-[5px] pr-[5px] pt-[5px] pb-[5px] mt-[5px] mb-[5px] bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="passenger-email">
                          Passenger Email *
                        </Label>
                        <Input
                          id="passenger-email"
                          type="email"
                          value={bookingFormData.passengerEmail}
                          onChange={(e) =>
                            setBookingFormData({
                              ...bookingFormData,
                              passengerEmail: e.target.value,
                            })
                          }
                          placeholder="email@example.com"
                          data-testid="input-passenger-email"
                          className="pl-[5px] pr-[5px] pt-[5px] pb-[5px] mt-[5px] mb-[5px] bg-white"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="passenger-phone">
                          Passenger Phone *
                        </Label>
                        <Input
                          id="passenger-phone"
                          type="tel"
                          value={bookingFormData.passengerPhone}
                          onChange={(e) =>
                            setBookingFormData({
                              ...bookingFormData,
                              passengerPhone: e.target.value,
                            })
                          }
                          placeholder="+1234567890"
                          data-testid="input-passenger-phone"
                          className="pl-[5px] pr-[5px] pt-[5px] pb-[5px] mt-[5px] mb-[5px] bg-white"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Flight Information Section */}
              <div className="border-t pt-4 mt-4 bg-[#e1faaf] text-[12px]">
                <h3 className="text-[#d82527] text-[16px] mt-[5px] mb-[5px] font-bold">
                  Flight Information (Optional)
                </h3>

                {/* Show existing flight info when editing */}
                {editingBooking &&
                  bookingFormData.flightNumber &&
                  !selectedFlight && (
                    <div
                      className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg"
                      data-testid="existing-flight-info"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Plane className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="font-bold text-blue-800">
                              Current Flight Information
                            </p>
                            <p className="text-sm text-blue-700">
                              {bookingFormData.flightAirline} - Flight{" "}
                              {bookingFormData.flightNumber}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm mt-3">
                        {bookingFormData.flightDepartureAirport && (
                          <div>
                            <p className="text-xs text-blue-600 font-medium">
                              Departure
                            </p>
                            <p className="text-blue-800">
                              {bookingFormData.flightDepartureAirport}
                            </p>
                          </div>
                        )}
                        {bookingFormData.flightArrivalAirport && (
                          <div>
                            <p className="text-xs text-blue-600 font-medium">
                              Arrival
                            </p>
                            <p className="text-blue-800">
                              {bookingFormData.flightArrivalAirport}
                            </p>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-blue-600 mt-3 italic">
                        This is the recorded flight information. Search below to
                        update.
                      </p>
                    </div>
                  )}

                <p className="text-sm text-muted-foreground mb-3">
                  {editingBooking && bookingFormData.flightNumber
                    ? "Search for a new flight to update the flight information."
                    : "Search for a flight by entering the flight number below. The system will automatically populate flight details."}
                </p>

                <div className="flex gap-2 mb-3">
                  <div className="flex-1">
                    <Input
                      placeholder="Enter flight number (e.g., UA2346, DL3427)"
                      value={flightSearchInput}
                      onChange={(e) =>
                        setFlightSearchInput(e.target.value.toUpperCase())
                      }
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleFlightSearch();
                        }
                      }}
                      data-testid="input-flight-search"
                      className="pl-[5px] pr-[5px] pt-[5px] pb-[5px] mt-[5px] mb-[5px] bg-white"
                    />
                  </div>
                  <Button
                    onClick={handleFlightSearch}
                    disabled={isSearchingFlight || !flightSearchInput.trim()}
                    className="hover:bg-primary/90 text-white px-6 bg-[#3d82ba] font-bold"
                    data-testid="button-find-flight"
                  >
                    {isSearchingFlight ? (
                      "Searching..."
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        {editingBooking && bookingFormData.flightNumber
                          ? "Update Flight"
                          : "Find Flight"}
                      </>
                    )}
                  </Button>
                </div>

                {/* Recorded Flight Information Display */}
                <div className="mt-6 mb-4">
                  {!editingBooking &&
                    !bookingFormData.flightNumber &&
                    !selectedFlight && (
                      <div
                        className="p-3 bg-red-50 border border-red-200 rounded-lg"
                        data-testid="no-flight-warning"
                      >
                        <p className="text-red-600 font-medium text-sm">
                          If you need to add flight information, please use
                          search above!
                        </p>
                      </div>
                    )}

                  {!editingBooking &&
                    bookingFormData.flightNumber &&
                    !selectedFlight && (
                      <div
                        className="p-4 bg-white border border-gray-300 rounded-lg"
                        data-testid="recorded-flight-display"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <Plane className="w-5 h-5 text-gray-700" />
                          <div>
                            <p className="font-bold text-black">
                              Recorded Flight Information
                            </p>
                            <p className="text-sm text-black">
                              {bookingFormData.flightAirline} - Flight{" "}
                              {bookingFormData.flightNumber}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          {bookingFormData.flightDepartureAirport && (
                            <div>
                              <p className="text-xs text-gray-600 font-medium">
                                Departure
                              </p>
                              <p className="text-black">
                                {bookingFormData.flightDepartureAirport}
                              </p>
                            </div>
                          )}
                          {bookingFormData.flightArrivalAirport && (
                            <div>
                              <p className="text-xs text-gray-600 font-medium">
                                Arrival
                              </p>
                              <p className="text-black">
                                {bookingFormData.flightArrivalAirport}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                </div>

                {selectedFlight && (
                  <div
                    className="mt-3 p-5 bg-green-50 border border-green-200 rounded-lg"
                    data-testid="selected-flight-info"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Plane className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="font-bold text-green-800">
                            {selectedFlight.airline}
                          </p>
                          <p className="text-sm font-semibold text-green-700">
                            Flight {selectedFlight.flightNumber}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedFlight(null);
                          setFlightSearchInput("");
                          setBookingFormData({
                            ...bookingFormData,
                            flightNumber: "",
                            flightAirline: "",
                            flightDepartureAirport: "",
                            flightArrivalAirport: "",
                          });
                        }}
                        className="text-green-600 hover:text-green-800 text-sm font-medium"
                        data-testid="button-clear-flight"
                      >
                        Clear
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-green-600 font-medium">
                            Departure
                          </p>
                          <p className="text-green-800 font-semibold">
                            {selectedFlight.departureAirport}
                          </p>
                          {selectedFlight.departureTime !== "N/A" && (
                            <p className="text-green-700 text-xs">
                              {new Date(
                                selectedFlight.departureTime,
                              ).toLocaleString()}
                            </p>
                          )}
                          {selectedFlight.departureTerminal !== "N/A" && (
                            <p className="text-green-600 text-xs">
                              Terminal: {selectedFlight.departureTerminal}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-green-600 font-medium">
                            Arrival
                          </p>
                          <p className="text-green-800 font-semibold">
                            {selectedFlight.arrivalAirport}
                          </p>
                          {selectedFlight.arrivalTime !== "N/A" && (
                            <p className="text-green-700 text-xs">
                              {new Date(
                                selectedFlight.arrivalTime,
                              ).toLocaleString()}
                            </p>
                          )}
                          {selectedFlight.arrivalTerminal !== "N/A" && (
                            <p className="text-green-600 text-xs">
                              Terminal: {selectedFlight.arrivalTerminal}
                            </p>
                          )}
                          {selectedFlight.baggageClaim !== "N/A" && (
                            <p className="text-green-600 text-xs">
                              Baggage: {selectedFlight.baggageClaim}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {selectedFlight.aircraft !== "N/A" && (
                      <div className="mt-3 pt-3 border-t border-green-200">
                        <p className="text-xs text-green-600">
                          Aircraft:{" "}
                          <span className="text-green-700 font-medium">
                            {selectedFlight.aircraft}
                          </span>
                        </p>
                      </div>
                    )}

                    <p className="text-xs text-green-600 mt-3 italic">
                      {editingBooking
                        ? "Updated flight information will be saved to your booking"
                        : "Flight information added to your booking"}
                    </p>
                  </div>
                )}
              </div>

              {/* Additional Information Section */}
              <div className="border-t pt-4 mt-4 bg-[#e1faaf] text-[12px]">
                <h3 className="text-[#d82527] text-[16px] mt-[5px] mb-[5px] font-bold">
                  Special Instructions / Notes
                </h3>
                <div className="space-y-2">
                  <textarea
                    id="special-instructions"
                    value={bookingFormData.specialInstructions}
                    onChange={(e) =>
                      setBookingFormData({
                        ...bookingFormData,
                        specialInstructions: e.target.value,
                      })
                    }
                    placeholder="Any special requests, dietary requirements, or accessibility needs..."
                    className="w-full min-h-[100px] p-2 border rounded-md"
                    data-testid="textarea-special-instructions"
                  />
                </div>
              </div>

              <div className="border-t pt-4 mt-4 space-y-2 bg-[#e1faaf] text-[12px]">
                <h3 className="text-[#d82527] text-[16px] mt-[5px] mb-[5px] font-bold">
                  Status *
                </h3>
                <Select
                  value={bookingFormData.status}
                  onValueChange={(value) =>
                    setBookingFormData({
                      ...bookingFormData,
                      status: value as any,
                    })
                  }
                >
                  <SelectTrigger
                    id="booking-status"
                    className="bg-white text-[12px] pt-[5px] pb-[5px] pl-[5px] pr-[5px] mt-[5px] mb-[5px] text-[#000000]"
                    data-testid="select-booking-status"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setBookingDialogOpen(false)}
                data-testid="button-cancel-booking"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const bookingData = {
                    passengerId: bookingFormData.passengerId,
                    vehicleTypeId: bookingFormData.vehicleTypeId,
                    bookingType: bookingFormData.bookingType,
                    pickupAddress: bookingFormData.pickupAddress,
                    destinationAddress:
                      bookingFormData.bookingType === "transfer"
                        ? bookingFormData.destinationAddress
                        : undefined,
                    scheduledDateTime: new Date(
                      bookingFormData.scheduledDateTime,
                    ),
                    totalAmount: bookingFormData.totalAmount.toString(),
                    status: bookingFormData.status,
                    bookingFor: bookingFormData.bookingFor,
                    passengerName: bookingFormData.passengerName || undefined,
                    passengerPhone: bookingFormData.passengerPhone || undefined,
                    passengerEmail: bookingFormData.passengerEmail || undefined,
                    passengerCount: bookingFormData.passengerCount,
                    luggageCount: bookingFormData.luggageCount,
                    babySeat: bookingFormData.babySeat,
                    specialInstructions:
                      bookingFormData.specialInstructions || undefined,
                    flightNumber: bookingFormData.flightNumber || undefined,
                    flightAirline: bookingFormData.flightAirline || undefined,
                    flightDepartureAirport:
                      bookingFormData.flightDepartureAirport || undefined,
                    flightArrivalAirport:
                      bookingFormData.flightArrivalAirport || undefined,
                  };
                  saveBookingMutation.mutate(bookingData);
                }}
                disabled={
                  saveBookingMutation.isPending ||
                  !bookingFormData.passengerId ||
                  !bookingFormData.pickupAddress ||
                  !bookingFormData.scheduledDateTime ||
                  !bookingFormData.totalAmount ||
                  !bookingFormData.vehicleTypeId ||
                  (bookingFormData.bookingType === "transfer" &&
                    !bookingFormData.destinationAddress)
                }
                data-testid="button-save-booking"
              >
                {saveBookingMutation.isPending
                  ? "Saving..."
                  : editingBooking
                    ? "Update Booking"
                    : "Create Booking"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* User Accounts Management */}
        {showUserManager && (
          <Card id="user-manager-section" data-testid="user-accounts" className="border-slate-200 shadow-sm hover:shadow-md transition-shadow bg-white">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50/30 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3 text-slate-900">
                  <div className="bg-purple-600 p-2 rounded-lg">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <span>
                    {selectedUserType === "all"
                      ? "All Users"
                      : selectedUserType === "passenger"
                        ? "Passengers"
                        : selectedUserType === "driver"
                          ? "Drivers"
                          : selectedUserType === "dispatcher"
                            ? "Dispatchers"
                            : "Admins"}
                  </span>
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => backfillDriversMutation.mutate()}
                    disabled={backfillDriversMutation.isPending}
                    variant="outline"
                    size="sm"
                    className="border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300"
                    data-testid="button-backfill-drivers"
                  >
                    {backfillDriversMutation.isPending ? (
                      <div className="animate-spin w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full mr-2" />
                    ) : (
                      <Check className="w-4 h-4 mr-2" />
                    )}
                    Fix Driver Records
                  </Button>
                  <Button
                    onClick={openAddUserDialog}
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                    data-testid="button-add-user"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add User
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {usersLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin w-6 h-6 border-4 border-purple-600 border-t-transparent rounded-full" />
                </div>
              ) : allUsers && allUsers.length > 0 ? (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600">
                    Manage user accounts, roles, and permissions across your platform.
                  </p>

                  {/* Search Input */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        type="text"
                        placeholder="Search by name, email, or phone..."
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        className="pl-10 border-slate-300 focus:border-purple-500 focus:ring-purple-500"
                        data-testid="input-search-users"
                      />
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-slate-50 to-purple-50/20 border-b border-slate-200">
                        <tr>
                          <th className="text-left p-4 text-sm font-semibold text-slate-700">
                            User
                          </th>
                          <th className="text-left p-4 text-sm font-semibold text-slate-700">
                            Email
                          </th>
                          <th className="text-left p-4 text-sm font-semibold text-slate-700">
                            Role
                          </th>
                          <th className="text-left p-4 text-sm font-semibold text-slate-700">
                            Status
                          </th>
                          <th className="text-left p-4 text-sm font-semibold text-slate-700">
                            Star Rating
                          </th>
                          <th className="text-left p-4 text-sm font-semibold text-slate-700">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {allUsers
                          .filter(
                            (u) =>
                              selectedUserType === "all" ||
                              u.role === selectedUserType,
                          )
                          .filter((u) => {
                            if (!userSearchQuery) return true;
                            const query = userSearchQuery.toLowerCase();
                            return (
                              u.firstName?.toLowerCase().includes(query) ||
                              u.lastName?.toLowerCase().includes(query) ||
                              u.email?.toLowerCase().includes(query) ||
                              u.phone?.toLowerCase().includes(query) ||
                              `${u.firstName} ${u.lastName}`
                                .toLowerCase()
                                .includes(query)
                            );
                          })
                          .map((u) => (
                            <tr
                              key={u.id}
                              className="border-t border-slate-200 hover:bg-purple-50/20 transition-colors"
                              data-testid={`user-row-${u.id}`}
                            >
                              <td className="p-4">
                                <div>
                                  <p
                                    className="font-semibold text-slate-900"
                                    data-testid={`user-name-${u.id}`}
                                  >
                                    {u.firstName} {u.lastName}
                                  </p>
                                  <p className="text-xs text-slate-500 mt-0.5">
                                    Joined{" "}
                                    {new Date(u.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </td>
                              <td className="p-4">
                                <p
                                  className="text-sm text-slate-700 font-medium"
                                  data-testid={`user-email-${u.id}`}
                                >
                                  {u.email}
                                </p>
                                {u.phone && (
                                  <p className="text-xs text-slate-500 mt-0.5">
                                    {u.phone}
                                  </p>
                                )}
                              </td>
                              <td className="p-4">
                                <Select
                                  value={u.role}
                                  onValueChange={(role) =>
                                    updateUserMutation.mutate({
                                      id: u.id,
                                      updates: {
                                        role: role as
                                          | "passenger"
                                          | "driver"
                                          | "dispatcher"
                                          | "admin",
                                      },
                                    })
                                  }
                                  disabled={updateUserMutation.isPending}
                                >
                                  <SelectTrigger
                                    className="w-32 border-slate-300"
                                    data-testid={`select-role-${u.id}`}
                                  >
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-white">
                                    <SelectItem value="passenger">
                                      Passenger
                                    </SelectItem>
                                    <SelectItem value="driver">
                                      Driver
                                    </SelectItem>
                                    <SelectItem value="dispatcher">
                                      Dispatcher
                                    </SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="p-3">
                                <Select
                                  value={u.isActive ? "active" : "inactive"}
                                  onValueChange={(value) =>
                                    updateUserMutation.mutate({
                                      id: u.id,
                                      updates: { isActive: value === "active" },
                                    })
                                  }
                                  disabled={updateUserMutation.isPending}
                                >
                                  <SelectTrigger
                                    className="w-28 border-slate-300"
                                    data-testid={`select-status-${u.id}`}
                                  >
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-white">
                                    <SelectItem value="active">
                                      Active
                                    </SelectItem>
                                    <SelectItem value="inactive">
                                      Inactive
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="p-3">
                                {u.role === "driver" &&
                                (u as any).driverInfo ? (
                                  <div
                                    className="flex items-center gap-1"
                                    data-testid={`driver-rating-${u.id}`}
                                  >
                                    <span className="text-sm font-medium text-slate-900">
                                      {parseFloat(
                                        (u as any).driverInfo.rating || "0",
                                      ).toFixed(1)}
                                    </span>
                                    <div className="flex">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <svg
                                          key={star}
                                          className={`w-4 h-4 ${
                                            star <=
                                            Math.round(
                                              parseFloat(
                                                (u as any).driverInfo?.rating ||
                                                  "0",
                                              ),
                                            )
                                              ? "text-amber-400 fill-current"
                                              : "text-slate-300"
                                          }`}
                                          fill="none"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth="2"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                        >
                                          <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                        </svg>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-sm text-slate-500">
                                    N/A
                                  </span>
                                )}
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  {u.role === "driver" && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300"
                                      onClick={() => {
                                        setSelectedDriverForDocs(u);
                                        setDocumentsDialogOpen(true);
                                      }}
                                      data-testid={`button-documents-${u.id}`}
                                    >
                                      <FileText className="w-3.5 h-3.5 mr-1.5" />
                                      Docs
                                    </Button>
                                  )}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300"
                                    onClick={() => openEditUserDialog(u)}
                                    data-testid={`button-edit-user-${u.id}`}
                                  >
                                    <Pencil className="w-3.5 h-3.5 mr-1.5" />
                                    Edit
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                                    onClick={() => {
                                      setUserToDelete(u);
                                      setDeleteUserDialogOpen(true);
                                    }}
                                    disabled={deleteUserMutation.isPending}
                                    data-testid={`button-delete-user-${u.id}`}
                                  >
                                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                                    Delete
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="text-sm text-slate-700 p-4 bg-purple-50 rounded-xl border border-purple-200">
                    <div className="flex items-start gap-2">
                      <Star className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-semibold text-purple-900">About Star Ratings:</strong>{" "}
                        <span>Driver ratings are calculated from passenger feedback after completed rides. All ratings use a 5-star scale and are only displayed for users with the driver role.</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className="text-center p-8 text-slate-500"
                  data-testid="no-users"
                >
                  No users found.
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Vehicle Type Management Section */}
        {showVehicleTypes && (
          <div id="vehicle-types-section" className="space-y-6">
            <VehicleTypeManagement />
          </div>
        )}

        {/* Invoice Management Section */}
        {showInvoices && (
          <div id="invoices-section" className="space-y-6">
            {/* Modern Header */}
            <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow bg-white">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50/30 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-600 p-2 rounded-lg">
                    <Receipt className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-slate-900">Invoice Management</CardTitle>
                    <p className="text-sm text-slate-600 mt-1">Create, manage, and track all customer invoices</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <InvoiceManagement />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      {/* Payment Configuration Dialog */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg bg-white">
          <DialogHeader>
            <DialogTitle>
              Configure{" "}
              {selectedProvider === "stripe"
                ? "Stripe"
                : selectedProvider === "paypal"
                  ? "PayPal"
                  : "Square"}{" "}
              Payment
            </DialogTitle>
            <DialogDescription>
              Enter your{" "}
              {selectedProvider === "stripe"
                ? "Stripe"
                : selectedProvider === "paypal"
                  ? "PayPal"
                  : "Square"}{" "}
              platform credentials. These will be securely stored.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedProvider === "stripe" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="stripe-public-key">Publishable Key *</Label>
                  <Input
                    id="stripe-public-key"
                    placeholder="pk_live_..."
                    value={paymentCredentials.publicKey}
                    onChange={(e) =>
                      setPaymentCredentials({
                        ...paymentCredentials,
                        publicKey: e.target.value,
                      })
                    }
                    data-testid="input-stripe-public-key"
                  />
                  <p className="text-xs text-muted-foreground">
                    Found in Stripe Dashboard → Developers → API keys
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stripe-secret-key">Secret Key *</Label>
                  <Input
                    id="stripe-secret-key"
                    type="password"
                    placeholder="sk_live_..."
                    value={paymentCredentials.secretKey}
                    onChange={(e) =>
                      setPaymentCredentials({
                        ...paymentCredentials,
                        secretKey: e.target.value,
                      })
                    }
                    data-testid="input-stripe-secret-key"
                  />
                  <p className="text-xs text-muted-foreground">
                    Keep this secure - never share publicly
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stripe-webhook-secret">
                    Webhook Signing Secret (Optional)
                  </Label>
                  <Input
                    id="stripe-webhook-secret"
                    type="password"
                    placeholder="whsec_..."
                    value={paymentCredentials.webhookSecret}
                    onChange={(e) =>
                      setPaymentCredentials({
                        ...paymentCredentials,
                        webhookSecret: e.target.value,
                      })
                    }
                    data-testid="input-stripe-webhook-secret"
                  />
                  <p className="text-xs text-muted-foreground">
                    For webhook event verification (recommended for production)
                  </p>
                </div>
              </>
            )}

            {selectedProvider === "paypal" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="paypal-client-id">Client ID *</Label>
                  <Input
                    id="paypal-client-id"
                    placeholder="AYSq3RDGsmBLJE-otTkBtM-jBRd1TCQwFf9RGfwddNXWz0uFU9ztymylOhRS..."
                    value={paymentCredentials.clientId}
                    onChange={(e) =>
                      setPaymentCredentials({
                        ...paymentCredentials,
                        clientId: e.target.value,
                      })
                    }
                    data-testid="input-paypal-client-id"
                  />
                  <p className="text-xs text-muted-foreground">
                    Found in PayPal Developer Dashboard → My Apps & Credentials
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paypal-client-secret">Client Secret *</Label>
                  <Input
                    id="paypal-client-secret"
                    type="password"
                    placeholder="Enter your PayPal client secret..."
                    value={paymentCredentials.clientSecret}
                    onChange={(e) =>
                      setPaymentCredentials({
                        ...paymentCredentials,
                        clientSecret: e.target.value,
                      })
                    }
                    data-testid="input-paypal-client-secret"
                  />
                  <p className="text-xs text-muted-foreground">
                    Keep this secure - never share publicly
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paypal-webhook-secret">
                    Webhook ID (Optional)
                  </Label>
                  <Input
                    id="paypal-webhook-secret"
                    placeholder="Enter webhook ID..."
                    value={paymentCredentials.webhookSecret}
                    onChange={(e) =>
                      setPaymentCredentials({
                        ...paymentCredentials,
                        webhookSecret: e.target.value,
                      })
                    }
                    data-testid="input-paypal-webhook-id"
                  />
                  <p className="text-xs text-muted-foreground">
                    For webhook event verification
                  </p>
                </div>
              </>
            )}

            {selectedProvider === "square" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="square-app-id">Application ID *</Label>
                  <Input
                    id="square-app-id"
                    placeholder="sq0idp-..."
                    value={paymentCredentials.applicationId}
                    onChange={(e) =>
                      setPaymentCredentials({
                        ...paymentCredentials,
                        applicationId: e.target.value,
                      })
                    }
                    data-testid="input-square-app-id"
                  />
                  <p className="text-xs text-muted-foreground">
                    Found in Square Developer Dashboard → Applications
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="square-access-token">Access Token *</Label>
                  <Input
                    id="square-access-token"
                    type="password"
                    placeholder="Enter your Square access token..."
                    value={paymentCredentials.accessToken}
                    onChange={(e) =>
                      setPaymentCredentials({
                        ...paymentCredentials,
                        accessToken: e.target.value,
                      })
                    }
                    data-testid="input-square-access-token"
                  />
                  <p className="text-xs text-muted-foreground">
                    Personal Access Token or Production Access Token
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="square-location-id">
                    Location ID (Optional)
                  </Label>
                  <Input
                    id="square-location-id"
                    placeholder="Enter location ID..."
                    value={paymentCredentials.locationId}
                    onChange={(e) =>
                      setPaymentCredentials({
                        ...paymentCredentials,
                        locationId: e.target.value,
                      })
                    }
                    data-testid="input-square-location-id"
                  />
                  <p className="text-xs text-muted-foreground">
                    Specific location for payments (if applicable)
                  </p>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setConfigDialogOpen(false);
                setSelectedProvider(null);
                setPaymentCredentials({
                  publicKey: "",
                  secretKey: "",
                  webhookSecret: "",
                  clientId: "",
                  clientSecret: "",
                  applicationId: "",
                  accessToken: "",
                  locationId: "",
                });
              }}
              data-testid="button-cancel-config"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePaymentConfig}
              disabled={createPaymentSystemMutation.isPending}
              data-testid="button-save-config"
            >
              {createPaymentSystemMutation.isPending
                ? "Saving..."
                : "Save Configuration"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Add/Edit User Dialog */}
      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
        <DialogContent className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg bg-white">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "Edit User" : "Add New User"}
            </DialogTitle>
            <DialogDescription>
              {editingUser
                ? "Update user information and settings."
                : "Create a new user account with role and permissions."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="user-first-name">First Name *</Label>
                <Input
                  id="user-first-name"
                  placeholder="John"
                  value={userFormData.firstName}
                  onChange={(e) =>
                    setUserFormData({
                      ...userFormData,
                      firstName: e.target.value,
                    })
                  }
                  data-testid="input-user-first-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-last-name">Last Name</Label>
                <Input
                  id="user-last-name"
                  placeholder="Doe"
                  value={userFormData.lastName}
                  onChange={(e) =>
                    setUserFormData({
                      ...userFormData,
                      lastName: e.target.value,
                    })
                  }
                  data-testid="input-user-last-name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-email">Email *</Label>
              <Input
                id="user-email"
                type="email"
                placeholder="user@example.com"
                value={userFormData.email}
                onChange={(e) =>
                  setUserFormData({ ...userFormData, email: e.target.value })
                }
                data-testid="input-user-email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-phone">Phone Number</Label>
              <Input
                id="user-phone"
                placeholder="+1 234 567 8900"
                value={userFormData.phone}
                onChange={(e) =>
                  setUserFormData({ ...userFormData, phone: e.target.value })
                }
                data-testid="input-user-phone"
              />
            </div>

            {userFormData.role === "driver" && (
              <div className="space-y-2">
                <Label htmlFor="user-vehicle-plate">Vehicle Plate Number</Label>
                <Input
                  id="user-vehicle-plate"
                  placeholder="ABC123"
                  value={userFormData.vehiclePlate}
                  onChange={(e) =>
                    setUserFormData({
                      ...userFormData,
                      vehiclePlate: e.target.value,
                    })
                  }
                  data-testid="input-user-vehicle-plate"
                />
                <p className="text-xs text-muted-foreground">
                  Vehicle license plate number assigned to this driver
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="user-role">Role *</Label>
              <Select
                value={userFormData.role}
                onValueChange={(value) =>
                  setUserFormData({
                    ...userFormData,
                    role: value as typeof userFormData.role,
                  })
                }
              >
                <SelectTrigger id="user-role" data-testid="select-user-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="passenger">Passenger</SelectItem>
                  <SelectItem value="driver">Driver</SelectItem>
                  <SelectItem value="dispatcher">Dispatcher</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-status">Status</Label>
              <Select
                value={userFormData.isActive ? "active" : "inactive"}
                onValueChange={(value) =>
                  setUserFormData({
                    ...userFormData,
                    isActive: value === "active",
                  })
                }
              >
                <SelectTrigger
                  id="user-status"
                  data-testid="select-user-status"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {userFormData.role === "passenger" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="user-paylater">Pay Later Ability</Label>
                  <Select
                    value={
                      userFormData.payLaterEnabled ? "enabled" : "disabled"
                    }
                    onValueChange={(value) =>
                      setUserFormData({
                        ...userFormData,
                        payLaterEnabled: value === "enabled",
                      })
                    }
                  >
                    <SelectTrigger
                      id="user-paylater"
                      data-testid="select-user-paylater"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="enabled">Enabled</SelectItem>
                      <SelectItem value="disabled">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Allow passenger to complete trips and pay afterwards
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user-cashpayment">Cash Payment Ability</Label>
                  <Select
                    value={
                      userFormData.cashPaymentEnabled ? "enabled" : "disabled"
                    }
                    onValueChange={(value) =>
                      setUserFormData({
                        ...userFormData,
                        cashPaymentEnabled: value === "enabled",
                      })
                    }
                  >
                    <SelectTrigger
                      id="user-cashpayment"
                      data-testid="select-user-cashpayment"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="enabled">Enabled</SelectItem>
                      <SelectItem value="disabled">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Allow passenger to pay with cash at the end of the trip
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user-discount-type">Discount Type</Label>
                  <Select
                    value={userFormData.discountType || "none"}
                    onValueChange={(value) =>
                      setUserFormData({
                        ...userFormData,
                        discountType:
                          value === "none"
                            ? null
                            : (value as "percentage" | "fixed"),
                        discountValue:
                          value === "none" ? "0" : userFormData.discountValue,
                      })
                    }
                  >
                    <SelectTrigger
                      id="user-discount-type"
                      data-testid="select-user-discount-type"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Discount</SelectItem>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Select how the discount should be applied
                  </p>
                </div>

                {userFormData.discountType && (
                  <div className="space-y-2">
                    <Label htmlFor="user-discount-value">
                      Discount Value{" "}
                      {userFormData.discountType === "percentage"
                        ? "(%)"
                        : "($)"}
                    </Label>
                    <Input
                      id="user-discount-value"
                      type="number"
                      min="0"
                      max={
                        userFormData.discountType === "percentage"
                          ? "100"
                          : undefined
                      }
                      step={
                        userFormData.discountType === "percentage"
                          ? "1"
                          : "0.01"
                      }
                      placeholder={
                        userFormData.discountType === "percentage"
                          ? "10"
                          : "5.00"
                      }
                      value={userFormData.discountValue}
                      onChange={(e) =>
                        setUserFormData({
                          ...userFormData,
                          discountValue: e.target.value,
                        })
                      }
                      data-testid="input-user-discount-value"
                    />
                    <p className="text-xs text-muted-foreground">
                      {userFormData.discountType === "percentage"
                        ? "Enter percentage discount (0-100)"
                        : "Enter fixed discount amount in dollars"}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUserDialogOpen(false)}
              data-testid="button-cancel-user"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveUser}
              disabled={
                createUserMutation.isPending || updateUserMutation.isPending
              }
              data-testid="button-save-user"
            >
              {createUserMutation.isPending || updateUserMutation.isPending
                ? "Saving..."
                : editingUser
                  ? "Update User"
                  : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Driver Documents Dialog */}
      <Dialog open={documentsDialogOpen} onOpenChange={setDocumentsDialogOpen}>
        <DialogContent className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg bg-white sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Driver Documents - {selectedDriverForDocs?.firstName}{" "}
              {selectedDriverForDocs?.lastName}
            </DialogTitle>
            <DialogDescription>
              View and manage driver verification documents
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Upload Form for Admin */}
            <Card className="bg-muted/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">
                    Upload Document for Driver
                  </CardTitle>
                  <Button
                    size="sm"
                    variant={uploadingForDriver ? "default" : "outline"}
                    onClick={() => setUploadingForDriver(!uploadingForDriver)}
                    data-testid="button-toggle-upload"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    {uploadingForDriver ? "Cancel" : "Upload New"}
                  </Button>
                </div>
              </CardHeader>
              {uploadingForDriver && (
                <CardContent>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Document Type</Label>
                      <Select
                        value={uploadFormData.documentType}
                        onValueChange={(value) =>
                          setUploadFormData({
                            ...uploadFormData,
                            documentType:
                              value as typeof uploadFormData.documentType,
                          })
                        }
                      >
                        <SelectTrigger data-testid="select-doc-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="driver_license">
                            Driver License
                          </SelectItem>
                          <SelectItem value="limo_license">
                            Limo License
                          </SelectItem>
                          <SelectItem value="profile_photo">
                            Profile Photo
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>File</Label>
                      <Input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) =>
                          setUploadFormData({
                            ...uploadFormData,
                            file: e.target.files?.[0] || null,
                          })
                        }
                        data-testid="input-doc-file"
                      />
                    </div>

                    {uploadFormData.documentType !== "profile_photo" && (
                      <div className="space-y-2">
                        <Label>Expiration Date</Label>
                        <Input
                          type="date"
                          value={uploadFormData.expirationDate}
                          onChange={(e) =>
                            setUploadFormData({
                              ...uploadFormData,
                              expirationDate: e.target.value,
                            })
                          }
                          data-testid="input-expiration-date"
                        />
                      </div>
                    )}

                    <Button
                      onClick={() => {
                        if (!uploadFormData.file || !selectedDriverForDocs) {
                          toast({
                            title: "Missing Information",
                            description: "Please select a file to upload",
                            variant: "destructive",
                          });
                          return;
                        }
                        adminUploadDocumentMutation.mutate({
                          userId: selectedDriverForDocs.id,
                          file: uploadFormData.file,
                          documentType: uploadFormData.documentType,
                          expirationDate:
                            uploadFormData.expirationDate || undefined,
                          whatsappNumber:
                            uploadFormData.whatsappNumber || undefined,
                        });
                      }}
                      disabled={
                        adminUploadDocumentMutation.isPending ||
                        !uploadFormData.file
                      }
                      className="w-full"
                      data-testid="button-submit-upload"
                    >
                      {adminUploadDocumentMutation.isPending
                        ? "Uploading..."
                        : "Upload Document"}
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Existing Documents */}
            {documentsLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : allDriverDocuments && allDriverDocuments.length > 0 ? (
              <>
                {allDriverDocuments
                  .filter(
                    (doc) =>
                      doc.driverInfo?.userId === selectedDriverForDocs?.id,
                  )
                  .map((doc) => (
                    <Card key={doc.id} data-testid={`document-card-${doc.id}`}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              <h3 className="font-semibold capitalize">
                                {doc.documentType.replace("_", " ")}
                              </h3>
                              <Badge
                                variant={
                                  doc.status === "approved"
                                    ? "default"
                                    : doc.status === "rejected"
                                      ? "destructive"
                                      : "secondary"
                                }
                                data-testid={`document-status-${doc.id}`}
                              >
                                {doc.status}
                              </Badge>
                            </div>

                            <div className="text-sm text-muted-foreground space-y-1">
                              {doc.expirationDate && (
                                <p>
                                  Expires:{" "}
                                  {new Date(
                                    doc.expirationDate,
                                  ).toLocaleDateString()}
                                </p>
                              )}
                              {doc.whatsappNumber && (
                                <p>WhatsApp: {doc.whatsappNumber}</p>
                              )}
                              <p>
                                Uploaded:{" "}
                                {new Date(doc.uploadedAt).toLocaleDateString()}
                              </p>
                              {doc.rejectionReason && (
                                <p className="text-destructive">
                                  Rejection Reason: {doc.rejectionReason}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-2 mt-3">
                              {doc.status !== "approved" && (
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    updateDocumentStatusMutation.mutate({
                                      documentId: doc.id,
                                      status: "approved",
                                    })
                                  }
                                  disabled={
                                    updateDocumentStatusMutation.isPending
                                  }
                                  data-testid={`button-approve-${doc.id}`}
                                >
                                  <Check className="w-3 h-3 mr-1" />
                                  Approve
                                </Button>
                              )}
                              {doc.status !== "rejected" && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    const reason = prompt(
                                      "Enter rejection reason:",
                                    );
                                    if (reason) {
                                      updateDocumentStatusMutation.mutate({
                                        documentId: doc.id,
                                        status: "rejected",
                                        rejectionReason: reason,
                                      });
                                    }
                                  }}
                                  disabled={
                                    updateDocumentStatusMutation.isPending
                                  }
                                  data-testid={`button-reject-${doc.id}`}
                                >
                                  <X className="w-3 h-3 mr-1" />
                                  Reject
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </>
            ) : (
              <div
                className="text-center p-8 text-muted-foreground"
                data-testid="no-documents"
              >
                No documents uploaded yet.
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDocumentsDialogOpen(false);
                setSelectedDriverForDocs(null);
              }}
              data-testid="button-close-documents"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Booking Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <X className="w-5 h-5" />
              Cancel Booking
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for cancelling booking #{bookingToCancel?.substring(0, 8)}. This information will be saved for future reference.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cancellation-reason">Cancellation Reason *</Label>
              <Textarea
                id="cancellation-reason"
                placeholder="Enter the reason for cancellation..."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                rows={4}
                className="mt-2 resize-none"
                data-testid="textarea-cancel-reason"
              />
              <p className="text-sm text-muted-foreground mt-2">
                This reason will be recorded and may be shared with the customer.
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setCancelDialogOpen(false);
                setBookingToCancel(null);
                setCancellationReason("");
              }}
              data-testid="button-cancel-dialog"
            >
              Close
            </Button>
            <Button
              variant="default"
              onClick={() => {
                if (bookingToCancel && cancellationReason.trim()) {
                  cancelBookingMutation.mutate({
                    bookingId: bookingToCancel,
                    reason: cancellationReason.trim(),
                  });
                }
              }}
              disabled={!cancellationReason.trim() || cancelBookingMutation.isPending}
              data-testid="button-confirm-cancel"
              className="bg-orange-600 hover:bg-orange-700"
            >
              {cancelBookingMutation.isPending ? "Cancelling..." : "Cancel Booking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Booking Confirmation Dialog */}
      <Dialog open={deleteConfirmDialogOpen} onOpenChange={setDeleteConfirmDialogOpen}>
        <DialogContent className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              Delete Booking
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete booking #{bookingToDelete?.substring(0, 8)}? 
              This action cannot be undone and will permanently delete all related data including invoices, ratings, and incident reports.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteConfirmDialogOpen(false);
                setBookingToDelete(null);
              }}
              data-testid="button-cancel-delete"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (bookingToDelete) {
                  console.log('🗑️ User confirmed deletion, triggering mutation for:', bookingToDelete);
                  deleteBookingMutation.mutate(bookingToDelete);
                  setDeleteConfirmDialogOpen(false);
                  setBookingToDelete(null);
                }
              }}
              disabled={deleteBookingMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteBookingMutation.isPending ? "Deleting..." : "Delete Booking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={deleteUserDialogOpen} onOpenChange={setDeleteUserDialogOpen}>
        <AlertDialogContent className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg bg-[#d6bcbc]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              Delete User Account
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to delete{" "}
                <span className="font-semibold text-slate-900">
                  {userToDelete?.firstName} {userToDelete?.lastName}
                </span>
                {" "}({userToDelete?.email})?
              </p>
              <p className="text-red-600 font-medium">
                This action cannot be undone and will permanently delete:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>User account and profile information</li>
                <li>All associated bookings and ride history</li>
                <li>Driver documents and verification records</li>
                <li>Payment information and transaction history</li>
                <li>Emergency incident reports</li>
                <li>CMS content and media uploads</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDeleteUserDialogOpen(false);
                setUserToDelete(null);
              }}
              data-testid="button-cancel-delete-user"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (userToDelete) {
                  deleteUserMutation.mutate(userToDelete.id);
                  setDeleteUserDialogOpen(false);
                  setUserToDelete(null);
                }
              }}
              disabled={deleteUserMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-confirm-delete-user"
            >
              {deleteUserMutation.isPending ? "Deleting..." : "Delete User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
