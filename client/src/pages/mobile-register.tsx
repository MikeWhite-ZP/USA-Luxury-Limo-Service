import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Loader2, Car, UserCircle, Radio, Eye, EyeOff, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function MobileRegister() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/register', {
        username: data.username,
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        role: selectedRole,
      });

      if (response.ok) {
        toast({
          title: t('auth.registerSuccess'),
          description: t('auth.welcomeUser', { name: data.firstName }),
        });

        await queryClient.invalidateQueries({ queryKey: ['/api/user'] });
        
        const authenticatedUser = await queryClient.fetchQuery<{ id: string; role: string } | null>({
          queryKey: ['/api/user'],
          staleTime: 0,
        });

        if (authenticatedUser && authenticatedUser.id) {
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
          navigate(`/mobile-login?role=${selectedRole}`);
          toast({
            title: t('auth.pleaseSignIn'),
            description: t('auth.accountCreatedSignIn'),
          });
        }
      } else {
        const error = await response.json();
        toast({
          title: t('auth.registerFailed'),
          description: error.message || t('auth.unableToCreateAccount'),
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('auth.errorDuringRegistration'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleIcon = () => {
    switch (selectedRole) {
      case 'passenger':
        return <UserCircle className="w-8 h-8" />;
      case 'driver':
        return <Car className="w-8 h-8" />;
      case 'dispatcher':
        return <Radio className="w-8 h-8" />;
    }
  };

  const getRoleDescription = () => {
    return t(`roles.${selectedRole}MobileDescription`);
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
        <div className="bg-card border-b border-border rounded-t-xl p-3 text-center shadow-md">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-block mb-1.5"
            style={{ color: 'var(--brand-accent-hex)' }}
          >
            {getRoleIcon()}
          </motion.div>
          <h1 className="text-lg font-bold capitalize text-foreground">{t('roles.registration', { role: getRoleTitle() })}</h1>
          <p className="text-xs text-muted-foreground">{getRoleDescription()}</p>
        </div>

        <div className="bg-card rounded-b-xl p-4 shadow-lg border-x border-b border-border max-h-[65vh] overflow-y-auto">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="firstName" className="text-xs text-muted-foreground">{t('auth.firstName')}</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  {...register('firstName')}
                  className="h-9 text-sm bg-background border-border touch-manipulation"
                  data-testid="input-mobile-firstname"
                />
                {errors.firstName && (
                  <p className="text-destructive text-[10px]">{errors.firstName.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="lastName" className="text-xs text-muted-foreground">{t('auth.lastName')}</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  {...register('lastName')}
                  className="h-9 text-sm bg-background border-border touch-manipulation"
                  data-testid="input-mobile-lastname"
                />
                {errors.lastName && (
                  <p className="text-destructive text-[10px]">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="username" className="text-xs text-muted-foreground">{t('auth.username')}</Label>
              <Input
                id="username"
                type="text"
                placeholder={t('auth.username')}
                {...register('username')}
                className="h-9 text-sm bg-background border-border touch-manipulation"
                data-testid="input-mobile-register-username"
              />
              {errors.username && (
                <p className="text-destructive text-[10px]">{errors.username.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="email" className="text-xs text-muted-foreground">{t('auth.email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                {...register('email')}
                className="h-9 text-sm bg-background border-border touch-manipulation"
                data-testid="input-mobile-register-email"
              />
              {errors.email && (
                <p className="text-destructive text-[10px]">{errors.email.message}</p>
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
                  className="h-9 text-sm pr-9 bg-background border-border touch-manipulation"
                  data-testid="input-mobile-register-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors touch-manipulation p-1"
                  data-testid="button-toggle-password"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-destructive text-[10px]">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="confirmPassword" className="text-xs text-muted-foreground">{t('auth.confirmPassword')}</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder={t('auth.confirmPassword')}
                  {...register('confirmPassword')}
                  className="h-9 text-sm pr-9 bg-background border-border touch-manipulation"
                  data-testid="input-mobile-register-confirm-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors touch-manipulation p-1"
                  data-testid="button-toggle-confirm-password"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-destructive text-[10px]">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-9 text-sm font-semibold text-white transition-all shadow-sm hover:shadow-md touch-manipulation mt-2"
              style={{ backgroundColor: 'var(--brand-button-primary-hex)' }}
              data-testid="button-mobile-register"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  {t('auth.signingUp')}
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-1.5" />
                  {t('auth.createAccount')}
                </>
              )}
            </Button>
          </form>

          <div className="mt-3 text-center space-y-1.5">
            <p className="text-muted-foreground text-xs">
              {t('auth.alreadyHaveAccount')}{' '}
              <button
                onClick={() => navigate(`/mobile-login?role=${selectedRole}`)}
                className="font-semibold transition-colors touch-manipulation"
                style={{ color: 'var(--brand-accent-hex)' }}
                data-testid="button-go-to-login"
              >
                {t('auth.signIn')}
              </button>
            </p>
            <button
              onClick={() => navigate('/mobile-splash')}
              className="text-muted-foreground hover:text-foreground text-xs font-medium transition-colors touch-manipulation py-1 px-2"
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
