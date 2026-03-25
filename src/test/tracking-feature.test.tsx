import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TrackingFeature } from "../features/tracking";

const member = {
  id: "member-1",
  legacyUserId: "user1",
  name: "운영자",
  email: "operator@example.com",
  role: "user" as const,
  isActive: true,
};

const getProjects = vi.fn();
const getProjectPages = vi.fn();
const getMembers = vi.fn();

vi.mock("../features/auth/AuthContext", () => ({
  useAuth: () => ({ session: { member } }),
}));

vi.mock("../lib/data-client", () => ({
  opsDataClient: {
    getProjects: (...args: unknown[]) => getProjects(...args),
    getProjectPages: (...args: unknown[]) => getProjectPages(...args),
    getMembers: (...args: unknown[]) => getMembers(...args),
    saveProjectPage: vi.fn(),
  },
}));

describe("TrackingFeature", () => {
  it("does not expose the broken new-item action", async () => {
    getProjects.mockResolvedValue([{ id: "project-1", name: "접근성 포털", legacyProjectId: "", createdByMemberId: null, platform: "WEB", serviceGroupId: null, reportUrl: "", reporterMemberId: null, reviewerMemberId: null, startDate: "2026-03-01", endDate: "2026-03-31", isActive: true }]);
    getProjectPages.mockResolvedValue([{ id: "page-1", legacyPageId: "", projectId: "project-1", title: "메인", url: "", ownerMemberId: "member-1", trackStatus: "미개선", monitoringInProgress: true, qaInProgress: false, note: "", updatedAt: "2026-03-24T00:00:00.000Z" }]);
    getMembers.mockResolvedValue([{ ...member, authUserId: "auth-1" }]);

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <TrackingFeature />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "상단 상태 버튼과 행 단위 편집으로 트래킹을 관리합니다." })).toBeInTheDocument();
    });

    expect(screen.queryByRole("button", { name: "새 항목" })).not.toBeInTheDocument();
  });
});
