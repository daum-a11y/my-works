import clsx from 'clsx';
import '../../../styles/domain/components/PageSizeField.scss';
import { PAGE_SIZE_FIELD_LABEL } from './PageSizeField.constants';
import type { PageSizeFieldProps } from './PageSizeField.types';

export function PageSizeField({
  value,
  options,
  onValueChange,
  className,
  ...props
}: PageSizeFieldProps) {
  return (
    <label className={clsx('page-size-field', className)}>
      <span>{PAGE_SIZE_FIELD_LABEL}</span>
      <select
        value={String(value)}
        onChange={(event) => onValueChange(Number(event.target.value))}
        {...props}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}행
          </option>
        ))}
      </select>
    </label>
  );
}
