import { Button as AriaButton, type ButtonProps as AriaButtonProps } from 'react-aria-components';
import clsx from 'clsx';
import '../../styles/domain/components/Button.scss';

interface ButtonProps extends AriaButtonProps {
  tone?: 'primary' | 'secondary' | 'ghost' | 'danger';
}

export function Button({ children, className, tone = 'primary', ...props }: ButtonProps) {
  return (
    <AriaButton {...props} className={clsx('ui-button', `ui-button--${tone}`, className)}>
      {children}
    </AriaButton>
  );
}
