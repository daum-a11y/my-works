import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AdminSectionTabs } from './AdminSectionTabs';

describe('AdminSectionTabs', () => {
  it('marks the active tab with aria-current', () => {
    render(
      <MemoryRouter>
        <AdminSectionTabs active="platforms" />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: '플랫폼' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: '요약' })).not.toHaveAttribute('aria-current');
  });
});
