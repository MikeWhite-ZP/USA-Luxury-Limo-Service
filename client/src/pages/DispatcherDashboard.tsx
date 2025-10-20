import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

  const { data: dashboardStats } = useQuery({
    queryKey: ["/api/dispatcher/stats"],
    retry: false,
  });

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
      action: () => console.log("Assign ride"),
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
    </div>
  );
}