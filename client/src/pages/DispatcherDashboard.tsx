import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { 
  Car, 
  Users, 
  MapPin, 
  Clock, 
  Activity, 
  Calendar,
  UserCheck,
  RadioIcon,
  BarChart3,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Zap,
  Star,
  Navigation,
  MessageSquare,
  Send,
  Mail,
  Phone
} from "lucide-react";
import { rankDrivers, formatMatchInfo, getBestDriver, type DriverWithExtras, type RankedDriver } from "@/lib/driverMatching";

export default function DispatcherDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [fleetMonitorOpen, setFleetMonitorOpen] = useState(false);
  const [communicationDialogOpen, setCommunicationDialogOpen] = useState(false);
  const [emergencySupportOpen, setEmergencySupportOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"time" | "match">("match");
  
  // Driver Communication state
  const [messageType, setMessageType] = useState<"individual" | "broadcast">("individual");
  const [selectedDriverForMessage, setSelectedDriverForMessage] = useState<string>("");
  const [messageSubject, setMessageSubject] = useState<string>("");
  const [messageText, setMessageText] = useState<string>("");
  const [messagePriority, setMessagePriority] = useState<"normal" | "high" | "urgent">("normal");
  const [deliveryMethod, setDeliveryMethod] = useState<"sms" | "email" | "both">("both");
  
  // Emergency Support state
  const [incidentType, setIncidentType] = useState<"accident" | "breakdown" | "medical" | "safety" | "other">("accident");
  const [incidentSeverity, setIncidentSeverity] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [incidentDriverId, setIncidentDriverId] = useState<string>("");
  const [incidentLocation, setIncidentLocation] = useState<string>("");
  const [incidentDescription, setIncidentDescription] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"create" | "active">("create");

  const { data: dashboardStats } = useQuery({
    queryKey: ["/api/dispatcher/stats"],
    retry: false,
  });

  // Fetch all bookings
  const { data: allBookings } = useQuery<any[]>({
    queryKey: ['/api/admin/bookings'],
    retry: false,
  });

  // Fetch all drivers (for fleet monitoring)
  const { data: allDrivers } = useQuery<any[]>({
    queryKey: ['/api/admin/drivers'],
    retry: false,
  });

  // Fetch enhanced drivers for assignment (with conflict detection and workload info)
  const selectedBooking = allBookings?.find((b: any) => b.id === selectedBookingId);
  const { data: enhancedDrivers } = useQuery<DriverWithExtras[]>({
    queryKey: ['/api/admin/drivers/for-assignment', selectedBooking?.scheduledDateTime],
    enabled: assignDialogOpen && !!selectedBooking,
    retry: false,
  });

  // Fetch driver messages history
  const { data: driverMessages } = useQuery<any[]>({
    queryKey: ['/api/driver-messages'],
    enabled: communicationDialogOpen,
    retry: false,
  });

  // Fetch emergency incidents
  const { data: emergencyIncidents } = useQuery<any[]>({
    queryKey: ['/api/emergency-incidents'],
    enabled: emergencySupportOpen,
    retry: false,
  });

  // Filter active drivers (all drivers who are active, not just available)
  const activeDrivers = Array.isArray(allDrivers)
    ? allDrivers.filter((d: any) => d.isActive)
    : [];

  // Filter pending bookings (not assigned to a driver yet)
  const pendingBookings = Array.isArray(allBookings) 
    ? allBookings.filter((booking: any) => booking.status === 'pending' && !booking.driverId)
    : [];

  // Filter assigned bookings (already have a driver assigned)
  const assignedBookings = Array.isArray(allBookings)
    ? allBookings.filter((booking: any) => booking.status === 'pending' && booking.driverId)
    : [];

  // Apply search and filters to bookings
  const filteredBookings = useMemo(() => {
    let filtered = [...pendingBookings, ...assignedBookings];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((b: any) => 
        `${b.passengerFirstName} ${b.passengerLastName}`.toLowerCase().includes(query) ||
        b.pickupAddress?.toLowerCase().includes(query) ||
        b.destinationAddress?.toLowerCase().includes(query) ||
        b.id.toLowerCase().includes(query)
      );
    }

    // Vehicle type filter
    if (vehicleTypeFilter !== "all") {
      filtered = filtered.filter((b: any) => b.vehicleTypeName === vehicleTypeFilter);
    }

    // Sort
    if (sortBy === "time") {
      filtered.sort((a: any, b: any) => 
        new Date(a.scheduledDateTime).getTime() - new Date(b.scheduledDateTime).getTime()
      );
    }

    return filtered;
  }, [pendingBookings, assignedBookings, searchQuery, vehicleTypeFilter, sortBy]);

  // Smart-ranked drivers based on selected booking
  const rankedDrivers: RankedDriver[] = useMemo(() => {
    if (!selectedBooking) return [];
    
    // Use enhancedDrivers if available (has conflict detection), otherwise use all active drivers
    const driversToRank = enhancedDrivers && enhancedDrivers.length > 0 
      ? enhancedDrivers 
      : activeDrivers.map((d: any) => ({
          ...d,
          hasConflict: false,
          conflictingBooking: null,
          matchReasons: [],
          warnings: [],
        }));
    
    if (!driversToRank || driversToRank.length === 0) return [];
    
    return rankDrivers(driversToRank, {
      pickupAddress: selectedBooking.pickupAddress,
      pickupCoordinates: selectedBooking.pickupCoordinates,
      scheduledDateTime: selectedBooking.scheduledDateTime,
      passengerCount: selectedBooking.passengerCount,
    });
  }, [enhancedDrivers, selectedBooking, activeDrivers]);

  // Get unique vehicle types for filter
  const vehicleTypes = useMemo(() => {
    const types = new Set(allBookings?.map((b: any) => b.vehicleTypeName).filter(Boolean));
    return Array.from(types);
  }, [allBookings]);

  // Assign driver mutation
  const assignDriverMutation = useMutation({
    mutationFn: async ({ bookingId, driverId, isReassignment }: { bookingId: string; driverId: string; isReassignment?: boolean }) => {
      const response = await apiRequest('PATCH', `/api/admin/bookings/${bookingId}/assign-driver`, { driverId });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to assign driver');
      }
      return { data: await response.json(), isReassignment };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/bookings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dispatcher/stats'] });
      setAssignDialogOpen(false);
      setSelectedBookingId(null);
      setSelectedDriverId("");
      toast({
        title: result.isReassignment ? t('dispatcherDashboard.toast.driverReassigned') : t('dispatcherDashboard.toast.driverAssigned'),
        description: result.isReassignment 
          ? t('dispatcherDashboard.toast.driverReassignedDesc')
          : t('dispatcherDashboard.toast.driverAssignedDesc'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('dispatcherDashboard.toast.assignmentFailed'),
        description: error.message || t('dispatcherDashboard.toast.failedToAssign'),
        variant: "destructive",
      });
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: {
      driverId?: string;
      messageType: string;
      subject?: string;
      message: string;
      priority: string;
      deliveryMethod: string;
    }) => {
      const response = await apiRequest('POST', '/api/driver-messages', data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send message');
      }
      return await response.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['/api/driver-messages'] });
      setCommunicationDialogOpen(false);
      setMessageType('individual');
      setSelectedDriverForMessage('');
      setMessageSubject('');
      setMessageText('');
      setMessagePriority('normal');
      setDeliveryMethod('both');
      
      toast({
        title: t('dispatcherDashboard.toast.messageSent'),
        description: result.smsSent && result.emailSent 
          ? t('dispatcherDashboard.toast.messageSentSmsEmail')
          : result.smsSent 
          ? t('dispatcherDashboard.toast.messageSentSms')
          : result.emailSent
          ? t('dispatcherDashboard.toast.messageSentEmail')
          : t('dispatcherDashboard.toast.messageQueued'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('dispatcherDashboard.toast.failedToSendMessage'),
        description: error.message || t('dispatcherDashboard.toast.couldNotSendMessage'),
        variant: "destructive",
      });
    },
  });

  // Create emergency incident mutation
  const createIncidentMutation = useMutation({
    mutationFn: async (data: {
      incidentType: string;
      severity: string;
      driverId?: string;
      location: string;
      description: string;
    }) => {
      const response = await apiRequest('POST', '/api/emergency-incidents', data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create incident');
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/emergency-incidents'] });
      setIncidentType('accident');
      setIncidentSeverity('medium');
      setIncidentDriverId('');
      setIncidentLocation('');
      setIncidentDescription('');
      setActiveTab('active');
      
      toast({
        title: t('dispatcherDashboard.toast.incidentReported'),
        description: t('dispatcherDashboard.toast.incidentCreated'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('dispatcherDashboard.toast.failedToReportIncident'),
        description: error.message || t('dispatcherDashboard.toast.couldNotCreateIncident'),
        variant: "destructive",
      });
    },
  });

  // Update emergency incident mutation
  const updateIncidentMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const response = await apiRequest('PATCH', `/api/emergency-incidents/${id}`, updates);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update incident');
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/emergency-incidents'] });
      toast({
        title: t('dispatcherDashboard.toast.incidentUpdated'),
        description: t('dispatcherDashboard.toast.incidentStatusUpdated'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('dispatcherDashboard.toast.updateFailed'),
        description: error.message || t('dispatcherDashboard.toast.couldNotUpdateIncident'),
        variant: "destructive",
      });
    },
  });

  const handleAssignClick = () => {
    setAssignDialogOpen(true);
    setSearchQuery("");
    setVehicleTypeFilter("all");
    setSortBy("match");
  };

  const handleSendMessage = () => {
    if (!messageText.trim()) {
      toast({
        title: t('dispatcherDashboard.toast.messageRequired'),
        description: t('dispatcherDashboard.toast.enterMessageToSend'),
        variant: "destructive",
      });
      return;
    }

    if (messageType === 'individual' && !selectedDriverForMessage) {
      toast({
        title: t('dispatcherDashboard.toast.driverRequired'),
        description: t('dispatcherDashboard.toast.selectDriverToSend'),
        variant: "destructive",
      });
      return;
    }

    sendMessageMutation.mutate({
      driverId: messageType === 'individual' ? selectedDriverForMessage : undefined,
      messageType,
      subject: messageSubject,
      message: messageText,
      priority: messagePriority,
      deliveryMethod,
    });
  };

  const handleCreateIncident = () => {
    if (!incidentLocation.trim() || !incidentDescription.trim()) {
      toast({
        title: t('dispatcherDashboard.toast.missingInformation'),
        description: t('dispatcherDashboard.toast.provideLocationDescription'),
        variant: "destructive",
      });
      return;
    }

    createIncidentMutation.mutate({
      incidentType,
      severity: incidentSeverity,
      driverId: incidentDriverId || undefined,
      location: incidentLocation,
      description: incidentDescription,
    });
  };

  const handleAssignSubmit = () => {
    if (!selectedBookingId || !selectedDriverId) {
      toast({
        title: t('dispatcherDashboard.toast.selectionRequired'),
        description: t('dispatcherDashboard.toast.selectBookingAndDriver'),
        variant: "destructive",
      });
      return;
    }
    
    const selectedBooking = allBookings?.find((b: any) => b.id === selectedBookingId);
    const isReassignment = !!(selectedBooking && selectedBooking.driverId);
    
    assignDriverMutation.mutate({ bookingId: selectedBookingId, driverId: selectedDriverId, isReassignment });
  };

  // Auto-assign the best-matched driver
  const handleAutoAssign = () => {
    if (!selectedBookingId || !enhancedDrivers) {
      toast({
        title: t('dispatcherDashboard.toast.selectionRequired'),
        description: t('dispatcherDashboard.toast.selectBookingFirst'),
        variant: "destructive",
      });
      return;
    }

    const bestDriver = getBestDriver(enhancedDrivers as DriverWithExtras[], selectedBooking);
    
    if (!bestDriver) {
      toast({
        title: t('dispatcherDashboard.toast.noDriversAvailable'),
        description: t('dispatcherDashboard.toast.noSuitableDrivers'),
        variant: "destructive",
      });
      return;
    }

    if (bestDriver.matchScore < 40) {
      toast({
        title: t('dispatcherDashboard.toast.lowMatchScore'),
        description: t('dispatcherDashboard.toast.lowMatchScoreDesc', { score: bestDriver.matchScore }),
        variant: "destructive",
      });
      return;
    }

    // Show confirmation with match details
    const matchInfo = formatMatchInfo(bestDriver);
    const distanceInfo = bestDriver.distanceMiles 
      ? ` • ${bestDriver.distanceMiles.toFixed(1)} mi away`
      : '';
    
    // Auto-assign immediately
    const isReassignment = !!(selectedBooking && selectedBooking.driverId);
    assignDriverMutation.mutate(
      { bookingId: selectedBookingId, driverId: bestDriver.id, isReassignment },
      {
        onSuccess: () => {
          toast({
            title: t('dispatcherDashboard.toast.autoAssignedSuccess'),
            description: `${bestDriver.firstName} ${bestDriver.lastName} (${matchInfo.badge}: ${bestDriver.matchScore}/100${distanceInfo})`,
          });
        }
      }
    );
  };

  // Determine button text based on selected booking
  const getButtonText = () => {
    if (assignDriverMutation.isPending) return t('dispatcherDashboard.assignDialog.processing');
    if (!selectedBookingId) return t('dispatcherDashboard.assignDialog.selectBookingDriver');
    const selectedBooking = allBookings?.find((b: any) => b.id === selectedBookingId);
    return selectedBooking?.driverId ? t('dispatcherDashboard.assignDialog.reassignDriver') : t('dispatcherDashboard.assignDialog.assignDriver');
  };

  const statsCards = [
    {
      title: t('dispatcherDashboard.stats.activeDrivers'),
      value: (dashboardStats as any)?.activeDrivers?.toString() || "0",
      change: t('dispatcherDashboard.stats.verifiedAvailable'),
      icon: <Car className="w-5 h-5" />,
      color: "text-green-600"
    },
    {
      title: t('dispatcherDashboard.stats.activeRides'),
      value: (dashboardStats as any)?.activeRides?.toString() || "0",
      change: t('dispatcherDashboard.stats.inProgress'),
      icon: <Activity className="w-5 h-5" />,
      color: "text-blue-600"
    },
    {
      title: t('dispatcherDashboard.stats.pendingRequests'),
      value: (dashboardStats as any)?.pendingRequests?.toString() || "0",
      change: t('dispatcherDashboard.stats.awaitingAssignment'),
      icon: <Clock className="w-5 h-5" />,
      color: "text-orange-600"
    },
    {
      title: t('dispatcherDashboard.stats.pendingApprovals'),
      value: (dashboardStats as any)?.pendingApprovals?.toString() || "0",
      change: t('dispatcherDashboard.stats.needVerification'),
      icon: <UserCheck className="w-5 h-5" />,
      color: "text-amber-600"
    },
    {
      title: t('dispatcherDashboard.stats.fleetUtilization'),
      value: (dashboardStats as any)?.fleetUtilization || "0%",
      change: t('dispatcherDashboard.stats.vehiclesInUse'),
      icon: <BarChart3 className="w-5 h-5" />,
      color: "text-purple-600"
    }
  ];

  const quickActions = [
    {
      title: t('dispatcherDashboard.quickActions.assignRide'),
      description: t('dispatcherDashboard.quickActions.assignRideDesc'),
      icon: <UserCheck className="w-6 h-6" />,
      action: handleAssignClick,
      color: "bg-blue-500"
    },
    {
      title: t('dispatcherDashboard.quickActions.fleetMonitor'),
      description: t('dispatcherDashboard.quickActions.fleetMonitorDesc'),
      icon: <MapPin className="w-6 h-6" />,
      action: () => setFleetMonitorOpen(true),
      color: "bg-green-500"
    },
    {
      title: t('dispatcherDashboard.quickActions.driverCommunication'),
      description: t('dispatcherDashboard.quickActions.driverCommunicationDesc'),
      icon: <MessageSquare className="w-6 h-6" />,
      action: () => setCommunicationDialogOpen(true),
      color: "bg-purple-500"
    },
    {
      title: t('dispatcherDashboard.quickActions.emergencySupport'),
      description: t('dispatcherDashboard.quickActions.emergencySupportDesc'),
      icon: <AlertTriangle className="w-6 h-6" />,
      action: () => setEmergencySupportOpen(true),
      color: "bg-red-500"
    }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      {/* Dark Header Section - Dispatcher Control */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 text-white pt-20 pb-12 shadow-xl">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-3 rounded-xl shadow-lg">
                  <Activity className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight" data-testid="dispatcher-welcome">
                    {t('dispatcherDashboard.title')}
                  </h1>
                  <p className="text-slate-300 text-lg mt-1">
                    {t('dispatcherDashboard.welcomeBack')} <span className="font-semibold text-white">{user?.firstName || user?.email}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-6 text-sm text-slate-300 ml-1">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  <span>{new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span>{new Date().toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit'
                  })}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Overview - Inside Dark Header */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {statsCards.map((stat, index) => (
              <div 
                key={index} 
                className="bg-background/10 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:bg-background/15 transition-all duration-300 hover:shadow-2xl hover:scale-105"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-200 line-clamp-1">
                    {stat.title}
                  </span>
                  <div className="bg-background/20 p-1.5 rounded-lg flex-shrink-0">
                    <div className="text-cyan-300">
                      {stat.icon}
                    </div>
                  </div>
                </div>
                <div className="text-2xl font-bold text-white mb-0.5" data-testid={`stat-${index}-value`}>
                  {stat.value}
                </div>
                <p className="text-xs text-slate-300 line-clamp-1" data-testid={`stat-${index}-change`}>
                  {stat.change}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Light Main Content Area */}
      <main className="flex-1 pb-12">
        <div className="container mx-auto px-4">
          {/* Quick Actions */}
          <div className="my-10">
            <h2 className="text-2xl font-bold mb-6 text-foreground" data-testid="quick-actions-title">
              {t('dispatcherDashboard.quickActions.title')}
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {quickActions.map((action, index) => (
                <Card 
                  key={index} 
                  className="group hover:shadow-2xl transition-all duration-300 cursor-pointer hover:-translate-y-2 border-border bg-card"
                  onClick={action.action}
                >
                  <CardHeader className="text-center p-6">
                    <div className={`inline-flex items-center justify-center p-4 ${action.color} text-white rounded-2xl mb-4 mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                      {action.icon}
                    </div>
                    <CardTitle className="text-lg font-bold text-foreground group-hover:text-blue-600 transition-colors duration-300" data-testid={`action-${index}-title`}>
                      {action.title}
                    </CardTitle>
                    <CardDescription className="text-sm text-muted-foreground" data-testid={`action-${index}-description`}>
                      {action.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>

          {/* Recent Activity and Alerts */}
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* Recent Activity */}
            <Card className="shadow-lg border-border bg-card">
              <CardHeader className="bg-gradient-to-r from-muted to-card border-b border-border">
                <CardTitle className="flex items-center space-x-2 text-foreground">
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                    <Activity className="w-5 h-5 text-blue-600" />
                  </div>
                  <span>{t('dispatcherDashboard.recentActivity.title')}</span>
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  {t('dispatcherDashboard.recentActivity.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800">
                    <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">Ride #R-2024-1205 assigned to Driver John D.</p>
                      <p className="text-xs text-muted-foreground mt-1">2 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">Driver Maria S. went online at Downtown</p>
                      <p className="text-xs text-muted-foreground mt-1">5 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
                    <div className="w-2.5 h-2.5 bg-orange-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">New ride request from Houston Airport</p>
                      <p className="text-xs text-muted-foreground mt-1">8 minutes ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Alerts */}
            <Card className="shadow-lg border-border bg-card">
              <CardHeader className="bg-gradient-to-r from-muted to-card border-b border-border">
                <CardTitle className="flex items-center space-x-2 text-foreground">
                  <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                  </div>
                  <span>{t('dispatcherDashboard.systemAlerts.title')}</span>
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  {t('dispatcherDashboard.systemAlerts.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-500 rounded-lg shadow-sm">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">High demand detected in Galleria area</p>
                      <p className="text-xs text-muted-foreground mt-1">Consider deploying additional drivers</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-l-4 border-blue-500 rounded-lg shadow-sm">
                    <Activity className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">Vehicle #V-101 due for maintenance</p>
                      <p className="text-xs text-muted-foreground mt-1">Schedule maintenance appointment</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-lg shadow-sm">
                    <Users className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">All systems operational</p>
                      <p className="text-xs text-muted-foreground mt-1">Fleet performance is optimal</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />

      {/* Assign Ride Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-0 border border-border p-0 shadow-xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-xl max-w-4xl max-h-[90vh] overflow-hidden bg-background">
          <DialogHeader className="bg-background px-6 py-5 border-b border-border">
            <DialogTitle className="text-2xl font-semibold text-foreground flex items-center gap-3">
              <UserCheck className="w-6 h-6 text-blue-600" />
              {t('dispatcherDashboard.assignDialog.title')}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm mt-2">
              {t('dispatcherDashboard.assignDialog.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-6 overflow-y-auto max-h-[calc(90vh-200px)] bg-muted">

          {/* Search and Filter Controls */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t('dispatcherDashboard.assignDialog.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-bookings"
                />
              </div>
            </div>
            <Select value={vehicleTypeFilter} onValueChange={setVehicleTypeFilter}>
              <SelectTrigger className="w-[200px]" data-testid="select-vehicle-filter">
                <SelectValue placeholder={t('dispatcherDashboard.assignDialog.filterByVehicle')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('dispatcherDashboard.assignDialog.allVehicleTypes')}</SelectItem>
                {vehicleTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as "time" | "match")}>
              <SelectTrigger className="w-[160px]" data-testid="select-sort">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="match">{t('dispatcherDashboard.assignDialog.sortByMatch')}</SelectItem>
                <SelectItem value="time">{t('dispatcherDashboard.assignDialog.sortByTime')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-4">
            {/* Pending & Assigned Bookings Combined Section */}
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-lg flex items-center gap-2 text-muted-foreground">
                  <div className="bg-blue-100 p-1.5 rounded-lg">
                    <Clock className="w-4 h-4 text-blue-600" />
                  </div>
                  {t('dispatcherDashboard.assignDialog.allBookings')} ({filteredBookings.length})
                </h3>
                {selectedBookingId && (
                  <Button
                    onClick={handleAutoAssign}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    data-testid="button-auto-assign"
                  >
                    <Zap className="w-4 h-4" />
                    {t('dispatcherDashboard.assignDialog.autoAssign')}
                  </Button>
                )}
              </div>
              {filteredBookings.length === 0 ? (
                <div className="text-center p-6 border rounded-lg bg-muted/50">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {searchQuery || vehicleTypeFilter !== "all" ? t('dispatcherDashboard.assignDialog.noBookingsMatch') : t('dispatcherDashboard.assignDialog.noBookingsAvailable')}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  {filteredBookings.map((booking: any) => {
                    const isPending = !booking.driverId;
                    const isUrgent = new Date(booking.scheduledDateTime).getTime() - Date.now() < 60 * 60 * 1000; // Less than 1 hour
                    
                    return (
                      <Card 
                        key={booking.id}
                        className={`cursor-pointer transition-all ${
                          selectedBookingId === booking.id 
                            ? 'ring-2 ring-primary bg-primary/5' 
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => setSelectedBookingId(booking.id)}
                        data-testid={`booking-${booking.id}`}
                      >
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-sm">
                                  {booking.passengerFirstName} {booking.passengerLastName}
                                </p>
                                <div className="flex gap-1 mt-1">
                                  <Badge variant="outline">
                                    {booking.bookingType}
                                  </Badge>
                                  {isUrgent && (
                                    <Badge variant="destructive" className="text-xs">
                                      <Clock className="w-3 h-3 mr-1" />
                                      {t('dispatcherDashboard.assignDialog.urgent')}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <Badge variant="secondary">
                                {booking.vehicleTypeName}
                              </Badge>
                            </div>
                            {!isPending && (
                              <div className="bg-orange-50 border border-orange-200 rounded p-2">
                                <p className="text-xs font-medium text-orange-800">
                                  {t('dispatcherDashboard.assignDialog.currently')} {booking.driverFirstName} {booking.driverLastName}
                                </p>
                              </div>
                            )}
                            <div className="text-xs space-y-1 text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                <span className="truncate">{booking.pickupAddress}</span>
                              </div>
                              {booking.destinationAddress && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  <span className="truncate">→ {booking.destinationAddress}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>{new Date(booking.scheduledDateTime).toLocaleString()}</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t">
                              <span className="text-xs text-muted-foreground">
                                {booking.passengerCount} {booking.passengerCount > 1 ? t('dispatcherDashboard.assignDialog.passengers') : t('dispatcherDashboard.assignDialog.passenger')}
                              </span>
                              <span className="font-semibold text-sm">
                                ${booking.totalAmount}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Smart-Ranked Drivers Section */}
            <div>
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-muted-foreground">
                <div className="bg-green-100 p-1.5 rounded-lg">
                  <Car className="w-4 h-4 text-green-600" />
                </div>
                {t('dispatcherDashboard.assignDialog.availableDrivers')} ({rankedDrivers.length})
              </h3>
              {!selectedBookingId ? (
                <div className="text-center p-6 border rounded-lg bg-muted/50">
                  <Car className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">{t('dispatcherDashboard.assignDialog.selectBookingForDrivers')}</p>
                </div>
              ) : rankedDrivers.length === 0 ? (
                <div className="text-center p-6 border rounded-lg bg-muted/50">
                  <Car className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">{t('dispatcherDashboard.assignDialog.noDriversAvailable')}</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  {rankedDrivers.map((driver) => {
                    const matchInfo = formatMatchInfo(driver);
                    const isSelected = selectedDriverId === driver.id;
                    
                    return (
                      <Card 
                        key={driver.id}
                        className={`cursor-pointer transition-all ${
                          isSelected 
                            ? 'ring-2 ring-blue-500 bg-blue-50' 
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => setSelectedDriverId(driver.id)}
                        data-testid={`smart-driver-${driver.id}`}
                      >
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-sm">
                                    {driver.firstName} {driver.lastName}
                                  </p>
                                  <Badge className={`${matchInfo.badgeColor} text-white text-xs`}>
                                    {matchInfo.badge}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs flex items-center gap-1">
                                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                    {driver.rating || 'N/A'}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    • {driver.totalRides || 0} {t('dispatcherDashboard.assignDialog.rides')}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-bold text-blue-600">
                                  {driver.matchScore}/100
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {t('dispatcherDashboard.assignDialog.matchScore')}
                                </div>
                              </div>
                            </div>

                            {/* Distance Info */}
                            {driver.distanceMiles !== undefined && (
                              <div className="flex items-center gap-1 text-xs bg-blue-50 p-2 rounded">
                                <Navigation className="w-3 h-3 text-blue-600" />
                                <span className="text-blue-800 font-medium">
                                  {driver.distanceMiles.toFixed(1)} {t('dispatcherDashboard.assignDialog.miAway')}
                                </span>
                              </div>
                            )}

                            {/* Match Reasons */}
                            {driver.matchReasons.length > 0 && (
                              <div className="text-xs text-green-700 bg-green-50 p-2 rounded">
                                ✓ {driver.matchReasons.join(' • ')}
                              </div>
                            )}

                            {/* Warnings */}
                            {driver.warnings.length > 0 && (
                              <div className="text-xs text-orange-700 bg-orange-50 border border-orange-200 p-2 rounded flex items-start gap-1">
                                <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                <span>{driver.warnings.join(' • ')}</span>
                              </div>
                            )}

                            {/* Conflict Details */}
                            {driver.hasConflict && driver.conflictingBooking && (
                              <div className="text-xs text-red-700 bg-red-50 border border-red-200 p-2 rounded">
                                <div className="font-medium mb-1">⚠️ {t('dispatcherDashboard.assignDialog.scheduleConflict')}</div>
                                <div>
                                  {new Date(driver.conflictingBooking.scheduledDateTime).toLocaleTimeString()} - {driver.conflictingBooking.passengerName}
                                </div>
                              </div>
                            )}

                            {/* Additional Driver Info */}
                            <div className="text-xs space-y-1 text-muted-foreground pt-2 border-t">
                              <div className="flex items-center justify-between">
                                <span>{t('dispatcherDashboard.assignDialog.status')}:</span>
                                <Badge variant={driver.isAvailable ? "default" : "secondary"} className="text-xs">
                                  {driver.isAvailable ? t('dispatcherDashboard.assignDialog.available') : t('dispatcherDashboard.assignDialog.busy')}
                                </Badge>
                              </div>
                              {driver.vehiclePlate && (
                                <div className="flex items-center justify-between">
                                  <span>{t('dispatcherDashboard.assignDialog.vehicle')}:</span>
                                  <span className="font-mono font-medium bg-muted px-2 py-0.5 rounded">{driver.vehiclePlate}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-border bg-background px-6 py-4">
            <Button
              variant="outline"
              onClick={() => {
                setAssignDialogOpen(false);
                setSelectedBookingId(null);
                setSelectedDriverId("");
              }}
              className="px-6 border-border hover:bg-muted text-muted-foreground"
              data-testid="button-cancel-assign"
            >
              {t('dispatcherDashboard.assignDialog.cancel')}
            </Button>
            <Button
              onClick={handleAssignSubmit}
              disabled={!selectedBookingId || !selectedDriverId || assignDriverMutation.isPending}
              className="px-6 bg-blue-600 hover:bg-blue-700 text-white"
              data-testid="button-confirm-assign"
            >
              {getButtonText()}
            </Button>
          </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fleet Monitor Dialog */}
      <Dialog open={fleetMonitorOpen} onOpenChange={setFleetMonitorOpen}>
        <DialogContent className="fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-0 border border-border p-0 shadow-xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-xl max-w-6xl max-h-[90vh] overflow-hidden bg-background">
          <DialogHeader className="bg-background px-6 py-5 border-b border-border">
            <DialogTitle className="text-2xl font-semibold text-foreground flex items-center gap-3">
              <MapPin className="w-6 h-6 text-green-600" />
              {t('dispatcherDashboard.fleetMonitor.title')}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm mt-2">
              {t('dispatcherDashboard.fleetMonitor.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-6 overflow-y-auto max-h-[calc(90vh-200px)] bg-muted">
            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <Card className="bg-green-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">{t('dispatcherDashboard.fleetMonitor.available')}</p>
                      <p className="text-2xl font-bold text-green-600" data-testid="stat-available">
                        {allDrivers?.filter((d: any) => d.isAvailable).length || 0}
                      </p>
                    </div>
                    <Car className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">{t('dispatcherDashboard.fleetMonitor.onRide')}</p>
                      <p className="text-2xl font-bold text-blue-600" data-testid="stat-on-ride">
                        {allDrivers?.filter((d: any) => {
                          const hasCurrentRide = allBookings?.some(
                            (b: any) => b.driverId === d.id && (b.status === 'in_progress' || b.status === 'pending')
                          );
                          return !d.isAvailable && hasCurrentRide;
                        }).length || 0}
                      </p>
                    </div>
                    <Activity className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-orange-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">{t('dispatcherDashboard.fleetMonitor.offline')}</p>
                      <p className="text-2xl font-bold text-orange-600" data-testid="stat-offline">
                        {allDrivers?.filter((d: any) => {
                          const hasCurrentRide = allBookings?.some(
                            (b: any) => b.driverId === d.id && (b.status === 'in_progress' || b.status === 'pending')
                          );
                          return !d.isAvailable && !hasCurrentRide;
                        }).length || 0}
                      </p>
                    </div>
                    <Clock className="w-8 h-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-purple-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">{t('dispatcherDashboard.fleetMonitor.totalFleet')}</p>
                      <p className="text-2xl font-bold text-purple-600" data-testid="stat-total">
                        {allDrivers?.length || 0}
                      </p>
                    </div>
                    <Users className="w-8 h-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Driver List */}
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {!allDrivers || allDrivers.length === 0 ? (
                <div className="text-center p-12 border rounded-lg bg-muted/50">
                  <Car className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">{t('dispatcherDashboard.fleetMonitor.noDriversInFleet')}</p>
                </div>
              ) : (
                allDrivers.map((driver: any) => {
                  const currentRide = allBookings?.find(
                    (b: any) => b.driverId === driver.id && (b.status === 'in_progress' || b.status === 'pending')
                  );
                  const isOnRide = !!currentRide;
                  const statusColor = driver.isAvailable ? 'green' : isOnRide ? 'blue' : 'orange';
                  const statusText = driver.isAvailable ? t('dispatcherDashboard.fleetMonitor.available') : isOnRide ? t('dispatcherDashboard.fleetMonitor.onRide') : t('dispatcherDashboard.fleetMonitor.offline');

                  return (
                    <Card key={driver.id} className="hover:shadow-md transition-shadow" data-testid={`fleet-driver-${driver.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          {/* Driver Info */}
                          <div className="flex items-start gap-4 flex-1">
                            <div className={`w-12 h-12 rounded-full bg-${statusColor}-100 flex items-center justify-center`}>
                              <Car className={`w-6 h-6 text-${statusColor}-600`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold">
                                  {driver.firstName} {driver.lastName}
                                </h4>
                                <Badge 
                                  variant={driver.isAvailable ? "default" : isOnRide ? "secondary" : "outline"}
                                  className={
                                    driver.isAvailable 
                                      ? "bg-green-500" 
                                      : isOnRide 
                                        ? "bg-blue-500" 
                                        : "bg-orange-500 text-white"
                                  }
                                >
                                  {statusText}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs">{t('dispatcherDashboard.fleetMonitor.email')}:</span>
                                  <span className="text-xs">{driver.email}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs">{t('dispatcherDashboard.fleetMonitor.rating')}:</span>
                                    <span className="text-xs font-medium">⭐ {driver.rating || 'N/A'}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs">{t('dispatcherDashboard.fleetMonitor.totalRides')}:</span>
                                    <span className="text-xs font-medium">{driver.totalRides || 0}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Current Ride Info */}
                              {currentRide && (
                                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                  <p className="text-xs font-medium text-blue-900 mb-2">{t('dispatcherDashboard.fleetMonitor.currentRide')}:</p>
                                  <div className="space-y-1 text-xs">
                                    <div className="flex items-center gap-1">
                                      <Users className="w-3 h-3" />
                                      <span>{currentRide.passengerFirstName} {currentRide.passengerLastName}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <MapPin className="w-3 h-3" />
                                      <span className="truncate">{currentRide.pickupAddress}</span>
                                    </div>
                                    {currentRide.destinationAddress && (
                                      <div className="flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        <span className="truncate">→ {currentRide.destinationAddress}</span>
                                      </div>
                                    )}
                                    <div className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      <span>{new Date(currentRide.scheduledDateTime).toLocaleString()}</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Vehicle Info & Actions */}
                          <div className="text-right flex flex-col items-end gap-2">
                            <Badge variant="outline" className="mb-1">
                              {driver.vehicleType || 'Vehicle Plate'}
                            </Badge>
                            <p className="text-xs text-muted-foreground mb-2">
                              {driver.vehiclePlate || 'N/A'}
                            </p>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs flex items-center gap-1 border-blue-300 text-blue-600 hover:bg-blue-50"
                              onClick={() => {
                                setFleetMonitorOpen(false);
                                setLocation(`/admin/drivers-map?driverId=${driver.userId}`);
                              }}
                              data-testid={`button-view-location-${driver.id}`}
                            >
                              <MapPin className="w-3 h-3" />
                              {t('dispatcherDashboard.fleetMonitor.viewLocation')}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>

          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-border bg-background px-6 py-4">
            <Button
              variant="outline"
              onClick={() => setFleetMonitorOpen(false)}
              className="px-6 border-border hover:bg-muted text-muted-foreground"
              data-testid="button-close-fleet-monitor"
            >
              {t('dispatcherDashboard.fleetMonitor.close')}
            </Button>
          </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Driver Communication Dialog */}
      <Dialog open={communicationDialogOpen} onOpenChange={setCommunicationDialogOpen}>
        <DialogContent className="fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-0 border border-border p-0 shadow-xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-xl max-w-2xl max-h-[90vh] overflow-hidden bg-background">
          <DialogHeader className="bg-background px-6 py-5 border-b border-border">
            <DialogTitle className="text-2xl font-semibold text-foreground flex items-center gap-3">
              <MessageSquare className="w-6 h-6 text-purple-600" />
              {t('dispatcherDashboard.communication.title')}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm mt-2">
              {t('dispatcherDashboard.communication.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-6 overflow-y-auto max-h-[calc(90vh-200px)] bg-muted">
            <div className="space-y-5">
              {/* Message Type */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">{t('dispatcherDashboard.communication.messageType')}</Label>
                <Select value={messageType} onValueChange={(v) => setMessageType(v as "individual" | "broadcast")}>
                  <SelectTrigger className="w-full bg-background" data-testid="select-message-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">{t('dispatcherDashboard.communication.individualDriver')}</SelectItem>
                    <SelectItem value="broadcast">{t('dispatcherDashboard.communication.broadcastAll')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Driver Selection (only for individual messages) */}
              {messageType === 'individual' && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">{t('dispatcherDashboard.communication.selectDriver')}</Label>
                  <Select value={selectedDriverForMessage} onValueChange={setSelectedDriverForMessage}>
                    <SelectTrigger className="w-full bg-background" data-testid="select-driver">
                      <SelectValue placeholder={t('dispatcherDashboard.communication.chooseDriver')} />
                    </SelectTrigger>
                    <SelectContent>
                      {activeDrivers.map((driver: any) => (
                        <SelectItem key={driver.id} value={driver.userId}>
                          {driver.firstName} {driver.lastName} - {driver.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Subject */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">{t('dispatcherDashboard.communication.subject')}</Label>
                <Input
                  placeholder={t('dispatcherDashboard.communication.subjectPlaceholder')}
                  value={messageSubject}
                  onChange={(e) => setMessageSubject(e.target.value)}
                  className="bg-background"
                  data-testid="input-subject"
                />
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">{t('dispatcherDashboard.communication.message')} *</Label>
                <Textarea
                  placeholder={t('dispatcherDashboard.communication.messagePlaceholder')}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="min-h-[120px] bg-background"
                  data-testid="textarea-message"
                />
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">{t('dispatcherDashboard.communication.priority')}</Label>
                <Select value={messagePriority} onValueChange={(v) => setMessagePriority(v as "normal" | "high" | "urgent")}>
                  <SelectTrigger className="w-full bg-background" data-testid="select-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">{t('dispatcherDashboard.communication.priorityNormal')}</SelectItem>
                    <SelectItem value="high">{t('dispatcherDashboard.communication.priorityHigh')}</SelectItem>
                    <SelectItem value="urgent">{t('dispatcherDashboard.communication.priorityUrgent')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Delivery Method */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">{t('dispatcherDashboard.communication.deliveryMethod')}</Label>
                <Select value={deliveryMethod} onValueChange={(v) => setDeliveryMethod(v as "sms" | "email" | "both")}>
                  <SelectTrigger className="w-full bg-background" data-testid="select-delivery-method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <Phone className="w-4 h-4" />
                        <span>{t('dispatcherDashboard.communication.emailAndSms')}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="email">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span>{t('dispatcherDashboard.communication.emailOnly')}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="sms">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>{t('dispatcherDashboard.communication.smsOnly')}</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Preview/Info */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900">
                    <p className="font-medium mb-1">{t('dispatcherDashboard.communication.sendingTo')}:</p>
                    <p>
                      {messageType === 'broadcast' 
                        ? t('dispatcherDashboard.communication.allActiveDrivers', { count: activeDrivers.length })
                        : selectedDriverForMessage 
                        ? activeDrivers.find((d: any) => d.userId === selectedDriverForMessage)?.firstName + ' ' + activeDrivers.find((d: any) => d.userId === selectedDriverForMessage)?.lastName
                        : t('dispatcherDashboard.communication.noDriverSelected')
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Message History */}
              <div className="mt-8 pt-6 border-t border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4">{t('dispatcherDashboard.communication.recentMessages')}</h3>
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {!driverMessages || driverMessages.length === 0 ? (
                    <div className="text-center p-8 border rounded-lg bg-background">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">{t('dispatcherDashboard.communication.noMessagesSent')}</p>
                    </div>
                  ) : (
                    driverMessages.map((msg: any) => (
                      <Card key={msg.id} className="bg-background">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant={msg.messageType === 'broadcast' ? 'default' : 'secondary'} className="text-xs">
                                  {msg.messageType}
                                </Badge>
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${
                                    msg.priority === 'urgent' ? 'border-red-500 text-red-700' :
                                    msg.priority === 'high' ? 'border-orange-500 text-orange-700' :
                                    'border-border text-muted-foreground'
                                  }`}
                                >
                                  {msg.priority}
                                </Badge>
                              </div>
                              {msg.subject && (
                                <p className="font-medium text-sm text-foreground mb-1">{msg.subject}</p>
                              )}
                              <p className="text-sm text-muted-foreground line-clamp-2">{msg.message}</p>
                            </div>
                            <Badge 
                              className={`ml-3 ${
                                msg.status === 'sent' || msg.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                msg.status === 'failed' ? 'bg-red-100 text-red-700' :
                                'bg-muted text-muted-foreground'
                              }`}
                            >
                              {msg.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                            <div className="flex items-center gap-1">
                              {msg.deliveryMethod === 'both' ? (
                                <>
                                  <Mail className="w-3 h-3" />
                                  <Phone className="w-3 h-3" />
                                </>
                              ) : msg.deliveryMethod === 'email' ? (
                                <Mail className="w-3 h-3" />
                              ) : (
                                <Phone className="w-3 h-3" />
                              )}
                              <span>{msg.deliveryMethod}</span>
                            </div>
                            <span>•</span>
                            <span>{new Date(msg.createdAt).toLocaleString()}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4 pt-6 border-t border-border bg-background px-6 py-4">
            <Button
              variant="outline"
              onClick={() => setCommunicationDialogOpen(false)}
              className="px-6 border-border hover:bg-muted text-muted-foreground"
              data-testid="button-cancel-communication"
            >
              {t('dispatcherDashboard.communication.cancel')}
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={sendMessageMutation.isPending}
              className="px-6 bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
              data-testid="button-send-message"
            >
              <Send className="w-4 h-4" />
              {sendMessageMutation.isPending ? t('dispatcherDashboard.communication.sending') : t('dispatcherDashboard.communication.sendMessage')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Emergency Support Dialog */}
      <Dialog open={emergencySupportOpen} onOpenChange={setEmergencySupportOpen}>
        <DialogContent className="fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-0 border border-border p-0 shadow-xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-xl max-w-4xl max-h-[90vh] overflow-hidden bg-background">
          <DialogHeader className="bg-background px-6 py-5 border-b border-border">
            <DialogTitle className="text-2xl font-semibold text-foreground flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              {t('dispatcherDashboard.emergency.title')}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm mt-2">
              {t('dispatcherDashboard.emergency.description')}
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 py-6 overflow-y-auto max-h-[calc(90vh-200px)] bg-muted">
            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              <Button
                variant={activeTab === 'create' ? 'default' : 'outline'}
                onClick={() => setActiveTab('create')}
                className={activeTab === 'create' ? 'bg-red-600 hover:bg-red-700 text-white' : 'border-border hover:bg-muted text-muted-foreground'}
                data-testid="button-tab-create"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('dispatcherDashboard.emergency.reportIncident')}
              </Button>
              <Button
                variant={activeTab === 'active' ? 'default' : 'outline'}
                onClick={() => setActiveTab('active')}
                className={activeTab === 'active' ? 'bg-red-600 hover:bg-red-700 text-white' : 'border-border hover:bg-muted text-muted-foreground'}
                data-testid="button-tab-active"
              >
                <Activity className="w-4 h-4 mr-2" />
                {t('dispatcherDashboard.emergency.activeIncidents')} ({emergencyIncidents?.filter((i: any) => i.status === 'open' || i.status === 'in_progress').length || 0})
              </Button>
            </div>

            {/* Create Incident Tab */}
            {activeTab === 'create' && (
              <div className="space-y-6">
                <Card className="bg-background border-border">
                  <CardContent className="p-6">
                    <div className="grid gap-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-muted-foreground font-medium mb-2 block">{t('dispatcherDashboard.emergency.incidentType')}</Label>
                          <Select value={incidentType} onValueChange={(value: any) => setIncidentType(value)}>
                            <SelectTrigger className="bg-background border-border" data-testid="select-incident-type">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-background border-border">
                              <SelectItem value="accident">{t('dispatcherDashboard.emergency.typeAccident')}</SelectItem>
                              <SelectItem value="breakdown">{t('dispatcherDashboard.emergency.typeBreakdown')}</SelectItem>
                              <SelectItem value="medical">{t('dispatcherDashboard.emergency.typeMedical')}</SelectItem>
                              <SelectItem value="safety">{t('dispatcherDashboard.emergency.typeSafety')}</SelectItem>
                              <SelectItem value="other">{t('dispatcherDashboard.emergency.typeOther')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-muted-foreground font-medium mb-2 block">{t('dispatcherDashboard.emergency.severityLevel')}</Label>
                          <Select value={incidentSeverity} onValueChange={(value: any) => setIncidentSeverity(value)}>
                            <SelectTrigger className="bg-background border-border" data-testid="select-severity">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-background border-border">
                              <SelectItem value="low">{t('dispatcherDashboard.emergency.severityLow')}</SelectItem>
                              <SelectItem value="medium">{t('dispatcherDashboard.emergency.severityMedium')}</SelectItem>
                              <SelectItem value="high">{t('dispatcherDashboard.emergency.severityHigh')}</SelectItem>
                              <SelectItem value="critical">{t('dispatcherDashboard.emergency.severityCritical')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label className="text-muted-foreground font-medium mb-2 block">{t('dispatcherDashboard.emergency.driver')}</Label>
                        <Select value={incidentDriverId} onValueChange={setIncidentDriverId}>
                          <SelectTrigger className="bg-background border-border" data-testid="select-driver">
                            <SelectValue placeholder={t('dispatcherDashboard.emergency.selectDriverIfApplicable')} />
                          </SelectTrigger>
                          <SelectContent className="bg-background border-border">
                            <SelectItem value="none">{t('dispatcherDashboard.emergency.noDriverSelected')}</SelectItem>
                            {activeDrivers?.map((driver: any) => (
                              <SelectItem key={driver.userId} value={driver.userId}>
                                {driver.firstName} {driver.lastName} - {driver.vehicleModel}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-muted-foreground font-medium mb-2 block">{t('dispatcherDashboard.emergency.location')}</Label>
                        <Input
                          value={incidentLocation}
                          onChange={(e) => setIncidentLocation(e.target.value)}
                          placeholder={t('dispatcherDashboard.emergency.locationPlaceholder')}
                          className="bg-background border-border"
                          data-testid="input-location"
                        />
                      </div>

                      <div>
                        <Label className="text-muted-foreground font-medium mb-2 block">{t('dispatcherDashboard.emergency.descriptionLabel')}</Label>
                        <Textarea
                          value={incidentDescription}
                          onChange={(e) => setIncidentDescription(e.target.value)}
                          placeholder={t('dispatcherDashboard.emergency.descriptionPlaceholder')}
                          rows={4}
                          className="bg-background border-border"
                          data-testid="textarea-description"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Active Incidents Tab */}
            {activeTab === 'active' && (
              <div className="space-y-4">
                {!emergencyIncidents || emergencyIncidents.length === 0 ? (
                  <Card className="bg-background border-border">
                    <CardContent className="p-8 text-center">
                      <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">{t('dispatcherDashboard.emergency.noIncidentsReported')}</p>
                    </CardContent>
                  </Card>
                ) : (
                  emergencyIncidents.map((incident: any) => (
                    <Card key={incident.id} className="bg-background border-border">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <Badge 
                                className={`${
                                  incident.incidentType === 'medical' ? 'bg-red-100 text-red-700' :
                                  incident.incidentType === 'accident' ? 'bg-orange-100 text-orange-700' :
                                  incident.incidentType === 'breakdown' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-muted text-muted-foreground'
                                }`}
                              >
                                {incident.incidentType}
                              </Badge>
                              <Badge 
                                className={`${
                                  incident.severity === 'critical' ? 'bg-red-100 text-red-700' :
                                  incident.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                                  incident.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-blue-100 text-blue-700'
                                }`}
                              >
                                {incident.severity}
                              </Badge>
                              <Badge 
                                className={`${
                                  incident.status === 'open' || incident.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                  incident.status === 'resolved' ? 'bg-green-100 text-green-700' :
                                  'bg-muted text-muted-foreground'
                                }`}
                              >
                                {incident.status.replace('_', ' ')}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                              <div>
                                <span className="text-muted-foreground">{t('dispatcherDashboard.emergency.location')}:</span>
                                <p className="text-foreground font-medium">{incident.location}</p>
                              </div>
                              {incident.driverName && (
                                <div>
                                  <span className="text-muted-foreground">{t('dispatcherDashboard.emergency.driver')}:</span>
                                  <p className="text-foreground font-medium">{incident.driverName}</p>
                                </div>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{incident.description}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-3">
                              <span>{t('dispatcherDashboard.emergency.reportedBy')}: {incident.reporterName}</span>
                              <span>•</span>
                              <span>{new Date(incident.createdAt).toLocaleString()}</span>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            {incident.status === 'open' && (
                              <Button
                                size="sm"
                                onClick={() => updateIncidentMutation.mutate({ 
                                  id: incident.id, 
                                  updates: { status: 'in_progress' } 
                                })}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                data-testid={`button-progress-${incident.id}`}
                              >
                                {t('dispatcherDashboard.emergency.inProgress')}
                              </Button>
                            )}
                            {(incident.status === 'open' || incident.status === 'in_progress') && (
                              <Button
                                size="sm"
                                onClick={() => updateIncidentMutation.mutate({ 
                                  id: incident.id, 
                                  updates: { status: 'resolved' } 
                                })}
                                className="bg-green-600 hover:bg-green-700 text-white"
                                data-testid={`button-resolve-${incident.id}`}
                              >
                                {t('dispatcherDashboard.emergency.resolve')}
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-4 pt-6 border-t border-border bg-background px-6 py-4">
            <Button
              variant="outline"
              onClick={() => setEmergencySupportOpen(false)}
              className="px-6 border-border hover:bg-muted text-muted-foreground"
              data-testid="button-cancel-emergency"
            >
              {t('dispatcherDashboard.emergency.close')}
            </Button>
            {activeTab === 'create' && (
              <Button
                onClick={handleCreateIncident}
                disabled={createIncidentMutation.isPending}
                className="px-6 bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
                data-testid="button-submit-incident"
              >
                <AlertTriangle className="w-4 h-4" />
                {createIncidentMutation.isPending ? t('dispatcherDashboard.emergency.reporting') : t('dispatcherDashboard.emergency.reportIncident')}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}