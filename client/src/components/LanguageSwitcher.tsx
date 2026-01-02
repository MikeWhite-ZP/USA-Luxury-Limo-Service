import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Globe, Check } from 'lucide-react';
import {
  supportedLanguages,
  changeLanguage,
  getCurrentLanguage,
  type SupportedLanguage,
} from '@/lib/i18n';

interface LanguageSwitcherProps {
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
  showFlag?: boolean;
  className?: string;
}

export function LanguageSwitcher({
  variant = 'ghost',
  size = 'sm',
  showLabel = false,
  showFlag = true,
  className = '',
}: LanguageSwitcherProps) {
  const { t } = useTranslation();
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>(getCurrentLanguage());

  const handleLanguageChange = (langCode: SupportedLanguage) => {
    changeLanguage(langCode);
    setCurrentLang(langCode);
  };

  const currentLanguage = supportedLanguages.find(lang => lang.code === currentLang) || supportedLanguages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={`gap-1.5 ${className}`}
          aria-label={t('language.select')}
        >
          {showFlag && (
            <span className="text-lg leading-none" role="img" aria-label={currentLanguage.name}>
              {currentLanguage.flag}
            </span>
          )}
          {!showFlag && <Globe className="h-4 w-4" />}
          {showLabel && (
            <span className="hidden sm:inline text-sm font-medium">
              {currentLanguage.nativeName}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[180px]">
        {supportedLanguages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className="flex items-center justify-between gap-3 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg leading-none" role="img" aria-label={language.name}>
                {language.flag}
              </span>
              <span className="font-medium">{language.nativeName}</span>
            </div>
            {currentLang === language.code && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function LanguageSwitcherCompact({ className = '' }: { className?: string }) {
  return (
    <LanguageSwitcher
      variant="ghost"
      size="icon"
      showLabel={false}
      showFlag={true}
      className={className}
    />
  );
}

export function LanguageSwitcherFull({ className = '' }: { className?: string }) {
  return (
    <LanguageSwitcher
      variant="outline"
      size="default"
      showLabel={true}
      showFlag={true}
      className={className}
    />
  );
}
