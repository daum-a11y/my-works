import { useId, type ChangeEvent } from 'react';
import { Select, TextInput, Textarea } from 'krds-react';
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
    <TextInput
      id={inputId}
      label={label}
      hint={description}
      error={errorMessage}
      aria-invalid={errorMessage ? true : ariaInvalid}
      aria-describedby={buildDescribedBy(ariaDescribedBy, descriptionId, errorId)}
      onChange={(value) => {
        if (!onChange) {
          return;
        }

        const event = {
          target: { value, name: props.name },
          currentTarget: { value, name: props.name },
        } as ChangeEvent<HTMLInputElement>;
        onChange(event);
      }}
      {...props}
      style={{ width: '100%', ...props.style }}
    />
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
    <div className={className}>
      <Textarea
        id={inputId}
        label={label}
        aria-invalid={errorMessage ? true : ariaInvalid}
        aria-describedby={buildDescribedBy(ariaDescribedBy, descriptionId, errorId)}
        onChange={(value) => {
          if (!onChange) {
            return;
          }

          const event = {
            target: { value, name: props.name },
            currentTarget: { value, name: props.name },
          } as ChangeEvent<HTMLTextAreaElement>;
          onChange(event);
        }}
        {...props}
        style={{ width: '100%', ...props.style }}
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

export function SelectField({
  label,
  errorMessage,
  description,
  onChange,
  options,
  ...props
}: SelectFieldProps) {
  return (
    <Select
      label={label}
      hint={description}
      error={errorMessage}
      options={[...options]}
      onChange={(value) => {
        if (!onChange) {
          return;
        }

        const event = {
          target: { value, name: props.name },
          currentTarget: { value, name: props.name },
        } as ChangeEvent<HTMLSelectElement>;
        onChange(event);
      }}
      {...props}
      style={{ width: '100%', ...props.style }}
    />
  );
}
