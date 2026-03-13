import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

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
      "app_fee_desc": "Taxas integradas ASAAS + app — transparência total",
      "marketing_highlight": "Enquanto outros sistemas só agendam, nós transformamos cada cliente em uma máquina de indicações",
      "be_franchisee": "Seja um Franqueado",
      "enter": "Entrar",
      "nav": {
        "schedule": "Agendar",
        "my_appointments": "Meus Agendamentos",
        "my_debts": "Minhas Dívidas",
        "accounting_services": "Serviços Contábeis",
        "cashback": "Cashback",
        "history": "Histórico",
        "refer_friends": "Indique Amigos",
        "friends_action": "Ação entre Amigos",
        "support": "Suporte",
        "notifications": "Notificações",
        "be_affiliate": "Seja Afiliado",
        "my_profile": "Meu Perfil",
        "logout": "Sair",
        "client": "Cliente"
      },
      "home": {
        "greeting": "Olá!",
        "find_barbershop": "Encontre uma barbearia e agende seu horário",
        "search_placeholder": "Buscar barbearia...",
        "available_barbershops": "Barbearias Disponíveis",
        "services_count": "{{count}} serviços"
      }
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
      "app_fee_desc": "Integrated ASAAS + app fees — total transparency",
      "marketing_highlight": "While other systems only schedule, we transform every client into a referral machine",
      "be_franchisee": "Become a Franchisee",
      "enter": "Login",
      "nav": {
        "schedule": "Schedule",
        "my_appointments": "My Appointments",
        "my_debts": "My Debts",
        "accounting_services": "Accounting Services",
        "cashback": "Cashback",
        "history": "History",
        "refer_friends": "Refer Friends",
        "friends_action": "Friends Action",
        "support": "Support",
        "notifications": "Notifications",
        "be_affiliate": "Become an Affiliate",
        "my_profile": "My Profile",
        "logout": "Logout",
        "client": "Client"
      },
      "home": {
        "greeting": "Hello!",
        "find_barbershop": "Find a barbershop and schedule your time",
        "search_placeholder": "Search barbershop...",
        "available_barbershops": "Available Barbershops",
        "services_count": "{{count}} services"
      }
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
      "app_fee_desc": "Tasas del gateway ASAAS + 0,5% de la app — transparencia total",
      "marketing_highlight": "Mientras outros sistemas solo programan, nosotros transformamos cada cliente en una máquina de recomendaciones",
      "be_franchisee": "Sea un Franquiciado",
      "enter": "Entrar",
      "nav": {
        "schedule": "Programar",
        "my_appointments": "Mis Citas",
        "my_debts": "Mis Deudas",
        "accounting_services": "Servicios Contables",
        "cashback": "Cashback",
        "history": "Historial",
        "refer_friends": "Recomendar Amigos",
        "friends_action": "Acción entre Amigos",
        "support": "Soporte",
        "notifications": "Notificaciones",
        "be_affiliate": "Ser Afiliado",
        "my_profile": "Mi Perfil",
        "logout": "Salir",
        "client": "Cliente"
      },
      "home": {
        "greeting": "¡Hola!",
        "find_barbershop": "Encuentra una barbería y programa tu horario",
        "search_placeholder": "Buscar barbería...",
        "available_barbershops": "Barberías Disponibles",
        "services_count": "{{count}} servicios"
      }
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
      "app_fee_desc": "Frais de passerelle ASAAS + 0,5% de frais d'application — transparence totale",
      "marketing_highlight": "Alors que d’autres systèmes ne font que planifier, nous transformons chaque client en une machine de parrainage",
      "be_franchisee": "Devenir Franchisé",
      "enter": "Connexion",
      "nav": {
        "schedule": "Prendre rendez-vous",
        "my_appointments": "Mes Rendez-vous",
        "my_debts": "Mes Dettes",
        "accounting_services": "Services Comptables",
        "cashback": "Cashback",
        "history": "Historique",
        "refer_friends": "Parrainer des Amis",
        "friends_action": "Action entre Amis",
        "support": "Support",
        "notifications": "Notifications",
        "be_affiliate": "Devenir Affilié",
        "my_profile": "Mon Profil",
        "logout": "Se déconnecter",
        "client": "Client"
      },
      "home": {
        "greeting": "Bonjour!",
        "find_barbershop": "Trouvez un salon de coiffure et prenez rendez-vous",
        "search_placeholder": "Rechercher un salon de coiffure...",
        "available_barbershops": "Salons de coiffure disponibles",
        "services_count": "{{count}} services"
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'pt',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['navigator', 'htmlTag', 'path', 'subdomain'],
      caches: ['localStorage', 'cookie'],
    }
  });

export default i18n;
