/**
 * Módulo Marketing Automático — Tipos + Service
 * Campanhas, promoções, aniversário, pós-atendimento, reativação
 */

import { supabase } from '@/integrations/supabase/client';
import { sendBulkNotification, type NotificationChannel } from '@/modules/notifications';
import { getClientProfiles, segmentClients, type ClientProfile } from '@/modules/crm';
import { enqueueJob } from '@/modules/queue';

// ==================== TIPOS ====================

export type CampaignType =
  | 'birthday'
  | 'reactivation'
  | 'post_service'
  | 'promotion'
  | 'empty_slots'
  | 'loyalty_reward'
  | 'custom';

export type CampaignStatus = 'draft' | 'scheduled' | 'running' | 'completed' | 'paused';

export interface MarketingCampaign {
  id: string;
  barbershop_id: string;
  name: string;
  type: CampaignType;
  channel: NotificationChannel;
  status: CampaignStatus;
  title: string;
  message: string;
  target_criteria?: Record<string, unknown>;
  scheduled_for?: string;
  sent_count: number;
  open_count: number;
  conversion_count: number;
  created_at: string;
}

// ==================== TEMPLATES DE CAMPANHA ====================

const CAMPAIGN_TEMPLATES: Record<CampaignType, { title: string; message: string }> = {
  birthday: {
    title: '🎂 Feliz Aniversário!',
    message: 'Parabéns, {{name}}! 🎉 Preparamos um presente especial: {{discount}}% de desconto no seu próximo corte! Válido por 7 dias.',
  },
  reactivation: {
    title: '😢 Sentimos sua falta!',
    message: 'Oi, {{name}}! Faz {{days}} dias que você não nos visita. Que tal voltar? Temos {{discount}}% de desconto esperando você!',
  },
  post_service: {
    title: '⭐ Como foi seu atendimento?',
    message: 'Oi, {{name}}! Como foi seu {{service}} com {{professional}}? Avalie de 1 a 5 e ganhe {{cashback}} de cashback!',
  },
  promotion: {
    title: '🔥 Promoção Exclusiva!',
    message: '{{name}}, aproveite: {{promotion_text}}. Válido até {{valid_until}}.',
  },
  empty_slots: {
    title: '📅 Horários disponíveis hoje!',
    message: '{{name}}, temos horários livres hoje! Aproveite {{discount}}% de desconto para agendamentos de última hora.',
  },
  loyalty_reward: {
    title: '🏆 Você subiu de nível!',
    message: 'Parabéns, {{name}}! Você agora é cliente {{tier}}! Ganhe {{benefit}} como recompensa.',
  },
  custom: {
    title: '',
    message: '',
  },
};

export function getCampaignTemplate(type: CampaignType) {
  return CAMPAIGN_TEMPLATES[type];
}

// ==================== AUTOMAÇÃO DE CAMPANHAS ====================

export async function runBirthdayCampaign(barbershopId: string, discount: number = 15): Promise<{ sent: number }> {
  const profiles = await getClientProfiles(barbershopId);
  const today = new Date();
  const todayStr = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const birthdayClients = profiles.filter(p => {
    if (!p.birthday) return false;
    const bday = p.birthday.substring(5); // MM-DD
    return bday === todayStr;
  });

  if (birthdayClients.length === 0) return { sent: 0 };

  const template = CAMPAIGN_TEMPLATES.birthday;
  let sent = 0;

  for (const client of birthdayClients) {
    await enqueueJob({
      type: 'send_whatsapp',
      payload: {
        phone: client.phone,
        message: template.message
          .replace('{{name}}', client.name)
          .replace('{{discount}}', String(discount)),
      },
      priority: 'normal',
    });
    sent++;
  }

  return { sent };
}

export async function runReactivationCampaign(barbershopId: string, params: {
  min_days_inactive: number;
  discount: number;
  channel: NotificationChannel;
}): Promise<{ sent: number }> {
  const profiles = await getClientProfiles(barbershopId);
  const inactiveClients = segmentClients(profiles, {
    status: ['inactive', 'at_risk'],
    last_visit_days_ago: { min: params.min_days_inactive },
  });

  if (inactiveClients.length === 0) return { sent: 0 };

  const template = CAMPAIGN_TEMPLATES.reactivation;
  const result = await sendBulkNotification({
    barbershop_id: barbershopId,
    channel: params.channel,
    trigger: 'reactivation',
    title: template.title,
    body: template.message
      .replace('{{discount}}', String(params.discount)),
    target: inactiveClients.map(c => c.user_id),
  });

  return { sent: result.sent };
}

export async function runEmptySlotsCampaign(barbershopId: string, discount: number = 20): Promise<{ sent: number }> {
  // Verificar slots vazios para hoje
  const today = new Date().toISOString().split('T')[0];
  const now = new Date().getHours();

  const { data: appointments } = await (supabase as any)
    .from('appointments')
    .select('scheduled_at')
    .eq('barbershop_id', barbershopId)
    .gte('scheduled_at', `${today}T${String(now).padStart(2, '0')}:00:00`)
    .lte('scheduled_at', `${today}T20:00:00`)
    .in('status', ['scheduled', 'confirmed']);

  const { data: professionals } = await (supabase as any)
    .from('professionals')
    .select('id')
    .eq('barbershop_id', barbershopId)
    .eq('is_active', true);

  const totalProfsCount = (professionals || []).length;
  const remainingHours = 20 - now;
  const slotsPerHour = 2; // 30 min each
  const totalPossibleSlots = totalProfsCount * remainingHours * slotsPerHour;
  const bookedSlots = (appointments || []).length;
  const emptyRate = totalPossibleSlots > 0 ? ((totalPossibleSlots - bookedSlots) / totalPossibleSlots) * 100 : 0;

  // Só dispara se mais de 60% da agenda está vazia
  if (emptyRate < 60) return { sent: 0 };

  const profiles = await getClientProfiles(barbershopId);
  const activeClients = segmentClients(profiles, { status: ['active', 'at_risk'] });

  const result = await sendBulkNotification({
    barbershop_id: barbershopId,
    channel: 'whatsapp',
    trigger: 'promotion',
    title: CAMPAIGN_TEMPLATES.empty_slots.title,
    body: CAMPAIGN_TEMPLATES.empty_slots.message.replace('{{discount}}', String(discount)),
    target: activeClients.slice(0, 50).map(c => c.user_id),
  });

  return { sent: result.sent };
}

// ==================== SCHEDULER DE AUTOMAÇÕES ====================

export async function runAllAutomations(barbershopId: string): Promise<{
  birthday: number;
  reactivation: number;
  empty_slots: number;
}> {
  const [birthday, reactivation, emptySlots] = await Promise.all([
    runBirthdayCampaign(barbershopId),
    runReactivationCampaign(barbershopId, { min_days_inactive: 30, discount: 15, channel: 'whatsapp' }),
    runEmptySlotsCampaign(barbershopId),
  ]);

  return {
    birthday: birthday.sent,
    reactivation: reactivation.sent,
    empty_slots: emptySlots.sent,
  };
}
