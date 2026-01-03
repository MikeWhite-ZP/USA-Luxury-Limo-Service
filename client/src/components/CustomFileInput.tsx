import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Upload, File, X } from 'lucide-react';

interface CustomFileInputProps {
  accept?: string;
  capture?: 'user' | 'environment';
  file: File | null;
  onFileChange: (file: File | null) => void;
  disabled?: boolean;
  className?: string;
  'data-testid'?: string;
}

export function CustomFileInput({
  accept = 'image/*,application/pdf',
  capture,
  file,
  onFileChange,
  disabled = false,
  className = '',
  'data-testid': testId,
}: CustomFileInputProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    onFileChange(selectedFile);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileChange(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const truncateFileName = (name: string, maxLength: number = 20) => {
    if (name.length <= maxLength) return name;
    const ext = name.split('.').pop() || '';
    const baseName = name.substring(0, name.length - ext.length - 1);
    const truncatedBase = baseName.substring(0, maxLength - ext.length - 4) + '...';
    return `${truncatedBase}.${ext}`;
  };

  return (
    <div className={`flex items-center gap-2 flex-1 ${className}`}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        capture={capture}
        onChange={handleChange}
        disabled={disabled}
        className="sr-only"
        data-testid={testId}
        aria-label={t('driverDashboard.documents.fileInput.selectFile')}
      />
      
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={disabled}
        className="h-8 px-3 text-xs shrink-0"
      >
        <Upload className="w-3.5 h-3.5 mr-1.5" />
        {t('driverDashboard.documents.fileInput.selectFile')}
      </Button>

      <div className="flex-1 flex items-center min-w-0">
        {file ? (
          <div className="flex items-center gap-1.5 px-2 py-1 bg-muted/50 rounded text-xs text-foreground min-w-0">
            <File className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="truncate" title={file.name}>
              {truncateFileName(file.name)}
            </span>
            <button
              type="button"
              onClick={handleClear}
              className="ml-1 p-0.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
              aria-label={t('driverDashboard.documents.fileInput.clearFile')}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground px-2">
            {t('driverDashboard.documents.fileInput.noFileSelected')}
          </span>
        )}
      </div>
    </div>
  );
}
