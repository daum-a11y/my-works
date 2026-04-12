import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthenticatedLayout } from '../layouts/AuthenticatedLayout';
import { ThemePreferenceProvider } from '../preferences/ThemePreferenceContext';

const mockUseAuth = vi.hoisted(() => vi.fn());

vi.mock('../auth/AuthContext', () => ({
  useAuth: mockUseAuth,
}));

afterEach(() => {
  cleanup();
});

describe('AuthenticatedLayout', () => {
  it('does not show organization management links to non-admin members', () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    mockUseAuth.mockReturnValue({
      session: {
        member: {
          name: '홍길동',
          accountId: 'hong.gd',
          role: 'user',
        },
      },
      logout: vi.fn(),
    });

    render(
      <ThemePreferenceProvider>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/dashboard']}>
            <Routes>
              <Route path="/" element={<AuthenticatedLayout />}>
                <Route path="dashboard" element={<div>dashboard-page</div>} />
              </Route>
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      </ThemePreferenceProvider>,
    );

    expect(screen.queryByText('조직 관리')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '업무보고 현황' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '업무보고 조회' })).not.toBeInTheDocument();
  });

  it('opens the user menu and keeps profile and logout actions inside it', async () => {
    const user = userEvent.setup();
    const logout = vi.fn().mockResolvedValue(undefined);
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    mockUseAuth.mockReturnValue({
      session: {
        member: {
          name: '홍길동',
          accountId: 'hong.gd',
          role: 'admin',
        },
      },
      logout,
    });

    render(
      <ThemePreferenceProvider>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/dashboard']}>
            <Routes>
              <Route path="/" element={<AuthenticatedLayout />}>
                <Route path="dashboard" element={<div>dashboard-page</div>} />
                <Route path="profile" element={<div>profile-page</div>} />
              </Route>
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      </ThemePreferenceProvider>,
    );

    expect(screen.queryByRole('menu', { name: '사용자 메뉴' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '사용자 메뉴' }));

    expect(screen.getByRole('menu', { name: '사용자 메뉴' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: '프로필' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: '로그아웃' })).toBeInTheDocument();

    await user.click(screen.getByRole('menuitem', { name: '로그아웃' }));

    await waitFor(() => {
      expect(logout).toHaveBeenCalledTimes(1);
    });
  });

  it('uses the same stats labels in the sidebar and breadcrumbs', () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    mockUseAuth.mockReturnValue({
      session: {
        member: {
          name: '홍길동',
          accountId: 'hong.gd',
          role: 'admin',
        },
      },
      logout: vi.fn(),
    });

    render(
      <ThemePreferenceProvider>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/stats/monitoring']}>
            <Routes>
              <Route path="/" element={<AuthenticatedLayout />}>
                <Route path="stats/monitoring" element={<div>monitoring-stats-page</div>} />
              </Route>
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      </ThemePreferenceProvider>,
    );

    expect(screen.getAllByText('모니터링 통계').length).toBeGreaterThan(0);
  });

  it('moves to dashboard when clicking breadcrumb home', async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    mockUseAuth.mockReturnValue({
      session: {
        member: {
          name: '홍길동',
          accountId: 'hong.gd',
          role: 'admin',
          reportRequired: true,
        },
      },
      logout: vi.fn(),
    });

    render(
      <ThemePreferenceProvider>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/stats/monitoring']}>
            <Routes>
              <Route path="/" element={<AuthenticatedLayout />}>
                <Route path="stats/monitoring" element={<div>monitoring-stats-page</div>} />
                <Route path="dashboard" element={<div>dashboard-page</div>} />
              </Route>
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      </ThemePreferenceProvider>,
    );

    const breadcrumbNav = screen.getAllByRole('navigation', { name: '브래드크럼' })[0];
    const homeLink = within(breadcrumbNav).getByRole('link', { name: '홈으로 가기' });
    await user.click(homeLink);

    await waitFor(() => {
      expect(screen.getByText('dashboard-page')).toBeInTheDocument();
    });
  });
});
