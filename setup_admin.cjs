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

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function setupAdmin() {
    const email = 'escarpelineparticular@gmail.com';
    const password = 'Admin@2026';

    console.log(`Configurando Super Admin: ${email}`);

    try {
        // 1. Criar ou obter usuário no Auth
        const { data: userData, error: userError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { name: 'Super Admin Principal' }
        });

        let userId;
        if (userError) {
            if (userError.message.includes('already registered')) {
                console.log("Usuário já existe no Auth. Buscando ID...");
                const { data: users } = await supabase.auth.admin.listUsers();
                const existing = users.users.find(u => u.email === email);
                userId = existing.id;
            } else {
                throw userError;
            }
        } else {
            userId = userData.user.id;
            console.log("Usuário criado com sucesso.");
        }

        // 2. Garantir que esteja em authorized_super_admins
        const { error: authAdminError } = await supabase
            .from('authorized_super_admins')
            .upsert({ email, is_active: true }, { onConflict: 'email' });

        if (authAdminError) throw authAdminError;
        console.log("E-mail autorizado na tabela authorized_super_admins.");

        // 3. Atribuir role super_admin em user_roles
        const { error: roleError } = await supabase
            .from('user_roles')
            .upsert({ user_id: userId, role: 'super_admin' }, { onConflict: 'user_id, role' });

        if (roleError) throw roleError;
        console.log("Cargo 'super_admin' atribuído com sucesso.");

        // 4. Perfil é criado via Trigger, mas vamos garantir
        const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
                user_id: userId,
                name: 'Super Admin Principal',
                email: email
            }, { onConflict: 'user_id' });

        if (profileError) console.log("Nota: Perfil pode ter sido criado via trigger (ok).");

        console.log("\n✅ TUDO PRONTO! Você já pode logar no sistema.");
        console.log(`URL: http://localhost:5173`);
        console.log(`Usuário: ${email}`);
        console.log(`Senha: ${password}`);

    } catch (err) {
        console.error("ERRO DURANTE CONFIGURAÇÃO:", err.message);
    }
}

setupAdmin();
