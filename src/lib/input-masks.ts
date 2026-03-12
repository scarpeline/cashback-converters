/**
 * Máscaras simples (sem dependências) para inputs comuns do app.
 */

// IMPORTANTE: Este arquivo está sendo substituído pelo sistema centralizado em /lib/validation/schemas.ts
// Mantido apenas para compatibilidade temporária

import { formatCPFOrCNPJ, formatWhatsApp, formatPhone, formatMoney } from './validation/schemas';

// Funções legadas - usar as novas do schemas.ts
export function formatCpfCnpjBR(value: string): string {
  return formatCPFOrCNPJ(value);
}

export function formatWhatsAppBR(value: string): string {
  return formatWhatsApp(value);
}

export function formatPhoneBR(value: string): string {
  return formatPhone(value);
}

export function formatMoneyBR(value: number): string {
  return formatMoney(value);
}

// Função utilitária para extrair apenas dígitos
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}
