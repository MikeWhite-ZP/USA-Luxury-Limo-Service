import { useState, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Image as ImageIcon, Trash2, Edit2, FolderOpen, X, Star, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type CmsMedia = {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  folder: 'logos' | 'hero-images' | 'vehicles' | 'testimonials' | 'general';
  altText: string;
  description: string;
  width: number | null;
  height: number | null;
  uploadedBy: string;
  uploadedAt: string;
};

type FolderType = 'all' | 'logos' | 'hero-images' | 'vehicles' | 'testimonials' | 'general';

export default function MediaLibrary() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFolder, setSelectedFolder] = useState<FolderType>('all');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<CmsMedia | null>(null);
  const [mediaToDelete, setMediaToDelete] = useState<CmsMedia | null>(null);
  const [uploadFolder, setUploadFolder] = useState<'logos' | 'hero-images' | 'vehicles' | 'testimonials' | 'general'>('general');
  const [isDragging, setIsDragging] = useState(false);
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const heroFileInputRef = useRef<HTMLInputElement>(null);

  // Fetch all media
  const { data: allMedia, isLoading } = useQuery<CmsMedia[]>({
    queryKey: ['/api/admin/cms/media'],
  });

  // Fetch current site logo
  const { data: siteLogoData } = useQuery<{ logo: { id: string; url: string; altText: string; fileName: string; } | null }>({
    queryKey: ['/api/site-logo'],
  });

  const activeSiteLogoId = siteLogoData?.logo?.id;

  // Fetch current site hero image
  const { data: siteHeroData } = useQuery<{ hero: { id: string; url: string; altText: string; fileName: string; } | null }>({
    queryKey: ['/api/site-hero'],
  });

  const activeSiteHeroId = siteHeroData?.hero?.id;

  // Filter media by folder
  const displayedMedia = selectedFolder === 'all' 
    ? allMedia 
    : allMedia?.filter(m => m.folder === selectedFolder);

  // Upload mutation
  const uploadMedia = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/admin/cms/media/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Upload failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/cms/media'] });
      setUploadDialogOpen(false);
      toast({
        title: 'Success',
        description: 'Media uploaded successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to upload media',
        variant: 'destructive',
      });
    },
  });

  // Update mutation
  const updateMedia = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CmsMedia> }) => {
      return apiRequest('PUT', `/api/admin/cms/media/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/cms/media'] });
      setEditDialogOpen(false);
      toast({
        title: 'Success',
        description: 'Media updated successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update media',
        variant: 'destructive',
      });
    },
  });

  // Delete mutation
  const deleteMedia = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/admin/cms/media/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/cms/media'] });
      queryClient.invalidateQueries({ queryKey: ['/api/site-logo'] });
      queryClient.invalidateQueries({ queryKey: ['/api/site-hero'] });
      setDeleteDialogOpen(false);
      setMediaToDelete(null);
      toast({
        title: 'Success',
        description: 'Media deleted successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete media',
        variant: 'destructive',
      });
    },
  });

  // Set as site logo mutation
  const setSiteLogoMutation = useMutation({
    mutationFn: async (mediaId: string) => {
      return apiRequest('POST', '/api/admin/site-logo', { mediaId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/site-logo'] });
      toast({
        title: 'Success',
        description: 'Site logo updated successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to set site logo',
        variant: 'destructive',
      });
    },
  });

  // Handle file upload
  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', uploadFolder);
    formData.append('altText', '');
    formData.append('description', '');

    uploadMedia.mutate(formData);
  };

  // Logo upload mutation with automatic activation
  const uploadLogoMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const uploadResponse = await fetch('/api/admin/cms/media/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      if (!uploadResponse.ok) throw new Error('Upload failed');
      const uploadData = await uploadResponse.json();
      
      if (uploadData.id) {
        const setLogoResponse = await apiRequest('POST', '/api/admin/site-logo', { mediaId: uploadData.id });
        await setLogoResponse.json();
      }
      
      return uploadData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/cms/media'] });
      queryClient.invalidateQueries({ queryKey: ['/api/site-logo'] });
      if (logoFileInputRef.current) {
        logoFileInputRef.current.value = '';
      }
      toast({
        title: 'Success',
        description: 'Logo uploaded and activated successfully',
      });
    },
    onError: (error: Error) => {
      if (logoFileInputRef.current) {
        logoFileInputRef.current.value = '';
      }
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload and activate logo',
        variant: 'destructive',
      });
    },
  });

  // Handle logo upload
  const handleLogoUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'logos');
    formData.append('altText', 'Site Logo');
    formData.append('description', 'Main site logo');

    uploadLogoMutation.mutate(formData);
  };

  // Hero upload mutation with automatic activation
  const uploadHeroMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const uploadResponse = await fetch('/api/admin/cms/media/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      if (!uploadResponse.ok) throw new Error('Upload failed');
      const uploadData = await uploadResponse.json();
      
      if (uploadData.id) {
        const setHeroResponse = await apiRequest('POST', '/api/admin/site-hero', { mediaId: uploadData.id });
        await setHeroResponse.json();
      }
      
      return uploadData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/cms/media'] });
      queryClient.invalidateQueries({ queryKey: ['/api/site-hero'] });
      if (heroFileInputRef.current) {
        heroFileInputRef.current.value = '';
      }
      toast({
        title: 'Success',
        description: 'Hero image uploaded and activated successfully',
      });
    },
    onError: (error: Error) => {
      if (heroFileInputRef.current) {
        heroFileInputRef.current.value = '';
      }
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload and activate hero image',
        variant: 'destructive',
      });
    },
  });

  // Set as site hero mutation
  const setSiteHeroMutation = useMutation({
    mutationFn: async (mediaId: string) => {
      return apiRequest('POST', '/api/admin/site-hero', { mediaId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/site-hero'] });
      toast({
        title: 'Success',
        description: 'Site hero image updated successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to set site hero image',
        variant: 'destructive',
      });
    },
  });

  // Handle hero upload
  const handleHeroUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'hero-images');
    formData.append('altText', 'Site Hero Image');
    formData.append('description', 'Main site hero background image');

    uploadHeroMutation.mutate(formData);
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Folder labels
  const folderLabels: Record<FolderType, string> = {
    all: 'All Media',
    logos: 'Logos',
    'hero-images': 'Hero Images',
    vehicles: 'Vehicles',
    testimonials: 'Testimonials',
    general: 'General',
  };

  // Get current logo media object
  const currentLogoMedia = allMedia?.find(m => m.id === activeSiteLogoId);

  // Get current hero media object
  const currentHeroMedia = allMedia?.find(m => m.id === activeSiteHeroId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Logo Management Section */}
      <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50" data-testid="card-logo-management">
        <CardHeader className="border-b border-emerald-200/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-600 p-2.5 rounded-lg">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-emerald-900">Site Logo</CardTitle>
                <CardDescription className="text-emerald-700">Manage your website's primary logo</CardDescription>
              </div>
            </div>
            {currentLogoMedia && (
              <Badge className="bg-emerald-600 text-white" data-testid="badge-logo-status">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                Active Logo
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {currentLogoMedia ? (
            <div className="grid md:grid-cols-[300px_1fr] gap-6">
              {/* Logo Preview */}
              <div className="space-y-3">
                <div className="aspect-square bg-white rounded-xl border-2 border-emerald-200 shadow-sm flex items-center justify-center p-6 overflow-hidden">
                  <img
                    src={currentLogoMedia.fileUrl}
                    alt={currentLogoMedia.altText || 'Site Logo'}
                    className="max-w-full max-h-full object-contain"
                    data-testid="img-current-logo"
                  />
                </div>
                <div className="text-sm text-center space-y-1">
                  <p className="font-medium text-slate-900" data-testid="text-logo-filename">{currentLogoMedia.fileName}</p>
                  <p className="text-slate-600" data-testid="text-logo-filesize">{formatFileSize(currentLogoMedia.fileSize)}</p>
                </div>
              </div>

              {/* Logo Info and Actions */}
              <div className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-semibold text-slate-700">Alt Text</Label>
                    <p className="text-sm text-slate-900 mt-1" data-testid="text-logo-alt">{currentLogoMedia.altText || 'No alt text set'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-slate-700">Description</Label>
                    <p className="text-sm text-slate-900 mt-1" data-testid="text-logo-description">{currentLogoMedia.description || 'No description set'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-slate-700">Uploaded</Label>
                    <p className="text-sm text-slate-900 mt-1" data-testid="text-logo-uploaded">{new Date(currentLogoMedia.uploadedAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedMedia(currentLogoMedia);
                      setEditDialogOpen(true);
                    }}
                    className="flex-1 border-emerald-300 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800"
                    data-testid="button-edit-logo"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Details
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => logoFileInputRef.current?.click()}
                    className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-100 hover:text-blue-800"
                    data-testid="button-change-logo"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Change Logo
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setMediaToDelete(currentLogoMedia);
                      setDeleteDialogOpen(true);
                    }}
                    disabled={deleteMedia.isPending}
                    data-testid="button-delete-logo"
                  >
                    {deleteMedia.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4 mr-2" />
                    )}
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="inline-block p-4 bg-white rounded-full border-2 border-dashed border-emerald-300 mb-4">
                <ImageIcon className="w-12 h-12 text-emerald-600" />
              </div>
              <p className="text-lg font-semibold text-slate-900 mb-2">No Active Logo Set</p>
              <p className="text-sm text-slate-600 mb-4">Upload a logo to get started</p>
              <Button
                onClick={() => logoFileInputRef.current?.click()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                data-testid="button-upload-logo"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Logo
              </Button>
            </div>
          )}
          <Input
            ref={logoFileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleLogoUpload(e.target.files)}
            className="hidden"
            data-testid="input-logo-upload"
          />
        </CardContent>
      </Card>

      {/* Hero Image Management Section */}
      <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50" data-testid="card-hero-management">
        <CardHeader className="border-b border-emerald-200/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-600 p-2.5 rounded-lg">
                <ImageIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-emerald-900">Hero Background Image</CardTitle>
                <CardDescription className="text-emerald-700">Manage your website's hero section background</CardDescription>
              </div>
            </div>
            {currentHeroMedia && (
              <Badge className="bg-emerald-600 text-white" data-testid="badge-hero-status">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                Active Hero
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {currentHeroMedia ? (
            <div className="grid md:grid-cols-[300px_1fr] gap-6">
              {/* Hero Preview */}
              <div className="space-y-3">
                <div className="aspect-video bg-white rounded-xl border-2 border-emerald-200 shadow-sm flex items-center justify-center p-4 overflow-hidden">
                  <img
                    src={currentHeroMedia.fileUrl}
                    alt={currentHeroMedia.altText || 'Site Hero Image'}
                    className="max-w-full max-h-full object-contain"
                    data-testid="img-current-hero"
                  />
                </div>
                <div className="text-sm text-center space-y-1">
                  <p className="font-medium text-slate-900" data-testid="text-hero-filename">{currentHeroMedia.fileName}</p>
                  <p className="text-slate-600" data-testid="text-hero-filesize">{formatFileSize(currentHeroMedia.fileSize)}</p>
                </div>
              </div>

              {/* Hero Info and Actions */}
              <div className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-semibold text-slate-700">Alt Text</Label>
                    <p className="text-sm text-slate-900 mt-1" data-testid="text-hero-alt">{currentHeroMedia.altText || 'No alt text set'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-slate-700">Description</Label>
                    <p className="text-sm text-slate-900 mt-1" data-testid="text-hero-description">{currentHeroMedia.description || 'No description set'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-slate-700">Uploaded</Label>
                    <p className="text-sm text-slate-900 mt-1" data-testid="text-hero-uploaded">{new Date(currentHeroMedia.uploadedAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedMedia(currentHeroMedia);
                      setEditDialogOpen(true);
                    }}
                    className="flex-1 border-emerald-300 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800"
                    data-testid="button-edit-hero"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Details
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => heroFileInputRef.current?.click()}
                    className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-100 hover:text-blue-800"
                    data-testid="button-change-hero"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Change Hero Image
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setMediaToDelete(currentHeroMedia);
                      setDeleteDialogOpen(true);
                    }}
                    disabled={deleteMedia.isPending}
                    data-testid="button-delete-hero"
                  >
                    {deleteMedia.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4 mr-2" />
                    )}
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="inline-block p-4 bg-white rounded-full border-2 border-dashed border-emerald-300 mb-4">
                <ImageIcon className="w-12 h-12 text-emerald-600" />
              </div>
              <p className="text-lg font-semibold text-slate-900 mb-2">No Active Hero Image Set</p>
              <p className="text-sm text-slate-600 mb-4">Upload a hero background image to get started</p>
              <Button
                onClick={() => heroFileInputRef.current?.click()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                data-testid="button-upload-hero"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Hero Image
              </Button>
            </div>
          )}
          <Input
            ref={heroFileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleHeroUpload(e.target.files)}
            className="hidden"
            data-testid="input-hero-upload"
          />
        </CardContent>
      </Card>

      {/* Header with Upload Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold" data-testid="title-media-library">Media Library</h3>
          <p className="text-sm text-muted-foreground">Manage your website images and files</p>
        </div>
        <Button onClick={() => setUploadDialogOpen(true)} data-testid="button-upload-media">
          <Upload className="w-4 h-4 mr-2" />
          Upload Media
        </Button>
      </div>
      {/* Folder Tabs */}
      <Tabs value={selectedFolder} onValueChange={(v) => setSelectedFolder(v as FolderType)}>
        <TabsList className="grid w-full grid-cols-6" data-testid="tabs-folders">
          <TabsTrigger value="all" data-testid="tab-all">All ({allMedia?.length || 0})</TabsTrigger>
          <TabsTrigger value="logos" data-testid="tab-logos">Logos</TabsTrigger>
          <TabsTrigger value="hero-images" data-testid="tab-hero-images">Hero</TabsTrigger>
          <TabsTrigger value="vehicles" data-testid="tab-vehicles">Vehicles</TabsTrigger>
          <TabsTrigger value="testimonials" data-testid="tab-testimonials">Testimonials</TabsTrigger>
          <TabsTrigger value="general" data-testid="tab-general">General</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedFolder} className="space-y-4 mt-4">
          {/* Media Grid */}
          {displayedMedia && displayedMedia.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" data-testid="grid-media">
              {displayedMedia.map((media) => (
                <Card key={media.id} className={`overflow-hidden group relative ${media.id === activeSiteLogoId || media.id === activeSiteHeroId ? 'ring-2 ring-green-500' : ''}`} data-testid={`card-media-${media.id}`}>
                  {/* Image Preview */}
                  <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden relative">
                    {media.fileType.startsWith('image/') ? (
                      <img
                        src={media.fileUrl}
                        alt={media.altText || media.fileName}
                        className="w-full h-full object-cover"
                        data-testid={`img-preview-${media.id}`}
                      />
                    ) : (
                      <ImageIcon className="w-12 h-12 text-muted-foreground" />
                    )}
                    {media.id === activeSiteLogoId && (
                      <Badge className="absolute top-2 right-2 bg-green-600" data-testid={`badge-active-logo-${media.id}`}>
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Active Logo
                      </Badge>
                    )}
                    {media.id === activeSiteHeroId && (
                      <Badge className="absolute top-2 right-2 bg-green-600" data-testid={`badge-active-hero-${media.id}`}>
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Active Hero
                      </Badge>
                    )}
                  </div>

                  {/* Action Buttons - Bottom positioned */}
                  <div className="absolute bottom-0 left-0 right-0 p-2 from-black/80 to-transparent flex items-center justify-center gap-2 bg-[#ffffff] z-10">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMedia(media);
                        setEditDialogOpen(true);
                      }}
                      data-testid={`button-edit-${media.id}`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMediaToDelete(media);
                        setDeleteDialogOpen(true);
                      }}
                      disabled={deleteMedia.isPending}
                      data-testid={`button-delete-${media.id}`}
                    >
                      {deleteMedia.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                    {media.folder === 'logos' && (
                      <Button
                        size="sm"
                        variant={media.id === activeSiteLogoId ? "default" : "secondary"}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (media.id !== activeSiteLogoId) {
                            setSiteLogoMutation.mutate(media.id);
                          }
                        }}
                        disabled={setSiteLogoMutation.isPending || media.id === activeSiteLogoId}
                        className={media.id === activeSiteLogoId ? "bg-green-600 hover:bg-green-700" : ""}
                        data-testid={`button-set-logo-${media.id}`}
                      >
                        <Star className="w-4 h-4" />
                      </Button>
                    )}
                    {media.folder === 'hero-images' && (
                      <Button
                        size="sm"
                        variant={media.id === activeSiteHeroId ? "default" : "secondary"}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (media.id !== activeSiteHeroId) {
                            setSiteHeroMutation.mutate(media.id);
                          }
                        }}
                        disabled={setSiteHeroMutation.isPending || media.id === activeSiteHeroId}
                        className={media.id === activeSiteHeroId ? "bg-green-600 hover:bg-green-700" : ""}
                        data-testid={`button-set-hero-${media.id}`}
                      >
                        <ImageIcon className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {/* Media Info */}
                  <CardContent className="p-3">
                    <p className="text-sm font-medium truncate" data-testid={`text-filename-${media.id}`}>
                      {media.fileName}
                    </p>
                    <p className="text-xs text-muted-foreground" data-testid={`text-filesize-${media.id}`}>
                      {formatFileSize(media.fileSize)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground" data-testid="empty-state">
              <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No media in {folderLabels[selectedFolder]}</p>
              <p className="text-sm mt-2">Upload some files to get started</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg bg-[#ffffff] pl-[10px] pr-[10px] pt-[10px] pb-[10px]" data-testid="dialog-upload">
          <DialogHeader>
            <DialogTitle>Upload Media</DialogTitle>
            <DialogDescription>Choose a folder and upload your file</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Folder Selection */}
            <div className="space-y-2">
              <Label>Folder</Label>
              <Select value={uploadFolder} onValueChange={(v: any) => setUploadFolder(v)}>
                <SelectTrigger data-testid="select-upload-folder">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="logos">Logos</SelectItem>
                  <SelectItem value="hero-images">Hero Images</SelectItem>
                  <SelectItem value="vehicles">Vehicles</SelectItem>
                  <SelectItem value="testimonials">Testimonials</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Drag and Drop Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              data-testid="dropzone-upload"
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm font-medium">Drag and drop a file here</p>
              <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
                data-testid="input-file-upload"
              />
            </div>
          </div>

          {uploadMedia.isPending && (
            <div className="flex items-center justify-center gap-2 text-sm" data-testid="status-uploading">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Uploading...</span>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg bg-[#ffffff] pt-[10px] pb-[10px] pl-[10px] pr-[10px] text-[12px]" data-testid="dialog-edit" key={selectedMedia?.id || 'new'}>
          <DialogHeader>
            <DialogTitle>Edit Media</DialogTitle>
            <DialogDescription>Update media information</DialogDescription>
          </DialogHeader>

          {selectedMedia && (
            <div className="space-y-4">
              {/* Preview */}
              <div className="aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                {selectedMedia.fileType.startsWith('image/') ? (
                  <img
                    src={selectedMedia.fileUrl}
                    alt={selectedMedia.altText}
                    className="max-w-full max-h-full object-contain"
                    data-testid="img-edit-preview"
                  />
                ) : (
                  <ImageIcon className="w-12 h-12 text-muted-foreground" />
                )}
              </div>

              {/* Alt Text - Controlled */}
              <div className="space-y-2">
                <Label htmlFor="edit-alt-text">Alt Text</Label>
                <Input
                  id="edit-alt-text"
                  data-testid="input-edit-alt-text"
                  value={selectedMedia.altText}
                  placeholder="Descriptive text for screen readers"
                  onChange={(e) => {
                    if (selectedMedia) {
                      setSelectedMedia({ ...selectedMedia, altText: e.target.value });
                    }
                  }}
                />
              </div>

              {/* Description - Controlled */}
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  data-testid="input-edit-description"
                  value={selectedMedia.description}
                  placeholder="Additional notes about this media"
                  rows={3}
                  onChange={(e) => {
                    if (selectedMedia) {
                      setSelectedMedia({ ...selectedMedia, description: e.target.value });
                    }
                  }}
                />
              </div>

              {/* File Info */}
              <div className="text-xs text-muted-foreground space-y-1" data-testid="text-file-info">
                <p>File: {selectedMedia.fileName}</p>
                <p>Size: {formatFileSize(selectedMedia.fileSize)}</p>
                <p>Type: {selectedMedia.fileType}</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} data-testid="button-cancel-edit">
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedMedia) {
                  updateMedia.mutate({
                    id: selectedMedia.id,
                    data: {
                      altText: selectedMedia.altText,
                      description: selectedMedia.description,
                    },
                  });
                }
              }}
              disabled={updateMedia.isPending}
              data-testid="button-save-edit"
            >
              {updateMedia.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-white" data-testid="dialog-delete-confirm">
          <DialogHeader>
            <DialogTitle>Delete Media</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this media? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {mediaToDelete && (
            <div className="space-y-4">
              {/* Preview */}
              <div className="aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                {mediaToDelete.fileType.startsWith('image/') ? (
                  <img
                    src={mediaToDelete.fileUrl}
                    alt={mediaToDelete.altText}
                    className="max-w-full max-h-full object-contain"
                    data-testid="img-delete-preview"
                  />
                ) : (
                  <ImageIcon className="w-12 h-12 text-muted-foreground" />
                )}
              </div>

              {/* File Info */}
              <div className="text-sm space-y-1" data-testid="text-delete-info">
                <p className="font-medium">{mediaToDelete.fileName}</p>
                <p className="text-muted-foreground">
                  {mediaToDelete.folder.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setDeleteDialogOpen(false);
                setMediaToDelete(null);
              }} 
              data-testid="button-cancel-delete"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (mediaToDelete) {
                  deleteMedia.mutate(mediaToDelete.id);
                }
              }}
              disabled={deleteMedia.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMedia.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
