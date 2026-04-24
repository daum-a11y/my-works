import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DashboardPage } from '../pages/dashboard';
import { getCurrentMonth, shiftMonth } from '../pages/resource/resourceUtils';

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
  saveProjectSubtask: vi.fn(),
  getTasks: vi.fn(),
  getAllTasks: vi.fn(),
  saveTask: vi.fn(),
  deleteTask: vi.fn(),
  searchTasks: vi.fn(),
  getDashboard: vi.fn(),
  getDashboardTaskCalendar: vi.fn(),
  getStats: vi.fn()
}));

vi.mock('../auth/AuthContext', () => ({
  useAuth: mockUseAuth
}));

vi.mock('../api/stats', () => mockDataClient);

vi.mock('../api/tasks', () => mockDataClient);

afterEach(() => {
  cleanup();
});

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
          reportRequired: true,
          role: 'user',
          isActive: true
        }
      }
    });

    mockDataClient.getDashboard.mockReset();
    mockDataClient.getDashboardTaskCalendar.mockReset();
    mockDataClient.getDashboard.mockResolvedValue({
      inProgressProjects: [
        {
          projectId: 'project-1',
          type1: 'QA',
          projectName: '알파',
          platform: 'iOS',
          costGroupName: '내부',
          serviceGroupName: '커머스',
          startDate: '2026-03-01',
          endDate: '2026-03-31'
        }
      ]
    });
    mockDataClient.getDashboardTaskCalendar.mockResolvedValue([]);
  });

  it('renders the in-progress project list', async () => {
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('알파')).toBeInTheDocument();
    });

    expect(screen.getByText('알파')).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: '청구그룹 정렬 기준 선택 가능' })
    ).toBeInTheDocument();
    expect(screen.getByText('내부')).toBeInTheDocument();
    expect(screen.getByText('커머스')).toBeInTheDocument();
    expect(screen.getByText('2026-03-01')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '진행중인 프로젝트' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('navigation', { name: '대시보드 페이지 내 탐색' })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '업무일지 달력' })).toHaveAttribute(
      'href',
      '#dashboard-calendar'
    );
    expect(
      screen.getByRole('link', { name: '진행중인 프로젝트' })
    ).toHaveAttribute('href', '#dashboard-projects');
    expect(
      screen.queryByRole('heading', { name: '진행중 모니터링 목록' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: '진행중 QA 목록' })
    ).not.toBeInTheDocument();
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
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(
        screen.getAllByRole('heading', { name: currentHeading }).length
      ).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getAllByRole('button', { name: '이전달 보기' })[0]);
    expect(
      screen.getAllByRole('heading', { name: previousHeading }).length
    ).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: '이번달' })).toBeEnabled();

    fireEvent.click(screen.getByRole('button', { name: '이번달' }));
    expect(
      screen.getAllByRole('heading', { name: currentHeading }).length
    ).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: '이번달' })).toBeDisabled();
  });

  it('hides the worklog calendar when reportRequired is false', async () => {
    const queryClient = new QueryClient();

    mockUseAuth.mockReturnValue({
      status: 'authenticated',
      session: {
        member: {
          id: 'member-1',
          accountId: 'legacy-1',
          name: '운영 사용자',
          email: 'operator@example.com',
          reportRequired: false,
          role: 'user',
          isActive: true
        }
      }
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(
      screen.queryByRole('navigation', { name: '업무일지 월 이동' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('table', { name: '업무일지 작성 현황' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: '업무일지 달력' })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: '진행중인 프로젝트' })
    ).toHaveAttribute('href', '#dashboard-projects');
    expect(screen.queryByText('업무 현황')).not.toBeInTheDocument();
  });
});
