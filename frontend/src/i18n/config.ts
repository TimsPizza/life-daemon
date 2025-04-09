import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import language resources
import translationEN from './locales/en/translation.json';
import translationFR from './locales/fr/translation.json';
import translationCN from './locales/cn/translation.json';
import translationJP from './locales/jp/translation.json';

const resources = {
  en: {
    translation: translationEN,
  },
  fr: {
    translation: translationFR,
  },
  cn: {
    translation: translationCN,
  },
  jp: {
    translation: translationJP,
  },
};

i18n
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Init i18next
  .init({
    debug: import.meta.env.DEV, // Enable debug output in development
    fallbackLng: 'en', // Use 'en' if detected language is not available
    interpolation: {
      escapeValue: false, // React already safes from xss
    },
    resources,
    supportedLngs: ['en', 'fr', 'cn', 'jp'],
    detection: {
      order: ['querystring', 'cookie', 'localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage', 'cookie'],
      lookupQuerystring: 'lang',
      lookupCookie: 'i18next',
      lookupLocalStorage: 'i18nextLng',
    },
  });

// Add language mapping
i18n.services.languageUtils.getLanguagePartFromCode = function(code: string) {
  const languageMap: { [key: string]: string } = {
    zh: 'cn',
    'zh-CN': 'cn',
    'zh-TW': 'cn',
    'zh-HK': 'cn',
    ja: 'jp'
  };
  return languageMap[code] || code;
};

export default i18n;
