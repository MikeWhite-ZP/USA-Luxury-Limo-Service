import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Shield, Settings, Users, Lock } from "lucide-react";

export function AdminLogin() {
  const handleAdminLogin = () => {
    // Store admin role in session storage for post-login role assignment
    sessionStorage.setItem('selectedRole', 'admin');
    // Redirect to Replit auth with admin role parameter
    window.location.href = '/api/login?role=admin';
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

                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-300">
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

                  <Button 
                    onClick={handleAdminLogin}
                    className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                    data-testid="admin-login-button"
                  >
                    <Shield className="w-5 h-5 mr-3" />
                    Authenticate as Administrator
                  </Button>
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