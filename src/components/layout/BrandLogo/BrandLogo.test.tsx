import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BrandLogo } from './BrandLogo';

const mockUseThemePreference = vi.hoisted(() => vi.fn());

vi.mock('../../../hooks/useThemePreference', () => ({
  useThemePreference: mockUseThemePreference,
}));

describe('BrandLogo', () => {
  beforeEach(() => {
    mockUseThemePreference.mockReset();
  });

  it('renders the default logo metadata', () => {
    mockUseThemePreference.mockReturnValue({ resolvedTheme: 'light' });

    render(<BrandLogo />);

    const image = screen.getByRole('img', { name: 'My Works' });
    expect(image).toHaveAttribute('src', '/img/my-works-logo-200x60.png');
    expect(image).toHaveAttribute('width', '100');
    expect(image).toHaveStyle({ mixBlendMode: 'multiply' });
  });

  it('switches blend styling for dark theme', () => {
    mockUseThemePreference.mockReturnValue({ resolvedTheme: 'dark' });

    render(<BrandLogo alt="서비스 로고" />);

    expect(screen.getByRole('img', { name: '서비스 로고' })).toHaveStyle({
      filter: 'invert(1)',
      mixBlendMode: 'screen',
    });
  });
});
