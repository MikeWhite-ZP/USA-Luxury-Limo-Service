import { useState } from 'react';
import { Link, useLocation, useSearch } from 'wouter';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, CheckCircle, XCircle, Loader2, KeyRound } from 'lucide-react';

export function ResetPassword() {
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(useSearch());
  const token = searchParams.get('token');
  const { toast } = useToast();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isResetSuccess, setIsResetSuccess] = useState(false);

  // Verify token on mount
  const { data: tokenVerification, isLoading: isVerifying } = useQuery({
    queryKey: ['/api/auth/verify-reset-token', token],
    queryFn: async () => {
      if (!token) throw new Error('No token provided');
      const res = await fetch(`/api/auth/verify-reset-token/${token}`);
      if (!res.ok) throw new Error('Failed to verify token');
      return res.json();
    },
    enabled: !!token,
    retry: false,
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: { token: string; newPassword: string }) => {
      const res = await apiRequest('POST', '/api/auth/reset-password', data);
      return res.json();
    },
    onSuccess: () => {
      setIsResetSuccess(true);
      toast({
        title: 'Success',
        description: 'Password reset successfully. You can now log in with your new password.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reset password. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast({
        title: 'Error',
        description: 'Invalid reset link',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Validation Error',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Validation Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    await resetPasswordMutation.mutateAsync({ token, newPassword });
  };

  // No token provided
  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Invalid Reset Link</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <XCircle className="h-16 w-16 mx-auto text-red-500" />
            <p className="text-gray-600">This password reset link is invalid.</p>
            <Link href="/forgot-password">
              <Button className="w-full" data-testid="button-request-new">Request New Reset Link</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Verifying token
  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <Loader2 className="h-12 w-12 mx-auto animate-spin text-red-600" />
            <p className="mt-4 text-gray-600">Verifying reset link...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Token expired or invalid
  if (!tokenVerification?.valid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Reset Link Expired</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <XCircle className="h-16 w-16 mx-auto text-orange-500" />
            <div className="space-y-2">
              <p className="text-gray-600">{tokenVerification?.message || 'This password reset link has expired or is invalid.'}</p>
              <p className="text-sm text-gray-500">Reset links expire after 1 hour for security.</p>
            </div>
            <Link href="/forgot-password">
              <Button className="w-full" data-testid="button-request-new">Request New Reset Link</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (isResetSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Password Reset Complete</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4" data-testid="success-message">
            <CheckCircle className="h-16 w-16 mx-auto text-green-500" />
            <div className="space-y-2">
              <p className="text-gray-600">Your password has been successfully reset.</p>
              <p className="text-sm text-gray-500">You can now log in with your new password.</p>
            </div>
            <Link href="/login">
              <Button className="w-full" data-testid="button-go-to-login">Go to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Reset password form
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <Link href="/login">
              <a className="text-gray-600 hover:text-gray-900" data-testid="link-back-to-login">
                <ArrowLeft className="h-5 w-5" />
              </a>
            </Link>
            <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
          </div>
          <CardDescription>Enter your new password below</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" data-testid="form-reset-password">
            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-10"
                  data-testid="input-new-password"
                  required
                  minLength={6}
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <KeyRound className="h-4 w-4" />
                </div>
              </div>
              <p className="text-xs text-gray-500">Minimum 6 characters</p>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10"
                  data-testid="input-confirm-password"
                  required
                  minLength={6}
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <KeyRound className="h-4 w-4" />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={resetPasswordMutation.isPending}
              data-testid="button-reset-password"
            >
              {resetPasswordMutation.isPending ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
