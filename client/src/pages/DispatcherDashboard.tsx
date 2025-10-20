import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  AlertTriangle
} from "lucide-react";

export default function DispatcherDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");

  const { data: dashboardStats } = useQuery({
    queryKey: ["/api/dispatcher/stats"],
    retry: false,
  });

  // Fetch all bookings
  const { data: allBookings } = useQuery<any[]>({
    queryKey: ['/api/admin/bookings'],
    retry: false,
  });

  // Fetch active drivers
  const { data: activeDrivers } = useQuery<any[]>({
    queryKey: ['/api/admin/active-drivers'],
    retry: false,
  });

  // Filter pending bookings (not assigned to a driver yet)
  const pendingBookings = Array.isArray(allBookings) 
    ? allBookings.filter((booking: any) => booking.status === 'pending' && !booking.driverId)
    : [];

  // Assign driver mutation
  const assignDriverMutation = useMutation({
    mutationFn: async ({ bookingId, driverId }: { bookingId: string; driverId: string }) => {
      const response = await apiRequest('PATCH', `/api/admin/bookings/${bookingId}/assign-driver`, { driverId });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to assign driver');
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/bookings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dispatcher/stats'] });
      setAssignDialogOpen(false);
      setSelectedBookingId(null);
      setSelectedDriverId("");
      toast({
        title: "Driver Assigned",
        description: "The driver has been successfully assigned to the ride.",
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
    assignDriverMutation.mutate({ bookingId: selectedBookingId, driverId: selectedDriverId });
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
      action: () => console.log("Fleet monitor"),
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
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white" data-testid="dispatcher-welcome">
              Dispatcher Control Center
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-2">
              Welcome back, {user?.firstName || user?.email}
            </p>
            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>{new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>{new Date().toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit'
                })}</span>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statsCards.map((stat, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    {stat.title}
                  </CardTitle>
                  <div className={stat.color}>
                    {stat.icon}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white" data-testid={`stat-${index}-value`}>
                    {stat.value}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400" data-testid={`stat-${index}-change`}>
                    {stat.change}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white" data-testid="quick-actions-title">
              Quick Actions
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {quickActions.map((action, index) => (
                <Card 
                  key={index} 
                  className="group hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1"
                  onClick={action.action}
                >
                  <CardHeader className="text-center p-6">
                    <div className={`inline-flex items-center justify-center p-3 ${action.color} text-white rounded-xl mb-4 mx-auto group-hover:scale-110 transition-transform duration-300`}>
                      {action.icon}
                    </div>
                    <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors duration-300" data-testid={`action-${index}-title`}>
                      {action.title}
                    </CardTitle>
                    <CardDescription className="text-sm" data-testid={`action-${index}-description`}>
                      {action.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>

          {/* Recent Activity and Alerts */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5" />
                  <span>Recent Activity</span>
                </CardTitle>
                <CardDescription>
                  Latest fleet operations and ride assignments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Ride #R-2024-1205 assigned to Driver John D.</p>
                      <p className="text-xs text-gray-500">2 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Driver Maria S. went online at Downtown</p>
                      <p className="text-xs text-gray-500">5 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">New ride request from Houston Airport</p>
                      <p className="text-xs text-gray-500">8 minutes ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5" />
                  <span>System Alerts</span>
                </CardTitle>
                <CardDescription>
                  Important notifications and warnings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">High demand detected in Galleria area</p>
                      <p className="text-xs text-gray-500">Consider deploying additional drivers</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <Activity className="w-4 h-4 text-blue-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Vehicle #V-101 due for maintenance</p>
                      <p className="text-xs text-gray-500">Schedule maintenance appointment</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <Users className="w-4 h-4 text-green-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">All systems operational</p>
                      <p className="text-xs text-gray-500">Fleet performance is optimal</p>
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
        <DialogContent className="bg-[#ffffff] max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assign Ride to Driver</DialogTitle>
            <DialogDescription>
              Select a pending ride and assign it to an available driver
            </DialogDescription>
          </DialogHeader>

          <div className="grid md:grid-cols-2 gap-6 mt-4">
            {/* Pending Bookings Section */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Pending Bookings ({pendingBookings.length})
              </h3>
              {pendingBookings.length === 0 ? (
                <div className="text-center p-6 border rounded-lg bg-muted/50">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No pending bookings</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {pendingBookings.map((booking: any) => (
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
                              <Badge variant="outline" className="mt-1">
                                {booking.bookingType}
                              </Badge>
                            </div>
                            <Badge variant="secondary">
                              {booking.vehicleTypeName}
                            </Badge>
                          </div>
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
                  ))}
                </div>
              )}
            </div>

            {/* Available Drivers Section */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Car className="w-4 h-4" />
                Available Drivers ({activeDrivers?.length || 0})
              </h3>
              {!activeDrivers || activeDrivers.length === 0 ? (
                <div className="text-center p-6 border rounded-lg bg-muted/50">
                  <Car className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No available drivers</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
                    <SelectTrigger data-testid="select-driver">
                      <SelectValue placeholder="Select a driver" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeDrivers.map((driver: any) => (
                        <SelectItem 
                          key={driver.id} 
                          value={driver.id}
                          data-testid={`driver-option-${driver.id}`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span>{driver.firstName} {driver.lastName}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              ⭐ {driver.rating || 'N/A'}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedDriverId && activeDrivers.find((d: any) => d.id === selectedDriverId) && (
                    <Card className="bg-muted/50">
                      <CardContent className="p-4">
                        {(() => {
                          const driver = activeDrivers.find((d: any) => d.id === selectedDriverId);
                          return (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <h4 className="font-semibold">
                                  {driver.firstName} {driver.lastName}
                                </h4>
                                <Badge variant="secondary">
                                  {driver.isAvailable ? 'Available' : 'Busy'}
                                </Badge>
                              </div>
                              <div className="text-sm space-y-1 text-muted-foreground">
                                <div className="flex items-center justify-between">
                                  <span>Rating:</span>
                                  <span className="font-medium">⭐ {driver.rating || 'N/A'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span>Total Rides:</span>
                                  <span className="font-medium">{driver.totalRides || 0}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span>Email:</span>
                                  <span className="font-medium text-xs">{driver.email}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  )}
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
              {assignDriverMutation.isPending ? 'Assigning...' : 'Assign Driver'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}