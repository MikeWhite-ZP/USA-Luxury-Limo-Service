import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, UserCircle, Radio, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { setDevicePreference } from '@/lib/deviceDetection';
import chauffeurImage from "@assets/khalid_1759128435991.webp";
import usaLuxuryLogo from "@assets/logo_1761944723746.png";

type SplashStage = 'logo' | 'chauffeur' | 'role-selection';
type UserRole = 'passenger' | 'driver' | 'dispatcher';

export default function MobileSplash() {
  const [, navigate] = useLocation();
  const [stage, setStage] = useState<SplashStage>('logo');

  useEffect(() => {
    // Auto-progress through stages
    const logoTimer = setTimeout(() => {
      setStage('chauffeur');
    }, 2000);

    return () => clearTimeout(logoTimer);
  }, []);

  useEffect(() => {
    if (stage === 'chauffeur') {
      const chauffeurTimer = setTimeout(() => {
        setStage('role-selection');
      }, 2500);

      return () => clearTimeout(chauffeurTimer);
    }
  }, [stage]);

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

            <div className="space-y-4">
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <Button
                  onClick={() => handleRoleSelect('passenger')}
                  className="group w-full bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 hover:from-blue-600 hover:via-blue-700 hover:to-blue-800 text-white py-7 rounded-2xl text-lg font-semibold shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all transform hover:scale-[1.02] border border-blue-400/30 relative overflow-hidden"
                  data-testid="button-role-passenger"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  <div className="flex items-center relative z-10">
                    <div className="bg-white/20 p-3 rounded-xl mr-4 group-hover:bg-white/30 transition-colors">
                      <UserCircle className="w-7 h-7" />
                    </div>
                    <div className="text-left">
                      <div className="text-xl font-bold">Passenger</div>
                      <div className="text-sm text-blue-50 font-light">Book and manage rides</div>
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
                  className="group w-full bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 hover:from-emerald-600 hover:via-emerald-700 hover:to-emerald-800 text-white py-7 rounded-2xl text-lg font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 transition-all transform hover:scale-[1.02] border border-emerald-400/30 relative overflow-hidden"
                  data-testid="button-role-driver"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  <div className="flex items-center relative z-10">
                    <div className="bg-white/20 p-3 rounded-xl mr-4 group-hover:bg-white/30 transition-colors">
                      <Car className="w-7 h-7" />
                    </div>
                    <div className="text-left">
                      <div className="text-xl font-bold">Driver</div>
                      <div className="text-sm text-emerald-50 font-light">Accept and complete rides</div>
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
                  className="group w-full bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 hover:from-purple-600 hover:via-purple-700 hover:to-purple-800 text-white py-7 rounded-2xl text-lg font-semibold shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 transition-all transform hover:scale-[1.02] border border-purple-400/30 relative overflow-hidden"
                  data-testid="button-role-dispatcher"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  <div className="flex items-center relative z-10">
                    <div className="bg-white/20 p-3 rounded-xl mr-4 group-hover:bg-white/30 transition-colors">
                      <Radio className="w-7 h-7" />
                    </div>
                    <div className="text-left">
                      <div className="text-xl font-bold">Dispatcher</div>
                      <div className="text-sm text-purple-50 font-light">Manage fleet operations</div>
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
