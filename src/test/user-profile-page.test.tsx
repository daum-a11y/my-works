import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginPage } from '../features/auth/LoginPage';
import { UserProfilePage } from '../features/settings/UserProfilePage';

const mockUseAuth = vi.hoisted(() => vi.fn());

vi.mock('../features/auth/AuthContext', () => ({
  useAuth: mockUseAuth,
}));

vi.mock('../lib/env', () => ({
  isSupabaseConfigured: true,
}));

describe('UserProfilePage', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    mockUseAuth.mockReset();
  });

  const getNextPasswordInput = () =>
    screen.getByLabelText('새 비밀번호', { selector: 'input' }) as HTMLInputElement;
  const getConfirmPasswordInput = () =>
    screen.getByLabelText('새 비밀번호 확인', { selector: 'input' }) as HTMLInputElement;

  it('renders profile data in the same work-panel structure and opens the password form', async () => {
    const user = userEvent.setup();

    mockUseAuth.mockReturnValue({
      status: 'authenticated',
      authFlow: 'default',
      isRecoverySession: false,
      session: {
        member: {
          id: 'member-1',
          accountId: 'daum.a11y',
          name: '테스트',
          email: 'daum.a11y@gmail.com',
          role: 'admin',
          isActive: true,
          joinedAt: '2026-01-01',
        },
      },
      login: vi.fn(),
      resetPassword: vi.fn(),
      logout: vi.fn(),
      updatePassword: vi.fn(),
    });

    render(
      <MemoryRouter>
        <UserProfilePage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { level: 1, name: '프로필' })).toBeInTheDocument();
    expect(screen.getByText('daum.a11y@gmail.com')).toBeInTheDocument();
    expect(screen.getByText('관리자')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '비밀번호 변경' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: '비밀번호 변경' })).toBeInTheDocument();
    expect(getNextPasswordInput()).toBeInTheDocument();
    expect(getConfirmPasswordInput()).toBeInTheDocument();
  });

  it('shows stable inline validation for short and mismatched passwords', async () => {
    const user = userEvent.setup();

    mockUseAuth.mockReturnValue({
      status: 'authenticated',
      authFlow: 'default',
      isRecoverySession: false,
      session: {
        member: {
          id: 'member-1',
          accountId: 'daum.a11y',
          name: '테스트',
          email: 'daum.a11y@gmail.com',
          role: 'user',
          isActive: true,
          joinedAt: '2026-01-01',
        },
      },
      login: vi.fn(),
      resetPassword: vi.fn(),
      logout: vi.fn(),
      updatePassword: vi.fn(),
    });

    render(
      <MemoryRouter>
        <UserProfilePage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: '비밀번호 변경' }));
    await user.type(getNextPasswordInput(), '1234567');

    expect(screen.getByText('8자 이상 입력해 주세요.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '변경' })).toBeDisabled();

    await user.clear(getNextPasswordInput());
    await user.type(getNextPasswordInput(), '12345678');
    await user.type(getConfirmPasswordInput(), '12345670');

    expect(screen.getByText('비밀번호가 다릅니다.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '변경' })).toBeDisabled();
  });

  it('shows confirm and completion states, then returns to login with a notice', async () => {
    const user = userEvent.setup();
    const updatePassword = vi.fn().mockResolvedValue(undefined);
    const logout = vi.fn().mockResolvedValue(undefined);

    mockUseAuth.mockReturnValue({
      status: 'guest',
      authFlow: 'default',
      isRecoverySession: false,
      session: {
        member: {
          id: 'member-1',
          accountId: 'daum.a11y',
          name: '테스트',
          email: 'daum.a11y@gmail.com',
          role: 'admin',
          isActive: true,
          joinedAt: '2026-01-01',
        },
      },
      login: vi.fn(),
      resetPassword: vi.fn(),
      logout,
      updatePassword,
    });

    render(
      <MemoryRouter initialEntries={['/profile']}>
        <Routes>
          <Route path="/profile" element={<UserProfilePage />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: '비밀번호 변경' }));
    await user.type(getNextPasswordInput(), 'new-password-123');
    await user.type(getConfirmPasswordInput(), 'new-password-123');
    await user.click(screen.getByRole('button', { name: '변경' }));

    expect(
      screen.getByText('비밀번호를 정말 변경하시겠습니까? 되돌릴 수 없습니다.'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '변경' }));

    await waitFor(() => {
      expect(updatePassword).toHaveBeenCalledWith('new-password-123');
    });

    expect(screen.getByText('비밀번호가 변경되었습니다.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '로그인' }));

    expect(logout).toHaveBeenCalled();
    expect(
      await screen.findByText('비밀번호가 변경되었습니다. 로그인해 주세요.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('비밀번호')).toHaveFocus();
  });
});
