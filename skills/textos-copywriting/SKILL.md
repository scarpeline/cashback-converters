# Textos & Copywriting Skill

## Tom de Voz do Projeto

**Produto:** SalãoCashBack — Agenda Universal para negócios de serviços
**Público:** Donos de negócio, profissionais autônomos, clientes finais
**Tom:** Direto, profissional, acolhedor. Sem jargão técnico desnecessário.

## Regras de Escrita

### Títulos de página
- Curtos, descritivos, sem pontuação final
- Exemplos: "Gestão", "Financeiro", "Configurações", "Agenda"
- Evitar: "Hub de Gestão Diamond", "Motor de Crescimento Premium"

### Subtítulos / descrições
- Uma frase simples explicando o que a seção faz
- Exemplos: "Gerencie sua equipe e serviços", "Controle o fluxo de caixa"
- Evitar: "Controle total do fluxo de cadeiras e agendamentos Diamond"

### Botões
- Verbo + objeto: "Salvar", "Adicionar serviço", "Novo profissional", "Cancelar"
- Evitar: "Confirmar Agendamento Diamond", "Criar Serviço Premium"

### Labels de campo
- Substantivo simples: "Nome", "E-mail", "Telefone", "Preço", "Duração"
- Evitar: "Nome Completo do Profissional Expert"

### Mensagens de sucesso (toast)
- Confirmação direta: "Salvo!", "Profissional cadastrado!", "Serviço removido"
- Evitar: "Operação concluída com sucesso!"

### Mensagens de erro
- Específicas e acionáveis: "Nome obrigatório", "E-mail inválido", "Tente novamente"
- Evitar: "Ocorreu um erro inesperado"

### Estados vazios
- Amigáveis e orientadores: "Nenhum agendamento hoje. Que tal criar um?"
- Evitar: "Não há registros disponíveis no momento"

### Onboarding
- Encorajador e simples: "Leva menos de 2 minutos", "Vamos configurar tudo para você"
- Evitar: "Complete o processo de configuração inicial do sistema"

## Textos por Nicho (Labels Dinâmicos)

| Nicho | Profissionais | Serviços | Agendamentos | Clientes |
|-------|--------------|----------|--------------|---------|
| Beleza & Estética | Profissionais | Serviços | Agendamentos | Clientes |
| Saúde & Bem-Estar | Especialistas | Sessões | Consultas | Pacientes |
| Educação | Professores | Aulas | Aulas | Alunos |
| Automotivo | Mecânicos | Serviços | Ordens | Clientes |
| Pets | Profissionais | Serviços Pet | Atendimentos | Tutores |
| Jurídico | Especialistas | Consultorias | Consultas | Clientes |
| Espaços | Gestores | Espaços | Reservas | Locatários |

## Frases Proibidas
- "Diamond", "Premium", "Expert", "Forense", "Ultra-Impacto"
- "Cockpit do seu império"
- "Motor de vendas"
- "Sinais vitais"
- Qualquer coisa com "v4.0", "v5.0", "Diamond Edition"

## Internacionalização
- Todas as strings de UI devem usar `t("chave")` do i18n
- Chaves no formato: `auth.login_title`, `nav.settings`, `common.save`
- Fallback sempre em português (pt-BR)
