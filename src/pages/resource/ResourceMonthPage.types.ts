export type ResourceMonthTableTab = 'type' | 'service' | 'report';

export interface DistributionItem {
  key: 'holiday' | 'project' | 'normal' | 'buffer';
  label: string;
  minutes: number;
  mm: string;
  fill: string;
  labelColor?: string;
}

export interface DistributionTooltipPayloadItem {
  dataKey?: string | number;
  value?: number | string;
}

export interface DistributionTooltipProps {
  active?: boolean;
  payload?: DistributionTooltipPayloadItem[];
}
