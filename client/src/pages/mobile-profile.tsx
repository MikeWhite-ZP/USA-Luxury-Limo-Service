import { useState } from 'react';
import { useLocation } from 'wouter';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { ArrowLeft, Camera, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

const defaultUserImage = '/images/default-user_1762118764894.png';

interface DriverDocument {
  id: string;
  driverId: string;
  documentType: 'driver_license' | 'limo_license' | 'insurance_certificate' | 'vehicle_image' | 'profile_photo';
  documentUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
}

export default function MobileProfile() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);

  // Fetch driver documents to check profile photo approval status
  const { data: documents } = useQuery<DriverDocument[]>({
    queryKey: ['/api/driver/documents'],
    retry: false,
  });

  // Find profile photo document
  const profilePhotoDoc = documents?.find(doc => doc.documentType === 'profile_photo');
  
  // Show profile picture if it exists (pending or approved)
  const displayUrl = localPreviewUrl || profilePhotoDoc?.documentUrl || user?.profileImageUrl || null;
  const isPending = profilePhotoDoc?.status === 'pending';
  const isApproved = profilePhotoDoc?.status === 'approved';
  const isRejected = profilePhotoDoc?.status === 'rejected';

  // Upload profile picture mutation
  const uploadMutation = useMutation({
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
      queryClient.invalidateQueries({ queryKey: ['/api/driver/documents'] });
      queryClient.setQueryData(['/api/auth/user'], updatedUser);
      setProfilePicture(null);
      setLocalPreviewUrl(null);
      toast({
        title: "Profile Picture Uploaded",
        description: "Your profile picture has been uploaded and is pending approval",
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setLocalPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = () => {
    if (!profilePicture) {
      toast({
        title: "No File Selected",
        description: "Please select a profile picture to upload",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate(profilePicture);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 shadow-lg sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/mobile-driver')}
            className="text-white hover:bg-primary-foreground/20 dark:bg-primary-foreground/25"
            data-testid="button-back"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-2xl font-bold" data-testid="header-title">My Profile</h1>
        </div>
        <p className="text-green-50 text-sm mt-2 ml-14">Update your profile picture</p>
      </div>
      {/* Profile Picture Card */}
      <div className="p-4">
        <Card className="bg-white border-green-200 shadow-md" data-testid="card-profile-picture">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Camera className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Profile Picture</h3>
                  <p className="text-xs text-gray-500">Update your photo</p>
                </div>
              </div>
            </div>

            {/* Avatar Preview */}
            <div className="flex justify-center py-4">
              <div className="relative">
                <div className={`w-32 h-32 rounded-full overflow-hidden border-4 shadow-lg bg-white ${
                  isPending ? 'border-yellow-300' : isRejected ? 'border-red-300' : 'border-green-100'
                }`}>
                  <img
                    src={displayUrl || defaultUserImage}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    data-testid="img-profile-preview"
                  />
                </div>
                <div className={`absolute bottom-0 right-0 w-10 h-10 rounded-full flex items-center justify-center shadow-md border-2 border-white ${
                  isPending ? 'bg-yellow-500' : isRejected ? 'bg-red-500' : 'bg-green-600'
                }`}>
                  <Camera className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>

            {/* Status Badge */}
            {isPending && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                <p className="text-sm text-yellow-800 font-medium">⏳ Pending Approval</p>
                <p className="text-xs text-yellow-600 mt-1">Your photo is awaiting admin review</p>
              </div>
            )}
            {isRejected && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                <p className="text-sm text-red-800 font-medium">❌ Rejected</p>
                <p className="text-xs text-red-600 mt-1">{profilePhotoDoc?.rejectionReason || 'Please upload a new photo'}</p>
              </div>
            )}
            {isApproved && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                <p className="text-sm text-green-800 font-medium">✓ Approved</p>
                <p className="text-xs text-green-600 mt-1">Your profile picture is active</p>
              </div>
            )}

            {/* Upload Controls */}
            <div className="space-y-3">
              <div>
                <Label htmlFor="profile-picture-file" className="text-gray-700 font-medium mb-2 block">
                  {displayUrl ? 'Replace Photo' : 'Upload Photo'}
                </Label>
                <Input
                  id="profile-picture-file"
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={handleFileChange}
                  className="bg-white border-gray-300"
                  data-testid="input-profile-picture-file"
                />
                <p className="text-xs mt-1 text-gray-500">Image only, max 2MB. Photo will be visible immediately but requires admin approval.</p>
              </div>
              
              <Button
                onClick={handleUpload}
                disabled={!profilePicture || uploadMutation.isPending}
                className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-base font-semibold rounded-xl shadow-md"
                data-testid="button-upload-profile-picture"
              >
                <Upload className="w-5 h-5 mr-2" />
                {uploadMutation.isPending ? 'Uploading...' : 'Upload Photo'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
