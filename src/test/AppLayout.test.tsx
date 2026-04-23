import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppLayout } from '../layouts/AppLayout';
import { ThemePreferenceProvider } from '../preferences/ThemePreferenceContext';

const mockUseAuth = vi.hoisted(() => vi.fn());

vi.mock('../auth/AuthContext', () => ({
  useAuth: mockUseAuth,
}));

afterEach(() => {
  cleanup();
});

describe('AppLayout', () => {
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
              <Route path="/" element={<AppLayout />}>
                <Route path="dashboard" element={<div>dashboard screen</div>} />
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
              <Route path="/" element={<AppLayout />}>
                <Route path="dashboard" element={<div>dashboard screen</div>} />
                <Route path="profile" element={<div>profile-page</div>} />
                <Route path="settings" element={<div>settings-page</div>} />
              </Route>
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      </ThemePreferenceProvider>,
    );

    expect(screen.queryByRole('menu', { name: '사용자 메뉴' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '사용자 메뉴' }));

    expect(screen.getByText('프로필')).toBeInTheDocument();
    expect(screen.getByText('환경 설정')).toBeInTheDocument();
    expect(screen.getByText('로그아웃')).toBeInTheDocument();

    await user.click(screen.getByText('로그아웃'));

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
          <MemoryRouter initialEntries={['/stats/projects']}>
            <Routes>
              <Route path="/" element={<AppLayout />}>
                <Route path="stats/projects" element={<div>project-stats-page</div>} />
              </Route>
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      </ThemePreferenceProvider>,
    );

    expect(screen.getAllByText('프로젝트 통계').length).toBeGreaterThan(0);
  });

  it('renders header, sidebar, breadcrumb, main content, and footer in the authenticated layout', () => {
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
              <Route path="/" element={<AppLayout />}>
                <Route path="dashboard" element={<div>dashboard screen</div>} />
              </Route>
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      </ThemePreferenceProvider>,
    );

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByLabelText('사이드 메뉴')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: '브래드크럼' })).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
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
          <MemoryRouter initialEntries={['/stats/projects']}>
            <Routes>
              <Route path="/" element={<AppLayout />}>
                <Route path="stats/projects" element={<div>project-stats-page</div>} />
                <Route path="dashboard" element={<div>dashboard screen</div>} />
              </Route>
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      </ThemePreferenceProvider>,
    );

    const breadcrumbNav = screen.getAllByRole('navigation', { name: '브래드크럼' })[0];
    const homeLink = within(breadcrumbNav).getByRole('link', { name: '홈' });
    await user.click(homeLink);

    await waitFor(() => {
      expect(screen.getByText('dashboard screen')).toBeInTheDocument();
    });
  });
});
