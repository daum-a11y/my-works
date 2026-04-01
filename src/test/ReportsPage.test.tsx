import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ReportsPage } from '../features/reports';
import { getToday } from '../lib/utils';

const mockUseReportsSlice = vi.fn();

vi.mock('../features/reports/useReportsSlice', () => ({
  useReportsSlice: () => mockUseReportsSlice(),
}));

describe('ReportsPage', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders the input tabs, today summary, and report table', async () => {
    const today = getToday();

    mockUseReportsSlice.mockReturnValue({
      activeTab: 'report',
      canEditReports: true,
      clearPeriodFilters: vi.fn(),
      selectedReport: null,
      selectedReportId: null,
      draft: {
        reportDate: today,
        projectId: '',
        pageId: '',
        type1: '기획',
        type2: '작성',
        platform: '',
        serviceGroupName: '',
        serviceName: '',
        manualPageName: '',
        pageUrl: '',
        workHours: '60',
        content: '',
        note: '',
      },
      projectQuery: '',
      filteredProjectOptions: [
        {
          id: 'project-1',
          project: {
            id: 'project-1',
            legacyProjectId: 'legacy-project-1',
            createdByMemberId: null,
            projectType1: '기획',
            name: '접근성 포털',
            platform: 'Web',
            serviceGroupId: null,
            reportUrl: '',
            reporterMemberId: null,
            reviewerMemberId: null,
            startDate: '2026-03-01',
            endDate: '2026-03-31',
            isActive: true,
          },
          serviceGroupId: null,
          serviceGroupName: '',
          serviceName: '접근성 포털',
          label: '접근성 포털',
          searchText: '접근성 포털',
        },
      ],
      periodFilters: {
        query: '',
        projectId: '',
        pageId: '',
        taskType1: '',
        taskType2: '',
        startDate: '',
        endDate: '',
        minHours: '',
        maxHours: '',
      },
      periodReports: [],
      recentReports: [
        {
          id: 'report-1',
          ownerId: 'member-1',
          ownerName: '운영 사용자',
          reportDate: today,
          projectId: 'project-1',
          pageId: 'page-1',
          projectName: '접근성 포털',
          pageName: '메인',
          type1: '기획',
          type2: '작성',
          workHours: 60,
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
      reports: [
        {
          id: 'report-1',
          ownerId: 'member-1',
          ownerName: '운영 사용자',
          reportDate: today,
          projectId: 'project-1',
          pageId: 'page-1',
          projectName: '접근성 포털',
          pageName: '메인',
          type1: '기획',
          type2: '작성',
          workHours: 60,
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
      setDraftField: vi.fn(),
      setProjectQuery: vi.fn(),
      applyProjectQuery: vi.fn(),
      setPeriodField: vi.fn(),
      applyPeriodFilters: vi.fn(),
      selectReport: vi.fn(),
      startNewReport: vi.fn(),
      saveDraft: vi.fn(),
      saveOverheadReport: vi.fn(),
      jumpDraftDate: vi.fn(),
      setActiveTab: vi.fn(),
      statusMessage: '새 업무보고를 작성할 수 있습니다.',
      draftPages: [
        {
          id: 'page-1',
          projectId: 'project-1',
          title: '메인',
          url: 'https://example.com',
          ownerMemberId: null,
          trackStatus: '미수정',
          monitoringInProgress: false,
          qaInProgress: false,
          note: '',
          updatedAt: '2026-03-24T00:00:00.000Z',
        },
      ],
      taskTypes: [
        {
          id: 'type-1',
          legacyTypeId: '1',
          type1: '기획',
          type2: '작성',
          label: '기획 / 작성',
          displayOrder: 1,
        },
      ],
      type1Options: ['기획'],
      type2Options: ['작성'],
      isSaving: false,
    });

    render(
      <MemoryRouter>
        <ReportsPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('button', { name: '기본 입력' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'TYPE 입력' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '업무저장' })).toBeInTheDocument();
    expect(screen.getByText(/접근성 포털/)).toBeInTheDocument();
  });

  it('renders in read-only mode when reportRequired is false', () => {
    const today = getToday();

    mockUseReportsSlice.mockReturnValue({
      activeTab: 'report',
      canEditReports: false,
      clearPeriodFilters: vi.fn(),
      selectedReport: null,
      selectedReportId: null,
      draft: {
        reportDate: today,
        projectId: '',
        pageId: '',
        type1: '기획',
        type2: '작성',
        platform: '',
        serviceGroupName: '',
        serviceName: '',
        manualPageName: '',
        pageUrl: '',
        workHours: '60',
        content: '',
        note: '',
      },
      projectQuery: '',
      filteredProjectOptions: [],
      periodFilters: {
        query: '',
        projectId: '',
        pageId: '',
        taskType1: '',
        taskType2: '',
        startDate: today,
        endDate: today,
        minHours: '',
        maxHours: '',
      },
      periodReports: [
        {
          id: 'report-1',
          ownerId: 'member-1',
          ownerName: '운영 사용자',
          reportDate: today,
          projectId: 'project-1',
          pageId: 'page-1',
          projectName: '접근성 포털',
          pageName: '메인',
          type1: '기획',
          type2: '작성',
          workHours: 60,
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
      reports: [
        {
          id: 'report-1',
          ownerId: 'member-1',
          ownerName: '운영 사용자',
          reportDate: today,
          projectId: 'project-1',
          pageId: 'page-1',
          projectName: '접근성 포털',
          pageName: '메인',
          type1: '기획',
          type2: '작성',
          workHours: 60,
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
      setDraftField: vi.fn(),
      setProjectQuery: vi.fn(),
      applyProjectQuery: vi.fn(),
      setPeriodField: vi.fn(),
      applyPeriodFilters: vi.fn(),
      selectReport: vi.fn(),
      startNewReport: vi.fn(),
      saveDraft: vi.fn(),
      saveOverheadReport: vi.fn(),
      jumpDraftDate: vi.fn(),
      setActiveTab: vi.fn(),
      statusMessage: '',
      draftPages: [],
      taskTypes: [],
      type1Options: ['기획'],
      type2Options: ['작성'],
      isSaving: false,
      projectOptions: [],
    });

    render(
      <MemoryRouter>
        <ReportsPage />
      </MemoryRouter>,
    );

    expect(screen.queryByRole('button', { name: '업무저장' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '오버헤드 입력' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '수정' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '삭제' })).not.toBeInTheDocument();
    expect(screen.queryByText('오늘의 입력시간')).not.toBeInTheDocument();
    expect(screen.queryByText('미입력 시간')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '이전일 조회' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '오늘 조회' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다음일 조회' })).toBeInTheDocument();
  });
});
