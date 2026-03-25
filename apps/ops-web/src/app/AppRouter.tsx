import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "../features/auth/AuthContext";
import { LoginPage } from "../features/auth/LoginPage";
import { DashboardPage } from "../features/dashboard";
import { AdminMembersPage } from "../features/admin/members/AdminMembersPage";
import { AdminReportsPage } from "../features/admin/reports/AdminReportsPage";
import { ProjectsFeature } from "../features/projects";
import { ReportsPage } from "../features/reports";
import { SearchPage } from "../features/search";
import { PasswordSettingsPage } from "../features/settings";
import { MonitoringStatsPage, QaStatsPage } from "../features/stats";
import { TrackingFeature } from "../features/tracking";
import { AppShell } from "./AppShell";

function LoadingFallback({ message }: { message: string }) {
  return (
    <div style={{ padding: "3rem", textAlign: "center" }}>
      <strong>{message}</strong>
    </div>
  );
}

function GuardedLayout() {
  const { status } = useAuth();

  if (status === "loading") {
    return <LoadingFallback message="인증 정보를 불러오는 중입니다." />;
  }

  if (status !== "authenticated") {
    return <Navigate to="/login" replace />;
  }

  return <AppShell />;
}

function AdminRoute() {
  const { status, session } = useAuth();

  if (status === "loading") {
    return <LoadingFallback message="관리자 권한을 확인하는 중입니다." />;
  }

  if (status !== "authenticated" || !session) {
    return <Navigate to="/login" replace />;
  }

  if (session.member.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

function LoginRoute() {
  const { status, session } = useAuth();

  if (status === "authenticated" && session) {
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
          <Route element={<GuardedLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/projects" element={<ProjectsFeature />} />
            <Route path="/tracking" element={<TrackingFeature />} />
            <Route path="/reports/search" element={<SearchPage />} />
            <Route path="/stats/qa" element={<QaStatsPage />} />
            <Route path="/stats/monitoring" element={<MonitoringStatsPage />} />
            <Route path="/settings/password" element={<PasswordSettingsPage />} />
            <Route element={<AdminRoute />}>
              <Route path="/admin/reports" element={<AdminReportsPage />} />
              <Route path="/admin/members" element={<AdminMembersPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
