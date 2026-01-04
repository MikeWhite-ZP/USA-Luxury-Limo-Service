import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useLocation } from "wouter";
import { useSiteLogo } from "@/hooks/useSiteLogo";
import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, ChevronDown, LayoutDashboard } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcherCompact } from "@/components/LanguageSwitcher";

function formatImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('data:') || url.startsWith('http') || url.startsWith('/')) {
    return url;
  }
  return `/api/uploads/${url}`;
}

export default function Header() {
  const { user, isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState<'login' | 'register' | null>(null);
  const [location, setLocation] = useLocation();
  const { logoUrl, logoAltText } = useSiteLogo();
  const { t } = useTranslation();

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
    <header className="border-b border-border sticky top-0 z-50 backdrop-blur-md bg-background/95 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-18">
          {/* Logo */}
          <div className="flex items-center h-12 min-w-[100px]">
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt={logoAltText} 
                className="h-12 w-auto object-contain"
                data-testid="logo"
              />
            ) : (
              <div className="h-12 w-24" />
            )}
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-6">
            <button 
              onClick={() => handleNavClick('#home')} 
              className="text-muted-foreground hover:text-primary font-medium transition-colors duration-200"
              data-testid="nav-home"
            >
              {t('nav.home')}
            </button>
            <button 
              onClick={() => setLocation('/about-us')} 
              className="text-muted-foreground hover:text-primary font-medium transition-colors duration-200"
              data-testid="nav-about"
            >
              {t('nav.about')}
            </button>
            <button 
              onClick={() => setLocation('/locations')} 
              className="text-muted-foreground hover:text-primary font-medium transition-colors duration-200"
              data-testid="nav-locations"
            >
              {t('nav.locations')}
            </button>
            <button 
              onClick={() => setLocation('/hotels')} 
              className="text-muted-foreground hover:text-primary font-medium transition-colors duration-200"
              data-testid="nav-hotels"
            >
              {t('nav.fleet')}
            </button>
            <button 
              onClick={() => handleNavClick('#services')} 
              className="text-muted-foreground hover:text-primary font-medium transition-colors duration-200"
              data-testid="nav-services"
            >
              {t('nav.services')}
            </button>
            <button 
              onClick={() => handleNavClick('#fleet')} 
              className="text-muted-foreground hover:text-primary font-medium transition-colors duration-200"
              data-testid="nav-fleet"
            >
              {t('nav.fleet')}
            </button>
            <button 
              onClick={() => handleNavClick('#contact')} 
              className="text-muted-foreground hover:text-primary font-medium transition-colors duration-200"
              data-testid="nav-contact"
            >
              {t('nav.contact')}
            </button>
          </nav>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <LanguageSwitcherCompact />
            <ThemeToggle variant="ghost" className="text-muted-foreground hover:text-foreground" />
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
                    data-testid="button-account-menu"
                  >
                    {user.profileImageUrl ? (
                      <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100">
                        <img
                          src={formatImageUrl(user.profileImageUrl) || ''}
                          alt="Profile"
                          className="w-full h-full object-cover"
                          data-testid="img-header-profile"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                    <span className="hidden md:inline">{user.firstName || user.email}</span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-background">
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
                    onClick={() => {
                      const dashboardPath = user.role === 'passenger' ? '/passenger' 
                        : user.role === 'driver' ? '/driver'
                        : user.role === 'admin' ? '/admin-dashboard'
                        : user.role === 'dispatcher' ? '/dispatcher'
                        : '/passenger';
                      setLocation(dashboardPath);
                    }}
                    className="cursor-pointer"
                    data-testid="menu-dashboard"
                  >
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    {t('nav.dashboard')}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setLocation('/account')}
                    className="cursor-pointer"
                    data-testid="menu-account"
                  >
                    <User className="w-4 h-4 mr-2" />
                    {t('nav.settings')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => window.location.href = '/api/logout'}
                    className="cursor-pointer text-red-600 focus:text-red-600"
                    data-testid="menu-logout"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    {t('auth.signOut')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <button 
                  onClick={() => setLocation('/login')}
                  className="text-muted-foreground hover:text-primary font-medium transition-colors duration-200"
                  data-testid="button-signin"
                >
                  {t('auth.signIn')}
                </button>
                <Button 
                  onClick={() => setLocation('/booking')}
                  className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-semibold hover:opacity-90 transition-all duration-200 shadow-sm"
                  data-testid="button-book-now"
                >
                  {t('booking.bookNow')}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
