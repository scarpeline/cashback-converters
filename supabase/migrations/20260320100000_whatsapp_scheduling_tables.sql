-- supabase/migrations/20260320100000_whatsapp_scheduling_tables.sql

-- Tabela para gerenciar o estado das conversas do WhatsApp
CREATE TABLE IF NOT EXISTS public.whatsapp_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
    client_whatsapp TEXT NOT NULL,
    current_step TEXT NOT NULL DEFAULT 'initial', -- Ex: 'initial', 'select_service', 'select_professional', 'confirm_booking'
    conversation_state JSONB DEFAULT '{}'::jsonb, -- Armazena dados temporários da conversa (serviço escolhido, data, etc.)
    last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (barbershop_id, client_whatsapp)
);

-- RLS para whatsapp_conversations
ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view their whatsapp conversations" ON public.whatsapp_conversations
    FOR SELECT USING (barbershop_id IN (SELECT id FROM public.barbershops WHERE owner_user_id = auth.uid()));

CREATE POLICY "Owners can insert their whatsapp conversations" ON public.whatsapp_conversations
    FOR INSERT WITH CHECK (barbershop_id IN (SELECT id FROM public.barbershops WHERE owner_user_id = auth.uid()));

CREATE POLICY "Owners can update their whatsapp conversations" ON public.whatsapp_conversations
    FOR UPDATE USING (barbershop_id IN (SELECT id FROM public.barbershops WHERE owner_user_id = auth.uid()));

CREATE POLICY "Owners can delete their whatsapp conversations" ON public.whatsapp_conversations
    FOR DELETE USING (barbershop_id IN (SELECT id FROM public.barbershops WHERE owner_user_id = auth.uid()));


-- Tabela para armazenar templates de mensagens do WhatsApp
CREATE TABLE IF NOT EXISTS public.whatsapp_message_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
    template_name TEXT NOT NULL, -- Ex: 'booking_confirmation', 'waitlist_offer', 'ask_service'
    template_content TEXT NOT NULL, -- O conteúdo da mensagem com placeholders (ex: "Olá {client_name}, seu agendamento...")
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (barbershop_id, template_name)
);

-- RLS para whatsapp_message_templates
ALTER TABLE public.whatsapp_message_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view their whatsapp message templates" ON public.whatsapp_message_templates
    FOR SELECT USING (barbershop_id IN (SELECT id FROM public.barbershops WHERE owner_user_id = auth.uid()));

CREATE POLICY "Owners can insert their whatsapp message templates" ON public.whatsapp_message_templates
    FOR INSERT WITH CHECK (barbershop_id IN (SELECT id FROM public.barbershops WHERE owner_user_id = auth.uid()));

CREATE POLICY "Owners can update their whatsapp message templates" ON public.whatsapp_message_templates
    FOR UPDATE USING (barbershop_id IN (SELECT id FROM public.barbershops WHERE owner_user_id = auth.uid()));

CREATE POLICY "Owners can delete their whatsapp message templates" ON public.whatsapp_message_templates
    FOR DELETE USING (barbershop_id IN (SELECT id FROM public.barbershops WHERE owner_user_id = auth.uid()));

-- Inserir templates padrão (para o caso de não haver um barbershop_id específico, ou para ser copiado no onboarding)
INSERT INTO public.whatsapp_message_templates (barbershop_id, template_name, template_content, description, is_active)
VALUES
(
    (SELECT id FROM public.barbershops LIMIT 1), -- Substituir por ID real ou gerenciar no onboarding
    'welcome_message',
    'Olá {client_name}! Bem-vindo(a) ao nosso agendamento via WhatsApp. Como posso ajudar?\n\n1. Agendar um serviço\n2. Ver meus agendamentos\n3. Cancelar um agendamento\n4. Falar com um atendente',
    'Mensagem de boas-vindas para iniciar a conversa',
    TRUE
),
(
    (SELECT id FROM public.barbershops LIMIT 1),
    'ask_service',
    'Certo, {client_name}. Qual serviço você gostaria de agendar?',
    'Pergunta qual serviço o cliente deseja agendar',
    TRUE
),
(
    (SELECT id FROM public.barbershops LIMIT 1),
    'ask_date',
    'Para qual data, {client_name}? (Ex: DD/MM/AAAA)',
    'Pergunta a data desejada para o agendamento',
    TRUE
),
(
    (SELECT id FROM public.barbershops LIMIT 1),
    'ask_time',
    'E qual horário, {client_name}? (Ex: HH:MM)',
    'Pergunta o horário desejado para o agendamento',
    TRUE
),
(
    (SELECT id FROM public.barbershops LIMIT 1),
    'ask_professional',
    'Com qual profissional, {client_name}? (Se tiver preferência)',
    'Pergunta o profissional desejado',
    TRUE
),
(
    (SELECT id FROM public.barbershops LIMIT 1),
    'booking_confirmation',
    'Perfeito, {client_name}! Seu agendamento de {service_name} com {professional_name} para {date} às {time} foi confirmado. Te esperamos!',
    'Confirmação final de agendamento',
    TRUE
),
(
    (SELECT id FROM public.barbershops LIMIT 1),
    'booking_cancellation_success',
    'Seu agendamento de {service_name} para {date} às {time} foi cancelado com sucesso, {client_name}.',
    'Confirmação de cancelamento de agendamento',
    TRUE
),
(
    (SELECT id FROM public.barbershops LIMIT 1),
    'no_slots_available',
    'Desculpe, {client_name}, não encontramos horários disponíveis para {service_name} na data e horário solicitados. Gostaria de tentar outra data/horário ou entrar na fila de espera?',
    'Mensagem quando não há horários disponíveis',
    TRUE
),
(
    (SELECT id FROM public.barbershops LIMIT 1),
    'invalid_input',
    'Desculpe, {client_name}, não entendi sua resposta. Por favor, tente novamente ou digite "ajuda".',
    'Mensagem para entrada inválida do cliente',
    TRUE
);