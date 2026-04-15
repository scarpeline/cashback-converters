-- Novos setores e especialidades para o sistema de agenda
-- Esportes & Fitness
INSERT INTO public.sector_presets (sector, specialty, display_name, description, icon, default_services, default_automations, default_policies)
VALUES
('esportes_fitness', 'personal_trainer', 'Personal Trainer', 'Treinamento personalizado presencial ou online', 'dumbbell',
 '[{"name":"Avaliação Física","duration":60,"price":150},{"name":"Treino Individual (1h)","duration":60,"price":120},{"name":"Pacote 10 Treinos","duration":60,"price":1000}]',
 '[{"type":"reminder","event":"24h_before","message":"Olá {client_name}, lembrete do seu treino amanhã às {time} com {professional_name}."}]',
 '{"deposit_required":false,"cancellation_window_hours":12}'),
('esportes_fitness', 'crossfit', 'CrossFit', 'Aulas de CrossFit e treino funcional', 'zap',
 '[{"name":"Aula Avulsa","duration":60,"price":60},{"name":"Mensalidade (3x/semana)","duration":60,"price":250}]',
 '[{"type":"reminder","event":"24h_before","message":"Olá {client_name}, lembrete da sua aula de CrossFit amanhã às {time}."}]',
 '{"deposit_required":false,"cancellation_window_hours":4}'),
('esportes_fitness', 'natacao', 'Natação', 'Aulas de natação para todas as idades', 'waves',
 '[{"name":"Aula Individual","duration":45,"price":100},{"name":"Aula em Grupo","duration":45,"price":60}]',
 '[{"type":"reminder","event":"24h_before","message":"Olá {client_name}, lembrete da sua aula de natação amanhã às {time}."}]',
 '{"deposit_required":false,"cancellation_window_hours":12}'),
('esportes_fitness', 'yoga', 'Yoga', 'Aulas de yoga e meditação', 'sun',
 '[{"name":"Aula Individual","duration":60,"price":100},{"name":"Aula em Grupo","duration":60,"price":50}]',
 '[{"type":"reminder","event":"24h_before","message":"Olá {client_name}, lembrete da sua aula de yoga amanhã às {time}."}]',
 '{"deposit_required":false,"cancellation_window_hours":12}'),
('esportes_fitness', 'artes_marciais', 'Artes Marciais', 'Jiu-jitsu, muay thai, karatê e outras artes marciais', 'shield',
 '[{"name":"Aula Avulsa","duration":60,"price":60},{"name":"Mensalidade","duration":60,"price":200}]',
 '[{"type":"reminder","event":"24h_before","message":"Olá {client_name}, lembrete da sua aula amanhã às {time}."}]',
 '{"deposit_required":false,"cancellation_window_hours":4}')
ON CONFLICT (sector, specialty) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  default_services = EXCLUDED.default_services;

-- Tatuagem & Piercing
INSERT INTO public.sector_presets (sector, specialty, display_name, description, icon, default_services, default_automations, default_policies)
VALUES
('tatuagem_piercing', 'tatuagem', 'Tatuagem', 'Estúdio de tatuagem artística', 'pen-tool',
 '[{"name":"Tatuagem Pequena","duration":60,"price":200},{"name":"Tatuagem Média","duration":180,"price":500},{"name":"Tatuagem Grande","duration":360,"price":1000}]',
 '[{"type":"reminder","event":"24h_before","message":"Olá {client_name}, lembrete da sua sessão de tatuagem amanhã às {time}."}]',
 '{"deposit_required":true,"deposit_percentage":30,"cancellation_window_hours":48}'),
('tatuagem_piercing', 'piercing', 'Piercing', 'Colocação e troca de piercings', 'circle',
 '[{"name":"Piercing Simples","duration":30,"price":80},{"name":"Piercing Cartilagem","duration":30,"price":100}]',
 '[{"type":"reminder","event":"24h_before","message":"Olá {client_name}, lembrete do seu agendamento amanhã às {time}."}]',
 '{"deposit_required":false,"cancellation_window_hours":24}'),
('tatuagem_piercing', 'micropigmentacao', 'Micropigmentação', 'Micropigmentação de sobrancelhas, lábios e olhos', 'edit',
 '[{"name":"Sobrancelha","duration":120,"price":400},{"name":"Lábios","duration":120,"price":450},{"name":"Retoque","duration":60,"price":200}]',
 '[{"type":"reminder","event":"24h_before","message":"Olá {client_name}, lembrete da sua sessão de micropigmentação amanhã às {time}."}]',
 '{"deposit_required":true,"deposit_percentage":50,"cancellation_window_hours":48}')
ON CONFLICT (sector, specialty) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  default_services = EXCLUDED.default_services;

-- Fotografia & Vídeo
INSERT INTO public.sector_presets (sector, specialty, display_name, description, icon, default_services, default_automations, default_policies)
VALUES
('fotografia_video', 'fotografo_eventos', 'Fotógrafo de Eventos', 'Fotografia para casamentos, formaturas e eventos', 'camera',
 '[{"name":"Evento (4h)","duration":240,"price":1200},{"name":"Evento (8h)","duration":480,"price":2000},{"name":"Ensaio Pré-Evento","duration":120,"price":600}]',
 '[{"type":"reminder","event":"24h_before","message":"Olá {client_name}, lembrete do seu evento fotográfico amanhã às {time}."}]',
 '{"deposit_required":true,"deposit_percentage":50,"cancellation_window_hours":72}'),
('fotografia_video', 'ensaio_fotografico', 'Ensaio Fotográfico', 'Ensaios pessoais, gestante, família e newborn', 'image',
 '[{"name":"Ensaio Individual","duration":90,"price":400},{"name":"Ensaio Família","duration":120,"price":600},{"name":"Ensaio Newborn","duration":180,"price":800}]',
 '[{"type":"reminder","event":"24h_before","message":"Olá {client_name}, lembrete do seu ensaio fotográfico amanhã às {time}."}]',
 '{"deposit_required":true,"deposit_percentage":30,"cancellation_window_hours":48}'),
('fotografia_video', 'videomaker', 'Videomaker', 'Produção de vídeos para eventos e redes sociais', 'video',
 '[{"name":"Vídeo Curto (Reels)","duration":120,"price":500},{"name":"Vídeo Evento","duration":480,"price":1500}]',
 '[{"type":"reminder","event":"24h_before","message":"Olá {client_name}, lembrete da sua produção de vídeo amanhã às {time}."}]',
 '{"deposit_required":true,"deposit_percentage":30,"cancellation_window_hours":48}')
ON CONFLICT (sector, specialty) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  default_services = EXCLUDED.default_services;

-- Gastronomia & Eventos
INSERT INTO public.sector_presets (sector, specialty, display_name, description, icon, default_services, default_automations, default_policies)
VALUES
('gastronomia_eventos', 'chef_particular', 'Chef Particular', 'Chef em domicílio para jantares e eventos', 'utensils',
 '[{"name":"Jantar Romântico (2 pessoas)","duration":180,"price":400},{"name":"Jantar em Grupo (até 8)","duration":240,"price":800},{"name":"Aula de Culinária","duration":120,"price":250}]',
 '[{"type":"reminder","event":"24h_before","message":"Olá {client_name}, lembrete do seu jantar com chef amanhã às {time}."}]',
 '{"deposit_required":true,"deposit_percentage":50,"cancellation_window_hours":48}'),
('gastronomia_eventos', 'confeiteiro', 'Confeiteiro', 'Bolos, doces e sobremesas personalizadas', 'cake',
 '[{"name":"Bolo Personalizado","duration":0,"price":200},{"name":"Mesa de Doces","duration":0,"price":500},{"name":"Cupcakes (12 un)","duration":0,"price":80}]',
 '[{"type":"reminder","event":"48h_before","message":"Olá {client_name}, lembrete do seu pedido de confeitaria para {date}."}]',
 '{"deposit_required":true,"deposit_percentage":50,"cancellation_window_hours":72}'),
('gastronomia_eventos', 'bartender', 'Bartender', 'Bartender para eventos e festas', 'wine',
 '[{"name":"Evento (4h)","duration":240,"price":600},{"name":"Evento (8h)","duration":480,"price":1000}]',
 '[{"type":"reminder","event":"24h_before","message":"Olá {client_name}, lembrete do seu evento com bartender amanhã às {time}."}]',
 '{"deposit_required":true,"deposit_percentage":30,"cancellation_window_hours":48}')
ON CONFLICT (sector, specialty) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  default_services = EXCLUDED.default_services;

-- Tecnologia & TI
INSERT INTO public.sector_presets (sector, specialty, display_name, description, icon, default_services, default_automations, default_policies)
VALUES
('tecnologia_ti', 'suporte_tecnico', 'Suporte Técnico', 'Manutenção e suporte de computadores e redes', 'monitor',
 '[{"name":"Visita Técnica","duration":60,"price":120},{"name":"Formatação","duration":120,"price":150},{"name":"Instalação de Rede","duration":180,"price":250}]',
 '[{"type":"reminder","event":"24h_before","message":"Olá {client_name}, lembrete do seu atendimento técnico amanhã às {time}."}]',
 '{"deposit_required":false,"cancellation_window_hours":24}'),
('tecnologia_ti', 'dev_freelancer', 'Dev Freelancer', 'Desenvolvimento de sites, apps e sistemas', 'code',
 '[{"name":"Consultoria (1h)","duration":60,"price":200},{"name":"Landing Page","duration":0,"price":800},{"name":"Site Institucional","duration":0,"price":2000}]',
 '[{"type":"reminder","event":"24h_before","message":"Olá {client_name}, lembrete da sua reunião de desenvolvimento amanhã às {time}."}]',
 '{"deposit_required":true,"deposit_percentage":30,"cancellation_window_hours":24}'),
('tecnologia_ti', 'designer_grafico', 'Designer Gráfico', 'Design de identidade visual, logos e materiais', 'palette',
 '[{"name":"Consultoria (1h)","duration":60,"price":150},{"name":"Logo","duration":0,"price":500},{"name":"Identidade Visual","duration":0,"price":1500}]',
 '[{"type":"reminder","event":"24h_before","message":"Olá {client_name}, lembrete da sua reunião de design amanhã às {time}."}]',
 '{"deposit_required":true,"deposit_percentage":30,"cancellation_window_hours":24}')
ON CONFLICT (sector, specialty) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  default_services = EXCLUDED.default_services;

-- Terapias Alternativas
INSERT INTO public.sector_presets (sector, specialty, display_name, description, icon, default_services, default_automations, default_policies)
VALUES
('terapias_alternativas', 'acupuntura', 'Acupuntura', 'Acupuntura e medicina tradicional chinesa', 'activity',
 '[{"name":"Primeira Consulta","duration":60,"price":180},{"name":"Sessão de Acupuntura","duration":50,"price":130}]',
 '[{"type":"reminder","event":"24h_before","message":"Olá {client_name}, lembrete da sua sessão de acupuntura amanhã às {time}."}]',
 '{"deposit_required":false,"cancellation_window_hours":24}'),
('terapias_alternativas', 'reiki', 'Reiki', 'Terapia energética e cura holística', 'sun',
 '[{"name":"Sessão de Reiki","duration":60,"price":120},{"name":"Sessão Completa","duration":90,"price":180}]',
 '[{"type":"reminder","event":"24h_before","message":"Olá {client_name}, lembrete da sua sessão de reiki amanhã às {time}."}]',
 '{"deposit_required":false,"cancellation_window_hours":12}'),
('terapias_alternativas', 'terapia_holistica', 'Terapia Holística', 'Terapias integrativas e bem-estar', 'heart',
 '[{"name":"Sessão Individual","duration":60,"price":150},{"name":"Pacote 5 Sessões","duration":60,"price":650}]',
 '[{"type":"reminder","event":"24h_before","message":"Olá {client_name}, lembrete da sua sessão holística amanhã às {time}."}]',
 '{"deposit_required":false,"cancellation_window_hours":24}')
ON CONFLICT (sector, specialty) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  default_services = EXCLUDED.default_services;

-- Moda & Imagem
INSERT INTO public.sector_presets (sector, specialty, display_name, description, icon, default_services, default_automations, default_policies)
VALUES
('moda_imagem', 'personal_stylist', 'Personal Stylist', 'Consultoria de moda e estilo pessoal', 'shopping-bag',
 '[{"name":"Consultoria de Imagem","duration":90,"price":300},{"name":"Personal Shopping","duration":180,"price":500},{"name":"Organização de Guarda-Roupa","duration":240,"price":400}]',
 '[{"type":"reminder","event":"24h_before","message":"Olá {client_name}, lembrete da sua consultoria de moda amanhã às {time}."}]',
 '{"deposit_required":false,"cancellation_window_hours":24}'),
('moda_imagem', 'alfaiate', 'Alfaiate', 'Confecção e ajuste de roupas sob medida', 'scissors',
 '[{"name":"Ajuste Simples","duration":30,"price":60},{"name":"Ajuste Complexo","duration":60,"price":120},{"name":"Roupa Sob Medida","duration":0,"price":500}]',
 '[{"type":"reminder","event":"24h_before","message":"Olá {client_name}, lembrete da sua prova amanhã às {time}."}]',
 '{"deposit_required":true,"deposit_percentage":30,"cancellation_window_hours":24}')
ON CONFLICT (sector, specialty) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  default_services = EXCLUDED.default_services;

-- Música & Artes
INSERT INTO public.sector_presets (sector, specialty, display_name, description, icon, default_services, default_automations, default_policies)
VALUES
('musica_artes', 'aulas_musica', 'Aulas de Música', 'Violão, piano, guitarra, bateria e outros instrumentos', 'music',
 '[{"name":"Aula Individual (1h)","duration":60,"price":80},{"name":"Pacote 4 Aulas","duration":60,"price":280}]',
 '[{"type":"reminder","event":"24h_before","message":"Olá {client_name}, lembrete da sua aula de música amanhã às {time}."}]',
 '{"deposit_required":false,"cancellation_window_hours":12}'),
('musica_artes', 'aulas_canto', 'Aulas de Canto', 'Técnica vocal e canto popular ou lírico', 'mic',
 '[{"name":"Aula Individual (1h)","duration":60,"price":90},{"name":"Pacote 4 Aulas","duration":60,"price":320}]',
 '[{"type":"reminder","event":"24h_before","message":"Olá {client_name}, lembrete da sua aula de canto amanhã às {time}."}]',
 '{"deposit_required":false,"cancellation_window_hours":12}'),
('musica_artes', 'danca', 'Dança', 'Ballet, forró, samba, dança contemporânea e mais', 'music-2',
 '[{"name":"Aula Individual","duration":60,"price":80},{"name":"Aula em Grupo","duration":60,"price":50}]',
 '[{"type":"reminder","event":"24h_before","message":"Olá {client_name}, lembrete da sua aula de dança amanhã às {time}."}]',
 '{"deposit_required":false,"cancellation_window_hours":12}'),
('musica_artes', 'atelie_artes', 'Ateliê de Artes', 'Pintura, desenho, artesanato e artes plásticas', 'paintbrush',
 '[{"name":"Aula Individual","duration":90,"price":100},{"name":"Workshop (3h)","duration":180,"price":150}]',
 '[{"type":"reminder","event":"24h_before","message":"Olá {client_name}, lembrete da sua aula de artes amanhã às {time}."}]',
 '{"deposit_required":false,"cancellation_window_hours":24}')
ON CONFLICT (sector, specialty) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  default_services = EXCLUDED.default_services;

-- Atualizar display_names nulos
UPDATE public.sector_presets
SET display_name = initcap(replace(replace(specialty, '_', ' '), '-', ' '))
WHERE display_name IS NULL OR display_name = '';
