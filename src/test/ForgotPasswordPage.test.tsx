import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemePreferenceProvider } from '../preferences/ThemePreferenceContext';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';

const mockUseAuth = vi.hoisted(() => vi.fn());

vi.mock('../pages/auth/AuthContext', () => ({
  useAuth: mockUseAuth,
}));

vi.mock('../config/env', () => ({
  isSupabaseConfigured: true,
}));

describe('ForgotPasswordPage', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    mockUseAuth.mockReset();
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
  });

  it('sends a password reset email from the dedicated page', async () => {
    const user = userEvent.setup();
    const resetPassword = vi.fn().mockResolvedValue(undefined);

    mockUseAuth.mockReturnValue({
      status: 'guest',
      authFlow: 'default',
      isRecoverySession: false,
      session: null,
      login: vi.fn(),
      resetPassword,
      logout: vi.fn(),
      updatePassword: vi.fn(),
    });

    render(
      <ThemePreferenceProvider>
        <MemoryRouter initialEntries={['/forgot-password']}>
          <Routes>
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          </Routes>
        </MemoryRouter>
      </ThemePreferenceProvider>,
    );

    await user.type(screen.getByRole('textbox', { name: '이메일' }), 'crew@example.com');
    await user.click(screen.getByRole('button', { name: '재설정 메일 보내기' }));

    await waitFor(() => {
      expect(resetPassword).toHaveBeenCalledWith('crew@example.com');
    });

    expect(screen.getByText('메일을 확인해 비밀번호를 재설정해 주세요.')).toBeInTheDocument();
  });
});
