import { Button, type ButtonProps } from 'krds-react';
import { Link, type LinkProps } from 'react-router-dom';

interface KrdsRouterButtonLinkProps extends LinkProps {
  variant?: ButtonProps<typeof Link>['variant'];
  size?: ButtonProps<typeof Link>['size'];
}

export function KrdsRouterButtonLink({
  variant = 'secondary',
  size = 'medium',
  ...props
}: KrdsRouterButtonLinkProps) {
  return <Button as={Link} role="link" variant={variant} size={size} {...props} />;
}
