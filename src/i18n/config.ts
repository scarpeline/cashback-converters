import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Importações de arquivos de tradução
import commonPt from './locales/pt/common.json';
import commonEn from './locales/en/common.json';
import commonEs from './locales/es/common.json';
import commonFr from './locales/fr/common.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      pt: { common: commonPt },
      en: { common: commonEn },
      es: { common: commonEs },
      fr: { common: commonFr },
    },
    fallbackLng: 'pt',
    ns: ['common'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['queryString', 'cookie', 'localStorage', 'navigator', 'htmlTag'],
      lookupQuerystring: 'lng',
      lookupCookie: 'i18next',
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage', 'cookie'],
    },
  });

export default i18n;
