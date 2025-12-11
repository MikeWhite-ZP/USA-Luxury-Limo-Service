import { lazy, Suspense, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useBrandTheme } from "@/hooks/useBrandTheme";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import DeviceRedirect from "@/components/DeviceRedirect";
import { ThemeProvider } from "@/components/ThemeProvider";

// Utility to check if accessing via admin subdomain
function isAdminSubdomain(): boolean {
  const hostname = window.location.hostname.toLowerCase();
  
  // Check if hostname starts with "adminaccess."
  if (hostname.startsWith('adminaccess.')) {
    return true;
  }
  
  // Check against configured admin hosts (if provided via env var)
  const adminHosts = import.meta.env.VITE_ADMIN_PANEL_HOSTS?.split(',').map((h: string) => h.trim().toLowerCase()) || [];
  return adminHosts.some((host: string) => hostname === host);
}

// Utility to check if device is mobile
function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || '';
  const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
  const isSmallScreen = window.innerWidth <= 768;
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  return isMobileUA || (isSmallScreen && isTouchDevice);
}

// Component to handle admin subdomain routing
function AdminSubdomainRedirect() {
  const [location, setLocation] = useLocation();
  const isAdminHost = isAdminSubdomain();
  const isMobile = isMobileDevice();
  
  useEffect(() => {
    // If on admin subdomain
    if (isAdminHost) {
      // Redirect to appropriate login based on device
      if (location === '/') {
        if (isMobile) {
          setLocation('/mobile-admin-login');
        } else {
          setLocation('/admin-login');
        }
      }
      
      // Redirect desktop admin login to mobile on mobile devices
      if (isMobile && location === '/admin-login') {
        setLocation('/mobile-admin-login');
      }
      
      // Redirect mobile admin login to desktop on desktop devices
      if (!isMobile && location === '/mobile-admin-login') {
        setLocation('/admin-login');
      }
      
      // On admin subdomain, redirect regular mobile pages to mobile admin
      if (isMobile) {
        const userMobilePages = ['/mobile', '/mobile-splash', '/mobile-login', '/mobile-register', 
          '/mobile-passenger', '/mobile-driver', '/mobile-dispatcher', '/mobile-booking',
          '/mobile-invoices', '/mobile-payment-methods', '/mobile-profile'];
        if (userMobilePages.some(page => location === page || location.startsWith(page + '/'))) {
          setLocation('/mobile-admin-login');
        }
      }
    }
    
    // If NOT on admin subdomain but trying to access admin login, block it (production only)
    if (!isAdminHost && !import.meta.env.DEV) {
      if (location === '/admin-login' || location === '/admin/login') {
        console.warn('Admin login is only accessible via admin subdomain');
        setLocation('/login');
      }
      if (location === '/mobile-admin-login' || location === '/mobile-admin') {
        console.warn('Mobile admin is only accessible via admin subdomain');
        setLocation('/mobile');
      }
    }
  }, [location, setLocation, isAdminHost, isMobile]);
  
  return null;
}

// Component to redirect authenticated mobile users to their role-specific mobile dashboard
function AuthenticatedMobileRedirect() {
  const [location, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const isMobile = isMobileDevice();
  const isAdminHost = isAdminSubdomain();
  
  useEffect(() => {
    // Only redirect authenticated mobile users on the root path (not on admin subdomain)
    if (isAuthenticated && isMobile && location === '/' && !isAdminHost && user) {
      // Redirect to role-specific mobile dashboard
      switch (user.role) {
        case 'passenger':
          setLocation('/mobile-passenger');
          break;
        case 'driver':
          setLocation('/mobile-driver');
          break;
        case 'dispatcher':
          setLocation('/mobile-dispatcher');
          break;
        case 'admin':
          // Admin on mobile stays on desktop view or goes to mobile admin if on admin subdomain
          // (admin subdomain redirect is handled by AdminSubdomainRedirect)
          break;
        default:
          setLocation('/mobile');
      }
    }
  }, [isAuthenticated, isMobile, location, user, setLocation, isAdminHost]);
  
  return null;
}

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
const ResetPassword = lazy(() => import("@/pages/ResetPassword").then(m => ({ default: m.ResetPassword })));
const AdminDashboard = lazy(() => import("@/pages/admin-dashboard"));
const AdminPricing = lazy(() => import("@/pages/admin-pricing"));
const MinIOBrowser = lazy(() => import("@/pages/MinIOBrowser"));
const AdminDriversMap = lazy(() => import("@/pages/admin-drivers-map"));
const DriverDashboard = lazy(() => import("@/pages/driver-dashboard"));
const DriverDocuments = lazy(() => import("@/pages/driver-documents"));
const DispatcherDashboard = lazy(() => import("@/pages/DispatcherDashboard"));
const PassengerDashboard = lazy(() => import("@/pages/passenger-dashboard"));
const Checkout = lazy(() => import("@/pages/checkout"));
const AccountPage = lazy(() => import("@/pages/account"));
const MobileSplash = lazy(() => import("@/pages/mobile-splash"));
const MobileLogin = lazy(() => import("@/pages/mobile-login"));
const MobileRegister = lazy(() => import("@/pages/mobile-register"));
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
const MobileAdminLogin = lazy(() => import("@/pages/mobile-admin-login"));
const MobileAdmin = lazy(() => import("@/pages/mobile-admin"));
const PayInvoice = lazy(() => import("@/pages/PayInvoice"));
const PaymentSuccess = lazy(() => import("@/pages/PaymentSuccess"));
const NotFound = lazy(() => import("@/pages/not-found"));

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
  </div>
);

// Component to dynamically update favicon with cache-busting when CMS changes
function FaviconLoader() {
  const { data: faviconData } = useQuery<{ favicon: { id: string; url: string; } | null }>({
    queryKey: ['/api/site-favicon'],
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (faviconData?.favicon?.id) {
      // Use stable endpoint with cache-busting based on media ID
      const cacheBuster = faviconData.favicon.id;
      const faviconUrl = `/api/favicon/icon.png?v=${cacheBuster}`;
      const appleTouchUrl = `/api/favicon/apple-touch-icon.png?v=${cacheBuster}`;
      
      // Update main favicon link
      let faviconLink = document.querySelector("link[rel='icon']") as HTMLLinkElement;
      if (faviconLink) {
        faviconLink.href = faviconUrl;
      }
      
      // Update apple touch icon
      let appleTouchLink = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement;
      if (appleTouchLink) {
        appleTouchLink.href = appleTouchUrl;
      }
    }
  }, [faviconData]);

  return null;
}

// Component to apply brand colors as CSS variables
function BrandThemeLoader() {
  useBrandTheme();
  return null;
}

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <LoadingFallback />;
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <AdminSubdomainRedirect />
      <AuthenticatedMobileRedirect />
      <Switch>
      {/* Mobile PWA Routes */}
      <Route path="/mobile" component={MobileSplash} />
      <Route path="/mobile-splash" component={MobileSplash} />
      <Route path="/mobile-login" component={MobileLogin} />
      <Route path="/mobile-register" component={MobileRegister} />
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
      
      {/* Mobile Admin PWA Routes (admin subdomain only) */}
      <Route path="/mobile-admin-login" component={MobileAdminLogin} />
      <Route path="/mobile-admin" component={MobileAdmin} />
      
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
              <Route path="/admin/minio-browser" component={MinIOBrowser} />
              <Route path="/admin/drivers-map" component={AdminDriversMap} />
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
      <ThemeProvider>
        <TooltipProvider>
          <BrandThemeLoader />
          <FaviconLoader />
          <Toaster />
          <Router />
          <PWAInstallPrompt />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
