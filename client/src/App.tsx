import { lazy, Suspense } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import DeviceRedirect from "@/components/DeviceRedirect";

const Landing = lazy(() => import("@/pages/landing"));
const Home = lazy(() => import("@/pages/home"));
const Booking = lazy(() => import("@/pages/booking"));
const VehicleDetail = lazy(() => import("@/pages/VehicleDetail"));
const ServiceDetail = lazy(() => import("@/pages/ServiceDetail"));
const TermsOfService = lazy(() => import("@/pages/TermsOfService"));
const PrivacyPolicy = lazy(() => import("@/pages/PrivacyPolicy"));
const HelpCenter = lazy(() => import("@/pages/HelpCenter"));
const Safety = lazy(() => import("@/pages/Safety"));
const AboutUs = lazy(() => import("@/pages/AboutUs"));
const Locations = lazy(() => import("@/pages/Locations"));
const FeaturedAreaDetail = lazy(() => import("@/pages/FeaturedAreaDetail"));
const Hotels = lazy(() => import("@/pages/Hotels"));
const Contact = lazy(() => import("@/pages/contact"));
const RoleLogin = lazy(() => import("@/pages/RoleLogin").then(m => ({ default: m.RoleLogin })));
const AdminLogin = lazy(() => import("@/pages/AdminLogin").then(m => ({ default: m.AdminLogin })));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const AdminDashboard = lazy(() => import("@/pages/admin-dashboard"));
const AdminPricing = lazy(() => import("@/pages/admin-pricing"));
const DriverDashboard = lazy(() => import("@/pages/driver-dashboard"));
const DriverDocuments = lazy(() => import("@/pages/driver-documents"));
const DispatcherDashboard = lazy(() => import("@/pages/DispatcherDashboard"));
const PassengerDashboard = lazy(() => import("@/pages/passenger-dashboard"));
const Checkout = lazy(() => import("@/pages/checkout"));
const AccountPage = lazy(() => import("@/pages/account"));
const MobileSplash = lazy(() => import("@/pages/mobile-splash"));
const MobileLogin = lazy(() => import("@/pages/mobile-login"));
const MobilePassenger = lazy(() => import("@/pages/mobile-passenger"));
const MobileBooking = lazy(() => import("@/pages/mobile-booking"));
const MobileBookingDetails = lazy(() => import("@/pages/mobile-booking-details"));
const MobileInvoices = lazy(() => import("@/pages/mobile-invoices"));
const MobilePaymentMethods = lazy(() => import("@/pages/mobile-payment-methods"));
const MobileDriver = lazy(() => import("@/pages/mobile-driver"));
const MobileDriverRideDetails = lazy(() => import("@/pages/mobile-driver-ride-details"));
const MobileDriverDocuments = lazy(() => import("@/pages/mobile-driver-documents"));
const MobileProfile = lazy(() => import("@/pages/mobile-profile"));
const MobileDispatcher = lazy(() => import("@/pages/mobile-dispatcher"));
const PayInvoice = lazy(() => import("@/pages/PayInvoice"));
const PaymentSuccess = lazy(() => import("@/pages/PaymentSuccess"));
const NotFound = lazy(() => import("@/pages/not-found"));

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
  </div>
);

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <LoadingFallback />;
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
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
      <Route path="/mobile-driver/documents" component={MobileDriverDocuments} />
      <Route path="/mobile-driver/profile" component={MobileProfile} />
      <Route path="/mobile-driver/account" component={AccountPage} />
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
        <Route path="/" component={DeviceRedirect} />
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
    </Suspense>
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
