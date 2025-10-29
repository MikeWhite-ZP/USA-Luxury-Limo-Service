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
  Navigation
} from "lucide-react";
import { rankDrivers, formatMatchInfo, getBestDriver, type DriverWithExtras, type RankedDriver } from "@/lib/driverMatching";

export default function DispatcherDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [fleetMonitorOpen, setFleetMonitorOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"time" | "match">("match");

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
    if (!enhancedDrivers || !selectedBooking) return [];
    
    return rankDrivers(enhancedDrivers, {
      pickupAddress: selectedBooking.pickupAddress,
      pickupCoordinates: selectedBooking.pickupCoordinates,
      scheduledDateTime: selectedBooking.scheduledDateTime,
      passengerCount: selectedBooking.passengerCount,
    });
  }, [enhancedDrivers, selectedBooking]);

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

  const handleAssignClick = () => {
    setAssignDialogOpen(true);
    setSearchQuery("");
    setVehicleTypeFilter("all");
    setSortBy("match");
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
      icon: <RadioIcon className="w-6 h-6" />,
      action: () => console.log("Driver communication"),
      color: "bg-purple-500"
    },
    {
      title: "Emergency Support",
      description: "Handle urgent requests and incidents",
      icon: <AlertTriangle className="w-6 h-6" />,
      action: () => console.log("Emergency support"),
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
        <DialogContent className="fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 border p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto bg-[#ffffff]">
          <DialogHeader>
            <DialogTitle className="text-lg leading-none tracking-tight text-[#d82527] font-bold">Assign/Reassign Ride to Driver</DialogTitle>
            <DialogDescription>
              Select a pending ride to assign or an assigned ride to change the driver
            </DialogDescription>
          </DialogHeader>

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
                <h3 className="font-semibold flex items-center gap-2 text-[#028848]">
                  <Clock className="w-4 h-4" />
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
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-[#0178f2]">
                <Car className="w-4 h-4" />
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

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setAssignDialogOpen(false);
                setSelectedBookingId(null);
                setSelectedDriverId("");
              }}
              data-testid="button-cancel-assign"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignSubmit}
              disabled={!selectedBookingId || !selectedDriverId || assignDriverMutation.isPending}
              data-testid="button-confirm-assign"
            >
              {getButtonText()}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fleet Monitor Dialog */}
      <Dialog open={fleetMonitorOpen} onOpenChange={setFleetMonitorOpen}>
        <DialogContent className="fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 border p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg max-w-6xl max-h-[90vh] overflow-y-auto bg-[#ffffff]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Fleet Monitor - Live Status
            </DialogTitle>
            <DialogDescription>
              Real-time overview of all drivers and vehicles in the fleet
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
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
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setFleetMonitorOpen(false)}
              data-testid="button-close-fleet-monitor"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}