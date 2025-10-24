import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface AdminNavProps {
  onCredentialsClick?: (section: 'api' | 'payment') => void;
  onUserManagerClick?: (type: 'all' | 'passenger' | 'driver' | 'dispatcher' | 'admin') => void;
  onBookingsClick?: () => void;
  onSettingsClick?: (section: 'commission' | 'email' | 'sms') => void;
  onCMSClick?: (section: 'pages' | 'media') => void;
}

export function AdminNav({ onCredentialsClick, onUserManagerClick, onBookingsClick, onSettingsClick, onCMSClick }: AdminNavProps) {
  const [location, setLocation] = useLocation();
  const { logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        window.location.href = '/';
      }
    });
  };

  return (
    <header className="bg-primary text-primary-foreground sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold" data-testid="admin-header">
            USA Luxury Limo - Admin Portal
          </h1>
        </div>
      </div>
      <div className="border-t border-white/20">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex space-x-1" data-testid="admin-nav">
            <Link href="/admin-pricing">
              <Button 
                variant="ghost" 
                className={`text-primary-foreground hover:bg-white/10 rounded-none border-b-2 ${
                  location === '/admin-pricing' ? 'border-white' : 'border-transparent'
                } hover:border-white/50`}
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
                  className="text-primary-foreground hover:bg-white/10 rounded-none border-b-2 border-transparent hover:border-white/50"
                  data-testid="nav-credentials"
                >
                  <Key className="w-4 h-4 mr-2" />
                  Credentials
                  <ChevronDown className="w-4 h-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-[#ffffff]">
                <DropdownMenuItem 
                  onClick={() => {
                    if (location !== '/admin-dashboard') {
                      setLocation('/admin-dashboard');
                    }
                    setTimeout(() => onCredentialsClick?.('api'), 100);
                  }}
                  className="hover:bg-black hover:text-white cursor-pointer"
                  data-testid="nav-api-credentials"
                >
                  <Key className="w-4 h-4 mr-2" />
                  API Credentials
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    if (location !== '/admin-dashboard') {
                      setLocation('/admin-dashboard');
                    }
                    setTimeout(() => onCredentialsClick?.('payment'), 100);
                  }}
                  className="hover:bg-black hover:text-white cursor-pointer"
                  data-testid="nav-payment-systems"
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Payment Systems
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="text-primary-foreground hover:bg-white/10 rounded-none border-b-2 border-transparent hover:border-white/50"
                  data-testid="nav-user-manager"
                >
                  <Users className="w-4 h-4 mr-2" />
                  User Manager
                  <ChevronDown className="w-4 h-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-[#ffffff]">
                <DropdownMenuItem 
                  onClick={() => {
                    if (location !== '/admin-dashboard') {
                      setLocation('/admin-dashboard');
                    }
                    setTimeout(() => onUserManagerClick?.('all'), 100);
                  }}
                  className="hover:bg-black hover:text-white cursor-pointer"
                  data-testid="nav-all-users"
                >
                  <Users className="w-4 h-4 mr-2" />
                  All Users
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    if (location !== '/admin-dashboard') {
                      setLocation('/admin-dashboard');
                    }
                    setTimeout(() => onUserManagerClick?.('passenger'), 100);
                  }}
                  className="hover:bg-black hover:text-white cursor-pointer"
                  data-testid="nav-passengers"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Passengers
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    if (location !== '/admin-dashboard') {
                      setLocation('/admin-dashboard');
                    }
                    setTimeout(() => onUserManagerClick?.('driver'), 100);
                  }}
                  className="hover:bg-black hover:text-white cursor-pointer"
                  data-testid="nav-drivers"
                >
                  <Car className="w-4 h-4 mr-2" />
                  Drivers
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    if (location !== '/admin-dashboard') {
                      setLocation('/admin-dashboard');
                    }
                    setTimeout(() => onUserManagerClick?.('dispatcher'), 100);
                  }}
                  className="hover:bg-black hover:text-white cursor-pointer"
                  data-testid="nav-dispatchers"
                >
                  <SettingsIcon className="w-4 h-4 mr-2" />
                  Dispatchers
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    if (location !== '/admin-dashboard') {
                      setLocation('/admin-dashboard');
                    }
                    setTimeout(() => onUserManagerClick?.('admin'), 100);
                  }}
                  className="hover:bg-black hover:text-white cursor-pointer"
                  data-testid="nav-admins"
                >
                  <Star className="w-4 h-4 mr-2" />
                  Admins
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="text-primary-foreground hover:bg-white/10 rounded-none border-b-2 border-transparent hover:border-white/50"
                  data-testid="nav-settings"
                >
                  <SettingsIcon className="w-4 h-4 mr-2" />
                  Settings
                  <ChevronDown className="w-4 h-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-[#ffffff]">
                <DropdownMenuItem 
                  onClick={() => {
                    if (location !== '/admin-dashboard') {
                      setLocation('/admin-dashboard');
                    }
                    setTimeout(() => onSettingsClick?.('commission'), 100);
                  }}
                  className="hover:bg-black hover:text-white cursor-pointer"
                  data-testid="nav-system-commission"
                >
                  <Percent className="w-4 h-4 mr-2" />
                  System Commission
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    if (location !== '/admin-dashboard') {
                      setLocation('/admin-dashboard');
                    }
                    setTimeout(() => onSettingsClick?.('email'), 100);
                  }}
                  className="hover:bg-black hover:text-white cursor-pointer"
                  data-testid="nav-email-settings"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email Settings
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    if (location !== '/admin-dashboard') {
                      setLocation('/admin-dashboard');
                    }
                    setTimeout(() => onSettingsClick?.('sms'), 100);
                  }}
                  className="hover:bg-black hover:text-white cursor-pointer"
                  data-testid="nav-sms-settings"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  SMS Notifications
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="text-primary-foreground hover:bg-white/10 rounded-none border-b-2 border-transparent hover:border-white/50"
                  data-testid="nav-cms"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  CMS
                  <ChevronDown className="w-4 h-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-[#ffffff]">
                <DropdownMenuItem 
                  onClick={() => {
                    if (location !== '/admin-dashboard') {
                      setLocation('/admin-dashboard');
                    }
                    setTimeout(() => onCMSClick?.('pages'), 100);
                  }}
                  className="hover:bg-black hover:text-white cursor-pointer"
                  data-testid="nav-cms-pages"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Pages
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    if (location !== '/admin-dashboard') {
                      setLocation('/admin-dashboard');
                    }
                    setTimeout(() => onCMSClick?.('media'), 100);
                  }}
                  className="hover:bg-black hover:text-white cursor-pointer"
                  data-testid="nav-cms-media"
                >
                  <Image className="w-4 h-4 mr-2" />
                  Media & Images
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button 
              variant="ghost" 
              className="text-primary-foreground hover:bg-white/10 rounded-none border-b-2 border-transparent hover:border-white/50"
              onClick={() => {
                if (location !== '/admin-dashboard') {
                  setLocation('/admin-dashboard');
                }
                setTimeout(() => onBookingsClick?.(), 100);
              }}
              data-testid="nav-bookings"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Bookings
            </Button>
            
            <div className="flex-grow" />
            
            <Button 
              variant="ghost" 
              className="text-primary-foreground hover:bg-white/10 rounded-none border-b-2 border-transparent hover:border-white/50"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
              data-testid="nav-logout"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
