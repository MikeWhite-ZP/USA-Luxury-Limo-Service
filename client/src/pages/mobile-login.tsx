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
    // Get role from URL parameter
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
        
        // Verify user role matches selected role
        if (user.role !== selectedRole) {
          toast({
            title: 'Access Denied',
            description: `This account is not registered as a ${selectedRole}. Please select the correct role.`,
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }

        // Update the auth cache with the logged-in user
        queryClient.setQueryData(['/api/user'], user);

        toast({
          title: 'Welcome!',
          description: `Logged in successfully as ${selectedRole}`,
        });

        // Navigate to role-specific mobile app
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

  const getRoleColor = () => {
    switch (selectedRole) {
      case 'passenger':
        return 'from-blue-600 to-blue-700';
      case 'driver':
        return 'from-green-600 to-green-700';
      case 'dispatcher':
        return 'from-purple-600 to-purple-700';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Role Header */}
        <div className={`bg-gradient-to-r ${getRoleColor()} rounded-t-2xl p-6 text-white text-center`}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-block mb-3"
          >
            {getRoleIcon()}
          </motion.div>
          <h1 className="text-2xl font-bold capitalize">{selectedRole} Login</h1>
          <p className="text-sm opacity-90 mt-1">Enter your credentials to continue</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-b-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-700">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                {...register('username')}
                className="h-12 text-base"
                data-testid="input-mobile-username"
              />
              {errors.username && (
                <p className="text-red-500 text-sm">{errors.username.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  {...register('password')}
                  className="h-12 text-base pr-12"
                  data-testid="input-mobile-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  data-testid="button-toggle-password"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className={`w-full h-12 text-lg font-semibold bg-gradient-to-r ${getRoleColor()} hover:opacity-90 transition-opacity`}
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
              className="text-gray-600 hover:text-gray-800 text-sm font-medium"
              data-testid="button-change-role"
            >
              ← Change role
            </button>
            <div>
              <button
                onClick={() => navigate('/')}
                className="text-gray-500 hover:text-gray-700 text-xs"
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
