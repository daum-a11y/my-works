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
