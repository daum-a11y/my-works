import { type Member, type PageStatus } from './domain';

export function createId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function formatDateLabel(value: string): string {
  const date = parseLocalDateInput(value) ?? new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function formatHours(value: number): string {
  return `${value.toFixed(1)}h`;
}

export function toLocalDateInputValue(value: Date): string {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseLocalDateInput(value: string): Date | null {
  if (!value) {
    return null;
  }

  const [yearText, monthText, dayText] = value.split('-');
  const year = Number.parseInt(yearText ?? '', 10);
  const month = Number.parseInt(monthText ?? '', 10);
  const day = Number.parseInt(dayText ?? '', 10);

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }

  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

export function getToday(): string {
  return toLocalDateInputValue(new Date());
}

export function addDays(baseDate: string, offset: number): string {
  const date = parseLocalDateInput(baseDate) ?? new Date();
  date.setDate(date.getDate() + offset);
  return toLocalDateInputValue(date);
}

export function isAdmin(member: Member | null | undefined): boolean {
  return member?.role === 'admin';
}

export function sortStatus(status: PageStatus): number {
  return {
    미개선: 0,
    일부: 1,
    개선: 2,
    중지: 3,
  }[status];
}
