import { AdminCostGroupEditorPage } from '../pages/admin/cost-groups/AdminCostGroupEditorPage';
import { AdminCostGroupsPage } from '../pages/admin/cost-groups/AdminCostGroupsPage';
import { AdminPlatformEditorPage } from '../pages/admin/platforms/AdminPlatformEditorPage';
import { AdminPlatformsPage } from '../pages/admin/platforms/AdminPlatformsPage';
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from '../auth/AuthContext';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';
import { LoginPage } from '../pages/auth/LoginPage';
import { PasswordRecoveryPage } from '../pages/auth/PasswordRecoveryPage';
import { PendingApprovalPage } from '../pages/auth/PendingApprovalPage';
import { DashboardPage } from '../pages/dashboard';
import { AdminServiceGroupEditorPage } from '../pages/admin/groups/AdminServiceGroupEditorPage';
import { AdminServiceGroupsPage } from '../pages/admin/groups/AdminServiceGroupsPage';
import { AdminMemberEditorPage } from '../pages/admin/members/AdminMemberEditorPage';
import { AdminMembersPage } from '../pages/admin/members/AdminMembersPage';
import { AdminReportEditorPage } from '../pages/admin/reports/AdminReportEditorPage';
import { AdminReportsPage } from '../pages/admin/reports/AdminReportsPage';
import { AdminTaskTypeEditorPage } from '../pages/admin/types/AdminTaskTypeEditorPage';
import { AdminTaskTypesPage } from '../pages/admin/types/AdminTaskTypesPage';
import { HealthCheckPage } from '../pages/health';
import { NotFoundPage } from '../pages/notFound';
import { ProjectEditorPage, ProjectsPage } from '../pages/projects';
import { ReportsPage } from '../pages/reports';
import {
  ResourceMonthPage,
  ResourceServicePage,
  ResourceSummaryPage,
  ResourceTypePage,
} from '../pages/resource';
import { SearchPage } from '../pages/search';
import { MonitoringStatsPage, QaStatsPage } from '../pages/stats';
import { UserProfilePage } from '../pages/profile';
import { AuthenticatedLayout } from '../layouts/AuthenticatedLayout';
import { GlobalLoadingSpinner } from '../components/layout/GlobalLoadingSpinner';

function LoadingFallback() {
  return <GlobalLoadingSpinner />;
}

function GuardedLayout() {
  const { status, session } = useAuth();

  if (status === 'loading') {
    return <LoadingFallback />;
  }

  if (status !== 'authenticated') {
    return <Navigate to="/login" replace />;
  }

  if (session?.member.status === 'pending') {
    return <Navigate to="/pending-approval" replace />;
  }

  return <AuthenticatedLayout />;
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
    if (session.member.status === 'pending') {
      return <Navigate to="/pending-approval" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <LoginPage />;
}

function PendingApprovalRoute() {
  const { status, session } = useAuth();

  if (status === 'loading') {
    return <LoadingFallback />;
  }

  if (status !== 'authenticated' || !session) {
    return <Navigate to="/login" replace />;
  }

  if (session.member.status !== 'pending') {
    return <Navigate to="/dashboard" replace />;
  }

  return <PendingApprovalPage />;
}

export function RootRouter() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/auth/recovery" element={<PasswordRecoveryPage />} />
          <Route path="/pending-approval" element={<PendingApprovalRoute />} />
          <Route path="/healthz" element={<HealthCheckPage />} />
          <Route element={<GuardedLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/person/report" element={<ReportsPage />} />
            <Route path="/person/search" element={<SearchPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/new" element={<ProjectEditorPage />} />
            <Route path="/projects/:projectId/edit" element={<ProjectEditorPage />} />
            <Route path="/org/summary" element={<ResourceSummaryPage />} />
            <Route path="/stats/qa" element={<QaStatsPage />} />
            <Route path="/stats/monitoring" element={<MonitoringStatsPage />} />
            <Route path="/profile" element={<UserProfilePage />} />
            <Route path="/password-change" element={<Navigate to="/profile" replace />} />
            <Route element={<AdminRoute />}>
              <Route path="/resource/month" element={<ResourceMonthPage />} />
              <Route path="/resource/month/:type" element={<ResourceMonthPage />} />
              <Route path="/resource/type" element={<ResourceTypePage />} />
              <Route path="/resource/svc" element={<ResourceServicePage />} />
              <Route path="/org/search" element={<AdminReportsPage />} />
              <Route path="/org/search/new" element={<AdminReportEditorPage />} />
              <Route path="/org/search/:taskId/edit" element={<AdminReportEditorPage />} />
              <Route path="/admin/members" element={<AdminMembersPage />} />
              <Route path="/admin/members/new" element={<AdminMemberEditorPage />} />
              <Route path="/admin/members/:memberId/edit" element={<AdminMemberEditorPage />} />
              <Route path="/admin/type" element={<AdminTaskTypesPage />} />
              <Route path="/admin/type/new" element={<AdminTaskTypeEditorPage />} />
              <Route path="/admin/type/:taskTypeId/edit" element={<AdminTaskTypeEditorPage />} />
              <Route path="/admin/platform" element={<AdminPlatformsPage />} />
              <Route path="/admin/platform/new" element={<AdminPlatformEditorPage />} />
              <Route
                path="/admin/platform/:platformId/edit"
                element={<AdminPlatformEditorPage />}
              />
              <Route path="/admin/cost-group" element={<AdminCostGroupsPage />} />
              <Route path="/admin/cost-group/new" element={<AdminCostGroupEditorPage />} />
              <Route
                path="/admin/cost-group/:costGroupId/edit"
                element={<AdminCostGroupEditorPage />}
              />
              <Route path="/admin/group" element={<AdminServiceGroupsPage />} />
              <Route path="/admin/group/new" element={<AdminServiceGroupEditorPage />} />
              <Route
                path="/admin/group/:serviceGroupId/edit"
                element={<AdminServiceGroupEditorPage />}
              />
            </Route>
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
