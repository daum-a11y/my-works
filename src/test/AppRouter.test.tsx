import type { ReactNode } from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RootRouter } from '../router/RootRouter';

const mockUseAuth = vi.hoisted(() => vi.fn());

vi.mock('../auth/AuthContext', () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useAuth: mockUseAuth,
}));

vi.mock('../pages/auth/LoginPage', () => ({
  LoginPage: () => <div>login-page</div>,
}));

vi.mock('../pages/auth/ForgotPasswordPage', () => ({
  ForgotPasswordPage: () => <div>forgot-password-page</div>,
}));

vi.mock('../pages/auth/PasswordRecoveryPage', () => ({
  PasswordRecoveryPage: () => <div>password-recovery-page</div>,
}));

vi.mock('../pages/dashboard', () => ({
  DashboardPage: () => <div>dashboard-page</div>,
}));

vi.mock('../pages/health', () => ({
  HealthCheckPage: () => <div>health-check-page</div>,
}));

vi.mock('../pages/admin/groups/AdminServiceGroupsPage', () => ({
  AdminServiceGroupsPage: () => <div>admin-groups-page</div>,
}));

vi.mock('../pages/admin/groups/AdminServiceGroupEditorPage', () => ({
  AdminServiceGroupEditorPage: () => <div>admin-group-editor-page</div>,
}));

vi.mock('../pages/admin/members/AdminMembersPage', () => ({
  AdminMembersPage: () => <div>admin-members-page</div>,
}));

vi.mock('../pages/admin/reports/AdminReportEditorPage', () => ({
  AdminReportEditorPage: () => <div>admin-report-editor-page</div>,
}));

vi.mock('../pages/admin/reports/AdminReportsPage', () => ({
  AdminReportsPage: () => <div>admin-reports-page</div>,
}));

vi.mock('../pages/admin/types/AdminTaskTypesPage', () => ({
  AdminTaskTypesPage: () => <div>admin-task-types-page</div>,
}));

vi.mock('../pages/admin/types/AdminTaskTypeEditorPage', () => ({
  AdminTaskTypeEditorPage: () => <div>admin-task-type-editor-page</div>,
}));

vi.mock('../pages/notFound', () => ({
  NotFoundPage: () => <div>not-found-page</div>,
}));

vi.mock('../pages/projects', () => ({
  ProjectsPage: () => <div>projects-page</div>,
  ProjectEditorPage: () => <div>project-editor-page</div>,
}));

vi.mock('../pages/reports', () => ({
  ReportsPage: () => <div>reports-page</div>,
}));

vi.mock('../pages/resource', () => ({
  ResourceLayout: () => <div>resource-layout</div>,
  ResourceMonthPage: () => <div>resource-month-page</div>,
  ResourceServicePage: () => <div>resource-service-page</div>,
  ResourceSummaryPage: () => <div>resource-summary-page</div>,
  ResourceTypePage: () => <div>resource-type-page</div>,
}));

vi.mock('../pages/search', () => ({
  SearchPage: () => <div>search-page</div>,
}));

vi.mock('../pages/stats', () => ({
  ProjectStatsPage: () => <div>project-stats-page</div>,
  TaskMonitoringPage: () => <div>task-monitoring-page</div>,
}));

vi.mock('../pages/profile', () => ({
  UserProfilePage: () => <div>profile-page</div>,
}));

vi.mock('../layouts/AuthenticatedLayout', async () => {
  const { Outlet } = await import('react-router-dom');

  return {
    AuthenticatedLayout: () => (
      <div>
        <div>authenticated-layout</div>
        <Outlet />
      </div>
    ),
  };
});

describe('RootRouter', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    window.history.replaceState({}, '', '/');
    mockUseAuth.mockReset();
    mockUseAuth.mockReturnValue({
      status: 'guest',
      authFlow: 'default',
      isRecoverySession: false,
      session: null,
    });
  });

  it('allows the recovery route without authentication', async () => {
    window.history.replaceState({}, '', '/auth/recovery');

    render(<RootRouter />);

    await waitFor(() => {
      expect(screen.getByText('password-recovery-page')).toBeInTheDocument();
    });
  });

  it('allows the forgot password route without authentication', async () => {
    window.history.replaceState({}, '', '/forgot-password');

    render(<RootRouter />);

    await waitFor(() => {
      expect(screen.getByText('forgot-password-page')).toBeInTheDocument();
    });
  });

  it('allows the health check route without authentication', async () => {
    window.history.replaceState({}, '', '/healthz');

    render(<RootRouter />);

    await waitFor(() => {
      expect(screen.getByText('health-check-page')).toBeInTheDocument();
    });
  });

  it('redirects protected routes to login for guests', async () => {
    window.history.replaceState({}, '', '/dashboard');

    render(<RootRouter />);

    await waitFor(() => {
      expect(screen.getByText('login-page')).toBeInTheDocument();
    });
  });

  it('redirects non-admin members away from organization summary', async () => {
    window.history.replaceState({}, '', '/org/summary');
    mockUseAuth.mockReturnValue({
      status: 'authenticated',
      authFlow: 'default',
      isRecoverySession: false,
      session: {
        member: {
          id: 'member-1',
          accountId: 'user01',
          name: '사용자',
          role: 'user',
          isActive: true,
          status: 'active',
        },
      },
    });

    render(<RootRouter />);

    await waitFor(() => {
      expect(screen.getByText('dashboard-page')).toBeInTheDocument();
    });
    expect(screen.queryByText('resource-summary-page')).not.toBeInTheDocument();
  });

  it('allows authenticated members to open task monitoring', async () => {
    window.history.replaceState({}, '', '/stats/monitoring');
    mockUseAuth.mockReturnValue({
      status: 'authenticated',
      authFlow: 'default',
      isRecoverySession: false,
      session: {
        member: {
          id: 'member-1',
          accountId: 'user01',
          name: '사용자',
          role: 'user',
          isActive: true,
          status: 'active',
        },
      },
    });

    render(<RootRouter />);

    await waitFor(() => {
      expect(screen.getByText('task-monitoring-page')).toBeInTheDocument();
    });
  });

  it('allows admins to open organization summary', async () => {
    window.history.replaceState({}, '', '/org/summary');
    mockUseAuth.mockReturnValue({
      status: 'authenticated',
      authFlow: 'default',
      isRecoverySession: false,
      session: {
        member: {
          id: 'member-1',
          accountId: 'admin01',
          name: '관리자',
          role: 'admin',
          isActive: true,
          status: 'active',
        },
      },
    });

    render(<RootRouter />);

    await waitFor(() => {
      expect(screen.getByText('resource-summary-page')).toBeInTheDocument();
    });
  });

  it('renders the standalone not found page for unknown guest routes', async () => {
    window.history.replaceState({}, '', '/missing-route');

    render(<RootRouter />);

    await waitFor(() => {
      expect(screen.getByText('not-found-page')).toBeInTheDocument();
    });
  });

  it('renders the standalone not found page for unknown authenticated routes', async () => {
    window.history.replaceState({}, '', '/still-missing');
    mockUseAuth.mockReturnValue({
      status: 'authenticated',
      authFlow: 'default',
      isRecoverySession: false,
      session: {
        member: {
          id: 'member-1',
          accountId: 'user01',
          name: '사용자',
          role: 'member',
          isActive: true,
        },
      },
    });

    render(<RootRouter />);

    await waitFor(() => {
      expect(screen.getByText('not-found-page')).toBeInTheDocument();
    });
  });

  it('renders the project stats page on the new stats route', async () => {
    window.history.replaceState({}, '', '/stats/projects');
    mockUseAuth.mockReturnValue({
      status: 'authenticated',
      authFlow: 'default',
      isRecoverySession: false,
      session: {
        member: {
          id: 'member-1',
          accountId: 'user01',
          name: '사용자',
          role: 'member',
          isActive: true,
        },
      },
    });

    render(<RootRouter />);

    await waitFor(() => {
      expect(screen.getByText('project-stats-page')).toBeInTheDocument();
    });
  });

  it('renders the monitoring stats route directly', async () => {
    window.history.replaceState({}, '', '/stats/monitoring');
    mockUseAuth.mockReturnValue({
      status: 'authenticated',
      authFlow: 'default',
      isRecoverySession: false,
      session: {
        member: {
          id: 'member-1',
          accountId: 'user01',
          name: '사용자',
          role: 'member',
          isActive: true,
        },
      },
    });

    render(<RootRouter />);

    await waitFor(() => {
      expect(screen.getByText('task-monitoring-page')).toBeInTheDocument();
    });
    expect(window.location.pathname).toBe('/stats/monitoring');
  });
});
