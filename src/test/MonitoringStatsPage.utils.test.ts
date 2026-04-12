import { describe, expect, it } from 'vitest';
import { monthKeyFromMonitoringMonth } from '../pages/stats/MonitoringStatsPage.utils';

describe('monthKeyFromMonitoringMonth', () => {
  it('normalizes legacy YYMM values', () => {
    expect(monthKeyFromMonitoringMonth('2511')).toBe('2025-11');
  });

  it('normalizes month input values', () => {
    expect(monthKeyFromMonitoringMonth('2025-11')).toBe('2025-11');
  });

  it('normalizes compact YYYYMM values', () => {
    expect(monthKeyFromMonitoringMonth('202511')).toBe('2025-11');
  });

  it('ignores invalid month values', () => {
    expect(monthKeyFromMonitoringMonth('2025-13')).toBe('');
  });
});
