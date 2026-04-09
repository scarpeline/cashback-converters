
INSERT INTO public.sector_presets (sector, specialty, display_name, icon, default_services) VALUES
('educacao', 'professor', 'Professor Particular', '📚', '[{"name":"Aula Particular (1h)","price":80,"duration":60},{"name":"Mentoria Individual","price":120,"duration":90},{"name":"Aula em Grupo","price":50,"duration":60}]'::jsonb),
('educacao', 'coach', 'Coach / Consultor', '🎯', '[{"name":"Sessão de Coaching","price":150,"duration":60},{"name":"Consultoria Estratégica","price":200,"duration":90}]'::jsonb),
('automotivo', 'mecanico', 'Mecânico', '🔧', '[{"name":"Revisão Geral","price":250,"duration":120},{"name":"Troca de Óleo","price":80,"duration":30},{"name":"Alinhamento e Balanceamento","price":120,"duration":60}]'::jsonb),
('automotivo', 'estetica_auto', 'Estética Automotiva', '🚗', '[{"name":"Lavagem Completa","price":60,"duration":60},{"name":"Polimento","price":200,"duration":180},{"name":"Vitrificação","price":500,"duration":240}]'::jsonb),
('pets', 'petshop', 'Pet Shop', '🐶', '[{"name":"Banho Pequeno Porte","price":50,"duration":60},{"name":"Banho + Tosa","price":80,"duration":90},{"name":"Hidratação de Pelos","price":40,"duration":30}]'::jsonb),
('pets', 'veterinario', 'Veterinário', '🩺', '[{"name":"Consulta Veterinária","price":120,"duration":30},{"name":"Vacinação","price":80,"duration":15},{"name":"Exame de Sangue","price":100,"duration":20}]'::jsonb),
('servicos', 'eletricista', 'Eletricista', '⚡', '[{"name":"Visita Técnica","price":80,"duration":60},{"name":"Instalação de Tomada","price":60,"duration":30},{"name":"Reparo Elétrico","price":150,"duration":90}]'::jsonb),
('servicos', 'encanador', 'Encanador', '🔧', '[{"name":"Visita + Diagnóstico","price":80,"duration":60},{"name":"Reparo Hidráulico","price":120,"duration":90}]'::jsonb),
('juridico', 'advogado', 'Advogado', '⚖️', '[{"name":"Consulta Jurídica","price":200,"duration":60},{"name":"Análise de Contrato","price":300,"duration":90}]'::jsonb),
('juridico', 'contador_nicho', 'Contador', '📊', '[{"name":"Consultoria Fiscal","price":150,"duration":60},{"name":"Declaração de IR","price":250,"duration":120}]'::jsonb),
('espacos', 'coworking', 'Coworking', '🏢', '[{"name":"Sala de Reunião (1h)","price":50,"duration":60},{"name":"Day Use","price":80,"duration":480}]'::jsonb),
('espacos', 'estudio', 'Estúdio / Quadra', '🎬', '[{"name":"Locação por Hora","price":100,"duration":60},{"name":"Pacote 4 Horas","price":350,"duration":240}]'::jsonb)
ON CONFLICT DO NOTHING;
