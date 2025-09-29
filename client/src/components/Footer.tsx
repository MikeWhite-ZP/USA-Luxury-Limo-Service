import { Twitter, Linkedin, Facebook } from "lucide-react";
import { useLocation } from "wouter";
import logoImage from "@assets/logo_1759125364025.png";

export default function Footer() {
  const [location, setLocation] = useLocation();
  
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
    <footer className="py-16 bg-[#0b0b0b] text-[#ffffff]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <img 
                src={logoImage} 
                alt="USA Luxury Limo" 
                className="h-12 w-auto object-contain"
                data-testid="footer-logo"
              />
            </div>
            <p className="text-gray-300 mb-4 max-w-md" data-testid="footer-description">
              Premium luxury transportation services across the United States. 
              Experience comfort, reliability, and professionalism with every ride.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-300 hover:text-primary transition-colors" data-testid="social-twitter">
                <Twitter className="w-6 h-6" />
              </a>
              <a href="#" className="text-gray-300 hover:text-primary transition-colors" data-testid="social-facebook">
                <Facebook className="w-6 h-6" />
              </a>
              <a href="#" className="text-gray-300 hover:text-primary transition-colors" data-testid="social-linkedin">
                <Linkedin className="w-6 h-6" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4" data-testid="footer-quick-links-title">Quick Links</h4>
            <ul className="space-y-2 text-gray-300">
              <li>
                <button 
                  onClick={() => handleNavClick('#home')} 
                  className="hover:text-primary transition-colors"
                  data-testid="footer-link-home"
                >
                  Home
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNavClick('#services')} 
                  className="hover:text-primary transition-colors"
                  data-testid="footer-link-services"
                >
                  Services
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNavClick('#fleet')} 
                  className="hover:text-primary transition-colors"
                  data-testid="footer-link-fleet"
                >
                  Fleet
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNavClick('#contact')} 
                  className="hover:text-primary transition-colors"
                  data-testid="footer-link-contact"
                >
                  Contact
                </button>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-lg font-semibold mb-4" data-testid="footer-support-title">Support</h4>
            <ul className="space-y-2 text-gray-300">
              <li>
                <a href="#" className="hover:text-primary transition-colors" data-testid="footer-link-help">
                  Help Center
                </a>
              </li>
              <li>
                <button 
                  onClick={() => setLocation('/privacy-policy')}
                  className="hover:text-primary transition-colors"
                  data-testid="footer-link-privacy"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setLocation('/terms-of-service')}
                  className="hover:text-primary transition-colors"
                  data-testid="footer-link-terms"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors" data-testid="footer-link-cancellation">
                  Cancellation Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors" data-testid="footer-link-safety">
                  Safety
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-300 text-sm" data-testid="footer-copyright">
            © 2024 USA Luxury Limo. All rights reserved.
          </p>
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <span className="text-gray-300 text-sm" data-testid="footer-powered-stripe">Powered by Stripe</span>
            <span className="text-gray-300 text-sm">•</span>
            <span className="text-gray-300 text-sm" data-testid="footer-powered-tomtom">TomTom Navigation</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
