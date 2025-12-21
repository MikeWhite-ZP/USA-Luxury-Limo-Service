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
import { Loader2, Upload, Settings, Palette, Share2, Mail, Pencil, Trash2, RotateCcw, Check, Building2, Sun, Moon, Wand2 } from 'lucide-react';
import TenantTaxSettings from './TenantTaxSettings';
import { generateDarkPalette, ColorPalette, DEFAULT_DARK_COLORS } from '@/lib/colorUtils';

type CmsSetting = {
  id: string;
  key: string;
  value: string;
  category: 'branding' | 'colors' | 'social' | 'contact' | 'seo' | 'tax';
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
  const [colorThemeTab, setColorThemeTab] = useState<'light' | 'dark'>('light');

  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  // Default light theme colors
  const DEFAULT_LIGHT_COLORS: ColorPalette = {
    primary: '#1a1a1a',
    secondary: '#666666',
    accent: '#dc2626',
    buttonPrimary: '#dc2626',
    buttonPrimaryHover: '#b91c1c',
    buttonSecondary: '#1a1a1a',
    buttonSecondaryHover: '#374151',
    pageBackground: '#ffffff',
    cardBackground: '#ffffff',
    headerBackground: '#ffffff',
    textPrimary: '#1a1a1a',
    textSecondary: '#4b5563',
    textMuted: '#9ca3af',
    navActive: '#dc2626',
    navIndicator: '#dc2626',
    navHover: '#fee2e2',
    linkDefault: '#dc2626',
    linkHover: '#b91c1c',
  };

  // Color states for light and dark themes
  const [lightColors, setLightColors] = useState<ColorPalette>(DEFAULT_LIGHT_COLORS);
  const [darkColors, setDarkColors] = useState<ColorPalette>(DEFAULT_DARK_COLORS);
  const [colorsSaving, setColorsSaving] = useState(false);
  const [hasLightChanges, setHasLightChanges] = useState(false);
  const [hasDarkChanges, setHasDarkChanges] = useState(false);

  // Color field configurations with labels and descriptions
  const colorFields = [
    { section: 'Core Brand Colors', description: 'Main colors that define your brand identity' },
    { key: 'primary', label: 'Primary Color', desc: 'Main brand color used for headers and key elements' },
    { key: 'secondary', label: 'Secondary Color', desc: 'Supporting color for less prominent elements' },
    { key: 'accent', label: 'Accent Color', desc: 'Highlight color for calls-to-action and emphasis' },
    
    { section: 'Button Colors', description: 'Control how buttons appear throughout the site' },
    { key: 'buttonPrimary', label: 'Primary Button', desc: 'Main action buttons (e.g., Book Now, Submit)' },
    { key: 'buttonPrimaryHover', label: 'Primary Button Hover', desc: 'When mouse hovers over primary buttons' },
    { key: 'buttonSecondary', label: 'Secondary Button', desc: 'Less prominent action buttons' },
    { key: 'buttonSecondaryHover', label: 'Secondary Button Hover', desc: 'When mouse hovers over secondary buttons' },
    
    { section: 'Background Colors', description: 'Page and component background colors' },
    { key: 'pageBackground', label: 'Page Background', desc: 'Main page background color' },
    { key: 'cardBackground', label: 'Card Background', desc: 'Background for cards and panels' },
    { key: 'headerBackground', label: 'Header Background', desc: 'Top navigation bar background' },
    
    { section: 'Text Colors', description: 'How text appears across the site' },
    { key: 'textPrimary', label: 'Primary Text', desc: 'Main headings and important text' },
    { key: 'textSecondary', label: 'Secondary Text', desc: 'Body text and descriptions' },
    { key: 'textMuted', label: 'Muted Text', desc: 'Subtle text like placeholders and hints' },
    
    { section: 'Navigation Colors', description: 'Menu and tab styling' },
    { key: 'navActive', label: 'Active Tab Text', desc: 'Color of currently selected menu item' },
    { key: 'navIndicator', label: 'Active Indicator', desc: 'Underline/border for active menu items' },
    { key: 'navHover', label: 'Menu Hover Background', desc: 'Background when hovering over menu items' },
    
    { section: 'Link Colors', description: 'Clickable text links' },
    { key: 'linkDefault', label: 'Link Color', desc: 'Default color for text links' },
    { key: 'linkHover', label: 'Link Hover', desc: 'Color when hovering over links' },
  ];

  const { data: settings, isLoading } = useQuery<CmsSetting[]>({
    queryKey: ['/api/admin/cms/settings'],
  });

  const { data: siteLogoData } = useQuery<{ logo: SiteMediaData }>({
    queryKey: ['/api/site-logo'],
  });

  const { data: siteFaviconData } = useQuery<{ favicon: SiteMediaData }>({
    queryKey: ['/api/site-favicon'],
  });

  // Color key to setting key mapping (with optional theme prefix)
  const colorKeyToSettingKey = (key: string, theme: 'light' | 'dark' = 'light') => {
    const prefix = theme === 'dark' ? 'BRAND_COLOR_DARK_' : 'BRAND_COLOR_';
    return `${prefix}${key.replace(/([A-Z])/g, '_$1').toUpperCase()}`;
  };
  
  useEffect(() => {
    if (settings) {
      const loadedLightColors = { ...DEFAULT_LIGHT_COLORS };
      const loadedDarkColors = { ...DEFAULT_DARK_COLORS };
      
      // Load light theme colors
      Object.keys(DEFAULT_LIGHT_COLORS).forEach((key) => {
        const settingKey = colorKeyToSettingKey(key, 'light');
        const value = settings.find(s => s.key === settingKey)?.value;
        if (value) {
          (loadedLightColors as Record<string, string>)[key] = value;
        }
      });
      
      // Load dark theme colors
      Object.keys(DEFAULT_DARK_COLORS).forEach((key) => {
        const settingKey = colorKeyToSettingKey(key, 'dark');
        const value = settings.find(s => s.key === settingKey)?.value;
        if (value) {
          (loadedDarkColors as Record<string, string>)[key] = value;
        }
      });
      
      // Legacy key support for backward compatibility
      const legacyPrimary = settings.find(s => s.key === 'BRAND_PRIMARY_COLOR')?.value;
      const legacySecondary = settings.find(s => s.key === 'BRAND_SECONDARY_COLOR')?.value;
      const legacyAccent = settings.find(s => s.key === 'BRAND_ACCENT_COLOR')?.value;
      
      if (legacyPrimary) loadedLightColors.primary = legacyPrimary;
      if (legacySecondary) loadedLightColors.secondary = legacySecondary;
      if (legacyAccent) loadedLightColors.accent = legacyAccent;

      setLightColors(loadedLightColors);
      setDarkColors(loadedDarkColors);
      setHasLightChanges(false);
      setHasDarkChanges(false);
    }
  }, [settings]);

  // Track color changes
  const handleLightColorChange = (key: string, value: string) => {
    setLightColors(prev => ({ ...prev, [key]: value }));
    setHasLightChanges(true);
  };

  const handleDarkColorChange = (key: string, value: string) => {
    setDarkColors(prev => ({ ...prev, [key]: value }));
    setHasDarkChanges(true);
  };

  // Reset colors to default
  const handleResetLightColors = () => {
    setLightColors(DEFAULT_LIGHT_COLORS);
    setHasLightChanges(true);
    toast({
      title: 'Light Theme Reset',
      description: 'Light theme colors reset to defaults. Click "Apply Colors" to save.',
    });
  };

  const handleResetDarkColors = () => {
    setDarkColors(DEFAULT_DARK_COLORS);
    setHasDarkChanges(true);
    toast({
      title: 'Dark Theme Reset',
      description: 'Dark theme colors reset to defaults. Click "Apply Colors" to save.',
    });
  };

  // Auto-generate dark colors from light colors
  const handleAutoGenerateDarkColors = () => {
    const generatedDark = generateDarkPalette(lightColors);
    setDarkColors(generatedDark);
    setHasDarkChanges(true);
    toast({
      title: 'Dark Theme Generated',
      description: 'Dark theme colors auto-generated from light theme. Review and click "Apply Colors" to save.',
    });
  };

  // Save colors for a specific theme
  const saveThemeColors = async (theme: 'light' | 'dark', colors: ColorPalette) => {
    const colorDescriptions: Record<string, string> = {
      primary: 'Primary brand color',
      secondary: 'Secondary brand color',
      accent: 'Accent/highlight color',
      buttonPrimary: 'Primary button background',
      buttonPrimaryHover: 'Primary button hover state',
      buttonSecondary: 'Secondary button background',
      buttonSecondaryHover: 'Secondary button hover state',
      pageBackground: 'Page background color',
      cardBackground: 'Card/panel background',
      headerBackground: 'Header background',
      textPrimary: 'Primary text color',
      textSecondary: 'Secondary text color',
      textMuted: 'Muted text color',
      navActive: 'Active navigation text',
      navIndicator: 'Navigation indicator color',
      navHover: 'Navigation hover background',
      linkDefault: 'Default link color',
      linkHover: 'Link hover color',
    };

    const themeLabel = theme === 'dark' ? 'Dark theme ' : '';
    
    await Promise.all(
      Object.entries(colors).map(([key, value]) =>
        apiRequest('PUT', '/api/admin/cms/settings', { 
          key: colorKeyToSettingKey(key, theme),
          value, 
          category: 'colors', 
          description: `${themeLabel}${colorDescriptions[key] || `Brand color: ${key}`}`
        })
      )
    );
  };

  // Save all colors (both themes)
  const handleApplyColors = async () => {
    setColorsSaving(true);
    try {
      const savePromises: Promise<void>[] = [];
      
      if (hasLightChanges) {
        savePromises.push(saveThemeColors('light', lightColors));
      }
      if (hasDarkChanges) {
        savePromises.push(saveThemeColors('dark', darkColors));
      }
      
      await Promise.all(savePromises);
      
      await queryClient.invalidateQueries({ queryKey: ['/api/admin/cms/settings'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/branding'] });
      
      setHasLightChanges(false);
      setHasDarkChanges(false);
      toast({
        title: 'Success',
        description: 'Brand colors saved successfully. Theme updated.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save brand colors',
        variant: 'destructive',
      });
    } finally {
      setColorsSaving(false);
    }
  };

  const saveSetting = useMutation({
    mutationFn: async (data: { key: string; value: string; category: string; description?: string }) => {
      return apiRequest('PUT', '/api/admin/cms/settings', { 
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

  // Render color picker grid for a theme
  const renderColorSection = (theme: 'light' | 'dark') => {
    const colors = theme === 'light' ? lightColors : darkColors;
    const handleChange = theme === 'light' ? handleLightColorChange : handleDarkColorChange;
    const defaultColors = theme === 'light' ? DEFAULT_LIGHT_COLORS : DEFAULT_DARK_COLORS;

    return (
      <div className="space-y-6">
        {colorFields.map((field, index) => {
          if ('section' in field && field.section) {
            const sectionColors = colorFields
              .slice(index + 1)
              .filter((f): f is { key: string; label: string; desc: string } => 
                'key' in f && f.key !== undefined
              )
              .slice(0, colorFields.slice(index + 1).findIndex(f => 'section' in f && f.section) === -1 
                ? colorFields.slice(index + 1).filter(f => 'key' in f).length 
                : colorFields.slice(index + 1).findIndex(f => 'section' in f && f.section));

            return (
              <div key={`section-${index}`} className="pt-4 first:pt-0">
                <h3 className="text-base font-semibold text-foreground mb-1">{field.section}</h3>
                <p className="text-sm text-muted-foreground mb-3">{field.description}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {sectionColors.map((colorField) => (
                    <div key={colorField.key} className="space-y-1.5 p-2.5 rounded-lg border border-border bg-muted/30">
                      <Label htmlFor={`${theme}-color-${colorField.key}`} className="text-xs font-medium" title={colorField.desc}>
                        {colorField.label}
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="color"
                          id={`${theme}-color-${colorField.key}`}
                          value={(colors as Record<string, string>)[colorField.key] || (defaultColors as Record<string, string>)[colorField.key]}
                          onChange={(e) => handleChange(colorField.key, e.target.value)}
                          className="w-10 h-8 cursor-pointer p-0.5 rounded"
                        />
                        <Input
                          type="text"
                          value={(colors as Record<string, string>)[colorField.key] || (defaultColors as Record<string, string>)[colorField.key]}
                          onChange={(e) => handleChange(colorField.key, e.target.value)}
                          placeholder="#000000"
                          className="font-mono text-xs flex-1 h-8"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          }
          return null;
        })}
      </div>
    );
  };

  // Theme preview component
  const renderThemePreview = (theme: 'light' | 'dark') => {
    const colors = theme === 'light' ? lightColors : darkColors;
    
    return (
      <div 
        className="rounded-lg border overflow-hidden"
        style={{ backgroundColor: colors.pageBackground }}
      >
        {/* Preview Header */}
        <div 
          className="px-4 py-3 flex items-center justify-between"
          style={{ backgroundColor: colors.headerBackground }}
        >
          <span style={{ color: colors.textPrimary }} className="font-semibold text-sm">Preview</span>
          <div className="flex gap-2">
            <span 
              style={{ color: colors.navActive }} 
              className="text-xs font-medium border-b-2"
            >
              Active
            </span>
            <span style={{ color: colors.textMuted }} className="text-xs">Tab</span>
          </div>
        </div>
        
        {/* Preview Card */}
        <div className="p-3">
          <div 
            className="rounded-lg p-3 mb-3"
            style={{ backgroundColor: colors.cardBackground }}
          >
            <h4 style={{ color: colors.textPrimary }} className="font-semibold text-sm mb-1">Card Title</h4>
            <p style={{ color: colors.textSecondary }} className="text-xs mb-2">Card description text</p>
            <p style={{ color: colors.textMuted }} className="text-xs">Muted helper text</p>
          </div>
          
          {/* Preview Buttons */}
          <div className="flex gap-2">
            <button 
              className="px-3 py-1.5 rounded text-xs font-medium"
              style={{ 
                backgroundColor: colors.buttonPrimary, 
                color: '#ffffff' 
              }}
            >
              Primary
            </button>
            <button 
              className="px-3 py-1.5 rounded text-xs font-medium"
              style={{ 
                backgroundColor: colors.buttonSecondary, 
                color: '#ffffff' 
              }}
            >
              Secondary
            </button>
          </div>
          
          {/* Preview Link */}
          <div className="mt-2">
            <span style={{ color: colors.linkDefault }} className="text-xs underline cursor-pointer">
              Sample link
            </span>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const hasAnyChanges = hasLightChanges || hasDarkChanges;

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
          <TabsTrigger value="tax" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            <span>Tax</span>
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
                    <div className="border-2 border-dashed border-border rounded-lg p-6 bg-muted flex items-center justify-center">
                      <img 
                        src={siteLogoData.logo.url} 
                        alt={siteLogoData.logo.altText || "Current Logo"} 
                        className="max-h-32 max-w-full object-contain"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">File: {siteLogoData.logo.fileName}</p>
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
                        className="flex items-center gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="border-2 border-dashed border-border rounded-lg p-8 bg-muted flex flex-col items-center justify-center gap-3">
                      <Upload className="w-12 h-12 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">No logo set. Upload a new one or select from Media Library.</p>
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
                    <div className="border-2 border-dashed border-border rounded-lg p-6 bg-muted flex items-center justify-center">
                      <img 
                        src={siteFaviconData.favicon.url} 
                        alt={siteFaviconData.favicon.altText || "Current Favicon"} 
                        className="max-h-16 max-w-full object-contain"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">File: {siteFaviconData.favicon.fileName}</p>
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
                        className="flex items-center gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="border-2 border-dashed border-border rounded-lg p-8 bg-muted flex flex-col items-center justify-center gap-3">
                      <Upload className="w-12 h-12 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">No favicon set. Upload a new one or select from Media Library.</p>
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
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Brand Colors
              </CardTitle>
              <CardDescription>
                Customize your website's color scheme for both light and dark themes. 
                Your visitors will see the appropriate theme based on their system preferences or theme toggle.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Light/Dark Theme Tabs */}
              <Tabs value={colorThemeTab} onValueChange={(v) => setColorThemeTab(v as 'light' | 'dark')}>
                <div className="flex items-center justify-between mb-4">
                  <TabsList className="grid w-64 grid-cols-2">
                    <TabsTrigger value="light" className="flex items-center gap-2">
                      <Sun className="w-4 h-4" />
                      <span>Light Theme</span>
                    </TabsTrigger>
                    <TabsTrigger value="dark" className="flex items-center gap-2">
                      <Moon className="w-4 h-4" />
                      <span>Dark Theme</span>
                    </TabsTrigger>
                  </TabsList>
                  
                  {colorThemeTab === 'dark' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAutoGenerateDarkColors}
                      className="flex items-center gap-2"
                    >
                      <Wand2 className="w-4 h-4" />
                      Auto-Generate from Light
                    </Button>
                  )}
                </div>

                <TabsContent value="light" className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    <div className="lg:col-span-3">
                      {renderColorSection('light')}
                    </div>
                    <div className="lg:col-span-1">
                      <div className="sticky top-4">
                        <h4 className="text-sm font-medium mb-2">Light Theme Preview</h4>
                        {renderThemePreview('light')}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={handleResetLightColors}
                      disabled={colorsSaving}
                      className="flex items-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reset Light Theme
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="dark" className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    <div className="lg:col-span-3">
                      {renderColorSection('dark')}
                    </div>
                    <div className="lg:col-span-1">
                      <div className="sticky top-4">
                        <h4 className="text-sm font-medium mb-2">Dark Theme Preview</h4>
                        {renderThemePreview('dark')}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={handleResetDarkColors}
                      disabled={colorsSaving}
                      className="flex items-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reset Dark Theme
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Global Apply Button */}
              <div className="flex items-center justify-end pt-4 border-t">
                <Button
                  onClick={handleApplyColors}
                  disabled={colorsSaving || !hasAnyChanges}
                  className="flex items-center gap-2"
                >
                  {colorsSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  {colorsSaving ? 'Saving...' : 'Apply All Changes'}
                </Button>
              </div>

              {hasAnyChanges && (
                <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md p-3 text-sm text-amber-800 dark:text-amber-200">
                  You have unsaved color changes. Click "Apply All Changes" to save your changes.
                  {hasLightChanges && hasDarkChanges && ' (Both themes modified)'}
                  {hasLightChanges && !hasDarkChanges && ' (Light theme modified)'}
                  {!hasLightChanges && hasDarkChanges && ' (Dark theme modified)'}
                </div>
              )}
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

        <TabsContent value="tax" className="space-y-4">
          <TenantTaxSettings />
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
