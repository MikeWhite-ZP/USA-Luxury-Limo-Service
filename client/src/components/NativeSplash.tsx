import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  initializeNativeApp, 
  hideSplashScreen, 
  isNativeApp, 
  getTenantServerUrl,
  type NativeBrandingData 
} from '@/lib/nativeBranding';

interface NativeSplashProps {
  onReady: (branding: NativeBrandingData) => void;
  isAdmin?: boolean;
}

export function NativeSplash({ onReady, isAdmin = false }: NativeSplashProps) {
  const [branding, setBranding] = useState<NativeBrandingData | null>(null);
  const [showContent, setShowContent] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    async function initialize() {
      const serverUrl = getTenantServerUrl();
      const brandingData = await initializeNativeApp(serverUrl);
      setBranding(brandingData);
      
      await hideSplashScreen();
      
      setTimeout(() => setShowContent(true), 100);
      
      setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => onReady(brandingData), 500);
      }, 2000);
    }

    if (isNativeApp()) {
      initialize();
    } else {
      const defaultBranding: NativeBrandingData = {
        companyName: 'Luxury Transportation',
        tagline: 'Premium Transportation Services',
        description: '',
        logoUrl: '/images/logo_1759125364025.png',
        faviconUrl: '/images/favicon_1759253989963.png',
        colors: { primary: '#1a1a1a', secondary: '#666666', accent: '#d4af37' }
      };
      setBranding(defaultBranding);
      setShowContent(true);
      setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => onReady(defaultBranding), 500);
      }, 1500);
    }
  }, [onReady]);

  if (!branding) {
    return (
      <div 
        className="fixed inset-0 flex items-center justify-center"
        style={{ 
          backgroundColor: isAdmin ? '#0f172a' : '#ffffff' 
        }}
      >
        <div 
          className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{ 
            borderColor: isAdmin ? '#3b82f6' : '#dc2626',
            borderTopColor: 'transparent'
          }}
        />
      </div>
    );
  }

  return (
    <motion.div
      className="fixed inset-0 flex flex-col items-center justify-center z-[9999]"
      style={{ 
        backgroundColor: isAdmin ? '#0f172a' : '#ffffff' 
      }}
      initial={{ opacity: 1 }}
      animate={{ opacity: fadeOut ? 0 : 1 }}
      transition={{ duration: 0.5 }}
    >
      {showContent && (
        <>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="mb-8"
          >
            <img
              src={branding.logoUrl}
              alt={branding.companyName}
              className="w-48 h-auto max-h-32 object-contain"
              style={{
                filter: isAdmin ? 'brightness(0) invert(1)' : 'none'
              }}
            />
          </motion.div>

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-2xl font-bold text-center px-8"
            style={{ 
              color: isAdmin ? '#ffffff' : branding.colors.primary 
            }}
          >
            {isAdmin ? `${branding.companyName} Admin` : branding.companyName}
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-sm mt-2 text-center px-8"
            style={{ 
              color: isAdmin ? '#94a3b8' : branding.colors.secondary 
            }}
          >
            {branding.tagline}
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="mt-12"
          >
            <div 
              className="w-8 h-8 border-2 rounded-full animate-spin"
              style={{ 
                borderColor: isAdmin ? '#3b82f6' : branding.colors.accent,
                borderTopColor: 'transparent'
              }}
            />
          </motion.div>
        </>
      )}
    </motion.div>
  );
}

export default NativeSplash;
