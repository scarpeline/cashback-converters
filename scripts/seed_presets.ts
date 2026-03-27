import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Carregar variáveis do .env do projeto
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Variáveis de ambiente VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não encontradas.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const presets = [
  // BARBEARIA
  {
    sector: 'barbearia',
    specialty: 'barbearia_classica',
    icon: 'scissors',
    default_services: [
      { name: 'Corte de Cabelo', duration_minutes: 30, price: 50 },
      { name: 'Barba Completa', duration_minutes: 30, price: 40 },
      { name: 'Corte + Barba', duration_minutes: 60, price: 80 }
    ]
  },
  {
    sector: 'barbearia',
    specialty: 'barbearia_moderna',
    icon: 'zap',
    default_services: [
      { name: 'Corte Moderno (Fade)', duration_minutes: 45, price: 60 },
      { name: 'Barba Design', duration_minutes: 30, price: 45 },
      { name: 'Pigmentação', duration_minutes: 30, price: 30 }
    ]
  },
  // ESTETICA
  {
    sector: 'estetica',
    specialty: 'limpeza_pele',
    icon: 'sparkles',
    default_services: [
      { name: 'Limpeza de Pele Profunda', duration_minutes: 90, price: 150 },
      { name: 'Peeling de Diamante', duration_minutes: 45, price: 120 },
      { name: 'Hidratação Facial', duration_minutes: 30, price: 80 }
    ]
  },
  {
    sector: 'estetica',
    specialty: 'massoterapia',
    icon: 'smile',
    default_services: [
      { name: 'Massagem Relaxante', duration_minutes: 60, price: 100 },
      { name: 'Drenagem Linfática', duration_minutes: 60, price: 130 },
      { name: 'Massagem Modeladora', duration_minutes: 45, price: 110 }
    ]
  },
  // SAUDE
  {
    sector: 'saude',
    specialty: 'fisioterapia',
    icon: 'heart',
    default_services: [
      { name: 'Sessão de Fisioterapia', duration_minutes: 50, price: 120 },
      { name: 'Avaliação Inicial', duration_minutes: 60, price: 150 },
      { name: 'RPG', duration_minutes: 50, price: 140 }
    ]
  },
  {
    sector: 'saude',
    specialty: 'psicologia',
    icon: 'brain',
    default_services: [
      { name: 'Sessão de Terapia', duration_minutes: 50, price: 180 },
      { name: 'Primeira Consulta', duration_minutes: 60, price: 200 }
    ]
  }
];

async function seedPresets() {
  console.log('Iniciando limpeza e seed de sector_presets...');

  // Deletar presets existentes para evitar conflitos de UNIQUE
  const { error: deleteError } = await supabase
    .from('sector_presets')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Deleta tudo

  if (deleteError) {
    console.error('Erro ao limpar tabela:', deleteError.message);
    return;
  }

  console.log('Tabela limpa. Inserindo novos presets...');

  for (const preset of presets) {
    const { error } = await supabase
      .from('sector_presets')
      .insert(preset);

    if (error) {
      console.error(`Erro ao inserir preset ${preset.specialty}:`, error.message);
    } else {
      console.log(`Preset ${preset.specialty} inserido.`);
    }
  }

  console.log('Seed concluído.');
}

seedPresets();
