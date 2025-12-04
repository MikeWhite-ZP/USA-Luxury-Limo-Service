import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Settings, Palette, Share2, Mail, Globe, Pencil, Trash2 } from 'lucide-react';

type CmsSetting = {
  id: string;
  key: string;
  value: string;
  category: 'branding' | 'colors' | 'social' | 'contact' | 'seo';
  description: string | null;
  updatedAt: string;
};

type SiteMediaData = {
  id: string;
  url: string;
  altText: string;
  fileName: string;
} | null;

export default function BrandSettings() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('branding');

  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  const [primaryColor, setPrimaryColor] = useState('#1a1a1a');
  const [secondaryColor, setSecondaryColor] = useState('#666666');
  const [accentColor, setAccentColor] = useState('#d4af37');

  const { data: settings, isLoading } = useQuery<CmsSetting[]>({
    queryKey: ['/api/admin/cms/settings'],
  });

  const { data: siteLogoData } = useQuery<{ logo: SiteMediaData }>({
    queryKey: ['/api/site-logo'],
  });

  const { data: siteFaviconData } = useQuery<{ favicon: SiteMediaData }>({
    queryKey: ['/api/site-favicon'],
  });

  useEffect(() => {
    if (settings) {
      const primary = settings.find(s => s.key === 'BRAND_PRIMARY_COLOR')?.value;
      const secondary = settings.find(s => s.key === 'BRAND_SECONDARY_COLOR')?.value;
      const accent = settings.find(s => s.key === 'BRAND_ACCENT_COLOR')?.value;

      if (primary) setPrimaryColor(primary);
      if (secondary) setSecondaryColor(secondary);
      if (accent) setAccentColor(accent);
    }
  }, [settings]);

  const saveSetting = useMutation({
    mutationFn: async (data: { key: string; value: string; category: string; description?: string }) => {
      return apiRequest('/api/admin/cms/settings', 'PUT', { 
        key: data.key,
        value: data.value, 
        category: data.category, 
        description: data.description 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/cms/settings'] });
      toast({
        title: 'Success',
        description: 'Setting saved successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to save setting',
        variant: 'destructive',
      });
    },
  });

  const getSetting = (key: string): string => {
    const setting = settings?.find((s) => s.key === key);
    return setting?.value || '';
  };

  const handleSettingChange = (key: string, value: string, category: string, description?: string) => {
    saveSetting.mutate({ key, value, category, description });
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>, logoType: 'logo' | 'favicon') => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'File size must be less than 2MB',
        variant: 'destructive',
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Error',
        description: 'Please upload an image file',
        variant: 'destructive',
      });
      return;
    }

    const inputElement = event.currentTarget;
    const folder = logoType === 'logo' ? 'logos' : 'favicon';
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    formData.append('altText', `${logoType === 'logo' ? 'Company Logo' : 'Favicon'}`);

    toast({
      title: 'Uploading...',
      description: `Uploading ${logoType} to storage`,
    });

    try {
      const response = await fetch('/api/admin/cms/media/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Upload failed');
      }

      const media = await response.json();

      const endpoint = logoType === 'logo' ? '/api/admin/site-logo' : '/api/admin/site-favicon';
      const setResponse = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaId: media.id }),
        credentials: 'include',
      });

      if (!setResponse.ok) {
        throw new Error(`Failed to set ${logoType} as active`);
      }

      queryClient.invalidateQueries({ queryKey: ['/api/site-logo'] });
      queryClient.invalidateQueries({ queryKey: ['/api/site-favicon'] });
      queryClient.invalidateQueries({ queryKey: ['/api/branding'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/cms/media'] });

      if (inputElement) inputElement.value = '';

      toast({
        title: 'Success',
        description: `${logoType === 'logo' ? 'Logo' : 'Favicon'} uploaded and set successfully`,
      });
    } catch (error) {
      console.error('Logo upload error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to upload logo',
        variant: 'destructive',
      });
    }
  };

  const handleLogoDelete = async (logoType: 'logo' | 'favicon') => {
    const currentMedia = logoType === 'logo' ? siteLogoData?.logo : siteFaviconData?.favicon;
    
    if (!currentMedia?.id) {
      toast({
        title: 'Info',
        description: `No ${logoType} to remove`,
      });
      return;
    }

    try {
      const endpoint = logoType === 'logo' ? '/api/admin/site-logo' : '/api/admin/site-favicon';
      const response = await fetch(endpoint, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to remove ${logoType}`);
      }

      queryClient.invalidateQueries({ queryKey: ['/api/site-logo'] });
      queryClient.invalidateQueries({ queryKey: ['/api/site-favicon'] });
      queryClient.invalidateQueries({ queryKey: ['/api/branding'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/cms/media'] });

      toast({
        title: 'Success',
        description: `${logoType === 'logo' ? 'Logo' : 'Favicon'} removed successfully`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to delete ${logoType}`,
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="branding" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <span>Branding</span>
          </TabsTrigger>
          <TabsTrigger value="colors" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            <span>Colors</span>
          </TabsTrigger>
          <TabsTrigger value="social" className="flex items-center gap-2">
            <Share2 className="w-4 h-4" />
            <span>Social</span>
          </TabsTrigger>
          <TabsTrigger value="contact" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            <span>Contact</span>
          </TabsTrigger>
          <TabsTrigger value="seo" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            <span>SEO</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="branding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Brand Identity</CardTitle>
              <CardDescription>Manage your company logos, name, and tagline</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="company-name">Company Name</Label>
                <Input
                  id="company-name"
                  defaultValue={getSetting('BRAND_COMPANY_NAME')}
                  onBlur={(e) => handleSettingChange('BRAND_COMPANY_NAME', e.target.value, 'branding', 'Company name displayed across the website')}
                  placeholder="USA Luxury Limo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  defaultValue={getSetting('BRAND_TAGLINE')}
                  onBlur={(e) => handleSettingChange('BRAND_TAGLINE', e.target.value, 'branding', 'Company tagline or slogan')}
                  placeholder="Premium Transportation Services"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Brand Description</Label>
                <Textarea
                  id="description"
                  defaultValue={getSetting('BRAND_DESCRIPTION')}
                  onBlur={(e) => handleSettingChange('BRAND_DESCRIPTION', e.target.value, 'branding', 'Short brand description')}
                  placeholder="Luxury limousine services for all occasions..."
                  rows={4}
                />
              </div>

              <div className="space-y-3">
                <Label className="text-base font-semibold">Main Logo</Label>
                {siteLogoData?.logo?.url ? (
                  <div className="space-y-3">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 flex items-center justify-center">
                      <img 
                        src={siteLogoData.logo.url} 
                        alt={siteLogoData.logo.altText || "Current Logo"} 
                        className="max-h-32 max-w-full object-contain"
                      />
                    </div>
                    <p className="text-xs text-gray-500">File: {siteLogoData.logo.fileName}</p>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => logoInputRef.current?.click()}
                        className="flex items-center gap-2"
                      >
                        <Pencil className="w-4 h-4" />
                        Change Logo
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => handleLogoDelete('logo')}
                        className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50 flex flex-col items-center justify-center gap-3">
                      <Upload className="w-12 h-12 text-gray-400" />
                      <p className="text-sm text-gray-600">No logo set. Upload a new one or select from Media Library.</p>
                      <Button 
                        variant="outline" 
                        onClick={() => logoInputRef.current?.click()}
                        className="flex items-center gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        Upload Logo
                      </Button>
                    </div>
                  </div>
                )}
                <Input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleLogoUpload(e, 'logo')}
                  className="hidden"
                />
                <p className="text-xs text-muted-foreground">Recommended: PNG or SVG, transparent background, max 2MB. You can also set logo from CMS Media Library.</p>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-semibold">Favicon</Label>
                {siteFaviconData?.favicon?.url ? (
                  <div className="space-y-3">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 flex items-center justify-center">
                      <img 
                        src={siteFaviconData.favicon.url} 
                        alt={siteFaviconData.favicon.altText || "Current Favicon"} 
                        className="max-h-16 max-w-full object-contain"
                      />
                    </div>
                    <p className="text-xs text-gray-500">File: {siteFaviconData.favicon.fileName}</p>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => faviconInputRef.current?.click()}
                        className="flex items-center gap-2"
                      >
                        <Pencil className="w-4 h-4" />
                        Change Favicon
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => handleLogoDelete('favicon')}
                        className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50 flex flex-col items-center justify-center gap-3">
                      <Upload className="w-12 h-12 text-gray-400" />
                      <p className="text-sm text-gray-600">No favicon set. Upload a new one or select from Media Library.</p>
                      <Button 
                        variant="outline" 
                        onClick={() => faviconInputRef.current?.click()}
                        className="flex items-center gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        Upload Favicon
                      </Button>
                    </div>
                  </div>
                )}
                <Input
                  ref={faviconInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleLogoUpload(e, 'favicon')}
                  className="hidden"
                />
                <p className="text-xs text-muted-foreground">Recommended: 32x32 or 64x64 PNG/ICO, square format, max 2MB. You can also set favicon from CMS Media Library.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="colors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Brand Colors</CardTitle>
              <CardDescription>Customize your website's color scheme</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primary-color">Primary Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      id="primary-color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      onBlur={(e) => handleSettingChange('BRAND_PRIMARY_COLOR', e.target.value, 'colors', 'Primary brand color')}
                      className="w-20 h-10 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      onBlur={(e) => handleSettingChange('BRAND_PRIMARY_COLOR', e.target.value, 'colors', 'Primary brand color')}
                      placeholder="#1a1a1a"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondary-color">Secondary Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      id="secondary-color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      onBlur={(e) => handleSettingChange('BRAND_SECONDARY_COLOR', e.target.value, 'colors', 'Secondary brand color')}
                      className="w-20 h-10 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      onBlur={(e) => handleSettingChange('BRAND_SECONDARY_COLOR', e.target.value, 'colors', 'Secondary brand color')}
                      placeholder="#666666"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accent-color">Accent Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      id="accent-color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      onBlur={(e) => handleSettingChange('BRAND_ACCENT_COLOR', e.target.value, 'colors', 'Accent brand color')}
                      className="w-20 h-10 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      onBlur={(e) => handleSettingChange('BRAND_ACCENT_COLOR', e.target.value, 'colors', 'Accent brand color')}
                      placeholder="#d4af37"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Social Media Links</CardTitle>
              <CardDescription>Add your social media profiles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="facebook">Facebook</Label>
                <Input
                  id="facebook"
                  type="url"
                  defaultValue={getSetting('SOCIAL_FACEBOOK')}
                  onBlur={(e) => handleSettingChange('SOCIAL_FACEBOOK', e.target.value, 'social', 'Facebook profile URL')}
                  placeholder="https://facebook.com/yourpage"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="twitter">Twitter/X</Label>
                <Input
                  id="twitter"
                  type="url"
                  defaultValue={getSetting('SOCIAL_TWITTER')}
                  onBlur={(e) => handleSettingChange('SOCIAL_TWITTER', e.target.value, 'social', 'Twitter/X profile URL')}
                  placeholder="https://twitter.com/yourhandle"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  type="url"
                  defaultValue={getSetting('SOCIAL_INSTAGRAM')}
                  onBlur={(e) => handleSettingChange('SOCIAL_INSTAGRAM', e.target.value, 'social', 'Instagram profile URL')}
                  placeholder="https://instagram.com/yourhandle"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn</Label>
                <Input
                  id="linkedin"
                  type="url"
                  defaultValue={getSetting('SOCIAL_LINKEDIN')}
                  onBlur={(e) => handleSettingChange('SOCIAL_LINKEDIN', e.target.value, 'social', 'LinkedIn profile URL')}
                  placeholder="https://linkedin.com/company/yourcompany"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>Update your company contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contact-email">Email</Label>
                <Input
                  id="contact-email"
                  type="email"
                  defaultValue={getSetting('CONTACT_EMAIL')}
                  onBlur={(e) => handleSettingChange('CONTACT_EMAIL', e.target.value, 'contact', 'Primary contact email')}
                  placeholder="info@usaluxurylimo.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-phone">Phone</Label>
                <Input
                  id="contact-phone"
                  type="tel"
                  defaultValue={getSetting('CONTACT_PHONE')}
                  onBlur={(e) => handleSettingChange('CONTACT_PHONE', e.target.value, 'contact', 'Primary contact phone number')}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-address">Address</Label>
                <Textarea
                  id="contact-address"
                  defaultValue={getSetting('CONTACT_ADDRESS')}
                  onBlur={(e) => handleSettingChange('CONTACT_ADDRESS', e.target.value, 'contact', 'Physical business address')}
                  placeholder="123 Main St, New York, NY 10001"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
              <CardDescription>Optimize your website for search engines</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="seo-title">Site Title</Label>
                <Input
                  id="seo-title"
                  defaultValue={getSetting('SEO_SITE_TITLE')}
                  onBlur={(e) => handleSettingChange('SEO_SITE_TITLE', e.target.value, 'seo', 'Default page title for SEO')}
                  placeholder="USA Luxury Limo - Premium Transportation"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="seo-description">Meta Description</Label>
                <Textarea
                  id="seo-description"
                  defaultValue={getSetting('SEO_META_DESCRIPTION')}
                  onBlur={(e) => handleSettingChange('SEO_META_DESCRIPTION', e.target.value, 'seo', 'Default meta description for SEO')}
                  placeholder="Book premium limousine services for weddings, corporate events, and special occasions..."
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">Recommended: 150-160 characters</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="seo-keywords">Keywords</Label>
                <Input
                  id="seo-keywords"
                  defaultValue={getSetting('SEO_KEYWORDS')}
                  onBlur={(e) => handleSettingChange('SEO_KEYWORDS', e.target.value, 'seo', 'SEO keywords (comma-separated)')}
                  placeholder="limousine service, luxury transportation, chauffeur"
                />
                <p className="text-xs text-muted-foreground">Separate keywords with commas</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {saveSetting.isPending && (
        <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-md shadow-lg flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Saving...</span>
        </div>
      )}
    </div>
  );
}