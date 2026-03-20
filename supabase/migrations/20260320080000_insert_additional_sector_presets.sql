-- Migration: Inserir Presets Adicionais para Novos Setores
-- Data: 2026-03-20
-- Setores adicionados:
--   - Saúde & Bem-Estar (fisioterapia, pilates, nutricao, psicologia)
--   - Educação & Mentorias (aulas_particulares, coaching, idiomas)
--   - Automotivo (oficina, estetica_automotiva)
--   - Pets (banho_tosa, veterinario)
--   - Serviços Domiciliares (eletricista, encanador, diarista)
--   - Jurídico/Financeiro (advogado, contador)
--   - Espaços & Locação (salas_reuniao, estudio, quadra)

-- =====================================================
-- SAÚDE & BEM-ESTAR
-- =====================================================

INSERT INTO public.sector_presets (sector, specialty, description, icon, default_services, default_automations, default_policies, default_resources)
VALUES
(
  'saude_bem_estar',
  'fisioterapia',
  'Configurações padrão para clínicas de fisioterapia',
  'heart-pulse',
  '[
    {"name": "Sessão de Fisioterapia", "duration": 60, "price": 150.00, "description": "Atendimento fisioterapêutico individual."},
    {"name": "Avaliação Fisioterapêutica", "duration": 90, "price": 200.00, "description": "Avaliação completa do paciente."},
    {"name": "Pacote 10 Sessões", "duration": 60, "price": 1350.00, "description": "Pacote com 10 sessões de fisioterapia."}
  ]',
  '[
    {"type": "reminder", "event": "24h_before", "message": "Olá {client_name}, lembrete da sua sessão de fisioterapia amanhã às {time}."},
    {"type": "confirmation", "event": "booking_created", "message": "Olá {client_name}, sua sessão de fisioterapia foi agendada para {date} às {time}."}
  ]',
  '{"deposit_required": true, "deposit_percentage": 30, "cancellation_window_hours": 48, "require_confirmation": true}',
  '[]'
),
(
  'saude_bem_estar',
  'pilates',
  'Configurações padrão para estúdios de pilates',
  'heart',
  '[
    {"name": "Aula de Pilates Solo", "duration": 50, "price": 120.00, "description": "Uma aula individual de pilates."},
    {"name": "Aula de Pilates Dupla", "duration": 50, "price": 180.00, "description": "Aula para dois alunos."},
    {"name": "Pacote 10 Aulas", "duration": 50, "price": 1000.00, "description": "Pacote com 10 aulas de pilates."}
  ]',
  '[
    {"type": "reminder", "event": "24h_before", "message": "Olá {client_name}, lembrete da sua aula de pilates amanhã às {time}."},
    {"type": "confirmation", "event": "booking_created", "message": "Olá {client_name}, sua aula de pilates foi agendada para {date} às {time}."}
  ]',
  '{"deposit_required": true, "deposit_percentage": 50, "cancellation_window_hours": 24, "require_confirmation": true}',
  '[{"name": "Sala de Pilates 1", "type": "room", "capacity": 1}, {"name": "Sala de Pilates 2", "type": "room", "capacity": 1}]'
),
(
  'saude_bem_estar',
  'nutricao',
  'Configurações padrão para consultórios de nutrição',
  'apple',
  '[
    {"name": "Consulta Nutricional", "duration": 60, "price": 180.00, "description": "Consulta inicial ou retorno de nutrição."},
    {"name": "Avaliação Nutricional Completa", "duration": 90, "price": 250.00, "description": "Avaliação corporal e alimentar completa."},
    {"name": "Plano Alimentar", "duration": 30, "price": 150.00, "description": "Elaboração de plano alimentar personalizado."}
  ]',
  '[
    {"type": "reminder", "event": "24h_before", "message": "Olá {client_name}, lembrete da sua consulta de nutrição amanhã às {time}."},
    {"type": "confirmation", "event": "booking_created", "message": "Olá {client_name}, sua consulta de nutrição foi agendada para {date} às {time}."}
  ]',
  '{"deposit_required": false, "cancellation_window_hours": 24, "require_confirmation": true}',
  '[]'
),
(
  'saude_bem_estar',
  'psicologia',
  'Configurações padrão para consultórios de psicologia',
  'brain',
  '[
    {"name": "Sessão de Psicologia", "duration": 50, "price": 200.00, "description": "Atendimento psicológico individual."},
    {"name": "Avaliação Psicológica", "duration": 120, "price": 350.00, "description": "Avaliação psicológica completa."},
    {"name": "Sessão Emergencial", "duration": 50, "price": 250.00, "description": "Atendimento psicológico urgente."}
  ]',
  '[
    {"type": "reminder", "event": "24h_before", "message": "Olá {client_name}, lembrete da sua sessão de psicologia amanhã às {time}."},
    {"type": "confirmation", "event": "booking_created", "message": "Olá {client_name}, sua sessão de psicologia foi agendada para {date} às {time}."}
  ]',
  '{"deposit_required": true, "deposit_percentage": 50, "cancellation_window_hours": 48, "require_confirmation": true}',
  '[{"name": "Sala de Atendimento 1", "type": "room", "capacity": 1}, {"name": "Sala de Atendimento 2", "type": "room", "capacity": 1}]'
),
(
  'saude_bem_estar',
  'massagem',
  'Configurações padrão para clínicas de massoterapia',
  'sparkles',
  '[
    {"name": "Massagem Relaxante", "duration": 60, "price": 150.00, "description": "Massagem corporal relaxante."},
    {"name": "Massagem Modeladora", "duration": 60, "price": 180.00, "description": "Massagem modeladora corporal."},
    {"name": "Drenagem Linfática", "duration": 50, "price": 170.00, "description": "Drenagem linfática corporal."},
    {"name": "Pacote 10 Sessões", "duration": 60, "price": 1400.00, "description": "Pacote com 10 sessões de massagem."}
  ]',
  '[
    {"type": "reminder", "event": "24h_before", "message": "Olá {client_name}, lembrete da sua massagem amanhã às {time}."},
    {"type": "confirmation", "event": "booking_created", "message": "Olá {client_name}, sua massagem foi agendada para {date} às {time}."}
  ]',
  '{"deposit_required": true, "deposit_percentage": 30, "cancellation_window_hours": 24, "require_confirmation": true}',
  '[{"name": "Sala de Massagem 1", "type": "room", "capacity": 1}, {"name": "Sala de Massagem 2", "type": "room", "capacity": 1}]'
);

-- =====================================================
-- EDUCAÇÃO & MENTORIAS
-- =====================================================

INSERT INTO public.sector_presets (sector, specialty, description, icon, default_services, default_automations, default_policies, default_resources)
VALUES
(
  'educacao_mentorias',
  'aulas_particulares',
  'Configurações padrão para aulas particulares',
  'book-open',
  '[
    {"name": "Aula Particular (60 min)", "duration": 60, "price": 100.00, "description": "Aula particular de 1 hora."},
    {"name": "Aula Particular (90 min)", "duration": 90, "price": 140.00, "description": "Aula particular de 1h30."},
    {"name": "Pacote 4 Aulas", "duration": 60, "price": 360.00, "description": "Pacote com 4 aulas particulares."}
  ]',
  '[
    {"type": "reminder", "event": "24h_before", "message": "Olá {client_name}, lembrete da sua aula amanhã às {time}."},
    {"type": "confirmation", "event": "booking_created", "message": "Olá {client_name}, sua aula foi agendada para {date} às {time}."}
  ]',
  '{"deposit_required": true, "deposit_percentage": 50, "cancellation_window_hours": 24, "allow_recurring": true}',
  '[]'
),
(
  'educacao_mentorias',
  'coaching',
  'Configurações padrão para coaches e mentores',
  'target',
  '[
    {"name": "Sessão de Coaching (60 min)", "duration": 60, "price": 300.00, "description": "Sessão individual de coaching."},
    {"name": "Sessão de Coaching (90 min)", "duration": 90, "price": 400.00, "description": "Sessão estendida de coaching."},
    {"name": "Programa de Coaching (4 sessões)", "duration": 60, "price": 1000.00, "description": "Programa de coaching com 4 sessões."}
  ]',
  '[
    {"type": "reminder", "event": "24h_before", "message": "Olá {client_name}, lembrete da sua sessão de coaching amanhã às {time}."},
    {"type": "confirmation", "event": "booking_created", "message": "Olá {client_name}, sua sessão de coaching foi agendada para {date} às {time}."}
  ]',
  '{"deposit_required": true, "deposit_percentage": 50, "cancellation_window_hours": 48, "require_confirmation": true}',
  '[]'
),
(
  'educacao_mentorias',
  'idiomas',
  'Configurações padrão para escolas de idiomas',
  'globe',
  '[
    {"name": "Aula de Idioma (60 min)", "duration": 60, "price": 80.00, "description": "Aula individual de idioma."},
    {"name": "Aula em Grupo (90 min)", "duration": 90, "price": 60.00, "description": "Aula em grupo de até 6 alunos."},
    {"name": "Pacote Mensal (8 aulas)", "duration": 60, "price": 560.00, "description": "Pacote mensal com 8 aulas."}
  ]',
  '[
    {"type": "reminder", "event": "24h_before", "message": "Olá {client_name}, lembrete da sua aula de inglês amanhã às {time}."},
    {"type": "confirmation", "event": "booking_created", "message": "Olá {client_name}, sua aula foi agendada para {date} às {time}."}
  ]',
  '{"deposit_required": true, "deposit_percentage": 50, "cancellation_window_hours": 24, "allow_recurring": true, "max_instances_per_recurring": 8}',
  '[{"name": "Sala de Aula 1", "type": "room", "capacity": 6}, {"name": "Sala de Aula 2", "type": "room", "capacity": 6}]'
);

-- =====================================================
-- AUTOMOTIVO
-- =====================================================

INSERT INTO public.sector_presets (sector, specialty, description, icon, default_services, default_automations, default_policies, default_resources)
VALUES
(
  'automotivo',
  'oficina',
  'Configurações padrão para oficinas mecânicas',
  'wrench',
  '[
    {"name": "Revisão Geral", "duration": 120, "price": 350.00, "description": "Revisão geral do veículo."},
    {"name": "Troca de Óleo", "duration": 45, "price": 150.00, "description": "Troca de óleo e filtro."},
    {"name": "Alinhamento e Balanceamento", "duration": 60, "price": 200.00, "description": "Alinhamento e balanceamento."},
    {"name": "Freios", "duration": 90, "price": 250.00, "description": "Revisão e troca de pastilhas de freio."}
  ]',
  '[
    {"type": "reminder", "event": "24h_before", "message": "Olá {client_name}, lembrete do agendamento de manutenção amanhã às {time}."},
    {"type": "confirmation", "event": "booking_created", "message": "Olá {client_name}, seu agendamento foi confirmado para {date} às {time}."}
  ]',
  '{"deposit_required": true, "deposit_percentage": 30, "cancellation_window_hours": 24, "require_confirmation": true}',
  '[{"name": "Rampa 1", "type": "equipment", "capacity": 1}, {"name": "Rampa 2", "type": "equipment", "capacity": 1}]'
),
(
  'automotivo',
  'estetica_automotiva',
  'Configurações padrão para centros de estética automotiva',
  'car',
  '[
    {"name": "Higienização Completa", "duration": 120, "price": 300.00, "description": "Higienização interna completa."},
    {"name": "Polimento", "duration": 180, "price": 450.00, "description": "Polimento automotivo."},
    {"name": "Lavagem Técnica", "duration": 60, "price": 120.00, "description": "Lavagem técnica especializada."},
    {"name": "Vitrização", "duration": 240, "price": 600.00, "description": "Vitrização de pintura."}
  ]',
  '[
    {"type": "reminder", "event": "24h_before", "message": "Olá {client_name}, lembrete do agendamento de estética automotiva amanhã às {time}."},
    {"type": "confirmation", "event": "booking_created", "message": "Olá {client_name}, seu agendamento foi confirmado para {date} às {time}."}
  ]',
  '{"deposit_required": true, "deposit_percentage": 30, "cancellation_window_hours": 24, "require_confirmation": true}',
  '[{"name": "Box 1", "type": "room", "capacity": 1}, {"name": "Box 2", "type": "room", "capacity": 1}]'
);

-- =====================================================
-- PETS
-- =====================================================

INSERT INTO public.sector_presets (sector, specialty, description, icon, default_services, default_automations, default_policies, default_resources)
VALUES
(
  'pets',
  'banho_tosa',
  'Configurações padrão para pet shops de banho e tosa',
  'paw-print',
  '[
    {"name": "Banho", "duration": 45, "price": 60.00, "description": "Banho completo no pet."},
    {"name": "Tosa", "duration": 45, "price": 70.00, "description": "Tosa higiênica ou completa."},
    {"name": "Banho + Tosa", "duration": 75, "price": 110.00, "description": "Combo banho e tosa."},
    {"name": "Corte de Unhas", "duration": 20, "price": 25.00, "description": "Corte de unhas do pet."}
  ]',
  '[
    {"type": "reminder", "event": "24h_before", "message": "Olá {client_name}, lembrete do agendamento do {pet_name} amanhã às {time}."},
    {"type": "confirmation", "event": "booking_created", "message": "Olá {client_name}, agendamento do {pet_name} confirmado para {date} às {time}."}
  ]',
  '{"deposit_required": false, "cancellation_window_hours": 12, "require_confirmation": false}',
  '[{"name": "Bancada 1", "type": "equipment", "capacity": 1}, {"name": "Bancada 2", "type": "equipment", "capacity": 1}]'
),
(
  'pets',
  'veterinario',
  'Configurações padrão para clínicas veterinárias',
  'stethoscope',
  '[
    {"name": "Consulta Veterinária", "duration": 30, "price": 150.00, "description": "Consulta veterinária geral."},
    {"name": "Vacinação", "duration": 20, "price": 100.00, "description": "Aplicação de vacina."},
    {"name": "Exame de Sangue", "duration": 15, "price": 200.00, "description": "Coleta e análise de sangue."},
    {"name": "Cirurgia Simples", "duration": 90, "price": 800.00, "description": "Procedimento cirúrgico simples."}
  ]',
  '[
    {"type": "reminder", "event": "24h_before", "message": "Olá {client_name}, lembrete da consulta do {pet_name} amanhã às {time}."},
    {"type": "confirmation", "event": "booking_created", "message": "Olá {client_name}, consulta do {pet_name} confirmada para {date} às {time}."}
  ]',
  '{"deposit_required": true, "deposit_percentage": 30, "cancellation_window_hours": 24, "require_confirmation": true}',
  '[{"name": "Sala de Consulta 1", "type": "room", "capacity": 1}, {"name": "Sala de Consulta 2", "type": "room", "capacity": 1}]'
);

-- =====================================================
-- SERVIÇOS DOMICILIARES
-- =====================================================

INSERT INTO public.sector_presets (sector, specialty, description, icon, default_services, default_automations, default_policies, default_resources)
VALUES
(
  'servicos_domiciliares',
  'eletricista',
  'Configurações padrão para serviços de eletricista',
  'zap',
  '[
    {"name": "Visita Técnica", "duration": 60, "price": 100.00, "description": "Visita para avaliação e orçamento."},
    {"name": "Serviço de Eletricista (2h)", "duration": 120, "price": 200.00, "description": "Serviço de elétrica por 2 horas."},
    {"name": "Instalação de Pontos", "duration": 120, "price": 250.00, "description": "Instalação de pontos de luz."}
  ]',
  '[
    {"type": "reminder", "event": "24h_before", "message": "Olá {client_name}, lembrete da visita do eletricista amanhã às {time}."},
    {"type": "confirmation", "event": "booking_created", "message": "Olá {client_name}, visita confirmada para {date} às {time}."}
  ]',
  '{"deposit_required": true, "deposit_percentage": 30, "cancellation_window_hours": 24, "require_confirmation": true}',
  '[]'
),
(
  'servicos_domiciliares',
  'encanador',
  'Configurações padrão para serviços de encanador',
  'droplets',
  '[
    {"name": "Visita Técnica", "duration": 60, "price": 100.00, "description": "Visita para avaliação e orçamento."},
    {"name": "Serviço de Encanador (2h)", "duration": 120, "price": 200.00, "description": "Serviço de hidráulica por 2 horas."},
    {"name": "Desentupimento", "duration": 90, "price": 180.00, "description": "Desentupimento de ralos e tubulações."}
  ]',
  '[
    {"type": "reminder", "event": "24h_before", "message": "Olá {client_name}, lembrete da visita do encanador amanhã às {time}."},
    {"type": "confirmation", "event": "booking_created", "message": "Olá {client_name}, visita confirmada para {date} às {time}."}
  ]',
  '{"deposit_required": true, "deposit_percentage": 30, "cancellation_window_hours": 24, "require_confirmation": true}',
  '[]'
),
(
  'servicos_domiciliares',
  'diarista',
  'Configurações padrão para serviços de diarista',
  'home',
  '[
    {"name": "Limpeza Padrão (4h)", "duration": 240, "price": 150.00, "description": "Limpeza completa em 4 horas."},
    {"name": "Limpeza Pesada (6h)", "duration": 360, "price": 220.00, "description": "Limpeza pesada em 6 horas."},
    {"name": "Faxina Rápida (2h)", "duration": 120, "price": 80.00, "description": "Limpeza rápida em 2 horas."}
  ]',
  '[
    {"type": "reminder", "event": "24h_before", "message": "Olá {client_name}, lembrete da faxina amanhã às {time}."},
    {"type": "confirmation", "event": "booking_created", "message": "Olá {client_name}, faxina confirmada para {date} às {time}."}
  ]',
  '{"deposit_required": true, "deposit_percentage": 50, "cancellation_window_hours": 48, "require_confirmation": true}',
  '[]'
);

-- =====================================================
-- JURÍDICO & FINANCEIRO
-- =====================================================

INSERT INTO public.sector_presets (sector, specialty, description, icon, default_services, default_automations, default_policies, default_resources)
VALUES
(
  'juridico_financeiro',
  'advogado',
  'Configurações padrão para escritórios de advocacia',
  'scale',
  '[
    {"name": "Consulta Jurídica (1h)", "duration": 60, "price": 400.00, "description": "Consulta com advogado."},
    {"name": "Consulta Jurídica (2h)", "duration": 120, "price": 700.00, "description": "Consulta estendida com advogado."},
    {"name": "Retorno Jurídico", "duration": 30, "price": 200.00, "description": "Retorno para acompanhamento."}
  ]',
  '[
    {"type": "reminder", "event": "24h_before", "message": "Olá {client_name}, lembrete da sua consulta jurídica amanhã às {time}."},
    {"type": "confirmation", "event": "booking_created", "message": "Olá {client_name}, sua consulta foi agendada para {date} às {time}."}
  ]',
  '{"deposit_required": true, "deposit_percentage": 50, "cancellation_window_hours": 48, "require_confirmation": true}',
  '[{"name": "Sala de Reunião 1", "type": "room", "capacity": 4}, {"name": "Sala de Atendimento 1", "type": "room", "capacity": 2}]'
),
(
  'juridico_financeiro',
  'contador',
  'Configurações padrão para escritórios de contabilidade',
  'calculator',
  '[
    {"name": "Atendimento Contábil", "duration": 60, "price": 250.00, "description": "Atendimento para orientação contábil."},
    {"name": "Retorno Contábil", "duration": 30, "price": 150.00, "description": "Retorno para acompanhamento."},
    {"name": "Elaboração de Relatórios", "duration": 120, "price": 500.00, "description": "Elaboração de relatórios contábeis."}
  ]',
  '[
    {"type": "reminder", "event": "24h_before", "message": "Olá {client_name}, lembrete do atendimento contábil amanhã às {time}."},
    {"type": "confirmation", "event": "booking_created", "message": "Olá {client_name}, atendimento agendado para {date} às {time}."}
  ]',
  '{"deposit_required": false, "cancellation_window_hours": 24, "require_confirmation": true}',
  '[{"name": "Sala de Atendimento 1", "type": "room", "capacity": 2}, {"name": "Sala de Reunião", "type": "room", "capacity": 6}]'
);

-- =====================================================
-- ESPAÇOS & LOCAÇÃO
-- =====================================================

INSERT INTO public.sector_presets (sector, specialty, description, icon, default_services, default_automations, default_policies, default_resources)
VALUES
(
  'espacos_locacao',
  'salas_reuniao',
  'Configurações padrão para locação de salas de reunião',
  'users',
  '[
    {"name": "Sala de Reunião (1h)", "duration": 60, "price": 80.00, "description": "Locação de sala de reunião por 1 hora."},
    {"name": "Sala de Reunião (2h)", "duration": 120, "price": 140.00, "description": "Locação de sala de reunião por 2 horas."},
    {"name": "Sala de Reunião (4h)", "duration": 240, "price": 250.00, "description": "Locação de sala de reunião por 4 horas."},
    {"name": "Diária de Sala", "duration": 480, "price": 400.00, "description": "Locação de sala de reunião por dia inteiro."}
  ]',
  '[
    {"type": "reminder", "event": "24h_before", "message": "Olá {client_name}, lembrete da reserva da sala amanhã às {time}."},
    {"type": "confirmation", "event": "booking_created", "message": "Olá {client_name}, reserva da sala confirmada para {date} às {time}."}
  ]',
  '{"deposit_required": true, "deposit_percentage": 50, "cancellation_window_hours": 24, "require_confirmation": true}',
  '[{"name": "Sala Reunião A", "type": "room", "capacity": 8}, {"name": "Sala Reunião B", "type": "room", "capacity": 6}, {"name": "Sala Reunião C", "type": "room", "capacity": 4}]'
),
(
  'espacos_locacao',
  'estudio',
  'Configurações padrão para locação de estúdios',
  'camera',
  '[
    {"name": "Hora de Estúdio", "duration": 60, "price": 200.00, "description": "Locação de estúdio por hora."},
    {"name": "Diária de Estúdio", "duration": 480, "price": 800.00, "description": "Locação de estúdio por dia."},
    {"name": "Ensaio Fotográfico (3h)", "duration": 180, "price": 500.00, "description": "Ensaio fotográfico com 3 horas de estúdio."}
  ]',
  '[
    {"type": "reminder", "event": "24h_before", "message": "Olá {client_name}, lembrete da reserva do estúdio amanhã às {time}."},
    {"type": "confirmation", "event": "booking_created", "message": "Olá {client_name}, reserva do estúdio confirmada para {date} às {time}."}
  ]',
  '{"deposit_required": true, "deposit_percentage": 50, "cancellation_window_hours": 48, "require_confirmation": true}',
  '[{"name": "Estúdio Principal", "type": "room", "capacity": 10}, {"name": "Espaço Cinema", "type": "room", "capacity": 20}]'
),
(
  'espacos_locacao',
  'quadra',
  'Configurações padrão para locação de quadras esportivas',
  'trophy',
  '[
    {"name": "Hora de Quadra", "duration": 60, "price": 80.00, "description": "Locação de quadra por hora."},
    {"name": "Aula de Tênis (1h)", "duration": 60, "price": 120.00, "description": "Aula particular de tênis."},
    {"name": "Aula de Tênis em Grupo", "duration": 60, "price": 60.00, "description": "Aula em grupo de até 4 alunos."}
  ]',
  '[
    {"type": "reminder", "event": "24h_before", "message": "Olá {client_name}, lembrete da reserva da quadra amanhã às {time}."},
    {"type": "confirmation", "event": "booking_created", "message": "Olá {client_name}, reserva da quadra confirmada para {date} às {time}."}
  ]',
  '{"deposit_required": true, "deposit_percentage": 50, "cancellation_window_hours": 24, "require_confirmation": true}',
  '[{"name": "Quadra 1", "type": "room", "capacity": 4}, {"name": "Quadra 2", "type": "room", "capacity": 4}]'
),
(
  'espacos_locacao',
  'coworking',
  'Configurações padrão para espaços de coworking',
  'briefcase',
  '[
    {"name": "Hora em Coworking", "duration": 60, "price": 30.00, "description": "Uso de espaço de coworking por hora."},
    {"name": "Diária em Coworking", "duration": 480, "price": 100.00, "description": "Uso de espaço de coworking por dia."},
    {"name": "Mensalidade Coworking", "duration": 480, "price": 800.00, "description": "Acesso ilimitado ao coworking por mês."},
    {"name": "Sala Privada (4h)", "duration": 240, "price": 200.00, "description": "Locação de sala privativa por 4 horas."}
  ]',
  '[
    {"type": "reminder", "event": "24h_before", "message": "Olá {client_name}, lembrete da reserva no coworking amanhã às {time}."},
    {"type": "confirmation", "event": "booking_created", "message": "Olá {client_name}, reserva no coworking confirmada para {date} às {time}."}
  ]',
  '{"deposit_required": true, "deposit_percentage": 50, "cancellation_window_hours": 24, "require_confirmation": true}',
  '[{"name": "Mesa Compartilhada 1", "type": "room", "capacity": 1}, {"name": "Mesa Compartilhada 2", "type": "room", "capacity": 1}, {"name": "Sala Privada A", "type": "room", "capacity": 4}]'
);