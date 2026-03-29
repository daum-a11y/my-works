import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SearchPage } from '../features/search/search-page';
import { parseLocalDateInput, toLocalDateInputValue } from '../lib/utils';

const mockUseAuth = vi.hoisted(() => vi.fn());
const mockOpsDataClient = vi.hoisted(() => ({
  mode: 'supabase' as const,
  getMembers: vi.fn(),
  getMemberByEmail: vi.fn(),
  getMemberByAuthId: vi.fn(),
  getTaskTypes: vi.fn(),
  getServiceGroups: vi.fn(),
  getProjects: vi.fn(),
  saveProject: vi.fn(),
  getProjectPages: vi.fn(),
  getAllProjectPages: vi.fn(),
  saveProjectPage: vi.fn(),
  getTasks: vi.fn(),
  saveTask: vi.fn(),
  deleteTask: vi.fn(),
  searchTasks: vi.fn(),
  exportTasks: vi.fn(),
  getDashboard: vi.fn(),
  getStats: vi.fn(),
}));

vi.mock('../features/auth/AuthContext', () => ({
  useAuth: mockUseAuth,
}));

vi.mock('../lib/data-client', () => ({
  opsDataClient: mockOpsDataClient,
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
          legacyUserId: 'legacy-1',
          name: '운영 사용자',
          email: 'operator@example.com',
          role: 'user',
          isActive: true,
        },
      },
    });

    mockOpsDataClient.getProjects.mockResolvedValue([
      {
        id: 'project-1',
        legacyProjectId: 'legacy-project-1',
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
    mockOpsDataClient.getProjectPages.mockResolvedValue([
      {
        id: 'page-1',
        legacyPageId: 'legacy-page-1',
        projectId: 'project-1',
        title: '로그인',
        url: 'https://example.com/login',
        ownerMemberId: 'member-1',
        trackStatus: '전체 수정',
        monitoringInProgress: true,
        qaInProgress: false,
        note: '',
        updatedAt: '2026-03-24T09:00:00.000Z',
      },
    ]);
    mockOpsDataClient.getServiceGroups.mockResolvedValue([]);
    mockOpsDataClient.searchTasks.mockResolvedValue([
      {
        id: 'task-1',
        legacyTaskId: 'legacy-task-1',
        memberId: 'member-1',
        taskDate: '2026-03-24',
        projectId: 'project-1',
        pageId: 'page-1',
        taskType1: '기획',
        taskType2: '작성',
        hours: 60,
        content: '업무',
        note: '비고',
        createdAt: '2026-03-24T09:00:00.000Z',
        updatedAt: '2026-03-24T09:00:00.000Z',
      },
    ]);
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

    expect(mockOpsDataClient.searchTasks).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'member-1' }),
      expect.objectContaining({ startDate: monthStart, endDate: monthEnd, query: '' }),
    );

    await user.type(screen.getByLabelText('검색어'), '로그인');
    await user.click(screen.getByRole('button', { name: '검색' }));

    await waitFor(() => {
      expect(mockOpsDataClient.searchTasks).toHaveBeenLastCalledWith(
        expect.objectContaining({ id: 'member-1' }),
        expect.objectContaining({ startDate: monthStart, endDate: monthEnd, query: '로그인' }),
      );
    });

    expect(screen.getByRole('button', { name: '다운로드' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '서비스그룹' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '페이지명' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '내용' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '작업시간' })).toBeInTheDocument();
    expect(screen.getAllByText('알파').length).toBeGreaterThan(0);
    expect(screen.getByText('로그인')).toBeInTheDocument();
    expect(screen.getAllByText('60분').length).toBeGreaterThan(0);
    expect(screen.getByText('1건')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });
});
