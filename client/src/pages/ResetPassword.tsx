import { useState } from 'react';
import { Link, useLocation, useSearch } from 'wouter';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, CheckCircle, XCircle, Loader2, KeyRound } from 'lucide-react';

export function ResetPassword() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(useSearch());
  const token = searchParams.get('token');
  const { toast } = useToast();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isResetSuccess, setIsResetSuccess] = useState(false);

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
        title: t('common.success'),
        description: t('auth.passwordResetSuccessLogin'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message || t('auth.failedResetPassword'),
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast({
        title: t('common.error'),
        description: t('auth.resetLinkInvalid'),
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: t('common.error'),
        description: t('auth.passwordMinChars'),
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: t('common.error'),
        description: t('auth.passwordMismatch'),
        variant: 'destructive',
      });
      return;
    }

    await resetPasswordMutation.mutateAsync({ token, newPassword });
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">{t('auth.invalidResetLink')}</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <XCircle className="h-16 w-16 mx-auto text-red-500" />
            <p className="text-gray-600">{t('auth.resetLinkInvalid')}</p>
            <Link href="/forgot-password">
              <Button className="w-full" data-testid="button-request-new">{t('auth.requestNewResetLink')}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <Loader2 className="h-12 w-12 mx-auto animate-spin text-red-600" />
            <p className="mt-4 text-gray-600">{t('auth.verifyingResetLink')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!tokenVerification?.valid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">{t('auth.resetLinkExpired')}</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <XCircle className="h-16 w-16 mx-auto text-orange-500" />
            <div className="space-y-2">
              <p className="text-gray-600">{tokenVerification?.message || t('auth.resetLinkExpiredMessage')}</p>
              <p className="text-sm text-gray-500">{t('auth.resetLinksExpireInfo')}</p>
            </div>
            <Link href="/forgot-password">
              <Button className="w-full" data-testid="button-request-new">{t('auth.requestNewResetLink')}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isResetSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">{t('auth.passwordResetComplete')}</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4" data-testid="success-message">
            <CheckCircle className="h-16 w-16 mx-auto text-green-500" />
            <div className="space-y-2">
              <p className="text-gray-600">{t('auth.passwordResetSuccess')}</p>
              <p className="text-sm text-gray-500">{t('auth.canNowLogin')}</p>
            </div>
            <Link href="/login">
              <Button className="w-full" data-testid="button-go-to-login">{t('auth.goToLogin')}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            <CardTitle className="text-2xl font-bold">{t('auth.resetPassword')}</CardTitle>
          </div>
          <CardDescription>{t('auth.enterNewPasswordBelow')}</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" data-testid="form-reset-password">
            <div className="space-y-2">
              <Label htmlFor="newPassword">{t('auth.newPassword')}</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type="password"
                  placeholder={t('auth.enterNewPassword')}
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
              <p className="text-xs text-gray-500">{t('auth.minPasswordLength')}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder={t('auth.confirmNewPassword')}
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

            <Button
              type="submit"
              className="w-full"
              disabled={resetPasswordMutation.isPending}
              data-testid="button-reset-password"
            >
              {resetPasswordMutation.isPending ? t('auth.resetting') : t('auth.resetPassword')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
