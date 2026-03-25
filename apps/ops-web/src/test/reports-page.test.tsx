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
      filteredReports: [],
      selectedReport: null,
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
      filters: {
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
      statusMessage: "새 업무보고를 작성할 수 있습니다.",
      pendingDeleteId: null,
      projects: [
        { id: "project-1", name: "접근성 포털" },
      ],
      draftPages: [
        { id: "page-1", projectId: "project-1", title: "메인", url: "", ownerMemberId: null, trackStatus: "미개선", monitoringInProgress: false, qaInProgress: false, note: "", updatedAt: "2026-03-24T00:00:00.000Z" },
      ],
      filterPages: [
        { id: "page-1", projectId: "project-1", title: "메인", url: "", ownerMemberId: null, trackStatus: "미개선", monitoringInProgress: false, qaInProgress: false, note: "", updatedAt: "2026-03-24T00:00:00.000Z" },
      ],
      setDraftField: vi.fn(),
      setFilterField: vi.fn(),
      selectReport: vi.fn(),
      startNewReport: vi.fn(),
      saveDraft: vi.fn(),
      promptDelete: vi.fn(),
      cancelDelete: vi.fn(),
      confirmDelete: vi.fn(),
      resetDraft: vi.fn(),
    });

    const { container } = render(<ReportsPage />);

    expect(screen.getAllByRole("combobox", { name: "프로젝트" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("combobox", { name: "페이지" }).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "새 보고" })).toBeInTheDocument();

    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
