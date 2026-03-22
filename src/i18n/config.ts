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
    fallbackLng: 'pt-BR',
    ns: ['common'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      // Prioriza 'navigator' para detecção automática por região (Regra Global)
      order: ['localStorage', 'navigator', 'querystring', 'cookie', 'htmlTag'],
      lookupQuerystring: 'lng',
      lookupCookie: 'i18next',
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage', 'cookie'],
    },
    // Suporte para detecção de pt-BR automaticamente e outras variantes
    supportedLngs: ['pt-BR', 'en', 'es', 'fr'],
    nonExplicitSupportedLngs: true,
    // Garante init síncrono (recursos já estão em memória)
    initImmediate: false,
  });

export default i18n;
