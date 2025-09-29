import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Booking from "@/pages/booking";
import VehicleDetail from "@/pages/VehicleDetail";
import ServiceDetail from "@/pages/ServiceDetail";
import AdminDashboard from "@/pages/admin-dashboard";
import DriverDashboard from "@/pages/driver-dashboard";
import PassengerDashboard from "@/pages/passenger-dashboard";
import Checkout from "@/pages/checkout";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/booking" component={Booking} />
      <Route path="/vehicle/:id" component={VehicleDetail} />
      <Route path="/service/:id" component={ServiceDetail} />
      {!isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/checkout" component={Checkout} />
          {user?.role === 'admin' && (
            <Route path="/admin" component={AdminDashboard} />
          )}
          {user?.role === 'driver' && (
            <Route path="/driver" component={DriverDashboard} />
          )}
          {user?.role === 'passenger' && (
            <Route path="/passenger" component={PassengerDashboard} />
          )}
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
