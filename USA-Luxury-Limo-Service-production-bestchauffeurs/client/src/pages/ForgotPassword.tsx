import { useState } from 'react';
import { Link, useLocation } from 'wouter';
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
        title: 'Request Submitted',
        description: 'If an account exists, a password reset link has been sent.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to process request. Please try again.',
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
        title: 'Request Submitted',
        description: 'If an account exists, your username has been sent.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to process request. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!emailOrPhone.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter your email or phone number.',
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
            <CardTitle className="text-2xl font-bold">Account Recovery</CardTitle>
          </div>
          <CardDescription>
            {!isSubmitted ? 'Recover your password or username' : 'Check your email or phone'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-6" data-testid="form-forgot-password">
              <div className="space-y-3">
                <Label>What do you need help with?</Label>
                <RadioGroup
                  value={requestType}
                  onValueChange={(value) => setRequestType(value as RequestType)}
                  className="flex flex-col space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="password" id="password" data-testid="radio-password" />
                    <Label htmlFor="password" className="flex items-center gap-2 cursor-pointer font-normal">
                      <KeyRound className="h-4 w-4" />
                      I forgot my password
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="username" id="username" data-testid="radio-username" />
                    <Label htmlFor="username" className="flex items-center gap-2 cursor-pointer font-normal">
                      <User className="h-4 w-4" />
                      I forgot my username
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="emailOrPhone">Email or Phone Number</Label>
                <div className="relative">
                  <Input
                    id="emailOrPhone"
                    type="text"
                    placeholder="Enter your email or phone"
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
                  Enter the email or phone number associated with your account
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isPending}
                data-testid="button-submit"
              >
                {isPending ? 'Sending...' : requestType === 'password' ? 'Send Reset Link' : 'Send Username'}
              </Button>

              <div className="text-center">
                <Link href="/login">
                  <a className="text-sm text-red-600 hover:text-red-700 hover:underline" data-testid="link-login">
                    Back to Login
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
                <h3 className="font-semibold text-lg">Request Submitted</h3>
                <p className="text-sm text-gray-600">
                  {requestType === 'password'
                    ? 'If an account exists with that email or phone, you will receive a password reset link shortly.'
                    : 'If an account exists with that email or phone, you will receive your username shortly.'}
                </p>
                <p className="text-xs text-gray-500 mt-4">
                  Didn't receive anything? Check your spam folder or try again.
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
                  Try Again
                </Button>
                <Link href="/login">
                  <Button variant="ghost" className="w-full" data-testid="button-back-to-login">
                    Back to Login
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
