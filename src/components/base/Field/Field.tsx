import { useId } from 'react';
import clsx from 'clsx';
import '../../../styles/domain/components/Field.scss';
import { FIELD_CLASS_NAMES, FIELD_ID_SUFFIX } from './Field.constants';
import type { InputFieldProps, TextAreaFieldProps } from './Field.types';

function buildDescribedBy(
  describedBy: string | undefined,
  descriptionId: string | undefined,
  errorId: string | undefined,
) {
  const tokens = [describedBy, descriptionId, errorId].filter(Boolean);
  return tokens.length ? tokens.join(' ') : undefined;
}

export function InputField({
  label,
  errorMessage,
  description,
  className,
  id,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  ...props
}: InputFieldProps) {
  const generatedId = useId();
  const inputId = id ?? props.name ?? generatedId;
  const descriptionId = description ? `${inputId}-${FIELD_ID_SUFFIX.description}` : undefined;
  const errorId = errorMessage ? `${inputId}-${FIELD_ID_SUFFIX.error}` : undefined;

  return (
    <div className={clsx(FIELD_CLASS_NAMES.root, className)}>
      <label className={FIELD_CLASS_NAMES.label} htmlFor={inputId}>
        {label}
      </label>
      <input
        id={inputId}
        className={FIELD_CLASS_NAMES.control}
        aria-invalid={errorMessage ? true : ariaInvalid}
        aria-describedby={buildDescribedBy(ariaDescribedBy, descriptionId, errorId)}
        {...props}
      />
      {description ? (
        <span id={descriptionId} className={FIELD_CLASS_NAMES.description}>
          {description}
        </span>
      ) : null}
      {errorMessage ? (
        <span id={errorId} className={FIELD_CLASS_NAMES.error} role="alert">
          {errorMessage}
        </span>
      ) : null}
    </div>
  );
}

export function TextAreaField({
  label,
  errorMessage,
  description,
  className,
  id,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  ...props
}: TextAreaFieldProps) {
  const generatedId = useId();
  const inputId = id ?? props.name ?? generatedId;
  const descriptionId = description ? `${inputId}-${FIELD_ID_SUFFIX.description}` : undefined;
  const errorId = errorMessage ? `${inputId}-${FIELD_ID_SUFFIX.error}` : undefined;

  return (
    <div className={clsx(FIELD_CLASS_NAMES.root, className)}>
      <label className={FIELD_CLASS_NAMES.label} htmlFor={inputId}>
        {label}
      </label>
      <textarea
        id={inputId}
        className={clsx(FIELD_CLASS_NAMES.control, FIELD_CLASS_NAMES.textArea)}
        aria-invalid={errorMessage ? true : ariaInvalid}
        aria-describedby={buildDescribedBy(ariaDescribedBy, descriptionId, errorId)}
        {...props}
      />
      {description ? (
        <span id={descriptionId} className={FIELD_CLASS_NAMES.description}>
          {description}
        </span>
      ) : null}
      {errorMessage ? (
        <span id={errorId} className={FIELD_CLASS_NAMES.error} role="alert">
          {errorMessage}
        </span>
      ) : null}
    </div>
  );
}
