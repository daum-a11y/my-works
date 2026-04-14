import { Button as AriaButton } from 'react-aria-components';
import clsx from 'clsx';
import { BUTTON_DEFAULTS } from './Button.constants';
import type { ButtonProps } from './Button.types';

export function Button({
  children,
  className,
  tone = BUTTON_DEFAULTS.tone,
  ...props
}: ButtonProps) {
  return (
    <AriaButton {...props} className={clsx('ui-button', `ui-button--${tone}`, className)}>
      {children}
    </AriaButton>
  );
}
