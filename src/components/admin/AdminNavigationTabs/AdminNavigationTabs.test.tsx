import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AdminNavigationTabs } from './AdminNavigationTabs';

describe('AdminNavigationTabs', () => {
  it('marks the active tab as selected', () => {
    render(
      <MemoryRouter>
        <AdminNavigationTabs active="platforms" />
      </MemoryRouter>,
    );

    expect(screen.getByRole('tab', { name: /플랫폼/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: '요약' })).toHaveAttribute('aria-selected', 'false');
  });
});
