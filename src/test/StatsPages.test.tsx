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
  getProjectSubtasks: vi.fn(),
  getAllProjectSubtasks: vi.fn(),
  getProjectSubtasksByProjectId: vi.fn(),
  getProjectSubtasksByProjectIds: vi.fn(),
  getMonitoringStatsRows: vi.fn(),
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
  report_url: string;
  reporter_display: string;
  reviewer_display: string;
  start_date: string;
  end_date: string;
  subtask_count: number;
  untouched_subtask_count: number;
  partial_subtask_count: number;
  completed_subtask_count: number;
};

const projectRows: MockProjectStatsRow[] = [
  {
    project_id: 'project-1',
    type1: 'QA',
    project_name: 'QA 대상',
    platform: 'iOS',
    cost_group_name: '청구그룹A',
    service_group_name: '서비스 그룹A',
    report_url: 'https://example.com/project-1',
    reporter_display: 'legacy-1(운영 사용자)',
    reviewer_display: 'legacy-2(리뷰어)',
    start_date: '2026-03-01',
    end_date: '2026-03-31',
    subtask_count: 2,
    untouched_subtask_count: 1,
    partial_subtask_count: 0,
    completed_subtask_count: 1,
  },
  {
    project_id: 'project-2',
    type1: 'QA',
    project_name: '과업 없는 QA 프로젝트',
    platform: 'Android',
    cost_group_name: '청구그룹B',
    service_group_name: '서비스 그룹B',
    report_url: '',
    reporter_display: 'legacy-1(운영 사용자)',
    reviewer_display: '',
    start_date: '2026-02-01',
    end_date: '2026-02-28',
    subtask_count: 0,
    untouched_subtask_count: 0,
    partial_subtask_count: 0,
    completed_subtask_count: 0,
  },
  {
    project_id: 'project-3',
    type1: '모니터링',
    project_name: '과거 모니터링 프로젝트',
    platform: 'Web',
    cost_group_name: '청구그룹A',
    service_group_name: '서비스 그룹A',
    report_url: '',
    reporter_display: 'legacy-3(담당자)',
    reviewer_display: '',
    start_date: '2025-07-01',
    end_date: '2025-07-31',
    subtask_count: 1,
    untouched_subtask_count: 1,
    partial_subtask_count: 0,
    completed_subtask_count: 0,
  },
];

const subtaskRows = [
  {
    id: 'subtask-1',
    project_id: 'project-1',
    owner_member_id: 'member-1',
    title: '메인 점검',
    url: 'https://example.com/subtask-1',
    task_month: '2603',
    task_status: '전체 수정',
    note: '수정 완료',
    updated_at: '2026-03-24T09:00:00.000Z',
  },
  {
    id: 'subtask-2',
    project_id: 'project-1',
    owner_member_id: 'member-2',
    title: '서브 점검',
    url: '',
    task_month: '2603',
    task_status: '미수정',
    note: '',
    updated_at: '2026-03-23T09:00:00.000Z',
  },
  {
    id: 'subtask-3',
    project_id: 'project-3',
    owner_member_id: 'member-3',
    title: '과거 점검',
    url: '',
    task_month: '2507',
    task_status: '미수정',
    note: '',
    updated_at: '2025-07-23T09:00:00.000Z',
  },
];

function monthInRange(value: string, startMonth: string, endMonth: string) {
  return value >= `${startMonth}-01` && value <= `${endMonth}-31`;
}

function taskMonthToDateString(taskMonth: string) {
  const digits = taskMonth.replace(/\D/g, '');
  if (digits.length === 4) {
    return `20${digits.slice(0, 2)}-${digits.slice(2, 4)}-01`;
  }
  if (digits.length === 6) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-01`;
  }
  if (digits.length === 8) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
  }
  return '';
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
        case 'subtaskCount':
          return left.subtask_count - right.subtask_count;
        case 'untouchedSubtaskCount':
          return left.untouched_subtask_count - right.untouched_subtask_count;
        case 'partialSubtaskCount':
          return left.partial_subtask_count - right.partial_subtask_count;
        case 'completedSubtaskCount':
          return left.completed_subtask_count - right.completed_subtask_count;
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
    mockDataClient.getMembers.mockResolvedValue([
      { id: 'member-1', account_id: 'legacy-1', name: '운영 사용자' },
      { id: 'member-2', account_id: 'legacy-2', name: '담당자B' },
      { id: 'member-3', account_id: 'legacy-3', name: '담당자C' },
    ]);
    mockDataClient.getProjectStatsRows.mockImplementation(async (filters) => {
      const filteredRows = projectRows.filter((row) => {
        if (filters.periodBasis === 'subtask') {
          const matchingSubtasks = subtaskRows.filter(
            (subtask) =>
              subtask.project_id === row.project_id &&
              monthInRange(taskMonthToDateString(subtask.task_month), filters.startMonth, filters.endMonth),
          );
          if (!matchingSubtasks.length) {
            return false;
          }
        } else if (!monthInRange(row.end_date, filters.startMonth, filters.endMonth)) {
          return false;
        }
        if (filters.taskType1 && row.type1 !== filters.taskType1) {
          return false;
        }
        return true;
      });
      return sortProjectRows(filteredRows, filters.sortKey, filters.sortDirection);
    });
    mockDataClient.getProjectSubtasksByProjectIds.mockImplementation(async (projectIds, options) =>
      subtaskRows.filter((row) => {
        if (!projectIds.includes(row.project_id)) {
          return false;
        }
        return true;
      }),
    );
    mockDataClient.getMonitoringStatsRows.mockImplementation(async (filters) =>
      subtaskRows.filter((row) => {
        const dateValue = taskMonthToDateString(row.task_month);
        if (!dateValue || !monthInRange(dateValue, filters.startMonth, filters.endMonth)) {
          return false;
        }
        if (!filters.taskType1) {
          return true;
        }
        const project = projectRows.find((projectRow) => projectRow.project_id === row.project_id);
        return project?.type1 === filters.taskType1;
      }),
    );
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
      taskType1: 'QA',
      periodBasis: 'project',
      sortKey: 'month',
      sortDirection: 'desc',
    });
    expect(screen.getByRole('heading', { name: '프로젝트 통계' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '월별 프로젝트 현황' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '프로젝트 목록' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /종료월 정렬/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /서브태스크 수 정렬/ })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'QA' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '모니터링' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: '일반업무' })).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: '전체' })).not.toBeInTheDocument();
    expect((screen.getByLabelText('프로젝트 통계 타입 1') as HTMLSelectElement).value).toBe('QA');
    expect(screen.getByText('과업 없는 QA 프로젝트')).toBeInTheDocument();
    expect(screen.getByText('과업 없음')).toBeInTheDocument();
    expect(screen.getByText('2026/03')).toBeInTheDocument();
    expect(screen.getByText('2026/02')).toBeInTheDocument();
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

    fireEvent.change(screen.getByLabelText('프로젝트 통계 시작월'), { target: { value: '2025-07' } });
    fireEvent.change(screen.getByLabelText('프로젝트 통계 종료월'), { target: { value: '2025-07' } });
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
        periodBasis: 'project',
        sortKey: 'month',
        sortDirection: 'desc',
      });
    });
    await waitFor(() => {
      expect(screen.queryByText('QA 대상')).not.toBeInTheDocument();
      expect(screen.getByText('과거 모니터링 프로젝트')).toBeInTheDocument();
    });
  });

  it('sorts parent project rows on the server side', async () => {
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

    fireEvent.click(screen.getByRole('button', { name: /미수정 정렬/ }));

    await waitFor(() => {
      expect(mockDataClient.getProjectStatsRows).toHaveBeenLastCalledWith({
        startMonth: defaultStartMonth,
        endMonth: defaultEndMonth,
        taskType1: 'QA',
        periodBasis: 'project',
        sortKey: 'untouchedSubtaskCount',
        sortDirection: 'asc',
      });
    });

    await waitFor(() => {
      const rows = screen.getAllByRole('row');
      expect(rows[1]).toHaveTextContent('과업 없는 QA 프로젝트');
      expect(rows[2]).toHaveTextContent('QA 대상');
    });
  });

  it('expands a project row and shows only that project subtasks', async () => {
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

    fireEvent.click(screen.getByRole('button', { name: 'QA 대상 서브태스크 펼치기' }));

    await waitFor(() => {
      expect(mockDataClient.getProjectSubtasksByProjectIds).toHaveBeenLastCalledWith(['project-1']);
    });

    const detailRegion = await screen.findByRole('table', { name: 'QA 대상 서브태스크 목록' });
    expect(within(detailRegion).getByText('메인 점검')).toBeInTheDocument();
    expect(within(detailRegion).getByText('서브 점검')).toBeInTheDocument();
    expect(within(detailRegion).queryByText('과거 점검')).not.toBeInTheDocument();
    expect(within(detailRegion).getByText('legacy-1(운영 사용자)')).toBeInTheDocument();
    expect(within(detailRegion).getByText('legacy-2(담당자B)')).toBeInTheDocument();
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

  it('switches to subtask period basis and narrows projects by subtask month', async () => {
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

    fireEvent.change(screen.getByLabelText('프로젝트 통계 시작월'), { target: { value: '2025-07' } });
    fireEvent.change(screen.getByLabelText('프로젝트 통계 종료월'), { target: { value: '2025-07' } });
    fireEvent.change(screen.getByLabelText('프로젝트 통계 타입 1'), {
      target: { value: '모니터링' },
    });
    fireEvent.change(screen.getByLabelText('프로젝트 통계 기간 기준'), {
      target: { value: 'subtask' },
    });

    fireEvent.click(screen.getByRole('button', { name: '검색' }));

    await waitFor(() => {
      expect(mockDataClient.getProjectStatsRows).toHaveBeenLastCalledWith({
        startMonth: '2025-07',
        endMonth: '2025-07',
        taskType1: '모니터링',
        periodBasis: 'subtask',
        sortKey: 'month',
        sortDirection: 'desc',
      });
    });

    await waitFor(() => {
      expect(screen.getByText('과거 모니터링 프로젝트')).toBeInTheDocument();
      expect(screen.queryByText('QA 대상')).not.toBeInTheDocument();
    });
  });

  it('loads expanded subtasks from subtask period rows when subtask basis is selected', async () => {
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

    fireEvent.change(screen.getByLabelText('프로젝트 통계 시작월'), { target: { value: '2025-07' } });
    fireEvent.change(screen.getByLabelText('프로젝트 통계 종료월'), { target: { value: '2025-07' } });
    fireEvent.change(screen.getByLabelText('프로젝트 통계 타입 1'), {
      target: { value: '모니터링' },
    });
    fireEvent.change(screen.getByLabelText('프로젝트 통계 기간 기준'), {
      target: { value: 'subtask' },
    });

    fireEvent.click(screen.getByRole('button', { name: '검색' }));

    await waitFor(() => {
      expect(screen.getByText('과거 모니터링 프로젝트')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: '과거 모니터링 프로젝트 서브태스크 펼치기' }));

    await waitFor(() => {
      expect(mockDataClient.getMonitoringStatsRows).toHaveBeenLastCalledWith({
        startMonth: '2025-07',
        endMonth: '2025-07',
        taskType1: '모니터링',
        sortKey: 'month',
        sortDirection: 'desc',
      });
    });

    const detailRegion = await screen.findByRole('table', {
      name: '과거 모니터링 프로젝트 서브태스크 목록',
    });
    expect(within(detailRegion).getByText('과거 점검')).toBeInTheDocument();
    expect(within(detailRegion).getByText('2025/07')).toBeInTheDocument();
  });
});
