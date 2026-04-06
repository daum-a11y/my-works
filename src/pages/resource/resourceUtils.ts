import { useState } from 'react';
import { getToday } from '../../utils';

export function shiftMonth(month: string, offset: number) {
  const [year, value] = month.split('-').map(Number);
  const date = new Date(year, value - 1 + offset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function getCurrentMonth(reference = new Date()) {
  return `${reference.getFullYear()}-${String(reference.getMonth() + 1).padStart(2, '0')}`;
}

export function getPreviousBusinessDay(reference = new Date()) {
  const date = new Date(reference);
  const day = date.getDay();

  if (day === 1) {
    date.setDate(date.getDate() - 3);
  } else if (day === 0) {
    date.setDate(date.getDate() - 2);
  } else {
    date.setDate(date.getDate() - 1);
  }

  return date.toISOString().slice(0, 10);
}

export function getNextBusinessDay(reference = new Date()) {
  const date = new Date(reference);
  const day = date.getDay();

  if (day === 5) {
    date.setDate(date.getDate() + 3);
  } else if (day === 6) {
    date.setDate(date.getDate() + 2);
  } else {
    date.setDate(date.getDate() + 1);
  }

  return date.toISOString().slice(0, 10);
}

export function buildMonthDays(month: string) {
  const [year, value] = month.split('-').map(Number);
  const count = new Date(year, value, 0).getDate();
  return Array.from({ length: count }, (_, index) => {
    const day = index + 1;
    const date = `${month}-${String(day).padStart(2, '0')}`;
    return {
      day,
      date,
      weekday: new Date(year, value - 1, day).getDay(),
    };
  });
}

export function buildCalendarWeeks(month: string) {
  const days = buildMonthDays(month);
  const firstWeekday = days[0]?.weekday ?? 0;
  const lastWeekday = days[days.length - 1]?.weekday ?? 0;
  const cells = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...days,
    ...Array.from({ length: 6 - lastWeekday }, () => null),
  ];
  const weeks: Array<Array<(typeof days)[number] | null>> = [];

  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7));
  }

  return weeks;
}

export function countWorkingDays(month: string) {
  return buildMonthDays(month).filter((day) => day.weekday !== 0 && day.weekday !== 6).length;
}

export function countWorkingDaysUntil(month: string, day: number) {
  return buildMonthDays(month).filter(
    (item) => item.day <= day && item.weekday !== 0 && item.weekday !== 6,
  ).length;
}

export function normalizeTaskUsedtime(taskUsedtime: number) {
  return Math.round(taskUsedtime);
}

export function minutesToMm(minutes: number, workingDays = 21) {
  const total = workingDays * 480;
  return total > 0 ? minutes / total : 0;
}

export function minutesToMd(minutes: number) {
  return minutes / 480;
}

export function formatMm(minutes: number, workingDays = 21) {
  return minutesToMm(minutes, workingDays).toFixed(2);
}

export function formatMd(minutes: number) {
  return minutesToMd(minutes).toFixed(2);
}

export function useResourceFilters(defaultMemberId?: string) {
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [selectedMonth, setSelectedMonth] = useState(getToday().slice(0, 7));
  const [selectedMemberId, setSelectedMemberId] = useState(defaultMemberId ?? '');

  return {
    selectedDate,
    setSelectedDate,
    selectedMonth,
    setSelectedMonth,
    selectedMemberId,
    setSelectedMemberId,
  };
}
