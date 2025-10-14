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
} from "lucide-react";

interface AdminNavProps {
  onCredentialsClick?: (section: 'api' | 'payment') => void;
  onUserManagerClick?: (type: 'all' | 'passenger' | 'driver' | 'dispatcher' | 'admin') => void;
  onBookingsClick?: () => void;
}

export function AdminNav({ onCredentialsClick, onUserManagerClick, onBookingsClick }: AdminNavProps) {
  const [location] = useLocation();

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
                      window.location.href = '/admin-dashboard';
                    }
                    onCredentialsClick?.('api');
                  }}
                  data-testid="nav-api-credentials"
                >
                  <Key className="w-4 h-4 mr-2" />
                  API Credentials
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    if (location !== '/admin-dashboard') {
                      window.location.href = '/admin-dashboard';
                    }
                    onCredentialsClick?.('payment');
                  }}
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
                      window.location.href = '/admin-dashboard';
                    }
                    onUserManagerClick?.('all');
                  }}
                  data-testid="nav-all-users"
                >
                  <Users className="w-4 h-4 mr-2" />
                  All Users
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    if (location !== '/admin-dashboard') {
                      window.location.href = '/admin-dashboard';
                    }
                    onUserManagerClick?.('passenger');
                  }}
                  data-testid="nav-passengers"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Passengers
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    if (location !== '/admin-dashboard') {
                      window.location.href = '/admin-dashboard';
                    }
                    onUserManagerClick?.('driver');
                  }}
                  data-testid="nav-drivers"
                >
                  <Car className="w-4 h-4 mr-2" />
                  Drivers
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    if (location !== '/admin-dashboard') {
                      window.location.href = '/admin-dashboard';
                    }
                    onUserManagerClick?.('dispatcher');
                  }}
                  data-testid="nav-dispatchers"
                >
                  <SettingsIcon className="w-4 h-4 mr-2" />
                  Dispatchers
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    if (location !== '/admin-dashboard') {
                      window.location.href = '/admin-dashboard';
                    }
                    onUserManagerClick?.('admin');
                  }}
                  data-testid="nav-admins"
                >
                  <Star className="w-4 h-4 mr-2" />
                  Admins
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button 
              variant="ghost" 
              className="text-primary-foreground hover:bg-white/10 rounded-none border-b-2 border-transparent hover:border-white/50"
              onClick={() => {
                if (location !== '/admin-dashboard') {
                  window.location.href = '/admin-dashboard';
                }
                onBookingsClick?.();
              }}
              data-testid="nav-bookings"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Bookings
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
