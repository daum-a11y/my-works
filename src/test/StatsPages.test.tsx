import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProjectStatsPage } from '../pages/stats';
import { getCurrentMonth, shiftMonth } from '../pages/resource/resourceUtils';

const mockUseAuth = vi.hoisted(() => vi.fn());
const mockDataClient = vi.hoisted(() => ({
  mode: 'supabase' as const,
  getMembers: vi.fn(),
  getMemberByEmail: vi.fn(),
  getMemberByAuthId: vi.fn(),
  getTaskTypes: vi.fn(),
  getServiceGroups: vi.fn(),
  getProjects: vi.fn(),
  getProjectStatsRows: vi.fn(),
  saveProject: vi.fn(),
  saveProjectSubtask: vi.fn(),
  getTasks: vi.fn(),
  saveTask: vi.fn(),
  deleteTask: vi.fn(),
  searchTasks: vi.fn(),
  exportTasks: vi.fn(),
  getDashboard: vi.fn(),
  getStats: vi.fn(),
}));

vi.mock('../auth/AuthContext', () => ({
  useAuth: mockUseAuth,
}));

vi.mock('../api/client', () => ({
  dataClient: mockDataClient,
}));

type MockProjectStatsRow = {
  project_id: string;
  type1: string;
  project_name: string;
  platform: string;
  cost_group_name: string;
  service_group_name: string;
  service_name: string;
  report_url: string;
  reporter_account_id: string;
  reporter_name: string;
  reviewer_account_id: string;
  reviewer_name: string;
  start_date: string;
  end_date: string;
  subtask_count: number;
};

const projectRows: MockProjectStatsRow[] = [
  {
    project_id: 'project-1',
    type1: 'QA',
    project_name: 'QA 대상',
    platform: 'iOS',
    cost_group_name: '청구그룹A',
    service_group_name: '서비스 그룹A',
    service_name: '서비스A',
    report_url: 'https://example.com/project-1',
    reporter_account_id: 'legacy-1',
    reporter_name: '운영 사용자',
    reviewer_account_id: 'legacy-2',
    reviewer_name: '리뷰어',
    start_date: '2026-03-01',
    end_date: '2026-03-31',
    subtask_count: 2,
  },
  {
    project_id: 'project-2',
    type1: 'QA',
    project_name: '태스크 없는 QA 프로젝트',
    platform: 'Android',
    cost_group_name: '청구그룹B',
    service_group_name: '서비스 그룹B',
    service_name: '서비스B',
    report_url: '',
    reporter_account_id: 'legacy-1',
    reporter_name: '운영 사용자',
    reviewer_account_id: '',
    reviewer_name: '',
    start_date: '2026-02-01',
    end_date: '2026-02-28',
    subtask_count: 0,
  },
  {
    project_id: 'project-3',
    type1: '모니터링',
    project_name: '과거 모니터링 프로젝트',
    platform: 'Web',
    cost_group_name: '청구그룹A',
    service_group_name: '서비스 그룹A',
    service_name: '서비스C',
    report_url: '',
    reporter_account_id: 'legacy-3',
    reporter_name: '담당자',
    reviewer_account_id: '',
    reviewer_name: '',
    start_date: '2025-07-01',
    end_date: '2025-07-31',
    subtask_count: 1,
  },
];

function monthInRange(value: string, startMonth: string, endMonth: string) {
  return value >= `${startMonth}-01` && value <= `${endMonth}-31`;
}

function compareText(left: string | null | undefined, right: string | null | undefined) {
  return (left ?? '').localeCompare(right ?? '', 'ko');
}

function sortProjectRows(
  rows: MockProjectStatsRow[],
  sortKey: string,
  sortDirection: 'asc' | 'desc',
) {
  const direction = sortDirection === 'asc' ? 1 : -1;
  return [...rows].sort((left, right) => {
    const result = (() => {
      switch (sortKey) {
        case 'type1':
          return compareText(left.type1, right.type1);
        case 'costGroupName':
          return compareText(left.cost_group_name, right.cost_group_name);
        case 'serviceGroupName':
          return compareText(left.service_group_name, right.service_group_name);
        case 'projectName':
          return compareText(left.project_name, right.project_name);
        case 'platform':
          return compareText(left.platform, right.platform);
        case 'reporterAccountId':
          return compareText(left.reporter_account_id, right.reporter_account_id);
        case 'reviewerAccountId':
          return compareText(left.reviewer_account_id, right.reviewer_account_id);
        case 'subtaskCount':
          return left.subtask_count - right.subtask_count;
        case 'month':
        default:
          return compareText(left.end_date, right.end_date);
      }
    })();
    if (result !== 0) {
      return result * direction;
    }
    return compareText(left.project_id, right.project_id);
  });
}

describe('Stats pages', () => {
  const defaultEndMonth = getCurrentMonth();
  const defaultStartMonth = shiftMonth(defaultEndMonth, -5);

  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      status: 'authenticated',
      session: {
        member: {
          id: 'member-1',
          accountId: 'legacy-1',
          name: '운영 사용자',
          email: 'operator@example.com',
          role: 'user',
          isActive: true,
        },
      },
    });

    mockDataClient.getTaskTypes.mockResolvedValue([
      {
        id: '1',
        type1: 'QA',
        type2: '리뷰',
        requires_service_group: true,
        display_order: 1,
        is_active: true,
      },
      {
        id: '2',
        type1: '모니터링',
        type2: '점검',
        requires_service_group: true,
        display_order: 2,
        is_active: true,
      },
      {
        id: '3',
        type1: '일반업무',
        type2: '회의',
        requires_service_group: false,
        display_order: 3,
        is_active: true,
      },
    ]);
    mockDataClient.getProjectStatsRows.mockImplementation(async (filters) => {
      const filteredRows = projectRows.filter((row) => {
        if (!monthInRange(row.end_date, filters.startMonth, filters.endMonth)) {
          return false;
        }
        if (filters.taskType1 && row.type1 !== filters.taskType1) {
          return false;
        }
        return true;
      });
      return sortProjectRows(filteredRows, filters.sortKey, filters.sortDirection);
    });
  });

  it('shows project rows, summary, and project-only type options', async () => {
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ProjectStatsPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('QA 대상')).toBeInTheDocument();
    });

    expect(mockDataClient.getProjectStatsRows).toHaveBeenCalledWith({
      startMonth: defaultStartMonth,
      endMonth: defaultEndMonth,
      taskType1: null,
      sortKey: 'month',
      sortDirection: 'desc',
    });
    expect(screen.getByRole('heading', { name: '프로젝트 통계' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '월별 프로젝트 현황' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '프로젝트 목록' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /종료월 정렬/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /서브태스크 수 정렬/ })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '전체' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'QA' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '모니터링' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: '일반업무' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('프로젝트 통계 기간 기준')).not.toBeInTheDocument();
    expect((screen.getByLabelText('프로젝트 통계 타입 1') as HTMLSelectElement).value).toBe('전체');
    expect(screen.getByText('태스크 없는 QA 프로젝트')).toBeInTheDocument();
    expect(screen.getAllByText('legacy-1(운영 사용자)').length).toBeGreaterThan(0);
    expect(screen.getByText('legacy-2(리뷰어)')).toBeInTheDocument();
    expect(screen.getAllByText('-').length).toBeGreaterThan(0);
    expect(screen.getByText('2026/03')).toBeInTheDocument();
    expect(screen.getByText('2026/02')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '표' }));
    const summaryTable = screen.getByRole('table', { name: '프로젝트 월별 표' });
    expect(
      within(summaryTable).queryByRole('columnheader', { name: '서브태스크 수' }),
    ).not.toBeInTheDocument();
    expect(
      within(summaryTable).getByRole('columnheader', { name: '전체 프로젝트 수' }),
    ).toBeInTheDocument();
    expect(within(summaryTable).getByRole('columnheader', { name: 'QA' })).toBeInTheDocument();
    expect(
      within(summaryTable).getByRole('columnheader', { name: '모니터링' }),
    ).toBeInTheDocument();
  });

  it('applies project period and type only after search is clicked', async () => {
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ProjectStatsPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('QA 대상')).toBeInTheDocument();
    });

    expect(mockDataClient.getProjectStatsRows).toHaveBeenLastCalledWith({
      startMonth: defaultStartMonth,
      endMonth: defaultEndMonth,
      taskType1: null,
      sortKey: 'month',
      sortDirection: 'desc',
    });

    fireEvent.change(screen.getByLabelText('프로젝트 통계 시작월'), {
      target: { value: '2025-07' },
    });
    fireEvent.change(screen.getByLabelText('프로젝트 통계 종료월'), {
      target: { value: '2025-07' },
    });
    fireEvent.change(screen.getByLabelText('프로젝트 통계 타입 1'), {
      target: { value: '모니터링' },
    });

    expect(screen.getByText('QA 대상')).toBeInTheDocument();
    expect(screen.queryByText('과거 모니터링 프로젝트')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '검색' }));

    await waitFor(() => {
      expect(mockDataClient.getProjectStatsRows).toHaveBeenLastCalledWith({
        startMonth: '2025-07',
        endMonth: '2025-07',
        taskType1: '모니터링',
        sortKey: 'month',
        sortDirection: 'desc',
      });
    });
    await waitFor(() => {
      expect(screen.queryByText('QA 대상')).not.toBeInTheDocument();
      expect(screen.getByText('과거 모니터링 프로젝트')).toBeInTheDocument();
    });
  });

  it('sorts parent project rows on the server side by reviewer', async () => {
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ProjectStatsPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('QA 대상')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('프로젝트 통계 타입 1'), {
      target: { value: 'QA' },
    });
    fireEvent.click(screen.getByRole('button', { name: '검색' }));

    await waitFor(() => {
      expect(mockDataClient.getProjectStatsRows).toHaveBeenLastCalledWith({
        startMonth: defaultStartMonth,
        endMonth: defaultEndMonth,
        taskType1: 'QA',
        sortKey: 'month',
        sortDirection: 'desc',
      });
    });

    fireEvent.click(screen.getByRole('button', { name: /리뷰어 정렬/ }));

    await waitFor(() => {
      expect(mockDataClient.getProjectStatsRows).toHaveBeenLastCalledWith({
        startMonth: defaultStartMonth,
        endMonth: defaultEndMonth,
        taskType1: 'QA',
        sortKey: 'reviewerAccountId',
        sortDirection: 'asc',
      });
    });

    await waitFor(() => {
      const projectTable = screen.getByRole('table', { name: '필터링된 프로젝트 목록' });
      const rows = within(projectTable).getAllByRole('row');
      expect(rows[1]).toHaveTextContent('태스크 없는 QA 프로젝트');
      expect(rows[2]).toHaveTextContent('QA 대상');
    });
  });

  it('does not render subtask accordion or removed status columns', async () => {
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ProjectStatsPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('QA 대상')).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: /서브태스크 펼치기/ })).not.toBeInTheDocument();
    expect(screen.queryByText('미수정')).not.toBeInTheDocument();
    expect(screen.queryByText('일부 수정')).not.toBeInTheDocument();
    expect(screen.queryByText('전체 수정')).not.toBeInTheDocument();
    expect(screen.queryByText('메인 점검')).not.toBeInTheDocument();
  });

  it('keeps the project stats page read-only', async () => {
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ProjectStatsPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('QA 대상')).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: '저장' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '수정' })).not.toBeInTheDocument();
    expect(mockDataClient.saveProjectSubtask).not.toHaveBeenCalled();
  });

  it('returns to single-series summary when a specific type is selected', async () => {
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ProjectStatsPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('QA 대상')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('프로젝트 통계 타입 1'), {
      target: { value: 'QA' },
    });
    fireEvent.click(screen.getByRole('button', { name: '검색' }));

    await waitFor(() => {
      expect(mockDataClient.getProjectStatsRows).toHaveBeenLastCalledWith({
        startMonth: defaultStartMonth,
        endMonth: defaultEndMonth,
        taskType1: 'QA',
        sortKey: 'month',
        sortDirection: 'desc',
      });
    });

    fireEvent.click(screen.getByRole('button', { name: '표' }));
    const summaryTable = screen.getByRole('table', { name: '프로젝트 월별 표' });
    expect(
      within(summaryTable).getByRole('columnheader', { name: '프로젝트 수' }),
    ).toBeInTheDocument();
    expect(
      within(summaryTable).queryByRole('columnheader', { name: 'QA' }),
    ).not.toBeInTheDocument();
    expect(
      within(summaryTable).queryByRole('columnheader', { name: '모니터링' }),
    ).not.toBeInTheDocument();
  });
});
