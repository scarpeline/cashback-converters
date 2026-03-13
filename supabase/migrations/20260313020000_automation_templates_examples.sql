-- Templates de Remarketing Inteligente com Verificação de Assinatura
-- Inseridos automaticamente para demonstrar o novo sistema

-- Template de E-mail para Clientes
INSERT INTO public.automation_templates (
  name, channel, user_role, subject, content, variables, is_active
) VALUES (
  'Remarketing Cliente - Inatividade',
  'email',
  'cliente',
  'Sentimos sua falta, {nome}! 🎯',
  'Olá {nome},

Notamos que você está há {dias_inativo} dias sem acessar o Salão CashBack.

😊 Que bom ver você de volta! Estamos com novidades esperando por você.

{status_assinatura === "pendente" ? (
  "🚀 Que tal assinar nosso plano e ter acesso a todos os recursos?
  Clique aqui: {link_assinatura}"
) : (
  "✨ Continue aproveitando nossa plataforma!
  Acesse agora: {link_reativacao}"
)}

Estamos aqui para ajudar seu negócio decolar! 💈

Atenciosamente,
Equipe Salão CashBack',
  '{"nome": "string", "dias_inativo": "number", "link_reativacao": "string", "link_assinatura": "string", "status_assinatura": "string"}',
  true
) ON CONFLICT DO NOTHING;

-- Template de SMS para Donos de Barbearia
INSERT INTO public.automation_templates (
  name, channel, user_role, subject, content, variables, is_active
) VALUES (
  'Remarketing Dono - SMS Rápido',
  'sms',
  'dono',
  NULL,
  'Salão CashBack: {nome}, faz {dias_inativo} dias sem acessar! 📊 
Sua barbearia está perdendo oportunidades. 
Volte agora: {link_reativacao}
Assine: {link_assinatura}',
  '{"nome": "string", "dias_inativo": "number", "link_reativacao": "string", "link_assinatura": "string"}',
  true
) ON CONFLICT DO NOTHING;

-- Template de WhatsApp para Profissionais
INSERT INTO public.automation_templates (
  name, channel, user_role, subject, content, variables, is_active
) VALUES (
  'Remarketing Profissional - WhatsApp',
  'whatsapp',
  'profissional',
  NULL,
  '💈 Olá {nome}!

Sentimos sua falta no Salão CashBack! 
Já faz {dias_inativo} dias que não vemos por aqui.

🎯 Novos clientes estão esperando por você!
{status_assinatura === "pendente" ? (
  "🔥 Assine agora e destaque seu perfil: {link_assinatura}"
) : (
  "⚡ Volte e agende mais clientes: {link_reativacao}"
)}

Estamos contando com você! 💪',
  '{"nome": "string", "dias_inativo": "number", "link_reativacao": "string", "link_assinatura": "string", "status_assinatura": "string"}',
  true
) ON CONFLICT DO NOTHING;

-- Template de E-mail para Afiliados SaaS
INSERT INTO public.automation_templates (
  name, channel, user_role, subject, content, variables, is_active
) VALUES (
  'Remarketing Afiliado SaaS - Oportunidade',
  'email',
  'afiliado_saas',
  '🚀 Oportunidades esperando por você, {nome}!',
  'Olá {nome},

Há {dias_inativo} dias você não está explorando as oportunidades do Salão CashBack.

💰 Enquanto você esteve ausente:
• Novas barbearias se cadastraram
• Comissões foram geradas
• O mercado continua crescendo

{status_assinatura === "pendente" ? (
  "🎯 Não perca mais essa chance!
  Assine nosso plano SaaS: {link_assinatura}
  
  Comissões de até 60% esperam por você!"
) : (
  "✨ Continue sua jornada de sucesso!
  Volte agora: {link_reativacao}"
)}

O sucesso não espera. Estamos esperando por você! 🏆

Atenciosamente,
Equipe Salão CashBack',
  '{"nome": "string", "dias_inativo": "number", "link_reativacao": "string", "link_assinatura": "string", "status_assinatura": "string"}',
  true
) ON CONFLICT DO NOTHING;
