import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemePreferenceProvider } from '../app/ThemePreferenceContext';
import { LoginPage } from '../features/auth/LoginPage';

const mockUseAuth = vi.hoisted(() => vi.fn());

vi.mock('../features/auth/AuthContext', () => ({
  useAuth: mockUseAuth,
}));

vi.mock('../lib/env', () => ({
  isSupabaseConfigured: true,
}));

describe('LoginPage', () => {
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

  it('renders only login and password reset actions', () => {
    render(
      <ThemePreferenceProvider>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </ThemePreferenceProvider>,
    );

    expect(screen.getByRole('img', { name: 'My Works' })).toBeInTheDocument();
    expect(screen.getByLabelText('이메일')).toBeInTheDocument();
    expect(screen.getByLabelText('비밀번호')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '비밀번호 찾기' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '회원가입' })).not.toBeInTheDocument();
  });

  it('moves to the dedicated forgot password page', async () => {
    const user = userEvent.setup();

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
      <ThemePreferenceProvider>
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<div>forgot-password-page</div>} />
          </Routes>
        </MemoryRouter>
      </ThemePreferenceProvider>,
    );

    await user.click(screen.getByRole('button', { name: '비밀번호 찾기' }));
    expect(await screen.findByText('forgot-password-page')).toBeInTheDocument();
  });
});
