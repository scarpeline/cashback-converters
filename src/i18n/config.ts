import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import commonPt from './locales/pt/common.json';
import commonEn from './locales/en/common.json';
import commonEs from './locales/es/common.json';
import commonFr from './locales/fr/common.json';

// Mapa de regiões para código base suportado
const REGION_MAP: Record<string, string> = {
  'pt-BR': 'pt', 'pt-PT': 'pt', 'pt-AO': 'pt', 'pt-MZ': 'pt',
  'en-US': 'en', 'en-GB': 'en', 'en-AU': 'en', 'en-CA': 'en',
  'es-ES': 'es', 'es-MX': 'es', 'es-AR': 'es', 'es-CO': 'es',
  'fr-FR': 'fr', 'fr-BE': 'fr', 'fr-CA': 'fr', 'fr-CH': 'fr',
};

// Normaliza locale com região para código base (ex: 'pt-BR' → 'pt')
function normalizeLocale(locale: string): string {
  if (REGION_MAP[locale]) return REGION_MAP[locale];
  const base = locale.split('-')[0].toLowerCase();
  return ['pt', 'en', 'es', 'fr'].includes(base) ? base : 'pt';
}

// Limpa localStorage se tiver valor com região (ex: 'pt-BR' → 'pt')
const stored = localStorage.getItem('i18nextLng');
if (stored && stored.includes('-')) {
  const normalized = normalizeLocale(stored);
  localStorage.setItem('i18nextLng', normalized);
}

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
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
      // Converte 'pt-BR' → 'pt' antes de usar
      convertDetectedLanguage: (lng: string) => normalizeLocale(lng),
    },
    nonExplicitSupportedLngs: false,
    load: 'languageOnly',
    initImmediate: false,
  });

export default i18n;
