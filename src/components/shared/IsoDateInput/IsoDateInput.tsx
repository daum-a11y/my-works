import { useEffect, useState } from 'react';
import { DateInput, type DateInputProps } from 'krds-react';
import { isoToKrdsDate, isWithinDateRange, krdsToIsoDate } from '../krdsDateInputUtils';

export interface IsoDateInputProps
  extends Omit<DateInputProps, 'value' | 'defaultValue' | 'onChange' | 'min' | 'max'> {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
}

export function IsoDateInput({ value, onChange, min, max, onBlur, ...props }: IsoDateInputProps) {
  const [displayValue, setDisplayValue] = useState(() => isoToKrdsDate(value));

  useEffect(() => {
    setDisplayValue(isoToKrdsDate(value));
  }, [value]);

  return (
    <DateInput
      {...props}
      value={displayValue}
      onChange={(nextValue) => {
        setDisplayValue(nextValue);

        if (!nextValue) {
          onChange('');
          return;
        }

        const isoValue = krdsToIsoDate(nextValue);
        if (isoValue && isWithinDateRange(isoValue, min, max)) {
          onChange(isoValue);
        }
      }}
      onBlur={(event) => {
        const isoValue = krdsToIsoDate(displayValue);
        if (!displayValue || !isoValue || !isWithinDateRange(isoValue, min, max)) {
          setDisplayValue(isoToKrdsDate(value));
        }
        onBlur?.(event);
      }}
    />
  );
}
