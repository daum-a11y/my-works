import { useId, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import clsx from 'clsx';
import '../../styles/domain/components/Field.scss';

interface FieldBaseProps {
  label: string;
  errorMessage?: string;
  description?: string;
  className?: string;
}

type InputFieldProps = FieldBaseProps & InputHTMLAttributes<HTMLInputElement>;
type TextAreaFieldProps = FieldBaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>;

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
  const descriptionId = description ? `${inputId}-description` : undefined;
  const errorId = errorMessage ? `${inputId}-error` : undefined;

  return (
    <label className={clsx('ui-field', className)} htmlFor={inputId}>
      <span className="ui-field__label">{label}</span>
      <input
        id={inputId}
        className="ui-field__control"
        aria-invalid={errorMessage ? true : ariaInvalid}
        aria-describedby={buildDescribedBy(ariaDescribedBy, descriptionId, errorId)}
        {...props}
      />
      {description ? (
        <span id={descriptionId} className="ui-field__description">
          {description}
        </span>
      ) : null}
      {errorMessage ? (
        <span id={errorId} className="ui-field__error" role="alert">
          {errorMessage}
        </span>
      ) : null}
    </label>
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
  const descriptionId = description ? `${inputId}-description` : undefined;
  const errorId = errorMessage ? `${inputId}-error` : undefined;

  return (
    <label className={clsx('ui-field', className)} htmlFor={inputId}>
      <span className="ui-field__label">{label}</span>
      <textarea
        id={inputId}
        className={clsx('ui-field__control', 'ui-field__control--textarea')}
        aria-invalid={errorMessage ? true : ariaInvalid}
        aria-describedby={buildDescribedBy(ariaDescribedBy, descriptionId, errorId)}
        {...props}
      />
      {description ? (
        <span id={descriptionId} className="ui-field__description">
          {description}
        </span>
      ) : null}
      {errorMessage ? (
        <span id={errorId} className="ui-field__error" role="alert">
          {errorMessage}
        </span>
      ) : null}
    </label>
  );
}
