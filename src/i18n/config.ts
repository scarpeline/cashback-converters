import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import commonPt from './locales/pt/common.json';
import commonEn from './locales/en/common.json';
import commonEs from './locales/es/common.json';
import commonFr from './locales/fr/common.json';

// Inicialização síncrona — evita race condition com React.createContext
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
    supportedLngs: ['pt', 'en', 'es', 'fr'],
    ns: ['common'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false, 
    },
    detection: {
      order: ['querystring', 'cookie', 'localStorage', 'navigator', 'htmlTag'],
      lookupQuerystring: 'lng',
      lookupCookie: 'i18next',
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage', 'cookie'],
    },
    nonExplicitSupportedLngs: true,
    load: 'languageOnly', // Carrega 'pt' mesmo se detectar 'pt-BR'
    initImmediate: false,
  });

export default i18n;
