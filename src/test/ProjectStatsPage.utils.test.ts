import { describe, expect, it } from 'vitest';
import {
  formatMonthLabel,
  formatTaskMonthValue,
  monthKeyFromDate,
  monthKeyFromTaskMonth,
} from '../pages/stats/ProjectStatsPage.utils';

describe('monthKeyFromTaskMonth', () => {
  it('normalizes legacy YYMM values', () => {
    expect(monthKeyFromTaskMonth('2511')).toBe('2025-11');
  });

  it('normalizes month input values', () => {
    expect(monthKeyFromTaskMonth('2025-11')).toBe('2025-11');
  });

  it('normalizes compact YYYYMM values', () => {
    expect(monthKeyFromTaskMonth('202511')).toBe('2025-11');
  });

  it('normalizes full ISO dates', () => {
    expect(monthKeyFromTaskMonth('2024-09-09')).toBe('2024-09');
  });

  it('normalizes compact YYYYMMDD values', () => {
    expect(monthKeyFromTaskMonth('20240909')).toBe('2024-09');
  });

  it('ignores invalid month values', () => {
    expect(monthKeyFromTaskMonth('2025-13')).toBe('');
  });
});

describe('monthKeyFromDate', () => {
  it('extracts the YYYY-MM key from a valid date', () => {
    expect(monthKeyFromDate('2026-03-31')).toBe('2026-03');
  });

  it('ignores invalid date values', () => {
    expect(monthKeyFromDate('2026-13-01')).toBe('');
  });
});

describe('formatMonthLabel', () => {
  it('formats valid month keys', () => {
    expect(formatMonthLabel('2026-03')).toBe('2026/03');
  });

  it('returns empty string for invalid month keys', () => {
    expect(formatMonthLabel('')).toBe('');
    expect(formatMonthLabel('2026-13')).toBe('');
  });
});

describe('formatTaskMonthValue', () => {
  it('keeps full ISO dates as-is', () => {
    expect(formatTaskMonthValue('2024-09-09')).toBe('2024-09-09');
  });

  it('formats month codes as month labels', () => {
    expect(formatTaskMonthValue('2409')).toBe('2024/09');
  });

  it('returns dash for invalid values', () => {
    expect(formatTaskMonthValue('')).toBe('-');
  });
});
