import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function checkSchema() {
  const { data, error } = await supabase
    .from('sector_presets')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Erro ao ler tabela:', error);
  } else {
    console.log('Dados da tabela:', data);
  }
}

checkSchema();
