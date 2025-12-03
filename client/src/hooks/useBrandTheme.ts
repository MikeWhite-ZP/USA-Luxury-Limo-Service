import { useEffect } from 'react';
import { useBranding } from './useBranding';

// Utility function to convert hex to HSL
function hexToHSL(hex: string): { h: number; s: number; l: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 0, s: 0, l: 0 };

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

// Convert hex to HSL string format for CSS
function hexToHSLString(hex: string): string {
  const { h, s, l } = hexToHSL(hex);
  return `${h}deg ${s}% ${l}%`;
}

// Get contrasting text color
function getContrastColor(hex: string): string {
  const { l } = hexToHSL(hex);
  return l > 50 ? '0 0% 10%' : '0 0% 100%';
}

export function useBrandTheme() {
  const branding = useBranding();
  
  useEffect(() => {
    if (!branding.isLoading && branding.colors) {
      const root = document.documentElement;
      
      // Apply primary color (used for main brand elements)
      const primaryHSL = hexToHSLString(branding.colors.primary);
      root.style.setProperty('--brand-primary', primaryHSL);
      root.style.setProperty('--brand-primary-foreground', getContrastColor(branding.colors.primary));
      
      // Apply secondary color
      const secondaryHSL = hexToHSLString(branding.colors.secondary);
      root.style.setProperty('--brand-secondary', secondaryHSL);
      root.style.setProperty('--brand-secondary-foreground', getContrastColor(branding.colors.secondary));
      
      // Apply accent color (for highlights and CTAs)
      const accentHSL = hexToHSLString(branding.colors.accent);
      root.style.setProperty('--brand-accent', accentHSL);
      root.style.setProperty('--brand-accent-foreground', getContrastColor(branding.colors.accent));
      
      // Store raw hex values for components that need them
      root.style.setProperty('--brand-primary-hex', branding.colors.primary);
      root.style.setProperty('--brand-secondary-hex', branding.colors.secondary);
      root.style.setProperty('--brand-accent-hex', branding.colors.accent);
    }
  }, [branding.isLoading, branding.colors]);
  
  return branding;
}

// Export utilities for use in components
export { hexToHSL, hexToHSLString, getContrastColor };
