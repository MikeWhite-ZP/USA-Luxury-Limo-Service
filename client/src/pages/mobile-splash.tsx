import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, UserCircle, Radio, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { setDevicePreference } from '@/lib/deviceDetection';
import { useQuery } from '@tanstack/react-query';
import { useBranding } from '@/hooks/useBranding';

const chauffeurImage = '/images/khalid_1759128435991.webp';

type SplashStage = 'logo' | 'chauffeur' | 'role-selection';
type UserRole = 'passenger' | 'driver' | 'dispatcher';

interface User {
  id: string;
  username: string;
  role: UserRole;
}

export default function MobileSplash() {
  const [, navigate] = useLocation();
  const [stage, setStage] = useState<SplashStage>('logo');
  const { companyName, tagline, logoUrl } = useBranding();

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ['/api/user'],
    retry: false,
  });

  useEffect(() => {
    if (user && !isLoading) {
      const mobileRoutes: Record<UserRole, string> = {
        passenger: '/mobile-passenger',
        driver: '/mobile-driver',
        dispatcher: '/mobile-dispatcher',
      };
      
      const route = mobileRoutes[user.role];
      if (route) {
        navigate(route);
      }
      return;
    }

    if (!user && !isLoading) {
      const logoTimer = setTimeout(() => {
        setStage('chauffeur');
      }, 2000);

      return () => clearTimeout(logoTimer);
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (user) return;

    if (stage === 'chauffeur') {
      const chauffeurTimer = setTimeout(() => {
        setStage('role-selection');
      }, 2500);

      return () => clearTimeout(chauffeurTimer);
    }
  }, [stage, user]);

  const handleRoleSelect = (role: UserRole) => {
    navigate(`/mobile-login?role=${role}`);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-3 relative overflow-hidden">
      <AnimatePresence mode="wait">
        {/* Stage 1: Logo */}
        {stage === 'logo' && (
          <motion.div
            key="logo"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            transition={{ duration: 0.8 }}
            className="text-center relative z-10"
          >
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="inline-block mb-6 relative"
            >
              <img 
                src={logoUrl} 
                alt={companyName} 
                className="w-56 h-auto relative z-10 drop-shadow-xl"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="flex items-center justify-center gap-2 mt-3"
            >
              <Sparkles className="w-4 h-4" style={{ color: 'var(--brand-accent-hex)' }} />
              <p className="text-muted-foreground text-lg font-light tracking-wide">
                {tagline}
              </p>
              <Sparkles className="w-4 h-4" style={{ color: 'var(--brand-accent-hex)' }} />
            </motion.div>
          </motion.div>
        )}

        {/* Stage 2: Chauffeur Image */}
        {stage === 'chauffeur' && (
          <motion.div
            key="chauffeur"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="relative w-full max-w-xl z-10"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="relative rounded-2xl overflow-hidden shadow-xl border border-border"
            >
              <img
                src={chauffeurImage}
                alt="Luxury Chauffeur Service"
                className="w-full h-[60vh] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/98 via-background/60 to-transparent" />
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="absolute bottom-0 left-0 right-0 p-5 text-center"
              >
                <div className="bg-card/95 backdrop-blur-lg rounded-xl p-4 border border-border shadow-md">
                  <h2 className="text-xl font-bold mb-1.5 text-foreground">
                    Premium Chauffeur Experience
                  </h2>
                  <p className="text-muted-foreground text-sm font-light">Professional • Reliable • Luxurious</p>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}

        {/* Stage 3: Role Selection - Compact */}
        {stage === 'role-selection' && (
          <motion.div
            key="role-selection"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-sm relative z-10"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="text-center mb-6"
            >
              <motion.div
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="inline-flex items-center gap-1.5 bg-card/80 backdrop-blur-lg border border-border rounded-full px-4 py-1.5 mb-4 shadow-sm"
              >
                <Sparkles className="w-3 h-3" style={{ color: 'var(--brand-accent-hex)' }} />
                <span className="text-muted-foreground text-xs font-medium">Select Your Portal</span>
              </motion.div>
              <h2 className="text-2xl font-bold text-foreground mb-1.5">
                Welcome
              </h2>
              <p className="text-muted-foreground text-sm font-light">Choose your role</p>
            </motion.div>

            <div className="space-y-2 flex flex-col items-center">
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="w-full"
              >
                <Button
                  onClick={() => handleRoleSelect('passenger')}
                  className="group w-full bg-card hover:bg-muted rounded-lg font-medium shadow-sm hover:shadow-md border border-border hover:border-[color:var(--brand-accent-hex)] transition-all py-4 h-auto touch-manipulation"
                  data-testid="button-role-passenger"
                >
                  <div className="flex items-center justify-start gap-3 w-full">
                    <div className="p-2 rounded-md" style={{ backgroundColor: 'var(--brand-primary-hex)', opacity: 0.15 }}>
                      <UserCircle className="w-5 h-5" style={{ color: 'var(--brand-accent-hex)' }} />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-semibold text-foreground">Passenger</div>
                      <div className="text-xs text-muted-foreground font-normal">Book and manage rides</div>
                    </div>
                  </div>
                </Button>
              </motion.div>

              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                className="w-full"
              >
                <Button
                  onClick={() => handleRoleSelect('driver')}
                  className="group w-full bg-card hover:bg-muted rounded-lg font-medium shadow-sm hover:shadow-md border border-border hover:border-[color:var(--brand-accent-hex)] transition-all py-4 h-auto touch-manipulation"
                  data-testid="button-role-driver"
                >
                  <div className="flex items-center justify-start gap-3 w-full">
                    <div className="p-2 rounded-md" style={{ backgroundColor: 'var(--brand-primary-hex)', opacity: 0.15 }}>
                      <Car className="w-5 h-5" style={{ color: 'var(--brand-accent-hex)' }} />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-semibold text-foreground">Driver</div>
                      <div className="text-xs text-muted-foreground font-normal">Accept and complete rides</div>
                    </div>
                  </div>
                </Button>
              </motion.div>

              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className="w-full"
              >
                <Button
                  onClick={() => handleRoleSelect('dispatcher')}
                  className="group w-full bg-card hover:bg-muted rounded-lg font-medium shadow-sm hover:shadow-md border border-border hover:border-[color:var(--brand-accent-hex)] transition-all py-4 h-auto touch-manipulation"
                  data-testid="button-role-dispatcher"
                >
                  <div className="flex items-center justify-start gap-3 w-full">
                    <div className="p-2 rounded-md" style={{ backgroundColor: 'var(--brand-primary-hex)', opacity: 0.15 }}>
                      <Radio className="w-5 h-5" style={{ color: 'var(--brand-accent-hex)' }} />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-semibold text-foreground">Dispatcher</div>
                      <div className="text-xs text-muted-foreground font-normal">Manage fleet operations</div>
                    </div>
                  </div>
                </Button>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.4 }}
              className="text-center mt-6"
            >
              <button
                onClick={() => {
                  setDevicePreference('desktop');
                  navigate('/');
                }}
                className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-all text-xs group touch-manipulation py-2 px-3"
                data-testid="button-view-desktop-site"
              >
                <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
                <span>View Desktop Site</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
