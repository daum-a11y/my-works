import { axe } from "jest-axe";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ReportsPage } from "../features/reports";

const mockUseReportsSlice = vi.fn();

vi.mock("../features/reports/use-reports-slice", () => ({
  useReportsSlice: () => mockUseReportsSlice(),
}));

describe("ReportsPage", () => {
  it("renders project/page selects and basic accessible structure", async () => {
    mockUseReportsSlice.mockReturnValue({
      activeTab: "report",
      clearPeriodFilters: vi.fn(),
      selectedReport: null,
      selectedReportId: null,
      draft: {
        reportDate: "2026-03-24",
        projectId: "",
        pageId: "",
        type1: "기획",
        type2: "작성",
        workHours: "1.0",
        content: "",
        note: "",
      },
      projectQuery: "",
      projectOptions: [
        {
          id: "project-1",
          project: {
            id: "project-1",
            legacyProjectId: "legacy-project-1",
            createdByMemberId: null,
            name: "접근성 포털",
            platform: "Web",
            serviceGroupId: null,
            reportUrl: "",
            reporterMemberId: null,
            reviewerMemberId: null,
            startDate: "2026-03-01",
            endDate: "2026-03-31",
            isActive: true,
          },
          serviceGroupId: null,
          serviceGroupName: "",
          serviceName: "접근성 포털",
          label: "접근성 포털",
          searchText: "접근성 포털",
        },
      ],
      filteredProjectOptions: [
        {
          id: "project-1",
          project: {
            id: "project-1",
            legacyProjectId: "legacy-project-1",
            createdByMemberId: null,
            name: "접근성 포털",
            platform: "Web",
            serviceGroupId: null,
            reportUrl: "",
            reporterMemberId: null,
            reviewerMemberId: null,
            startDate: "2026-03-01",
            endDate: "2026-03-31",
            isActive: true,
          },
          serviceGroupId: null,
          serviceGroupName: "",
          serviceName: "접근성 포털",
          label: "접근성 포털",
          searchText: "접근성 포털",
        },
      ],
      periodFilters: {
        query: "",
        projectId: "",
        pageId: "",
        taskType1: "",
        taskType2: "",
        startDate: "",
        endDate: "",
        minHours: "",
        maxHours: "",
      },
      periodReports: [],
      recentReports: [],
      statusMessage: "새 업무보고를 작성할 수 있습니다.",
      draftPages: [
        { id: "page-1", projectId: "project-1", title: "메인", url: "", ownerMemberId: null, trackStatus: "미개선", monitoringInProgress: false, qaInProgress: false, note: "", updatedAt: "2026-03-24T00:00:00.000Z" },
      ],
      type1Options: ["기획"],
      type2Options: ["작성"],
      setActiveTab: vi.fn(),
      setDraftField: vi.fn(),
      setProjectQuery: vi.fn(),
      setPeriodField: vi.fn(),
      selectReport: vi.fn(),
      startNewReport: vi.fn(),
      saveDraft: vi.fn(),
      jumpDraftDate: vi.fn(),
      resetDraft: vi.fn(),
    });

    const { container } = render(<ReportsPage />);

    expect(screen.getAllByRole("combobox", { name: "프로젝트 선택" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("combobox", { name: "페이지 선택" }).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "새 입력" })).toBeInTheDocument();

    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
