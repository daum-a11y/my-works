import { Button as KrdsButton } from 'krds-react';
import { BUTTON_DEFAULTS } from './Button.constants';
import type { ButtonProps } from './Button.types';

function toButtonVariant(tone: NonNullable<ButtonProps['tone']>) {
  switch (tone) {
    case 'secondary':
      return 'secondary';
    case 'ghost':
      return 'tertiary';
    case 'danger':
      return 'secondary';
    case 'primary':
    default:
      return 'primary';
  }
}

export function Button({
  children,
  tone = BUTTON_DEFAULTS.tone,
  isDisabled,
  onPress,
  onClick,
  ...props
}: ButtonProps) {
  return (
    <KrdsButton
      {...props}
      variant={toButtonVariant(tone)}
      disabled={isDisabled ?? props.disabled}
      onClick={(event) => {
        onClick?.(event);
        onPress?.(event);
      }}
    >
      {children}
    </KrdsButton>
  );
}
