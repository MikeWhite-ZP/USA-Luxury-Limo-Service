import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Building2, Smartphone, Globe as GlobeIcon, Image as ImageIcon } from 'lucide-react';

type CmsSetting = {
  id: string;
  key: string;
  value: string;
  category: 'branding' | 'colors' | 'social' | 'contact' | 'seo' | 'general' | 'app' | 'web';
  description: string | null;
  updatedAt: string;
};

type CmsMedia = {
  id: string;
  fileName: string;
  fileUrl: string;
  folder: string;
  altText: string | null;
};

export default function BrandSettings() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('branding');
  
  // Controlled state for colors
  const [appPrimaryColor, setAppPrimaryColor] = useState('#e74c3c');
  const [webPrimaryColor, setWebPrimaryColor] = useState('#000000');

  // Fetch all settings
  const { data: settings, isLoading } = useQuery<CmsSetting[]>({
    queryKey: ['/api/admin/cms/settings'],
  });

  // Fetch media library for image selection
  const { data: mediaLibrary } = useQuery<CmsMedia[]>({
    queryKey: ['/api/admin/cms/media'],
  });

  // Initialize color state from fetched settings
  useEffect(() => {
    if (settings) {
      const appColor = settings.find(s => s.key === 'APP_PRIMARY_COLOR')?.value;
      const webColor = settings.find(s => s.key === 'WEB_PRIMARY_COLOR')?.value;
      
      if (appColor) setAppPrimaryColor(appColor);
      if (webColor) setWebPrimaryColor(webColor);
    }
  }, [settings]);

  // Mutation for saving settings
  const saveSetting = useMutation({
    mutationFn: async (data: { key: string; value: string; category: string; description?: string }) => {
      return apiRequest(`/api/admin/cms/settings`, 'PUT', { 
        key: data.key,
        value: data.value, 
        category: data.category, 
        description: data.description 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/cms/settings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/branding'] });
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

  // Filter media library by folder type
  const logoImages = mediaLibrary?.filter(m => m.folder === 'logos') || [];
  const faviconImages = mediaLibrary?.filter(m => m.folder === 'favicon') || [];

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
        <TabsList className="h-11 items-center justify-center rounded-md bg-muted p-1 grid w-full grid-cols-3">
          <TabsTrigger value="branding" className="flex items-center gap-2" data-testid="tab-branding">
            <Building2 className="w-4 h-4" />
            <span>Branding</span>
          </TabsTrigger>
          <TabsTrigger value="app" className="flex items-center gap-2" data-testid="tab-app">
            <Smartphone className="w-4 h-4" />
            <span>App</span>
          </TabsTrigger>
          <TabsTrigger value="web" className="flex items-center gap-2" data-testid="tab-web">
            <GlobeIcon className="w-4 h-4" />
            <span>Web</span>
          </TabsTrigger>
        </TabsList>

        {/* Branding Tab - General Business Information */}
        <TabsContent value="branding" className="space-y-4 mt-6">
          <Card data-testid="card-branding">
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>Manage your company's general business details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Business Name */}
                <div className="space-y-2">
                  <Label htmlFor="business-name">Business Name</Label>
                  <Input
                    id="business-name"
                    data-testid="input-business-name"
                    defaultValue={getSetting('BUSINESS_NAME')}
                    onBlur={(e) => handleSettingChange('BUSINESS_NAME', e.target.value, 'general', 'Business legal name')}
                    placeholder="USA Luxury Limo Service"
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="business-email">Email</Label>
                  <Input
                    id="business-email"
                    data-testid="input-business-email"
                    type="email"
                    defaultValue={getSetting('BUSINESS_EMAIL')}
                    onBlur={(e) => handleSettingChange('BUSINESS_EMAIL', e.target.value, 'general', 'Business contact email')}
                    placeholder="usaluxurylimo@gmail.com"
                  />
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                  <Label htmlFor="business-phone">Number</Label>
                  <Input
                    id="business-phone"
                    data-testid="input-business-phone"
                    type="tel"
                    defaultValue={getSetting('BUSINESS_PHONE')}
                    onBlur={(e) => handleSettingChange('BUSINESS_PHONE', e.target.value, 'general', 'Business phone number')}
                    placeholder="+1 (832) 479-4519"
                  />
                </div>

                {/* Whatsapp Number */}
                <div className="space-y-2">
                  <Label htmlFor="whatsapp-number">Whatsapp Number</Label>
                  <Input
                    id="whatsapp-number"
                    data-testid="input-whatsapp-number"
                    type="tel"
                    defaultValue={getSetting('WHATSAPP_NUMBER')}
                    onBlur={(e) => handleSettingChange('WHATSAPP_NUMBER', e.target.value, 'general', 'WhatsApp contact number')}
                    placeholder="+18324793281"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="business-address">Address</Label>
                <Input
                  id="business-address"
                  data-testid="input-business-address"
                  defaultValue={getSetting('BUSINESS_ADDRESS')}
                  onBlur={(e) => handleSettingChange('BUSINESS_ADDRESS', e.target.value, 'general', 'Business physical address')}
                  placeholder="Houston, TX"
                />
              </div>

              {/* Social Media Links */}
              <div className="pt-4 border-t">
                <h3 className="text-sm font-semibold mb-4">Social Media Links</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Facebook URL */}
                  <div className="space-y-2">
                    <Label htmlFor="facebook-url">Facebook URL</Label>
                    <Input
                      id="facebook-url"
                      data-testid="input-facebook-url"
                      type="url"
                      defaultValue={getSetting('FACEBOOK_URL')}
                      onBlur={(e) => handleSettingChange('FACEBOOK_URL', e.target.value, 'general', 'Facebook page URL')}
                      placeholder="https://www.facebook.com/share/17kSjwxcqL7Hm8de4qf/?mibextid=wwXIfr"
                    />
                  </div>

                  {/* LinkedIn URL */}
                  <div className="space-y-2">
                    <Label htmlFor="linkedin-url">LinkedIn URL</Label>
                    <Input
                      id="linkedin-url"
                      data-testid="input-linkedin-url"
                      type="url"
                      defaultValue={getSetting('LINKEDIN_URL')}
                      onBlur={(e) => handleSettingChange('LINKEDIN_URL', e.target.value, 'general', 'LinkedIn profile URL')}
                      placeholder="https://www.linkedin.com/in/usa-luxury-limo-service"
                    />
                  </div>

                  {/* Instagram URL */}
                  <div className="space-y-2">
                    <Label htmlFor="instagram-url">Instagram URL</Label>
                    <Input
                      id="instagram-url"
                      data-testid="input-instagram-url"
                      type="url"
                      defaultValue={getSetting('INSTAGRAM_URL')}
                      onBlur={(e) => handleSettingChange('INSTAGRAM_URL', e.target.value, 'general', 'Instagram profile URL')}
                      placeholder="https://www.instagram.com/usaluxury_limo/profilecard/?igsh=OTdIggsulM1Ogzk0"
                    />
                  </div>

                  {/* Google URL */}
                  <div className="space-y-2">
                    <Label htmlFor="google-url">Google URL</Label>
                    <Input
                      id="google-url"
                      data-testid="input-google-url"
                      type="url"
                      defaultValue={getSetting('GOOGLE_URL')}
                      onBlur={(e) => handleSettingChange('GOOGLE_URL', e.target.value, 'general', 'Google Business Profile URL')}
                      placeholder="https://maps.app.goo.gl/HW2oboMxKxHrDqpt8"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* App Tab - Mobile App Settings */}
        <TabsContent value="app" className="space-y-4 mt-6">
          <Card data-testid="card-app">
            <CardHeader>
              <CardTitle>App Info</CardTitle>
              <CardDescription>Configure your mobile application settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* App Name */}
              <div className="space-y-2">
                <Label htmlFor="app-name">App Name</Label>
                <Input
                  id="app-name"
                  data-testid="input-app-name"
                  defaultValue={getSetting('APP_NAME')}
                  onBlur={(e) => handleSettingChange('APP_NAME', e.target.value, 'app', 'Mobile app display name')}
                  placeholder="USA Luxury Limo"
                />
              </div>

              {/* App Logo Selection */}
              <div className="space-y-2">
                <Label htmlFor="app-logo">App Logo</Label>
                <Select
                  value={getSetting('APP_LOGO_ID') || undefined}
                  onValueChange={(value) => handleSettingChange('APP_LOGO_ID', value, 'app', 'App logo image ID from media library')}
                >
                  <SelectTrigger id="app-logo" data-testid="select-app-logo" className="w-full">
                    <SelectValue placeholder="Choose file" />
                  </SelectTrigger>
                  <SelectContent>
                    {logoImages.length > 0 ? (
                      logoImages.map((img) => (
                        <SelectItem key={img.id} value={img.id}>
                          <div className="flex items-center gap-2">
                            <ImageIcon className="w-4 h-4" />
                            {img.fileName}
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        No logos uploaded yet
                      </div>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Upload logos via CMS → Media & Images Management
                </p>
              </div>

              {/* App Icon Selection */}
              <div className="space-y-2">
                <Label htmlFor="app-icon">App Icon</Label>
                <Select
                  value={getSetting('APP_ICON_ID') || undefined}
                  onValueChange={(value) => handleSettingChange('APP_ICON_ID', value, 'app', 'App icon image ID from media library')}
                >
                  <SelectTrigger id="app-icon" data-testid="select-app-icon" className="w-full">
                    <SelectValue placeholder="Choose file" />
                  </SelectTrigger>
                  <SelectContent>
                    {logoImages.length > 0 ? (
                      logoImages.map((img) => (
                        <SelectItem key={img.id} value={img.id}>
                          <div className="flex items-center gap-2">
                            <ImageIcon className="w-4 h-4" />
                            {img.fileName}
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        No icons uploaded yet
                      </div>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Upload icons via CMS → Media & Images Management
                </p>
              </div>

              {/* App Description */}
              <div className="space-y-2">
                <Label htmlFor="app-description">App Description</Label>
                <Textarea
                  id="app-description"
                  data-testid="input-app-description"
                  defaultValue={getSetting('APP_DESCRIPTION')}
                  onBlur={(e) => handleSettingChange('APP_DESCRIPTION', e.target.value, 'app', 'Mobile app store description')}
                  placeholder="Experience Luxury, Comfort, and Class – Every Mile with USA Luxury Limo Service"
                  rows={4}
                />
              </div>

              {/* App Store Links */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="android-app-link">Android Passenger App Link</Label>
                  <Input
                    id="android-app-link"
                    data-testid="input-android-app-link"
                    type="url"
                    defaultValue={getSetting('ANDROID_APP_LINK')}
                    onBlur={(e) => handleSettingChange('ANDROID_APP_LINK', e.target.value, 'app', 'Google Play Store app URL')}
                    placeholder="https://play.google.com/store/apps/usaluxurylimo"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ios-app-link">iOS Passenger App Link</Label>
                  <Input
                    id="ios-app-link"
                    data-testid="input-ios-app-link"
                    type="url"
                    defaultValue={getSetting('IOS_APP_LINK')}
                    onBlur={(e) => handleSettingChange('IOS_APP_LINK', e.target.value, 'app', 'Apple App Store app URL')}
                    placeholder="https://apps.apple.com/us/app/usa-luxury-limo"
                  />
                </div>
              </div>

              {/* App Slogan */}
              <div className="space-y-2">
                <Label htmlFor="app-slogan">App Slogan</Label>
                <Input
                  id="app-slogan"
                  data-testid="input-app-slogan"
                  defaultValue={getSetting('APP_SLOGAN')}
                  onBlur={(e) => handleSettingChange('APP_SLOGAN', e.target.value, 'app', 'App tagline or slogan')}
                  placeholder="Ride in Style"
                />
              </div>

              {/* App Theme Settings */}
              <div className="pt-4 border-t">
                <h3 className="text-sm font-semibold mb-4">App Theme</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* App Primary Color */}
                  <div className="space-y-2">
                    <Label htmlFor="app-primary-color">App Primary Color</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        id="app-primary-color"
                        data-testid="input-app-primary-color"
                        value={appPrimaryColor}
                        onChange={(e) => setAppPrimaryColor(e.target.value)}
                        onBlur={(e) => handleSettingChange('APP_PRIMARY_COLOR', e.target.value, 'app', 'App primary theme color')}
                        className="w-20 h-10 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={appPrimaryColor}
                        onChange={(e) => setAppPrimaryColor(e.target.value)}
                        onBlur={(e) => handleSettingChange('APP_PRIMARY_COLOR', e.target.value, 'app', 'App primary theme color')}
                        placeholder="#e74c3c"
                        data-testid="input-app-primary-color-hex"
                      />
                    </div>
                  </div>

                  {/* App Splash Screen Mode */}
                  <div className="space-y-2">
                    <Label htmlFor="app-splash-mode">App Splash Screen Mode</Label>
                    <Select
                      value={getSetting('APP_SPLASH_MODE') || 'image'}
                      onValueChange={(value) => handleSettingChange('APP_SPLASH_MODE', value, 'app', 'Splash screen display mode')}
                    >
                      <SelectTrigger id="app-splash-mode" data-testid="select-app-splash-mode">
                        <SelectValue placeholder="Select mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="image">Image</SelectItem>
                        <SelectItem value="logo">Logo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* App Appearance Mode */}
                  <div className="space-y-2">
                    <Label htmlFor="app-appearance-mode">App Appearance Mode</Label>
                    <Select
                      value={getSetting('APP_APPEARANCE_MODE') || 'light'}
                      onValueChange={(value) => handleSettingChange('APP_APPEARANCE_MODE', value, 'app', 'App theme appearance')}
                    >
                      <SelectTrigger id="app-appearance-mode" data-testid="select-app-appearance-mode">
                        <SelectValue placeholder="Select mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Web Tab - Website Branding */}
        <TabsContent value="web" className="space-y-4 mt-6">
          <Card data-testid="card-web">
            <CardHeader>
              <CardTitle>Web Branding</CardTitle>
              <CardDescription>Customize your website's visual identity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Web Primary Color */}
              <div className="space-y-2">
                <Label htmlFor="web-primary-color">Web Primary Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    id="web-primary-color"
                    data-testid="input-web-primary-color"
                    value={webPrimaryColor}
                    onChange={(e) => setWebPrimaryColor(e.target.value)}
                    onBlur={(e) => handleSettingChange('WEB_PRIMARY_COLOR', e.target.value, 'web', 'Website primary theme color')}
                    className="w-20 h-10 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={webPrimaryColor}
                    onChange={(e) => setWebPrimaryColor(e.target.value)}
                    onBlur={(e) => handleSettingChange('WEB_PRIMARY_COLOR', e.target.value, 'web', 'Website primary theme color')}
                    placeholder="#000000"
                    data-testid="input-web-primary-color-hex"
                  />
                </div>
              </div>

              {/* Favicon Selection */}
              <div className="space-y-2">
                <Label htmlFor="web-favicon">Favicon</Label>
                <Select
                  value={getSetting('WEB_FAVICON_ID') || undefined}
                  onValueChange={(value) => handleSettingChange('WEB_FAVICON_ID', value, 'web', 'Website favicon image ID from media library')}
                >
                  <SelectTrigger id="web-favicon" data-testid="select-web-favicon" className="w-full">
                    <SelectValue placeholder="Choose file" />
                  </SelectTrigger>
                  <SelectContent>
                    {faviconImages.length > 0 ? (
                      faviconImages.map((img) => (
                        <SelectItem key={img.id} value={img.id}>
                          <div className="flex items-center gap-2">
                            <ImageIcon className="w-4 h-4" />
                            {img.fileName}
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        No favicons uploaded yet
                      </div>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Upload favicons via CMS → Media & Images Management
                </p>
              </div>

              {/* Web Slogan */}
              <div className="space-y-2">
                <Label htmlFor="web-slogan">Slogan</Label>
                <Input
                  id="web-slogan"
                  data-testid="input-web-slogan"
                  defaultValue={getSetting('WEB_SLOGAN')}
                  onBlur={(e) => handleSettingChange('WEB_SLOGAN', e.target.value, 'web', 'Website tagline or slogan')}
                  placeholder="USA Luxury Limo Service"
                />
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
