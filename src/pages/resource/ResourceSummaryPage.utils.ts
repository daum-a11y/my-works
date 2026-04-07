import type { ResourceSummaryMinuteTone } from './ResourceSummaryPage.types';

const numberFormatter = new Intl.NumberFormat('ko-KR');

export function formatMemberLabel(accountId: string, name: string) {
  return `${accountId}(${name})`;
}

export function formatSignedMinutes(minutes: number) {
  const absolute = numberFormatter.format(Math.abs(minutes));

  if (minutes > 0) {
    return `+${absolute}분`;
  }

  if (minutes < 0) {
    return `-${absolute}분`;
  }

  return '0';
}

export function getMinuteTone(minutes: number): ResourceSummaryMinuteTone {
  if (minutes > 0) {
    return 'positive';
  }

  if (minutes < 0) {
    return 'negative';
  }

  return 'neutral';
}
