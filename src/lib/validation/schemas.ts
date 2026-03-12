import { z } from 'zod';

// Schema para validação de CPF/CNPJ
export const cpfCnpjSchema = z.string()
  .transform((val) => val.replace(/\D/g, ''))
  .refine((val) => {
    const cleaned = val.replace(/\D/g, '');
    return cleaned.length === 11 || cleaned.length === 14;
  }, 'CPF ou CNPJ inválido');

// Schema para validação de WhatsApp
export const whatsappSchema = z.string()
  .transform((val) => val.replace(/\D/g, ''))
  .refine((val) => {
    const cleaned = val.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 11;
  }, 'WhatsApp inválido');

// Schema para validação de email
export const emailSchema = z.string()
  .email('Email inválido')
  .transform((val) => val.toLowerCase().trim());

// Schema para validação de nome
export const nameSchema = z.string()
  .min(2, 'Nome deve ter pelo menos 2 caracteres')
  .max(100, 'Nome deve ter no máximo 100 caracteres')
  .transform((val) => val.trim());

// Schema para validação de valor monetário
export const moneySchema = z.string()
  .transform((val) => val.replace(/[^\d,]/g, '').replace(',', '.'))
  .refine((val) => !isNaN(parseFloat(val)), 'Valor inválido')
  .transform((val) => parseFloat(val));

// Schema para validação de telefone
export const phoneSchema = z.string()
  .transform((val) => val.replace(/\D/g, ''))
  .refine((val) => val.length >= 10 && val.length <= 11, 'Telefone inválido');

// Schema para validação de data
export const dateSchema = z.string()
  .refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, 'Data inválida');

// Schema combinado para perfil
export const profileSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  whatsapp: whatsappSchema.optional(),
  cpf_cnpj: cpfCnpjSchema.optional(),
  phone: phoneSchema.optional(),
});

// Schema para barbearia
export const barbershopSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  address: z.string().min(5, 'Endereço deve ter pelo menos 5 caracteres').optional(),
  description: z.string().max(500, 'Descrição deve ter no máximo 500 caracteres').optional(),
});

// Schema para serviço
export const serviceSchema = z.object({
  name: nameSchema,
  price: moneySchema.refine((val) => val > 0, 'Preço deve ser maior que 0'),
  duration: z.number().min(5, 'Duração deve ser pelo menos 5 minutos').max(480, 'Duração deve ser no máximo 8 horas'),
  description: z.string().max(300, 'Descrição deve ter no máximo 300 caracteres').optional(),
});

// Schema para agendamento
export const appointmentSchema = z.object({
  professional_id: z.string().uuid('ID do profissional inválido'),
  service_id: z.string().uuid('ID do serviço inválido'),
  scheduled_time: dateSchema,
  notes: z.string().max(500, 'Observações devem ter no máximo 500 caracteres').optional(),
});

// Funções de formatação compartilhadas
export const formatCPF = (value: string): string => {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length <= 11) {
    return cleaned
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  return cleaned
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
};

export const formatCNPJ = (value: string): string => {
  const cleaned = value.replace(/\D/g, '');
  return cleaned
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
};

export const formatCPFOrCNPJ = (value: string): string => {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length <= 11) {
    return formatCPF(value);
  }
  return formatCNPJ(value);
};

export const formatWhatsApp = (value: string): string => {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length <= 10) {
    return cleaned
      .replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return cleaned
    .replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
};

export const formatPhone = (value: string): string => {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length <= 10) {
    return cleaned
      .replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return cleaned
    .replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
};

export const formatMoney = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const formatDateTime = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Funções de validação
export const validateCPF = (cpf: string): boolean => {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return false;
  
  // Algoritmo de validação de CPF
  let sum = 0;
  let remainder;
  
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleaned.substring(i - 1, i)) * (11 - i);
  }
  
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.substring(9, 10))) return false;
  
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cleaned.substring(i - 1, i)) * (12 - i);
  }
  
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.substring(10, 11))) return false;
  
  return true;
};

export const validateCNPJ = (cnpj: string): boolean => {
  const cleaned = cnpj.replace(/\D/g, '');
  if (cleaned.length !== 14) return false;
  
  // Algoritmo de validação de CNPJ
  let sum = 0;
  let remainder;
  const weights = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleaned.substring(i, i + 1)) * weights[i];
  }
  
  remainder = sum % 11;
  remainder = remainder < 2 ? 0 : 11 - remainder;
  
  if (remainder !== parseInt(cleaned.substring(12, 13))) return false;
  
  sum = 0;
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleaned.substring(i, i + 1)) * weights2[i];
  }
  
  remainder = sum % 11;
  remainder = remainder < 2 ? 0 : 11 - remainder;
  
  if (remainder !== parseInt(cleaned.substring(13, 14))) return false;
  
  return true;
};

export const validateCPFOrCNPJ = (value: string): boolean => {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length <= 11) {
    return validateCPF(value);
  }
  return validateCNPJ(value);
};
