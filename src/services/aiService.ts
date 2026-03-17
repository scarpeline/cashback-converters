// Serviço de IA para agendamento e vendas
// Integração com estrutura existente

import { supabase } from "@/integrations/supabase/client";

export interface AISuggestion {
  message: string;
  action?: 'suggest_time' | 'list_services' | 'create_appointment';
  data?: any;
}

/**
 * Processa mensagem do cliente e retorna resposta inteligente
 */
export async function processarMensagem(
  cliente: any, 
  mensagem: string
): Promise<AISuggestion> {
  const msg = mensagem.toLowerCase();
  
  // 🔍 Detectar intenção
  if (msg.includes('horario') || msg.includes('agenda') || msg.includes('disponível')) {
    const sugestao = await sugerirHorario(cliente);
    return {
      message: sugestao,
      action: 'suggest_time',
    };
  }
  
  if (msg.includes('preço') || msg.includes('valor') || msg.includes('quanto custa')) {
    const servicos = await listarServicos();
    return {
      message: servicos,
      action: 'list_services',
    };
  }
  
  if (msg.includes('agendar') || msg.includes('marcar') || msg.includes('reservar')) {
    const resultado = await criarAgendamento(cliente);
    return {
      message: resultado.message,
      action: 'create_appointment',
      data: resultado.data,
    };
  }
  
  if (msg.includes('ola') || msg.includes('oi') || msg.includes('bom dia') || msg.includes('boa tarde')) {
    return {
      message: `Olá ${cliente.name || 'cliente'}! 😊 Como posso te ajudar? Posso ajudar com:\n• Agendamentos\n• Valores dos serviços\n• Informações sobre horários`,
    };
  }
  
  // Resposta padrão
  return {
    message: "Posso te ajudar com agendamentos, valores dos serviços ou informações sobre horários disponíveis. O que você precisa? 😊",
  };
}

/**
 * Sugere horário disponível baseado no perfil do cliente
 */
async function sugerirHorario(cliente: any): Promise<string> {
  try {
    // Buscar horários disponíveis para hoje e amanhã
    const hoje = new Date();
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    
    const { data: horarios, error } = await supabase
      .from('appointments')
      .select('*')
      .gte('scheduled_at', hoje.toISOString())
      .lte('scheduled_at', amanha.toISOString())
      .eq('status', 'scheduled')
      .order('scheduled_at', { ascending: true });

    if (error) {
      console.error('Erro ao buscar horários:', error);
      return "Desculpe, estou com problemas para verificar os horários. Tente novamente mais tarde. 😢";
    }

    const livre = horarios?.find((a: any) => a.status === 'scheduled');
    
    if (!livre) {
      // Se não tem horário hoje/amanhã, sugerir para depois
      return "Hoje e amanhã estão cheios 😢. Gostaria que eu verifique para depois de amanhã?";
    }

    const dataHora = new Date(livre.scheduled_at);
    const dataFormatada = dataHora.toLocaleDateString('pt-BR');
    const horaFormatada = dataHora.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    return `Encontrei um horário disponível! 📅\n\n📅 Data: ${dataFormatada}\n⏰ Hora: ${horaFormatada}\n\nDeseja confirmar este horário?`;
  } catch (error) {
    console.error('Erro na sugestão de horário:', error);
    return "Desculpe, estou com problemas para verificar os horários. Tente novamente mais tarde. 😢";
  }
}

/**
 * Lista serviços disponíveis com preços
 */
async function listarServicos(): Promise<string> {
  try {
    const { data: servicos, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true });

    if (error) {
      console.error('Erro ao buscar serviços:', error);
      return "Desculpe, estou com problemas para listar os serviços. Tente novamente mais tarde. 😢";
    }

    if (!servicos || servicos.length === 0) {
      return "No momento não temos serviços cadastrados. Entre em contato diretamente com a barbearia para mais informações. 📞";
    }

    let mensagem = "📋 **Serviços Disponíveis:**\n\n";
    
    servicos.forEach((servico: any, index: number) => {
      mensagem += `${index + 1}. **${servico.name}**\n`;
      mensagem += `   💰 R$ ${servico.price.toFixed(2)}\n`;
      if (servico.description) {
        mensagem += `   📝 ${servico.description}\n`;
      }
      mensagem += `   ⏱️ ${servico.duration_minutes || 30} minutos\n\n`;
    });

    mensagem += "Qual serviço você gostaria de agendar?";
    
    return mensagem;
  } catch (error) {
    console.error('Erro ao listar serviços:', error);
    return "Desculpe, estou com problemas para listar os serviços. Tente novamente mais tarde. 😢";
  }
}

/**
 * Cria agendamento para o cliente
 */
async function criarAgendamento(cliente: any): Promise<{ message: string; data?: any }> {
  try {
    // Primeiro, precisamos de uma barbearia ativa
    const { data: barbearias, error: barbError } = await supabase
      .from('barbershops')
      .select('id, name')
      .eq('is_active', true)
      .limit(1);

    if (barbError || !barbearias || barbearias.length === 0) {
      return {
        message: "Desculpe, não encontrei barbearias ativas no momento. Tente novamente mais tarde. 😢"
      };
    }

    const barbearia = barbearias[0];
    
    // Buscar profissional disponível
    const { data: profissionais, error: profError } = await supabase
      .from('professionals')
      .select('id, name')
      .eq('barbershop_id', barbearia.id)
      .eq('is_active', true)
      .limit(1);

    if (profError || !profissionais || profissionais.length === 0) {
      return {
        message: "Desculpe, não encontrei profissionais disponíveis no momento. Tente novamente mais tarde. 😢"
      };
    }

    const profissional = profissionais[0];
    
    // Buscar serviço básico
    const { data: servicos, error: servError } = await supabase
      .from('services')
      .select('id, name, price')
      .eq('barbershop_id', barbearia.id)
      .eq('is_active', true)
      .limit(1);

    if (servError || !servicos || servicos.length === 0) {
      return {
        message: "Desculpe, não encontrei serviços disponíveis no momento. Tente novamente mais tarde. 😢"
      };
    }

    const servico = servicos[0];
    
    // Criar agendamento para daqui a 1 hora
    const dataAgendamento = new Date();
    dataAgendamento.setHours(dataAgendamento.getHours() + 1);
    
    const { data: agendamento, error: agendError } = await supabase
      .from('appointments')
      .insert([{
        barbershop_id: barbearia.id,
        professional_id: profissional.id,
        service_id: servico.id,
        client_user_id: cliente.id,
        client_name: cliente.name || 'Cliente',
        client_whatsapp: cliente.whatsapp || '',
        scheduled_at: dataAgendamento.toISOString(),
        status: 'scheduled',
        notes: 'Agendamento via IA'
      }])
      .select()
      .single();

    if (agendError) {
      console.error('Erro ao criar agendamento:', agendError);
      return {
        message: "Desculpe, ocorreu um erro ao criar o agendamento. Tente novamente mais tarde. 😢"
      };
    }

    const dataFormatada = dataAgendamento.toLocaleDateString('pt-BR');
    const horaFormatada = dataAgendamento.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    return {
      message: `✅ **Agendamento confirmado!**\n\n📅 Data: ${dataFormatada}\n⏰ Hora: ${horaFormatada}\n💈 Barbearia: ${barbearia.name}\n✂️ Profissional: ${profissional.name}\n💼 Serviço: ${servico.name}\n💰 Valor: R$ ${servico.price.toFixed(2)}\n\nObrigado por agendar conosco! 🎉`,
      data: agendamento
    };
  } catch (error) {
    console.error('Erro ao criar agendamento:', error);
    return {
      message: "Desculpe, ocorreu um erro inesperado ao criar o agendamento. Tente novamente mais tarde. 😢"
    };
  }
}

/**
 * Analisa perfil do cliente para sugestões personalizadas
 */
export async function analisarPerfilCliente(clienteId: string): Promise<{
  totalVisitas: number;
  ticketMedio: number;
  servicoFavorito?: string;
  ultimaVisita?: Date;
  diasDesdeUltimaVisita: number;
}> {
  try {
    const { data: historico, error } = await supabase
      .from('appointments')
      .select('*, services(name, price)')
      .eq('client_user_id', clienteId)
      .eq('status', 'completed')
      .order('scheduled_at', { ascending: false });

    if (error || !historico) {
      return {
        totalVisitas: 0,
        ticketMedio: 0,
        diasDesdeUltimaVisita: 999,
      };
    }

    const totalVisitas = historico.length;
    const totalGasto = historico.reduce((acc, item) => {
      return acc + (item.services?.price || 0);
    }, 0);
    
    const ticketMedio = totalVisitas > 0 ? totalGasto / totalVisitas : 0;
    
    // Encontrar serviço mais frequente
    const servicoCount: Record<string, number> = {};
    historico.forEach(item => {
      const servicoNome = item.services?.name || 'Desconhecido';
      servicoCount[servicoNome] = (servicoCount[servicoNome] || 0) + 1;
    });
    
    const servicoFavorito = Object.entries(servicoCount)
      .sort(([, a], [, b]) => b - a)[0]?.[0];
    
    const ultimaVisita = historico[0]?.scheduled_at 
      ? new Date(historico[0].scheduled_at) 
      : undefined;
    
    const diasDesdeUltimaVisita = ultimaVisita
      ? Math.floor((new Date().getTime() - ultimaVisita.getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    return {
      totalVisitas,
      ticketMedio,
      servicoFavorito,
      ultimaVisita,
      diasDesdeUltimaVisita,
    };
  } catch (error) {
    console.error('Erro ao analisar perfil:', error);
    return {
      totalVisitas: 0,
      ticketMedio: 0,
      diasDesdeUltimaVisita: 999,
    };
  }
}

/**
 * Gera sugestão personalizada baseada no perfil
 */
export async function gerarSugestaoPersonalizada(clienteId: string): Promise<string> {
  const perfil = await analisarPerfilCliente(clienteId);
  
  if (perfil.totalVisitas === 0) {
    return "👋 Bem-vindo! Que tal fazer seu primeiro agendamento? Temos ótimos serviços esperando por você!";
  }
  
  if (perfil.diasDesdeUltimaVisita > 30) {
    return `😊 Sentimos sua falta! Faz ${perfil.diasDesdeUltimaVisita} dias que você não vem. Que tal agendar um retorno?`;
  }
  
  if (perfil.diasDesdeUltimaVisita > 15) {
    return `📅 Já faz ${perfil.diasDesdeUltimaVisita} dias da sua última visita. Está na hora de um novo corte!`;
  }
  
  if (perfil.servicoFavorito) {
    return `💡 Baseado no seu histórico, você gosta muito do serviço "${perfil.servicoFavorito}". Que tal agendar novamente?`;
  }
  
  return "💈 Está na hora de cuidar do visual! Temos horários disponíveis para você.";
}