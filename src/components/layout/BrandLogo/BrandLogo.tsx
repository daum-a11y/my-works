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
  src: '/img/my-works-logo-200x60.png',
} as const;

export function BrandLogo({
  alt = BRAND_LOGO_DEFAULTS.alt,
  className = '',
  width = BRAND_LOGO_DEFAULTS.width,
  height = BRAND_LOGO_DEFAULTS.height,
}: BrandLogoProps) {
  const { resolvedTheme } = useThemePreference();
  const src = BRAND_LOGO_DEFAULTS.src;

  const style =
    resolvedTheme === 'dark'
      ? { filter: 'invert(1)', mixBlendMode: 'screen' as const }
      : { mixBlendMode: 'multiply' as const };

  return (
    <img className={className} src={src} alt={alt} width={width} height={height} style={style} />
  );
}
