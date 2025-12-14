declare global {
  interface Window {
    __NATIVE_CONFIG__?: {
      tenantServerUrl?: string;
      appId?: string;
      appName?: string;
      isAdmin?: boolean;
    };
  }
}

export interface NativeConfig {
  tenantServerUrl: string | undefined;
  appId: string | undefined;
  appName: string | undefined;
  isAdmin: boolean;
}

export function getNativeConfig(): NativeConfig {
  if (typeof window !== 'undefined' && window.__NATIVE_CONFIG__) {
    return {
      tenantServerUrl: window.__NATIVE_CONFIG__.tenantServerUrl,
      appId: window.__NATIVE_CONFIG__.appId,
      appName: window.__NATIVE_CONFIG__.appName,
      isAdmin: window.__NATIVE_CONFIG__.isAdmin || false
    };
  }

  const storedServerUrl = localStorage.getItem('tenant_server_url');
  
  return {
    tenantServerUrl: storedServerUrl || undefined,
    appId: undefined,
    appName: undefined,
    isAdmin: false
  };
}

export function setNativeConfig(config: Partial<NativeConfig>): void {
  if (typeof window !== 'undefined') {
    window.__NATIVE_CONFIG__ = {
      ...window.__NATIVE_CONFIG__,
      ...config
    };
    
    if (config.tenantServerUrl) {
      localStorage.setItem('tenant_server_url', config.tenantServerUrl);
    }
  }
}
