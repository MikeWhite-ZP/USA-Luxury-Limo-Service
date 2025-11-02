import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, UserCircle, Radio, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { setDevicePreference } from '@/lib/deviceDetection';
import { useQuery } from '@tanstack/react-query';
import chauffeurImage from "@assets/khalid_1759128435991.webp";
import usaLuxuryLogo from "@assets/logo_1761944723746.png";

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

  // Check if user is already logged in
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ['/api/user'],
    retry: false,
  });

  useEffect(() => {
    // If user is already authenticated, redirect them to their role-specific mobile page
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

    // Auto-progress through stages only for non-authenticated users
    if (!user && !isLoading) {
      const logoTimer = setTimeout(() => {
        setStage('chauffeur');
      }, 2000);

      return () => clearTimeout(logoTimer);
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    // Skip animations if user is authenticated
    if (user) return;

    if (stage === 'chauffeur') {
      const chauffeurTimer = setTimeout(() => {
        setStage('role-selection');
      }, 2500);

      return () => clearTimeout(chauffeurTimer);
    }
  }, [stage, user]);

  const handleRoleSelect = (role: UserRole) => {
    // Navigate to mobile login with selected role
    navigate(`/mobile-login?role=${role}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 bg-blue-500/5 rounded-full blur-3xl -top-48 -left-24 animate-pulse" />
        <div className="absolute w-96 h-96 bg-purple-500/5 rounded-full blur-3xl -bottom-48 -right-24 animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{ animationDelay: '2s' }} />
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
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-cyan-500/10 rounded-full blur-2xl animate-pulse" />
              <img 
                src={usaLuxuryLogo} 
                alt="USA Luxury Limo" 
                className="w-72 h-auto relative z-10 drop-shadow-2xl"
              />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-2"
            >
              USA Luxury Limo
            </motion.h1>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="flex items-center justify-center gap-2 mt-4"
            >
              <Sparkles className="w-5 h-5 text-blue-600" />
              <p className="text-slate-700 text-xl font-light tracking-wide">
                Premium Transportation Excellence
              </p>
              <Sparkles className="w-5 h-5 text-purple-600" />
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
              className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200"
            >
              <img
                src={chauffeurImage}
                alt="Luxury Chauffeur Service"
                className="w-full h-[70vh] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white/98 via-white/60 to-transparent" />
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="absolute bottom-0 left-0 right-0 p-8 text-slate-900 text-center"
              >
                <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 border border-slate-200 shadow-lg">
                  <h2 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                    Premium Chauffeur Experience
                  </h2>
                  <p className="text-slate-700 text-lg font-light">Professional • Reliable • Luxurious</p>
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
                className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-xl border border-slate-200 rounded-full px-6 py-2 mb-6 shadow-sm"
              >
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span className="text-slate-700 text-sm font-medium">Select Your Portal</span>
              </motion.div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 bg-clip-text text-transparent mb-3">
                Welcome
              </h2>
              <p className="text-slate-600 text-lg font-light">Choose your role to continue</p>
            </motion.div>

            <div className="space-y-3 flex flex-col items-center">
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <Button
                  onClick={() => handleRoleSelect('passenger')}
                  className="group w-64 bg-white hover:bg-blue-50 text-blue-700 rounded-xl font-medium shadow-sm hover:shadow-md border-2 border-blue-200 hover:border-blue-300 transition-all text-[12px] pl-[10px] pr-[10px] pt-[20px] pb-[20px]"
                  data-testid="button-role-passenger"
                >
                  <div className="flex items-center justify-start gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg group-hover:bg-blue-200 transition-colors">
                      <UserCircle className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-semibold text-blue-900">Passenger</div>
                      <div className="text-xs text-blue-600 font-normal">Book and manage rides</div>
                    </div>
                  </div>
                </Button>
              </motion.div>

              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <Button
                  onClick={() => handleRoleSelect('driver')}
                  className="group w-64 bg-white hover:bg-emerald-50 text-emerald-700 rounded-xl font-medium shadow-sm hover:shadow-md border-2 border-emerald-200 hover:border-emerald-300 transition-all text-[12px] pl-[10px] pr-[10px] pt-[20px] pb-[20px]"
                  data-testid="button-role-driver"
                >
                  <div className="flex items-center justify-start gap-3">
                    <div className="bg-emerald-100 p-2 rounded-lg group-hover:bg-emerald-200 transition-colors">
                      <Car className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-semibold text-emerald-900">Driver</div>
                      <div className="text-xs text-emerald-600 font-normal">Accept and complete rides</div>
                    </div>
                  </div>
                </Button>
              </motion.div>

              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                <Button
                  onClick={() => handleRoleSelect('dispatcher')}
                  className="group w-64 bg-white hover:bg-purple-50 text-purple-700 rounded-xl font-medium shadow-sm hover:shadow-md border-2 border-purple-200 hover:border-purple-300 transition-all text-[12px] pl-[10px] pr-[10px] pt-[20px] pb-[20px]"
                  data-testid="button-role-dispatcher"
                >
                  <div className="flex items-center justify-start gap-3">
                    <div className="bg-purple-100 p-2 rounded-lg group-hover:bg-purple-200 transition-colors">
                      <Radio className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-semibold text-purple-900">Dispatcher</div>
                      <div className="text-xs text-purple-600 font-normal">Manage fleet operations</div>
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
                className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-all text-sm group"
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
