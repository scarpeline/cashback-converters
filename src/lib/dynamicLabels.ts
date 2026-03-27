import { useAuth } from "@/lib/auth";

interface DynamicLabelConfig {
  default: string;
  [sector: string]: string | { [specialty: string]: string };
}

const LABEL_CONFIGS: { [key: string]: DynamicLabelConfig } = {
  professionals: {
    default: "Profissionais",
    beleza_estetica: {
      barbearia: "Barbeiros",
      nail_designer: "Nail Designers",
      maquiadora: "Maquiadoras",
      salao_de_beleza: "Cabeleireiros e Manicures",
      massagem: "Massoterapeutas",
    },
    saude_bem_estar: {
      fisioterapia: "Fisioterapeutas",
      pilates: "Instrutores",
      nutricao: "Nutricionistas",
      psicologia: "Psicólogos",
    },
    educacao_mentorias: {
      aulas_particulares: "Professores",
      coaching: "Coaches",
      idiomas: "Professores de Idiomas",
    },
    automotivo: {
      oficina: "Mecânicos",
      estetica_automotiva: "Especialistas",
    },
    pets: {
      banho_tosa: "Groomers",
      veterinario: "Veterinários",
    },
    servicos_domiciliares: {
      eletricista: "Eletricistas",
      encanador: "Encanadores",
      diarista: "Diaristas",
    },
    juridico_financeiro: {
      advogado: "Advogados",
      contador: "Contadores",
    },
    espacos_locacao: {
      default: "Gestores", // Para quem gerencia o espaço
    },
  },
  services: {
    default: "Serviços",
    beleza_estetica: {
      barbearia: "Serviços de Barbearia",
      nail_designer: "Serviços de Unhas",
      maquiadora: "Serviços de Maquiagem",
      salao_de_beleza: "Serviços de Salão",
      massagem: "Serviços de Massagem",
    },
    saude_bem_estar: {
      fisioterapia: "Sessões de Fisioterapia",
      pilates: "Aulas de Pilates",
      nutricao: "Consultas de Nutrição",
      psicologia: "Sessões de Psicologia",
    },
    educacao_mentorias: {
      aulas_particulares: "Aulas",
      coaching: "Sessões de Coaching",
      idiomas: "Aulas de Idiomas",
    },
    automotivo: {
      oficina: "Serviços Mecânicos",
      estetica_automotiva: "Serviços de Estética",
    },
    pets: {
      banho_tosa: "Serviços Pet",
      veterinario: "Consultas Veterinárias",
    },
    servicos_domiciliares: {
      default: "Serviços",
    },
    juridico_financeiro: {
      default: "Consultorias",
    },
    espacos_locacao: {
      default: "Locações",
    },
  },
  resources: {
    default: "Recursos",
    espacos_locacao: {
      default: "Espaços",
    },
  },
  appointments: {
    default: "Agendamentos",
    educacao_mentorias: {
      default: "Aulas/Sessões",
    },
    espacos_locacao: {
      default: "Reservas",
    },
  },
  clients: {
    default: "Clientes",
    pets: {
      default: "Tutores",
    },
  },
  reports: {
    default: "Relatórios",
  },
  settings: {
    default: "Configurações",
  },
  automations: {
    default: "Automações",
  },
  policies: {
    default: "Políticas",
  },
};

export function getDynamicLabel(key: string): string {
  const { barbershop } = useAuth();
  const config = LABEL_CONFIGS[key];

  if (!config) {
    return key.charAt(0).toUpperCase() + key.slice(1); // Fallback to capitalized key
  }

  if (barbershop?.sector && barbershop?.specialty) {
    const sectorConfig = config[barbershop.sector];
    if (typeof sectorConfig === 'object' && sectorConfig !== null) {
      const val = (sectorConfig as Record<string, string>)[barbershop.specialty] || (sectorConfig as Record<string, string>).default || config.default;
      return val;
    }
    return (typeof sectorConfig === 'string' ? sectorConfig : config.default);
  }

  return config.default;
}