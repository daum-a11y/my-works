import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TaskMonitoringPage } from '../pages/stats';
import { getCurrentMonth, shiftMonth } from '../pages/resource/resourceUtils';

const mockUseAuth = vi.hoisted(() => vi.fn());
const mockDataClient = vi.hoisted(() => ({
  mode: 'supabase' as const,
  getMonitoringStatsRows: vi.fn(),
}));

vi.mock('../auth/AuthContext', () => ({
  useAuth: mockUseAuth,
}));

vi.mock('../api/client', () => ({
  dataClient: mockDataClient,
}));

type MockMonitoringStatsRow = {
  subtask_id: string;
  project_id: string;
  type1: string;
  title: string;
  url: string;
  owner_member_id: string | null;
  owner_account_id: string;
  owner_name: string;
  task_date: string;
  task_status: string;
  note: string;
  updated_at: string;
  cost_group_name: string;
  service_group_name: string;
  service_name: string;
  project_name: string;
  platform: string;
  report_url: string;
};

const monitoringRows: MockMonitoringStatsRow[] = [
  {
    subtask_id: 'subtask-1',
    project_id: 'project-1',
    type1: 'QA',
    title: '메인 화면 점검',
    url: 'https://example.com/subtask-1',
    owner_member_id: 'member-1',
    owner_account_id: 'legacy-1',
    owner_name: '운영 사용자',
    task_date: '2026-03-15',
    task_status: '일부 수정',
    note: '',
    updated_at: '2026-03-16T09:00:00Z',
    cost_group_name: '청구그룹A',
    service_group_name: '서비스 그룹A',
    service_name: '서비스A',
    project_name: 'QA 대상',
    platform: 'iOS',
    report_url: 'https://example.com/project-1',
  },
  {
    subtask_id: 'subtask-2',
    project_id: 'project-2',
    type1: '모니터링',
    title: '배치 점검',
    url: '',
    owner_member_id: 'member-2',
    owner_account_id: 'legacy-2',
    owner_name: '담당자',
    task_date: '2026-02-03',
    task_status: '미수정',
    note: '',
    updated_at: '2026-02-04T09:00:00Z',
    cost_group_name: '청구그룹B',
    service_group_name: '서비스 그룹B',
    service_name: '서비스B',
    project_name: '운영 점검',
    platform: 'Web',
    report_url: '',
  },
];

function monthInRange(value: string, startMonth: string, endMonth: string) {
  return value >= `${startMonth}-01` && value <= `${endMonth}-31`;
}

function compareText(left: string | null | undefined, right: string | null | undefined) {
  return (left ?? '').localeCompare(right ?? '', 'ko');
}

function taskStatusOrder(value: string) {
  switch (value) {
    case '미수정':
      return 0;
    case '일부 수정':
      return 1;
    case '전체 수정':
      return 2;
    default:
      return 99;
  }
}

function sortMonitoringRows(
  rows: MockMonitoringStatsRow[],
  sortKey: string,
  sortDirection: 'asc' | 'desc',
) {
  const direction = sortDirection === 'asc' ? 1 : -1;

  return [...rows].sort((left, right) => {
    const result = (() => {
      switch (sortKey) {
        case 'costGroupName':
          return compareText(left.cost_group_name, right.cost_group_name);
        case 'type1':
          return compareText(left.type1, right.type1);
        case 'serviceName':
          return compareText(left.service_name, right.service_name);
        case 'platform':
          return compareText(left.platform, right.platform);
        case 'projectName':
          return compareText(left.project_name, right.project_name);
        case 'title':
          return compareText(left.title, right.title);
        case 'ownerAccountId':
          return compareText(left.owner_account_id, right.owner_account_id);
        case 'taskStatus':
          return taskStatusOrder(left.task_status) - taskStatusOrder(right.task_status);
        case 'month':
        default:
          return compareText(left.task_date, right.task_date);
      }
    })();

    if (result !== 0) {
      return result * direction;
    }

    return compareText(left.subtask_id, right.subtask_id);
  });
}

describe('TaskMonitoringPage', () => {
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

    mockDataClient.getMonitoringStatsRows.mockImplementation(async (filters) => {
      const keyword = String(filters.query ?? '')
        .trim()
        .toLowerCase();
      const filteredRows = monitoringRows.filter((row) => {
        if (!monthInRange(row.task_date, filters.startMonth, filters.endMonth)) {
          return false;
        }
        if (!keyword) {
          return true;
        }

        return [
          row.cost_group_name,
          row.service_group_name,
          row.service_name,
          row.project_name,
          row.title,
          row.platform,
          row.owner_account_id,
          row.owner_name,
          row.task_status,
        ].some((value) => value.toLowerCase().includes(keyword));
      });

      return sortMonitoringRows(filteredRows, filters.sortKey, filters.sortDirection);
    });
  });

  it('shows task monitoring rows and applies search filters', async () => {
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <TaskMonitoringPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('메인 화면 점검')).toBeInTheDocument();
    });

    expect(mockDataClient.getMonitoringStatsRows).toHaveBeenCalledWith({
      startMonth: defaultStartMonth,
      endMonth: defaultEndMonth,
      query: null,
      sortKey: 'month',
      sortDirection: 'desc',
    });
    expect(screen.getByRole('heading', { name: '태스크 현황', level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /상태 정렬/ })).toBeInTheDocument();
    expect(screen.getByText('2026/03')).toBeInTheDocument();
    expect(screen.getByText('legacy-1(운영 사용자)')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('태스크 현황 검색'), {
      target: { value: '배치' },
    });
    fireEvent.click(screen.getByRole('button', { name: '검색' }));

    await waitFor(() => {
      expect(mockDataClient.getMonitoringStatsRows).toHaveBeenLastCalledWith({
        startMonth: defaultStartMonth,
        endMonth: defaultEndMonth,
        query: '배치',
        sortKey: 'month',
        sortDirection: 'desc',
      });
    });

    await waitFor(() => {
      expect(screen.queryByText('메인 화면 점검')).not.toBeInTheDocument();
      expect(screen.getByText('배치 점검')).toBeInTheDocument();
    });
  });
});
