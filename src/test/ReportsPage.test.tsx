import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ReportsPage } from '../features/reports';
import { getToday } from '../lib/utils';

const mockUseReportsSlice = vi.fn();

vi.mock('../features/reports/useReportsSlice', () => ({
  useReportsSlice: () => mockUseReportsSlice(),
}));

function createSliceMock(canEditReports: boolean) {
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
      pageId: '',
      type1: '기획',
      type2: '작성',
      platform: '',
      serviceGroupName: '',
      serviceName: '',
      manualPageName: '',
      pageUrl: '',
      taskUsedtime: '60',
      content: '',
      note: '',
    },
    selectedDate: today,
    projectQuery: '',
    projectOptions: [],
    filteredProjectOptions: [],
    draftPages: [],
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
        pageId: 'page-1',
        projectName: '접근성 포털',
        pageName: '메인',
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
        pageDisplayName: '메인',
        pageUrl: 'https://example.com',
        searchText: '업무',
      },
    ],
    isSaving: false,
    statusMessage: canEditReports ? '새 업무보고를 작성할 수 있습니다.' : '',
    setActiveTab: vi.fn(),
    setDraftField: vi.fn(),
    setSelectedDate: vi.fn(),
    setProjectQuery: vi.fn(),
    applyProjectQuery: vi.fn(),
    selectReport: vi.fn(),
    startNewReport: vi.fn(),
    resetDraft: vi.fn(),
    saveDraft: vi.fn(),
    deleteDraft: vi.fn(),
    saveOverheadReport: vi.fn(),
    jumpDraftDate: vi.fn(),
  };
}

describe('ReportsPage', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders the input tabs, cost group field, and report table', async () => {
    mockUseReportsSlice.mockReturnValue(createSliceMock(true));

    render(
      <MemoryRouter>
        <ReportsPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('button', { name: '기본 입력' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'TYPE 입력' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '업무저장' })).toBeInTheDocument();
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

    expect(screen.queryByRole('button', { name: '업무저장' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '수정' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '삭제' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '이전일 조회' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '오늘 조회' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다음일 조회' })).toBeInTheDocument();
  });
});
