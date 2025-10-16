import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useLocation } from "wouter";
import logoImage from "@assets/logo_1759125364025.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, ChevronDown } from "lucide-react";

export default function Header() {
  const { user, isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState<'login' | 'register' | null>(null);
  const [location, setLocation] = useLocation();

  const handleNavClick = (href: string) => {
    // If we're not on the home page (root "/"), navigate to home first then scroll
    if (location !== '/') {
      setLocation('/');
      // Use setTimeout to wait for navigation to complete before scrolling
      setTimeout(() => {
        const element = document.querySelector(href);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } else {
      // If we're on home/landing page, just scroll to the section
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <header className="border-b border-border sticky top-0 z-50 backdrop-blur-md bg-[#ffffff]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <img 
              src={logoImage} 
              alt="USA Luxury Limo" 
              className="h-12 w-auto object-contain"
              data-testid="logo"
            />
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            <button 
              onClick={() => handleNavClick('#home')} 
              className="nav-link text-foreground hover:text-primary font-medium"
              data-testid="nav-home"
            >
              Home
            </button>
            <button 
              onClick={() => setLocation('/about-us')} 
              className="nav-link text-foreground hover:text-primary font-medium"
              data-testid="nav-about"
            >
              About
            </button>
            <button 
              onClick={() => setLocation('/locations')} 
              className="nav-link text-foreground hover:text-primary font-medium"
              data-testid="nav-locations"
            >
              Locations
            </button>
            <button 
              onClick={() => setLocation('/hotels')} 
              className="nav-link text-foreground hover:text-primary font-medium"
              data-testid="nav-hotels"
            >
              Hotels
            </button>
            <button 
              onClick={() => handleNavClick('#services')} 
              className="nav-link text-foreground hover:text-primary font-medium"
              data-testid="nav-services"
            >
              Services
            </button>
            <button 
              onClick={() => handleNavClick('#fleet')} 
              className="nav-link text-foreground hover:text-primary font-medium"
              data-testid="nav-fleet"
            >
              Fleet
            </button>
            <button 
              onClick={() => handleNavClick('#contact')} 
              className="nav-link text-foreground hover:text-primary font-medium"
              data-testid="nav-contact"
            >
              Contact
            </button>
          </nav>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-4">
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
                    data-testid="button-account-menu"
                  >
                    <User className="w-4 h-4" />
                    <span className="hidden md:inline">{user.firstName || user.email}</span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-[#ffffff]">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium" data-testid="menu-user-name">
                      {user.firstName && user.lastName 
                        ? `${user.firstName} ${user.lastName}` 
                        : user.firstName || user.email}
                    </p>
                    <p className="text-xs text-muted-foreground" data-testid="menu-user-email">
                      {user.email}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => setLocation('/account')}
                    className="cursor-pointer"
                    data-testid="menu-account"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Account Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => window.location.href = '/api/logout'}
                    className="cursor-pointer text-red-600 focus:text-red-600"
                    data-testid="menu-logout"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <button 
                  onClick={() => setLocation('/login')}
                  className="text-foreground hover:text-primary font-medium"
                  data-testid="button-signin"
                >
                  Sign In
                </button>
                <Button 
                  onClick={() => setLocation('/booking')}
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                  data-testid="button-book-now"
                >
                  Book Now
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
