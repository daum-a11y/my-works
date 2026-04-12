import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ReportsPage } from '../pages/reports';
import type { ReportsSlice } from '../pages/reports/useReportsSlice';
import { getToday } from '../utils';

const mockUseReportsSlice = vi.fn();

vi.mock('../pages/reports/useReportsSlice', () => ({
  useReportsSlice: () => mockUseReportsSlice(),
}));

function createSliceMock(canEditReports: boolean): ReportsSlice {
  const today = getToday();

  return {
    activeTab: 'report' as const,
    canEditReports,
    selectedReport: null,
    selectedReportId: null,
    draft: {
      reportDate: today,
      costGroupId: 'cost-group-1',
      costGroupName: '내부',
      projectId: '',
      subtaskId: '',
      type1: '기획',
      type2: '작성',
      platform: '',
      serviceGroupName: '',
      serviceName: '',
      manualSubtaskName: '',
      url: '',
      taskUsedtime: '60',
      content: '',
      note: '',
    },
    selectedDate: today,
    projectQuery: '',
    appliedProjectQuery: '',
    projectOptions: [],
    filteredProjectOptions: [],
    draftSubtasks: [],
    costGroupOptions: [{ id: 'cost-group-1', name: '내부', displayOrder: 0, isActive: true }],
    taskTypes: [
      {
        id: 'type-1',
        type1: '기획',
        type2: '작성',
        label: '기획 / 작성',
        displayOrder: 1,
        requiresServiceGroup: false,
        isActive: true,
      },
    ],
    type1Options: ['기획'],
    type2Options: ['작성'],
    platformOptions: [],
    dailyReports: [
      {
        id: 'report-1',
        ownerId: 'member-1',
        ownerName: '운영 사용자',
        reportDate: today,
        costGroupId: 'cost-group-1',
        costGroupName: '내부',
        projectId: 'project-1',
        subtaskId: 'page-1',
        projectName: '접근성 포털',
        subtaskName: '메인',
        type1: '기획',
        type2: '작성',
        taskUsedtime: 60,
        content: '업무',
        note: '비고',
        createdAt: '2026-03-24T00:00:00.000Z',
        updatedAt: '2026-03-24T00:00:00.000Z',
        platform: 'Web',
        serviceGroupName: '',
        serviceName: '접근성 포털',
        projectDisplayName: '접근성 포털',
        subtaskDisplayName: '메인',
        url: 'https://example.com',
        searchText: '업무',
      },
    ],
    isSaving: false,
    statusMessage: canEditReports ? '새 업무보고를 작성할 수 있습니다.' : '',
    statusKind: 'info' as const,
    isEditMode: false,
    setActiveTab: vi.fn(),
    setDraftField: vi.fn(),
    setSelectedDate: vi.fn(),
    setProjectQuery: vi.fn(),
    applyProjectQuery: vi.fn(),
    selectReport: vi.fn(),
    cancelEdit: vi.fn(),
    startNewReport: vi.fn(),
    resetDraft: vi.fn(),
    saveDraft: vi.fn(),
    deleteDraft: vi.fn(),
    overheadCostGroupId: '',
    setOverheadCostGroupId: vi.fn(),
    saveOverheadReport: vi.fn(),
    jumpDraftDate: vi.fn(),
  };
}

describe('ReportsPage', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders the edit panel and report table together', async () => {
    mockUseReportsSlice.mockReturnValue(createSliceMock(true));

    render(
      <MemoryRouter>
        <ReportsPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { level: 1, name: '업무보고' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: '업무 등록' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '업무 저장' })).toBeInTheDocument();
    expect(screen.getByLabelText('업무명')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '청구그룹' })).toBeInTheDocument();
    expect(screen.getAllByText('내부').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/접근성 포털/).length).toBeGreaterThan(0);
  });

  it('renders in read-only mode when reportRequired is false', () => {
    mockUseReportsSlice.mockReturnValue(createSliceMock(false));

    render(
      <MemoryRouter>
        <ReportsPage />
      </MemoryRouter>,
    );

    expect(screen.queryByRole('button', { name: '업무 저장' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '수정' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '삭제' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '이전일 조회' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '오늘 조회' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다음일 조회' })).toBeInTheDocument();
  });

  it('switches the shared form into edit mode when a report is selected', () => {
    const slice = createSliceMock(true);
    slice.isEditMode = true;
    slice.selectedReportId = 'report-1';
    slice.selectedReport = slice.dailyReports[0];
    mockUseReportsSlice.mockReturnValue(slice);

    render(
      <MemoryRouter>
        <ReportsPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: '업무 수정' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '수정 저장' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: '편집 취소' }).length).toBeGreaterThan(0);
  });

  it('renders overhead controls separately from the main form', () => {
    const slice = createSliceMock(true);
    slice.overheadCostGroupId = 'cost-group-1';
    mockUseReportsSlice.mockReturnValue(slice);

    render(
      <MemoryRouter>
        <ReportsPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/오늘 총 입력/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '오버헤드 등록' })).toBeInTheDocument();
    expect(screen.getAllByText('청구그룹').length).toBeGreaterThan(0);
    expect(screen.getByLabelText('업무명')).toBeInTheDocument();
  });
});
