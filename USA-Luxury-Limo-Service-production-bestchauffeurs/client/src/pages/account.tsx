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
import { User, Mail, Phone, ArrowLeft, Save, Lock, Eye, EyeOff, Shield, Calendar, CheckCircle2, Camera, Upload, Settings, KeyRound } from "lucide-react";
import Header from "@/components/Header";

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
  
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(user?.profileImageUrl || null);

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
  
  useEffect(() => {
    if (!username || username === user?.username) {
      setUsernameStatus('idle');
      return;
    }

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

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Image size must be less than 2MB",
        variant: "destructive",
      });
      return;
    }

    setProfilePicture(file);
    
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-500 text-sm">Loading your account...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => setLocation('/')}
          className="mb-6 text-gray-600 hover:text-gray-900 hover:bg-gray-100 -ml-2"
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-sm">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
          </div>
          <p className="text-gray-500 ml-[52px]">Manage your personal information and security preferences</p>
        </div>

        <div className="space-y-6">
          {/* Account Overview Card */}
          <Card data-testid="account-details-card" className="bg-white border border-gray-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-white border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Shield className="w-4.5 h-4.5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-gray-900 text-lg font-semibold">Account Overview</CardTitle>
                  <CardDescription className="text-gray-500 text-sm">Your account information and status</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-5 pb-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Account Type</p>
                  <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-0 font-medium" data-testid="text-role">
                    {user?.role || 'N/A'}
                  </Badge>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Account Status</p>
                  <div data-testid="text-status">
                    {user?.isActive ? (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-0 font-medium">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-0 font-medium">Inactive</Badge>
                    )}
                  </div>
                </div>
                {user?.createdAt && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Member Since</p>
                    <p className="font-semibold text-gray-900" data-testid="text-created-at">
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

          {/* Profile Picture Card */}
          <Card data-testid="profile-picture-card" className="bg-white border border-gray-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-white border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center">
                  <Camera className="w-4.5 h-4.5 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-gray-900 text-lg font-semibold">Profile Picture</CardTitle>
                  <CardDescription className="text-gray-500 text-sm">
                    Upload a profile picture to personalize your account
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-5 pb-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Avatar Preview */}
                <div className="flex-shrink-0">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-100 shadow-sm bg-gray-100">
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt="Profile"
                          className="w-full h-full object-cover"
                          data-testid="img-profile-preview"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                          <User className="w-10 h-10 text-gray-400" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Upload Controls */}
                <div className="flex-1 space-y-4 w-full">
                  <div>
                    <Label htmlFor="profile-picture-file" className="text-sm font-medium text-gray-700 mb-2 block">
                      Choose Profile Picture
                    </Label>
                    <Input
                      id="profile-picture-file"
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureChange}
                      className="border-gray-200 focus:border-purple-500 focus:ring-purple-500 text-sm"
                      data-testid="input-profile-picture"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Accepted formats: JPG, PNG, WEBP. Max size: 2MB
                    </p>
                  </div>

                  <Button
                    onClick={handleUploadProfilePicture}
                    disabled={!profilePicture || uploadProfilePictureMutation.isPending}
                    className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium"
                    data-testid="button-upload-profile-picture"
                  >
                    {uploadProfilePictureMutation.isPending ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Picture
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Information Card */}
          <Card data-testid="profile-card" className="bg-white border border-gray-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-white border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
                  <User className="w-4.5 h-4.5 text-gray-600" />
                </div>
                <div>
                  <CardTitle className="text-gray-900 text-lg font-semibold">Personal Information</CardTitle>
                  <CardDescription className="text-gray-500 text-sm">
                    Update your personal information and contact details
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-5 pb-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName" className="text-sm font-medium text-gray-700 mb-1.5 block">
                      First Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Enter your first name"
                      className="border-gray-200 focus:border-gray-400 focus:ring-gray-400 text-sm h-10"
                      data-testid="input-first-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-sm font-medium text-gray-700 mb-1.5 block">
                      Last Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Enter your last name"
                      className="border-gray-200 focus:border-gray-400 focus:ring-gray-400 text-sm h-10"
                      data-testid="input-last-name"
                    />
                  </div>
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
                    placeholder="Enter your email"
                    className="border-gray-200 focus:border-gray-400 focus:ring-gray-400 text-sm h-10"
                    data-testid="input-email"
                  />
                </div>

                <div>
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter your phone number"
                    className="border-gray-200 focus:border-gray-400 focus:ring-gray-400 text-sm h-10"
                    data-testid="input-phone"
                  />
                </div>

                <div>
                  <Label htmlFor="username" className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    Username
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Choose a username"
                    className="border-gray-200 focus:border-gray-400 focus:ring-gray-400 text-sm h-10"
                    data-testid="input-username"
                  />
                  {username && username !== user?.username && (
                    <p className={`text-xs mt-1.5 flex items-center gap-1 ${
                      usernameStatus === 'checking' ? 'text-gray-500' :
                      usernameStatus === 'available' ? 'text-green-600' :
                      usernameStatus === 'taken' ? 'text-red-600' :
                      'text-gray-500'
                    }`}>
                      {usernameStatus === 'checking' && 'Checking availability...'}
                      {usernameStatus === 'available' && 'Username is available'}
                      {usernameStatus === 'taken' && 'Username is already taken'}
                      {usernameStatus === 'idle' && 'Username must be 3-30 characters (letters, numbers, -, _)'}
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation('/')}
                    className="flex-1 border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-medium"
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateProfileMutation.isPending || usernameStatus === 'taken' || usernameStatus === 'checking'}
                    className="flex-1 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium"
                    data-testid="button-save"
                  >
                    {updateProfileMutation.isPending ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                        Saving...
                      </>
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
          <Card data-testid="change-password-card" className="bg-white border border-gray-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-white border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center">
                  <KeyRound className="w-4.5 h-4.5 text-amber-600" />
                </div>
                <div>
                  <CardTitle className="text-gray-900 text-lg font-semibold">Security Settings</CardTitle>
                  <CardDescription className="text-gray-500 text-sm">
                    Update your password to keep your account secure
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-5 pb-6">
              <form onSubmit={handlePasswordSubmit} className="space-y-5">
                <div>
                  <Label htmlFor="currentPassword" className="text-sm font-medium text-gray-700 mb-1.5 block">
                    Current Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter your current password"
                      className="border-gray-200 focus:border-gray-400 focus:ring-gray-400 text-sm h-10 pr-10"
                      data-testid="input-current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                  <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700 mb-1.5 block">
                    New Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter your new password"
                      className="border-gray-200 focus:border-gray-400 focus:ring-gray-400 text-sm h-10 pr-10"
                      data-testid="input-new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      data-testid="toggle-new-password"
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5">
                    Minimum 8 characters with uppercase, lowercase, and numbers
                  </p>
                </div>

                <div>
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 mb-1.5 block">
                    Confirm New Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your new password"
                      className="border-gray-200 focus:border-gray-400 focus:ring-gray-400 text-sm h-10 pr-10"
                      data-testid="input-confirm-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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

                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                    className="flex-1 border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-medium"
                    data-testid="button-cancel-password"
                  >
                    Clear
                  </Button>
                  <Button
                    type="submit"
                    disabled={updatePasswordMutation.isPending}
                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium"
                    data-testid="button-update-password"
                  >
                    {updatePasswordMutation.isPending ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                        Updating...
                      </>
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
