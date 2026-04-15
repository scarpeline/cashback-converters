import { z } from "zod";

// Base Shorthands
const phoneRegex = /^(\+55\s?)?(\(?\d{2}\)?\s?)?(\d{4,5}[-\s]?\d{4})$/;
const priceSchema = z.number().min(0, "Preço deve ser positivo").max(10000);

/**
 * ESQUEMAS DE OPERAÇÕES (Agendamentos)
 */
export const AppointmentSchema = z.object({
  client_name: z.string().min(3, "Nome do cliente é obrigatório").max(100),
  client_phone: z.string().regex(phoneRegex, "Formato de telefone inválido").optional().or(z.literal("")),
  service_id: z.string().uuid("Selecione um serviço válido"),
  professional_id: z.string().uuid("Selecione um profissional"),
  scheduled_at: z.union([z.date(), z.string()]).refine(v => {
    const d = v instanceof Date ? v : new Date(v);
    return !isNaN(d.getTime());
  }, "Data inválida"),
  status: z.enum(["scheduled", "confirmed", "completed", "canceled", "no_show"]),
});

/**
 * ESQUEMAS de GESTÃO (Equipe / Serviços)
 */
export const ProfessionalSchema = z.object({
  name: z.string().min(3, "Mínimo 3 caracteres"),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  phone: z.string().regex(phoneRegex, "Telefone inválido").optional().or(z.literal("")),
  role: z.enum(["master", "profissional", "assistente"]).optional().default("profissional"),
  commission_pct: z.number().min(0).max(100),
  is_active: z.boolean().default(true),
});

export const ServiceSchema = z.object({
  name: z.string().min(2, "Nome do serviço é obrigatório"),
  price: priceSchema,
  duration_minutes: z.number().min(5).max(480),
  category: z.string().optional(),
  description: z.string().max(500).optional(),
});

/**
 * ESQUEMAS FINANCEIROS
 */
export const WithdrawSchema = z.object({
  amount: z.number().min(1, "Valor mínimo de R$ 1,00"),
  pix_key: z.string().min(5, "Chave PIX inválida"),
  description: z.string().max(100).optional(),
});

/**
 * ESQUEMAS DE CONFIGURAÇÃO (Perfil / Barbearia)
 */
export const BarbershopProfileSchema = z.object({
  name: z.string().min(2, "Nome da barbearia é obrigatório"),
  slug: z.string().min(3, "Slug deve ter no mínimo 3 letras").regex(/^[a-z0-9-]+$/, "Apenas letras minúsculas, números e hífens"),
  phone: z.string().regex(phoneRegex, "Telefone inválido").optional(),
  address: z.string().min(5, "Endereço deve ser completo").optional(),
});
