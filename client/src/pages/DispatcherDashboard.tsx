import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
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
  const [incidentType, setIncidentType] = useState<"accident" | "breakdown" | "medical" | "security" | "other">("accident");
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
        title: result.isReassignment ? "Driver Reassigned" : "Driver Assigned",
        description: result.isReassignment 
          ? "The driver has been successfully changed for this ride."
          : "The driver has been successfully assigned to the ride.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Assignment Failed",
        description: error.message || "Failed to assign driver to ride",
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
        title: "Message Sent",
        description: result.smsSent && result.emailSent 
          ? "Message sent via SMS and email"
          : result.smsSent 
          ? "Message sent via SMS"
          : result.emailSent
          ? "Message sent via email"
          : "Message queued for delivery",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Send Message",
        description: error.message || "Could not send message to driver(s)",
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
        title: "Incident Reported",
        description: "Emergency incident has been created and logged",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Report Incident",
        description: error.message || "Could not create emergency incident",
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
        title: "Incident Updated",
        description: "Emergency incident status has been updated",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Could not update incident",
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
        title: "Message Required",
        description: "Please enter a message to send",
        variant: "destructive",
      });
      return;
    }

    if (messageType === 'individual' && !selectedDriverForMessage) {
      toast({
        title: "Driver Required",
        description: "Please select a driver to send the message to",
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
        title: "Missing Information",
        description: "Please provide location and description for the incident",
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
        title: "Selection Required",
        description: "Please select both a booking and a driver",
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
        title: "Selection Required",
        description: "Please select a booking first",
        variant: "destructive",
      });
      return;
    }

    const bestDriver = getBestDriver(enhancedDrivers as DriverWithExtras[], selectedBooking);
    
    if (!bestDriver) {
      toast({
        title: "No Drivers Available",
        description: "There are no suitable drivers available for this booking",
        variant: "destructive",
      });
      return;
    }

    if (bestDriver.matchScore < 40) {
      toast({
        title: "Low Match Score",
        description: `Best available driver has a low match score (${bestDriver.matchScore}/100). Consider manual selection.`,
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
            title: "Auto-Assigned Successfully",
            description: `${bestDriver.firstName} ${bestDriver.lastName} (${matchInfo.badge}: ${bestDriver.matchScore}/100${distanceInfo})`,
          });
        }
      }
    );
  };

  // Determine button text based on selected booking
  const getButtonText = () => {
    if (assignDriverMutation.isPending) return 'Processing...';
    if (!selectedBookingId) return 'Select Booking & Driver';
    const selectedBooking = allBookings?.find((b: any) => b.id === selectedBookingId);
    return selectedBooking?.driverId ? 'Reassign Driver' : 'Assign Driver';
  };

  const statsCards = [
    {
      title: "Active Drivers",
      value: (dashboardStats as any)?.activeDrivers?.toString() || "0",
      change: "Available and verified drivers",
      icon: <Car className="w-6 h-6" />,
      color: "text-green-600"
    },
    {
      title: "Active Rides",
      value: (dashboardStats as any)?.activeRides?.toString() || "0",
      change: "Currently in progress",
      icon: <Activity className="w-6 h-6" />,
      color: "text-blue-600"
    },
    {
      title: "Pending Requests",
      value: (dashboardStats as any)?.pendingRequests?.toString() || "0",
      change: "Awaiting assignment",
      icon: <Clock className="w-6 h-6" />,
      color: "text-orange-600"
    },
    {
      title: "Fleet Utilization",
      value: (dashboardStats as any)?.fleetUtilization || "0%",
      change: "Vehicles currently in use",
      icon: <BarChart3 className="w-6 h-6" />,
      color: "text-purple-600"
    }
  ];

  const quickActions = [
    {
      title: "Assign Ride",
      description: "Manually assign pending rides to available drivers",
      icon: <UserCheck className="w-6 h-6" />,
      action: handleAssignClick,
      color: "bg-blue-500"
    },
    {
      title: "Fleet Monitor",
      description: "Real-time location and status of all vehicles",
      icon: <MapPin className="w-6 h-6" />,
      action: () => setFleetMonitorOpen(true),
      color: "bg-green-500"
    },
    {
      title: "Driver Communication",
      description: "Send messages or alerts to drivers",
      icon: <MessageSquare className="w-6 h-6" />,
      action: () => setCommunicationDialogOpen(true),
      color: "bg-purple-500"
    },
    {
      title: "Emergency Support",
      description: "Handle urgent requests and incidents",
      icon: <AlertTriangle className="w-6 h-6" />,
      action: () => setEmergencySupportOpen(true),
      color: "bg-red-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
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
                    Dispatcher Control Center
                  </h1>
                  <p className="text-slate-300 text-lg mt-1">
                    Welcome back, <span className="font-semibold text-white">{user?.firstName || user?.email}</span>
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
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statsCards.map((stat, index) => (
              <div 
                key={index} 
                className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:shadow-2xl hover:scale-105"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-slate-200">
                    {stat.title}
                  </span>
                  <div className="bg-white/20 p-2 rounded-lg">
                    <div className="text-cyan-300">
                      {stat.icon}
                    </div>
                  </div>
                </div>
                <div className="text-3xl font-bold text-white mb-1" data-testid={`stat-${index}-value`}>
                  {stat.value}
                </div>
                <p className="text-xs text-slate-300" data-testid={`stat-${index}-change`}>
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
            <h2 className="text-2xl font-bold mb-6 text-slate-800" data-testid="quick-actions-title">
              Quick Actions
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {quickActions.map((action, index) => (
                <Card 
                  key={index} 
                  className="group hover:shadow-2xl transition-all duration-300 cursor-pointer hover:-translate-y-2 border-slate-200 bg-white"
                  onClick={action.action}
                >
                  <CardHeader className="text-center p-6">
                    <div className={`inline-flex items-center justify-center p-4 ${action.color} text-white rounded-2xl mb-4 mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                      {action.icon}
                    </div>
                    <CardTitle className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors duration-300" data-testid={`action-${index}-title`}>
                      {action.title}
                    </CardTitle>
                    <CardDescription className="text-sm text-slate-600" data-testid={`action-${index}-description`}>
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
            <Card className="shadow-lg border-slate-200 bg-white">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                <CardTitle className="flex items-center space-x-2 text-slate-800">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Activity className="w-5 h-5 text-blue-600" />
                  </div>
                  <span>Recent Activity</span>
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Latest fleet operations and ride assignments
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                    <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-800">Ride #R-2024-1205 assigned to Driver John D.</p>
                      <p className="text-xs text-slate-500 mt-1">2 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-800">Driver Maria S. went online at Downtown</p>
                      <p className="text-xs text-slate-500 mt-1">5 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-200">
                    <div className="w-2.5 h-2.5 bg-orange-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-800">New ride request from Houston Airport</p>
                      <p className="text-xs text-slate-500 mt-1">8 minutes ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Alerts */}
            <Card className="shadow-lg border-slate-200 bg-white">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                <CardTitle className="flex items-center space-x-2 text-slate-800">
                  <div className="bg-orange-100 p-2 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                  </div>
                  <span>System Alerts</span>
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Important notifications and warnings
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-500 rounded-lg shadow-sm">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-800">High demand detected in Galleria area</p>
                      <p className="text-xs text-slate-600 mt-1">Consider deploying additional drivers</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-l-4 border-blue-500 rounded-lg shadow-sm">
                    <Activity className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-800">Vehicle #V-101 due for maintenance</p>
                      <p className="text-xs text-slate-600 mt-1">Schedule maintenance appointment</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-lg shadow-sm">
                    <Users className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-800">All systems operational</p>
                      <p className="text-xs text-slate-600 mt-1">Fleet performance is optimal</p>
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
        <DialogContent className="fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-0 border border-slate-200 p-0 shadow-xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-xl max-w-4xl max-h-[90vh] overflow-hidden bg-white">
          <DialogHeader className="bg-white px-6 py-5 border-b border-slate-200">
            <DialogTitle className="text-2xl font-semibold text-slate-900 flex items-center gap-3">
              <UserCheck className="w-6 h-6 text-blue-600" />
              Assign/Reassign Ride to Driver
            </DialogTitle>
            <DialogDescription className="text-slate-600 text-sm mt-2">
              Select a pending ride to assign or an assigned ride to change the driver
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-6 overflow-y-auto max-h-[calc(90vh-200px)] bg-slate-50">

          {/* Search and Filter Controls */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search bookings by passenger, location, ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-bookings"
                />
              </div>
            </div>
            <Select value={vehicleTypeFilter} onValueChange={setVehicleTypeFilter}>
              <SelectTrigger className="w-[200px]" data-testid="select-vehicle-filter">
                <SelectValue placeholder="Filter by vehicle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vehicle Types</SelectItem>
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
                <SelectItem value="match">Sort by Match</SelectItem>
                <SelectItem value="time">Sort by Time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-4">
            {/* Pending & Assigned Bookings Combined Section */}
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-lg flex items-center gap-2 text-slate-700">
                  <div className="bg-blue-100 p-1.5 rounded-lg">
                    <Clock className="w-4 h-4 text-blue-600" />
                  </div>
                  All Bookings ({filteredBookings.length})
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
                    Auto-Assign Best Driver
                  </Button>
                )}
              </div>
              {filteredBookings.length === 0 ? (
                <div className="text-center p-6 border rounded-lg bg-muted/50">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {searchQuery || vehicleTypeFilter !== "all" ? "No bookings match your filters" : "No bookings available"}
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
                                      Urgent
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
                                  Currently: {booking.driverFirstName} {booking.driverLastName}
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
                                {booking.passengerCount} passenger{booking.passengerCount > 1 ? 's' : ''}
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
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-slate-700">
                <div className="bg-green-100 p-1.5 rounded-lg">
                  <Car className="w-4 h-4 text-green-600" />
                </div>
                Available Drivers ({rankedDrivers.length})
              </h3>
              {!selectedBookingId ? (
                <div className="text-center p-6 border rounded-lg bg-muted/50">
                  <Car className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Select a booking to see ranked drivers</p>
                </div>
              ) : rankedDrivers.length === 0 ? (
                <div className="text-center p-6 border rounded-lg bg-muted/50">
                  <Car className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No drivers available</p>
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
                                    • {driver.totalRides || 0} rides
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-bold text-blue-600">
                                  {driver.matchScore}/100
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Match Score
                                </div>
                              </div>
                            </div>

                            {/* Distance Info */}
                            {driver.distanceMiles !== undefined && (
                              <div className="flex items-center gap-1 text-xs bg-blue-50 p-2 rounded">
                                <Navigation className="w-3 h-3 text-blue-600" />
                                <span className="text-blue-800 font-medium">
                                  {driver.distanceMiles.toFixed(1)} mi away
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
                                <div className="font-medium mb-1">⚠️ Schedule Conflict</div>
                                <div>
                                  {new Date(driver.conflictingBooking.scheduledDateTime).toLocaleTimeString()} - {driver.conflictingBooking.passengerName}
                                </div>
                              </div>
                            )}

                            {/* Additional Driver Info */}
                            <div className="text-xs space-y-1 text-muted-foreground pt-2 border-t">
                              <div className="flex items-center justify-between">
                                <span>Status:</span>
                                <Badge variant={driver.isAvailable ? "default" : "secondary"} className="text-xs">
                                  {driver.isAvailable ? 'Available' : 'Busy'}
                                </Badge>
                              </div>
                              {driver.vehiclePlate && (
                                <div className="flex items-center justify-between">
                                  <span>Vehicle:</span>
                                  <span className="font-mono font-medium bg-gray-100 px-2 py-0.5 rounded">{driver.vehiclePlate}</span>
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

          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-200 bg-white px-6 py-4">
            <Button
              variant="outline"
              onClick={() => {
                setAssignDialogOpen(false);
                setSelectedBookingId(null);
                setSelectedDriverId("");
              }}
              className="px-6 border-slate-300 hover:bg-slate-100 text-slate-700"
              data-testid="button-cancel-assign"
            >
              Cancel
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
        <DialogContent className="fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-0 border border-slate-200 p-0 shadow-xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-xl max-w-6xl max-h-[90vh] overflow-hidden bg-white">
          <DialogHeader className="bg-white px-6 py-5 border-b border-slate-200">
            <DialogTitle className="text-2xl font-semibold text-slate-900 flex items-center gap-3">
              <MapPin className="w-6 h-6 text-green-600" />
              Fleet Monitor - Live Status
            </DialogTitle>
            <DialogDescription className="text-slate-600 text-sm mt-2">
              Real-time overview of all drivers and vehicles in the fleet
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-6 overflow-y-auto max-h-[calc(90vh-200px)] bg-slate-50">
            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <Card className="bg-green-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Available</p>
                      <p className="text-2xl font-bold text-green-600">
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
                      <p className="text-xs text-muted-foreground">On Ride</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {allDrivers?.filter((d: any) => !d.isAvailable).length || 0}
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
                      <p className="text-xs text-muted-foreground">Offline</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {allDrivers?.filter((d: any) => !d.isActive).length || 0}
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
                      <p className="text-xs text-muted-foreground">Total Fleet</p>
                      <p className="text-2xl font-bold text-purple-600">
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
                  <p className="text-muted-foreground">No drivers in fleet</p>
                </div>
              ) : (
                allDrivers.map((driver: any) => {
                  const currentRide = allBookings?.find(
                    (b: any) => b.driverId === driver.id && (b.status === 'in_progress' || b.status === 'pending')
                  );
                  const isOnRide = !!currentRide;
                  const statusColor = driver.isAvailable ? 'green' : isOnRide ? 'blue' : 'orange';
                  const statusText = driver.isAvailable ? 'Available' : isOnRide ? 'On Ride' : 'Offline';

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
                                  <span className="text-xs">Email:</span>
                                  <span className="text-xs">{driver.email}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs">Rating:</span>
                                    <span className="text-xs font-medium">⭐ {driver.rating || 'N/A'}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs">Total Rides:</span>
                                    <span className="text-xs font-medium">{driver.totalRides || 0}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Current Ride Info */}
                              {currentRide && (
                                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                  <p className="text-xs font-medium text-blue-900 mb-2">Current Ride:</p>
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

                          {/* Vehicle Info */}
                          <div className="text-right">
                            <Badge variant="outline" className="mb-2">
                              {driver.vehicleType || 'No Vehicle'}
                            </Badge>
                            <p className="text-xs text-muted-foreground">
                              {driver.vehiclePlate || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>

          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-200 bg-white px-6 py-4">
            <Button
              variant="outline"
              onClick={() => setFleetMonitorOpen(false)}
              className="px-6 border-slate-300 hover:bg-slate-100 text-slate-700"
              data-testid="button-close-fleet-monitor"
            >
              Close
            </Button>
          </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Driver Communication Dialog */}
      <Dialog open={communicationDialogOpen} onOpenChange={setCommunicationDialogOpen}>
        <DialogContent className="fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-0 border border-slate-200 p-0 shadow-xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-xl max-w-2xl max-h-[90vh] overflow-hidden bg-white">
          <DialogHeader className="bg-white px-6 py-5 border-b border-slate-200">
            <DialogTitle className="text-2xl font-semibold text-slate-900 flex items-center gap-3">
              <MessageSquare className="w-6 h-6 text-purple-600" />
              Driver Communication
            </DialogTitle>
            <DialogDescription className="text-slate-600 text-sm mt-2">
              Send messages or alerts to your driver team
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-6 overflow-y-auto max-h-[calc(90vh-200px)] bg-slate-50">
            <div className="space-y-5">
              {/* Message Type */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Message Type</Label>
                <Select value={messageType} onValueChange={(v) => setMessageType(v as "individual" | "broadcast")}>
                  <SelectTrigger className="w-full bg-white" data-testid="select-message-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual Driver</SelectItem>
                    <SelectItem value="broadcast">Broadcast to All Drivers</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Driver Selection (only for individual messages) */}
              {messageType === 'individual' && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Select Driver</Label>
                  <Select value={selectedDriverForMessage} onValueChange={setSelectedDriverForMessage}>
                    <SelectTrigger className="w-full bg-white" data-testid="select-driver">
                      <SelectValue placeholder="Choose a driver..." />
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
                <Label className="text-sm font-medium text-slate-700">Subject (optional)</Label>
                <Input
                  placeholder="Message subject..."
                  value={messageSubject}
                  onChange={(e) => setMessageSubject(e.target.value)}
                  className="bg-white"
                  data-testid="input-subject"
                />
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Message *</Label>
                <Textarea
                  placeholder="Type your message here..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="min-h-[120px] bg-white"
                  data-testid="textarea-message"
                />
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Priority</Label>
                <Select value={messagePriority} onValueChange={(v) => setMessagePriority(v as "normal" | "high" | "urgent")}>
                  <SelectTrigger className="w-full bg-white" data-testid="select-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Delivery Method */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Delivery Method</Label>
                <Select value={deliveryMethod} onValueChange={(v) => setDeliveryMethod(v as "sms" | "email" | "both")}>
                  <SelectTrigger className="w-full bg-white" data-testid="select-delivery-method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <Phone className="w-4 h-4" />
                        <span>Email & SMS</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="email">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span>Email Only</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="sms">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>SMS Only</span>
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
                    <p className="font-medium mb-1">Sending to:</p>
                    <p>
                      {messageType === 'broadcast' 
                        ? `All active drivers (${activeDrivers.length} drivers)` 
                        : selectedDriverForMessage 
                        ? activeDrivers.find((d: any) => d.userId === selectedDriverForMessage)?.firstName + ' ' + activeDrivers.find((d: any) => d.userId === selectedDriverForMessage)?.lastName
                        : 'No driver selected'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Message History */}
              <div className="mt-8 pt-6 border-t border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Messages</h3>
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {!driverMessages || driverMessages.length === 0 ? (
                    <div className="text-center p-8 border rounded-lg bg-white">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                      <p className="text-sm text-slate-500">No messages sent yet</p>
                    </div>
                  ) : (
                    driverMessages.map((msg: any) => (
                      <Card key={msg.id} className="bg-white">
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
                                    'border-slate-300 text-slate-600'
                                  }`}
                                >
                                  {msg.priority}
                                </Badge>
                              </div>
                              {msg.subject && (
                                <p className="font-medium text-sm text-slate-900 mb-1">{msg.subject}</p>
                              )}
                              <p className="text-sm text-slate-600 line-clamp-2">{msg.message}</p>
                            </div>
                            <Badge 
                              className={`ml-3 ${
                                msg.status === 'sent' || msg.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                msg.status === 'failed' ? 'bg-red-100 text-red-700' :
                                'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {msg.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
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

          <div className="flex justify-end gap-3 mt-4 pt-6 border-t border-slate-200 bg-white px-6 py-4">
            <Button
              variant="outline"
              onClick={() => setCommunicationDialogOpen(false)}
              className="px-6 border-slate-300 hover:bg-slate-100 text-slate-700"
              data-testid="button-cancel-communication"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={sendMessageMutation.isPending}
              className="px-6 bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
              data-testid="button-send-message"
            >
              <Send className="w-4 h-4" />
              {sendMessageMutation.isPending ? 'Sending...' : 'Send Message'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Emergency Support Dialog */}
      <Dialog open={emergencySupportOpen} onOpenChange={setEmergencySupportOpen}>
        <DialogContent className="fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-0 border border-slate-200 p-0 shadow-xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-xl max-w-4xl max-h-[90vh] overflow-hidden bg-white">
          <DialogHeader className="bg-white px-6 py-5 border-b border-slate-200">
            <DialogTitle className="text-2xl font-semibold text-slate-900 flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              Emergency Support
            </DialogTitle>
            <DialogDescription className="text-slate-600 text-sm mt-2">
              Report and manage emergency incidents and urgent situations
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 py-6 overflow-y-auto max-h-[calc(90vh-200px)] bg-slate-50">
            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              <Button
                variant={activeTab === 'create' ? 'default' : 'outline'}
                onClick={() => setActiveTab('create')}
                className={activeTab === 'create' ? 'bg-red-600 hover:bg-red-700 text-white' : 'border-slate-300 hover:bg-slate-100 text-slate-700'}
                data-testid="button-tab-create"
              >
                <Plus className="w-4 h-4 mr-2" />
                Report Incident
              </Button>
              <Button
                variant={activeTab === 'active' ? 'default' : 'outline'}
                onClick={() => setActiveTab('active')}
                className={activeTab === 'active' ? 'bg-red-600 hover:bg-red-700 text-white' : 'border-slate-300 hover:bg-slate-100 text-slate-700'}
                data-testid="button-tab-active"
              >
                <Activity className="w-4 h-4 mr-2" />
                Active Incidents ({emergencyIncidents?.filter((i: any) => i.status === 'active' || i.status === 'in-progress').length || 0})
              </Button>
            </div>

            {/* Create Incident Tab */}
            {activeTab === 'create' && (
              <div className="space-y-6">
                <Card className="bg-white border-slate-200">
                  <CardContent className="p-6">
                    <div className="grid gap-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-slate-700 font-medium mb-2 block">Incident Type</Label>
                          <Select value={incidentType} onValueChange={(value: any) => setIncidentType(value)}>
                            <SelectTrigger className="bg-white border-slate-300" data-testid="select-incident-type">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-slate-200">
                              <SelectItem value="accident">Accident</SelectItem>
                              <SelectItem value="breakdown">Vehicle Breakdown</SelectItem>
                              <SelectItem value="medical">Medical Emergency</SelectItem>
                              <SelectItem value="security">Security Issue</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-slate-700 font-medium mb-2 block">Severity Level</Label>
                          <Select value={incidentSeverity} onValueChange={(value: any) => setIncidentSeverity(value)}>
                            <SelectTrigger className="bg-white border-slate-300" data-testid="select-severity">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-slate-200">
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="critical">Critical</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label className="text-slate-700 font-medium mb-2 block">Driver (Optional)</Label>
                        <Select value={incidentDriverId} onValueChange={setIncidentDriverId}>
                          <SelectTrigger className="bg-white border-slate-300" data-testid="select-driver">
                            <SelectValue placeholder="Select driver if applicable" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-slate-200">
                            <SelectItem value="">No driver selected</SelectItem>
                            {activeDrivers?.map((driver: any) => (
                              <SelectItem key={driver.userId} value={driver.userId}>
                                {driver.firstName} {driver.lastName} - {driver.vehicleModel}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-slate-700 font-medium mb-2 block">Location</Label>
                        <Input
                          value={incidentLocation}
                          onChange={(e) => setIncidentLocation(e.target.value)}
                          placeholder="Enter incident location"
                          className="bg-white border-slate-300"
                          data-testid="input-location"
                        />
                      </div>

                      <div>
                        <Label className="text-slate-700 font-medium mb-2 block">Description</Label>
                        <Textarea
                          value={incidentDescription}
                          onChange={(e) => setIncidentDescription(e.target.value)}
                          placeholder="Provide detailed description of the incident"
                          rows={4}
                          className="bg-white border-slate-300"
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
                  <Card className="bg-white border-slate-200">
                    <CardContent className="p-8 text-center">
                      <AlertTriangle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                      <p className="text-slate-600">No emergency incidents reported</p>
                    </CardContent>
                  </Card>
                ) : (
                  emergencyIncidents.map((incident: any) => (
                    <Card key={incident.id} className="bg-white border-slate-200">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <Badge 
                                className={`${
                                  incident.incidentType === 'medical' ? 'bg-red-100 text-red-700' :
                                  incident.incidentType === 'accident' ? 'bg-orange-100 text-orange-700' :
                                  incident.incidentType === 'breakdown' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-slate-100 text-slate-700'
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
                                  incident.status === 'active' || incident.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                                  incident.status === 'resolved' ? 'bg-green-100 text-green-700' :
                                  'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {incident.status}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                              <div>
                                <span className="text-slate-500">Location:</span>
                                <p className="text-slate-900 font-medium">{incident.location}</p>
                              </div>
                              {incident.driverName && (
                                <div>
                                  <span className="text-slate-500">Driver:</span>
                                  <p className="text-slate-900 font-medium">{incident.driverName}</p>
                                </div>
                              )}
                            </div>
                            <p className="text-sm text-slate-700">{incident.description}</p>
                            <div className="flex items-center gap-4 text-xs text-slate-500 mt-3">
                              <span>Reported by: {incident.reporterName}</span>
                              <span>•</span>
                              <span>{new Date(incident.createdAt).toLocaleString()}</span>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            {incident.status === 'active' && (
                              <Button
                                size="sm"
                                onClick={() => updateIncidentMutation.mutate({ 
                                  id: incident.id, 
                                  updates: { status: 'in-progress' } 
                                })}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                data-testid={`button-progress-${incident.id}`}
                              >
                                In Progress
                              </Button>
                            )}
                            {(incident.status === 'active' || incident.status === 'in-progress') && (
                              <Button
                                size="sm"
                                onClick={() => updateIncidentMutation.mutate({ 
                                  id: incident.id, 
                                  updates: { status: 'resolved' } 
                                })}
                                className="bg-green-600 hover:bg-green-700 text-white"
                                data-testid={`button-resolve-${incident.id}`}
                              >
                                Resolve
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

          <div className="flex justify-end gap-3 mt-4 pt-6 border-t border-slate-200 bg-white px-6 py-4">
            <Button
              variant="outline"
              onClick={() => setEmergencySupportOpen(false)}
              className="px-6 border-slate-300 hover:bg-slate-100 text-slate-700"
              data-testid="button-cancel-emergency"
            >
              Close
            </Button>
            {activeTab === 'create' && (
              <Button
                onClick={handleCreateIncident}
                disabled={createIncidentMutation.isPending}
                className="px-6 bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
                data-testid="button-submit-incident"
              >
                <AlertTriangle className="w-4 h-4" />
                {createIncidentMutation.isPending ? 'Reporting...' : 'Report Incident'}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}