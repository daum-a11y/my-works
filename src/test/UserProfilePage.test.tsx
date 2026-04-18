import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FontPreferenceProvider } from '../preferences/FontPreferenceContext';
import { ThemePreferenceProvider } from '../preferences/ThemePreferenceContext';
import { LoginPage } from '../pages/auth/LoginPage';
import { UserProfilePage } from '../pages/profile/UserProfilePage';

const mockUseAuth = vi.hoisted(() => vi.fn());

vi.mock('../auth/AuthContext', () => ({
  useAuth: mockUseAuth,
}));

vi.mock('../config/env', () => ({
  isSupabaseConfigured: true,
}));

describe('UserProfilePage', () => {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
    delete document.documentElement.dataset.fontPreference;
    delete document.documentElement.dataset.themePreference;
    delete document.documentElement.dataset.themeResolved;
  });

  beforeEach(() => {
    mockUseAuth.mockReset();
  });

  const getNextPasswordInput = () =>
    screen.getByLabelText('새 비밀번호', { selector: 'input' }) as HTMLInputElement;
  const getConfirmPasswordInput = () =>
    screen.getByLabelText('새 비밀번호 확인', { selector: 'input' }) as HTMLInputElement;

  function renderProfilePage() {
    return render(
      <ThemePreferenceProvider>
        <FontPreferenceProvider>
          <MemoryRouter initialEntries={['/profile']}>
            <Routes>
              <Route path="/profile" element={<UserProfilePage />} />
              <Route path="/login" element={<LoginPage />} />
            </Routes>
          </MemoryRouter>
        </FontPreferenceProvider>
      </ThemePreferenceProvider>,
    );
  }

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

    renderProfilePage();

    expect(screen.getByRole('heading', { level: 1, name: '프로필' })).toBeInTheDocument();
    expect(screen.getByText('daum.a11y@gmail.com')).toBeInTheDocument();
    expect(screen.getByText('관리자')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Pretendard/ })).toBeChecked();
    expect(screen.getByRole('radio', { name: /시스템설정/ })).toBeChecked();

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

    renderProfilePage();

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

    renderProfilePage();

    await user.click(screen.getByRole('button', { name: '비밀번호 변경' }));
    fireEvent.change(getNextPasswordInput(), { target: { value: 'new-password-123' } });
    fireEvent.change(getConfirmPasswordInput(), { target: { value: 'new-password-123' } });
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
      await screen.findByText('비밀번호 변경 완료. 비밀번호가 변경되었습니다. 로그인해 주세요.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('비밀번호')).toHaveFocus();
  });

  it('stores the selected font in localStorage and applies it app-wide', async () => {
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

    renderProfilePage();

    await waitFor(() => {
      expect(document.documentElement.dataset.fontPreference).toBe('pretendard');
    });

    await user.click(screen.getByRole('radio', { name: /KoddiUD OnGothic/ }));

    expect(document.documentElement.dataset.fontPreference).toBe('ongothic');
    expect(window.localStorage.getItem('my-works:font-preference')).toBe('ongothic');

    cleanup();

    renderProfilePage();

    expect(screen.getByRole('radio', { name: /KoddiUD OnGothic/ })).toBeChecked();
    expect(document.documentElement.dataset.fontPreference).toBe('ongothic');
  });

  it('stores the selected theme in localStorage and applies the resolved theme', async () => {
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

    renderProfilePage();

    await waitFor(() => {
      expect(document.documentElement.dataset.themePreference).toBe('system');
    });

    await user.click(screen.getByRole('radio', { name: /다크모드/ }));

    expect(document.documentElement.dataset.themePreference).toBe('dark');
    expect(document.documentElement.dataset.themeResolved).toBe('dark');
    expect(window.localStorage.getItem('my-works:theme-preference')).toBe('dark');

    cleanup();

    renderProfilePage();

    expect(screen.getByRole('radio', { name: /다크모드/ })).toBeChecked();
    expect(document.documentElement.dataset.themePreference).toBe('dark');
    expect(document.documentElement.dataset.themeResolved).toBe('dark');
  });
});
