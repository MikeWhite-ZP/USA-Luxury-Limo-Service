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
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSiteLogo } from "@/hooks/useSiteLogo";

interface AdminNavProps {
  onCredentialsClick?: (section: 'api' | 'payment') => void;
  onUserManagerClick?: (type: 'all' | 'passenger' | 'driver' | 'dispatcher' | 'admin') => void;
  onBookingsClick?: () => void;
  onInvoicesClick?: () => void;
  onSettingsClick?: (section: 'commission' | 'email' | 'sms') => void;
  onCMSClick?: (section: 'pages' | 'media') => void;
}

export function AdminNav({ onCredentialsClick, onUserManagerClick, onBookingsClick, onInvoicesClick, onSettingsClick, onCMSClick }: AdminNavProps) {
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
    <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white sticky top-0 z-50 shadow-lg border-b border-slate-700">
      <div className="max-w-7xl mx-auto">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <Link href="/">
              <img 
                src={logoUrl} 
                alt={logoAltText} 
                className="h-12 w-auto object-contain cursor-pointer hover:opacity-80 transition-opacity"
                data-testid="admin-logo"
              />
            </Link>
            <div>
              <p className="text-[24px] font-bold text-[#ffffff] pl-[30px] pr-[30px] text-center">Admin Portal</p>
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm"
            className="text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all duration-200"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            data-testid="nav-logout"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
          </Button>
        </div>

        {/* Navigation Bar */}
        <div className="px-6">
          <nav className="flex items-center gap-1 -mb-px" data-testid="admin-nav">
            <Link href="/admin-pricing">
              <Button 
                variant="ghost" 
                size="sm"
                className={`relative text-sm font-medium transition-all duration-200 rounded-t-lg rounded-b-none px-4 py-2.5 ${
                  location === '/admin-pricing' 
                    ? 'bg-slate-700/50 text-white border-b-2 border-blue-500' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/30'
                }`}
                data-testid="nav-pricing"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Pricing
              </Button>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700/30 transition-all duration-200 rounded-t-lg rounded-b-none px-4 py-2.5"
                  data-testid="nav-credentials"
                >
                  <Key className="w-4 h-4 mr-2" />
                  Credentials
                  <ChevronDown className="w-3.5 h-3.5 ml-1.5 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-xl">
                <DropdownMenuItem 
                  onClick={() => {
                    if (location === '/admin' || location === '/admin-dashboard') {
                      onCredentialsClick?.('api');
                    } else {
                      setLocation('/admin#credentials-api');
                    }
                  }}
                  className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 focus:bg-slate-100 dark:focus:bg-slate-700 py-2.5"
                  data-testid="nav-api-credentials"
                >
                  <Key className="w-4 h-4 mr-3 text-slate-500" />
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
                  className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 focus:bg-slate-100 dark:focus:bg-slate-700 py-2.5"
                  data-testid="nav-payment-systems"
                >
                  <DollarSign className="w-4 h-4 mr-3 text-slate-500" />
                  <span className="font-medium">Payment Systems</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700/30 transition-all duration-200 rounded-t-lg rounded-b-none px-4 py-2.5"
                  data-testid="nav-user-manager"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Users
                  <ChevronDown className="w-3.5 h-3.5 ml-1.5 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-xl">
                <DropdownMenuItem 
                  onClick={() => {
                    if (location === '/admin' || location === '/admin-dashboard') {
                      onUserManagerClick?.('all');
                    } else {
                      setLocation('/admin#users-all');
                    }
                  }}
                  className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 focus:bg-slate-100 dark:focus:bg-slate-700 py-2.5"
                  data-testid="nav-all-users"
                >
                  <Users className="w-4 h-4 mr-3 text-slate-500" />
                  <span className="font-medium">All Users</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => {
                    if (location === '/admin' || location === '/admin-dashboard') {
                      onUserManagerClick?.('passenger');
                    } else {
                      setLocation('/admin#users-passenger');
                    }
                  }}
                  className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 focus:bg-slate-100 dark:focus:bg-slate-700 py-2.5"
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
                  className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 focus:bg-slate-100 dark:focus:bg-slate-700 py-2.5"
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
                  className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 focus:bg-slate-100 dark:focus:bg-slate-700 py-2.5"
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
                  className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 focus:bg-slate-100 dark:focus:bg-slate-700 py-2.5"
                  data-testid="nav-admins"
                >
                  <Star className="w-4 h-4 mr-3 text-yellow-500" />
                  <span className="font-medium">Admins</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700/30 transition-all duration-200 rounded-t-lg rounded-b-none px-4 py-2.5"
                  data-testid="nav-settings"
                >
                  <SettingsIcon className="w-4 h-4 mr-2" />
                  Settings
                  <ChevronDown className="w-3.5 h-3.5 ml-1.5 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-xl">
                <DropdownMenuItem 
                  onClick={() => {
                    if (location === '/admin' || location === '/admin-dashboard') {
                      onSettingsClick?.('commission');
                    } else {
                      setLocation('/admin#settings-commission');
                    }
                  }}
                  className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 focus:bg-slate-100 dark:focus:bg-slate-700 py-2.5"
                  data-testid="nav-system-commission"
                >
                  <Percent className="w-4 h-4 mr-3 text-slate-500" />
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
                  className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 focus:bg-slate-100 dark:focus:bg-slate-700 py-2.5"
                  data-testid="nav-email-settings"
                >
                  <Mail className="w-4 h-4 mr-3 text-slate-500" />
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
                  className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 focus:bg-slate-100 dark:focus:bg-slate-700 py-2.5"
                  data-testid="nav-sms-settings"
                >
                  <MessageSquare className="w-4 h-4 mr-3 text-slate-500" />
                  <span className="font-medium">SMS Notifications</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700/30 transition-all duration-200 rounded-t-lg rounded-b-none px-4 py-2.5"
                  data-testid="nav-cms"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  CMS
                  <ChevronDown className="w-3.5 h-3.5 ml-1.5 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-xl">
                <DropdownMenuItem 
                  onClick={() => {
                    if (location === '/admin' || location === '/admin-dashboard') {
                      onCMSClick?.('pages');
                    } else {
                      setLocation('/admin#cms-pages');
                    }
                  }}
                  className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 focus:bg-slate-100 dark:focus:bg-slate-700 py-2.5"
                  data-testid="nav-cms-pages"
                >
                  <FileText className="w-4 h-4 mr-3 text-slate-500" />
                  <span className="font-medium">Pages</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    if (location === '/admin' || location === '/admin-dashboard') {
                      onCMSClick?.('media');
                    } else {
                      setLocation('/admin#cms-media');
                    }
                  }}
                  className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 focus:bg-slate-100 dark:focus:bg-slate-700 py-2.5"
                  data-testid="nav-cms-media"
                >
                  <Image className="w-4 h-4 mr-3 text-slate-500" />
                  <span className="font-medium">Media & Images</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button 
              variant="ghost" 
              size="sm"
              className="text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700/30 transition-all duration-200 rounded-t-lg rounded-b-none px-4 py-2.5"
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
            
            <Button 
              variant="ghost" 
              size="sm"
              className="text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700/30 transition-all duration-200 rounded-t-lg rounded-b-none px-4 py-2.5"
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
          </nav>
        </div>
      </div>
    </header>
  );
}
