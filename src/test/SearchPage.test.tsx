import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SearchPage } from '../pages/search/SearchPage';
import { parseLocalDateInput, toLocalDateInputValue } from '../utils';

const mockUseAuth = vi.hoisted(() => vi.fn());
const mockDataClient = vi.hoisted(() => ({
  mode: 'supabase' as const,
  getMembers: vi.fn(),
  getMemberByEmail: vi.fn(),
  getMemberByAuthId: vi.fn(),
  getTaskTypes: vi.fn(),
  getServiceGroups: vi.fn(),
  getProjects: vi.fn(),
  saveProject: vi.fn(),
  getProjectSubtasks: vi.fn(),
  getAllProjectSubtasks: vi.fn(),
  saveProjectSubtask: vi.fn(),
  getTasksByDate: vi.fn(),
  saveTask: vi.fn(),
  deleteTask: vi.fn(),
  searchTasksPage: vi.fn(),
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

describe('SearchPage', () => {
  const today = parseLocalDateInput(toLocalDateInputValue(new Date())) ?? new Date();
  const monthStart = toLocalDateInputValue(new Date(today.getFullYear(), today.getMonth(), 1));
  const monthEnd = toLocalDateInputValue(new Date(today.getFullYear(), today.getMonth() + 1, 0));

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

    mockDataClient.getProjects.mockResolvedValue([
      {
        id: 'project-1',
        createdByMemberId: null,
        name: '알파',
        platform: 'iOS',
        serviceGroupId: null,
        reportUrl: '',
        reporterMemberId: null,
        reviewerMemberId: null,
        startDate: '2026-03-01',
        endDate: '2026-03-31',
        isActive: true,
      },
    ]);
    mockDataClient.getProjectSubtasks.mockResolvedValue([
      {
        id: 'page-1',
        projectId: 'project-1',
        title: '로그인',
        url: 'https://example.com/login',
        ownerMemberId: 'member-1',
        taskStatus: '전체 수정',
        taskMonth: '2026-03',
        note: '',
        updatedAt: '2026-03-24T09:00:00.000Z',
      },
    ]);
    mockDataClient.getServiceGroups.mockResolvedValue([]);
    mockDataClient.searchTasksPage.mockResolvedValue({
      items: [
        {
          id: 'task-1',
          taskDate: '2026-03-24',
          costGroupId: 'cost-group-1',
          costGroupName: '내부',
          taskType1: '기획',
          taskType2: '작성',
          taskUsedtime: 60,
          content: '업무',
          note: '비고',
          updatedAt: '2026-03-24T09:00:00.000Z',
          platform: 'iOS',
          serviceGroupName: '-',
          serviceName: '-',
          projectName: '알파',
          subtaskTitle: '로그인',
          url: 'https://example.com/login',
        },
      ],
      totalCount: 1,
    });
  });

  it('renders the filtered result table with current-month defaults', async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <SearchPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '검색' })).toBeInTheDocument();
    });

    expect(mockDataClient.searchTasksPage).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'member-1' }),
      expect.objectContaining({ startDate: monthStart, endDate: monthEnd, query: null }),
      1,
      25,
    );
    expect(screen.getByLabelText('시작일')).toHaveAttribute('max', monthEnd);
    expect(screen.getByLabelText('종료일')).toHaveAttribute('min', monthStart);

    await user.type(screen.getByLabelText('검색어'), '로그인');
    await user.click(screen.getByRole('button', { name: '검색' }));

    await waitFor(() => {
      expect(mockDataClient.searchTasksPage).toHaveBeenLastCalledWith(
        expect.objectContaining({ id: 'member-1' }),
        expect.objectContaining({ startDate: monthStart, endDate: monthEnd, query: '로그인' }),
        1,
        25,
      );
    });

    expect(screen.getByRole('button', { name: '다운로드' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /청구그룹 정렬/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /서비스 그룹 정렬/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /과업명 정렬/ })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '내용' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /작업시간 정렬/ })).toBeInTheDocument();
    expect(screen.getAllByText('알파').length).toBeGreaterThan(0);
    expect(screen.getByText('로그인')).toBeInTheDocument();
    expect(screen.getAllByText('60분').length).toBeGreaterThan(0);
    expect(screen.getByText('1건')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('sorts the visible rows by sortable table headers', async () => {
    const user = userEvent.setup();
    mockDataClient.searchTasksPage.mockResolvedValue({
      items: [
        {
          id: 'task-1',
          taskDate: '2026-03-24',
          costGroupId: 'cost-group-1',
          costGroupName: '내부',
          taskType1: '기획',
          taskType2: '작성',
          taskUsedtime: 90,
          content: '긴 업무',
          note: '',
          updatedAt: '2026-03-24T09:00:00.000Z',
          platform: 'iOS',
          serviceGroupName: '공통',
          serviceName: '앱',
          projectName: '알파',
          subtaskTitle: '로그인',
          url: '',
        },
        {
          id: 'task-2',
          taskDate: '2026-03-23',
          costGroupId: 'cost-group-2',
          costGroupName: '외부',
          taskType1: 'QA',
          taskType2: '검수',
          taskUsedtime: 30,
          content: '짧은 업무',
          note: '',
          updatedAt: '2026-03-23T09:00:00.000Z',
          platform: 'Android',
          serviceGroupName: '검색',
          serviceName: '웹',
          projectName: '베타',
          subtaskTitle: '검색',
          url: '',
        },
      ],
      totalCount: 2,
    });

    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <SearchPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('긴 업무')).toBeInTheDocument();
    });

    const tables = screen.getAllByRole('table', { name: '업무 리스트 테이블' });
    const table = tables[tables.length - 1];
    const firstDataRow = () => within(table).getAllByRole('row')[1];

    expect(firstDataRow()).toHaveTextContent('긴 업무');

    const sortButtons = screen.getAllByRole('button', { name: /작업시간 정렬/ });
    await user.click(sortButtons[sortButtons.length - 1]);

    expect(firstDataRow()).toHaveTextContent('짧은 업무');
    expect(
      within(table).getByRole('columnheader', { name: /작업시간 오름차순으로 정렬 중/ }),
    ).toBeInTheDocument();
  });
});
