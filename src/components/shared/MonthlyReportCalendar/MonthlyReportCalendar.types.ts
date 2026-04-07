export interface CalendarCell {
  day: number;
  date: string;
  weekday: number;
}

export interface MonthlyReportCalendarLink {
  to: string;
  state?: unknown;
}

export interface MonthlyReportCalendarProps {
  weeks: Array<Array<CalendarCell | null>>;
  summary: Map<number, number>;
  currentMonth: boolean;
  futureMonth: boolean;
  todayDay: number;
  caption?: string;
  padded?: boolean;
  panel?: boolean;
  getDateLink?: (date: string) => MonthlyReportCalendarLink | null;
  className?: string;
}
