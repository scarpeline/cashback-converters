const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

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
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDataMigration() {
    console.log(`Relatório de Dados - Novo Projeto: ${supabaseUrl}`);

    const tables = [
        'profiles', 'user_roles', 'barbershops', 'professionals',
        'services', 'appointments', 'payments', 'affiliates',
        'accountants', 'notifications', 'authorized_super_admins'
    ];

    const results = [];

    for (const table of tables) {
        try {
            const { data, count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
            if (error) {
                results.push({ Tabela: table, Status: 'ERRO', Registros: 0, Mensagem: error.message });
            } else {
                results.push({ Tabela: table, Status: 'OK', Registros: count, Mensagem: count > 0 ? 'DADOS PRESENTES' : 'VAZIA' });
            }
        } catch (e) {
            results.push({ Tabela: table, Status: 'EXCEÇÃO', Registros: 0, Mensagem: e.message });
        }
    }

    console.table(results);
}

checkDataMigration();
