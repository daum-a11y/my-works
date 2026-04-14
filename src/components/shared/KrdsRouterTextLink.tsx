import { Link as KrdsLink } from 'krds-react';
import { useHref, useLinkClickHandler, type LinkProps as RouterLinkProps } from 'react-router-dom';

interface KrdsRouterTextLinkProps extends RouterLinkProps {
  size?: 'xsmall' | 'small' | 'medium' | 'large' | 'xlarge';
}

export function KrdsRouterTextLink({
  size = 'medium',
  to,
  replace,
  state,
  target,
  preventScrollReset,
  relative,
  viewTransition,
  reloadDocument,
  onClick,
  discover: _discover,
  prefetch: _prefetch,
  ...props
}: KrdsRouterTextLinkProps) {
  const href = useHref(to, { relative });
  const handleLinkClick = useLinkClickHandler<HTMLAnchorElement>(to, {
    replace,
    state,
    target,
    preventScrollReset,
    relative,
    viewTransition,
  });

  return (
    <KrdsLink
      href={href}
      size={size}
      target={target}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented && !reloadDocument) {
          handleLinkClick(event);
        }
      }}
      {...props}
    />
  );
}
