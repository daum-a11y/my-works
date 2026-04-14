import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

export interface FieldBaseProps {
  label: string;
  errorMessage?: string;
  description?: string;
  className?: string;
}

export type InputFieldProps = FieldBaseProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'value' | 'defaultValue'> & {
    value?: string;
    defaultValue?: string;
  };

export type TextAreaFieldProps = FieldBaseProps &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'defaultValue'> & {
    value?: string;
    defaultValue?: string;
  };

export interface SelectFieldOption {
  value: string;
  label: string;
}

export interface SelectFieldProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'value' | 'defaultValue' | 'onChange' | 'size'>,
    FieldBaseProps {
  value?: string;
  defaultValue?: string;
  onChange?: SelectHTMLAttributes<HTMLSelectElement>['onChange'];
  options: readonly SelectFieldOption[];
}
