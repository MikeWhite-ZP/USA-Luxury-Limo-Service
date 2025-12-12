import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { User, Mail, Phone, ArrowLeft, Save, Lock, Eye, EyeOff, Shield, Calendar, CheckCircle2, Camera, Upload } from "lucide-react";
import Header from "@/components/Header";
import { isMobileDevice } from "@/lib/deviceDetection";

export default function AccountPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [username, setUsername] = useState(user?.username || '');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  
  // Profile picture states
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(user?.profileImageUrl || null);

  // Password update states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { firstName: string; lastName: string; phone: string; email: string; username?: string }) => {
      const response = await apiRequest('PATCH', '/api/user/profile', data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update profile');
      }
      return await response.json();
    },
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      queryClient.setQueryData(['/api/auth/user'], updatedUser);
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const response = await apiRequest('PATCH', '/api/user/password', data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update password');
      }
      return await response.json();
    },
    onSuccess: () => {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast({
        title: "Password Updated",
        description: "Your password has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update password",
        variant: "destructive",
      });
    },
  });

  const uploadProfilePictureMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/user/profile-picture', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }

      return await response.json();
    },
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      queryClient.setQueryData(['/api/auth/user'], updatedUser);
      setProfilePicture(null);
      setPreviewUrl(updatedUser.profileImageUrl);
      toast({
        title: "Profile Picture Updated",
        description: "Your profile picture has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName.trim() || !lastName.trim()) {
      toast({
        title: "Validation Error",
        description: "First name and last name are required",
        variant: "destructive",
      });
      return;
    }

    if (!email.trim()) {
      toast({
        title: "Validation Error",
        description: "Email is required",
        variant: "destructive",
      });
      return;
    }

    updateProfileMutation.mutate({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      username: username.trim() || undefined,
    });
  };
  
  // Check username availability with debounce
  useEffect(() => {
    if (!username || username === user?.username) {
      setUsernameStatus('idle');
      return;
    }

    // Validate format first
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(username) || username.length < 3 || username.length > 30) {
      setUsernameStatus('idle');
      return;
    }

    setUsernameStatus('checking');
    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(`/api/user/check-username/${encodeURIComponent(username)}`, {
          credentials: 'include',
        });
        const data = await response.json();
        setUsernameStatus(data.available ? 'available' : 'taken');
      } catch (error) {
        console.error('Error checking username:', error);
        setUsernameStatus('idle');
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [username, user?.username]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Validation Error",
        description: "All password fields are required",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Validation Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: "Validation Error",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }

    if (!/[A-Z]/.test(newPassword)) {
      toast({
        title: "Validation Error",
        description: "Password must contain at least one uppercase letter",
        variant: "destructive",
      });
      return;
    }

    if (!/[a-z]/.test(newPassword)) {
      toast({
        title: "Validation Error",
        description: "Password must contain at least one lowercase letter",
        variant: "destructive",
      });
      return;
    }

    if (!/[0-9]/.test(newPassword)) {
      toast({
        title: "Validation Error",
        description: "Password must contain at least one number",
        variant: "destructive",
      });
      return;
    }

    updatePasswordMutation.mutate({
      currentPassword,
      newPassword,
    });
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Image size must be less than 2MB",
        variant: "destructive",
      });
      return;
    }

    setProfilePicture(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadProfilePicture = () => {
    if (!profilePicture) {
      toast({
        title: "No File Selected",
        description: "Please select a profile picture to upload",
        variant: "destructive",
      });
      return;
    }

    uploadProfilePictureMutation.mutate(profilePicture);
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/login');
    }
  }, [isLoading, isAuthenticated, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted via-blue-50/20 to-muted dark:from-background dark:via-blue-950/10 dark:to-background">
      <Header />
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          variant="ghost"
          onClick={() => {
            if (isMobileDevice() && user?.role) {
              const role = user.role;
              if (role === 'driver') {
                setLocation('/mobile-driver');
              } else if (role === 'dispatcher') {
                setLocation('/mobile-dispatcher');
              } else if (role === 'passenger') {
                setLocation('/mobile-passenger');
              } else {
                setLocation('/');
              }
            } else {
              setLocation('/');
            }
          }}
          className="mb-6 hover:bg-muted"
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Account Settings</h1>
          <p className="text-muted-foreground">Manage your personal information and security preferences</p>
        </div>

        <div className="grid gap-6">
          {/* Account Overview Card */}
          <Card data-testid="account-details-card" className="border-border shadow-sm hover:shadow-md transition-shadow bg-card">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-muted dark:from-blue-950/30 dark:to-muted border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-foreground text-xl">Account Overview</CardTitle>
                    <CardDescription className="text-muted-foreground mt-1">Your account information and status</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-muted rounded-xl p-4 border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="bg-blue-100 p-1.5 rounded-lg">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                    <p className="text-xs font-medium text-muted-foreground">Account Type</p>
                  </div>
                  <Badge className="bg-blue-600 hover:bg-blue-700 text-white" data-testid="text-role">
                    {user?.role || 'N/A'}
                  </Badge>
                </div>
                <div className="bg-muted rounded-xl p-4 border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="bg-green-100 p-1.5 rounded-lg">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    </div>
                    <p className="text-xs font-medium text-muted-foreground">Account Status</p>
                  </div>
                  <div data-testid="text-status">
                    {user?.isActive ? (
                      <Badge className="bg-green-600 hover:bg-green-700 text-white">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="destructive">Inactive</Badge>
                    )}
                  </div>
                </div>
                {user?.createdAt && (
                  <div className="bg-muted rounded-xl p-4 border border-border">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="bg-purple-100 p-1.5 rounded-lg">
                        <Calendar className="w-4 h-4 text-purple-600" />
                      </div>
                      <p className="text-xs font-medium text-muted-foreground">Member Since</p>
                    </div>
                    <p className="font-semibold text-foreground" data-testid="text-created-at">
                      {new Date(user.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Profile Information Card */}
          <Card data-testid="profile-card" className="border-border shadow-sm hover:shadow-md transition-shadow bg-card">
            <CardHeader className="bg-gradient-to-r from-muted to-blue-50/30 dark:from-muted dark:to-blue-950/20 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="bg-slate-600 dark:bg-slate-500 p-2.5 rounded-xl shadow-lg">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-foreground text-xl">Personal Information</CardTitle>
                  <CardDescription className="text-muted-foreground mt-1">
                    Update your personal information and contact details
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="firstName" className="text-sm font-semibold text-muted-foreground mb-2 block">
                      First Name *
                    </Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Enter your first name"
                      className="border-border bg-background text-foreground focus:border-blue-500 focus:ring-blue-500"
                      data-testid="input-first-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-sm font-semibold text-muted-foreground mb-2 block">
                      Last Name *
                    </Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Enter your last name"
                      className="border-border bg-background text-foreground focus:border-blue-500 focus:ring-blue-500"
                      data-testid="input-last-name"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email" className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                    <div className="bg-blue-100 p-1 rounded">
                      <Mail className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    Email Address *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="border-border focus:border-blue-500 focus:ring-blue-500"
                    data-testid="input-email"
                  />
                </div>

                <div>
                  <Label htmlFor="phone" className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                    <div className="bg-green-100 p-1 rounded">
                      <Phone className="w-3.5 h-3.5 text-green-600" />
                    </div>
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter your phone number"
                    className="border-border focus:border-blue-500 focus:ring-blue-500"
                    data-testid="input-phone"
                  />
                </div>

                <div>
                  <Label htmlFor="username" className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                    <div className="bg-purple-100 p-1 rounded">
                      <User className="w-3.5 h-3.5 text-purple-600" />
                    </div>
                    Username
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Choose a username"
                    className="border-border focus:border-blue-500 focus:ring-blue-500"
                    data-testid="input-username"
                  />
                  {username && username !== user?.username && (
                    <p className={`text-xs mt-2 flex items-center gap-1 ${
                      usernameStatus === 'checking' ? 'text-muted-foreground' :
                      usernameStatus === 'available' ? 'text-green-600' :
                      usernameStatus === 'taken' ? 'text-red-600' :
                      'text-muted-foreground'
                    }`}>
                      {usernameStatus === 'checking' && '⏳ Checking availability...'}
                      {usernameStatus === 'available' && '✓ Username is available'}
                      {usernameStatus === 'taken' && '✗ Username is already taken'}
                      {usernameStatus === 'idle' && 'Username must be 3-30 characters (letters, numbers, -, _)'}
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-4 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (isMobileDevice() && user?.role) {
                        const role = user.role;
                        if (role === 'driver') {
                          setLocation('/mobile-driver');
                        } else if (role === 'dispatcher') {
                          setLocation('/mobile-dispatcher');
                        } else if (role === 'passenger') {
                          setLocation('/mobile-passenger');
                        } else {
                          setLocation('/');
                        }
                      } else {
                        setLocation('/');
                      }
                    }}
                    className="flex-1 border-border hover:bg-muted"
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateProfileMutation.isPending || usernameStatus === 'taken' || usernameStatus === 'checking'}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                    data-testid="button-save"
                  >
                    {updateProfileMutation.isPending ? (
                      <>Saving...</>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Change Password Card */}
          <Card data-testid="change-password-card" className="border-border shadow-sm hover:shadow-md transition-shadow bg-card">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50/30 dark:from-amber-950/30 dark:to-orange-950/20 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="bg-amber-600 p-2.5 rounded-xl shadow-lg">
                  <Lock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-foreground text-xl">Security Settings</CardTitle>
                  <CardDescription className="text-muted-foreground mt-1">
                    Update your password to keep your account secure
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handlePasswordSubmit} className="space-y-5">
                <div>
                  <Label htmlFor="currentPassword" className="text-sm font-semibold text-muted-foreground mb-2 block">
                    Current Password *
                  </Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter your current password"
                      className="border-border focus:border-amber-500 focus:ring-amber-500 pr-10"
                      data-testid="input-current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground"
                      data-testid="toggle-current-password"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="newPassword" className="text-sm font-semibold text-muted-foreground mb-2 block">
                    New Password *
                  </Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter your new password"
                      className="border-border focus:border-amber-500 focus:ring-amber-500 pr-10"
                      data-testid="input-new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground"
                      data-testid="toggle-new-password"
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 bg-amber-50 p-2 rounded border border-amber-200">
                    Minimum 8 characters with uppercase, lowercase, and numbers
                  </p>
                </div>

                <div>
                  <Label htmlFor="confirmPassword" className="text-sm font-semibold text-muted-foreground mb-2 block">
                    Confirm New Password *
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your new password"
                      className="border-border focus:border-amber-500 focus:ring-amber-500 pr-10"
                      data-testid="input-confirm-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground"
                      data-testid="toggle-confirm-password"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                    className="flex-1 border-border hover:bg-muted"
                    data-testid="button-cancel-password"
                  >
                    Clear
                  </Button>
                  <Button
                    type="submit"
                    disabled={updatePasswordMutation.isPending}
                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white shadow-md"
                    data-testid="button-update-password"
                  >
                    {updatePasswordMutation.isPending ? (
                      <>Updating...</>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 mr-2" />
                        Update Password
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
