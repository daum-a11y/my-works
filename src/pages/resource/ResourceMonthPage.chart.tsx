import type { DistributionItem, DistributionTooltipProps } from './ResourceMonthPage.types';

export function DistributionLabel({ props, item }: { props: unknown; item: DistributionItem }) {
  const labelProps = (props ?? {}) as {
    x?: number | string;
    y?: number | string;
    width?: number | string;
    height?: number | string;
  };
  const x = Number(labelProps.x ?? 0);
  const y = Number(labelProps.y ?? 0);
  const width = Number(labelProps.width ?? 0);
  const height = Number(labelProps.height ?? 0);

  if (!width || !height || width < 92) {
    return null;
  }

  return (
    <text
      x={x + width / 2}
      y={y + height / 2}
      fill={item.labelColor ?? 'var(--krds-light-color-text-inverse-static)'}
      fontSize="12"
      fontWeight="600"
      textAnchor="middle"
      dominantBaseline="central"
    >
      {`${item.label} ${item.mm} MM`}
    </text>
  );
}

export function DistributionTooltip({
  active,
  payload,
  items,
}: DistributionTooltipProps & { items: DistributionItem[] }) {
  if (!active || !payload?.length) {
    return null;
  }

  const current = payload.find((entry) => Number(entry.value ?? 0) > 0);
  if (!current) {
    return null;
  }

  const item = items.find((entry) => entry.key === current.dataKey);
  if (!item) {
    return null;
  }

  return (
    <div className="tooltip-content">
      <strong>{item.label}</strong>
      <span>{item.mm} MM</span>
    </div>
  );
}
