import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

export interface FieldBaseProps {
  label: string;
  errorMessage?: string;
  description?: string;
  className?: string;
}

export type InputFieldProps = FieldBaseProps & InputHTMLAttributes<HTMLInputElement>;

export type TextAreaFieldProps = FieldBaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>;
