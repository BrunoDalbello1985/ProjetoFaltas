import { AttendanceRecord } from '../types/attendance';

export const MESES_PT: { [key: number]: string } = {
  0: 'janeiro',
  1: 'fevereiro',
  2: 'março',
  3: 'abril',
  4: 'maio',
  5: 'junho',
  6: 'julho',
  7: 'agosto',
  8: 'setembro',
  9: 'outubro',
  10: 'novembro',
  11: 'dezembro',
};

/**
 * Calculates the week of the month where Monday is considered the start of the week,
 * as required by the spreadsheet specification.
 */
export function getSemanaDoMes(dateString: string): string {
  if (!dateString) return '1ª semana';
  const parts = dateString.split('-');
  if (parts.length < 3) return '1ª semana';
  
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const date = new Date(year, month, day);
  if (isNaN(date.getTime())) return '1ª semana';

  // Find the day of the week for the 1st of this month
  const firstDayOfMonth = new Date(year, month, 1);
  let firstDayWeekday = firstDayOfMonth.getDay();
  // Adjust so Monday = 0, Sunday = 6
  firstDayWeekday = (firstDayWeekday + 6) % 7;

  // Calculate week index
  const weekIndex = Math.floor((day + firstDayWeekday - 1) / 7) + 1;
  const clampedWeek = Math.min(Math.max(weekIndex, 1), 5);
  return `${clampedWeek}ª semana`;
}

/**
 * Extracts the lowercase month name in Portuguese.
 */
export function getMesDoAno(dateString: string): string {
  if (!dateString) return 'setembro';
  const parts = dateString.split('-');
  if (parts.length < 2) return 'setembro';
  const monthIdx = parseInt(parts[1], 10) - 1;
  return MESES_PT[monthIdx] || 'setembro';
}

/**
 * Extracts the year from date string.
 */
export function getAnoFromDate(dateString: string): number {
  if (!dateString) return 2026;
  const parts = dateString.split('-');
  return parseInt(parts[0], 10) || 2026;
}

/**
 * Formats YYYY-MM-DD to DD/MM/YYYY
 */
export function formatDateBR(dateString: string): string {
  if (!dateString) return '';
  const parts = dateString.split('-');
  if (parts.length === 3) {
    return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
  }
  return dateString;
}

/**
 * Converts DD/MM/YYYY to YYYY-MM-DD
 */
export function parseDateBRtoISO(brDate: string): string {
  if (!brDate) return '';
  const parts = brDate.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return brDate;
}

/**
 * Generates and triggers download of CSV formatted for Excel (PT-BR with semicolon).
 */
export function exportToCSV(records: AttendanceRecord[], filename = 'ausencias_atestados_pagueplay.csv') {
  const headers = [
    'Data',
    'Nome',
    'Setor',
    'Qtde de Ausências',
    'Dias de Atestado',
    'Ausências Injustificadas',
    'Semana do mês',
    'Mês',
    'Ano',
    'Gestor Responsável',
    'Observações'
  ];

  const rows = records.map((r) => [
    formatDateBR(r.data),
    `"${r.nome.replace(/"/g, '""')}"`,
    `"${r.setor}"`,
    r.qtdeFaltas,
    r.diasAtestado,
    r.faltasInjustificadas,
    `"${r.semana}"`,
    `"${r.mes}"`,
    r.ano,
    `"${r.gestor || ''}"`,
    `"${(r.observacoes || '').replace(/"/g, '""')}"`
  ]);

  // Add summary row
  const totalAusencias = records.reduce((s, r) => s + r.qtdeFaltas, 0);
  const totalAtestados = records.reduce((s, r) => s + r.diasAtestado, 0);
  const totalInjustificadas = records.reduce((s, r) => s + r.faltasInjustificadas, 0);

  rows.push([
    'TOTAL GERAL',
    `"${records.length} registros"`,
    '',
    totalAusencias,
    totalAtestados,
    totalInjustificadas,
    '',
    '',
    '',
    '',
    ''
  ]);

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((row) => row.join(';'))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
