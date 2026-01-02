import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Loader2, Car, UserCircle, Radio, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function MobileLogin() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'passenger' | 'driver' | 'dispatcher'>('passenger');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const role = params.get('role') as 'passenger' | 'driver' | 'dispatcher';
    if (role && ['passenger', 'driver', 'dispatcher'].includes(role)) {
      setSelectedRole(role);
    }
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/login', {
        username: data.username,
        password: data.password,
      });

      if (response.ok) {
        const user = await response.json();
        
        if (user.role !== selectedRole) {
          toast({
            title: t('auth.accessDenied'),
            description: t('auth.notRegisteredAs', { role: t(`roles.${selectedRole}`) }),
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }

        queryClient.setQueryData(['/api/user'], user);

        toast({
          title: t('auth.welcomeBack'),
          description: t('auth.loggedInAs', { role: t(`roles.${selectedRole}`) }),
        });

        switch (selectedRole) {
          case 'passenger':
            navigate('/mobile-passenger');
            break;
          case 'driver':
            navigate('/mobile-driver');
            break;
          case 'dispatcher':
            navigate('/mobile-dispatcher');
            break;
        }
      } else {
        const error = await response.json();
        toast({
          title: t('auth.loginFailed'),
          description: error.message || t('auth.invalidCredentials'),
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('auth.errorDuringLogin'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleIcon = () => {
    switch (selectedRole) {
      case 'passenger':
        return <UserCircle className="w-10 h-10" />;
      case 'driver':
        return <Car className="w-10 h-10" />;
      case 'dispatcher':
        return <Radio className="w-10 h-10" />;
    }
  };

  const getRoleTitle = () => {
    return t(`roles.${selectedRole}`);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-3 relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm relative z-10"
      >
        <div className="bg-card border-b border-border rounded-t-xl p-4 text-center shadow-md">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-block mb-2"
            style={{ color: 'var(--brand-accent-hex)' }}
          >
            {getRoleIcon()}
          </motion.div>
          <h1 className="text-xl font-bold capitalize text-foreground">{getRoleTitle()} {t('auth.login')}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{t('auth.enterYourCredentials')}</p>
        </div>

        <div className="bg-card rounded-b-xl p-5 shadow-lg border-x border-b border-border">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="username" className="text-xs text-muted-foreground">{t('auth.username')}</Label>
              <Input
                id="username"
                type="text"
                placeholder={t('auth.username')}
                {...register('username')}
                className="h-10 text-sm bg-background border-border focus:border-[color:var(--brand-accent-hex)] touch-manipulation"
                data-testid="input-mobile-username"
              />
              {errors.username && (
                <p className="text-destructive text-xs">{errors.username.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="password" className="text-xs text-muted-foreground">{t('auth.password')}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('auth.password')}
                  {...register('password')}
                  className="h-10 text-sm pr-10 bg-background border-border focus:border-[color:var(--brand-accent-hex)] touch-manipulation"
                  data-testid="input-mobile-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors touch-manipulation p-1.5"
                  data-testid="button-toggle-password"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-destructive text-xs">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 text-sm font-semibold text-white transition-all shadow-sm hover:shadow-md touch-manipulation"
              style={{ backgroundColor: 'var(--brand-button-primary-hex)' }}
              data-testid="button-mobile-login"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  {t('auth.signingIn')}
                </>
              ) : (
                t('auth.signIn')
              )}
            </Button>
          </form>

          <div className="mt-4 text-center space-y-2">
            <p className="text-muted-foreground text-xs">
              {t('auth.dontHaveAccount')}{' '}
              <button
                onClick={() => navigate(`/mobile-register?role=${selectedRole}`)}
                className="font-semibold transition-colors touch-manipulation"
                style={{ color: 'var(--brand-accent-hex)' }}
                data-testid="button-go-to-register"
              >
                {t('auth.register')}
              </button>
            </p>
            <button
              onClick={() => navigate('/mobile-splash')}
              className="text-muted-foreground hover:text-foreground text-xs font-medium transition-colors touch-manipulation py-1.5 px-3"
              data-testid="button-change-role"
            >
              {t('auth.changeRole')}
            </button>
            <div>
              <button
                onClick={() => navigate('/')}
                className="text-muted-foreground hover:text-foreground text-[10px] transition-colors touch-manipulation py-1 px-2"
                data-testid="button-back-to-website"
              >
                {t('auth.backToWebsite')}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
