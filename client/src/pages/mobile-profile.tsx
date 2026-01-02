import { useState } from 'react';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { ArrowLeft, Camera, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { LanguageSwitcherCompact } from '@/components/LanguageSwitcher';

const defaultUserImage = '/images/default-user_1762118764894.png';

function formatImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('data:') || url.startsWith('http') || url.startsWith('/')) {
    return url;
  }
  return `/api/uploads/${url}`;
}

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
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);

  const { data: documents } = useQuery<DriverDocument[]>({
    queryKey: ['/api/driver/documents'],
    retry: false,
  });

  const profilePhotoDoc = documents?.find(doc => doc.documentType === 'profile_photo');
  
  const rawUrl = localPreviewUrl || profilePhotoDoc?.documentUrl || user?.profileImageUrl || null;
  const displayUrl = formatImageUrl(rawUrl);
  const isPending = profilePhotoDoc?.status === 'pending';
  const isApproved = profilePhotoDoc?.status === 'approved';
  const isRejected = profilePhotoDoc?.status === 'rejected';

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
        throw new Error(error.message || t('common.error'));
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
        title: t('common.success'),
        description: t('common.upload') + ' ' + t('status.pending').toLowerCase(),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: t('common.error'),
        description: t('validation.required'),
        variant: "destructive",
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: t('common.error'),
        description: t('validation.maxLength', { max: '2MB' }),
        variant: "destructive",
      });
      return;
    }

    setProfilePicture(file);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setLocalPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = () => {
    if (!profilePicture) {
      toast({
        title: t('common.error'),
        description: t('validation.required'),
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate(profilePicture);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-background dark:from-background">
      {/* Header with safe area for phone notch/camera */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 pt-[54px] shadow-lg sticky top-0 z-10">
        <div className="flex items-center justify-between">
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
            <h1 className="text-2xl font-bold" data-testid="header-title">{t('nav.profile')}</h1>
          </div>
          <LanguageSwitcherCompact className="text-white" />
        </div>
        <p className="text-green-50 text-sm mt-2 ml-14">{t('common.update')} {t('nav.profile').toLowerCase()}</p>
      </div>
      {/* Profile Picture Card */}
      <div className="p-4">
        <Card className="bg-card border-green-200 dark:border-green-800 shadow-md" data-testid="card-profile-picture">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Camera className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">{t('nav.profile')}</h3>
                  <p className="text-xs text-muted-foreground">{t('common.update')}</p>
                </div>
              </div>
            </div>

            {/* Avatar Preview */}
            <div className="flex justify-center py-4">
              <div className="relative">
                <div className={`w-32 h-32 rounded-full overflow-hidden border-4 shadow-lg bg-card ${
                  isPending ? 'border-yellow-300' : isRejected ? 'border-red-300' : 'border-green-100 dark:border-green-800'
                }`}>
                  <img
                    src={displayUrl || defaultUserImage}
                    alt={t('nav.profile')}
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
                <p className="text-sm text-yellow-800 font-medium">⏳ {t('status.pending')}</p>
                <p className="text-xs text-yellow-600 mt-1">{t('status.pendingDriverAcceptance')}</p>
              </div>
            )}
            {isRejected && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                <p className="text-sm text-red-800 font-medium">❌ {t('status.cancelled')}</p>
                <p className="text-xs text-red-600 mt-1">{profilePhotoDoc?.rejectionReason || t('errors.tryAgain')}</p>
              </div>
            )}
            {isApproved && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                <p className="text-sm text-green-800 font-medium">✓ {t('status.confirmed')}</p>
                <p className="text-xs text-green-600 mt-1">{t('status.active')}</p>
              </div>
            )}

            {/* Upload Controls */}
            <div className="space-y-3">
              <div>
                <Label htmlFor="profile-picture-file" className="text-muted-foreground font-medium mb-2 block">
                  {displayUrl ? t('common.update') : t('common.upload')}
                </Label>
                <Input
                  id="profile-picture-file"
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={handleFileChange}
                  className="bg-card border-border"
                  data-testid="input-profile-picture-file"
                />
                <p className="text-xs mt-1 text-muted-foreground">{t('validation.required')}</p>
              </div>
              
              <Button
                onClick={handleUpload}
                disabled={!profilePicture || uploadMutation.isPending}
                className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-base font-semibold rounded-xl shadow-md"
                data-testid="button-upload-profile-picture"
              >
                <Upload className="w-5 h-5 mr-2" />
                {uploadMutation.isPending ? t('common.loading') : t('common.upload')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
