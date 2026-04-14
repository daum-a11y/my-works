import { useId } from 'react';
import clsx from 'clsx';
import { FIELD_CLASS_NAMES, FIELD_ID_SUFFIX } from './Field.constants';
import type { InputFieldProps, SelectFieldProps, TextAreaFieldProps } from './Field.types';

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
  onChange,
  ...props
}: InputFieldProps) {
  const generatedId = useId();
  const inputId = id ?? props.name ?? generatedId;
  const descriptionId = description ? `${inputId}-${FIELD_ID_SUFFIX.description}` : undefined;
  const errorId = errorMessage ? `${inputId}-${FIELD_ID_SUFFIX.error}` : undefined;

  return (
    <div
      className={clsx('form-group', FIELD_CLASS_NAMES.root, errorMessage && 'is-error', className)}
    >
      <div className="form-tit">
        <label htmlFor={inputId} className={FIELD_CLASS_NAMES.label}>
          {label}
        </label>
      </div>
      <div className="form-conts">
        <input
          {...props}
          id={inputId}
          className={clsx('krds-input large', FIELD_CLASS_NAMES.control)}
          aria-invalid={errorMessage ? true : ariaInvalid}
          aria-describedby={buildDescribedBy(ariaDescribedBy, descriptionId, errorId)}
          onChange={(event) => onChange?.(event)}
          style={{ width: '100%', ...props.style }}
        />
      </div>
      {description ? (
        <p id={descriptionId} className={FIELD_CLASS_NAMES.description}>
          {description}
        </p>
      ) : null}
      {errorMessage ? (
        <p id={errorId} className="form-hint-invalid ui-field__error" role="alert">
          {errorMessage}
        </p>
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
  onChange,
  ...props
}: TextAreaFieldProps) {
  const generatedId = useId();
  const inputId = id ?? props.name ?? generatedId;
  const descriptionId = description ? `${inputId}-${FIELD_ID_SUFFIX.description}` : undefined;
  const errorId = errorMessage ? `${inputId}-${FIELD_ID_SUFFIX.error}` : undefined;

  return (
    <div
      className={clsx('form-group', FIELD_CLASS_NAMES.root, errorMessage && 'is-error', className)}
    >
      <div className="form-tit">
        <label htmlFor={inputId} className={FIELD_CLASS_NAMES.label}>
          {label}
        </label>
      </div>
      <div className="form-conts">
        <textarea
          {...props}
          id={inputId}
          className={clsx('krds-input', FIELD_CLASS_NAMES.control, FIELD_CLASS_NAMES.textArea)}
          aria-invalid={errorMessage ? true : ariaInvalid}
          aria-describedby={buildDescribedBy(ariaDescribedBy, descriptionId, errorId)}
          onChange={(event) => onChange?.(event)}
          style={{ width: '100%', ...props.style }}
        />
      </div>
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

export function SelectField({
  label,
  errorMessage,
  description,
  className,
  id,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  onChange,
  options,
  ...props
}: SelectFieldProps) {
  const generatedId = useId();
  const inputId = id ?? props.name ?? generatedId;
  const descriptionId = description ? `${inputId}-${FIELD_ID_SUFFIX.description}` : undefined;
  const errorId = errorMessage ? `${inputId}-${FIELD_ID_SUFFIX.error}` : undefined;

  return (
    <div
      className={clsx('form-group', FIELD_CLASS_NAMES.root, errorMessage && 'is-error', className)}
    >
      <div className="form-tit">
        <label htmlFor={inputId} className={FIELD_CLASS_NAMES.label}>
          {label}
        </label>
      </div>
      <div className="form-conts">
        <select
          {...props}
          id={inputId}
          className={clsx('krds-form-select large', FIELD_CLASS_NAMES.control)}
          aria-invalid={errorMessage ? true : ariaInvalid}
          aria-describedby={buildDescribedBy(ariaDescribedBy, descriptionId, errorId)}
          onChange={(event) => onChange?.(event)}
          style={{ width: '100%', ...props.style }}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      {description ? (
        <p id={descriptionId} className={FIELD_CLASS_NAMES.description}>
          {description}
        </p>
      ) : null}
      {errorMessage ? (
        <p id={errorId} className="form-hint-invalid ui-field__error" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
