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
import { UserCircle, Car, Users, User, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const roles = [
  {
    id: 'passenger' as const,
    title: 'Passenger',
    description: 'Book luxury transportation services',
    icon: <User className="w-8 h-8" />,
    color: 'from-green-500 to-green-600',
  },
  {
    id: 'driver' as const,
    title: 'Driver',
    description: 'Access driver dashboard and manage rides',
    icon: <Car className="w-8 h-8" />,
    color: 'from-blue-500 to-blue-600',
  },
  {
    id: 'dispatcher' as const,
    title: 'Dispatcher',
    description: 'Coordinate rides and manage fleet',
    icon: <Users className="w-8 h-8" />,
    color: 'from-purple-500 to-purple-600',
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
    const redirectPath = user.role === 'admin' ? '/admin' :
                        user.role === 'driver' ? '/driver' :
                        user.role === 'dispatcher' ? '/dispatcher' :
                        '/passenger';
    setLocation(redirectPath);
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
      
      // Redirect will happen automatically via useAuth
      const redirectPath = selectedRole === 'driver' ? '/driver' :
                          selectedRole === 'dispatcher' ? '/dispatcher' :
                          '/passenger';
      setLocation(redirectPath);
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
      
      // Redirect will happen automatically via useAuth
      const redirectPath = selectedRole === 'driver' ? '/driver' :
                          selectedRole === 'dispatcher' ? '/dispatcher' :
                          '/passenger';
      setLocation(redirectPath);
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4" data-testid="page-title">
                {selectedRole ? `${roles.find(r => r.id === selectedRole)?.title} Portal` : 'Access Your Account'}
              </h1>
              <p className="text-lg text-muted-foreground" data-testid="page-subtitle">
                {selectedRole ? 'Sign in or create your account' : 'Choose your role to access the appropriate dashboard'}
              </p>
            </div>

            {!selectedRole ? (
              /* Role Selection */
              <div className="grid md:grid-cols-3 gap-8">
                {roles.map((role) => (
                  <Card 
                    key={role.id}
                    className="group hover:shadow-2xl transition-all duration-300 border-0 bg-white/95 backdrop-blur-sm hover:-translate-y-2 cursor-pointer"
                    onClick={() => handleRoleSelect(role.id)}
                    data-testid={`role-card-${role.id}`}
                  >
                    <CardHeader className="text-center p-8">
                      <div className={`inline-flex items-center justify-center p-4 bg-gradient-to-br ${role.color} text-white rounded-2xl mb-6 mx-auto group-hover:scale-110 transition-transform duration-300`}>
                        {role.icon}
                      </div>
                      <CardTitle className="text-xl font-bold mb-3 group-hover:text-primary transition-colors duration-300" data-testid={`role-title-${role.id}`}>
                        {role.title}
                      </CardTitle>
                      <CardDescription className="text-base leading-relaxed" data-testid={`role-description-${role.id}`}>
                        {role.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="px-8 pb-8">
                      <Button 
                        className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-xl transition-all duration-300 group-hover:shadow-lg"
                        data-testid={`role-button-${role.id}`}
                      >
                        Continue as {role.title}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              /* Login/Signup Forms */
              <div className="max-w-md mx-auto">
                <Button 
                  variant="ghost" 
                  onClick={handleBack}
                  className="mb-6"
                  data-testid="button-back"
                >
                  ← Back to role selection
                </Button>

                <Card data-testid="auth-card">
                  <CardHeader className="text-center">
                    <div className={`inline-flex items-center justify-center p-4 bg-gradient-to-br ${roles.find(r => r.id === selectedRole)?.color} text-white rounded-2xl mb-4 mx-auto`}>
                      {roles.find(r => r.id === selectedRole)?.icon}
                    </div>
                    <CardTitle data-testid="auth-title">
                      {roles.find(r => r.id === selectedRole)?.title} Account
                    </CardTitle>
                    <CardDescription data-testid="auth-description">
                      Sign in or create a new account
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "signup")} data-testid="auth-tabs">
                      <TabsList className="grid w-full grid-cols-2 mb-6">
                        <TabsTrigger value="login" data-testid="tab-login">Sign In</TabsTrigger>
                        <TabsTrigger value="signup" data-testid="tab-signup">Sign Up</TabsTrigger>
                      </TabsList>

                      {/* Login Tab */}
                      <TabsContent value="login">
                        <form onSubmit={handleLogin} className="space-y-4" data-testid="login-form">
                          <div className="space-y-2">
                            <Label htmlFor="login-username">Username</Label>
                            <Input
                              id="login-username"
                              type="text"
                              placeholder="Enter your username"
                              value={loginForm.username}
                              onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                              required
                              data-testid="input-login-username"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="login-password">Password</Label>
                            <Input
                              id="login-password"
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
                            className="w-full"
                            disabled={loginMutation.isPending}
                            data-testid="button-login-submit"
                          >
                            {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
                          </Button>
                        </form>
                      </TabsContent>

                      {/* Signup Tab */}
                      <TabsContent value="signup">
                        <form onSubmit={handleSignup} className="space-y-4" data-testid="signup-form">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="signup-firstname">First Name</Label>
                              <Input
                                id="signup-firstname"
                                type="text"
                                placeholder="John"
                                value={signupForm.firstName}
                                onChange={(e) => setSignupForm(prev => ({ ...prev, firstName: e.target.value }))}
                                data-testid="input-signup-firstname"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="signup-lastname">Last Name</Label>
                              <Input
                                id="signup-lastname"
                                type="text"
                                placeholder="Doe"
                                value={signupForm.lastName}
                                onChange={(e) => setSignupForm(prev => ({ ...prev, lastName: e.target.value }))}
                                data-testid="input-signup-lastname"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="signup-email">Email *</Label>
                            <Input
                              id="signup-email"
                              type="email"
                              placeholder="john@example.com"
                              value={signupForm.email}
                              onChange={(e) => setSignupForm(prev => ({ ...prev, email: e.target.value }))}
                              required
                              data-testid="input-signup-email"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="signup-username">Username *</Label>
                            <Input
                              id="signup-username"
                              type="text"
                              placeholder="johndoe"
                              value={signupForm.username}
                              onChange={(e) => setSignupForm(prev => ({ ...prev, username: e.target.value }))}
                              required
                              data-testid="input-signup-username"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="signup-password">Password *</Label>
                            <Input
                              id="signup-password"
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
                            className="w-full"
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
            )}

            {/* Admin Dashboard Link */}
            <div className="mt-16 text-center">
              <Link href="/admin">
                <div 
                  className="inline-flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black text-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer"
                  data-testid="link-admin-dashboard"
                >
                  <div className="flex items-center justify-center w-12 h-12 bg-white/10 rounded-lg">
                    <Shield className="w-7 h-7" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold">Admin Access</div>
                    <div className="text-xs text-gray-300">Dashboard Login</div>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
