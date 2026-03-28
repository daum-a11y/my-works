import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AppShell } from '../app/AppShell';

const mockUseAuth = vi.hoisted(() => vi.fn());

vi.mock('../features/auth/AuthContext', () => ({
  useAuth: mockUseAuth,
}));

describe('AppShell', () => {
  it('opens the user menu and keeps profile and logout actions inside it', async () => {
    const user = userEvent.setup();
    const logout = vi.fn().mockResolvedValue(undefined);

    mockUseAuth.mockReturnValue({
      session: {
        member: {
          name: '홍길동',
          legacyUserId: 'hong.gd',
          role: 'admin',
        },
      },
      logout,
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/" element={<AppShell />}>
            <Route path="dashboard" element={<div>dashboard-page</div>} />
            <Route path="profile" element={<div>profile-page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.queryByRole('menu', { name: '사용자 메뉴' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '홍길동 메뉴' }));

    expect(screen.getByRole('menu', { name: '사용자 메뉴' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: '프로필' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: '로그아웃' })).toBeInTheDocument();

    await user.click(screen.getByRole('menuitem', { name: '로그아웃' }));

    await waitFor(() => {
      expect(logout).toHaveBeenCalledTimes(1);
    });
  });
});
