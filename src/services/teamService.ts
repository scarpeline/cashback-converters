/**
 * User Hierarchy Service
 * Gerenciamento de equipe, convites e permissões dentro de um estabelecimento
 */

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type TeamRole = "owner" | "manager" | "professional" | "receptionist" | "cashier";

export interface TeamMember {
  id: string;
  user_id: string | null;
  barbershop_id: string;
  email: string;
  name: string;
  role: TeamRole;
  phone: string | null;
  avatar_url: string | null;
  status: "active" | "invited" | "inactive" | "suspended";
  permissions: TeamPermissions;
  created_at: string;
  last_active_at: string | null;
  invited_by: string | null;
  user_email?: string;
  user_whatsapp?: string;
}

export interface TeamPermissions {
  // Agenda
  can_view_schedule: boolean;
  can_edit_schedule: boolean;
  can_view_all_appointments: boolean;
  can_cancel_any_appointment: boolean;
  
  // Financeiro
  can_view_financial: boolean;
  can_edit_financial: boolean;
  can_view_reports: boolean;
  can_process_payments: boolean;
  can_manage_cashier: boolean;
  
  // Clientes
  can_view_clients: boolean;
  can_edit_clients: boolean;
  can_manage_loyalty: boolean;
  
  // Serviços e Produtos
  can_view_services: boolean;
  can_edit_services: boolean;
  can_view_inventory: boolean;
  can_edit_inventory: boolean;
  can_manage_packages: boolean;
  
  // Marketing
  can_send_campaigns: boolean;
  can_manage_automations: boolean;
  can_manage_reviews: boolean;
  can_access_whatsapp: boolean;
  
  // Equipe (apenas owner/manager)
  can_manage_team: boolean;
  can_invite_members: boolean;
  can_edit_permissions: boolean;
  
  // Configurações
  can_view_settings: boolean;
  can_edit_settings: boolean;
}

export const DEFAULT_PERMISSIONS: Record<TeamRole, TeamPermissions> = {
  owner: {
    can_view_schedule: true, can_edit_schedule: true, can_view_all_appointments: true, can_cancel_any_appointment: true,
    can_view_financial: true, can_edit_financial: true, can_view_reports: true, can_process_payments: true, can_manage_cashier: true,
    can_view_clients: true, can_edit_clients: true, can_manage_loyalty: true,
    can_view_services: true, can_edit_services: true, can_view_inventory: true, can_edit_inventory: true, can_manage_packages: true,
    can_send_campaigns: true, can_manage_automations: true, can_manage_reviews: true, can_access_whatsapp: true,
    can_manage_team: true, can_invite_members: true, can_edit_permissions: true,
    can_view_settings: true, can_edit_settings: true,
  },
  manager: {
    can_view_schedule: true, can_edit_schedule: true, can_view_all_appointments: true, can_cancel_any_appointment: true,
    can_view_financial: true, can_edit_financial: true, can_view_reports: true, can_process_payments: true, can_manage_cashier: true,
    can_view_clients: true, can_edit_clients: true, can_manage_loyalty: true,
    can_view_services: true, can_edit_services: true, can_view_inventory: true, can_edit_inventory: true, can_manage_packages: true,
    can_send_campaigns: true, can_manage_automations: false, can_manage_reviews: true, can_access_whatsapp: true,
    can_manage_team: true, can_invite_members: true, can_edit_permissions: false,
    can_view_settings: true, can_edit_settings: false,
  },
  professional: {
    can_view_schedule: true, can_edit_schedule: false, can_view_all_appointments: false, can_cancel_any_appointment: false,
    can_view_financial: false, can_edit_financial: false, can_view_reports: false, can_process_payments: false, can_manage_cashier: false,
    can_view_clients: true, can_edit_clients: false, can_manage_loyalty: false,
    can_view_services: true, can_edit_services: false, can_view_inventory: false, can_edit_inventory: false, can_manage_packages: false,
    can_send_campaigns: false, can_manage_automations: false, can_manage_reviews: false, can_access_whatsapp: false,
    can_manage_team: false, can_invite_members: false, can_edit_permissions: false,
    can_view_settings: false, can_edit_settings: false,
  },
  receptionist: {
    can_view_schedule: true, can_edit_schedule: true, can_view_all_appointments: true, can_cancel_any_appointment: true,
    can_view_financial: true, can_edit_financial: false, can_view_reports: false, can_process_payments: true, can_manage_cashier: true,
    can_view_clients: true, can_edit_clients: true, can_manage_loyalty: true,
    can_view_services: true, can_edit_services: false, can_view_inventory: true, can_edit_inventory: false, can_manage_packages: true,
    can_send_campaigns: false, can_manage_automations: false, can_manage_reviews: false, can_access_whatsapp: false,
    can_manage_team: false, can_invite_members: false, can_edit_permissions: false,
    can_view_settings: false, can_edit_settings: false,
  },
  cashier: {
    can_view_schedule: true, can_edit_schedule: false, can_view_all_appointments: true, can_cancel_any_appointment: false,
    can_view_financial: true, can_edit_financial: false, can_view_reports: false, can_process_payments: true, can_manage_cashier: true,
    can_view_clients: true, can_edit_clients: false, can_manage_loyalty: false,
    can_view_services: true, can_edit_services: false, can_view_inventory: false, can_edit_inventory: false, can_manage_packages: false,
    can_send_campaigns: false, can_manage_automations: false, can_manage_reviews: false, can_access_whatsapp: false,
    can_manage_team: false, can_invite_members: false, can_edit_permissions: false,
    can_view_settings: false, can_edit_settings: false,
  },
};

export const ROLE_LABELS: Record<TeamRole, string> = {
  owner: "Proprietário",
  manager: "Gerente",
  professional: "Profissional",
  receptionist: "Recepcionista",
  cashier: "Caixa",
};

export const ROLE_ICONS: Record<TeamRole, string> = {
  owner: "👑",
  manager: "⚙️",
  professional: "✂️",
  receptionist: "📞",
  cashier: "💰",
};

// ───────────────────────────────────────────────────────────────────────────────

export async function getTeamMembers(barbershopId: string): Promise<TeamMember[]> {
  try {
    const { data, error } = await (supabase as any)
      .from("team_members")
      .select("*")
      .eq("barbershop_id", barbershopId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error("[teamService] getTeamMembers error:", error);
    toast.error("Erro ao carregar equipe.");
    return [];
  }
}

export async function inviteTeamMember(params: {
  barbershop_id: string;
  email: string;
  name: string;
  role: TeamRole;
  phone?: string;
  invited_by: string;
}): Promise<{ success: boolean; member?: TeamMember; error?: string }> {
  try {
    // Verificar se email já está na equipe
    const { data: existing } = await (supabase as any)
      .from("team_members")
      .select("id")
      .eq("barbershop_id", params.barbershop_id)
      .eq("email", params.email)
      .maybeSingle();

    if (existing) {
      return { success: false, error: "Este email já está na equipe." };
    }

    const permissions = DEFAULT_PERMISSIONS[params.role];

    const { data, error } = await (supabase as any)
      .from("team_members")
      .insert({
        barbershop_id: params.barbershop_id,
        email: params.email,
        name: params.name,
        role: params.role,
        phone: params.phone || null,
        status: "invited",
        permissions,
        invited_by: params.invited_by,
      })
      .select()
      .single();

    if (error) throw error;

    // TODO: Enviar email de convite
    toast.success(`Convite enviado para ${params.email}`);
    return { success: true, member: data };
  } catch (error: any) {
    console.error("[teamService] inviteTeamMember error:", error);
    return { success: false, error: error.message };
  }
}

export async function updateMemberRole(
  memberId: string,
  newRole: TeamRole,
  customPermissions?: Partial<TeamPermissions>
): Promise<boolean> {
  try {
    const permissions = customPermissions || DEFAULT_PERMISSIONS[newRole];

    const { error } = await (supabase as any)
      .from("team_members")
      .update({ role: newRole, permissions })
      .eq("id", memberId);

    if (error) throw error;
    toast.success("Cargo atualizado com sucesso.");
    return true;
  } catch (error: any) {
    console.error("[teamService] updateMemberRole error:", error);
    toast.error("Erro ao atualizar cargo.");
    return false;
  }
}

export async function updateMemberPermissions(
  memberId: string,
  permissions: TeamPermissions
): Promise<boolean> {
  try {
    const { error } = await (supabase as any)
      .from("team_members")
      .update({ permissions })
      .eq("id", memberId);

    if (error) throw error;
    toast.success("Permissões atualizadas.");
    return true;
  } catch (error: any) {
    console.error("[teamService] updateMemberPermissions error:", error);
    toast.error("Erro ao atualizar permissões.");
    return false;
  }
}

export async function removeTeamMember(memberId: string): Promise<boolean> {
  try {
    const { error } = await (supabase as any)
      .from("team_members")
      .update({ status: "inactive" })
      .eq("id", memberId);

    if (error) throw error;
    toast.success("Membro removido da equipe.");
    return true;
  } catch (error: any) {
    console.error("[teamService] removeTeamMember error:", error);
    toast.error("Erro ao remover membro.");
    return false;
  }
}

export async function reactivateTeamMember(memberId: string): Promise<boolean> {
  try {
    const { error } = await (supabase as any)
      .from("team_members")
      .update({ status: "active" })
      .eq("id", memberId);

    if (error) throw error;
    toast.success("Membro reativado.");
    return true;
  } catch (error: any) {
    console.error("[teamService] reactivateTeamMember error:", error);
    toast.error("Erro ao reativar membro.");
    return false;
  }
}

export async function resendInvite(memberId: string): Promise<boolean> {
  try {
    const { error } = await (supabase as any)
      .from("team_members")
      .update({ status: "invited", created_at: new Date().toISOString() })
      .eq("id", memberId);

    if (error) throw error;
    toast.success("Convite reenviado.");
    return true;
  } catch (error: any) {
    console.error("[teamService] resendInvite error:", error);
    toast.error("Erro ao reenviar convite.");
    return false;
  }
}

export async function getTeamMemberById(memberId: string): Promise<TeamMember | null> {
  try {
    const { data, error } = await (supabase as any)
      .from("team_members")
      .select("*")
      .eq("id", memberId)
      .maybeSingle();

    if (error) throw error;
    return data || null;
  } catch (error: any) {
    console.error("[teamService] getTeamMemberById error:", error);
    return null;
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// Verificação de permissões no frontend

export function hasPermission(
  member: TeamMember | null | undefined,
  permission: keyof TeamPermissions
): boolean {
  if (!member) return false;
  if (member.role === "owner") return true; // Owner sempre tem tudo
  return member.permissions?.[permission] ?? false;
}

export function canManageRole(currentRole: TeamRole, targetRole: TeamRole): boolean {
  const hierarchy: Record<TeamRole, number> = {
    owner: 100,
    manager: 80,
    professional: 40,
    receptionist: 30,
    cashier: 20,
  };
  
  // Só pode gerenciar roles de hierarquia menor
  return hierarchy[currentRole] > hierarchy[targetRole];
}
