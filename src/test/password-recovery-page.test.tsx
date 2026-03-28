import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PasswordRecoveryPage } from '../features/auth/PasswordRecoveryPage';
import { LoginPage } from '../features/auth/LoginPage';

const mockUseAuth = vi.hoisted(() => vi.fn());

vi.mock('../features/auth/AuthContext', () => ({
  useAuth: mockUseAuth,
}));

vi.mock('../lib/env', () => ({
  isSupabaseConfigured: true,
}));

describe('PasswordRecoveryPage', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  beforeEach(() => {
    mockUseAuth.mockReset();
  });

  it('blocks access when the current session is not a recovery session', () => {
    mockUseAuth.mockReturnValue({
      status: 'guest',
      authFlow: 'default',
      isRecoverySession: false,
      session: null,
      login: vi.fn(),
      resetPassword: vi.fn(),
      logout: vi.fn(),
      updatePassword: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/auth/recovery']}>
        <Routes>
          <Route path="/auth/recovery" element={<PasswordRecoveryPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: '유효하지 않은 재설정 링크' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '로그인으로 이동' })).toBeInTheDocument();
  });

  it('updates the password during a recovery session and returns to login', async () => {
    const user = userEvent.setup();
    const updatePassword = vi.fn().mockResolvedValue(undefined);
    const logout = vi.fn().mockResolvedValue(undefined);

    mockUseAuth.mockReturnValue({
      status: 'guest',
      authFlow: 'recovery',
      isRecoverySession: true,
      session: null,
      login: vi.fn(),
      resetPassword: vi.fn(),
      logout,
      updatePassword,
    });

    render(
      <MemoryRouter initialEntries={['/auth/recovery']}>
        <Routes>
          <Route path="/auth/recovery" element={<PasswordRecoveryPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText('새 비밀번호'), 'new-password-123');
    await user.type(screen.getByLabelText('새 비밀번호 확인'), 'new-password-123');
    await user.click(screen.getByRole('button', { name: '비밀번호 변경' }));

    await waitFor(() => {
      expect(updatePassword).toHaveBeenCalledWith('new-password-123');
    });

    await waitFor(() => {
      expect(logout).toHaveBeenCalled();
    });
    expect(
      await screen.findByText('비밀번호가 변경되었습니다. 다시 로그인해 주세요.'),
    ).toBeInTheDocument();
  });
});
