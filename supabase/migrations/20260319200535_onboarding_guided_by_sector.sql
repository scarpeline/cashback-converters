-- Add sector, specialty, and onboarding_status to barbershops table
ALTER TABLE public.barbershops
ADD COLUMN sector TEXT,
ADD COLUMN specialty TEXT,
ADD COLUMN onboarding_status TEXT DEFAULT 'pending';

-- Create sector_presets table
CREATE TABLE public.sector_presets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sector TEXT NOT NULL,
    specialty TEXT NOT NULL,
    default_services JSONB DEFAULT '[]'::jsonb,
    default_automations JSONB DEFAULT '[]'::jsonb,
    default_policies JSONB DEFAULT '[]'::jsonb,
    default_resources JSONB DEFAULT '[]'::jsonb,
    description TEXT,
    icon TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(sector, specialty)
);

-- Set up Row Level Security (RLS) for sector_presets
ALTER TABLE public.sector_presets ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all authenticated users to read sector_presets
CREATE POLICY "Allow authenticated users to read sector_presets"
ON public.sector_presets FOR SELECT
USING (auth.role() = 'authenticated');

-- Policy: Allow super_admins to manage sector_presets
CREATE POLICY "Allow super_admins to manage sector_presets"
ON public.sector_presets FOR ALL
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

-- Insert initial data into sector_presets
INSERT INTO public.sector_presets (sector, specialty, description, icon, default_services, default_automations, default_policies) VALUES
('beleza_estetica', 'barbearia', 'Configurações padrão para barbearias', 'scissors',
    '[
        {"name": "Corte Masculino", "duration": 45, "price": 50.00, "description": "Corte de cabelo masculino clássico ou moderno."},
        {"name": "Barba", "duration": 30, "price": 35.00, "description": "Modelagem e finalização da barba."},
        {"name": "Corte + Barba", "duration": 75, "price": 80.00, "description": "Combo de corte de cabelo e barba."}
    ]',
    '[
        {"type": "reminder", "event": "24h_before", "message": "Olá {client_name}, lembrete do seu agendamento de {service_name} amanhã às {time} com {professional_name}."},
        {"type": "confirmation", "event": "booking_created", "message": "Olá {client_name}, seu agendamento de {service_name} com {professional_name} foi confirmado para {date} às {time}."}
    ]',
    '{"deposit_required": false, "cancellation_window_hours": 24}'
),
('beleza_estetica', 'nail_designer', 'Configurações padrão para nail designers', 'nail_polish',
    '[
        {"name": "Manicure Simples", "duration": 45, "price": 30.00, "description": "Corte, lixa, esmaltação."},
        {"name": "Alongamento em Gel", "duration": 120, "price": 150.00, "description": "Aplicação de gel com tips."},
        {"name": "Pedicure Completa", "duration": 60, "price": 40.00, "description": "Corte, lixa, esfoliação, esmaltação."}
    ]',
    '[
        {"type": "reminder", "event": "24h_before", "message": "Olá {client_name}, lembrete do seu agendamento de {service_name} amanhã às {time} com {professional_name}."},
        {"type": "confirmation", "event": "booking_created", "message": "Olá {client_name}, seu agendamento de {service_name} com {professional_name} foi confirmado para {date} às {time}."}
    ]',
    '{"deposit_required": false, "cancellation_window_hours": 12}'
),
('beleza_estetica', 'maquiadora', 'Configurações padrão para maquiadoras', 'palette',
    '[
        {"name": "Maquiagem Social", "duration": 90, "price": 120.00, "description": "Maquiagem para eventos sociais."},
        {"name": "Maquiagem Noiva", "duration": 180, "price": 350.00, "description": "Maquiagem completa para noivas, incluindo teste."},
        {"name": "Curso Auto Maquiagem", "duration": 240, "price": 250.00, "description": "Aula particular de auto maquiagem."}
    ]',
    '[
        {"type": "reminder", "event": "24h_before", "message": "Olá {client_name}, lembrete do seu agendamento de {service_name} amanhã às {time} com {professional_name}."},
        {"type": "confirmation", "event": "booking_created", "message": "Olá {client_name}, seu agendamento de {service_name} com {professional_name} foi confirmado para {date} às {time}."}
    ]',
    '{"deposit_required": true, "deposit_percentage": 30, "cancellation_window_hours": 48}'
),
-- Adicionando mais presets para beleza_estetica
('beleza_estetica', 'salao_de_beleza', 'Configurações padrão para salões de beleza (cabelo, unhas, estética)', 'salon',
    '[
        {"name": "Corte Feminino", "duration": 60, "price": 80.00, "description": "Corte de cabelo feminino com lavagem e secagem."},
        {"name": "Coloração", "duration": 120, "price": 150.00, "description": "Aplicação de coloração completa."},
        {"name": "Penteado", "duration": 90, "price": 100.00, "description": "Penteado para festas e eventos."}
    ]',
    '[
        {"type": "reminder", "event": "24h_before", "message": "Olá {client_name}, lembrete do seu agendamento de {service_name} amanhã às {time} com {professional_name}."},
        {"type": "confirmation", "event": "booking_created", "message": "Olá {client_name}, seu agendamento de {service_name} com {professional_name} foi confirmado para {date} às {time}."}
    ]',
    '{"deposit_required": false, "cancellation_window_hours": 24}'
),
-- Adicionando presets para saude_bem_estar
('saude_bem_estar', 'massagista', 'Configurações padrão para massagistas e terapeutas corporais', 'massage',
    '[
        {"name": "Massagem Relaxante", "duration": 60, "price": 90.00, "description": "Massagem para alívio de tensões e relaxamento."},
        {"name": "Drenagem Linfática", "duration": 90, "price": 120.00, "description": "Massagem para redução de inchaço e melhora da circulação."},
        {"name": "Massagem Terapêutica", "duration": 60, "price": 100.00, "description": "Massagem focada em pontos de dor e recuperação muscular."}
    ]',
    '[
        {"type": "reminder", "event": "24h_before", "message": "Olá {client_name}, lembrete do seu agendamento de {service_name} amanhã às {time} com {professional_name}."},
        {"type": "confirmation", "event": "booking_created", "message": "Olá {client_name}, seu agendamento de {service_name} com {professional_name} foi confirmado para {date} às {time}."}
    ]',
    '{"deposit_required": false, "cancellation_window_hours": 12}'
),
('saude_bem_estar', 'fisioterapeuta', 'Configurações padrão para fisioterapeutas e clínicas de reabilitação', 'physio',
    '[
        {"name": "Avaliação Fisioterapêutica", "duration": 60, "price": 150.00, "description": "Primeira consulta para diagnóstico e plano de tratamento."},
        {"name": "Sessão de Fisioterapia", "duration": 45, "price": 100.00, "description": "Sessão individual de tratamento fisioterapêutico."},
        {"name": "Reabilitação Postural", "duration": 60, "price": 120.00, "description": "Sessões focadas na correção postural."}
    ]',
    '[
        {"type": "reminder", "event": "24h_before", "message": "Olá {client_name}, lembrete do seu agendamento de {service_name} amanhã às {time} com {professional_name}."},
        {"type": "confirmation", "event": "booking_created", "message": "Olá {client_name}, seu agendamento de {service_name} com {professional_name} foi confirmado para {date} às {time}."}
    ]',
    '{"deposit_required": false, "cancellation_window_hours": 24}'
),
-- Adicionando presets para servicos_profissionais
('servicos_profissionais', 'consultor', 'Configurações padrão para consultores e coaches', 'consultant',
    '[
        {"name": "Consulta Inicial", "duration": 60, "price": 200.00, "description": "Primeira reunião para entender as necessidades do cliente."},
        {"name": "Sessão de Coaching", "duration": 90, "price": 300.00, "description": "Sessão individual de coaching."},
        {"name": "Mentoria Empresarial", "duration": 120, "price": 500.00, "description": "Sessão de mentoria para desenvolvimento de negócios."}
    ]',
    '[
        {"type": "reminder", "event": "24h_before", "message": "Olá {client_name}, lembrete do seu agendamento de {service_name} amanhã às {time} com {professional_name}."},
        {"type": "confirmation", "event": "booking_created", "message": "Olá {client_name}, seu agendamento de {service_name} com {professional_name} foi confirmado para {date} às {time}."}
    ]',
    '{"deposit_required": true, "deposit_percentage": 20, "cancellation_window_hours": 48}'
);