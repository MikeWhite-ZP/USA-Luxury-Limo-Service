
import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ForgotPassword() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitted(true);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to send reset email",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send reset email. Please try again.",
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
            <Link href="/login">
              <Button variant="ghost" className="mb-6">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </Link>

            <Card>
              <CardHeader className="text-center">
                <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl mb-4 mx-auto">
                  <Mail className="w-8 h-8" />
                </div>
                <CardTitle className="text-2xl">Forgot Password?</CardTitle>
                <CardDescription>
                  {!submitted 
                    ? "Enter your email address and we'll send you a link to reset your password"
                    : "Check your email for reset instructions"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!submitted ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoFocus
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Sending...' : 'Send Reset Link'}
                    </Button>
                  </form>
                ) : (
                  <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center p-4 bg-green-50 rounded-full">
                      <CheckCircle className="w-12 h-12 text-green-600" />
                    </div>
                    <div className="space-y-2">
                      <p className="font-medium">Email Sent!</p>
                      <p className="text-sm text-muted-foreground">
                        If an account exists with <strong>{email}</strong>, you will receive a password reset link shortly.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Please check your inbox and spam folder.
                      </p>
                    </div>
                    <Link href="/login">
                      <Button variant="outline" className="w-full">
                        Return to Login
                      </Button>
                    </Link>
                  </div>
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
