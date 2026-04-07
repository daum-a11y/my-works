export type ResourceSummaryMinuteTone = 'positive' | 'negative' | 'neutral';

export interface ResourceSummaryRow {
  id: string;
  label: string;
  diffMinutes: number;
  hasMissingDay: boolean;
}
