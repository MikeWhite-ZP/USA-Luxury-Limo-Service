/**
 * Device detection utilities for routing mobile vs desktop users
 */

const MOBILE_PREFERENCE_KEY = 'usa-limo-device-preference';

/**
 * Checks if the current device is a mobile device based on:
 * 1. User agent string
 * 2. Screen width
 * 3. Touch capability
 */
export function isMobileDevice(): boolean {
  // Check for manual preference override first
  const preference = getDevicePreference();
  if (preference) {
    return preference === 'mobile';
  }

  // Check user agent for mobile devices
  const userAgent = navigator.userAgent.toLowerCase();
  const mobileKeywords = [
    'android',
    'webos',
    'iphone',
    'ipad',
    'ipod',
    'blackberry',
    'windows phone',
    'mobile',
    'tablet'
  ];
  
  const isMobileUA = mobileKeywords.some(keyword => userAgent.includes(keyword));

  // Check screen width (mobile typically < 768px)
  const isMobileWidth = window.innerWidth < 768;

  // Check for touch capability
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // Device is considered mobile if user agent indicates mobile OR (small screen AND touch)
  return isMobileUA || (isMobileWidth && hasTouch);
}

/**
 * Checks if the current device is a desktop/laptop
 */
export function isDesktopDevice(): boolean {
  return !isMobileDevice();
}

/**
 * Get the manually set device preference from localStorage
 */
export function getDevicePreference(): 'mobile' | 'desktop' | null {
  try {
    const preference = localStorage.getItem(MOBILE_PREFERENCE_KEY);
    if (preference === 'mobile' || preference === 'desktop') {
      return preference;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Set a manual device preference override
 */
export function setDevicePreference(preference: 'mobile' | 'desktop' | null): void {
  try {
    if (preference === null) {
      localStorage.removeItem(MOBILE_PREFERENCE_KEY);
    } else {
      localStorage.setItem(MOBILE_PREFERENCE_KEY, preference);
    }
  } catch (error) {
    console.error('Failed to set device preference:', error);
  }
}

/**
 * Clear the manual device preference
 */
export function clearDevicePreference(): void {
  setDevicePreference(null);
}
