import { type Member, type PageStatus } from "./domain";

export function createId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function formatDateLabel(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function formatHours(value: number): string {
  return `${value.toFixed(1)}h`;
}

export function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDays(baseDate: string, offset: number): string {
  const date = new Date(baseDate);
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

export function isAdmin(member: Member | null | undefined): boolean {
  return member?.role === "admin";
}

export function sortStatus(status: PageStatus): number {
  return {
    미개선: 0,
    일부: 1,
    개선: 2,
    중지: 3,
  }[status];
}
