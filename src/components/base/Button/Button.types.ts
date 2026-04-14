import type { MouseEvent, ReactNode } from 'react';
import type { ButtonProps as KrdsButtonProps } from 'krds-react';
import type { BUTTON_TONES } from './Button.constants';

export type ButtonTone = (typeof BUTTON_TONES)[number];

export interface ButtonProps extends Omit<KrdsButtonProps, 'variant'> {
  tone?: ButtonTone;
  children?: ReactNode;
  isDisabled?: boolean;
  onPress?: (event: MouseEvent<HTMLElement>) => void;
}
