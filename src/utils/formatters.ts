import { PunchType } from '../types';

export function formatMinutesToHours(minutes: number, showSign = false): string {
  const isNegative = minutes < 0;
  const absMin = Math.abs(minutes);
  const hours = Math.floor(absMin / 60);
  const mins = absMin % 60;

  const paddedHours = String(hours).padStart(2, '0');
  const paddedMins = String(mins).padStart(2, '0');

  if (showSign) {
    if (minutes === 0) return '00h 00m';
    return `${isNegative ? '-' : '+'}${paddedHours}h ${paddedMins}m`;
  }

  return `${isNegative ? '-' : ''}${paddedHours}h ${paddedMins}m`;
}

export function formatMinutesShort(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function formatTimeHHMM(timeStr: string): string {
  if (!timeStr) return '--:--';
  const parts = timeStr.split(':');
  if (parts.length >= 2) {
    return `${parts[0]}:${parts[1]}`;
  }
  return timeStr;
}

export function formatDateBR(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  if (!year || !month || !day) return dateStr;
  return `${day}/${month}/${year}`;
}

export function formatFullDateLong(date: Date = new Date()): string {
  const daysOfWeek = [
    'Domingo',
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado',
  ];
  const months = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];

  const dayName = daysOfWeek[date.getDay()];
  const day = String(date.getDate()).padStart(2, '0');
  const monthName = months[date.getMonth()];
  const year = date.getFullYear();

  return `${dayName}, ${day} de ${monthName} de ${year}`;
}

export function formatCPF(cpf: string): string {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return cpf;
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

export function formatCNPJ(cnpj: string): string {
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length !== 14) return cnpj;
  return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

export function getPunchTypeLabel(type: PunchType): string {
  switch (type) {
    case 'entry':
      return '1ª Entrada';
    case 'lunch_start':
      return '1ª Saída (Intervalo)';
    case 'lunch_end':
      return '2ª Entrada (Retorno)';
    case 'exit':
      return '2ª Saída (Fim)';
    case 'extra':
      return 'Marcação Extra';
    default:
      return type;
  }
}

export function getPunchTypeShort(type: PunchType): string {
  switch (type) {
    case 'entry':
      return 'Entrada';
    case 'lunch_start':
      return 'Saída Intervalo';
    case 'lunch_end':
      return 'Retorno';
    case 'exit':
      return 'Saída Final';
    case 'extra':
      return 'Extra';
    default:
      return type;
  }
}

export function generateFakeHash(length = 32): string {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export function calculateMinutesBetweenTimes(start: string, end: string): number {
  const [sH, sM] = start.split(':').map(Number);
  const [eH, eM] = end.split(':').map(Number);
  const startTotal = sH * 60 + sM;
  const endTotal = eH * 60 + eM;
  return Math.max(0, endTotal - startTotal);
}
