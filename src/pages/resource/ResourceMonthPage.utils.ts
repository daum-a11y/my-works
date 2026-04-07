const integerFormatter = new Intl.NumberFormat('ko-KR');
const decimalFormatter = new Intl.NumberFormat('ko-KR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function parseMonth(value: string) {
  const [year, month] = value.split('-').map(Number);
  return { year, month };
}

export function formatIntegerValue(value: number) {
  return integerFormatter.format(value);
}

export function formatDecimalValue(value: number) {
  return decimalFormatter.format(value);
}
