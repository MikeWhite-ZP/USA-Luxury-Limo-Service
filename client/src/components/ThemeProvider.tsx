import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  actualTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Safe localStorage access with fallback
function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Fail silently in restricted contexts
  }
}

// Get initial theme from data attribute (set by inline script) or compute it
function getInitialTheme(): { theme: Theme; actualTheme: 'light' | 'dark' } {
  if (typeof window === 'undefined') {
    return { theme: 'system', actualTheme: 'light' };
  }

  // Read theme set by inline script to avoid hydration mismatch
  const initialThemeAttr = document.documentElement.getAttribute('data-initial-theme') as 'light' | 'dark' | null;
  
  // Get stored theme preference with safe access
  const stored = safeGetItem('theme') as Theme;
  const theme = stored || 'system';

  // Use the pre-computed initial theme if available, otherwise compute it
  let actualTheme: 'light' | 'dark' = initialThemeAttr || 'light';
  
  if (!initialThemeAttr) {
    if (theme === 'system') {
      try {
        actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      } catch {
        actualTheme = 'light';
      }
    } else {
      actualTheme = theme;
    }

    // Apply theme class immediately if not already applied by inline script
    if (actualTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  return { theme, actualTheme };
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const initial = getInitialTheme();
  const [theme, setThemeState] = useState<Theme>(initial.theme);
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>(initial.actualTheme);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    
    const getSystemTheme = (): 'light' | 'dark' => {
      try {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      } catch {
        return 'light';
      }
    };

    const applyTheme = (themeToApply: Theme) => {
      let resolved: 'light' | 'dark';
      
      if (themeToApply === 'system') {
        resolved = getSystemTheme();
      } else {
        resolved = themeToApply;
      }

      setActualTheme(resolved);

      if (resolved === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme(theme);

    let mediaQuery: MediaQueryList | null = null;
    let handleChange: (() => void) | null = null;

    try {
      mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      handleChange = () => {
        if (theme === 'system') {
          applyTheme('system');
        }
      };
      mediaQuery.addEventListener('change', handleChange);
    } catch {
      // matchMedia not available
    }

    return () => {
      if (mediaQuery && handleChange) {
        mediaQuery.removeEventListener('change', handleChange);
      }
    };
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    if (typeof window !== 'undefined') {
      safeSetItem('theme', newTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, actualTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
