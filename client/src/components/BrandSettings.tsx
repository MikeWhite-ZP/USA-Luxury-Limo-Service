// Replace the handleLogoUpload function in BrandSettings.tsx (lines ~95-165)

const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>, logoType: 'logo' | 'favicon') => {
  const file = event.target.files?.[0];
  if (!file) return;

  // Validate file size (2MB limit)
  if (file.size > 2 * 1024 * 1024) {
    toast({
      title: 'Error',
      description: 'File size must be less than 2MB',
      variant: 'destructive',
    });
    return;
  }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    toast({
      title: 'Error',
      description: 'Please upload an image file',
      variant: 'destructive',
    });
    return;
  }

  // Capture the input element reference before async operations
  const inputElement = event.currentTarget;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', 'logos');
  formData.append('altText', `${logoType === 'logo' ? 'Company Logo' : 'Favicon'}`);

  // Show uploading toast
  toast({
    title: 'Uploading...',
    description: `Uploading ${logoType} to MinIO storage`,
  });

  try {
    // Upload to MinIO via CMS media endpoint
    const response = await fetch('/api/admin/cms/media/upload', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    // Get response text first to handle both JSON and non-JSON errors
    const responseText = await response.text();

    if (!response.ok) {
      console.error('Upload failed:', {
        status: response.status,
        statusText: response.statusText,
        body: responseText
      });

      // Try to parse as JSON, fallback to text
      let errorMessage = 'Upload failed';
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorData.error || 'Upload failed';
      } catch {
        errorMessage = responseText || `Server error (${response.status})`;
      }

      throw new Error(errorMessage);
    }

    // Parse successful response
    let media;
    try {
      media = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse response:', responseText);
      throw new Error('Invalid response from server');
    }

    if (!media.fileUrl) {
      throw new Error('No file URL returned from server');
    }

    const key = logoType === 'logo' ? 'BRAND_LOGO_URL' : 'BRAND_FAVICON_URL';

    // Save MinIO URL to settings
    handleSettingChange(
      key, 
      media.fileUrl, 
      'branding', 
      `${logoType === 'logo' ? 'Main company logo' : 'Browser favicon'}`
    );

    // Reset input to allow re-uploading the same file
    if (inputElement) {
      inputElement.value = '';
    }

    toast({
      title: 'Success',
      description: `${logoType === 'logo' ? 'Logo' : 'Favicon'} uploaded successfully`,
    });

  } catch (error) {
    console.error('Logo upload error:', error);

    // Reset input on error too
    if (inputElement) {
      inputElement.value = '';
    }

    toast({
      title: 'Upload Failed',
      description: error instanceof Error ? error.message : 'Failed to upload file. Please check server logs.',
      variant: 'destructive',
    });
  }
};