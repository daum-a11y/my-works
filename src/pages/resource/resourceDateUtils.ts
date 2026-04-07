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
