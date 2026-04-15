-- Script para verificar especialidades cadastradas no banco de dados
-- Execute no Supabase SQL Editor

-- 1. Verificar total de especialidades por setor
SELECT 
    sector,
    COUNT(*) as total_especialidades,
    STRING_AGG(display_name, ', ' ORDER BY display_name) as especialidades
FROM sector_presets
GROUP BY sector
ORDER BY sector;

-- 2. Listar todas as especialidades com detalhes
SELECT 
    sector,
    specialty,
    display_name,
    description,
    icon,
    jsonb_array_length(default_services) as num_servicos,
    jsonb_array_length(default_automations) as num_automacoes,
    CASE 
        WHEN default_policies IS NOT NULL THEN 'Sim'
        ELSE 'Não'
    END as tem_politicas,
    created_at
FROM sector_presets
ORDER BY sector, display_name;

-- 3. Verificar especialidades sem serviços padrão
SELECT 
    sector,
    specialty,
    display_name,
    'SEM SERVIÇOS' as alerta
FROM sector_presets
WHERE default_services IS NULL 
   OR jsonb_array_length(default_services) = 0;

-- 4. Verificar especialidades sem automações
SELECT 
    sector,
    specialty,
    display_name,
    'SEM AUTOMAÇÕES' as alerta
FROM sector_presets
WHERE default_automations IS NULL 
   OR jsonb_array_length(default_automations) = 0;

-- 5. Verificar especialidades sem políticas
SELECT 
    sector,
    specialty,
    display_name,
    'SEM POLÍTICAS' as alerta
FROM sector_presets
WHERE default_policies IS NULL;

-- 6. Verificar especialidades sem display_name
SELECT 
    sector,
    specialty,
    'SEM DISPLAY_NAME' as alerta
FROM sector_presets
WHERE display_name IS NULL OR display_name = '';

-- 7. Contar total de especialidades
SELECT COUNT(*) as total_especialidades FROM sector_presets;

-- 8. Verificar setores disponíveis
SELECT DISTINCT sector, COUNT(*) as total
FROM sector_presets
GROUP BY sector
ORDER BY sector;

-- 9. Exemplo de serviços de uma especialidade (Barbearia)
SELECT 
    display_name,
    default_services
FROM sector_presets
WHERE specialty = 'barbearia'
LIMIT 1;

-- 10. Verificar barbearias que já usaram especialidades
SELECT 
    b.name,
    b.sector,
    b.specialty,
    b.onboarding_status,
    COUNT(s.id) as total_servicos
FROM barbershops b
LEFT JOIN services s ON s.barbershop_id = b.id
WHERE b.specialty IS NOT NULL
GROUP BY b.id, b.name, b.sector, b.specialty, b.onboarding_status
ORDER BY b.created_at DESC;

-- 11. Verificar se há duplicatas
SELECT 
    sector,
    specialty,
    COUNT(*) as duplicatas
FROM sector_presets
GROUP BY sector, specialty
HAVING COUNT(*) > 1;

-- 12. Estatísticas gerais
SELECT 
    'Total de Setores' as metrica,
    COUNT(DISTINCT sector) as valor
FROM sector_presets
UNION ALL
SELECT 
    'Total de Especialidades' as metrica,
    COUNT(*) as valor
FROM sector_presets
UNION ALL
SELECT 
    'Média de Serviços por Especialidade' as metrica,
    ROUND(AVG(jsonb_array_length(default_services)), 2) as valor
FROM sector_presets
WHERE default_services IS NOT NULL
UNION ALL
SELECT 
    'Especialidades com Políticas' as metrica,
    COUNT(*) as valor
FROM sector_presets
WHERE default_policies IS NOT NULL;

-- 13. Verificar estrutura da tabela
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'sector_presets'
ORDER BY ordinal_position;

-- 14. Verificar índices
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'sector_presets';

-- 15. Verificar RLS policies
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'sector_presets';
