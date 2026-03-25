import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProjectsFeature } from "../features/projects";
import { TrackingFeature } from "../features/tracking";

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

describe("ProjectsFeature and TrackingFeature", () => {
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
        role: "user",
        isActive: true,
      },
    ]);
    mockOpsDataClient.getProjects.mockResolvedValue([
      {
        id: "project-1",
        legacyProjectId: "legacy-project-1",
        createdByMemberId: null,
        name: "알파",
        platform: "iOS",
        serviceGroupId: null,
        reportUrl: "",
        reporterMemberId: "member-1",
        reviewerMemberId: null,
        startDate: "2026-03-01",
        endDate: "2026-03-31",
        isActive: true,
      },
    ]);
    mockOpsDataClient.getProjectPages.mockResolvedValue([
      {
        id: "page-1",
        legacyPageId: "legacy-page-1",
        projectId: "project-1",
        title: "로그인",
        url: "",
        ownerMemberId: "member-1",
        trackStatus: "개선",
        monitoringInProgress: true,
        qaInProgress: false,
        note: "",
        updatedAt: "2026-03-24T09:00:00.000Z",
      },
    ]);
    mockOpsDataClient.saveProject.mockResolvedValue({
      id: "project-2",
      legacyProjectId: "legacy-project-2",
      createdByMemberId: null,
      name: "신규 프로젝트",
      platform: "Web",
      serviceGroupId: null,
      reportUrl: "",
      reporterMemberId: null,
      reviewerMemberId: null,
      startDate: "2026-03-24",
      endDate: "2026-03-24",
      isActive: true,
    });
    mockOpsDataClient.saveProjectPage.mockResolvedValue({
      id: "page-2",
      legacyPageId: "legacy-page-2",
      projectId: "project-1",
      title: "신규 페이지",
      url: "",
      ownerMemberId: "member-1",
      trackStatus: "미개선",
      monitoringInProgress: false,
      qaInProgress: false,
      note: "",
      updatedAt: "2026-03-24T09:00:00.000Z",
    });
  });

  it("shows explicit create actions in projects", async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <ProjectsFeature />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "새 프로젝트" })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "새 프로젝트" }));

    expect(screen.getByRole("button", { name: "새 페이지" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "프로젝트 편집" })).toBeInTheDocument();
  });

  it("removes the broken new tracking item action", async () => {
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <TrackingFeature />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "저장" })).toBeInTheDocument();
    });

    expect(screen.queryByRole("button", { name: "새 항목" })).not.toBeInTheDocument();
  });
});
