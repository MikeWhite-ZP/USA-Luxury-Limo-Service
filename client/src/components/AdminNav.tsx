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
  Database,
  Navigation,
  Palette,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSiteLogo } from "@/hooks/useSiteLogo";
import { ThemeToggle } from "@/components/ThemeToggle";

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

  const navButtonClass = "text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 rounded-lg px-4 py-2.5";
  const dropdownItemClass = "cursor-pointer text-muted-foreground hover:bg-muted focus:bg-muted py-2.5 px-3";
  const dropdownContentClass = "w-56 bg-card border border-border shadow-lg rounded-xl";

  return (
    <header className="bg-background sticky top-0 z-50 border-b border-border">
      <div className="max-w-7xl mx-auto">
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
            <div className="hidden sm:block">
              <span className="text-xl font-bold text-foreground">Admin Portal</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <ThemeToggle variant="outline" className="text-muted-foreground hover:text-foreground hover:bg-muted border-border" />
            <Button 
              variant="outline"
              size="sm"
              className="text-muted-foreground hover:text-foreground hover:bg-muted border-border transition-all duration-200"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
              data-testid="nav-logout"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
            </Button>
          </div>
        </div>

        <div className="px-6 pb-2">
          <nav className="flex items-center gap-1 flex-wrap" data-testid="admin-nav">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className={navButtonClass}
                  data-testid="nav-user-manager"
                >
                  <Users className="w-4 h-4 mr-2 text-muted-foreground" />
                  Users
                  <ChevronDown className="w-3.5 h-3.5 ml-1.5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className={dropdownContentClass}>
                <DropdownMenuItem 
                  onClick={() => {
                    if (location === '/admin' || location === '/admin-dashboard') {
                      onUserManagerClick?.('all');
                    } else {
                      setLocation('/admin#users-all');
                    }
                  }}
                  className={dropdownItemClass}
                  data-testid="nav-all-users"
                >
                  <Users className="w-4 h-4 mr-3 text-muted-foreground" />
                  <span className="font-medium">All Users</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem 
                  onClick={() => {
                    if (location === '/admin' || location === '/admin-dashboard') {
                      onUserManagerClick?.('passenger');
                    } else {
                      setLocation('/admin#users-passenger');
                    }
                  }}
                  className={dropdownItemClass}
                  data-testid="nav-passengers"
                >
                  <Users className="w-4 h-4 mr-3 text-blue-500" />
                  <span className="font-medium">Passengers</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    if (location === '/admin' || location === '/admin-dashboard') {
                      onUserManagerClick?.('driver');
                    } else {
                      setLocation('/admin#users-driver');
                    }
                  }}
                  className={dropdownItemClass}
                  data-testid="nav-drivers"
                >
                  <Car className="w-4 h-4 mr-3 text-green-500" />
                  <span className="font-medium">Drivers</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    if (location === '/admin' || location === '/admin-dashboard') {
                      onUserManagerClick?.('dispatcher');
                    } else {
                      setLocation('/admin#users-dispatcher');
                    }
                  }}
                  className={dropdownItemClass}
                  data-testid="nav-dispatchers"
                >
                  <SettingsIcon className="w-4 h-4 mr-3 text-purple-500" />
                  <span className="font-medium">Dispatchers</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    if (location === '/admin' || location === '/admin-dashboard') {
                      onUserManagerClick?.('admin');
                    } else {
                      setLocation('/admin#users-admin');
                    }
                  }}
                  className={dropdownItemClass}
                  data-testid="nav-admins"
                >
                  <Star className="w-4 h-4 mr-3 text-amber-500" />
                  <span className="font-medium">Admins</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className={navButtonClass}
                  data-testid="nav-settings"
                >
                  <SettingsIcon className="w-4 h-4 mr-2 text-muted-foreground" />
                  Settings
                  <ChevronDown className="w-3.5 h-3.5 ml-1.5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className={dropdownContentClass}>
                <DropdownMenuItem 
                  onClick={() => {
                    if (location === '/admin' || location === '/admin-dashboard') {
                      onPricingClick?.();
                    } else {
                      setLocation('/admin-pricing');
                    }
                  }}
                  className={dropdownItemClass}
                  data-testid="nav-pricing"
                >
                  <DollarSign className="w-4 h-4 mr-3 text-muted-foreground" />
                  <span className="font-medium">Pricing</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem 
                  onClick={() => {
                    if (location === '/admin' || location === '/admin-dashboard') {
                      onSettingsClick?.('branding');
                    } else {
                      setLocation('/admin#settings-branding');
                    }
                  }}
                  className={dropdownItemClass}
                  data-testid="nav-branding"
                >
                  <Palette className="w-4 h-4 mr-3 text-pink-500" />
                  <span className="font-medium">Branding</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem 
                  onClick={() => {
                    if (location === '/admin' || location === '/admin-dashboard') {
                      onCredentialsClick?.('api');
                    } else {
                      setLocation('/admin#credentials-api');
                    }
                  }}
                  className={dropdownItemClass}
                  data-testid="nav-api-credentials"
                >
                  <Key className="w-4 h-4 mr-3 text-muted-foreground" />
                  <span className="font-medium">API Credentials</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    if (location === '/admin' || location === '/admin-dashboard') {
                      onCredentialsClick?.('payment');
                    } else {
                      setLocation('/admin#credentials-payment');
                    }
                  }}
                  className={dropdownItemClass}
                  data-testid="nav-payment-systems"
                >
                  <DollarSign className="w-4 h-4 mr-3 text-muted-foreground" />
                  <span className="font-medium">Payment Systems</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    if (location === '/admin' || location === '/admin-dashboard') {
                      onCredentialsClick?.('minio');
                    } else {
                      setLocation('/admin#credentials-minio');
                    }
                  }}
                  className={dropdownItemClass}
                  data-testid="nav-minio-storage"
                >
                  <Key className="w-4 h-4 mr-3 text-muted-foreground" />
                  <span className="font-medium">MinIO Storage</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setLocation('/admin/minio-browser')}
                  className={dropdownItemClass}
                  data-testid="nav-minio-browser"
                >
                  <Image className="w-4 h-4 mr-3 text-cyan-500" />
                  <span className="font-medium">Browse Images</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    if (location === '/admin' || location === '/admin-dashboard') {
                      onVehicleTypesClick?.();
                    } else {
                      setLocation('/admin#vehicle-types');
                    }
                  }}
                  className={dropdownItemClass}
                  data-testid="nav-vehicle-types"
                >
                  <Car className="w-4 h-4 mr-3 text-muted-foreground" />
                  <span className="font-medium">Vehicle Types</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem 
                  onClick={() => {
                    if (location === '/admin' || location === '/admin-dashboard') {
                      onSettingsClick?.('commission');
                    } else {
                      setLocation('/admin#settings-commission');
                    }
                  }}
                  className={dropdownItemClass}
                  data-testid="nav-system-commission"
                >
                  <Percent className="w-4 h-4 mr-3 text-muted-foreground" />
                  <span className="font-medium">System Commission</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    if (location === '/admin' || location === '/admin-dashboard') {
                      onSettingsClick?.('email');
                    } else {
                      setLocation('/admin#settings-email');
                    }
                  }}
                  className={dropdownItemClass}
                  data-testid="nav-email-settings"
                >
                  <Mail className="w-4 h-4 mr-3 text-muted-foreground" />
                  <span className="font-medium">Email Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    if (location === '/admin' || location === '/admin-dashboard') {
                      onSettingsClick?.('sms');
                    } else {
                      setLocation('/admin#settings-sms');
                    }
                  }}
                  className={dropdownItemClass}
                  data-testid="nav-sms-settings"
                >
                  <MessageSquare className="w-4 h-4 mr-3 text-muted-foreground" />
                  <span className="font-medium">SMS Notifications</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem 
                  onClick={() => {
                    if (location === '/admin' || location === '/admin-dashboard') {
                      onSettingsClick?.('database');
                    } else {
                      setLocation('/admin#settings-database');
                    }
                  }}
                  className={dropdownItemClass}
                  data-testid="nav-database-settings"
                >
                  <Database className="w-4 h-4 mr-3 text-muted-foreground" />
                  <span className="font-medium">Database URL</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className={navButtonClass}
                  data-testid="nav-cms"
                >
                  <FileText className="w-4 h-4 mr-2 text-muted-foreground" />
                  CMS
                  <ChevronDown className="w-3.5 h-3.5 ml-1.5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className={dropdownContentClass}>
                <DropdownMenuItem 
                  onClick={() => {
                    if (location === '/admin' || location === '/admin-dashboard') {
                      onCMSClick?.('media');
                    } else {
                      setLocation('/admin#cms-media');
                    }
                  }}
                  className={dropdownItemClass}
                  data-testid="nav-cms-media"
                >
                  <Image className="w-4 h-4 mr-3 text-muted-foreground" />
                  <span className="font-medium">Media & Images</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    if (location === '/admin' || location === '/admin-dashboard') {
                      onCMSClick?.('services');
                    } else {
                      setLocation('/admin#cms-services');
                    }
                  }}
                  className={dropdownItemClass}
                  data-testid="nav-cms-services"
                >
                  <FileText className="w-4 h-4 mr-3 text-muted-foreground" />
                  <span className="font-medium">Services</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
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
              <MessageSquare className="w-4 h-4 mr-2 text-muted-foreground" />
              Bookings
            </Button>
            
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
              <Receipt className="w-4 h-4 mr-2 text-muted-foreground" />
              Invoices
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm"
              className={navButtonClass}
              onClick={() => setLocation('/admin/drivers-map')}
              data-testid="nav-drivers-map"
            >
              <Navigation className="w-4 h-4 mr-2 text-muted-foreground" />
              Drivers Map
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
