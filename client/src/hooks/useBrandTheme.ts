import { useEffect } from 'react';
import { useBranding, BrandColors } from './useBranding';

// Store colors globally so observer can access latest values without re-creation
let globalLightColors: BrandColors | null = null;
let globalDarkColors: BrandColors | null = null;

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

// Apply a single color as CSS variable (both HSL and hex formats)
function applyColor(root: HTMLElement, name: string, hex: string) {
  const hsl = hexToHSLString(hex);
  root.style.setProperty(`--brand-${name}`, hsl);
  root.style.setProperty(`--brand-${name}-hex`, hex);
  root.style.setProperty(`--brand-${name}-foreground`, getContrastColor(hex));
}

// Apply all theme colors to the document
function applyThemeColors(colors: BrandColors, isDarkMode: boolean) {
  const root = document.documentElement;
  
  // Apply all brand colors as CSS variables
  // Core brand colors
  applyColor(root, 'primary', colors.primary);
  applyColor(root, 'secondary', colors.secondary);
  applyColor(root, 'accent', colors.accent);
  
  // Button colors
  applyColor(root, 'button-primary', colors.buttonPrimary);
  applyColor(root, 'button-primary-hover', colors.buttonPrimaryHover);
  applyColor(root, 'button-secondary', colors.buttonSecondary);
  applyColor(root, 'button-secondary-hover', colors.buttonSecondaryHover);
  
  // Background colors
  applyColor(root, 'page-bg', colors.pageBackground);
  applyColor(root, 'card-bg', colors.cardBackground);
  applyColor(root, 'header-bg', colors.headerBackground);
  
  // Text colors
  applyColor(root, 'text-primary', colors.textPrimary);
  applyColor(root, 'text-secondary', colors.textSecondary);
  applyColor(root, 'text-muted', colors.textMuted);
  
  // Navigation colors
  applyColor(root, 'nav-active', colors.navActive);
  applyColor(root, 'nav-indicator', colors.navIndicator);
  applyColor(root, 'nav-hover', colors.navHover);
  
  // Link colors
  applyColor(root, 'link-default', colors.linkDefault);
  applyColor(root, 'link-hover', colors.linkHover);
  
  // CRITICAL: Sync with core Shadcn theme variables
  const primaryHSL = hexToHSLString(colors.primary);
  const secondaryHSL = hexToHSLString(colors.secondary);
  const accentHSL = hexToHSLString(colors.accent);
  const pageBackgroundHSL = hexToHSLString(colors.pageBackground);
  const cardBackgroundHSL = hexToHSLString(colors.cardBackground);
  const textMutedHSL = hexToHSLString(colors.textMuted);
  
  // Primary color - used by primary buttons, links, and key UI elements
  root.style.setProperty('--primary', primaryHSL);
  root.style.setProperty('--primary-foreground', getContrastColor(colors.primary));
  
  // Secondary color - used for less prominent elements
  root.style.setProperty('--secondary', secondaryHSL);
  root.style.setProperty('--secondary-foreground', getContrastColor(colors.secondary));
  
  // Accent color - used for highlights, CTAs, and emphasis
  root.style.setProperty('--accent', accentHSL);
  root.style.setProperty('--accent-foreground', getContrastColor(colors.accent));
  
  // Background colors mapped to Shadcn semantic tokens
  root.style.setProperty('--background', pageBackgroundHSL);
  root.style.setProperty('--card', cardBackgroundHSL);
  root.style.setProperty('--popover', cardBackgroundHSL);
  
  // Text colors mapped to semantic tokens
  const textPrimaryHSL = hexToHSLString(colors.textPrimary);
  root.style.setProperty('--foreground', textPrimaryHSL);
  root.style.setProperty('--card-foreground', textPrimaryHSL);
  root.style.setProperty('--popover-foreground', textPrimaryHSL);
  root.style.setProperty('--muted', hexToHSLString(colors.cardBackground));
  root.style.setProperty('--muted-foreground', textMutedHSL);
  
  // Link colors
  const linkDefaultHSL = hexToHSLString(colors.linkDefault);
  root.style.setProperty('--link', linkDefaultHSL);
  
  // Ring color - focus states should match accent for consistency
  root.style.setProperty('--ring', accentHSL);
  
  // Border and input colors - adjust for dark mode
  if (isDarkMode) {
    root.style.setProperty('--border', '217.2 32.6% 17.5%');
    root.style.setProperty('--input', '217.2 32.6% 17.5%');
  } else {
    root.style.setProperty('--border', '214.3 31.8% 91.4%');
    root.style.setProperty('--input', '214.3 31.8% 91.4%');
  }
  
  // Button colors - map primary/secondary button settings to semantic tokens
  const buttonPrimaryHSL = hexToHSLString(colors.buttonPrimary);
  const buttonSecondaryHSL = hexToHSLString(colors.buttonSecondary);
  root.style.setProperty('--button-primary', buttonPrimaryHSL);
  root.style.setProperty('--button-secondary', buttonSecondaryHSL);
  
  // Destructive actions sync with accent if it's red-toned
  const accentHSLObj = hexToHSL(colors.accent);
  if (accentHSLObj.h >= 350 || accentHSLObj.h <= 15) {
    root.style.setProperty('--destructive', accentHSL);
    root.style.setProperty('--destructive-foreground', getContrastColor(colors.accent));
  }
}

// Check if dark mode is currently active
function isDarkModeActive(): boolean {
  // Check for dark class on documentElement (used by next-themes and similar)
  if (document.documentElement.classList.contains('dark')) {
    return true;
  }
  // Check system preference as fallback
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return false;
}

// Function to apply colors based on current theme using global state
function applyCurrentThemeColors() {
  if (!globalLightColors || !globalDarkColors) {
    return;
  }
  const darkMode = isDarkModeActive();
  const colors = darkMode ? globalDarkColors : globalLightColors;
  applyThemeColors(colors, darkMode);
}

// Set up global observer once (singleton pattern)
let observerInitialized = false;

function initializeThemeObserver() {
  if (observerInitialized || typeof window === 'undefined') {
    return;
  }
  observerInitialized = true;
  
  // Watch for dark mode changes via class mutations
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        applyCurrentThemeColors();
        break;
      }
    }
  });
  
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class']
  });
  
  // Also listen for system preference changes
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', () => applyCurrentThemeColors());
}

export function useBrandTheme() {
  const branding = useBranding();
  
  // Apply colors when branding data loads or changes
  useEffect(() => {
    if (!branding.isLoading && branding.colors && branding.darkColors) {
      // Update global state
      globalLightColors = branding.colors;
      globalDarkColors = branding.darkColors;
      
      // Initialize observer if not already done
      initializeThemeObserver();
      
      // Apply current theme colors
      applyCurrentThemeColors();
    }
  }, [branding.isLoading, branding.colors, branding.darkColors]);
  
  return branding;
}

// Export utilities for use in components
export { hexToHSL, hexToHSLString, getContrastColor };
