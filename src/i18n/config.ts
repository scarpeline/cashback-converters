import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Importações de arquivos de tradução
import commonPt from './locales/pt/common.json';
import commonEn from './locales/en/common.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      pt: {
        common: commonPt,
      },
      en: {
        common: commonEn,
      },
    },
    fallbackLng: 'pt',
    ns: ['common'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false, // react já protege contra xss
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
