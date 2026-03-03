import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Textos em vários idiomas
const resources = {
  pt: {
    translation: {
      "language": "Idioma",
      "welcome": "Bem-vindo",
      "loading": "Carregando...",
    }
  },
  en: {
    translation: {
      "language": "Language",
      "welcome": "Welcome",
      "loading": "Loading...",
    }
  },
  es: {
    translation: {
      "language": "Idioma",
      "welcome": "Bienvenido",
      "loading": "Cargando...",
    }
  },
  fr: {
    translation: {
      "language": "Langue",
      "welcome": "Bienvenue",
      "loading": "Chargement...",
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'pt', // Idioma padrão caso a detecção falhe ou não tenha o idioma
    interpolation: {
      escapeValue: false, // React já protege contra XSS
    },
    detection: {
      order: ['navigator', 'htmlTag', 'path', 'subdomain'],
      caches: ['localStorage', 'cookie'],
    }
  });

export default i18n;
