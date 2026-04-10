-- Fix: Add display_name column to sector_presets if not exists
-- and populate it from specialty field
ALTER TABLE public.sector_presets
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Update display_name from specialty where null
UPDATE public.sector_presets
SET display_name = initcap(replace(replace(specialty, '_', ' '), '-', ' '))
WHERE display_name IS NULL OR display_name = '';

-- Ensure beleza_estetica sector has all specialties with correct keys
INSERT INTO public.sector_presets (sector, specialty, display_name, description, icon, default_services, default_automations, default_policies)
VALUES
('beleza_estetica', 'barbearia', 'Barbearia', 'Barbearias e cortes masculinos', 'scissors',
 '[{"name":"Corte Masculino","duration":45,"price":50},{"name":"Barba","duration":30,"price":35},{"name":"Corte + Barba","duration":75,"price":80}]',
 '[{"type":"reminder","event":"24h_before","message":"Olá {client_name}, lembrete do seu agendamento amanhã às {time}."}]',
 '{"deposit_required":false,"cancellation_window_hours":24}'),
('beleza_estetica', 'salao_de_beleza', 'Salão de Beleza', 'Salões de cabelo, unhas e estética', 'salon',
 '[{"name":"Corte Feminino","duration":60,"price":80},{"name":"Coloração","duration":120,"price":150},{"name":"Escova","duration":45,"price":60}]',
 '[{"type":"reminder","event":"24h_before","message":"Olá {client_name}, lembrete do seu agendamento amanhã às {time}."}]',
 '{"deposit_required":false,"cancellation_window_hours":24}'),
('beleza_estetica', 'nail_designer', 'Nail Designer', 'Unhas, gel e nail art', 'nail',
 '[{"name":"Manicure","duration":45,"price":30},{"name":"Pedicure","duration":60,"price":40},{"name":"Gel","duration":120,"price":150}]',
 '[{"type":"reminder","event":"24h_before","message":"Olá {client_name}, lembrete do seu agendamento amanhã às {time}."}]',
 '{"deposit_required":false,"cancellation_window_hours":12}'),
('beleza_estetica', 'esteticista', 'Esteticista', 'Estética facial e corporal', 'sparkles',
 '[{"name":"Limpeza de Pele","duration":90,"price":150},{"name":"Peeling","duration":60,"price":120},{"name":"Drenagem","duration":60,"price":130}]',
 '[{"type":"reminder","event":"24h_before","message":"Olá {client_name}, lembrete do seu agendamento amanhã às {time}."}]',
 '{"deposit_required":false,"cancellation_window_hours":24}'),
('beleza_estetica', 'maquiadora', 'Maquiadora', 'Maquiagem social e artística', 'palette',
 '[{"name":"Maquiagem Social","duration":90,"price":120},{"name":"Maquiagem Noiva","duration":180,"price":350}]',
 '[{"type":"reminder","event":"24h_before","message":"Olá {client_name}, lembrete do seu agendamento amanhã às {time}."}]',
 '{"deposit_required":true,"deposit_percentage":30,"cancellation_window_hours":48}')
ON CONFLICT (sector, specialty) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  default_services = EXCLUDED.default_services;

-- saude_bem_estar
INSERT INTO public.sector_presets (sector, specialty, display_name, description, icon, default_services, default_automations, default_policies)
VALUES
('saude_bem_estar', 'fisioterapia', 'Fisioterapia', 'Clínicas de fisioterapia', 'heart',
 '[{"name":"Sessão de Fisioterapia","duration":50,"price":120},{"name":"Avaliação","duration":60,"price":150}]',
 '[{"type":"reminder","event":"24h_before","message":"Olá {client_name}, lembrete da sua sessão amanhã às {time}."}]',
 '{"deposit_required":false,"cancellation_window_hours":24}'),
('saude_bem_estar', 'pilates', 'Pilates', 'Estúdios de pilates', 'activity',
 '[{"name":"Aula Individual","duration":50,"price":120},{"name":"Aula em Dupla","duration":50,"price":180}]',
 '[{"type":"reminder","event":"24h_before","message":"Olá {client_name}, lembrete da sua aula amanhã às {time}."}]',
 '{"deposit_required":true,"deposit_percentage":50,"cancellation_window_hours":24}'),
('saude_bem_estar', 'psicologia', 'Psicologia', 'Consultórios de psicologia', 'brain',
 '[{"name":"Sessão de Terapia","duration":50,"price":180},{"name":"Primeira Consulta","duration":60,"price":200}]',
 '[{"type":"reminder","event":"24h_before","message":"Olá {client_name}, lembrete da sua sessão amanhã às {time}."}]',
 '{"deposit_required":true,"deposit_percentage":50,"cancellation_window_hours":48}'),
('saude_bem_estar', 'nutricao', 'Nutrição', 'Consultórios de nutrição', 'apple',
 '[{"name":"Consulta Nutricional","duration":60,"price":180},{"name":"Retorno","duration":30,"price":100}]',
 '[{"type":"reminder","event":"24h_before","message":"Olá {client_name}, lembrete da sua consulta amanhã às {time}."}]',
 '{"deposit_required":false,"cancellation_window_hours":24}'),
('saude_bem_estar', 'massagem', 'Massoterapia', 'Massagens e terapias corporais', 'sparkles',
 '[{"name":"Massagem Relaxante","duration":60,"price":100},{"name":"Drenagem Linfática","duration":60,"price":130}]',
 '[{"type":"reminder","event":"24h_before","message":"Olá {client_name}, lembrete da sua massagem amanhã às {time}."}]',
 '{"deposit_required":false,"cancellation_window_hours":12}')
ON CONFLICT (sector, specialty) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  default_services = EXCLUDED.default_services;

-- educacao_mentorias
INSERT INTO public.sector_presets (sector, specialty, display_name, description, icon, default_services, default_automations, default_policies)
VALUES
('educacao_mentorias', 'aulas_particulares', 'Aulas Particulares', 'Professores e tutores', 'book',
 '[{"name":"Aula Individual","duration":60,"price":80},{"name":"Pacote 10 Aulas","duration":60,"price":700}]',
 '[{"type":"reminder","event":"24h_before","message":"Olá {client_name}, lembrete da sua aula amanhã às {time}."}]',
 '{"deposit_required":false,"cancellation_window_hours":12}'),
('educacao_mentorias', 'coaching', 'Coaching', 'Coaches e mentores', 'target',
 '[{"name":"Sessão de Coaching","duration":60,"price":250},{"name":"Mentoria","duration":90,"price":400}]',
 '[{"type":"reminder","event":"24h_before","message":"Olá {client_name}, lembrete da sua sessão amanhã às {time}."}]',
 '{"deposit_required":true,"deposit_percentage":30,"cancellation_window_hours":48}'),
('educacao_mentorias', 'idiomas', 'Idiomas', 'Escolas e professores de idiomas', 'globe',
 '[{"name":"Aula de Inglês","duration":60,"price":80},{"name":"Aula de Espanhol","duration":60,"price":80}]',
 '[{"type":"reminder","event":"24h_before","message":"Olá {client_name}, lembrete da sua aula amanhã às {time}."}]',
 '{"deposit_required":false,"cancellation_window_hours":12}')
ON CONFLICT (sector, specialty) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  default_services = EXCLUDED.default_services;

-- automotivo
INSERT INTO public.sector_presets (sector, specialty, display_name, description, icon, default_services, default_automations, default_policies)
VALUES
('automotivo', 'oficina', 'Oficina Mecânica', 'Mecânica geral e revisões', 'wrench',
 '[{"name":"Revisão Geral","duration":120,"price":200},{"name":"Troca de Óleo","duration":30,"price":80}]',
 '[{"type":"reminder","event":"24h_before","message":"Olá {client_name}, lembrete do seu agendamento amanhã às {time}."}]',
 '{"deposit_required":false,"cancellation_window_hours":24}'),
('automotivo', 'estetica_automotiva', 'Estética Automotiva', 'Polimento, higienização e detailing', 'car',
 '[{"name":"Lavagem Completa","duration":60,"price":80},{"name":"Polimento","duration":180,"price":350}]',
 '[{"type":"reminder","event":"24h_before","message":"Olá {client_name}, lembrete do seu agendamento amanhã às {time}."}]',
 '{"deposit_required":false,"cancellation_window_hours":24}'),
('automotivo', 'lava_rapido', 'Lava-Rápido', 'Lavagem rápida de veículos', 'droplets',
 '[{"name":"Lavagem Simples","duration":30,"price":40},{"name":"Lavagem Completa","duration":60,"price":70}]',
 '[{"type":"reminder","event":"24h_before","message":"Olá {client_name}, lembrete do seu agendamento amanhã às {time}."}]',
 '{"deposit_required":false,"cancellation_window_hours":2}')
ON CONFLICT (sector, specialty) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  default_services = EXCLUDED.default_services;

-- pets
INSERT INTO public.sector_presets (sector, specialty, display_name, description, icon, default_services, default_automations, default_policies)
VALUES
('pets', 'banho_tosa', 'Banho & Tosa', 'Pet shops e grooming', 'scissors',
 '[{"name":"Banho","duration":60,"price":60},{"name":"Tosa","duration":90,"price":80},{"name":"Banho + Tosa","duration":120,"price":120}]',
 '[{"type":"reminder","event":"24h_before","message":"Olá {client_name}, lembrete do banho do seu pet amanhã às {time}."}]',
 '{"deposit_required":false,"cancellation_window_hours":12}'),
('pets', 'veterinario', 'Veterinário', 'Clínicas veterinárias', 'heart',
 '[{"name":"Consulta","duration":30,"price":120},{"name":"Vacinação","duration":15,"price":80}]',
 '[{"type":"reminder","event":"24h_before","message":"Olá {client_name}, lembrete da consulta do seu pet amanhã às {time}."}]',
 '{"deposit_required":false,"cancellation_window_hours":24}'),
('pets', 'adestramento', 'Adestramento', 'Adestradores e comportamento animal', 'paw',
 '[{"name":"Aula Individual","duration":60,"price":150},{"name":"Pacote 10 Aulas","duration":60,"price":1200}]',
 '[{"type":"reminder","event":"24h_before","message":"Olá {client_name}, lembrete da aula do seu pet amanhã às {time}."}]',
 '{"deposit_required":true,"deposit_percentage":30,"cancellation_window_hours":24}')
ON CONFLICT (sector, specialty) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  default_services = EXCLUDED.default_services;

-- servicos_domiciliares
INSERT INTO public.sector_presets (sector, specialty, display_name, description, icon, default_services, default_automations, default_policies)
VALUES
('servicos_domiciliares', 'eletricista', 'Eletricista', 'Serviços elétricos residenciais', 'zap',
 '[{"name":"Visita Técnica","duration":60,"price":100},{"name":"Instalação","duration":120,"price":200}]',
 '[{"type":"reminder","event":"24h_before","message":"Olá {client_name}, lembrete do seu agendamento amanhã às {time}."}]',
 '{"deposit_required":false,"cancellation_window_hours":24}'),
('servicos_domiciliares', 'encanador', 'Encanador', 'Serviços hidráulicos', 'droplets',
 '[{"name":"Visita Técnica","duration":60,"price":100},{"name":"Reparo","duration":120,"price":180}]',
 '[{"type":"reminder","event":"24h_before","message":"Olá {client_name}, lembrete do seu agendamento amanhã às {time}."}]',
 '{"deposit_required":false,"cancellation_window_hours":24}'),
('servicos_domiciliares', 'diarista', 'Diarista', 'Limpeza residencial', 'home',
 '[{"name":"Diária Completa","duration":480,"price":200},{"name":"Limpeza Rápida","duration":240,"price":120}]',
 '[{"type":"reminder","event":"24h_before","message":"Olá {client_name}, lembrete do seu agendamento amanhã às {time}."}]',
 '{"deposit_required":false,"cancellation_window_hours":24}')
ON CONFLICT (sector, specialty) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  default_services = EXCLUDED.default_services;

-- juridico_financeiro
INSERT INTO public.sector_presets (sector, specialty, display_name, description, icon, default_services, default_automations, default_policies)
VALUES
('juridico_financeiro', 'advogado', 'Advogado', 'Consultoria jurídica', 'scale',
 '[{"name":"Consulta Jurídica","duration":60,"price":300},{"name":"Análise de Contrato","duration":90,"price":500}]',
 '[{"type":"reminder","event":"24h_before","message":"Olá {client_name}, lembrete da sua consulta amanhã às {time}."}]',
 '{"deposit_required":true,"deposit_percentage":50,"cancellation_window_hours":48}'),
('juridico_financeiro', 'contador', 'Contador', 'Contabilidade e fiscal', 'calculator',
 '[{"name":"Consulta Contábil","duration":60,"price":200},{"name":"Declaração IR","duration":90,"price":400}]',
 '[{"type":"reminder","event":"24h_before","message":"Olá {client_name}, lembrete da sua consulta amanhã às {time}."}]',
 '{"deposit_required":false,"cancellation_window_hours":24}'),
('juridico_financeiro', 'consultor_financeiro', 'Consultor Financeiro', 'Planejamento financeiro', 'trending-up',
 '[{"name":"Consulta Financeira","duration":60,"price":250},{"name":"Planejamento","duration":120,"price":500}]',
 '[{"type":"reminder","event":"24h_before","message":"Olá {client_name}, lembrete da sua consulta amanhã às {time}."}]',
 '{"deposit_required":false,"cancellation_window_hours":24}')
ON CONFLICT (sector, specialty) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  default_services = EXCLUDED.default_services;

-- espacos_locacao
INSERT INTO public.sector_presets (sector, specialty, display_name, description, icon, default_services, default_automations, default_policies)
VALUES
('espacos_locacao', 'salas_reuniao', 'Salas de Reunião', 'Coworking e salas executivas', 'building',
 '[{"name":"Sala por Hora","duration":60,"price":80},{"name":"Sala Dia Inteiro","duration":480,"price":400}]',
 '[{"type":"reminder","event":"24h_before","message":"Olá {client_name}, lembrete da sua reserva amanhã às {time}."}]',
 '{"deposit_required":true,"deposit_percentage":50,"cancellation_window_hours":24}'),
('espacos_locacao', 'estudio', 'Estúdio', 'Estúdios de foto, música e gravação', 'camera',
 '[{"name":"Estúdio por Hora","duration":60,"price":150},{"name":"Pacote 4h","duration":240,"price":500}]',
 '[{"type":"reminder","event":"24h_before","message":"Olá {client_name}, lembrete da sua reserva amanhã às {time}."}]',
 '{"deposit_required":true,"deposit_percentage":50,"cancellation_window_hours":48}'),
('espacos_locacao', 'quadra', 'Quadra Esportiva', 'Quadras e espaços esportivos', 'activity',
 '[{"name":"Quadra por Hora","duration":60,"price":100},{"name":"Quadra 2h","duration":120,"price":180}]',
 '[{"type":"reminder","event":"24h_before","message":"Olá {client_name}, lembrete da sua reserva amanhã às {time}."}]',
 '{"deposit_required":false,"cancellation_window_hours":12}')
ON CONFLICT (sector, specialty) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  default_services = EXCLUDED.default_services;

-- Update all remaining null display_names
UPDATE public.sector_presets
SET display_name = initcap(replace(replace(specialty, '_', ' '), '-', ' '))
WHERE display_name IS NULL OR display_name = '';
