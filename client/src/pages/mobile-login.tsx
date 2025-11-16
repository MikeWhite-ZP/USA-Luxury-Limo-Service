import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
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
            title: 'Access Denied',
            description: `This account is not registered as a ${selectedRole}. Please select the correct role.`,
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }

        queryClient.setQueryData(['/api/user'], user);

        toast({
          title: 'Welcome!',
          description: `Logged in successfully as ${selectedRole}`,
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
          title: 'Login Failed',
          description: error.message || 'Invalid credentials',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred during login',
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10 dark:from-background dark:via-background dark:to-primary/5 flex items-center justify-center p-4 transition-colors duration-300">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Role Header */}
        <div className="bg-gradient-to-r from-primary to-primary/90 dark:from-primary dark:to-primary/80 rounded-t-2xl p-6 text-primary-foreground text-center shadow-lg">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-block mb-3"
          >
            {getRoleIcon()}
          </motion.div>
          <h1 className="text-2xl font-bold capitalize">{selectedRole} Login</h1>
          <p className="text-sm opacity-95 mt-1">Enter your credentials to continue</p>
        </div>

        {/* Login Form */}
        <div className="bg-card dark:bg-card rounded-b-2xl p-8 shadow-2xl border-x border-b border-border">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-foreground">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                {...register('username')}
                className="h-12 text-base bg-background dark:bg-background border-input focus:border-primary touch-manipulation"
                data-testid="input-mobile-username"
              />
              {errors.username && (
                <p className="text-destructive text-sm">{errors.username.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  {...register('password')}
                  className="h-12 text-base pr-12 bg-background dark:bg-background border-input focus:border-primary touch-manipulation"
                  data-testid="input-mobile-password"
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
                <p className="text-destructive text-sm">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 text-lg font-semibold bg-primary hover:bg-primary/90 dark:hover:bg-primary/80 transition-all shadow-md hover:shadow-lg touch-manipulation"
              data-testid="button-mobile-login"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-3">
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
