import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { GlobalLoadingSpinner } from './GlobalLoadingSpinner';

describe('GlobalLoadingSpinner', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders as a status region', () => {
    render(<GlobalLoadingSpinner />);

    expect(screen.getByRole('status', { name: '로딩 중' })).toHaveClass('global-loading-spinner');
  });

  it('adds the overlay modifier when requested', () => {
    render(<GlobalLoadingSpinner overlay />);

    expect(screen.getByRole('status', { name: '로딩 중' })).toHaveClass(
      'global-loading-spinner--overlay',
    );
  });
});
