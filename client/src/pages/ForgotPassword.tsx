import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Mail, Phone, KeyRound, User } from 'lucide-react';

type RequestType = 'password' | 'username';

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [requestType, setRequestType] = useState<RequestType>('password');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: { emailOrPhone: string }) => {
      const res = await apiRequest('POST', '/api/auth/forgot-password', data);
      return res.json();
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: t('auth.requestSubmitted'),
        description: t('auth.passwordResetSent'),
      });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('auth.failedProcessRequest'),
        variant: 'destructive',
      });
    },
  });

  const forgotUsernameMutation = useMutation({
    mutationFn: async (data: { emailOrPhone: string }) => {
      const res = await apiRequest('POST', '/api/auth/forgot-username', data);
      return res.json();
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: t('auth.requestSubmitted'),
        description: t('auth.usernameSent'),
      });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('auth.failedProcessRequest'),
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!emailOrPhone.trim()) {
      toast({
        title: t('common.error'),
        description: t('auth.enterEmailPhoneValidation'),
        variant: 'destructive',
      });
      return;
    }

    if (requestType === 'password') {
      await forgotPasswordMutation.mutateAsync({ emailOrPhone });
    } else {
      await forgotUsernameMutation.mutateAsync({ emailOrPhone });
    }
  };

  const isPending = forgotPasswordMutation.isPending || forgotUsernameMutation.isPending;

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
            <CardTitle className="text-2xl font-bold">{t('auth.accountRecovery')}</CardTitle>
          </div>
          <CardDescription>
            {!isSubmitted ? t('auth.recoverPasswordOrUsername') : t('auth.checkEmailOrPhone')}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-6" data-testid="form-forgot-password">
              <div className="space-y-3">
                <Label>{t('auth.whatNeedHelp')}</Label>
                <RadioGroup
                  value={requestType}
                  onValueChange={(value) => setRequestType(value as RequestType)}
                  className="flex flex-col space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="password" id="password" data-testid="radio-password" />
                    <Label htmlFor="password" className="flex items-center gap-2 cursor-pointer font-normal">
                      <KeyRound className="h-4 w-4" />
                      {t('auth.forgotMyPassword')}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="username" id="username" data-testid="radio-username" />
                    <Label htmlFor="username" className="flex items-center gap-2 cursor-pointer font-normal">
                      <User className="h-4 w-4" />
                      {t('auth.forgotMyUsername')}
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="emailOrPhone">{t('auth.emailOrPhone')}</Label>
                <div className="relative">
                  <Input
                    id="emailOrPhone"
                    type="text"
                    placeholder={t('auth.enterEmailOrPhone')}
                    value={emailOrPhone}
                    onChange={(e) => setEmailOrPhone(e.target.value)}
                    className="pl-10"
                    data-testid="input-email-or-phone"
                    required
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {emailOrPhone.includes('@') ? <Mail className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  {t('auth.emailPhoneDescription')}
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isPending}
                data-testid="button-submit"
              >
                {isPending ? t('auth.sending') : requestType === 'password' ? t('auth.sendResetLink') : t('auth.sendUsername')}
              </Button>

              <div className="text-center">
                <Link href="/login">
                  <a className="text-sm text-red-600 hover:text-red-700 hover:underline" data-testid="link-login">
                    {t('auth.backToLogin')}
                  </a>
                </Link>
              </div>
            </form>
          ) : (
            <div className="space-y-4 text-center" data-testid="success-message">
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <Mail className="h-8 w-8 text-green-600" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">{t('auth.requestSubmitted')}</h3>
                <p className="text-sm text-gray-600">
                  {requestType === 'password'
                    ? t('auth.passwordResetInfo')
                    : t('auth.usernameInfo')}
                </p>
                <p className="text-xs text-gray-500 mt-4">
                  {t('auth.didntReceive')}
                </p>
              </div>

              <div className="flex flex-col gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsSubmitted(false);
                    setEmailOrPhone('');
                  }}
                  data-testid="button-try-again"
                >
                  {t('auth.tryAgain')}
                </Button>
                <Link href="/login">
                  <Button variant="ghost" className="w-full" data-testid="button-back-to-login">
                    {t('auth.backToLogin')}
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
