import { axe } from "jest-axe";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SearchPage } from "../features/search/search-page";

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

describe("SearchPage", () => {
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

    mockOpsDataClient.getProjects.mockResolvedValue([
      {
        id: "project-1",
        legacyProjectId: "legacy-project-1",
        createdByMemberId: null,
        name: "알파",
        platform: "iOS",
        serviceGroupId: null,
        reportUrl: "",
        reporterMemberId: null,
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
    mockOpsDataClient.getServiceGroups.mockResolvedValue([]);
    mockOpsDataClient.getTaskTypes.mockResolvedValue([]);
    mockOpsDataClient.searchTasks.mockResolvedValue([]);
  });

  it("renders the current search flow and keeps the page filter dependent on project", async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient();

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <SearchPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole("option", { name: "알파" })).toBeInTheDocument();
    });

    await user.selectOptions(screen.getByLabelText("프로젝트"), "project-1");

    await waitFor(() => {
      expect(mockOpsDataClient.searchTasks).toHaveBeenCalledWith(
        expect.objectContaining({ id: "member-1" }),
        expect.objectContaining({ startDate: "", endDate: "" }),
      );
    });

    await user.selectOptions(screen.getAllByRole("combobox", { name: "프로젝트" })[0], "project-1");

    expect(
      screen.getByRole("heading", { name: "기간을 지정해 검색하고, 결과를 바로 수정하거나 내려받습니다." }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "엑셀파일로 내려받기" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "로그인" })).toBeInTheDocument();

    const results = (await axe(container)) as { violations: unknown[] };
    expect(results.violations).toHaveLength(0);
  });
});
