import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";

export default function AuthModals() {
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [userType, setUserType] = useState('passenger');

  const handleSignIn = () => {
    window.location.href = '/api/login';
  };

  const switchToRegister = () => {
    setLoginOpen(false);
    setRegisterOpen(true);
  };

  const switchToLogin = () => {
    setRegisterOpen(false);
    setLoginOpen(true);
  };

  return (
    <>
      {/* Login Modal */}
      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
        <DialogContent className="max-w-md bg-white" data-testid="login-modal">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-card-foreground" data-testid="login-title">
              Sign In
            </DialogTitle>
            <button 
              onClick={() => setLoginOpen(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
              data-testid="button-close-login"
            >
              <X className="w-6 h-6" />
            </button>
          </DialogHeader>

          {/* User Type Selection */}
          <div className="mb-6">
            <div className="grid grid-cols-3 gap-2 bg-muted rounded-lg p-1">
              <button
                onClick={() => setUserType('passenger')}
                className={`py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  userType === 'passenger' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                data-testid="user-type-passenger"
              >
                Passenger
              </button>
              <button
                onClick={() => setUserType('driver')}
                className={`py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  userType === 'driver' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                data-testid="user-type-driver"
              >
                Driver
              </button>
              <button
                onClick={() => setUserType('admin')}
                className={`py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  userType === 'admin' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                data-testid="user-type-admin"
              >
                Admin
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="Enter your email"
                data-testid="input-login-email"
              />
            </div>
            <div>
              <Label htmlFor="login-password">Password</Label>
              <Input
                id="login-password"
                type="password"
                placeholder="Enter your password"
                data-testid="input-login-password"
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" data-testid="checkbox-remember-me" />
                <span className="text-muted-foreground">Remember me</span>
              </label>
              <a href="#" className="text-primary hover:text-primary/80" data-testid="link-forgot-password">
                Forgot password?
              </a>
            </div>
            <Button 
              onClick={handleSignIn}
              className="w-full"
              data-testid="button-sign-in"
            >
              Sign In
            </Button>
          </div>

          <div className="mt-6 text-center">
            <span className="text-muted-foreground">Don't have an account? </span>
            <button 
              onClick={switchToRegister}
              className="text-primary hover:text-primary/80 font-medium"
              data-testid="button-switch-register"
            >
              Sign up
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Register Modal */}
      <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
        <DialogContent className="max-w-md bg-white" data-testid="register-modal">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-card-foreground" data-testid="register-title">
              Create Account
            </DialogTitle>
            <button 
              onClick={() => setRegisterOpen(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
              data-testid="button-close-register"
            >
              <X className="w-6 h-6" />
            </button>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="register-first-name">First Name</Label>
                <Input
                  id="register-first-name"
                  placeholder="John"
                  data-testid="input-register-first-name"
                />
              </div>
              <div>
                <Label htmlFor="register-last-name">Last Name</Label>
                <Input
                  id="register-last-name"
                  placeholder="Doe"
                  data-testid="input-register-last-name"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="register-email">Email</Label>
              <Input
                id="register-email"
                type="email"
                placeholder="john@example.com"
                data-testid="input-register-email"
              />
            </div>
            <div>
              <Label htmlFor="register-phone">Phone</Label>
              <Input
                id="register-phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                data-testid="input-register-phone"
              />
            </div>
            <div>
              <Label htmlFor="register-password">Password</Label>
              <Input
                id="register-password"
                type="password"
                placeholder="Create a strong password"
                data-testid="input-register-password"
              />
            </div>
            <div>
              <Label htmlFor="register-confirm-password">Confirm Password</Label>
              <Input
                id="register-confirm-password"
                type="password"
                placeholder="Confirm your password"
                data-testid="input-register-confirm-password"
              />
            </div>
            <div className="flex items-start">
              <input type="checkbox" className="mt-1 mr-3" data-testid="checkbox-terms" />
              <span className="text-sm text-muted-foreground">
                I agree to the{" "}
                <a href="#" className="text-primary hover:text-primary/80" data-testid="link-terms">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="text-primary hover:text-primary/80" data-testid="link-privacy">
                  Privacy Policy
                </a>
              </span>
            </div>
            <Button 
              onClick={handleSignIn}
              className="w-full"
              data-testid="button-create-account"
            >
              Create Account
            </Button>
          </div>

          <div className="mt-6 text-center">
            <span className="text-muted-foreground">Already have an account? </span>
            <button 
              onClick={switchToLogin}
              className="text-primary hover:text-primary/80 font-medium"
              data-testid="button-switch-login"
            >
              Sign in
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
