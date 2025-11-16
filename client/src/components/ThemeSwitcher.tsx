import { useState, useEffect } from 'react';
import { useTheme } from './ThemeProvider';
import { Sun, Moon, Smartphone } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Skeleton } from './ui/skeleton';

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const options = [
    { value: 'light' as const, label: 'Light', icon: Sun, description: 'Always use light theme' },
    { value: 'dark' as const, label: 'Dark', icon: Moon, description: 'Always use dark theme' },
    { value: 'system' as const, label: 'System', icon: Smartphone, description: 'Match phone settings' },
  ];

  if (!mounted) {
    return (
      <Card className="shadow-sm border-2 border-border bg-card">
        <CardHeader className="bg-muted/30 border-b border-border p-4">
          <CardTitle className="text-base flex items-center gap-2 text-foreground">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Sun className="w-4 h-4 text-primary" />
            </div>
            Theme
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground mt-1">
            Choose your preferred color scheme
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border-2 border-border bg-card">
      <CardHeader className="bg-muted/30 border-b border-border p-4">
        <CardTitle className="text-base flex items-center gap-2 text-foreground">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Sun className="w-4 h-4 text-primary" />
          </div>
          Theme
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground mt-1">
          Choose your preferred color scheme
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-2">
          {options.map((option) => {
            const Icon = option.icon;
            const isActive = theme === option.value;
            
            return (
              <button
                key={option.value}
                onClick={() => setTheme(option.value)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all touch-manipulation ${
                  isActive
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border bg-card hover:border-primary/50 hover:bg-accent'
                }`}
                data-testid={`theme-option-${option.value}`}
              >
                <div className={`p-3 rounded-lg ${isActive ? 'bg-primary/10' : 'bg-muted'}`}>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div className="flex-1 text-left">
                  <div className={`font-semibold text-sm ${isActive ? 'text-primary' : 'text-foreground'}`}>
                    {option.label}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {option.description}
                  </div>
                </div>
                {isActive && (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
