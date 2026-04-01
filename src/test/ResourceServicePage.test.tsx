import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ResourceServicePage } from '../features/resource/ResourceServicePage';

const mockUseAuth = vi.hoisted(() => vi.fn());
const mockOpsDataClient = vi.hoisted(() => ({
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
  getProjectPages: vi.fn(),
  getAllProjectPages: vi.fn(),
  saveProjectPage: vi.fn(),
  getTasks: vi.fn(),
  getAllTasks: vi.fn(),
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

vi.mock('../lib/dataClient', () => ({
  opsDataClient: mockOpsDataClient,
}));

describe('ResourceServicePage', () => {
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

    mockOpsDataClient.getMembers.mockResolvedValue([
      {
        id: 'member-1',
        accountId: 'legacy-1',
        name: '운영 사용자',
        email: 'operator@example.com',
        joinedAt: '2026-03-01',
        role: 'user',
        isActive: true,
      },
    ]);
    mockOpsDataClient.getTaskTypes.mockResolvedValue([]);
    mockOpsDataClient.getServiceGroups.mockResolvedValue([
      {
        id: 'service-group-1',
        legacyServiceGroupId: 'legacy-service-group-1',
        name: '커머스 / 선물하기',
        displayOrder: 1,
      },
      {
        id: 'service-group-2',
        legacyServiceGroupId: 'legacy-service-group-2',
        name: '플랫폼 / 카카오맵',
        displayOrder: 2,
      },
    ]);
    mockOpsDataClient.getProjects.mockResolvedValue([
      {
        id: 'project-1',
        legacyProjectId: 'legacy-project-1',
        createdByMemberId: null,
        name: '선물하기',
        projectType1: 'QA',
        platform: 'iOS',
        serviceGroupId: 'service-group-1',
        reportUrl: '',
        reporterMemberId: 'member-1',
        reviewerMemberId: null,
        startDate: '2023-04-01',
        endDate: '2023-04-30',
        isActive: true,
      },
      {
        id: 'project-2',
        legacyProjectId: 'legacy-project-2',
        createdByMemberId: null,
        name: '카카오맵',
        projectType1: 'QA',
        platform: 'Android',
        serviceGroupId: 'service-group-2',
        reportUrl: '',
        reporterMemberId: 'member-1',
        reviewerMemberId: null,
        startDate: '2023-05-01',
        endDate: '2023-05-31',
        isActive: true,
      },
      {
        id: 'project-3',
        legacyProjectId: 'legacy-project-3',
        createdByMemberId: null,
        name: '카카오 T',
        projectType1: 'QA',
        platform: 'Web',
        serviceGroupId: 'service-group-1',
        reportUrl: '',
        reporterMemberId: 'member-1',
        reviewerMemberId: null,
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        isActive: true,
      },
    ]);
    mockOpsDataClient.getTasks.mockResolvedValue([
      {
        id: 'task-1',
        legacyTaskId: 'legacy-task-1',
        memberId: 'member-1',
        taskDate: '2023-04-03',
        projectId: 'project-1',
        pageId: null,
        taskType1: 'QA',
        taskType2: '사전준비',
        hours: 60,
        content: '',
        note: '',
        createdAt: '2026-03-29T00:00:00.000Z',
        updatedAt: '2026-03-29T00:00:00.000Z',
      },
      {
        id: 'task-2',
        legacyTaskId: 'legacy-task-2',
        memberId: 'member-1',
        taskDate: '2023-05-03',
        projectId: 'project-2',
        pageId: null,
        taskType1: 'QA',
        taskType2: '리뷰',
        hours: 120,
        content: '',
        note: '',
        createdAt: '2026-03-29T00:00:00.000Z',
        updatedAt: '2026-03-29T00:00:00.000Z',
      },
      {
        id: 'task-3',
        legacyTaskId: 'legacy-task-3',
        memberId: 'member-1',
        taskDate: '2024-01-15',
        projectId: 'project-3',
        pageId: null,
        taskType1: 'QA',
        taskType2: '사전준비',
        hours: 60,
        content: '',
        note: '',
        createdAt: '2026-03-29T00:00:00.000Z',
        updatedAt: '2026-03-29T00:00:00.000Z',
      },
    ]);
  });

  it('shows only the selected year table and switches with tabs', async () => {
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <ResourceServicePage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: '2024년' })).toHaveAttribute('aria-selected', 'true');
    });

    expect(screen.getByRole('tab', { name: '2023년' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '커머스' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '선물하기' })).toBeInTheDocument();
    expect(screen.queryByRole('cell', { name: '플랫폼' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: '2023년' }));

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: '2023년' })).toHaveAttribute('aria-selected', 'true');
    });

    expect(screen.getByRole('cell', { name: '커머스' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '선물하기' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '플랫폼' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '카카오맵' })).toBeInTheDocument();
    expect(screen.queryAllByRole('cell', { name: '선물하기' })).toHaveLength(1);
  });

  it('renders folded month summary rows directly after each month group like the legacy page', async () => {
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <ResourceServicePage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: '2023년' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('tab', { name: '2023년' }));

    await waitFor(() => {
      expect(screen.getByRole('cell', { name: '커머스' })).toBeInTheDocument();
    });

    expect(screen.getByRole('cell', { name: '선물하기' })).toBeInTheDocument();
    expect(screen.queryByRole('cell', { name: '커머스 / 선물하기' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '접기' }));

    const rows = within(screen.getByRole('table')).getAllByRole('row');
    const bodyRows = rows.slice(1);
    const rowTexts = bodyRows.map((row) => row.textContent ?? '');

    expect(rowTexts.findIndex((text) => text.includes('04월 합계'))).toBeGreaterThan(
      rowTexts.findIndex((text) => text.includes('커머스')),
    );
    expect(rowTexts.findIndex((text) => text.includes('05월 합계'))).toBeGreaterThan(
      rowTexts.findIndex((text) => text.includes('플랫폼')),
    );
    expect(rowTexts.findIndex((text) => text.includes('04월 합계'))).toBeLessThan(
      rowTexts.findIndex((text) => text.includes('플랫폼')),
    );
  });

  it('renders month and year summary rows without trailing empty cells', async () => {
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <ResourceServicePage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: '2023년' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('tab', { name: '2023년' }));

    await waitFor(() => {
      expect(screen.getByRole('cell', { name: '커머스' })).toBeInTheDocument();
    });

    const rows = within(screen.getByRole('table')).getAllByRole('row');
    const monthSummaryRow = rows.find((row) => row.textContent?.includes('04월 합계'));
    const yearSummaryRow = rows.find((row) => row.textContent?.includes('2023년 합계'));

    expect(monthSummaryRow).toBeDefined();
    expect(yearSummaryRow).toBeDefined();
    expect(within(monthSummaryRow!).getAllByRole('cell')).toHaveLength(2);
    expect(within(yearSummaryRow!).getAllByRole('cell')).toHaveLength(2);
  });
});
