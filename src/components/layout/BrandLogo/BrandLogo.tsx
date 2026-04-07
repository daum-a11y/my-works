import { useThemePreference } from '../../../hooks/useThemePreference';
import { BRAND_LOGO_DEFAULTS } from './BrandLogo.constants';
import type { BrandLogoProps } from './BrandLogo.types';

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
