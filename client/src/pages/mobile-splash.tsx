import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, UserCircle, Radio, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { setDevicePreference } from '@/lib/deviceDetection';
import { useQuery } from '@tanstack/react-query';

const chauffeurImage = '/images/khalid_1759128435991.webp';
const usaLuxuryLogo = '/images/logo_1761944723746.png';

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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10 dark:from-background dark:via-background dark:to-primary/5 flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 bg-primary/5 dark:bg-primary/10 rounded-full blur-3xl -top-48 -left-24 animate-pulse" />
        <div className="absolute w-96 h-96 bg-accent/10 dark:bg-accent/20 rounded-full blur-3xl -bottom-48 -right-24 animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute w-80 h-80 bg-primary/5 dark:bg-primary/10 rounded-full blur-3xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{ animationDelay: '2s' }} />
      </div>
      
      <AnimatePresence mode="wait">
        {/* Stage 1: Animated Logo */}
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
              className="inline-block mb-8 relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 dark:from-primary/20 dark:via-accent/20 dark:to-primary/20 rounded-full blur-2xl animate-pulse" />
              <img 
                src={usaLuxuryLogo} 
                alt="USA Luxury Limo" 
                className="w-72 h-auto relative z-10 drop-shadow-2xl dark:brightness-110"
              />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent mb-2"
            >
              USA Luxury Limo
            </motion.h1>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="flex items-center justify-center gap-2 mt-4"
            >
              <Sparkles className="w-5 h-5 text-primary" />
              <p className="text-muted-foreground text-xl font-light tracking-wide">
                Premium Transportation Excellence
              </p>
              <Sparkles className="w-5 h-5 text-primary" />
            </motion.div>
          </motion.div>
        )}

        {/* Stage 2: Luxury Chauffeur Image */}
        {stage === 'chauffeur' && (
          <motion.div
            key="chauffeur"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="relative w-full max-w-2xl z-10"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="relative rounded-3xl overflow-hidden shadow-2xl border border-border"
            >
              <img
                src={chauffeurImage}
                alt="Luxury Chauffeur Service"
                className="w-full h-[70vh] object-cover dark:brightness-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/98 via-background/60 to-transparent" />
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="absolute bottom-0 left-0 right-0 p-8 text-center"
              >
                <div className="bg-card/95 backdrop-blur-xl rounded-2xl p-6 border border-border shadow-lg">
                  <h2 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                    Premium Chauffeur Experience
                  </h2>
                  <p className="text-muted-foreground text-lg font-light">Professional • Reliable • Luxurious</p>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}

        {/* Stage 3: Role Selection */}
        {stage === 'role-selection' && (
          <motion.div
            key="role-selection"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-md relative z-10"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-center mb-10"
            >
              <motion.div
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="inline-flex items-center gap-2 bg-card/80 dark:bg-card/90 backdrop-blur-xl border border-border rounded-full px-6 py-2 mb-6 shadow-sm"
              >
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground text-sm font-medium">Select Your Portal</span>
              </motion.div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent mb-3">
                Welcome
              </h2>
              <p className="text-muted-foreground text-lg font-light">Choose your role to continue</p>
            </motion.div>

            <div className="space-y-3 flex flex-col items-center">
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="w-full max-w-sm"
              >
                <Button
                  onClick={() => handleRoleSelect('passenger')}
                  className="group w-full bg-card hover:bg-accent dark:bg-card dark:hover:bg-accent text-primary rounded-xl font-medium shadow-md hover:shadow-lg border-2 border-primary/20 hover:border-primary/40 dark:border-primary/30 dark:hover:border-primary/50 transition-all py-6 h-auto touch-manipulation"
                  data-testid="button-role-passenger"
                >
                  <div className="flex items-center justify-start gap-4">
                    <div className="bg-primary/10 dark:bg-primary/20 p-3 rounded-lg group-hover:bg-primary/20 dark:group-hover:bg-primary/30 transition-colors">
                      <UserCircle className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-left">
                      <div className="text-base font-semibold text-foreground">Passenger</div>
                      <div className="text-sm text-muted-foreground font-normal">Book and manage rides</div>
                    </div>
                  </div>
                </Button>
              </motion.div>

              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="w-full max-w-sm"
              >
                <Button
                  onClick={() => handleRoleSelect('driver')}
                  className="group w-full bg-card hover:bg-accent dark:bg-card dark:hover:bg-accent text-primary rounded-xl font-medium shadow-md hover:shadow-lg border-2 border-primary/20 hover:border-primary/40 dark:border-primary/30 dark:hover:border-primary/50 transition-all py-6 h-auto touch-manipulation"
                  data-testid="button-role-driver"
                >
                  <div className="flex items-center justify-start gap-4">
                    <div className="bg-primary/10 dark:bg-primary/20 p-3 rounded-lg group-hover:bg-primary/20 dark:group-hover:bg-primary/30 transition-colors">
                      <Car className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-left">
                      <div className="text-base font-semibold text-foreground">Driver</div>
                      <div className="text-sm text-muted-foreground font-normal">Accept and complete rides</div>
                    </div>
                  </div>
                </Button>
              </motion.div>

              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="w-full max-w-sm"
              >
                <Button
                  onClick={() => handleRoleSelect('dispatcher')}
                  className="group w-full bg-card hover:bg-accent dark:bg-card dark:hover:bg-accent text-primary rounded-xl font-medium shadow-md hover:shadow-lg border-2 border-primary/20 hover:border-primary/40 dark:border-primary/30 dark:hover:border-primary/50 transition-all py-6 h-auto touch-manipulation"
                  data-testid="button-role-dispatcher"
                >
                  <div className="flex items-center justify-start gap-4">
                    <div className="bg-primary/10 dark:bg-primary/20 p-3 rounded-lg group-hover:bg-primary/20 dark:group-hover:bg-primary/30 transition-colors">
                      <Radio className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-left">
                      <div className="text-base font-semibold text-foreground">Dispatcher</div>
                      <div className="text-sm text-muted-foreground font-normal">Manage fleet operations</div>
                    </div>
                  </div>
                </Button>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="text-center mt-10"
            >
              <button
                onClick={() => {
                  setDevicePreference('desktop');
                  navigate('/');
                }}
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all text-sm group touch-manipulation py-3 px-4"
                data-testid="button-view-desktop-site"
              >
                <span className="group-hover:-translate-x-1 transition-transform">←</span>
                <span>View Desktop Site</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
