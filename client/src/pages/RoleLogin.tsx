import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { User, Car, UserCheck } from "lucide-react";
import { useLocation } from "wouter";

export function RoleLogin() {
  const [, setLocation] = useLocation();

  const handleRoleLogin = (role: string) => {
    // Store selected role in session storage for post-login role assignment
    sessionStorage.setItem('selectedRole', role);
    // Redirect to Replit auth with role parameter
    window.location.href = `/api/login?role=${role}`;
  };

  const roles = [
    {
      id: 'passenger',
      title: 'Login as Passenger',
      description: 'Book luxury transportation services for your travel needs',
      icon: <User className="w-12 h-12" />,
      color: 'from-blue-500 to-blue-600',
    },
    {
      id: 'driver', 
      title: 'Login as Driver',
      description: 'Access your driver dashboard and manage rides',
      icon: <Car className="w-12 h-12" />,
      color: 'from-green-500 to-green-600',
    },
    {
      id: 'dispatcher',
      title: 'Login as Dispatcher', 
      description: 'Coordinate rides and manage fleet operations',
      icon: <UserCheck className="w-12 h-12" />,
      color: 'from-purple-500 to-purple-600',
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Header Section */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-primary bg-clip-text text-transparent dark:from-white dark:to-primary" data-testid="role-login-title">
                Access Your Account
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
                Choose your role to access the appropriate dashboard and features
              </p>
            </div>

            {/* Role Selection Cards */}
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              {roles.map((role, index) => (
                <Card 
                  key={role.id}
                  className="group hover:shadow-2xl transition-all duration-300 border-0 bg-white/95 backdrop-blur-sm hover:-translate-y-2 cursor-pointer"
                  onClick={() => handleRoleLogin(role.id)}
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
                      data-testid={`role-login-button-${role.id}`}
                    >
                      Continue as {role.title.replace('Login as ', '')}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Additional Info */}
            <div className="text-center">
              <Card className="bg-gradient-to-br from-gray-50/80 to-primary/5 dark:from-gray-800/80 dark:to-primary/20 border-0">
                <CardContent className="p-6">
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    <strong>First time here?</strong> Select your role and you'll be guided through the setup process.
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Your role determines the features and dashboard you'll have access to after logging in.
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