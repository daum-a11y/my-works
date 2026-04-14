export function isoToKrdsDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${match[1]}.${match[2]}.${match[3]}` : value;
}

export function krdsToIsoDate(value: string) {
  const match = /^(\d{4})[.-](\d{2})[.-](\d{2})$/.exec(value);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : null;
}

export function isWithinDateRange(value: string, min?: string, max?: string) {
  return (!min || value >= min) && (!max || value <= max);
}
