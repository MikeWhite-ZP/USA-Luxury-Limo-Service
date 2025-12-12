import { useTheme } from './ThemeProvider';
import { Sun, Moon } from 'lucide-react';
import { Button } from './ui/button';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'default' | 'lg' | 'icon';
  variant?: 'ghost' | 'outline' | 'default';
}

export function ThemeToggle({ className = '', size = 'icon', variant = 'ghost' }: ThemeToggleProps) {
  const { actualTheme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(actualTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleTheme}
      className={`relative transition-all duration-200 ${className}`}
      aria-label={`Switch to ${actualTheme === 'dark' ? 'light' : 'dark'} mode`}
      data-testid="theme-toggle"
    >
      <Sun className={`h-4 w-4 transition-all ${actualTheme === 'dark' ? 'rotate-0 scale-100' : 'rotate-90 scale-0'}`} />
      <Moon className={`absolute h-4 w-4 transition-all ${actualTheme === 'dark' ? 'rotate-90 scale-0' : 'rotate-0 scale-100'}`} />
    </Button>
  );
}

export function ThemeToggleMobile({ className = '' }: { className?: string }) {
  const { actualTheme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(actualTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <button
      onClick={toggleTheme}
      className={`p-2.5 rounded-full bg-muted hover:bg-muted/80 transition-colors ${className}`}
      aria-label={`Switch to ${actualTheme === 'dark' ? 'light' : 'dark'} mode`}
      data-testid="theme-toggle-mobile"
    >
      {actualTheme === 'dark' ? (
        <Sun className="h-5 w-5 text-yellow-500" />
      ) : (
        <Moon className="h-5 w-5 text-slate-600" />
      )}
    </button>
  );
}
