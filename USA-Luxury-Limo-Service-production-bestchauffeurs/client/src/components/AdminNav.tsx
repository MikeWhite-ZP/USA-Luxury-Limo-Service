import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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

  const navButtonClass = "text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200 rounded-lg px-4 py-2.5 flex items-center gap-2";

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <img 
                src={logoUrl} 
                alt={logoAltText} 
                className="h-10 w-auto object-contain cursor-pointer hover:opacity-80 transition-opacity"
                data-testid="admin-logo"
              />
            </Link>
            <div className="h-8 w-px bg-gray-200"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                <LayoutDashboard className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-semibold text-gray-900">Admin Portal</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button 
                variant="ghost" 
                size="sm"
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              >
                <Home className="w-4 h-4 mr-2" />
                View Site
              </Button>
            </Link>
            <div className="h-6 w-px bg-gray-200"></div>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
              data-testid="nav-logout"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
            </Button>
          </div>
        </div>

        {/* Navigation Bar */}
        <div className="px-6 pb-2">
          <nav className="flex items-center gap-1 flex-wrap" data-testid="admin-nav">
            {/* Dashboard Link */}
            <Button 
              variant="ghost" 
              size="sm"
              className={navButtonClass}
              onClick={() => setLocation('/admin')}
              data-testid="nav-dashboard"
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Button>

            {/* Users Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className={navButtonClass}
                  data-testid="nav-user-manager"
                >
                  <Users className="w-4 h-4" />
                  Users
                  <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 bg-white border-gray-200 shadow-lg rounded-xl p-1">
                <DropdownMenuItem 
                  onClick={() => {
                    if (location === '/admin' || location === '/admin-dashboard') {
                      onUserManagerClick?.('all');
                    } else {
                      setLocation('/admin#users-all');
                    }
                  }}
                  className="cursor-pointer hover:bg-gray-50 focus:bg-gray-50 py-2.5 rounded-lg"
                  data-testid="nav-all-users"
                >
                  <Users className="w-4 h-4 mr-3 text-gray-400" />
                  <span className="font-medium text-gray-700">All Users</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem 
                  onClick={() => {
                    if (location === '/admin' || location === '/admin-dashboard') {
                      onUserManagerClick?.('passenger');
                    } else {
                      setLocation('/admin#users-passenger');
                    }
                  }}
                  className="cursor-pointer hover:bg-blue-50 focus:bg-blue-50 py-2.5 rounded-lg"
                  data-testid="nav-passengers"
                >
                  <Users className="w-4 h-4 mr-3 text-blue-500" />
                  <span className="font-medium text-gray-700">Passengers</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    if (location === '/admin' || location === '/admin-dashboard') {
                      onUserManagerClick?.('driver');
                    } else {
                      setLocation('/admin#users-driver');
                    }
                  }}
                  className="cursor-pointer hover:bg-green-50 focus:bg-green-50 py-2.5 rounded-lg"
                  data-testid="nav-drivers"
                >
                  <Car className="w-4 h-4 mr-3 text-green-500" />
                  <span className="font-medium text-gray-700">Drivers</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    if (location === '/admin' || location === '/admin-dashboard') {
                      onUserManagerClick?.('dispatcher');
                    } else {
                      setLocation('/admin#users-dispatcher');
                    }
                  }}
                  className="cursor-pointer hover:bg-purple-50 focus:bg-purple-50 py-2.5 rounded-lg"
                  data-testid="nav-dispatchers"
                >
                  <SettingsIcon className="w-4 h-4 mr-3 text-purple-500" />
                  <span className="font-medium text-gray-700">Dispatchers</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    if (location === '/admin' || location === '/admin-dashboard') {
                      onUserManagerClick?.('admin');
                    } else {
                      setLocation('/admin#users-admin');
                    }
                  }}
                  className="cursor-pointer hover:bg-amber-50 focus:bg-amber-50 py-2.5 rounded-lg"
                  data-testid="nav-admins"
                >
                  <Star className="w-4 h-4 mr-3 text-amber-500" />
                  <span className="font-medium text-gray-700">Admins</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Bookings */}
            <Button 
              variant="ghost" 
              size="sm"
              className={navButtonClass}
              onClick={() => {
                if (location === '/admin' || location === '/admin-dashboard') {
                  onBookingsClick?.();
                } else {
                  setLocation('/admin#bookings');
                }
              }}
              data-testid="nav-bookings"
            >
              <MessageSquare className="w-4 h-4" />
              Bookings
            </Button>

            {/* Invoices */}
            <Button 
              variant="ghost" 
              size="sm"
              className={navButtonClass}
              onClick={() => {
                if (location === '/admin' || location === '/admin-dashboard') {
                  onInvoicesClick?.();
                } else {
                  setLocation('/admin#invoices');
                }
              }}
              data-testid="nav-invoices"
            >
              <Receipt className="w-4 h-4" />
              Invoices
            </Button>

            {/* Drivers Map */}
            <Button 
              variant="ghost" 
              size="sm"
              className={navButtonClass}
              onClick={() => setLocation('/admin/drivers-map')}
              data-testid="nav-drivers-map"
            >
              <Navigation className="w-4 h-4" />
              Drivers Map
            </Button>

            {/* Settings Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className={navButtonClass}
                  data-testid="nav-settings"
                >
                  <SettingsIcon className="w-4 h-4" />
                  Settings
                  <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 bg-white border-gray-200 shadow-lg rounded-xl p-1">
                <DropdownMenuItem 
                  onClick={() => {
                    if (location === '/admin' || location === '/admin-dashboard') {
                      onPricingClick?.();
                    } else {
                      setLocation('/admin-pricing');
                    }
                  }}
                  className="cursor-pointer hover:bg-gray-50 focus:bg-gray-50 py-2.5 rounded-lg"
                  data-testid="nav-pricing"
                >
                  <DollarSign className="w-4 h-4 mr-3 text-green-500" />
                  <span className="font-medium text-gray-700">Pricing</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem 
                  onClick={() => {
                    if (location === '/admin' || location === '/admin-dashboard') {
                      onSettingsClick?.('branding');
                    } else {
                      setLocation('/admin#settings-branding');
                    }
                  }}
                  className="cursor-pointer hover:bg-gray-50 focus:bg-gray-50 py-2.5 rounded-lg"
                  data-testid="nav-branding"
                >
                  <Palette className="w-4 h-4 mr-3 text-pink-500" />
                  <span className="font-medium text-gray-700">Branding</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem 
                  onClick={() => {
                    if (location === '/admin' || location === '/admin-dashboard') {
                      onCredentialsClick?.('api');
                    } else {
                      setLocation('/admin#credentials-api');
                    }
                  }}
                  className="cursor-pointer hover:bg-gray-50 focus:bg-gray-50 py-2.5 rounded-lg"
                  data-testid="nav-api-credentials"
                >
                  <Key className="w-4 h-4 mr-3 text-orange-500" />
                  <span className="font-medium text-gray-700">API Credentials</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    if (location === '/admin' || location === '/admin-dashboard') {
                      onCredentialsClick?.('payment');
                    } else {
                      setLocation('/admin#credentials-payment');
                    }
                  }}
                  className="cursor-pointer hover:bg-gray-50 focus:bg-gray-50 py-2.5 rounded-lg"
                  data-testid="nav-payment-systems"
                >
                  <DollarSign className="w-4 h-4 mr-3 text-emerald-500" />
                  <span className="font-medium text-gray-700">Payment Systems</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    if (location === '/admin' || location === '/admin-dashboard') {
                      onCredentialsClick?.('minio');
                    } else {
                      setLocation('/admin#credentials-minio');
                    }
                  }}
                  className="cursor-pointer hover:bg-gray-50 focus:bg-gray-50 py-2.5 rounded-lg"
                  data-testid="nav-minio-storage"
                >
                  <Database className="w-4 h-4 mr-3 text-blue-500" />
                  <span className="font-medium text-gray-700">Object Storage</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setLocation('/admin/minio-browser')}
                  className="cursor-pointer hover:bg-gray-50 focus:bg-gray-50 py-2.5 rounded-lg"
                  data-testid="nav-minio-browser"
                >
                  <Image className="w-4 h-4 mr-3 text-cyan-500" />
                  <span className="font-medium text-gray-700">Browse Images</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    if (location === '/admin' || location === '/admin-dashboard') {
                      onVehicleTypesClick?.();
                    } else {
                      setLocation('/admin#vehicle-types');
                    }
                  }}
                  className="cursor-pointer hover:bg-gray-50 focus:bg-gray-50 py-2.5 rounded-lg"
                  data-testid="nav-vehicle-types"
                >
                  <Car className="w-4 h-4 mr-3 text-indigo-500" />
                  <span className="font-medium text-gray-700">Vehicle Types</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem 
                  onClick={() => {
                    if (location === '/admin' || location === '/admin-dashboard') {
                      onSettingsClick?.('commission');
                    } else {
                      setLocation('/admin#settings-commission');
                    }
                  }}
                  className="cursor-pointer hover:bg-gray-50 focus:bg-gray-50 py-2.5 rounded-lg"
                  data-testid="nav-system-commission"
                >
                  <Percent className="w-4 h-4 mr-3 text-violet-500" />
                  <span className="font-medium text-gray-700">System Commission</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    if (location === '/admin' || location === '/admin-dashboard') {
                      onSettingsClick?.('email');
                    } else {
                      setLocation('/admin#settings-email');
                    }
                  }}
                  className="cursor-pointer hover:bg-gray-50 focus:bg-gray-50 py-2.5 rounded-lg"
                  data-testid="nav-email-settings"
                >
                  <Mail className="w-4 h-4 mr-3 text-red-500" />
                  <span className="font-medium text-gray-700">Email Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    if (location === '/admin' || location === '/admin-dashboard') {
                      onSettingsClick?.('sms');
                    } else {
                      setLocation('/admin#settings-sms');
                    }
                  }}
                  className="cursor-pointer hover:bg-gray-50 focus:bg-gray-50 py-2.5 rounded-lg"
                  data-testid="nav-sms-settings"
                >
                  <MessageSquare className="w-4 h-4 mr-3 text-teal-500" />
                  <span className="font-medium text-gray-700">SMS Notifications</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem 
                  onClick={() => {
                    if (location === '/admin' || location === '/admin-dashboard') {
                      onSettingsClick?.('database');
                    } else {
                      setLocation('/admin#settings-database');
                    }
                  }}
                  className="cursor-pointer hover:bg-gray-50 focus:bg-gray-50 py-2.5 rounded-lg"
                  data-testid="nav-database-settings"
                >
                  <Database className="w-4 h-4 mr-3 text-slate-500" />
                  <span className="font-medium text-gray-700">Database URL</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* CMS Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className={navButtonClass}
                  data-testid="nav-cms"
                >
                  <FileText className="w-4 h-4" />
                  CMS
                  <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 bg-white border-gray-200 shadow-lg rounded-xl p-1">
                <DropdownMenuItem 
                  onClick={() => {
                    if (location === '/admin' || location === '/admin-dashboard') {
                      onCMSClick?.('pages');
                    } else {
                      setLocation('/admin#cms-pages');
                    }
                  }}
                  className="cursor-pointer hover:bg-gray-50 focus:bg-gray-50 py-2.5 rounded-lg"
                  data-testid="nav-cms-pages"
                >
                  <FileText className="w-4 h-4 mr-3 text-blue-500" />
                  <span className="font-medium text-gray-700">Pages</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    if (location === '/admin' || location === '/admin-dashboard') {
                      onCMSClick?.('media');
                    } else {
                      setLocation('/admin#cms-media');
                    }
                  }}
                  className="cursor-pointer hover:bg-gray-50 focus:bg-gray-50 py-2.5 rounded-lg"
                  data-testid="nav-cms-media"
                >
                  <Image className="w-4 h-4 mr-3 text-purple-500" />
                  <span className="font-medium text-gray-700">Media & Images</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    if (location === '/admin' || location === '/admin-dashboard') {
                      onCMSClick?.('services');
                    } else {
                      setLocation('/admin#cms-services');
                    }
                  }}
                  className="cursor-pointer hover:bg-gray-50 focus:bg-gray-50 py-2.5 rounded-lg"
                  data-testid="nav-cms-services"
                >
                  <Star className="w-4 h-4 mr-3 text-amber-500" />
                  <span className="font-medium text-gray-700">Services</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>
      </div>
    </header>
  );
}
