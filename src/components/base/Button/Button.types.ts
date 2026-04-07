import type { ButtonProps as AriaButtonProps } from 'react-aria-components';
import type { BUTTON_TONES } from './Button.constants';

export type ButtonTone = (typeof BUTTON_TONES)[number];

export interface ButtonProps extends AriaButtonProps {
  tone?: ButtonTone;
}
