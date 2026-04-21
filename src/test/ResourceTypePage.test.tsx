import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ResourceTypePage } from '../pages/resource/ResourceTypePage';

const mockUseAuth = vi.hoisted(() => vi.fn());
const mockDataClient = vi.hoisted(() => ({
  mode: 'supabase' as const,
  getMembers: vi.fn(),
  getMemberByAccountId: vi.fn(),
  getMemberByEmail: vi.fn(),
  getMemberByAuthId: vi.fn(),
  bindAuthSessionMember: vi.fn(),
  getTaskTypes: vi.fn(),
  getServiceGroups: vi.fn(),
  getProjects: vi.fn(),
  saveProject: vi.fn(),
  getProjectSubtasks: vi.fn(),
  getAllProjectSubtasks: vi.fn(),
  getResourceTypeSummaryYears: vi.fn(),
  getResourceTypeSummaryByYear: vi.fn(),
  saveProjectSubtask: vi.fn(),
  getTasks: vi.fn(),
  getAllTasks: vi.fn(),
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

describe('ResourceTypePage', () => {
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

    mockDataClient.getResourceTypeSummaryYears.mockResolvedValue(['2024', '2023']);
    mockDataClient.getResourceTypeSummaryByYear.mockImplementation(
      async (_member: unknown, year: string) => {
        if (year === '2024') {
          return [
            {
              year: '2024',
              month: '02',
              taskType1: '모니터링',
              taskType2: '점검',
              taskUsedtime: 60,
            },
          ];
        }

        return [
          {
            year: '2023',
            month: '04',
            taskType1: 'QA',
            taskType2: '사전준비',
            taskUsedtime: 180,
          },
          {
            year: '2023',
            month: '04',
            taskType1: 'QA',
            taskType2: '리뷰',
            taskUsedtime: 120,
          },
          {
            year: '2023',
            month: '04',
            taskType1: '일반버퍼',
            taskType2: '지원',
            taskUsedtime: 60,
          },
        ];
      },
    );
  });

  it('shows type1 and type2 rows when expanded', async () => {
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <ResourceTypePage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /^2024년/ })).toBeInTheDocument();
      expect(screen.getAllByRole('cell', { name: '모니터링' }).length).toBeGreaterThan(0);
    });

    expect(screen.getByRole('tab', { name: /^2023년/ })).toBeInTheDocument();
    expect(screen.getAllByRole('cell', { name: '모니터링' }).length).toBeGreaterThan(0);
    expect(screen.getByRole('cell', { name: '점검' })).toBeInTheDocument();
  });

  it('shows only the selected year table and switches with tabs', async () => {
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <ResourceTypePage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /^2024년/ })).toHaveAttribute('aria-selected', 'true');
      expect(screen.getAllByRole('cell', { name: '모니터링' }).length).toBeGreaterThan(0);
    });

    expect(screen.getByRole('cell', { name: '2024년 합계' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '모니터링' })).toBeInTheDocument();
    expect(screen.queryByRole('cell', { name: 'QA' })).not.toBeInTheDocument();

    screen.getByRole('tab', { name: /^2023년/ }).click();

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /^2023년/ })).toHaveAttribute('aria-selected', 'true');
      expect(screen.getAllByRole('cell', { name: 'QA' })).toHaveLength(1);
    });

    expect(screen.getAllByRole('cell', { name: 'QA' })).toHaveLength(1);
    expect(screen.getByRole('cell', { name: '일반버퍼' })).toBeInTheDocument();
    expect(screen.queryByRole('cell', { name: '모니터링' })).not.toBeInTheDocument();
  });

  it('renders month and year summary rows without trailing empty cells', async () => {
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <ResourceTypePage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /^2023년/ })).toBeInTheDocument();
    });

    screen.getByRole('tab', { name: /^2023년/ }).click();

    await waitFor(() => {
      expect(screen.getAllByRole('cell', { name: 'QA' })).toHaveLength(1);
    });

    const rows = within(screen.getByRole('table')).getAllByRole('row');
    const monthSummaryRow = rows.find((row) => row.textContent?.includes('04월 합계'));
    const yearSummaryRow = rows.find((row) => row.textContent?.includes('2023년 합계'));

    expect(monthSummaryRow).toBeDefined();
    expect(yearSummaryRow).toBeDefined();
    expect(within(monthSummaryRow!).getAllByRole('cell')).toHaveLength(2);
    expect(within(yearSummaryRow!).getAllByRole('cell')).toHaveLength(2);
  });

  it('folds rows into type1 totals and expands back to type1/type2 details', async () => {
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <ResourceTypePage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: '2023년' })).toBeInTheDocument();
    });

    screen.getByRole('tab', { name: '2023년' }).click();

    await waitFor(() => {
      expect(screen.getByRole('cell', { name: '사전준비' })).toBeInTheDocument();
      expect(screen.getByRole('cell', { name: '리뷰' })).toBeInTheDocument();
    });

    expect(screen.getByRole('cell', { name: 'QA' })).toHaveAttribute('rowspan', '2');

    screen.getByRole('button', { name: '접기' }).click();

    await waitFor(() => {
      expect(screen.getAllByRole('cell', { name: '합계' })).toHaveLength(2);
    });

    expect(screen.queryByRole('cell', { name: '사전준비' })).not.toBeInTheDocument();
    expect(screen.queryByRole('cell', { name: '리뷰' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('cell', { name: 'QA' })).toHaveLength(1);

    screen.getByRole('button', { name: '펼치기' }).click();

    await waitFor(() => {
      expect(screen.getByRole('cell', { name: '사전준비' })).toBeInTheDocument();
      expect(screen.getByRole('cell', { name: '리뷰' })).toBeInTheDocument();
    });
  });
});
