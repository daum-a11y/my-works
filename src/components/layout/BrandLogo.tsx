import { useThemePreference } from '../../hooks/useThemePreference';

interface BrandLogoProps {
  alt?: string;
  className?: string;
  width?: number;
  height?: number;
}

export function BrandLogo({
  alt = 'My Works',
  className = '',
  width = 100,
  height = 30,
}: BrandLogoProps) {
  const { resolvedTheme } = useThemePreference();
  const src = '/img/my-works-logo-200x60.png';

  const style =
    resolvedTheme === 'dark'
      ? { filter: 'invert(1)', mixBlendMode: 'screen' as const }
      : { mixBlendMode: 'multiply' as const };

  return (
    <img className={className} src={src} alt={alt} width={width} height={height} style={style} />
  );
}
