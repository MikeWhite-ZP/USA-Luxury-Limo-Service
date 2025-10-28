
import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Lock, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Extract token from URL
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    
    if (!tokenParam) {
      setErrorMessage('Invalid reset link. Please request a new password reset.');
      setIsVerifying(false);
      return;
    }

    setToken(tokenParam);
    verifyToken(tokenParam);
  }, []);

  const verifyToken = async (tokenValue: string) => {
    try {
      const response = await fetch(`/api/auth/verify-reset-token/${tokenValue}`);
      const data = await response.json();

      if (response.ok && data.valid) {
        setIsValidToken(true);
      } else {
        setErrorMessage(data.message || 'Invalid or expired reset link');
      }
    } catch (error) {
      setErrorMessage('Failed to verify reset link. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!/[A-Z]/.test(pwd)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(pwd)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(pwd)) {
      return 'Password must contain at least one number';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please make sure both passwords are identical",
        variant: "destructive",
      });
      return;
    }

    const validationError = validatePassword(password);
    if (validationError) {
      toast({
        title: "Invalid Password",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setResetSuccess(true);
        toast({
          title: "Password Reset Successful",
          description: "You can now log in with your new password",
        });
        // Redirect to login after 3 seconds
        setTimeout(() => {
          setLocation('/login');
        }, 3000);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to reset password",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reset password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <div className={`inline-flex items-center justify-center p-4 bg-gradient-to-br ${
                  resetSuccess ? 'from-green-500 to-green-600' : 
                  errorMessage ? 'from-red-500 to-red-600' : 
                  'from-blue-500 to-blue-600'
                } text-white rounded-2xl mb-4 mx-auto`}>
                  {resetSuccess ? <CheckCircle className="w-8 h-8" /> : 
                   errorMessage ? <AlertCircle className="w-8 h-8" /> : 
                   <Lock className="w-8 h-8" />}
                </div>
                <CardTitle className="text-2xl">
                  {resetSuccess ? 'Password Reset!' : 
                   errorMessage ? 'Invalid Link' : 
                   'Reset Your Password'}
                </CardTitle>
                <CardDescription>
                  {resetSuccess ? 'Your password has been successfully updated' : 
                   errorMessage ? errorMessage : 
                   isVerifying ? 'Verifying reset link...' :
                   'Create a new password for your account'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isVerifying ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : errorMessage ? (
                  <div className="text-center space-y-4">
                    <p className="text-sm text-muted-foreground">
                      This reset link is invalid or has expired. Please request a new one.
                    </p>
                    <Link href="/forgot-password">
                      <Button className="w-full">
                        Request New Reset Link
                      </Button>
                    </Link>
                  </div>
                ) : resetSuccess ? (
                  <div className="text-center space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Redirecting to login page...
                    </p>
                    <Link href="/login">
                      <Button className="w-full">
                        Go to Login
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">New Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter new password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoFocus
                      />
                      <p className="text-xs text-muted-foreground">
                        Must be at least 8 characters with uppercase, lowercase, and numbers
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Re-enter new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Resetting...' : 'Reset Password'}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
