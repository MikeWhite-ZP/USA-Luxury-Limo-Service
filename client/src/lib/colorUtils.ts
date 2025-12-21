/**
 * Color utility functions for light/dark theme color generation
 */

// Convert hex to RGB
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  };
}

// Convert RGB to hex
export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

// Convert hex to HSL
export function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  
  return { h: h * 360, s: s * 100, l: l * 100 };
}

// Convert HSL to hex
export function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  
  let r = 0, g = 0, b = 0;
  
  if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
  else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
  else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
  else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
  else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
  else if (h >= 300 && h < 360) { r = c; g = 0; b = x; }
  
  return rgbToHex(
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255)
  );
}

// Check if a color is light or dark
export function isLightColor(hex: string): boolean {
  const hsl = hexToHsl(hex);
  if (!hsl) return true;
  return hsl.l > 50;
}

// Generate a dark mode version of a light mode color
export function generateDarkModeColor(lightHex: string, colorType: string): string {
  const hsl = hexToHsl(lightHex);
  if (!hsl) return lightHex;
  
  let { h, s, l } = hsl;
  
  // Different transformation strategies based on color type
  switch (colorType) {
    // Background colors - invert lightness dramatically
    case 'pageBackground':
      return hslToHex(h, Math.max(s - 5, 0), 7); // Very dark background
    case 'cardBackground':
      return hslToHex(h, Math.max(s - 3, 0), 12); // Slightly lighter for cards
    case 'headerBackground':
      return hslToHex(h, Math.max(s - 5, 0), 10); // Dark header
    
    // Text colors - invert for visibility on dark backgrounds
    case 'textPrimary':
      return hslToHex(h, Math.max(s - 20, 0), 95); // Near white
    case 'textSecondary':
      return hslToHex(h, Math.max(s - 15, 0), 80); // Light gray
    case 'textMuted':
      return hslToHex(h, Math.max(s - 10, 0), 55); // Medium gray
    
    // Accent/Brand colors - keep hue, adjust saturation and lightness for visibility
    case 'primary':
    case 'accent':
    case 'buttonPrimary':
    case 'navActive':
    case 'navIndicator':
    case 'linkDefault':
      // Make accent colors slightly more vibrant and lighter in dark mode
      return hslToHex(h, Math.min(s + 10, 100), Math.min(l + 15, 70));
    
    // Hover states - slightly lighter than base
    case 'buttonPrimaryHover':
    case 'linkHover':
      return hslToHex(h, Math.min(s + 5, 100), Math.min(l + 20, 75));
    
    // Secondary colors
    case 'secondary':
    case 'buttonSecondary':
      return hslToHex(h, Math.max(s - 10, 0), Math.max(l + 30, 50));
    case 'buttonSecondaryHover':
      return hslToHex(h, Math.max(s - 5, 0), Math.max(l + 35, 55));
    
    // Navigation hover - subtle highlight on dark
    case 'navHover':
      // Create a subtle dark mode hover from the accent color
      const accentHsl = hexToHsl(lightHex);
      if (accentHsl) {
        return hslToHex(accentHsl.h, Math.max(accentHsl.s - 60, 10), 20);
      }
      return hslToHex(h, 10, 20);
    
    default:
      // Default: invert lightness while preserving hue and reducing saturation slightly
      if (l > 50) {
        return hslToHex(h, Math.max(s - 10, 0), 100 - l);
      }
      return hslToHex(h, Math.min(s + 10, 100), Math.min(l + 20, 65));
  }
}

// Generate complete dark mode color palette from light mode colors
export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  buttonPrimary: string;
  buttonPrimaryHover: string;
  buttonSecondary: string;
  buttonSecondaryHover: string;
  pageBackground: string;
  cardBackground: string;
  headerBackground: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  navActive: string;
  navIndicator: string;
  navHover: string;
  linkDefault: string;
  linkHover: string;
  [key: string]: string; // Index signature for dynamic access
}

export function generateDarkPalette(lightColors: ColorPalette): ColorPalette {
  return {
    primary: generateDarkModeColor(lightColors.primary, 'primary'),
    secondary: generateDarkModeColor(lightColors.secondary, 'secondary'),
    accent: generateDarkModeColor(lightColors.accent, 'accent'),
    buttonPrimary: generateDarkModeColor(lightColors.buttonPrimary, 'buttonPrimary'),
    buttonPrimaryHover: generateDarkModeColor(lightColors.buttonPrimaryHover, 'buttonPrimaryHover'),
    buttonSecondary: generateDarkModeColor(lightColors.buttonSecondary, 'buttonSecondary'),
    buttonSecondaryHover: generateDarkModeColor(lightColors.buttonSecondaryHover, 'buttonSecondaryHover'),
    pageBackground: generateDarkModeColor(lightColors.pageBackground, 'pageBackground'),
    cardBackground: generateDarkModeColor(lightColors.cardBackground, 'cardBackground'),
    headerBackground: generateDarkModeColor(lightColors.headerBackground, 'headerBackground'),
    textPrimary: generateDarkModeColor(lightColors.textPrimary, 'textPrimary'),
    textSecondary: generateDarkModeColor(lightColors.textSecondary, 'textSecondary'),
    textMuted: generateDarkModeColor(lightColors.textMuted, 'textMuted'),
    navActive: generateDarkModeColor(lightColors.navActive, 'navActive'),
    navIndicator: generateDarkModeColor(lightColors.navIndicator, 'navIndicator'),
    navHover: generateDarkModeColor(lightColors.navHover, 'navHover'),
    linkDefault: generateDarkModeColor(lightColors.linkDefault, 'linkDefault'),
    linkHover: generateDarkModeColor(lightColors.linkHover, 'linkHover'),
  };
}

// Default dark theme colors
export const DEFAULT_DARK_COLORS: ColorPalette = {
  primary: '#e5e5e5',
  secondary: '#a3a3a3',
  accent: '#ef4444',
  buttonPrimary: '#ef4444',
  buttonPrimaryHover: '#f87171',
  buttonSecondary: '#6b7280',
  buttonSecondaryHover: '#9ca3af',
  pageBackground: '#0f0f0f',
  cardBackground: '#1a1a1a',
  headerBackground: '#141414',
  textPrimary: '#f5f5f5',
  textSecondary: '#d4d4d4',
  textMuted: '#737373',
  navActive: '#ef4444',
  navIndicator: '#ef4444',
  navHover: '#2a1a1a',
  linkDefault: '#ef4444',
  linkHover: '#f87171',
};
