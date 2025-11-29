import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, UserCircle, Radio, ChevronRight } from 'lucide-react';
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

  const roles = [
    {
      id: 'passenger' as UserRole,
      label: 'Passenger',
      description: 'Book and manage your rides',
      icon: UserCircle,
      color: 'from-blue-500 to-blue-600',
      bgLight: 'bg-blue-50',
      border: 'border-blue-100',
    },
    {
      id: 'driver' as UserRole,
      label: 'Driver',
      description: 'Accept and complete rides',
      icon: Car,
      color: 'from-emerald-500 to-emerald-600',
      bgLight: 'bg-emerald-50',
      border: 'border-emerald-100',
    },
    {
      id: 'dispatcher' as UserRole,
      label: 'Dispatcher',
      description: 'Manage fleet operations',
      icon: Radio,
      color: 'from-violet-500 to-violet-600',
      bgLight: 'bg-violet-50',
      border: 'border-violet-100',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50/50 to-gray-100 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[500px] h-[500px] bg-gradient-to-br from-gray-100/80 to-gray-200/40 rounded-full blur-3xl -top-64 -right-32" />
        <div className="absolute w-[400px] h-[400px] bg-gradient-to-tr from-gray-100/60 to-gray-50/40 rounded-full blur-3xl -bottom-48 -left-24" />
      </div>
      
      <AnimatePresence mode="wait">
        {stage === 'logo' && (
          <motion.div
            key="logo"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center relative z-10"
          >
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="inline-block mb-6"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-200/50 to-gray-100/30 rounded-3xl blur-2xl scale-110" />
                <img 
                  src={logoUrl} 
                  alt={companyName} 
                  className="w-64 h-auto relative z-10 drop-shadow-lg"
                />
              </div>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-4xl font-bold text-gray-900 mb-3 tracking-tight"
            >
              {companyName}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="text-gray-500 text-lg font-light"
            >
              {tagline}
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.4 }}
              className="mt-8 flex justify-center"
            >
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-gray-300 animate-pulse" />
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 rounded-full bg-gray-300 animate-pulse" style={{ animationDelay: '0.4s' }} />
              </div>
            </motion.div>
          </motion.div>
        )}

        {stage === 'chauffeur' && (
          <motion.div
            key="chauffeur"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="relative w-full max-w-lg z-10"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative rounded-3xl overflow-hidden shadow-2xl shadow-gray-300/50"
            >
              <img
                src={chauffeurImage}
                alt="Luxury Chauffeur Service"
                className="w-full h-[65vh] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/70 to-transparent" />
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="absolute bottom-0 left-0 right-0 p-6"
              >
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-gray-100">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Premium Chauffeur Experience
                  </h2>
                  <p className="text-gray-500 text-sm font-medium tracking-wide">
                    Professional  •  Reliable  •  Luxurious
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}

        {stage === 'role-selection' && (
          <motion.div
            key="role-selection"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-sm relative z-10"
          >
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="text-center mb-8"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome
              </h2>
              <p className="text-gray-500">Select your role to continue</p>
            </motion.div>

            <div className="space-y-3">
              {roles.map((role, index) => {
                const Icon = role.icon;
                return (
                  <motion.div
                    key={role.id}
                    initial={{ x: -30, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 + index * 0.1, duration: 0.4 }}
                  >
                    <Button
                      onClick={() => handleRoleSelect(role.id)}
                      variant="ghost"
                      className={`w-full h-auto p-4 ${role.bgLight} hover:${role.bgLight} ${role.border} border rounded-2xl justify-between group transition-all duration-200 hover:shadow-md touch-manipulation`}
                      data-testid={`button-role-${role.id}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${role.color} shadow-sm`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-left">
                          <div className="text-base font-semibold text-gray-900">{role.label}</div>
                          <div className="text-sm text-gray-500 font-normal">{role.description}</div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all" />
                    </Button>
                  </motion.div>
                );
              })}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              className="text-center mt-10"
            >
              <button
                onClick={() => {
                  setDevicePreference('desktop');
                  navigate('/');
                }}
                className="text-gray-400 hover:text-gray-600 text-sm transition-colors touch-manipulation py-3 px-4"
                data-testid="button-view-desktop-site"
              >
                View Desktop Site
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
