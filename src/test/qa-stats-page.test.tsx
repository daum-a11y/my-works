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
const getMembers = vi.fn();
const getServiceGroups = vi.fn();

vi.mock("../features/auth/AuthContext", () => ({
  useAuth: () => ({ session: { member } }),
}));

vi.mock("../lib/data-client", () => ({
  opsDataClient: {
    getProjects: (...args: unknown[]) => getProjects(...args),
    getMembers: (...args: unknown[]) => getMembers(...args),
    getServiceGroups: (...args: unknown[]) => getServiceGroups(...args),
  },
}));

describe("QaStatsPage", () => {
  it("shows only QA projects by project type", async () => {
    getProjects.mockResolvedValue([
      {
        id: "project-1",
        legacyProjectId: "",
        createdByMemberId: null,
        name: "접근성 포털",
        projectType1: "QA",
        platform: "WEB",
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
        legacyProjectId: "",
        createdByMemberId: null,
        name: "앱 운영",
        projectType1: "운영",
        platform: "APP",
        serviceGroupId: null,
        reportUrl: "",
        reporterMemberId: "member-1",
        reviewerMemberId: null,
        startDate: "2026-03-01",
        endDate: "2026-03-31",
        isActive: true,
      },
    ]);
    getMembers.mockResolvedValue([{ ...member, authUserId: "auth-1" }]);
    getServiceGroups.mockResolvedValue([]);

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
      expect(screen.getAllByText("접근성 포털").length).toBeGreaterThan(0);
    });

    expect(screen.queryByText("앱 운영")).not.toBeInTheDocument();
  });
});
