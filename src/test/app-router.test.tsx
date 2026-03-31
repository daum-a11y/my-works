import type { ReactNode } from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppRouter } from '../app/AppRouter';

const mockUseAuth = vi.hoisted(() => vi.fn());

vi.mock('../features/auth/AuthContext', () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useAuth: mockUseAuth,
}));

vi.mock('../features/auth/LoginPage', () => ({
  LoginPage: () => <div>login-page</div>,
}));

vi.mock('../features/auth/ForgotPasswordPage', () => ({
  ForgotPasswordPage: () => <div>forgot-password-page</div>,
}));

vi.mock('../features/auth/PasswordRecoveryPage', () => ({
  PasswordRecoveryPage: () => <div>password-recovery-page</div>,
}));

vi.mock('../features/dashboard', () => ({
  DashboardPage: () => <div>dashboard-page</div>,
}));

vi.mock('../features/health', () => ({
  HealthCheckPage: () => <div>health-check-page</div>,
}));

vi.mock('../features/admin/groups/AdminServiceGroupsPage', () => ({
  AdminServiceGroupsPage: () => <div>admin-groups-page</div>,
}));

vi.mock('../features/admin/groups/AdminServiceGroupEditorPage', () => ({
  AdminServiceGroupEditorPage: () => <div>admin-group-editor-page</div>,
}));

vi.mock('../features/admin/members/AdminMembersPage', () => ({
  AdminMembersPage: () => <div>admin-members-page</div>,
}));

vi.mock('../features/admin/reports/AdminReportEditorPage', () => ({
  AdminReportEditorPage: () => <div>admin-report-editor-page</div>,
}));

vi.mock('../features/admin/reports/AdminReportsPage', () => ({
  AdminReportsPage: () => <div>admin-reports-page</div>,
}));

vi.mock('../features/admin/types/AdminTaskTypesPage', () => ({
  AdminTaskTypesPage: () => <div>admin-task-types-page</div>,
}));

vi.mock('../features/admin/types/AdminTaskTypeEditorPage', () => ({
  AdminTaskTypeEditorPage: () => <div>admin-task-type-editor-page</div>,
}));

vi.mock('../features/not-found', () => ({
  NotFoundPage: () => <div>not-found-page</div>,
}));

vi.mock('../features/projects', () => ({
  ProjectsFeature: () => <div>projects-page</div>,
  ProjectEditorPage: () => <div>project-editor-page</div>,
}));

vi.mock('../features/reports', () => ({
  ReportsPage: () => <div>reports-page</div>,
}));

vi.mock('../features/resource', () => ({
  ResourceLayout: () => <div>resource-layout</div>,
  ResourceMonthPage: () => <div>resource-month-page</div>,
  ResourceServicePage: () => <div>resource-service-page</div>,
  ResourceSummaryPage: () => <div>resource-summary-page</div>,
  ResourceTypePage: () => <div>resource-type-page</div>,
}));

vi.mock('../features/search', () => ({
  SearchPage: () => <div>search-page</div>,
}));

vi.mock('../features/stats', () => ({
  MonitoringStatsPage: () => <div>monitoring-stats-page</div>,
  QaStatsPage: () => <div>qa-stats-page</div>,
}));

vi.mock('../features/settings', () => ({
  UserProfilePage: () => <div>profile-page</div>,
}));

vi.mock('../app/AppShell', () => ({
  AppShell: () => <div>app-shell</div>,
}));

describe('AppRouter', () => {
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

    render(<AppRouter />);

    await waitFor(() => {
      expect(screen.getByText('password-recovery-page')).toBeInTheDocument();
    });
  });

  it('allows the forgot password route without authentication', async () => {
    window.history.replaceState({}, '', '/forgot-password');

    render(<AppRouter />);

    await waitFor(() => {
      expect(screen.getByText('forgot-password-page')).toBeInTheDocument();
    });
  });

  it('allows the health check route without authentication', async () => {
    window.history.replaceState({}, '', '/healthz');

    render(<AppRouter />);

    await waitFor(() => {
      expect(screen.getByText('health-check-page')).toBeInTheDocument();
    });
  });

  it('redirects protected routes to login for guests', async () => {
    window.history.replaceState({}, '', '/dashboard');

    render(<AppRouter />);

    await waitFor(() => {
      expect(screen.getByText('login-page')).toBeInTheDocument();
    });
  });

  it('renders the standalone not found page for unknown guest routes', async () => {
    window.history.replaceState({}, '', '/missing-route');

    render(<AppRouter />);

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

    render(<AppRouter />);

    await waitFor(() => {
      expect(screen.getByText('not-found-page')).toBeInTheDocument();
    });
  });
});
