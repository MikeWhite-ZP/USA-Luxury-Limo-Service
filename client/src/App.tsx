import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Booking from "@/pages/booking";
import VehicleDetail from "@/pages/VehicleDetail";
import ServiceDetail from "@/pages/ServiceDetail";
import TermsOfService from "@/pages/TermsOfService";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import HelpCenter from "@/pages/HelpCenter";
import Safety from "@/pages/Safety";
import AboutUs from "@/pages/AboutUs";
import Locations from "@/pages/Locations";
import FeaturedAreaDetail from "@/pages/FeaturedAreaDetail";
import Hotels from "@/pages/Hotels";
import Contact from "@/pages/contact";
import { RoleLogin } from "@/pages/RoleLogin";
import { AdminLogin } from "@/pages/AdminLogin";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminPricing from "@/pages/admin-pricing";
import DriverDashboard from "@/pages/driver-dashboard";
import DriverDocuments from "@/pages/driver-documents";
import DispatcherDashboard from "@/pages/DispatcherDashboard";
import PassengerDashboard from "@/pages/passenger-dashboard";
import Checkout from "@/pages/checkout";
import AccountPage from "@/pages/account";
import MobileSplash from "@/pages/mobile-splash";
import MobileLogin from "@/pages/mobile-login";
import MobilePassenger from "@/pages/mobile-passenger";
import MobileBooking from "@/pages/mobile-booking";
import MobileBookingDetails from "@/pages/mobile-booking-details";
import MobileInvoices from "@/pages/mobile-invoices";
import MobilePaymentMethods from "@/pages/mobile-payment-methods";
import MobileDriver from "@/pages/mobile-driver";
import MobileDriverRideDetails from "@/pages/mobile-driver-ride-details";
import MobileDispatcher from "@/pages/mobile-dispatcher";
import PayInvoice from "@/pages/PayInvoice";
import PaymentSuccess from "@/pages/PaymentSuccess";
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
      {/* Mobile PWA Routes */}
      <Route path="/mobile" component={MobileSplash} />
      <Route path="/mobile-splash" component={MobileSplash} />
      <Route path="/mobile-login" component={MobileLogin} />
      <Route path="/mobile-passenger" component={MobilePassenger} />
      <Route path="/mobile-booking" component={MobileBooking} />
      <Route path="/mobile-booking-details/:id" component={MobileBookingDetails} />
      <Route path="/mobile-invoices" component={MobileInvoices} />
      <Route path="/mobile-payment-methods" component={MobilePaymentMethods} />
      <Route path="/mobile-driver" component={MobileDriver} />
      <Route path="/mobile-driver/rides/:id" component={MobileDriverRideDetails} />
      <Route path="/mobile-dispatcher" component={MobileDispatcher} />
      
      {/* Public routes */}
      <Route path="/booking" component={Booking} />
      <Route path="/vehicle/:id" component={VehicleDetail} />
      <Route path="/service/:id" component={ServiceDetail} />
      <Route path="/terms-of-service" component={TermsOfService} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/help-center" component={HelpCenter} />
      <Route path="/safety" component={Safety} />
      <Route path="/about-us" component={AboutUs} />
      <Route path="/locations" component={Locations} />
      <Route path="/locations/:slug" component={FeaturedAreaDetail} />
      <Route path="/hotels" component={Hotels} />
      <Route path="/contact" component={Contact} />
      
      {/* Payment routes (public - token-based auth) */}
      <Route path="/pay/:token" component={PayInvoice} />
      <Route path="/pay/:token/success" component={PaymentSuccess} />
      
      {/* Authentication routes */}
      <Route path="/login" component={RoleLogin} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin-login" component={AdminLogin} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      
      {!isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/account" component={AccountPage} />
          <Route path="/checkout" component={Checkout} />
          {user?.role === 'admin' && (
            <>
              <Route path="/admin-dashboard" component={AdminDashboard} />
              <Route path="/admin-pricing" component={AdminPricing} />
              <Route path="/admin" component={AdminDashboard} />
            </>
          )}
          {user?.role === 'driver' && (
            <>
              <Route path="/driver" component={DriverDashboard} />
              <Route path="/driver/documents" component={DriverDocuments} />
            </>
          )}
          {(user?.role === 'dispatcher') && (
            <Route path="/dispatcher" component={DispatcherDashboard} />
          )}
          {user?.role === 'passenger' && (
            <Route path="/passenger" component={PassengerDashboard} />
          )}
          <Route component={NotFound} />
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
        <PWAInstallPrompt />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
