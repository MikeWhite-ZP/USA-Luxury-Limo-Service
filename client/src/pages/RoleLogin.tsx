import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useTranslation } from 'react-i18next';
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
import { useQuery } from "@tanstack/react-query";

export function RoleLogin() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { loginMutation, registerMutation, user } = useAuth();
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<'passenger' | 'driver' | 'dispatcher' | null>(null);
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  
  const roles = [
    {
      id: 'passenger' as const,
      title: t('roles.passenger'),
      description: t('roles.passengerDescription'),
      icon: <User className="w-10 h-10 text-red-600" />,
      color: 'from-red-600 via-red-500 to-red-700',
      bgGradient: 'from-red-500/20 to-red-700/20',
      borderColor: 'border-red-500/30',
      iconBg: 'bg-red-500/10',
    },
    {
      id: 'driver' as const,
      title: t('roles.driver'),
      description: t('roles.driverDescription'),
      icon: <Car className="w-10 h-10 text-red-600" />,
      color: 'from-red-600 via-red-500 to-red-700',
      bgGradient: 'from-red-500/20 to-red-700/20',
      borderColor: 'border-red-500/30',
      iconBg: 'bg-red-500/10',
    },
    {
      id: 'dispatcher' as const,
      title: t('roles.dispatcher'),
      description: t('roles.dispatcherDescription'),
      icon: <Users className="w-10 h-10 text-red-600" />,
      color: 'from-red-600 via-red-500 to-red-700',
      bgGradient: 'from-red-500/20 to-red-700/20',
      borderColor: 'border-red-500/30',
      iconBg: 'bg-red-500/10',
    },
  ];
  
  const { data: siteLogoData } = useQuery<{ logo: { url: string; alt: string } | null }>({
    queryKey: ['/api/site-logo'],
  });
  
  const [loginForm, setLoginForm] = useState<LoginData>({
    username: '',
    password: '',
  });

  const [signupForm, setSignupForm] = useState<RegisterData>({
    username: '',
    password: '',
    email: '',
    firstName: '',
    lastName: '',
    role: 'passenger',
  });

  if (user) {
    const pendingBookingData = localStorage.getItem('pendingBookingData');
    if (pendingBookingData) {
      setLocation('/booking');
    } else {
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
        title: t('auth.missingInformation'),
        description: t('auth.enterUsernamePassword'),
        variant: "destructive",
      });
      return;
    }

    try {
      await loginMutation.mutateAsync(loginForm);
      toast({
        title: t('auth.welcomeBack'),
        description: t('auth.loginSuccess'),
      });
      
      const pendingBookingData = localStorage.getItem('pendingBookingData');
      if (pendingBookingData) {
        setLocation('/booking');
      } else {
        const redirectPath = selectedRole === 'driver' ? '/driver' :
                            selectedRole === 'dispatcher' ? '/dispatcher' :
                            '/passenger';
        setLocation(redirectPath);
      }
    } catch (error: any) {
      toast({
        title: t('auth.loginFailed'),
        description: error.message || t('auth.invalidCredentials'),
        variant: "destructive",
      });
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signupForm.username || !signupForm.password || !signupForm.email) {
      toast({
        title: t('auth.missingInformation'),
        description: t('auth.fillAllFields'),
        variant: "destructive",
      });
      return;
    }

    if (signupForm.password.length < 6) {
      toast({
        title: t('auth.weakPassword'),
        description: t('auth.passwordMinChars'),
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
        title: t('auth.accountCreated'),
        description: t('auth.welcomeUser', { name: signupForm.firstName || signupForm.username }),
      });
      
      const pendingBookingData = localStorage.getItem('pendingBookingData');
      if (pendingBookingData) {
        setLocation('/booking');
      } else {
        const redirectPath = selectedRole === 'driver' ? '/driver' :
                            selectedRole === 'dispatcher' ? '/dispatcher' :
                            '/passenger';
        setLocation(redirectPath);
      }
    } catch (error: any) {
      toast({
        title: t('auth.registerFailed'),
        description: error.message || t('auth.couldNotCreateAccount'),
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
      <div className="fixed inset-0 bg-gradient-to-br from-red-50 via-background to-muted -z-10 dark:from-red-950/20 dark:via-background dark:to-muted" />
      <div className="fixed inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgb(220 38 38 / 0.03) 1px, transparent 0)', backgroundSize: '48px 48px' }} />
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-red-200/20 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-red-100/15 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDelay: '1s' }} />
      <Header />
      <main className="flex-1 pt-32 pb-20 relative z-0">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-background border-2 border-red-600 shadow-xl mb-6">
                <Shield className="w-10 h-10 text-red-600" />
              </div>
              <h1 className="text-5xl md:text-6xl font-bold mb-6 text-foreground" data-testid="page-title">
                {selectedRole ? t('auth.portalTitle', { role: currentRole?.title }) : t('auth.welcomeBack')}
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed" data-testid="page-subtitle">
                {selectedRole 
                  ? t('auth.accessAccount')
                  : t('auth.selectRoleDescription')}
              </p>
            </div>

            {!selectedRole ? (
              <>
              <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
                {roles.map((role) => (
                  <div
                    key={role.id}
                    className="group relative"
                    onClick={() => handleRoleSelect(role.id)}
                    data-testid={`role-card-${role.id}`}
                  >
                    <div className={`absolute -inset-0.5 bg-gradient-to-r ${role.color} rounded-2xl opacity-10 group-hover:opacity-30 blur transition-all duration-500`} />
                    
                    <Card className="relative h-full bg-card border-border hover:border-border transition-all duration-300 cursor-pointer overflow-hidden group-hover:scale-[1.02] shadow-lg group-hover:shadow-2xl">
                      <div className={`absolute inset-0 bg-gradient-to-br ${role.bgGradient} opacity-0 group-hover:opacity-20 transition-opacity duration-500`} />
                      
                      <CardHeader className="relative text-center p-10 pb-6">
                        <div className="relative mb-8">
                          <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-background border-2 border-red-600 shadow-xl group-hover:scale-110 transition-transform duration-500">
                            {role.icon}
                          </div>
                          <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${role.color} blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500`} style={{ transform: 'scale(0.9)' }} />
                        </div>
                        
                        <CardTitle className="text-2xl font-bold text-foreground mb-4" data-testid={`role-title-${role.id}`}>
                          {role.title}
                        </CardTitle>
                        <CardDescription className="text-base text-muted-foreground leading-relaxed" data-testid={`role-description-${role.id}`}>
                          {role.description}
                        </CardDescription>
                      </CardHeader>
                      
                      <CardContent className="relative px-10 pb-10">
                        <Button 
                          className="w-full bg-transparent border-2 border-transparent text-red-600 hover:bg-red-50 hover:border-red-600 font-semibold py-6 rounded-xl transition-all duration-300 text-base group-hover:scale-[1.02]"
                          data-testid={`role-button-${role.id}`}
                        >
                          {t('auth.continueAs', { role: role.title })}
                          <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
              </>
            ) : (
              <>
              <div className="max-w-xl mx-auto">
                <Button 
                  variant="ghost" 
                  onClick={handleBack}
                  className="mb-8 text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200"
                  data-testid="button-back"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t('auth.backToRoleSelection')}
                </Button>

                <div className="relative group">
                  <div className={`absolute -inset-1 bg-gradient-to-r ${currentRole?.color} rounded-3xl opacity-10 group-hover:opacity-20 blur-xl transition-opacity duration-500`} />
                  
                  <Card className="relative bg-card border-border shadow-xl" data-testid="auth-card">
                    <CardHeader className="text-center pb-6 pt-12 px-10">
                      <div className="relative inline-flex items-center justify-center mx-auto mb-6">
                        <div className="w-20 h-20 rounded-2xl bg-background border-2 border-red-600 shadow-xl flex items-center justify-center">
                          {currentRole?.icon}
                        </div>
                        <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${currentRole?.color} blur-2xl opacity-30`} />
                      </div>
                      
                      <CardTitle className="text-3xl font-bold text-foreground mb-3" data-testid="auth-title">
                        {t('auth.accountTitle', { role: currentRole?.title })}
                      </CardTitle>
                      <CardDescription className="text-muted-foreground text-base" data-testid="auth-description">
                        {t('auth.signInOrCreateAccount')}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="px-10 pb-12">
                      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "signup")} data-testid="auth-tabs">
                        <TabsList className="grid w-full grid-cols-2 mb-8 bg-muted p-1.5 rounded-xl border border-border">
                          <TabsTrigger 
                            value="login" 
                            className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground font-medium transition-all duration-200"
                            data-testid="tab-login"
                          >
                            {t('auth.signIn')}
                          </TabsTrigger>
                          <TabsTrigger 
                            value="signup" 
                            className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground font-medium transition-all duration-200"
                            data-testid="tab-signup"
                          >
                            {t('auth.signUp')}
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="login">
                          <form onSubmit={handleLogin} className="space-y-6" data-testid="login-form">
                            <div className="space-y-2">
                              <Label htmlFor="login-username" className="text-muted-foreground font-medium">{t('auth.username')}</Label>
                              <div className="relative">
                                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <Input
                                  id="login-username"
                                  type="text"
                                  placeholder={t('auth.username')}
                                  value={loginForm.username}
                                  onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                                  required
                                  className="pl-12 h-12 bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-red-500 focus:ring-red-500 rounded-xl"
                                  data-testid="input-login-username"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label htmlFor="login-password" className="text-muted-foreground font-medium">{t('auth.password')}</Label>
                                <Link to="/forgot-password" className="text-sm text-red-600 hover:text-red-500 transition-colors duration-200">
                                  {t('auth.forgotPassword')}
                                </Link>
                              </div>
                              <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <Input
                                  id="login-password"
                                  type="password"
                                  placeholder={t('auth.password')}
                                  value={loginForm.password}
                                  onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                                  required
                                  className="pl-12 h-12 bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-red-500 focus:ring-red-500 rounded-xl"
                                  data-testid="input-login-password"
                                />
                              </div>
                            </div>
                            <Button 
                              type="submit" 
                              className="w-full h-12 bg-transparent border-2 border-transparent text-red-600 hover:bg-red-50 hover:border-red-600 font-semibold rounded-xl transition-all duration-300 text-base mt-8"
                              disabled={loginMutation.isPending}
                              data-testid="button-login-submit"
                            >
                              {loginMutation.isPending ? t('auth.signingIn') : t('auth.signIn')}
                            </Button>
                            <div className="text-center mt-4">
                              <Link href="/forgot-password">
                                <a className="text-sm text-red-600 hover:text-red-700 hover:underline" data-testid="link-forgot-password">
                                  {t('auth.forgotPasswordOrUsername')}
                                </a>
                              </Link>
                            </div>
                          </form>
                        </TabsContent>

                        <TabsContent value="signup">
                          <form onSubmit={handleSignup} className="space-y-5" data-testid="signup-form">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="signup-firstname" className="text-muted-foreground font-medium">{t('auth.firstName')}</Label>
                                <Input
                                  id="signup-firstname"
                                  type="text"
                                  placeholder="John"
                                  value={signupForm.firstName}
                                  onChange={(e) => setSignupForm(prev => ({ ...prev, firstName: e.target.value }))}
                                  className="h-12 bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-red-500 focus:ring-red-500 rounded-xl"
                                  data-testid="input-signup-firstname"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="signup-lastname" className="text-muted-foreground font-medium">{t('auth.lastName')}</Label>
                                <Input
                                  id="signup-lastname"
                                  type="text"
                                  placeholder="Doe"
                                  value={signupForm.lastName}
                                  onChange={(e) => setSignupForm(prev => ({ ...prev, lastName: e.target.value }))}
                                  className="h-12 bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-red-500 focus:ring-red-500 rounded-xl"
                                  data-testid="input-signup-lastname"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="signup-email" className="text-muted-foreground font-medium">{t('auth.email')} *</Label>
                              <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <Input
                                  id="signup-email"
                                  type="email"
                                  placeholder="john@example.com"
                                  value={signupForm.email}
                                  onChange={(e) => setSignupForm(prev => ({ ...prev, email: e.target.value }))}
                                  required
                                  className="pl-12 h-12 bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-red-500 focus:ring-red-500 rounded-xl"
                                  data-testid="input-signup-email"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="signup-username" className="text-muted-foreground font-medium">{t('auth.username')} *</Label>
                              <div className="relative">
                                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <Input
                                  id="signup-username"
                                  type="text"
                                  placeholder="johndoe"
                                  value={signupForm.username}
                                  onChange={(e) => setSignupForm(prev => ({ ...prev, username: e.target.value }))}
                                  required
                                  className="pl-12 h-12 bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-red-500 focus:ring-red-500 rounded-xl"
                                  data-testid="input-signup-username"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="signup-password" className="text-muted-foreground font-medium">{t('auth.password')} *</Label>
                              <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <Input
                                  id="signup-password"
                                  type="password"
                                  placeholder={t('auth.minPasswordLength')}
                                  value={signupForm.password}
                                  onChange={(e) => setSignupForm(prev => ({ ...prev, password: e.target.value }))}
                                  required
                                  minLength={6}
                                  className="pl-12 h-12 bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-red-500 focus:ring-red-500 rounded-xl"
                                  data-testid="input-signup-password"
                                />
                              </div>
                            </div>
                            <Button 
                              type="submit" 
                              className="w-full h-12 bg-transparent border-2 border-transparent text-red-600 hover:bg-red-50 hover:border-red-600 font-semibold rounded-xl transition-all duration-300 text-base mt-6"
                              disabled={registerMutation.isPending}
                              data-testid="button-signup-submit"
                            >
                              {registerMutation.isPending ? t('auth.signingUp') : t('auth.createAccount')}
                            </Button>
                          </form>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                </div>
              </div>
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
