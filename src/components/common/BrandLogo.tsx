import { useThemePreference } from '../../app/useThemePreference';

interface BrandLogoProps {
  alt?: string;
  className?: string;
  width?: number;
  height?: number;
}

export function BrandLogo({
  alt = 'My Works',
  className,
  width = 100,
  height = 30,
}: BrandLogoProps) {
  const { resolvedTheme } = useThemePreference();
  const src =
    resolvedTheme === 'dark' ? '/img/my-works-logo-light.svg' : '/img/my-works-logo-dark.svg';

  return <img className={className} src={src} alt={alt} width={width} height={height} />;
}
