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
      "login": "Entrar",
      "get_started": "Começar Grátis",
      "features": "Funcionalidades",
      "pricing": "Preços",
      "trial_days": "7 dias grátis para testar",
      "no_credit_card": "Sem cartão de crédito. Cancele quando quiser.",
      "app_fee_desc": "Taxas do gateway ASAAS + 0,5% do app — transparência total"
    }
  },
  en: {
    translation: {
      "language": "Language",
      "welcome": "Welcome",
      "loading": "Loading...",
      "login": "Login",
      "get_started": "Get Started",
      "features": "Features",
      "pricing": "Pricing",
      "trial_days": "7 days free trial",
      "no_credit_card": "No credit card required. Cancel anytime.",
      "app_fee_desc": "ASAAS gateway fees + 0.5% app fee — total transparency"
    }
  },
  es: {
    translation: {
      "language": "Idioma",
      "welcome": "Bienvenido",
      "loading": "Cargando...",
      "login": "Entrar",
      "get_started": "Empezar Gratis",
      "features": "Funcionalidades",
      "pricing": "Precios",
      "trial_days": "7 días gratis para probar",
      "no_credit_card": "Sin tarjeta de crédito. Cancela cuando quieras.",
      "app_fee_desc": "Tasas del gateway ASAAS + 0,5% de la app — transparencia total"
    }
  },
  fr: {
    translation: {
      "language": "Langue",
      "welcome": "Bienvenue",
      "loading": "Chargement...",
      "login": "Connexion",
      "get_started": "Commencer Gratuitement",
      "features": "Fonctionnalités",
      "pricing": "Tarifs",
      "trial_days": "7 jours d'essai gratuit",
      "no_credit_card": "Sans carte de crédit. Annulez quand vous voulez.",
      "app_fee_desc": "Frais de passerelle ASAAS + 0,5% de frais d'application — transparence totale"
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
    },
    debug: false, // Desativar debug em produção
    react: {
      useSuspense: false, // Evitar suspense que pode causar página branca
    }
  });

export default i18n;
