import { useState, useEffect } from 'react';
import { useTheme } from './ThemeProvider';
import { Sun, Moon, Smartphone, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Skeleton } from './ui/skeleton';

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const options = [
    { value: 'light' as const, label: 'Light', icon: Sun },
    { value: 'dark' as const, label: 'Dark', icon: Moon },
    { value: 'system' as const, label: 'System', icon: Smartphone },
  ];

  if (!mounted) {
    return (
      <Card className="shadow-sm border-2 border-border bg-card">
        <CardHeader className="bg-primary/5/50 border-b border-border p-2.5">
          <CardTitle className="text-xs flex items-center gap-2 text-foreground">
            <div className="bg-primary/10 p-1 rounded-md">
              <Sun className="w-3 h-3 text-primary" />
            </div>
            Theme
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 flex-1 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border-2 border-border bg-card">
      <CardHeader className="bg-primary/5/50 border-b border-border p-2.5">
        <CardTitle className="text-xs flex items-center gap-2 text-foreground">
          <div className="bg-primary/10 p-1 rounded-md">
            <Sun className="w-3 h-3 text-primary" />
          </div>
          Theme
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <div className="flex gap-2">
          {options.map((option) => {
            const Icon = option.icon;
            const isActive = theme === option.value;
            
            return (
              <button
                key={option.value}
                onClick={() => setTheme(option.value)}
                className={`flex-1 flex flex-col items-center gap-1 py-2 px-3 rounded-lg border transition-all touch-manipulation ${
                  isActive
                    ? 'border-primary bg-primary/10 shadow-sm'
                    : 'border-border bg-card hover:border-primary/50 hover:bg-accent'
                }`}
                data-testid={`theme-option-${option.value}`}
              >
                <div className="relative">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                  {isActive && (
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-1.5 h-1.5 text-primary-foreground" />
                    </div>
                  )}
                </div>
                <span className={`text-[10px] font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
