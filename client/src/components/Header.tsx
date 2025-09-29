import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useLocation } from "wouter";
import logoImage from "@assets/logo_1759125364025.png";

export default function Header() {
  const { user, isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState<'login' | 'register' | null>(null);
  const [, setLocation] = useLocation();

  const handleNavClick = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <header className="bg-background border-b border-border sticky top-0 z-50 backdrop-blur-md">
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
              <div className="flex items-center space-x-4">
                <span className="text-foreground font-medium" data-testid="user-welcome">
                  Welcome, {user.firstName || user.email}
                </span>
                <Button 
                  onClick={() => window.location.href = '/api/logout'}
                  variant="outline"
                  data-testid="button-logout"
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <>
                <button 
                  onClick={() => window.location.href = '/api/login'}
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
