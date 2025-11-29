import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onGetUploadParameters?: () => Promise<{ method: 'PUT'; url: string }>;
  onComplete?: (result: { successful: Array<{ uploadURL: string }> }) => void;
  buttonClassName?: string;
  children?: React.ReactNode;
  'data-testid'?: string;
}

export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
  'data-testid': testId,
}: ObjectUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (files.length > maxNumberOfFiles) {
      alert(`Maximum ${maxNumberOfFiles} file(s) allowed`);
      return;
    }

    const file = files[0];
    if (file.size > maxFileSize) {
      alert(`File size must be less than ${Math.round(maxFileSize / 1024 / 1024)}MB`);
      return;
    }

    if (!onGetUploadParameters || !onComplete) {
      console.error('Missing upload handlers');
      return;
    }

    setIsUploading(true);

    try {
      const uploadParams = await onGetUploadParameters();
      
      // Upload file to the provided URL
      const uploadResponse = await fetch(uploadParams.url, {
        method: uploadParams.method,
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.statusText}`);
      }

      // Call onComplete with the upload URL
      onComplete({
        successful: [{ uploadURL: uploadParams.url }]
      });

    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      // Reset the input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
      />
      
      {children ? (
        <Button
          type="button"
          onClick={handleClick}
          disabled={isUploading}
          className={buttonClassName}
          data-testid={testId}
        >
          {children}
        </Button>
      ) : (
        <Button
          type="button"
          onClick={handleClick}
          disabled={isUploading}
          className={buttonClassName}
          data-testid={testId}
        >
          <Upload className="w-4 h-4 mr-2" />
          {isUploading ? 'Uploading...' : 'Upload File'}
        </Button>
      )}
    </>
  );
}