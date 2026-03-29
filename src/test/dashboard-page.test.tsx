import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DashboardPage } from '../features/dashboard';
import { getCurrentMonth, shiftMonth } from '../features/resource/resource-shared';

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
  getDashboard: vi.fn(),
  getStats: vi.fn(),
}));

vi.mock('../features/auth/AuthContext', () => ({
  useAuth: mockUseAuth,
}));

vi.mock('../lib/data-client', () => ({
  opsDataClient: mockOpsDataClient,
}));

describe('DashboardPage', () => {
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

    mockOpsDataClient.getDashboard.mockReset();
    mockOpsDataClient.getTasks.mockReset();
    mockOpsDataClient.getDashboard.mockResolvedValue({
      inProgressProjects: [
        {
          projectId: 'project-1',
          type1: 'QA',
          projectName: '알파',
          platform: 'iOS',
          serviceGroupName: '커머스',
          startDate: '2026-03-01',
          endDate: '2026-03-31',
        },
      ],
    });
    mockOpsDataClient.getTasks.mockResolvedValue([]);
  });

  it('renders the in-progress project list', async () => {
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('알파')).toBeInTheDocument();
    });

    expect(screen.getByText('알파')).toBeInTheDocument();
    expect(screen.getByText('커머스')).toBeInTheDocument();
    expect(screen.getByText('2026-03-01')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '진행중인 프로젝트 목록' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '진행중 모니터링 목록' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '진행중 QA 목록' })).not.toBeInTheDocument();
    expect(screen.queryByText('업무 보고 현황')).not.toBeInTheDocument();
  });

  it('moves the worklog calendar between previous and next months', async () => {
    const queryClient = new QueryClient();
    const currentMonth = getCurrentMonth();
    const previousMonth = shiftMonth(currentMonth, -1);
    const currentHeading = `${Number(currentMonth.slice(0, 4))}년 ${Number(currentMonth.slice(5, 7))}월`;
    const previousHeading = `${Number(previousMonth.slice(0, 4))}년 ${Number(previousMonth.slice(5, 7))}월`;

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getAllByRole('heading', { name: currentHeading }).length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getAllByRole('button', { name: '이전달 보기' })[0]);
    expect(screen.getAllByRole('heading', { name: previousHeading }).length).toBeGreaterThan(0);

    fireEvent.click(screen.getAllByRole('button', { name: '다음달 보기' })[0]);
    expect(screen.getAllByRole('heading', { name: currentHeading }).length).toBeGreaterThan(0);
  });
});
