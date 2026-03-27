-- Inserir presets iniciais via SQL (ignora RLS durante a migração)
INSERT INTO public.sector_presets (sector, specialty, icon, default_services)
VALUES 
    ('barbearia', 'barbearia_classica', 'scissors', '[
        {"name": "Corte de Cabelo", "duration_minutes": 30, "price": 50},
        {"name": "Barba Completa", "duration_minutes": 30, "price": 40},
        {"name": "Corte + Barba", "duration_minutes": 60, "price": 80}
    ]'::jsonb),
    ('barbearia', 'barbearia_moderna', 'zap', '[
        {"name": "Corte Moderno (Fade)", "duration_minutes": 45, "price": 60},
        {"name": "Barba Design", "duration_minutes": 30, "price": 45},
        {"name": "Pigmentação", "duration_minutes": 30, "price": 30}
    ]'::jsonb),
    ('estetica', 'limpeza_pele', 'sparkles', '[
        {"name": "Limpeza de Pele Profunda", "duration_minutes": 90, "price": 150},
        {"name": "Peeling de Diamante", "duration_minutes": 45, "price": 120},
        {"name": "Hidratação Facial", "duration_minutes": 30, "price": 80}
    ]'::jsonb),
    ('estetica', 'massoterapia', 'smile', '[
        {"name": "Massagem Relaxante", "duration_minutes": 60, "price": 100},
        {"name": "Drenagem Linfática", "duration_minutes": 60, "price": 130},
        {"name": "Massagem Modeladora", "duration_minutes": 45, "price": 110}
    ]'::jsonb),
    ('saude', 'fisioterapia', 'heart', '[
        {"name": "Sessão de Fisioterapia", "duration_minutes": 50, "price": 120},
        {"name": "Avaliação Inicial", "duration_minutes": 60, "price": 150},
        {"name": "RPG", "duration_minutes": 50, "price": 140}
    ]'::jsonb),
    ('saude', 'psicologia', 'brain', '[
        {"name": "Sessão de Terapia", "duration_minutes": 50, "price": 180},
        {"name": "Primeira Consulta", "duration_minutes": 60, "price": 200}
    ]'::jsonb)
ON CONFLICT (sector, specialty) DO UPDATE 
SET 
    icon = EXCLUDED.icon,
    default_services = EXCLUDED.default_services;
