import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Shield, User, Mail, Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";

export default function FirstAdminSetup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { data: adminStatus, isLoading: checkingAdmin } = useQuery({
    queryKey: ["/api/admin/exists"],
    queryFn: async () => {
      const res = await fetch("/api/admin/exists");
      if (!res.ok) throw new Error("Failed to check admin status");
      return res.json();
    },
  });

  const createAdminMutation = useMutation({
    mutationFn: async (data: {
      username: string;
      email: string;
      firstName: string;
      lastName: string;
      password: string;
    }) => {
      const response = await apiRequest("POST", "/api/setup/first-admin", data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create admin account");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/exists"] });
      toast({
        title: "Admin Account Created",
        description: "Your administrator account has been created successfully. Redirecting to dashboard...",
      });
      setTimeout(() => {
        setLocation("/admin-dashboard");
      }, 1500);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !email.trim() || !password) {
      toast({
        title: "Validation Error",
        description: "Username, email, and password are required",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Validation Error",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Validation Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    createAdminMutation.mutate({
      username: username.trim(),
      email: email.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      password,
    });
  };

  if (checkingAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-500 text-sm">Checking system status...</p>
        </div>
      </div>
    );
  }

  if (adminStatus?.exists) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white border border-gray-200 shadow-sm">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-xl font-semibold text-gray-900">Setup Complete</CardTitle>
            <CardDescription className="text-gray-500">
              An administrator account already exists. Please use the login page to access the admin dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button
              onClick={() => setLocation("/admin-login")}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white"
            >
              Go to Admin Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome to Your Admin Panel</h1>
          <p className="text-gray-500 mt-2">Create the first administrator account to get started</p>
        </div>

        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="pb-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <CardTitle className="text-lg font-semibold text-gray-900">First Admin Setup</CardTitle>
            </div>
            <CardDescription className="text-gray-500 mt-1">
              This account will have full administrative privileges. Only administrators can create additional admin accounts.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className="text-sm font-medium text-gray-700 mb-1.5 block">
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    className="border-gray-200 focus:border-gray-400 focus:ring-gray-400 text-sm h-10"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName" className="text-sm font-medium text-gray-700 mb-1.5 block">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    className="border-gray-200 focus:border-gray-400 focus:ring-gray-400 text-sm h-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="username" className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-gray-400" />
                  Username <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="border-gray-200 focus:border-gray-400 focus:ring-gray-400 text-sm h-10"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@company.com"
                  className="border-gray-200 focus:border-gray-400 focus:ring-gray-400 text-sm h-10"
                  required
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-gray-400" />
                  Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong password"
                    className="border-gray-200 focus:border-gray-400 focus:ring-gray-400 text-sm h-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1.5">Minimum 8 characters</p>
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Confirm Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="border-gray-200 focus:border-gray-400 focus:ring-gray-400 text-sm h-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={createAdminMutation.isPending}
                className="w-full bg-red-600 hover:bg-red-700 text-white text-sm font-medium h-11"
              >
                {createAdminMutation.isPending ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Create Administrator Account
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-400 mt-6">
          This page is only available during initial system setup.
          <br />
          Once an admin account is created, it will no longer be accessible.
        </p>
      </div>
    </div>
  );
}
