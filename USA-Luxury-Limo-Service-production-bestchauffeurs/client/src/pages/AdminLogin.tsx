import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth, type LoginData, type RegisterData } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Shield, Settings, Users, Lock, AlertCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function AdminLogin() {
  const [, setLocation] = useLocation();
  const { loginMutation, registerMutation, user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  
  // Login form state
  const [loginForm, setLoginForm] = useState<LoginData>({
    username: '',
    password: '',
  });

  // Signup form state
  const [signupForm, setSignupForm] = useState<RegisterData>({
    username: '',
    password: '',
    email: '',
    firstName: '',
    lastName: '',
    role: 'admin',
  });

  // Redirect if already authenticated
  if (user) {
    // Check if user has pending booking data
    const pendingBookingData = localStorage.getItem('pendingBookingData');
    if (pendingBookingData) {
      // Redirect to booking page to complete the booking
      setLocation('/booking');
    } else {
      // Redirect to role-specific dashboard
      const redirectPath = user.role === 'admin' ? '/admin' :
                          user.role === 'driver' ? '/driver' :
                          user.role === 'dispatcher' ? '/dispatcher' :
                          '/passenger';
      setLocation(redirectPath);
    }
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginForm.username || !loginForm.password) {
      toast({
        title: "Missing Information",
        description: "Please enter both username and password",
        variant: "destructive",
      });
      return;
    }

    try {
      await loginMutation.mutateAsync(loginForm);
      toast({
        title: "Administrator Access Granted",
        description: "Welcome to the admin dashboard",
      });
      
      // The automatic redirect in lines 37-51 will handle navigation
      // after the user state has been properly updated
    } catch (error: any) {
      toast({
        title: "Authentication Failed",
        description: error.message || "Invalid administrator credentials",
        variant: "destructive",
      });
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signupForm.username || !signupForm.password || !signupForm.email) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (signupForm.password.length < 6) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    try {
      await registerMutation.mutateAsync({
        ...signupForm,
        role: 'admin',
      });
      
      toast({
        title: "Administrator Account Created",
        description: `Welcome, ${signupForm.firstName || signupForm.username}!`,
      });
      
      // The automatic redirect in lines 37-51 will handle navigation
      // after the user state has been properly updated
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "Could not create administrator account",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 flex flex-col">
      <Header />
      
      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            {/* Header Section */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl mb-6 shadow-lg border border-blue-200">
                <Shield className="w-12 h-12 text-blue-700" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900" data-testid="admin-login-title">
                Administrative Access
              </h1>
              <p className="text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
                Secure access portal for authorized system administrators
              </p>
            </div>

            {/* Admin Login Card */}
            <Card className="border border-slate-200 bg-white shadow-xl hover:shadow-2xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border-b border-slate-200 p-8">
                <div className="flex justify-center gap-3 mb-6">
                  <div className="p-3 bg-blue-100 rounded-xl shadow-md">
                    <Settings className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="p-3 bg-indigo-100 rounded-xl shadow-md">
                    <Users className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div className="p-3 bg-purple-100 rounded-xl shadow-md">
                    <Lock className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold mb-3 text-slate-900 text-center" data-testid="admin-card-title">
                  System Administrator Portal
                </CardTitle>
                <CardDescription className="text-base leading-relaxed text-center text-slate-600" data-testid="admin-card-description">
                  Comprehensive access to system settings, user management, and operational controls
                </CardDescription>
              </CardHeader>
              
              <CardContent className="px-8 pb-8 pt-6">
                <div className="space-y-6">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-amber-100 p-1.5 rounded-lg flex-shrink-0">
                        <AlertCircle className="w-5 h-5 text-amber-700" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-amber-900 mb-1">Restricted Access</h4>
                        <p className="text-sm text-amber-800">
                          Only authorized personnel with administrative privileges may proceed.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Login/Signup Tabs */}
                  <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "signup")}>
                    <TabsList className="grid w-full grid-cols-2 bg-slate-100">
                      <TabsTrigger value="login" data-testid="tab-login" className="data-[state=active]:bg-white data-[state=active]:text-blue-700">
                        Sign In
                      </TabsTrigger>
                      <TabsTrigger value="signup" data-testid="tab-signup" className="data-[state=active]:bg-white data-[state=active]:text-blue-700">
                        Create Account
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="login" className="mt-6">
                      <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-2">
                          <Label htmlFor="admin-login-username" className="text-sm font-semibold text-slate-700">
                            Administrator Username *
                          </Label>
                          <Input
                            id="admin-login-username"
                            type="text"
                            placeholder="Enter your username"
                            value={loginForm.username}
                            onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                            required
                            className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                            data-testid="input-login-username"
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="admin-login-password" className="text-sm font-semibold text-slate-700">
                              Password *
                            </Label>
                            <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 hover:underline">
                              Forgot Password?
                            </Link>
                          </div>
                          <Input
                            id="admin-login-password"
                            type="password"
                            placeholder="Enter your password"
                            value={loginForm.password}
                            onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                            required
                            className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                            data-testid="input-login-password"
                          />
                        </div>
                        <Button 
                          type="submit" 
                          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                          disabled={loginMutation.isPending}
                          data-testid="button-login-submit"
                        >
                          <Shield className="w-5 h-5 mr-2" />
                          {loginMutation.isPending ? 'Authenticating...' : 'Sign In as Administrator'}
                        </Button>
                      </form>
                    </TabsContent>
                    
                    <TabsContent value="signup" className="mt-6">
                      <form onSubmit={handleSignup} className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="admin-signup-firstname" className="text-sm font-semibold text-slate-700">
                              First Name
                            </Label>
                            <Input
                              id="admin-signup-firstname"
                              type="text"
                              placeholder="First name"
                              value={signupForm.firstName}
                              onChange={(e) => setSignupForm(prev => ({ ...prev, firstName: e.target.value }))}
                              className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                              data-testid="input-signup-firstname"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="admin-signup-lastname" className="text-sm font-semibold text-slate-700">
                              Last Name
                            </Label>
                            <Input
                              id="admin-signup-lastname"
                              type="text"
                              placeholder="Last name"
                              value={signupForm.lastName}
                              onChange={(e) => setSignupForm(prev => ({ ...prev, lastName: e.target.value }))}
                              className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                              data-testid="input-signup-lastname"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="admin-signup-email" className="text-sm font-semibold text-slate-700">
                            Email Address *
                          </Label>
                          <Input
                            id="admin-signup-email"
                            type="email"
                            placeholder="admin@example.com"
                            value={signupForm.email}
                            onChange={(e) => setSignupForm(prev => ({ ...prev, email: e.target.value }))}
                            required
                            className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                            data-testid="input-signup-email"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="admin-signup-username" className="text-sm font-semibold text-slate-700">
                            Username *
                          </Label>
                          <Input
                            id="admin-signup-username"
                            type="text"
                            placeholder="Choose a username"
                            value={signupForm.username}
                            onChange={(e) => setSignupForm(prev => ({ ...prev, username: e.target.value }))}
                            required
                            className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                            data-testid="input-signup-username"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="admin-signup-password" className="text-sm font-semibold text-slate-700">
                            Password *
                          </Label>
                          <Input
                            id="admin-signup-password"
                            type="password"
                            placeholder="Min. 6 characters"
                            value={signupForm.password}
                            onChange={(e) => setSignupForm(prev => ({ ...prev, password: e.target.value }))}
                            required
                            minLength={6}
                            className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                            data-testid="input-signup-password"
                          />
                        </div>
                        <Button 
                          type="submit" 
                          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                          disabled={registerMutation.isPending}
                          data-testid="button-signup-submit"
                        >
                          <Shield className="w-5 h-5 mr-2" />
                          {registerMutation.isPending ? 'Creating Account...' : 'Create Administrator Account'}
                        </Button>
                      </form>
                    </TabsContent>
                  </Tabs>

                  <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-200">
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="bg-blue-100 p-1 rounded">
                          <Settings className="w-4 h-4 text-blue-600" />
                        </div>
                        <h5 className="font-semibold text-slate-900">Admin Capabilities</h5>
                      </div>
                      <ul className="space-y-2 text-sm text-slate-700">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                          System Configuration
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                          User Management
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                          Fleet Operations
                        </li>
                      </ul>
                    </div>
                    <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="bg-indigo-100 p-1 rounded">
                          <Shield className="w-4 h-4 text-indigo-600" />
                        </div>
                        <h5 className="font-semibold text-slate-900">Security Features</h5>
                      </div>
                      <ul className="space-y-2 text-sm text-slate-700">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                          Audit Logs
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                          Access Controls
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                          Data Protection
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Notice */}
            <div className="mt-8">
              <Card className="bg-slate-50 border-slate-200 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="bg-slate-200 p-1.5 rounded-lg flex-shrink-0">
                      <Lock className="w-4 h-4 text-slate-700" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-700">
                        <strong className="font-semibold">Security Notice:</strong> All administrative actions are logged and monitored. 
                        Unauthorized access attempts will be tracked and reported to system administrators.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
