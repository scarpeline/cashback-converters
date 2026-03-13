const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Helper para ler .env
function getEnv() {
    const envPath = path.join(__dirname, '.env');
    if (!fs.existsSync(envPath)) return {};
    const content = fs.readFileSync(envPath, 'utf8');
    const env = {};
    content.split('\n').forEach(line => {
        const [key, ...value] = line.split('=');
        if (key && value) {
            env[key.trim()] = value.join('=').trim().replace(/^"(.*)"$/, '$1');
        }
    });
    return env;
}

const env = getEnv();
// IMPORTANTE: Aqui usamos o Service Role Key do NOVO projeto se o usuário fornecer, 
// senham usamos a Anon Key para o que for possível.
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seedNewProject() {
    console.log(`Inicializando projeto: ${supabaseUrl}`);

    // 1. Verificar se o Super Admin inicial já existe ou precisa ser criado via Trigger
    // Como não temos a Service Role aqui, vamos orientar o usuário a rodar o SQL de seeding no painel
    console.log("DICA: Para criar os dados iniciais sem a Service Role Key, execute o SQL abaixo no seu painel Supabase:");

    const seedSql = `
-- Inserir super admins autorizados
INSERT INTO public.authorized_super_admins (email) 
VALUES ('escarpelineparticular@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- Os usuários AUTH precisam ser criados via interface do Supabase (Authentication > Users)
-- Ou via script se você me fornecer a Service Role Key do projeto NOVO.
  `;

    console.log(seedSql);
}

seedNewProject();
