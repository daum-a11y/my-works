import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PendingApprovalPage } from '../pages/auth/PendingApprovalPage';

const mockUseAuth = vi.hoisted(() => vi.fn());
const mockLogout = vi.hoisted(() => vi.fn());

vi.mock('../auth/AuthContext', () => ({
  useAuth: mockUseAuth,
}));

describe('PendingApprovalPage', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    mockLogout.mockReset();
    mockUseAuth.mockReset();
    mockUseAuth.mockReturnValue({
      session: {
        member: {
          accountId: 'gio.test',
          name: '테스트',
        },
      },
      logout: mockLogout,
    });
  });

  it('keeps the original Korean approval copy without the English label', () => {
    render(
      <MemoryRouter>
        <PendingApprovalPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: '승인 대기 중입니다' })).toBeInTheDocument();
    expect(
      screen.getByText('계정은 확인되었지만 아직 앱 접근 승인이 완료되지 않았습니다.', {
        exact: false,
      }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Access Pending')).not.toBeInTheDocument();
    expect(screen.queryByText('승인 대기')).not.toBeInTheDocument();
  });

  it('logs out and returns to login', async () => {
    const user = userEvent.setup();
    mockLogout.mockResolvedValue(undefined);

    render(
      <MemoryRouter initialEntries={['/pending']}>
        <Routes>
          <Route path="/pending" element={<PendingApprovalPage />} />
          <Route path="/login" element={<div>login-page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: '로그아웃' }));

    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('login-page')).toBeInTheDocument();
  });
});
