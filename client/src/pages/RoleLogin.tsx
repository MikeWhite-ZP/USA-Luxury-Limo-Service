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
import { UserCircle, Car, Users, User, Shield, ArrowLeft, Lock, Mail, UserIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import adminLogo from "@assets/favicon_1759253989963.png";

const roles = [
  {
    id: 'passenger' as const,
    title: 'Passenger',
    description: 'Book luxury transportation services with ease',
    icon: <User className="w-10 h-10" />,
    color: 'from-blue-600 via-blue-500 to-cyan-500',
    bgGradient: 'from-blue-500/20 to-cyan-500/20',
    borderColor: 'border-blue-500/30',
    iconBg: 'bg-blue-500/10',
  },
  {
    id: 'driver' as const,
    title: 'Driver',
    description: 'Access your dashboard and manage rides efficiently',
    icon: <Car className="w-10 h-10" />,
    color: 'from-green-600 via-green-500 to-emerald-500',
    bgGradient: 'from-green-500/20 to-emerald-500/20',
    borderColor: 'border-green-500/30',
    iconBg: 'bg-green-500/10',
  },
  {
    id: 'dispatcher' as const,
    title: 'Dispatcher',
    description: 'Coordinate operations and manage the fleet',
    icon: <Users className="w-10 h-10" />,
    color: 'from-purple-600 via-purple-500 to-fuchsia-500',
    bgGradient: 'from-purple-500/20 to-fuchsia-500/20',
    borderColor: 'border-purple-500/30',
    iconBg: 'bg-purple-500/10',
  },
];

export function RoleLogin() {
  const [, setLocation] = useLocation();
  const { loginMutation, registerMutation, user } = useAuth();
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<'passenger' | 'driver' | 'dispatcher' | null>(null);
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
    role: 'passenger',
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
        title: "Welcome back!",
        description: "You have been logged in successfully",
      });
      
      // Check if user has pending booking data
      const pendingBookingData = localStorage.getItem('pendingBookingData');
      if (pendingBookingData) {
        // Redirect to booking page to complete the booking
        setLocation('/booking');
      } else {
        // Redirect to role-specific dashboard
        const redirectPath = selectedRole === 'driver' ? '/driver' :
                            selectedRole === 'dispatcher' ? '/dispatcher' :
                            '/passenger';
        setLocation(redirectPath);
      }
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid username or password",
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
        role: selectedRole || 'passenger',
      });
      
      toast({
        title: "Account Created!",
        description: `Welcome to USA Luxury Limo, ${signupForm.firstName || signupForm.username}!`,
      });
      
      // Check if user has pending booking data
      const pendingBookingData = localStorage.getItem('pendingBookingData');
      if (pendingBookingData) {
        // Redirect to booking page to complete the booking
        setLocation('/booking');
      } else {
        // Redirect to role-specific dashboard
        const redirectPath = selectedRole === 'driver' ? '/driver' :
                            selectedRole === 'dispatcher' ? '/dispatcher' :
                            '/passenger';
        setLocation(redirectPath);
      }
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "Could not create account",
        variant: "destructive",
      });
    }
  };

  const handleRoleSelect = (roleId: 'passenger' | 'driver' | 'dispatcher') => {
    setSelectedRole(roleId);
    setSignupForm(prev => ({ ...prev, role: roleId }));
  };

  const handleBack = () => {
    setSelectedRole(null);
    setLoginForm({ username: '', password: '' });
    setSignupForm({
      username: '',
      password: '',
      email: '',
      firstName: '',
      lastName: '',
      role: 'passenger',
    });
  };

  const currentRole = roles.find(r => r.id === selectedRole);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Animated Background Gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 -z-10" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800/20 via-transparent to-transparent -z-10" />
      
      {/* Floating orbs for visual interest */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDelay: '1s' }} />
      
      <Header />
      
      <main className="flex-1 pt-32 pb-20 relative z-0">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 mb-6 shadow-2xl">
                <Shield className="w-10 h-10 text-blue-400" />
              </div>
              <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent" data-testid="page-title">
                {selectedRole ? `${currentRole?.title} Portal` : 'Welcome Back'}
              </h1>
              <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed" data-testid="page-subtitle">
                {selectedRole 
                  ? 'Access your account to continue' 
                  : 'Select your role to access your personalized dashboard'}
              </p>
            </div>

            {!selectedRole ? (
              /* Role Selection Grid */
              <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
                {roles.map((role) => (
                  <div
                    key={role.id}
                    className="group relative"
                    onClick={() => handleRoleSelect(role.id)}
                    data-testid={`role-card-${role.id}`}
                  >
                    {/* Glow effect on hover */}
                    <div className={`absolute -inset-0.5 bg-gradient-to-r ${role.color} rounded-2xl opacity-0 group-hover:opacity-100 blur transition-all duration-500`} />
                    
                    <Card className="relative h-full bg-slate-900/90 backdrop-blur-xl border-slate-800/50 hover:border-slate-700 transition-all duration-300 cursor-pointer overflow-hidden group-hover:scale-[1.02] group-hover:shadow-2xl">
                      {/* Subtle gradient background */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${role.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                      
                      <CardHeader className="relative text-center p-10 pb-6">
                        {/* Icon Container */}
                        <div className="relative mb-8">
                          <div className={`inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br ${role.color} shadow-2xl group-hover:scale-110 transition-transform duration-500`}>
                            <div className="text-white">
                              {role.icon}
                            </div>
                          </div>
                          {/* Glow ring */}
                          <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${role.color} blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-500`} style={{ transform: 'scale(0.9)' }} />
                        </div>
                        
                        <CardTitle className="text-2xl font-bold text-white mb-4 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text transition-all duration-300" style={{ backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))` }} data-testid={`role-title-${role.id}`}>
                          {role.title}
                        </CardTitle>
                        <CardDescription className="text-base text-slate-400 leading-relaxed" data-testid={`role-description-${role.id}`}>
                          {role.description}
                        </CardDescription>
                      </CardHeader>
                      
                      <CardContent className="relative px-10 pb-10">
                        <Button 
                          className={`w-full bg-gradient-to-r ${role.color} hover:shadow-xl hover:shadow-${role.id}-500/20 text-white font-semibold py-6 rounded-xl transition-all duration-300 border-0 text-base group-hover:scale-[1.02]`}
                          data-testid={`role-button-${role.id}`}
                        >
                          Continue as {role.title}
                          <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            ) : (
              /* Auth Form Section */
              <div className="max-w-xl mx-auto">
                <Button 
                  variant="ghost" 
                  onClick={handleBack}
                  className="mb-8 text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all duration-200"
                  data-testid="button-back"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to role selection
                </Button>

                {/* Glowing card wrapper */}
                <div className="relative group">
                  <div className={`absolute -inset-1 bg-gradient-to-r ${currentRole?.color} rounded-3xl opacity-20 group-hover:opacity-30 blur-xl transition-opacity duration-500`} />
                  
                  <Card className="relative bg-slate-900/95 backdrop-blur-2xl border-slate-800/50 shadow-2xl" data-testid="auth-card">
                    <CardHeader className="text-center pb-6 pt-12 px-10">
                      {/* Role Icon */}
                      <div className="relative inline-flex items-center justify-center mx-auto mb-6">
                        <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${currentRole?.color} shadow-2xl flex items-center justify-center`}>
                          <div className="text-white">
                            {currentRole?.icon}
                          </div>
                        </div>
                        <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${currentRole?.color} blur-2xl opacity-40`} />
                      </div>
                      
                      <CardTitle className="text-3xl font-bold text-white mb-3" data-testid="auth-title">
                        {currentRole?.title} Account
                      </CardTitle>
                      <CardDescription className="text-slate-400 text-base" data-testid="auth-description">
                        Sign in or create a new account to continue
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="px-10 pb-12">
                      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "signup")} data-testid="auth-tabs">
                        <TabsList className="grid w-full grid-cols-2 mb-8 bg-slate-800/50 p-1.5 rounded-xl border border-slate-700/50">
                          <TabsTrigger 
                            value="login" 
                            className="rounded-lg data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400 font-medium transition-all duration-200"
                            data-testid="tab-login"
                          >
                            Sign In
                          </TabsTrigger>
                          <TabsTrigger 
                            value="signup" 
                            className="rounded-lg data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400 font-medium transition-all duration-200"
                            data-testid="tab-signup"
                          >
                            Sign Up
                          </TabsTrigger>
                        </TabsList>

                        {/* Login Tab */}
                        <TabsContent value="login">
                          <form onSubmit={handleLogin} className="space-y-6" data-testid="login-form">
                            <div className="space-y-2">
                              <Label htmlFor="login-username" className="text-slate-300 font-medium">Username</Label>
                              <div className="relative">
                                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <Input
                                  id="login-username"
                                  type="text"
                                  placeholder="Enter your username"
                                  value={loginForm.username}
                                  onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                                  required
                                  className="pl-12 h-12 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-slate-600 focus:ring-slate-600 rounded-xl"
                                  data-testid="input-login-username"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label htmlFor="login-password" className="text-slate-300 font-medium">Password</Label>
                                <Link to="/forgot-password" className="text-sm text-blue-400 hover:text-blue-300 transition-colors duration-200">
                                  Forgot Password?
                                </Link>
                              </div>
                              <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <Input
                                  id="login-password"
                                  type="password"
                                  placeholder="Enter your password"
                                  value={loginForm.password}
                                  onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                                  required
                                  className="pl-12 h-12 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-slate-600 focus:ring-slate-600 rounded-xl"
                                  data-testid="input-login-password"
                                />
                              </div>
                            </div>
                            <Button 
                              type="submit" 
                              className={`w-full h-12 bg-gradient-to-r ${currentRole?.color} hover:shadow-xl font-semibold text-white rounded-xl transition-all duration-300 text-base mt-8`}
                              disabled={loginMutation.isPending}
                              data-testid="button-login-submit"
                            >
                              {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
                            </Button>
                          </form>
                        </TabsContent>

                        {/* Signup Tab */}
                        <TabsContent value="signup">
                          <form onSubmit={handleSignup} className="space-y-5" data-testid="signup-form">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="signup-firstname" className="text-slate-300 font-medium">First Name</Label>
                                <Input
                                  id="signup-firstname"
                                  type="text"
                                  placeholder="John"
                                  value={signupForm.firstName}
                                  onChange={(e) => setSignupForm(prev => ({ ...prev, firstName: e.target.value }))}
                                  className="h-12 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-slate-600 focus:ring-slate-600 rounded-xl"
                                  data-testid="input-signup-firstname"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="signup-lastname" className="text-slate-300 font-medium">Last Name</Label>
                                <Input
                                  id="signup-lastname"
                                  type="text"
                                  placeholder="Doe"
                                  value={signupForm.lastName}
                                  onChange={(e) => setSignupForm(prev => ({ ...prev, lastName: e.target.value }))}
                                  className="h-12 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-slate-600 focus:ring-slate-600 rounded-xl"
                                  data-testid="input-signup-lastname"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="signup-email" className="text-slate-300 font-medium">Email *</Label>
                              <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <Input
                                  id="signup-email"
                                  type="email"
                                  placeholder="john@example.com"
                                  value={signupForm.email}
                                  onChange={(e) => setSignupForm(prev => ({ ...prev, email: e.target.value }))}
                                  required
                                  className="pl-12 h-12 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-slate-600 focus:ring-slate-600 rounded-xl"
                                  data-testid="input-signup-email"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="signup-username" className="text-slate-300 font-medium">Username *</Label>
                              <div className="relative">
                                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <Input
                                  id="signup-username"
                                  type="text"
                                  placeholder="johndoe"
                                  value={signupForm.username}
                                  onChange={(e) => setSignupForm(prev => ({ ...prev, username: e.target.value }))}
                                  required
                                  className="pl-12 h-12 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-slate-600 focus:ring-slate-600 rounded-xl"
                                  data-testid="input-signup-username"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="signup-password" className="text-slate-300 font-medium">Password *</Label>
                              <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <Input
                                  id="signup-password"
                                  type="password"
                                  placeholder="Min. 6 characters"
                                  value={signupForm.password}
                                  onChange={(e) => setSignupForm(prev => ({ ...prev, password: e.target.value }))}
                                  required
                                  minLength={6}
                                  className="pl-12 h-12 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-slate-600 focus:ring-slate-600 rounded-xl"
                                  data-testid="input-signup-password"
                                />
                              </div>
                            </div>
                            <Button 
                              type="submit" 
                              className={`w-full h-12 bg-gradient-to-r ${currentRole?.color} hover:shadow-xl font-semibold text-white rounded-xl transition-all duration-300 text-base mt-8`}
                              disabled={registerMutation.isPending}
                              data-testid="button-signup-submit"
                            >
                              {registerMutation.isPending ? 'Creating account...' : 'Create Account'}
                            </Button>
                          </form>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Admin Access Section */}
            <div className="mt-20 text-center">
              <div className="relative inline-block">
                <div className="absolute -inset-1 bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 rounded-2xl opacity-50 blur-lg" />
                <Link 
                  to="/admin-login"
                  className="relative flex items-center gap-4 px-8 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl hover:shadow-slate-700/50 transition-all duration-300 hover:scale-105 cursor-pointer group"
                  data-testid="link-admin-dashboard"
                >
                  <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600/30 group-hover:scale-110 transition-transform duration-300">
                    <img src={adminLogo} alt="USA Luxury Limo" className="w-9 h-9 object-contain" />
                  </div>
                  <div className="text-left">
                    <div className="text-base font-bold text-white mb-0.5 flex items-center gap-2">
                      Admin Access
                      <Shield className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="text-sm text-slate-400">Dashboard Login</div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
