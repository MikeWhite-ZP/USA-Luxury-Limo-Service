import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
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
          title: 'Registration Successful!',
          description: `Welcome ${data.firstName}! Your ${selectedRole} account has been created.`,
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
            title: 'Please Sign In',
            description: 'Your account was created. Please sign in to continue.',
          });
        }
      } else {
        const error = await response.json();
        toast({
          title: 'Registration Failed',
          description: error.message || 'Unable to create account. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred during registration',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleIcon = () => {
    switch (selectedRole) {
      case 'passenger':
        return <UserCircle className="w-12 h-12" />;
      case 'driver':
        return <Car className="w-12 h-12" />;
      case 'dispatcher':
        return <Radio className="w-12 h-12" />;
    }
  };

  const getRoleDescription = () => {
    switch (selectedRole) {
      case 'passenger':
        return 'Book luxury rides with ease';
      case 'driver':
        return 'Join our professional driver team';
      case 'dispatcher':
        return 'Manage fleet operations';
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 bg-red-50 rounded-full blur-3xl -top-48 -left-24 animate-pulse" />
        <div className="absolute w-96 h-96 bg-muted rounded-full blur-3xl -bottom-48 -right-24 animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute w-80 h-80 bg-red-50 rounded-full blur-3xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-background border-b border-border rounded-t-2xl p-6 text-center shadow-lg">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-block mb-3 text-red-600"
          >
            {getRoleIcon()}
          </motion.div>
          <h1 className="text-2xl font-bold capitalize text-foreground">{selectedRole} Registration</h1>
          <p className="text-sm text-muted-foreground mt-1">{getRoleDescription()}</p>
        </div>

        <div className="bg-background rounded-b-2xl p-6 shadow-2xl border-x border-b border-border max-h-[70vh] overflow-y-auto">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="firstName" className="text-foreground text-sm">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  {...register('firstName')}
                  className="h-11 text-base bg-background border-border focus:border-red-600 focus:ring-red-600 touch-manipulation"
                  data-testid="input-mobile-firstname"
                />
                {errors.firstName && (
                  <p className="text-red-600 text-xs">{errors.firstName.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="lastName" className="text-foreground text-sm">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  {...register('lastName')}
                  className="h-11 text-base bg-background border-border focus:border-red-600 focus:ring-red-600 touch-manipulation"
                  data-testid="input-mobile-lastname"
                />
                {errors.lastName && (
                  <p className="text-red-600 text-xs">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-foreground text-sm">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Choose a username"
                {...register('username')}
                className="h-11 text-base bg-background border-border focus:border-red-600 focus:ring-red-600 touch-manipulation"
                data-testid="input-mobile-register-username"
              />
              {errors.username && (
                <p className="text-red-600 text-xs">{errors.username.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-foreground text-sm">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                {...register('email')}
                className="h-11 text-base bg-background border-border focus:border-red-600 focus:ring-red-600 touch-manipulation"
                data-testid="input-mobile-register-email"
              />
              {errors.email && (
                <p className="text-red-600 text-xs">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-foreground text-sm">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password"
                  {...register('password')}
                  className="h-11 text-base pr-12 bg-background border-border focus:border-red-600 focus:ring-red-600 touch-manipulation"
                  data-testid="input-mobile-register-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors touch-manipulation p-2"
                  data-testid="button-toggle-password"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-600 text-xs">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-foreground text-sm">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  {...register('confirmPassword')}
                  className="h-11 text-base pr-12 bg-background border-border focus:border-red-600 focus:ring-red-600 touch-manipulation"
                  data-testid="input-mobile-register-confirm-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors touch-manipulation p-2"
                  data-testid="button-toggle-confirm-password"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-600 text-xs">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 text-lg font-semibold bg-red-600 hover:bg-red-700 text-white transition-all shadow-md hover:shadow-lg touch-manipulation mt-2"
              data-testid="button-mobile-register"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5 mr-2" />
                  Create Account
                </>
              )}
            </Button>
          </form>

          <div className="mt-5 text-center space-y-3">
            <p className="text-muted-foreground text-sm">
              Already have an account?{' '}
              <button
                onClick={() => navigate(`/mobile-login?role=${selectedRole}`)}
                className="text-red-600 hover:text-red-700 font-semibold transition-colors touch-manipulation"
                data-testid="button-go-to-login"
              >
                Sign In
              </button>
            </p>
            <button
              onClick={() => navigate('/mobile-splash')}
              className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors touch-manipulation py-2 px-4"
              data-testid="button-change-role"
            >
              ← Change role
            </button>
            <div>
              <button
                onClick={() => navigate('/')}
                className="text-muted-foreground hover:text-foreground text-xs transition-colors touch-manipulation py-2 px-4"
                data-testid="button-back-to-website"
              >
                Back to website
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
