import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MonitoringStatsPage, QaStatsPage } from "../features/stats";

const mockUseAuth = vi.hoisted(() => vi.fn());
const mockOpsDataClient = vi.hoisted(() => ({
  mode: "supabase" as const,
  getMembers: vi.fn(),
  getMemberByEmail: vi.fn(),
  getMemberByAuthId: vi.fn(),
  getTaskTypes: vi.fn(),
  getServiceGroups: vi.fn(),
  getProjects: vi.fn(),
  saveProject: vi.fn(),
  getProjectPages: vi.fn(),
  getAllProjectPages: vi.fn(),
  saveProjectPage: vi.fn(),
  getTasks: vi.fn(),
  saveTask: vi.fn(),
  deleteTask: vi.fn(),
  searchTasks: vi.fn(),
  exportTasks: vi.fn(),
  getDashboard: vi.fn(),
  getStats: vi.fn(),
}));

vi.mock("../features/auth/AuthContext", () => ({
  useAuth: mockUseAuth,
}));

vi.mock("../lib/data-client", () => ({
  opsDataClient: mockOpsDataClient,
}));

describe("Stats pages", () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      status: "authenticated",
      session: {
        member: {
          id: "member-1",
          legacyUserId: "legacy-1",
          name: "운영 사용자",
          email: "operator@example.com",
          role: "user",
          isActive: true,
        },
      },
    });

    mockOpsDataClient.getMembers.mockResolvedValue([
      {
        id: "member-1",
        legacyUserId: "legacy-1",
        name: "운영 사용자",
        email: "operator@example.com",
        joinedAt: "2026-03-01",
        role: "user",
        isActive: true,
      },
    ]);
    mockOpsDataClient.getServiceGroups.mockResolvedValue([
      {
        id: "service-group-1",
        legacyServiceGroupId: "legacy-service-group-1",
        name: "서비스그룹A",
        displayOrder: 1,
      },
    ]);
    mockOpsDataClient.getProjects.mockResolvedValue([
      {
        id: "project-1",
        legacyProjectId: "legacy-project-1",
        createdByMemberId: null,
        name: "QA 대상",
        projectType1: "QA",
        platform: "iOS",
        serviceGroupId: null,
        reportUrl: "",
        reporterMemberId: "member-1",
        reviewerMemberId: null,
        startDate: "2026-03-01",
        endDate: "2026-03-31",
        isActive: true,
      },
      {
        id: "project-2",
        legacyProjectId: "legacy-project-2",
        createdByMemberId: null,
        name: "제외 대상",
        projectType1: "운영",
        platform: "Android",
        serviceGroupId: null,
        reportUrl: "",
        reporterMemberId: "member-1",
        reviewerMemberId: null,
        startDate: "2026-03-01",
        endDate: "2026-03-31",
        isActive: true,
      },
    ]);
    mockOpsDataClient.getAllProjectPages.mockResolvedValue([
      {
        id: "page-1",
        legacyPageId: "legacy-page-1",
        projectId: "project-1",
        title: "모니터링 페이지",
        url: "",
        ownerMemberId: "member-1",
        trackStatus: "개선",
        monitoringInProgress: true,
        qaInProgress: true,
        note: "",
        monitoringMonth: "2603",
        updatedAt: "2026-03-24T09:00:00.000Z",
      },
      {
        id: "page-2",
        legacyPageId: "legacy-page-2",
        projectId: "project-2",
        title: "제외 페이지",
        url: "",
        ownerMemberId: "member-1",
        trackStatus: "미개선",
        monitoringInProgress: false,
        qaInProgress: false,
        note: "",
        monitoringMonth: "",
        updatedAt: "2026-03-24T09:00:00.000Z",
      },
    ]);
  });

  it("shows only monitoring rows with monitoring month", async () => {
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MonitoringStatsPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getAllByText("모니터링 페이지").length).toBeGreaterThan(0);
    });

    expect(screen.getByRole("heading", { name: "모니터링 통계" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "최근 월별 모니터링 통계" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "모니터링 통계 테이블" })).toBeInTheDocument();
    expect(screen.queryByText("제외 페이지")).not.toBeInTheDocument();
  });

  it("shows only QA projects by project type", async () => {
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <QaStatsPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getAllByText("QA 대상").length).toBeGreaterThan(0);
    });

    expect(screen.getByRole("heading", { name: "QA 통계" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "최근 월별 QA 통계" })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { name: "QA 목록" }).length).toBeGreaterThan(0);
    expect(screen.queryByText("제외 대상")).not.toBeInTheDocument();
  });
});
