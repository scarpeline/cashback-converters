/**
 * Máscaras simples (sem dependências) para inputs comuns do app.
 */

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function formatWhatsAppBR(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);

  if (digits.length === 0) return "";

  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2);

  if (rest.length <= 4) return `(${ddd}) ${rest}`;
  if (rest.length <= 8) return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;

  // 9 dígitos (celular): 99999-9999
  return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5, 9)}`;
}

export function formatCpfCnpjBR(value: string): string {
  const digits = onlyDigits(value).slice(0, 14);

  if (digits.length <= 11) {
    // CPF: 000.000.000-00
    const p1 = digits.slice(0, 3);
    const p2 = digits.slice(3, 6);
    const p3 = digits.slice(6, 9);
    const p4 = digits.slice(9, 11);

    let out = p1;
    if (p2) out += `.${p2}`;
    if (p3) out += `.${p3}`;
    if (p4) out += `-${p4}`;
    return out;
  }

  // CNPJ: 00.000.000/0000-00
  const p1 = digits.slice(0, 2);
  const p2 = digits.slice(2, 5);
  const p3 = digits.slice(5, 8);
  const p4 = digits.slice(8, 12);
  const p5 = digits.slice(12, 14);

  let out = p1;
  if (p2) out += `.${p2}`;
  if (p3) out += `.${p3}`;
  if (p4) out += `/${p4}`;
  if (p5) out += `-${p5}`;
  return out;
}
