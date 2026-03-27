import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardPage } from "../features/dashboard";

const mockUseAuth = vi.hoisted(() => vi.fn());
const mockOpsDataClient = vi.hoisted(() => ({
  mode: "supabase" as const,
  getMembers: vi.fn(),
  getMemberByLegacyUserId: vi.fn(),
  getMemberByEmail: vi.fn(),
  getMemberByAuthId: vi.fn(),
  bindAuthSessionMember: vi.fn(),
  getTaskTypes: vi.fn(),
  getServiceGroups: vi.fn(),
  getProjects: vi.fn(),
  saveProject: vi.fn(),
  getProjectPages: vi.fn(),
  getAllProjectPages: vi.fn(),
  saveProjectPage: vi.fn(),
  getTasks: vi.fn(),
  getAllTasks: vi.fn(),
  saveTask: vi.fn(),
  deleteTask: vi.fn(),
  searchTasks: vi.fn(),
  getDashboard: vi.fn(),
  getStats: vi.fn(),
}));

vi.mock("../features/auth/AuthContext", () => ({
  useAuth: mockUseAuth,
}));

vi.mock("../lib/data-client", () => ({
  opsDataClient: mockOpsDataClient,
}));

describe("DashboardPage", () => {
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

    mockOpsDataClient.getDashboard.mockReset();
    mockOpsDataClient.getDashboard.mockResolvedValue({
      monitoring: [
        {
          pageId: "page-1",
          projectName: "알파",
          platform: "iOS",
          pageTitle: "로그인",
          ownerName: "운영 사용자",
          statusLabel: "개선",
          detail: "상태 메모",
          reportUrl: "https://example.com/report",
          dueDate: null,
        },
      ],
      qa: [
        {
          pageId: "page-2",
          projectName: "베타",
          platform: "Android",
          pageTitle: "메인",
          ownerName: "리포터",
          statusLabel: "미개선",
          detail: "",
          reportUrl: "",
          dueDate: "2026-03-31",
        },
      ],
    });
  });

  it("renders only the original dashboard lists", async () => {
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <DashboardPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("알파")).toBeInTheDocument();
    });

    expect(screen.getByText("알파")).toBeInTheDocument();
    expect(screen.getByText("로그인")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "진행중 모니터링 목록" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "진행중 QA 목록" })).toBeInTheDocument();
    expect(screen.queryByText("업무 보고 현황")).not.toBeInTheDocument();
  });
});
