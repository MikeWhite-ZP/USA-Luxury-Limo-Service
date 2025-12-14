import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { isNativeApp, initializeNativeApp, hideSplashScreen, getTenantServerUrl, type NativeBrandingData } from '@/lib/nativeBranding';
import { NativeSplash } from './NativeSplash';

interface NativeAppContextValue {
  isNative: boolean;
  isReady: boolean;
  branding: NativeBrandingData | null;
  platform: 'ios' | 'android' | 'web';
}

const NativeAppContext = createContext<NativeAppContextValue>({
  isNative: false,
  isReady: true,
  branding: null,
  platform: 'web'
});

export function useNativeApp() {
  return useContext(NativeAppContext);
}

interface NativeAppWrapperProps {
  children: ReactNode;
  isAdmin?: boolean;
}

export function NativeAppWrapper({ children, isAdmin = false }: NativeAppWrapperProps) {
  const [isReady, setIsReady] = useState(!isNativeApp());
  const [branding, setBranding] = useState<NativeBrandingData | null>(null);

  const handleSplashComplete = (brandingData: NativeBrandingData) => {
    setBranding(brandingData);
    setIsReady(true);
  };

  useEffect(() => {
    if (!isNativeApp()) {
      setIsReady(true);
    }
  }, []);

  const contextValue: NativeAppContextValue = {
    isNative: isNativeApp(),
    isReady,
    branding,
    platform: isNativeApp() 
      ? (navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad') ? 'ios' : 'android')
      : 'web'
  };

  return (
    <NativeAppContext.Provider value={contextValue}>
      {!isReady && isNativeApp() && (
        <NativeSplash onReady={handleSplashComplete} isAdmin={isAdmin} />
      )}
      {isReady && children}
    </NativeAppContext.Provider>
  );
}

export default NativeAppWrapper;
