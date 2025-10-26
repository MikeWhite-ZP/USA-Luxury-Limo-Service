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
import { Loader2, Save, Upload, Settings, Palette, Share2, Mail, Globe, Pencil, Trash2 } from 'lucide-react';

type CmsSetting = {
  id: string;
  key: string;
  value: string;
  category: 'branding' | 'colors' | 'social' | 'contact' | 'seo';
  description: string | null;
  updatedAt: string;
};

export default function BrandSettings() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('branding');
  
  // Refs for file inputs to trigger programmatically
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  
  // Controlled state for colors to ensure picker and hex input stay synchronized
  const [primaryColor, setPrimaryColor] = useState('#1a1a1a');
  const [secondaryColor, setSecondaryColor] = useState('#666666');
  const [accentColor, setAccentColor] = useState('#d4af37');

  // Fetch all settings
  const { data: settings, isLoading } = useQuery<CmsSetting[]>({
    queryKey: ['/api/admin/cms/settings'],
  });

  // Initialize color state from fetched settings
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

  // Mutation for saving settings
  const saveSetting = useMutation({
    mutationFn: async (data: { key: string; value: string; category: string; description?: string }) => {
      return apiRequest(`/api/admin/cms/settings/${data.key}`, 'PUT', { 
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

  // Helper to get setting value by key
  const getSetting = (key: string): string => {
    const setting = settings?.find((s) => s.key === key);
    return setting?.value || '';
  };

  // Helper to handle input changes with auto-save
  const handleSettingChange = (key: string, value: string, category: string, description?: string) => {
    saveSetting.mutate({ key, value, category, description });
  };

  // Handle logo upload
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>, logoType: 'logo' | 'favicon') => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Capture the input element reference before async operations
    const inputElement = event.currentTarget;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'logos');
    formData.append('altText', `${logoType === 'logo' ? 'Company Logo' : 'Favicon'}`);

    try {
      const response = await fetch('/api/admin/cms/media/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Upload failed');

      const media = await response.json();
      const key = logoType === 'logo' ? 'BRAND_LOGO_URL' : 'BRAND_FAVICON_URL';
      handleSettingChange(key, media.fileUrl, 'branding', `${logoType === 'logo' ? 'Main company logo' : 'Browser favicon'}`);
      
      // Reset input to allow re-uploading the same file
      if (inputElement) inputElement.value = '';
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to upload logo',
        variant: 'destructive',
      });
    }
  };

  // Handle logo delete
  const handleLogoDelete = async (logoType: 'logo' | 'favicon') => {
    const key = logoType === 'logo' ? 'BRAND_LOGO_URL' : 'BRAND_FAVICON_URL';
    const currentUrl = getSetting(key);
    
    if (!currentUrl) return;

    try {
      // Find the media record by URL
      const response = await fetch('/api/admin/cms/media', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const allMedia = await response.json();
        const mediaRecord = allMedia.find((m: any) => m.fileUrl === currentUrl);
        
        if (mediaRecord) {
          // Delete the media file from storage
          await apiRequest(`/api/admin/cms/media/${mediaRecord.id}`, 'DELETE');
        }
      }
      
      // Clear the setting value
      handleSettingChange(key, '', 'branding', `${logoType === 'logo' ? 'Main company logo' : 'Browser favicon'}`);
      
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
        <TabsList className="h-10 items-center justify-center rounded-md bg-muted p-1 grid w-full grid-cols-5 text-[#ff0000]">
          <TabsTrigger value="branding" className="flex items-center gap-2" data-testid="tab-branding">
            <Settings className="w-4 h-4" />
            <span>Branding</span>
          </TabsTrigger>
          <TabsTrigger value="colors" className="flex items-center gap-2" data-testid="tab-colors">
            <Palette className="w-4 h-4" />
            <span>Colors</span>
          </TabsTrigger>
          <TabsTrigger value="social" className="flex items-center gap-2" data-testid="tab-social">
            <Share2 className="w-4 h-4" />
            <span>Social</span>
          </TabsTrigger>
          <TabsTrigger value="contact" className="flex items-center gap-2" data-testid="tab-contact">
            <Mail className="w-4 h-4" />
            <span>Contact</span>
          </TabsTrigger>
          <TabsTrigger value="seo" className="flex items-center gap-2" data-testid="tab-seo">
            <Globe className="w-4 h-4" />
            <span>SEO</span>
          </TabsTrigger>
        </TabsList>

        {/* Branding Tab */}
        <TabsContent value="branding" className="space-y-4">
          <Card data-testid="card-branding">
            <CardHeader>
              <CardTitle className="text-[#0040ff]">Brand Identity</CardTitle>
              <CardDescription>Manage your company logos, name, and tagline</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Company Name */}
              <div className="space-y-2">
                <Label htmlFor="company-name">Company Name</Label>
                <Input
                  id="company-name"
                  data-testid="input-company-name"
                  defaultValue={getSetting('BRAND_COMPANY_NAME')}
                  onBlur={(e) => handleSettingChange('BRAND_COMPANY_NAME', e.target.value, 'branding', 'Company name displayed across the website')}
                  placeholder="USA Luxury Limo"
                />
              </div>

              {/* Tagline */}
              <div className="space-y-2">
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  data-testid="input-tagline"
                  defaultValue={getSetting('BRAND_TAGLINE')}
                  onBlur={(e) => handleSettingChange('BRAND_TAGLINE', e.target.value, 'branding', 'Company tagline or slogan')}
                  placeholder="Premium Transportation Services"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Brand Description</Label>
                <Textarea
                  id="description"
                  data-testid="input-description"
                  defaultValue={getSetting('BRAND_DESCRIPTION')}
                  onBlur={(e) => handleSettingChange('BRAND_DESCRIPTION', e.target.value, 'branding', 'Short brand description')}
                  placeholder="Luxury limousine services for all occasions..."
                  rows={4}
                />
              </div>

              {/* Logo Upload */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Main Logo</Label>
                {getSetting('BRAND_LOGO_URL') ? (
                  <div className="space-y-3">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 flex items-center justify-center">
                      <img 
                        src={getSetting('BRAND_LOGO_URL')} 
                        alt="Current Logo" 
                        className="max-h-32 max-w-full object-contain"
                        data-testid="img-current-logo"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => logoInputRef.current?.click()}
                        className="flex items-center gap-2"
                        data-testid="button-edit-logo"
                      >
                        <Pencil className="w-4 h-4" />
                        Edit Logo
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => handleLogoDelete('logo')}
                        className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                        data-testid="button-delete-logo"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50 flex flex-col items-center justify-center gap-3">
                      <Upload className="w-12 h-12 text-gray-400" />
                      <p className="text-sm text-gray-600">No logo uploaded yet</p>
                      <Button 
                        variant="outline" 
                        onClick={() => logoInputRef.current?.click()}
                        className="flex items-center gap-2"
                        data-testid="button-upload-logo"
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
                  data-testid="input-logo-upload"
                />
                <p className="text-xs text-muted-foreground">Recommended: PNG or SVG, transparent background, max 2MB</p>
              </div>

              {/* Favicon Upload */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Favicon</Label>
                {getSetting('BRAND_FAVICON_URL') ? (
                  <div className="space-y-3">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 flex items-center justify-center">
                      <img 
                        src={getSetting('BRAND_FAVICON_URL')} 
                        alt="Current Favicon" 
                        className="max-h-16 max-w-full object-contain"
                        data-testid="img-current-favicon"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => faviconInputRef.current?.click()}
                        className="flex items-center gap-2"
                        data-testid="button-edit-favicon"
                      >
                        <Pencil className="w-4 h-4" />
                        Edit Favicon
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => handleLogoDelete('favicon')}
                        className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                        data-testid="button-delete-favicon"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50 flex flex-col items-center justify-center gap-3">
                      <Upload className="w-12 h-12 text-gray-400" />
                      <p className="text-sm text-gray-600">No favicon uploaded yet</p>
                      <Button 
                        variant="outline" 
                        onClick={() => faviconInputRef.current?.click()}
                        className="flex items-center gap-2"
                        data-testid="button-upload-favicon"
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
                  data-testid="input-favicon-upload"
                />
                <p className="text-xs text-muted-foreground">Recommended: 32x32 or 64x64 PNG/ICO, square format</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Colors Tab */}
        <TabsContent value="colors" className="space-y-4">
          <Card data-testid="card-colors">
            <CardHeader>
              <CardTitle>Brand Colors</CardTitle>
              <CardDescription>Customize your website's color scheme</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Primary Color - Synchronized */}
                <div className="space-y-2">
                  <Label htmlFor="primary-color">Primary Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      id="primary-color"
                      data-testid="input-primary-color"
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
                      data-testid="input-primary-color-hex"
                    />
                  </div>
                  {saveSetting.isPending && saveSetting.variables?.key === 'BRAND_PRIMARY_COLOR' && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Saving...</span>
                    </div>
                  )}
                </div>

                {/* Secondary Color - Synchronized */}
                <div className="space-y-2">
                  <Label htmlFor="secondary-color">Secondary Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      id="secondary-color"
                      data-testid="input-secondary-color"
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
                      data-testid="input-secondary-color-hex"
                    />
                  </div>
                  {saveSetting.isPending && saveSetting.variables?.key === 'BRAND_SECONDARY_COLOR' && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Saving...</span>
                    </div>
                  )}
                </div>

                {/* Accent Color - Synchronized */}
                <div className="space-y-2">
                  <Label htmlFor="accent-color">Accent Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      id="accent-color"
                      data-testid="input-accent-color"
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
                      data-testid="input-accent-color-hex"
                    />
                  </div>
                  {saveSetting.isPending && saveSetting.variables?.key === 'BRAND_ACCENT_COLOR' && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Saving...</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social Tab */}
        <TabsContent value="social" className="space-y-4">
          <Card data-testid="card-social">
            <CardHeader>
              <CardTitle>Social Media Links</CardTitle>
              <CardDescription>Add your social media profiles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="facebook">Facebook</Label>
                <Input
                  id="facebook"
                  data-testid="input-facebook"
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
                  data-testid="input-twitter"
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
                  data-testid="input-instagram"
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
                  data-testid="input-linkedin"
                  type="url"
                  defaultValue={getSetting('SOCIAL_LINKEDIN')}
                  onBlur={(e) => handleSettingChange('SOCIAL_LINKEDIN', e.target.value, 'social', 'LinkedIn profile URL')}
                  placeholder="https://linkedin.com/company/yourcompany"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Tab */}
        <TabsContent value="contact" className="space-y-4">
          <Card data-testid="card-contact">
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>Update your company contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contact-email">Email</Label>
                <Input
                  id="contact-email"
                  data-testid="input-contact-email"
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
                  data-testid="input-contact-phone"
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
                  data-testid="input-contact-address"
                  defaultValue={getSetting('CONTACT_ADDRESS')}
                  onBlur={(e) => handleSettingChange('CONTACT_ADDRESS', e.target.value, 'contact', 'Physical business address')}
                  placeholder="123 Main St, New York, NY 10001"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO Tab */}
        <TabsContent value="seo" className="space-y-4">
          <Card data-testid="card-seo">
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
              <CardDescription>Optimize your website for search engines</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="seo-title">Site Title</Label>
                <Input
                  id="seo-title"
                  data-testid="input-seo-title"
                  defaultValue={getSetting('SEO_SITE_TITLE')}
                  onBlur={(e) => handleSettingChange('SEO_SITE_TITLE', e.target.value, 'seo', 'Default page title for SEO')}
                  placeholder="USA Luxury Limo - Premium Transportation"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="seo-description">Meta Description</Label>
                <Textarea
                  id="seo-description"
                  data-testid="input-seo-description"
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
                  data-testid="input-seo-keywords"
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
        <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-md shadow-lg flex items-center gap-2" data-testid="status-saving">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Saving...</span>
        </div>
      )}
    </div>
  );
}
