/**
 * Utilitário para exportar dados em CSV
 */

export interface CSVExportOptions {
  filename: string;
  headers: string[];
  data: any[][];
}

export function exportToCSV({ filename, headers, data }: CSVExportOptions) {
  // Escapar valores que contêm aspas ou quebras de linha
  const escapeCSV = (value: any): string => {
    if (value === null || value === undefined) return '';
    const stringValue = String(value);
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  // Montar CSV
  const csvContent = [
    headers.map(escapeCSV).join(','),
    ...data.map(row => row.map(escapeCSV).join(','))
  ].join('\n');

  // Criar blob e download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Exportar parceiros para CSV
 */
export function exportPartnersToCSV(partners: any[]) {
  const headers = ['Nome', 'Email', 'WhatsApp', 'Tipo', 'Status', 'Indicados', 'Nível', 'Código Referência'];
  
  const data = partners.map(partner => [
    partner.users?.name || '',
    partner.users?.email || '',
    partner.users?.whatsapp || '',
    partner.type,
    partner.status,
    partner.total_indicados || 0,
    partner.level || 0,
    partner.referral_code || ''
  ]);

  exportToCSV({
    filename: `parceiros_${new Date().toISOString().split('T')[0]}`,
    headers,
    data
  });
}

/**
 * Exportar comissões para CSV
 */
export function exportCommissionsToCSV(commissions: any[], partnerName: string) {
  const headers = ['Data', 'Tipo', 'Valor', 'Status', 'Descrição'];
  
  const data = commissions.map(commission => [
    new Date(commission.created_at).toLocaleDateString('pt-BR'),
    commission.type.replace(/_/g, ' '),
    `R$ ${commission.amount.toFixed(2)}`,
    commission.status,
    commission.description || ''
  ]);

  exportToCSV({
    filename: `comissoes_${partnerName}_${new Date().toISOString().split('T')[0]}`,
    headers,
    data
  });
}
