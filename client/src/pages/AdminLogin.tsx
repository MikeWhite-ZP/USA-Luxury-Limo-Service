import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth, type LoginData, type RegisterData } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Shield, Settings, Users, Lock } from "lucide-react";
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
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            {/* Header Section */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-full mb-6 border border-red-200/50">
                <Shield className="w-12 h-12 text-red-600" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent" data-testid="admin-login-title">
                Administrative Access
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-xl mx-auto leading-relaxed">
                This area is restricted to authorized system administrators only
              </p>
            </div>

            {/* Admin Login Card */}
            <Card className="border-2 border-red-200/50 bg-gradient-to-br from-white/95 to-red-50/50 dark:from-gray-800/95 dark:to-red-900/20 shadow-2xl">
              <CardHeader className="text-center p-8">
                <div className="flex justify-center space-x-4 mb-6">
                  <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
                    <Settings className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                    <Users className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
                    <Lock className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold mb-4 text-gray-900 dark:text-white" data-testid="admin-card-title">
                  System Administrator Login
                </CardTitle>
                <CardDescription className="text-base leading-relaxed" data-testid="admin-card-description">
                  Access comprehensive system settings, user management, and operational controls for the entire USA Luxury Limo platform.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="px-8 pb-8">
                <div className="space-y-6">
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <Lock className="w-5 h-5 text-amber-600" />
                      <div>
                        <h4 className="font-semibold text-amber-800 dark:text-amber-200">Restricted Access</h4>
                        <p className="text-sm text-amber-700 dark:text-amber-300">
                          Only authorized personnel with administrative privileges may proceed.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Login/Signup Tabs */}
                  <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "signup")}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="login" data-testid="tab-login">Sign In</TabsTrigger>
                      <TabsTrigger value="signup" data-testid="tab-signup">Create Account</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="login">
                      <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="admin-login-username">Administrator Username *</Label>
                          <Input
                            id="admin-login-username"
                            type="text"
                            placeholder="Enter your username"
                            value={loginForm.username}
                            onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                            required
                            data-testid="input-login-username"
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="admin-login-password">Password *</Label>
                            <Link to="/forgot-password" className="text-sm text-primary hover:underline">
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
                            data-testid="input-login-password"
                          />
                        </div>
                        <Button 
                          type="submit" 
                          className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                          disabled={loginMutation.isPending}
                          data-testid="button-login-submit"
                        >
                          <Shield className="w-5 h-5 mr-3" />
                          {loginMutation.isPending ? 'Authenticating...' : 'Sign In as Administrator'}
                        </Button>
                      </form>
                    </TabsContent>
                    
                    <TabsContent value="signup">
                      <form onSubmit={handleSignup} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="admin-signup-firstname">First Name</Label>
                            <Input
                              id="admin-signup-firstname"
                              type="text"
                              placeholder="First name"
                              value={signupForm.firstName}
                              onChange={(e) => setSignupForm(prev => ({ ...prev, firstName: e.target.value }))}
                              data-testid="input-signup-firstname"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="admin-signup-lastname">Last Name</Label>
                            <Input
                              id="admin-signup-lastname"
                              type="text"
                              placeholder="Last name"
                              value={signupForm.lastName}
                              onChange={(e) => setSignupForm(prev => ({ ...prev, lastName: e.target.value }))}
                              data-testid="input-signup-lastname"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="admin-signup-email">Email Address *</Label>
                          <Input
                            id="admin-signup-email"
                            type="email"
                            placeholder="admin@example.com"
                            value={signupForm.email}
                            onChange={(e) => setSignupForm(prev => ({ ...prev, email: e.target.value }))}
                            required
                            data-testid="input-signup-email"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="admin-signup-username">Username *</Label>
                          <Input
                            id="admin-signup-username"
                            type="text"
                            placeholder="Choose a username"
                            value={signupForm.username}
                            onChange={(e) => setSignupForm(prev => ({ ...prev, username: e.target.value }))}
                            required
                            data-testid="input-signup-username"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="admin-signup-password">Password *</Label>
                          <Input
                            id="admin-signup-password"
                            type="password"
                            placeholder="Min. 6 characters"
                            value={signupForm.password}
                            onChange={(e) => setSignupForm(prev => ({ ...prev, password: e.target.value }))}
                            required
                            minLength={6}
                            data-testid="input-signup-password"
                          />
                        </div>
                        <Button 
                          type="submit" 
                          className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                          disabled={registerMutation.isPending}
                          data-testid="button-signup-submit"
                        >
                          <Shield className="w-5 h-5 mr-3" />
                          {registerMutation.isPending ? 'Creating Account...' : 'Create Administrator Account'}
                        </Button>
                      </form>
                    </TabsContent>
                  </Tabs>

                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-300 pt-4 border-t">
                    <div>
                      <h5 className="font-semibold mb-2">Admin Capabilities:</h5>
                      <ul className="space-y-1">
                        <li>• System Configuration</li>
                        <li>• User Management</li>
                        <li>• Fleet Operations</li>
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-semibold mb-2">Security Features:</h5>
                      <ul className="space-y-1">
                        <li>• Audit Logs</li>
                        <li>• Access Controls</li>
                        <li>• Data Protection</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Notice */}
            <div className="mt-8">
              <Card className="bg-gray-50/80 dark:bg-gray-800/80 border-gray-200/50">
                <CardContent className="p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    <strong>Security Notice:</strong> All administrative actions are logged and monitored. 
                    Unauthorized access attempts will be tracked and reported.
                  </p>
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
