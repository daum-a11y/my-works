import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from '../features/auth/AuthContext';
import { ForgotPasswordPage } from '../features/auth/ForgotPasswordPage';
import { LoginPage } from '../features/auth/LoginPage';
import { PasswordRecoveryPage } from '../features/auth/PasswordRecoveryPage';
import { DashboardPage } from '../features/dashboard';
import { AdminServiceGroupsPage } from '../features/admin/groups/AdminServiceGroupsPage';
import { AdminMembersPage } from '../features/admin/members/AdminMembersPage';
import { AdminReportEditorPage } from '../features/admin/reports/AdminReportEditorPage';
import { AdminReportsPage } from '../features/admin/reports/AdminReportsPage';
import { AdminTaskTypesPage } from '../features/admin/types/AdminTaskTypesPage';
import { NotFoundPage } from '../features/not-found';
import { ProjectEditorPage, ProjectsFeature } from '../features/projects';
import { ReportsPage } from '../features/reports';
import {
  ResourceMonthPage,
  ResourceServicePage,
  ResourceSummaryPage,
  ResourceTypePage,
} from '../features/resource';
import { SearchPage } from '../features/search';
import { MonitoringStatsPage, QaStatsPage } from '../features/stats';
import { UserProfilePage } from '../features/settings';
import { AppShell } from './AppShell';

function LoadingFallback() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#ffffff',
      }}
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          border: '3px solid var(--border-subtle)',
          borderTopColor: 'var(--accent-strong)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function GuardedLayout() {
  const { status } = useAuth();

  if (status === 'loading') {
    return <LoadingFallback />;
  }

  if (status !== 'authenticated') {
    return <Navigate to="/login" replace />;
  }

  return <AppShell />;
}

function AdminRoute() {
  const { status, session } = useAuth();

  if (status === 'loading') {
    return <LoadingFallback />;
  }

  if (status !== 'authenticated' || !session) {
    return <Navigate to="/login" replace />;
  }

  if (session.member.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

function LoginRoute() {
  const { status, session, isRecoverySession } = useAuth();

  if (isRecoverySession) {
    return <Navigate to="/auth/recovery" replace />;
  }

  if (status === 'authenticated' && session) {
    return <Navigate to="/dashboard" replace />;
  }

  return <LoginPage />;
}

export function AppRouter() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/auth/recovery" element={<PasswordRecoveryPage />} />
          <Route element={<GuardedLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/person/report" element={<ReportsPage />} />
            <Route path="/person/search" element={<SearchPage />} />
            <Route path="/projects" element={<ProjectsFeature />} />
            <Route path="/projects/new" element={<ProjectEditorPage />} />
            <Route path="/projects/:projectId/edit" element={<ProjectEditorPage />} />
            <Route path="/resource/summary" element={<ResourceSummaryPage />} />
            <Route path="/resource/month" element={<ResourceMonthPage />} />
            <Route path="/resource/month/:type" element={<ResourceMonthPage />} />
            <Route path="/resource/type" element={<ResourceTypePage />} />
            <Route path="/resource/svc" element={<ResourceServicePage />} />
            <Route path="/stats/qa" element={<QaStatsPage />} />
            <Route path="/stats/monitoring" element={<MonitoringStatsPage />} />
            <Route path="/profile" element={<UserProfilePage />} />
            <Route path="/password-change" element={<Navigate to="/profile" replace />} />
            <Route element={<AdminRoute />}>
              <Route path="/admin/reports" element={<AdminReportsPage />} />
              <Route path="/admin/reports/new" element={<AdminReportEditorPage />} />
              <Route path="/admin/reports/:taskId/edit" element={<AdminReportEditorPage />} />
              <Route path="/admin/members" element={<AdminMembersPage />} />
              <Route path="/admin/type" element={<AdminTaskTypesPage />} />
              <Route path="/admin/group" element={<AdminServiceGroupsPage />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
