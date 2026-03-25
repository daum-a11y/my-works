import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "../features/auth/AuthContext";
import { LoginPage } from "../features/auth/LoginPage";
import { DashboardPage } from "../features/dashboard";
import { ProjectsFeature } from "../features/projects";
import { ReportsPage } from "../features/reports";
import { SearchPage } from "../features/search";
import { PasswordSettingsPage } from "../features/settings";
import { MonitoringStatsPage, QaStatsPage } from "../features/stats";
import { TrackingFeature } from "../features/tracking";
import { AppShell } from "./AppShell";

function LoadingScreen() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        color: "var(--ink-strong)",
      }}
    >
      세션 정보를 확인하는 중입니다.
    </main>
  );
}

function GuardedLayout() {
  const { status } = useAuth();
  if (status === "loading") {
    return <LoadingScreen />;
  }
  if (status !== "authenticated") {
    return <Navigate to="/login" replace />;
  }
  return <AppShell />;
}

function LoginRoute() {
  const { status, session } = useAuth();
  if (status === "authenticated" && session) {
    return <Navigate to="/dashboard" replace />;
  }
  return <LoginPage />;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 20_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export function AppRouter() {
  return (
    <QueryClientProvider client={queryClient}>
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
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
