import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Key,
  DollarSign,
  Users,
  Car,
  Settings as SettingsIcon,
  Star,
  MessageSquare,
  ChevronDown,
  Percent,
  LogOut,
  Mail,
  FileText,
  Image,
  Receipt,
  LayoutDashboard,
  Database,
  Navigation,
  Palette,
  Home,
  MapPin,
  Building2,
  Phone,
  Shield,
  BookOpen,
  HelpCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSiteLogo } from "@/hooks/useSiteLogo";

interface AdminNavProps {
  onCredentialsClick?: (section: 'api' | 'payment' | 'minio') => void;
  onUserManagerClick?: (type: 'all' | 'passenger' | 'driver' | 'dispatcher' | 'admin') => void;
  onBookingsClick?: () => void;
  onInvoicesClick?: () => void;
  onVehicleTypesClick?: () => void;
  onSettingsClick?: (section: 'commission' | 'email' | 'sms' | 'database' | 'branding') => void;
  onCMSClick?: (section: 'pages' | 'media' | 'services') => void;
  onPricingClick?: () => void;
}

export function AdminNav({ onCredentialsClick, onUserManagerClick, onBookingsClick, onInvoicesClick, onVehicleTypesClick, onSettingsClick, onCMSClick, onPricingClick }: AdminNavProps) {
  const [location, setLocation] = useLocation();
  const { logoutMutation } = useAuth();
  const { logoUrl, logoAltText } = useSiteLogo();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        window.location.href = '/';
      }
    });
  };

  return (
    <header className="bg-white sticky top-0 z-50 shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto">
        {/* Top Bar - Clean and Spacious */}
        <div className="flex items-center justify-between px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <img 
                src={logoUrl} 
                alt={logoAltText} 
                className="h-10 w-auto object-contain cursor-pointer hover:opacity-90 transition-opacity"
                data-testid="admin-logo"
              />
            </Link>
            <div className="h-8 w-px bg-gray-200 mx-2" />
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Admin Portal</h1>
              <p className="text-xs text-gray-500">Management Dashboard</p>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            size="sm"
            className="text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-400 transition-all"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            data-testid="nav-logout"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
          </Button>
        </div>

        {/* Navigation Bar - Modern Minimal Design */}
        <div className="px-8 bg-gradient-to-b from-gray-50 to-white border-t border-gray-100">
          <nav className="flex items-center gap-2 py-2" data-testid="admin-nav">
            
            {/* Users Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all px-3 py-2 rounded-lg"
                  data-testid="nav-user-manager"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Users
                  <ChevronDown className="w-3.5 h-3.5 ml-1.5 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64 bg-white border-gray-200 shadow-lg rounded-xl p-2">
                <DropdownMenuLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">
                  User Management
                </DropdownMenuLabel>
                <DropdownMenuItem 
                  onClick={() => {
                    if (location === '/admin' || location === '/admin-dashboard') {
                      onUserManagerClick?.('all');
                    } else {
                      setLocation('/admin#users-all');
                    }
                  }}
                  className="cursor-pointer rounded-lg px-3 py-2.5 hover:bg-blue-50 focus:bg-blue-50 text-gray-700 hover:text-blue-700 transition-colors"
                  data-testid="nav-all-users"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Users className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">All Users</p>
                      <p className="text-xs text-gray-500">View all system users</p>
                    </div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-2" />
                <DropdownMenuItem 
                  onClick={() => {
                    if (location === '/admin' || location === '/admin-dashboard') {
                      onUserManagerClick?.('passenger');
                    } else {
                      setLocation('/admin#users-passenger');
                    }
                  }}
                  className="cursor-pointer rounded-lg px-3 py-2.5 hover:bg-blue-50 focus:bg-blue-50 text-gray-700 hover:text-blue-700 transition-colors"
                  data-testid="nav-passengers"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <Users className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="font-medium text-sm">Passengers</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    if (location === '/admin' || location === '/admin-dashboard') {
                      onUserManagerClick?.('driver');
                    } else {
                      setLocation('/admin#users-driver');
                    }
                  }}
                  className="cursor-pointer rounded-lg px-3 py-2.5 hover:bg-blue-50 focus:bg-blue-50 text-gray-700 hover:text-blue-700 transition-colors"
                  data-testid="nav-drivers"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Car className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className="font-medium text-sm">Drivers</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    if (location === '/admin' || location === '/admin-dashboard') {
                      onUserManagerClick?.('dispatcher');
                    } else {
                      setLocation('/admin#users-dispatcher');
                    }
                  }}
                  className="cursor-pointer rounded-lg px-3 py-2.5 hover:bg-blue-50 focus:bg-blue-50 text-gray-700 hover:text-blue-700 transition-colors"
                  data-testid="nav-dispatchers"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                      <SettingsIcon className="w-4 h-4 text-orange-600" />
                    </div>
                    <span className="font-medium text-sm">Dispatchers</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    if (location === '/admin' || location === '/admin-dashboard') {
                      onUserManagerClick?.('admin');
                    } else {
                      setLocation('/admin#users-admin');
                    }
                  }}
                  className="cursor-pointer rounded-lg px-3 py-2.5 hover:bg-blue-50 focus:bg-blue-50 text-gray-700 hover:text-blue-700 transition-colors"
                  data-testid="nav-admins"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                      <Star className="w-4 h-4 text-amber-600" />
                    </div>
                    <span className="font-medium text-sm">Admins</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Settings Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-sm font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 transition-all px-3 py-2 rounded-lg"
                  data-testid="nav-settings"
                >
                  <SettingsIcon className="w-4 h-4 mr-2" />
                  Settings
                  <ChevronDown className="w-3.5 h-3.5 ml-1.5 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64 bg-white border-gray-200 shadow-lg rounded-xl p-2">
                <DropdownMenuLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">
                  System Configuration
                </DropdownMenuLabel>
                <DropdownMenuItem 
                  onClick={() => {
                    if (location === '/admin' || location === '/admin-dashboard') {
                      onPricingClick?.();
                    } else {
                      setLocation('/admin-pricing');
                    }
                  }}
                  className="cursor-pointer rounded-lg px-3 py-2.5 hover:bg-indigo-50 focus:bg-indigo-50 text-gray-700 hover:text-indigo-700 transition-colors"
                  data-testid="nav-pricing"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="font-medium text-sm">Pricing</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    if (location === '/admin' || location === '/admin-dashboard') {
                      onSettingsClick?.('branding');
                    } else {
                      setLocation('/admin#settings-branding');
                    }
                  }}
                  className="cursor-pointer rounded-lg px-3 py-2.5 hover:bg-indigo-50 focus:bg-indigo-50 text-gray-700 hover:text-indigo-700 transition-colors"
                  data-testid="nav-branding"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center">
                      <Palette className="w-4 h-4 text-pink-600" />
                    </div>
                    <span className="font-medium text-sm">Branding</span>
                  </div>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator className="my-2" />
                <DropdownMenuLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">
                  Credentials & API
                </DropdownMenuLabel>
                
                <DropdownMenuItem 
                  onClick={() => {
                    if (location === '/admin' || location === '/admin-dashboard') {
                      onCredentialsClick?.('api');
                    } else {
                      setLocation('/admin#credentials-api');
                    }
                  }}
                  className="cursor-pointer rounded-lg px-3 py-2.5 hover:bg-indigo-50 focus:bg-indigo-50 text-gray-700 hover:text-indigo-700 transition-colors"
                  data-testid="nav-api-credentials"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Key className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="font-medium text-sm">API Credentials</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    if (location === '/admin' || location === '/admin-dashboard') {
                      onCredentialsClick?.('payment');
                    } else {
                      setLocation('/admin#credentials-payment');
                    }
                  }}
                  className="cursor-pointer rounded-lg px-3 py-2.5 hover:bg-indigo-50 focus:bg-indigo-50 text-gray-700 hover:text-indigo-700 transition-colors"
                  data-testid="nav-payment-systems"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="font-medium text-sm">Payment Systems</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    if (location === '/admin' || location === '/admin-dashboard') {
                      onCredentialsClick?.('minio');
                    } else {
                      setLocation('/admin#credentials-minio');
                    }
                  }}
                  className="cursor-pointer rounded-lg px-3 py-2.5 hover:bg-indigo-50 focus:bg-indigo-50 text-gray-700 hover:text-indigo-700 transition-colors"
                  data-testid="nav-minio-storage"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center">
                      <Database className="w-4 h-4 text-cyan-600" />
                    </div>
                    <span className="font-medium text-sm">MinIO Storage</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setLocation('/admin/minio-browser')}
                  className="cursor-pointer rounded-lg px-3 py-2.5 hover:bg-indigo-50 focus:bg-indigo-50 text-gray-700 hover:text-indigo-700 transition-colors"
                  data-testid="nav-minio-browser"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
                      <Image className="w-4 h-4 text-teal-600" />
                    </div>
                    <span className="font-medium text-sm">Browse Images</span>
                  </div>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator className="my-2" />
                <DropdownMenuLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">
                  System Settings
                </DropdownMenuLabel>
                
                <DropdownMenuItem 
                  onClick={() => {
                    if (location === '/admin' || location === '/admin-dashboard') {
                      onVehicleTypesClick?.();
                    } else {
                      setLocation('/admin#vehicle-types');
                    }
                  }}
                  className="cursor-pointer rounded-lg px-3 py-2.5 hover:bg-indigo-50 focus:bg-indigo-50 text-gray-700 hover:text-indigo-700 transition-colors"
                  data-testid="nav-vehicle-types"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                      <Car className="w-4 h-4 text-violet-600" />
                    </div>
                    <span className="font-medium text-sm">Vehicle Types</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    if (location === '/admin' || location === '/admin-dashboard') {
                      onSettingsClick?.('commission');
                    } else {
                      setLocation('/admin#settings-commission');
                    }
                  }}
                  className="cursor-pointer rounded-lg px-3 py-2.5 hover:bg-indigo-50 focus:bg-indigo-50 text-gray-700 hover:text-indigo-700 transition-colors"
                  data-testid="nav-system-commission"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                      <Percent className="w-4 h-4 text-orange-600" />
                    </div>
                    <span className="font-medium text-sm">System Commission</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    if (location === '/admin' || location === '/admin-dashboard') {
                      onSettingsClick?.('email');
                    } else {
                      setLocation('/admin#settings-email');
                    }
                  }}
                  className="cursor-pointer rounded-lg px-3 py-2.5 hover:bg-indigo-50 focus:bg-indigo-50 text-gray-700 hover:text-indigo-700 transition-colors"
                  data-testid="nav-email-settings"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                      <Mail className="w-4 h-4 text-red-600" />
                    </div>
                    <span className="font-medium text-sm">Email Settings</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    if (location === '/admin' || location === '/admin-dashboard') {
                      onSettingsClick?.('sms');
                    } else {
                      setLocation('/admin#settings-sms');
                    }
                  }}
                  className="cursor-pointer rounded-lg px-3 py-2.5 hover:bg-indigo-50 focus:bg-indigo-50 text-gray-700 hover:text-indigo-700 transition-colors"
                  data-testid="nav-sms-settings"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center">
                      <MessageSquare className="w-4 h-4 text-sky-600" />
                    </div>
                    <span className="font-medium text-sm">SMS Notifications</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    if (location === '/admin' || location === '/admin-dashboard') {
                      onSettingsClick?.('database');
                    } else {
                      setLocation('/admin#settings-database');
                    }
                  }}
                  className="cursor-pointer rounded-lg px-3 py-2.5 hover:bg-indigo-50 focus:bg-indigo-50 text-gray-700 hover:text-indigo-700 transition-colors"
                  data-testid="nav-database-settings"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                      <Database className="w-4 h-4 text-slate-600" />
                    </div>
                    <span className="font-medium text-sm">Database URL</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* CMS Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-sm font-medium text-gray-700 hover:text-purple-600 hover:bg-purple-50 transition-all px-3 py-2 rounded-lg"
                  data-testid="nav-cms"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  CMS
                  <ChevronDown className="w-3.5 h-3.5 ml-1.5 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64 bg-white border-gray-200 shadow-lg rounded-xl p-2">
                <DropdownMenuLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">
                  Content Management
                </DropdownMenuLabel>
                <DropdownMenuItem 
                  onClick={() => {
                    if (location === '/admin' || location === '/admin-dashboard') {
                      onCMSClick?.('media');
                    } else {
                      setLocation('/admin#cms-media');
                    }
                  }}
                  className="cursor-pointer rounded-lg px-3 py-2.5 hover:bg-purple-50 focus:bg-purple-50 text-gray-700 hover:text-purple-700 transition-colors"
                  data-testid="nav-cms-media"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Image className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className="font-medium text-sm">Media & Images</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    if (location === '/admin' || location === '/admin-dashboard') {
                      onCMSClick?.('services');
                    } else {
                      setLocation('/admin#cms-services');
                    }
                  }}
                  className="cursor-pointer rounded-lg px-3 py-2.5 hover:bg-purple-50 focus:bg-purple-50 text-gray-700 hover:text-purple-700 transition-colors"
                  data-testid="nav-cms-services"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-indigo-600" />
                    </div>
                    <span className="font-medium text-sm">Services</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Frontend Pages Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-sm font-medium text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 transition-all px-3 py-2 rounded-lg"
                  data-testid="nav-frontend-pages"
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Pages
                  <ChevronDown className="w-3.5 h-3.5 ml-1.5 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64 bg-white border-gray-200 shadow-lg rounded-xl p-2">
                <DropdownMenuLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">
                  Frontend Pages
                </DropdownMenuLabel>
                <DropdownMenuItem 
                  onClick={() => setLocation('/admin#frontend-home')}
                  className="cursor-pointer rounded-lg px-3 py-2.5 hover:bg-emerald-50 focus:bg-emerald-50 text-gray-700 hover:text-emerald-700 transition-colors"
                  data-testid="nav-frontend-home"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <Home className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="font-medium text-sm">Home</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setLocation('/admin#frontend-about')}
                  className="cursor-pointer rounded-lg px-3 py-2.5 hover:bg-emerald-50 focus:bg-emerald-50 text-gray-700 hover:text-emerald-700 transition-colors"
                  data-testid="nav-frontend-about"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="font-medium text-sm">About</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setLocation('/admin#frontend-locations')}
                  className="cursor-pointer rounded-lg px-3 py-2.5 hover:bg-emerald-50 focus:bg-emerald-50 text-gray-700 hover:text-emerald-700 transition-colors"
                  data-testid="nav-frontend-locations"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-orange-600" />
                    </div>
                    <span className="font-medium text-sm">Locations</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setLocation('/admin#frontend-hotels')}
                  className="cursor-pointer rounded-lg px-3 py-2.5 hover:bg-emerald-50 focus:bg-emerald-50 text-gray-700 hover:text-emerald-700 transition-colors"
                  data-testid="nav-frontend-hotels"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className="font-medium text-sm">Hotels</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setLocation('/admin#frontend-services')}
                  className="cursor-pointer rounded-lg px-3 py-2.5 hover:bg-emerald-50 focus:bg-emerald-50 text-gray-700 hover:text-emerald-700 transition-colors"
                  data-testid="nav-frontend-services"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center">
                      <Star className="w-4 h-4 text-cyan-600" />
                    </div>
                    <span className="font-medium text-sm">Services</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setLocation('/admin#frontend-contact')}
                  className="cursor-pointer rounded-lg px-3 py-2.5 hover:bg-emerald-50 focus:bg-emerald-50 text-gray-700 hover:text-emerald-700 transition-colors"
                  data-testid="nav-frontend-contact"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center">
                      <Phone className="w-4 h-4 text-pink-600" />
                    </div>
                    <span className="font-medium text-sm">Contact</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-2" />
                <DropdownMenuItem 
                  onClick={() => setLocation('/admin#frontend-terms')}
                  className="cursor-pointer rounded-lg px-3 py-2.5 hover:bg-emerald-50 focus:bg-emerald-50 text-gray-700 hover:text-emerald-700 transition-colors"
                  data-testid="nav-frontend-terms"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-slate-600" />
                    </div>
                    <span className="font-medium text-sm">Terms</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setLocation('/admin#frontend-privacy')}
                  className="cursor-pointer rounded-lg px-3 py-2.5 hover:bg-emerald-50 focus:bg-emerald-50 text-gray-700 hover:text-emerald-700 transition-colors"
                  data-testid="nav-frontend-privacy"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <Shield className="w-4 h-4 text-indigo-600" />
                    </div>
                    <span className="font-medium text-sm">Privacy</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setLocation('/admin#frontend-help')}
                  className="cursor-pointer rounded-lg px-3 py-2.5 hover:bg-emerald-50 focus:bg-emerald-50 text-gray-700 hover:text-emerald-700 transition-colors"
                  data-testid="nav-frontend-help"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                      <HelpCircle className="w-4 h-4 text-amber-600" />
                    </div>
                    <span className="font-medium text-sm">Help</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setLocation('/admin#frontend-safety')}
                  className="cursor-pointer rounded-lg px-3 py-2.5 hover:bg-emerald-50 focus:bg-emerald-50 text-gray-700 hover:text-emerald-700 transition-colors"
                  data-testid="nav-frontend-safety"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                      <Shield className="w-4 h-4 text-red-600" />
                    </div>
                    <span className="font-medium text-sm">Safety</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Bookings Button */}
            <Button 
              variant="ghost" 
              size="sm"
              className="text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all px-3 py-2 rounded-lg"
              onClick={() => {
                if (location === '/admin' || location === '/admin-dashboard') {
                  onBookingsClick?.();
                } else {
                  setLocation('/admin#bookings');
                }
              }}
              data-testid="nav-bookings"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Bookings
            </Button>
            
            {/* Invoices Button */}
            <Button 
              variant="ghost" 
              size="sm"
              className="text-sm font-medium text-gray-700 hover:text-green-600 hover:bg-green-50 transition-all px-3 py-2 rounded-lg"
              onClick={() => {
                if (location === '/admin' || location === '/admin-dashboard') {
                  onInvoicesClick?.();
                } else {
                  setLocation('/admin#invoices');
                }
              }}
              data-testid="nav-invoices"
            >
              <Receipt className="w-4 h-4 mr-2" />
              Invoices
            </Button>
            
            {/* Drivers Map Button */}
            <Button 
              variant="ghost" 
              size="sm"
              className="text-sm font-medium text-gray-700 hover:text-purple-600 hover:bg-purple-50 transition-all px-3 py-2 rounded-lg"
              onClick={() => setLocation('/admin/drivers-map')}
              data-testid="nav-drivers-map"
            >
              <Navigation className="w-4 h-4 mr-2" />
              Drivers Map
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
