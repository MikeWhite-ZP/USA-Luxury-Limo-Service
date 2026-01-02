import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Loader2, Shield, Eye, EyeOff, Lock, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useBranding } from '@/hooks/useBranding';
import { LanguageSwitcherCompact } from '@/components/LanguageSwitcher';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function MobileAdminLogin() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { logoUrl, companyName } = useBranding();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/user', { credentials: 'include' });
        if (response.ok) {
          const user = await response.json();
          if (user.role === 'admin') {
            navigate('/mobile-admin');
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
      }
    };
    checkAuth();
  }, [navigate]);

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
        
        if (user.role !== 'admin') {
          toast({
            title: t('auth.accessDenied'),
            description: t('auth.notRegisteredAs', { role: t('roles.admin') }),
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }

        queryClient.setQueryData(['/api/user'], user);

        toast({
          title: t('auth.welcomeBack'),
          description: t('auth.loggedInAs', { role: t('roles.admin') }),
        });

        navigate('/mobile-admin');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -top-48 -left-24 animate-pulse" />
        <div className="absolute w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl -bottom-48 -right-24 animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm relative z-10"
      >
        <div className="text-center mb-8">
          {logoUrl ? (
            <img 
              src={logoUrl} 
              alt={companyName || 'Admin'} 
              className="h-16 w-auto mx-auto mb-4 brightness-0 invert"
            />
          ) : (
            <div className="inline-flex items-center justify-center p-4 bg-blue-600/30 rounded-2xl mb-4 backdrop-blur-sm border border-blue-500/30">
              <Shield className="w-10 h-10 text-blue-300" />
            </div>
          )}
          <h1 className="text-2xl font-bold text-white mb-2">
            {t('auth.portalTitle', { role: t('roles.admin') })}
          </h1>
          <p className="text-blue-200 text-sm">
            {t('auth.accessAccount')}
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-2xl"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium text-blue-100">
                {t('auth.username')}
              </Label>
              <div className="relative">
                <Input
                  id="username"
                  type="text"
                  placeholder={t('auth.username')}
                  {...register('username')}
                  className="bg-white/10 border-white/20 text-white placeholder:text-blue-200/50 focus:border-blue-400 focus:ring-blue-400 h-12 rounded-xl"
                  autoComplete="username"
                />
              </div>
              {errors.username && (
                <p className="text-red-300 text-xs">{errors.username.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-blue-100">
                {t('auth.password')}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('auth.password')}
                  {...register('password')}
                  className="bg-white/10 border-white/20 text-white placeholder:text-blue-200/50 focus:border-blue-400 focus:ring-blue-400 h-12 rounded-xl pr-12"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-200 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-300 text-xs">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {t('auth.signingIn')}
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5 mr-2" />
                  {t('auth.signIn')}
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="flex items-center justify-center gap-4 text-xs text-blue-200">
              <div className="flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5" />
                <span>{t('admin.systemSettings')}</span>
              </div>
              <div className="w-1 h-1 bg-blue-400 rounded-full" />
              <LanguageSwitcherCompact />
            </div>
          </div>
        </motion.div>

        <p className="text-center text-blue-300/60 text-xs mt-6">
          {t('roles.admin')} - {t('admin.dashboard')}
        </p>
      </motion.div>
    </div>
  );
}
