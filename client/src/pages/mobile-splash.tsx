import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, UserCircle, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import chauffeurImage from "@assets/khalid_1759128435991.webp";

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
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        {/* Stage 1: Animated Logo */}
        {stage === 'logo' && (
          <motion.div
            key="logo"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="inline-block mb-6"
            >
              <Car className="w-32 h-32 text-white" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="text-4xl md:text-5xl font-bold text-white"
            >
              USA <span className="text-primary">Luxury</span> Limo
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="text-gray-400 mt-3 text-lg"
            >
              Premium Transportation
            </motion.p>
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
            className="relative w-full max-w-2xl"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="relative rounded-2xl overflow-hidden shadow-2xl"
            >
              <img
                src={chauffeurImage}
                alt="Luxury Chauffeur Service"
                className="w-full h-[70vh] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="absolute bottom-0 left-0 right-0 p-8 text-white text-center"
              >
                <h2 className="text-3xl font-bold mb-3">Premium Chauffeur Experience</h2>
                <p className="text-gray-200 text-lg">Professional. Reliable. Luxurious.</p>
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
            className="w-full max-w-md"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-center mb-8"
            >
              <h2 className="text-3xl font-bold text-white mb-3">Welcome</h2>
              <p className="text-gray-400 text-lg">Select your role to continue</p>
            </motion.div>

            <div className="space-y-4">
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <Button
                  onClick={() => handleRoleSelect('passenger')}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-8 rounded-xl text-lg font-semibold shadow-lg transition-all transform hover:scale-105"
                  data-testid="button-role-passenger"
                >
                  <UserCircle className="w-8 h-8 mr-3" />
                  <div className="text-left">
                    <div className="text-xl">Passenger</div>
                    <div className="text-sm opacity-90 font-normal">Book and manage rides</div>
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
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-8 rounded-xl text-lg font-semibold shadow-lg transition-all transform hover:scale-105"
                  data-testid="button-role-driver"
                >
                  <Car className="w-8 h-8 mr-3" />
                  <div className="text-left">
                    <div className="text-xl">Driver</div>
                    <div className="text-sm opacity-90 font-normal">Accept and complete rides</div>
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
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white py-8 rounded-xl text-lg font-semibold shadow-lg transition-all transform hover:scale-105"
                  data-testid="button-role-dispatcher"
                >
                  <Radio className="w-8 h-8 mr-3" />
                  <div className="text-left">
                    <div className="text-xl">Dispatcher</div>
                    <div className="text-sm opacity-90 font-normal">Manage fleet operations</div>
                  </div>
                </Button>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="text-center mt-8"
            >
              <button
                onClick={() => navigate('/')}
                className="text-gray-400 hover:text-white transition-colors text-sm"
                data-testid="button-back-home"
              >
                ← Back to website
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
