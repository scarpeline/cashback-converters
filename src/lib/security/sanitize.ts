/**
 * Sanitização de inputs — previne XSS e injeção
 */

/** Remove tags HTML e caracteres perigosos */
export function sanitizeText(input: string): string {
  return input
    .replace(/[<>]/g, "")           // Remove < >
    .replace(/javascript:/gi, "")   // Remove javascript: URIs
    .replace(/on\w+=/gi, "")        // Remove event handlers inline
    .trim();
}

/** Sanitiza para uso em queries (complementa o prepared statements do Supabase) */
export function sanitizeForQuery(input: string): string {
  return input
    .replace(/['";\\]/g, "")
    .replace(/--/g, "")
    .replace(/\/\*/g, "")
    .trim();
}

/** Valida e sanitiza número de telefone */
export function sanitizePhone(phone: string): string {
  return phone.replace(/[^\d+\s()-]/g, "").trim();
}

/** Valida e sanitiza e-mail */
export function sanitizeEmail(email: string): string {
  return email.toLowerCase().replace(/[^a-z0-9@._+-]/g, "").trim();
}

/** Sanitiza valor monetário */
export function sanitizeCurrency(value: string | number): number {
  const num = typeof value === "string"
    ? parseFloat(value.replace(/[^\d.,]/g, "").replace(",", "."))
    : value;
  return isNaN(num) || num < 0 ? 0 : Math.round(num * 100) / 100;
}

/** Sanitiza slug (URLs amigáveis) */
export function sanitizeSlug(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .trim();
}

/** Valida se é UUID válido */
export function isValidUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/** Sanitiza objeto recursivamente (apenas strings) */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result = { ...obj };
  for (const key in result) {
    if (typeof result[key] === "string") {
      (result as any)[key] = sanitizeText(result[key] as string);
    }
  }
  return result;
}
