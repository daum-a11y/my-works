import { useThemePreference } from '../../../hooks/useThemePreference';

export interface BrandLogoProps {
  alt?: string;
  className?: string;
  width?: number;
  height?: number;
}

const BRAND_LOGO_DEFAULTS = {
  alt: 'My Works',
  width: 100,
  height: 30,
} as const;

const BRAND_LOGO_SOURCES = {
  light: '/img/my-works-logo-on-light.svg',
  dark: '/img/my-works-logo-on-dark.svg',
} as const;

export function BrandLogo({
  alt = BRAND_LOGO_DEFAULTS.alt,
  className = '',
  width = BRAND_LOGO_DEFAULTS.width,
  height = BRAND_LOGO_DEFAULTS.height,
}: BrandLogoProps) {
  const { resolvedTheme } = useThemePreference();

  return (
    <img
      className={className}
      src={BRAND_LOGO_SOURCES[resolvedTheme]}
      alt={alt}
      width={width}
      height={height}
    />
  );
}
