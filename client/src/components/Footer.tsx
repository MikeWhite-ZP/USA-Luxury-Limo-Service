import { Twitter, Linkedin, Facebook, Smartphone } from "lucide-react";
import { useLocation } from "wouter";
import { setDevicePreference } from "@/lib/deviceDetection";
import { useSiteLogo } from "@/hooks/useSiteLogo";
import { useBranding } from "@/hooks/useBranding";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();
  const [location, setLocation] = useLocation();
  const { logoUrl, logoAltText } = useSiteLogo();
  const { companyName, description } = useBranding();
  
  const handleNavClick = (href: string) => {
    // If we're on the home/landing page, scroll to section
    if (location === '/') {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      // If we're on another page, navigate to home first, then scroll
      setLocation('/');
      // Use setTimeout to allow navigation to complete before scrolling
      setTimeout(() => {
        const element = document.querySelector(href);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  };

  return (
    <footer className="py-16 bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 mb-4 h-12 min-w-[100px]">
              {logoUrl && (
                <img 
                  src={logoUrl} 
                  alt={logoAltText} 
                  className="h-12 w-auto object-contain"
                  data-testid="footer-logo"
                />
              )}
            </div>
            <p className="text-primary-foreground/80 mb-4 max-w-md" data-testid="footer-description">
              {description || 'Premium luxury transportation services across the United States. Experience comfort, reliability, and professionalism with every ride.'}
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors" data-testid="social-twitter">
                <Twitter className="w-6 h-6" />
              </a>
              <a href="#" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors" data-testid="social-facebook">
                <Facebook className="w-6 h-6" />
              </a>
              <a href="#" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors" data-testid="social-linkedin">
                <Linkedin className="w-6 h-6" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4" data-testid="footer-quick-links-title">{t('footer.quickLinks')}</h4>
            <ul className="space-y-2 text-primary-foreground/80">
              <li>
                <button 
                  onClick={() => handleNavClick('#home')} 
                  className="hover:text-primary-foreground transition-colors"
                  data-testid="footer-link-home"
                >
                  {t('nav.home')}
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setLocation('/about-us')} 
                  className="hover:text-primary-foreground transition-colors"
                  data-testid="footer-link-about"
                >
                  {t('nav.about')}
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNavClick('#services')} 
                  className="hover:text-primary-foreground transition-colors"
                  data-testid="footer-link-services"
                >
                  {t('nav.services')}
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNavClick('#fleet')} 
                  className="hover:text-primary-foreground transition-colors"
                  data-testid="footer-link-fleet"
                >
                  {t('nav.fleet')}
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNavClick('#contact')} 
                  className="hover:text-primary-foreground transition-colors"
                  data-testid="footer-link-contact"
                >
                  {t('nav.contact')}
                </button>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-lg font-semibold mb-4" data-testid="footer-support-title">{t('footer.support')}</h4>
            <ul className="space-y-2 text-primary-foreground/80">
              <li>
                <button 
                  onClick={() => setLocation('/help-center')}
                  className="hover:text-primary-foreground transition-colors"
                  data-testid="footer-link-help"
                >
                  {t('footer.helpCenter')}
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setLocation('/privacy-policy')}
                  className="hover:text-primary-foreground transition-colors"
                  data-testid="footer-link-privacy"
                >
                  {t('footer.privacyPolicy')}
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setLocation('/terms-of-service')}
                  className="hover:text-primary-foreground transition-colors"
                  data-testid="footer-link-terms"
                >
                  {t('footer.termsOfService')}
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setLocation('/safety')}
                  className="hover:text-primary-foreground transition-colors"
                  data-testid="footer-link-safety"
                >
                  {t('footer.safety')}
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center mb-4">
            <p className="text-primary-foreground/80 text-sm" data-testid="footer-copyright">
              © {new Date().getFullYear()} {companyName}. {t('footer.allRightsReserved')}
            </p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <span className="text-primary-foreground/80 text-sm" data-testid="footer-powered-stripe">{t('footer.poweredByStripe')}</span>
              <span className="text-primary-foreground/80 text-sm">•</span>
              <span className="text-primary-foreground/80 text-sm" data-testid="footer-powered-tomtom">{t('footer.tomtomNavigation')}</span>
            </div>
          </div>
          
          <div className="text-center">
            <button
              onClick={() => {
                setDevicePreference('mobile');
                setLocation('/mobile');
              }}
              className="inline-flex items-center gap-2 text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors"
              data-testid="footer-mobile-version"
            >
              <Smartphone className="w-4 h-4" />
              <span>{t('footer.mobileVersion')}</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
