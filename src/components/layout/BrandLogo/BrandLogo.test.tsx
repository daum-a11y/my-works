import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BrandLogo } from './BrandLogo';

describe('BrandLogo', () => {
  it('renders the default logo metadata', () => {
    render(<BrandLogo />);

    const image = screen.getByRole('img', { name: 'My Works' });
    expect(image).toHaveAttribute('src', '/img/my-works-logo-200x60.png');
    expect(image).toHaveAttribute('width', '100');
  });

  it('renders a custom alt label', () => {
    render(<BrandLogo alt="서비스 로고" />);

    expect(screen.getByRole('img', { name: '서비스 로고' })).toBeInTheDocument();
  });
});
