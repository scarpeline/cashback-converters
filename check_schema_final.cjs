const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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
const serviceRoleKey = 'sb_secret_p_OLE0EDYiUHZb_xZxHnIQ_SYT5gly5';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function applyLocalSchema() {
    console.log("Tentando aplicar esquema local via SQL...");

    // Como o Supabase-JS não tem um método .sql() direto, precisaremos usar um hack 
    // via RPC ou orientar o usuário a colar o full_schema.sql no console.
    // Vamos tentar verificar se a tabela existe de novo após um pequeno delay.

    console.log("Aguardando 5 segundos para o cache de esquema do Supabase atualizar...");
    await new Promise(r => setTimeout(r, 5000));

    try {
        const { data: adminExists, error: checkError } = await supabase
            .from('authorized_super_admins')
            .select('email')
            .limit(1);

        if (checkError) {
            console.log("As tabelas ainda não estão visíveis via API.");
            console.log("\n⚠️ AÇÃO MANUAL NECESSÁRIA:");
            console.log("1. Abra o arquivo 'full_schema.sql' que eu criei na pasta raiz do projeto.");
            console.log("2. Copie todo o seu conteúdo.");
            console.log("3. Vá ao painel do Supabase > SQL Editor > New Query.");
            console.log("4. Cole o código e clique em RUN.");
            console.log("5. Depois que você fizer isso, me avise ou eu tentarei criar seu usuário novamente.");
        } else {
            console.log("Esquema detectado! Rodando criação do super admin...");
            // Re-executar o script de admin
            require('./setup_admin.cjs');
        }
    } catch (err) {
        console.error("Erro:", err.message);
    }
}

applyLocalSchema();
