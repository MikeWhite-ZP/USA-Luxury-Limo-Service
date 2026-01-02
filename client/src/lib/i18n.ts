import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Cookies from 'js-cookie';

import enCommon from '../locales/en/common.json';
import esCommon from '../locales/es/common.json';
import trCommon from '../locales/tr/common.json';
import frCommon from '../locales/fr/common.json';
import deCommon from '../locales/de/common.json';
import itCommon from '../locales/it/common.json';
import ruCommon from '../locales/ru/common.json';

export const LANGUAGE_COOKIE_KEY = 'i18nextLng';
export const COOKIE_EXPIRY_DAYS = 365;

export const supportedLanguages = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇲🇽' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
] as const;

export type SupportedLanguage = typeof supportedLanguages[number]['code'];

const resources = {
  en: { common: enCommon },
  es: { common: esCommon },
  tr: { common: trCommon },
  fr: { common: frCommon },
  de: { common: deCommon },
  it: { common: itCommon },
  ru: { common: ruCommon },
};

const savedLanguage = Cookies.get(LANGUAGE_COOKIE_KEY);

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    lng: savedLanguage || undefined,
    defaultNS: 'common',
    ns: ['common'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['cookie', 'localStorage', 'navigator', 'htmlTag'],
      lookupCookie: LANGUAGE_COOKIE_KEY,
      lookupLocalStorage: LANGUAGE_COOKIE_KEY,
      caches: ['cookie', 'localStorage'],
      cookieMinutes: COOKIE_EXPIRY_DAYS * 24 * 60,
    },
    react: {
      useSuspense: false,
    },
  });

export const changeLanguage = (languageCode: SupportedLanguage) => {
  Cookies.set(LANGUAGE_COOKIE_KEY, languageCode, { expires: COOKIE_EXPIRY_DAYS });
  i18n.changeLanguage(languageCode);
};

export const getCurrentLanguage = (): SupportedLanguage => {
  return (i18n.language?.substring(0, 2) as SupportedLanguage) || 'en';
};

export const getLanguageInfo = (code: SupportedLanguage) => {
  return supportedLanguages.find(lang => lang.code === code) || supportedLanguages[0];
};

export default i18n;
