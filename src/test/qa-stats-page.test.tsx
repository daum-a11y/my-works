import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { QaStatsPage } from "../features/stats";

const member = {
  id: "member-1",
  legacyUserId: "user1",
  name: "운영자",
  email: "operator@example.com",
  role: "user" as const,
  isActive: true,
};

const getProjects = vi.fn();
const getAllProjectPages = vi.fn();
const getMembers = vi.fn();

vi.mock("../features/auth/AuthContext", () => ({
  useAuth: () => ({ session: { member } }),
}));

vi.mock("../lib/data-client", () => ({
  opsDataClient: {
    getProjects: (...args: unknown[]) => getProjects(...args),
    getAllProjectPages: (...args: unknown[]) => getAllProjectPages(...args),
    getMembers: (...args: unknown[]) => getMembers(...args),
  },
}));

describe("QaStatsPage", () => {
  it("shows only projects linked to qa_in_progress pages", async () => {
    getProjects.mockResolvedValue([
      { id: "project-1", legacyProjectId: "", createdByMemberId: null, name: "접근성 포털", platform: "WEB", serviceGroupId: null, reportUrl: "", reporterMemberId: "member-1", reviewerMemberId: null, startDate: "2026-03-01", endDate: "2026-03-31", isActive: true },
      { id: "project-2", legacyProjectId: "", createdByMemberId: null, name: "앱 운영", platform: "APP", serviceGroupId: null, reportUrl: "", reporterMemberId: "member-1", reviewerMemberId: null, startDate: "2026-03-01", endDate: "2026-03-31", isActive: true },
    ]);
    getAllProjectPages.mockResolvedValue([
      { id: "page-1", legacyPageId: "", projectId: "project-1", title: "메인", url: "", ownerMemberId: "member-1", trackStatus: "미개선", monitoringInProgress: false, qaInProgress: true, note: "", updatedAt: "2026-03-24T00:00:00.000Z" },
      { id: "page-2", legacyPageId: "", projectId: "project-2", title: "설정", url: "", ownerMemberId: "member-1", trackStatus: "미개선", monitoringInProgress: false, qaInProgress: false, note: "", updatedAt: "2026-03-24T00:00:00.000Z" },
    ]);
    getMembers.mockResolvedValue([{ ...member, authUserId: "auth-1" }]);

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <QaStatsPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("접근성 포털")).toBeInTheDocument();
    });

    expect(screen.queryByText("앱 운영")).not.toBeInTheDocument();
  });
});
