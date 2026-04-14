import { useEffect, useState } from 'react';
import { DateInput, type DateInputProps } from 'krds-react';

interface KrdsDateInputProps extends Omit<
  DateInputProps,
  'value' | 'defaultValue' | 'onChange' | 'type'
> {
  value: string;
  min?: string;
  max?: string;
  onChange: (value: string) => void;
}

function isoToKrdsDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${match[1]}.${match[2]}.${match[3]}` : value;
}

function krdsToIsoDate(value: string) {
  const match = /^(\d{4})[.-](\d{2})[.-](\d{2})$/.exec(value);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : null;
}

function isWithinRange(value: string, min?: string, max?: string) {
  return (!min || value >= min) && (!max || value <= max);
}

export function KrdsDateInput({
  value,
  min,
  max,
  onChange,
  size = 'medium',
  ...props
}: KrdsDateInputProps) {
  const [displayValue, setDisplayValue] = useState(() => isoToKrdsDate(value));

  useEffect(() => {
    setDisplayValue(isoToKrdsDate(value));
  }, [value]);

  return (
    <DateInput
      {...props}
      size={size}
      value={displayValue}
      min={min}
      max={max}
      onChange={(nextValue) => {
        setDisplayValue(nextValue);

        if (!nextValue) {
          onChange('');
          return;
        }

        const isoValue = krdsToIsoDate(nextValue);
        if (isoValue && isWithinRange(isoValue, min, max)) {
          onChange(isoValue);
        }
      }}
    />
  );
}
