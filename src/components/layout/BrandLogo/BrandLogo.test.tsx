import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ThemePreferenceContext } from '../../../preferences/ThemePreferenceState';
import { BrandLogo } from './BrandLogo';

function renderBrandLogo(resolvedTheme: 'light' | 'dark' = 'light') {
  return render(
    <ThemePreferenceContext.Provider
      value={{
        themePreference: resolvedTheme,
        resolvedTheme,
        setThemePreference: () => undefined,
      }}
    >
      <BrandLogo />
    </ThemePreferenceContext.Provider>,
  );
}

describe('BrandLogo', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders the logo asset for light theme', () => {
    renderBrandLogo('light');

    const image = screen.getByRole('img', { name: 'My Works' });
    expect(image).toHaveAttribute('src', '/img/my-works-logo-on-light.svg');
    expect(image).toHaveAttribute('width', '100');
  });

  it('renders the logo asset for dark theme', () => {
    renderBrandLogo('dark');

    expect(screen.getByRole('img', { name: 'My Works' })).toHaveAttribute(
      'src',
      '/img/my-works-logo-on-dark.svg',
    );
  });

  it('renders a custom alt label', () => {
    render(
      <ThemePreferenceContext.Provider
        value={{
          themePreference: 'light',
          resolvedTheme: 'light',
          setThemePreference: () => undefined,
        }}
      >
        <BrandLogo alt="서비스 로고" />
      </ThemePreferenceContext.Provider>,
    );

    expect(screen.getByRole('img', { name: '서비스 로고' })).toBeInTheDocument();
  });
});
