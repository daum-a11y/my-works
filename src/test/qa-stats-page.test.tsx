import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { QaStatsPage } from '../features/stats';

const member = {
  id: 'member-1',
  accountId: 'user1',
  name: '운영자',
  email: 'operator@example.com',
  role: 'user' as const,
  isActive: true,
};

const getProjects = vi.fn();
const getMembers = vi.fn();
const getServiceGroups = vi.fn();

vi.mock('../features/auth/AuthContext', () => ({
  useAuth: () => ({ session: { member } }),
}));

vi.mock('../lib/data-client', () => ({
  opsDataClient: {
    getProjects: (...args: unknown[]) => getProjects(...args),
    getMembers: (...args: unknown[]) => getMembers(...args),
    getServiceGroups: (...args: unknown[]) => getServiceGroups(...args),
  },
}));

describe('QaStatsPage', () => {
  it('shows QA stats based on the current project structure', async () => {
    getProjects.mockResolvedValue([
      {
        id: 'project-1',
        legacyProjectId: '',
        createdByMemberId: null,
        name: '접근성 포털',
        projectType1: 'QA',
        platform: 'WEB',
        serviceGroupId: null,
        reportUrl: '',
        reporterMemberId: 'member-1',
        reviewerMemberId: null,
        startDate: '2026-03-01',
        endDate: '2026-03-31',
        isActive: true,
      },
      {
        id: 'project-3',
        legacyProjectId: '',
        createdByMemberId: null,
        name: '메이커스 25년 3차',
        projectType1: 'QA',
        platform: 'WEB',
        serviceGroupId: null,
        reportUrl: '',
        reporterMemberId: 'member-1',
        reviewerMemberId: null,
        startDate: '2025-06-18',
        endDate: '2025-06-30',
        isActive: true,
      },
      {
        id: 'project-4',
        legacyProjectId: '',
        createdByMemberId: null,
        name: '2025년 6월 다음앱 정기모니터링',
        projectType1: '모니터링',
        platform: 'APP',
        serviceGroupId: null,
        reportUrl: '',
        reporterMemberId: 'member-1',
        reviewerMemberId: null,
        startDate: '2025-06-23',
        endDate: '2025-06-30',
        isActive: true,
      },
      {
        id: 'project-2',
        legacyProjectId: '',
        createdByMemberId: null,
        name: '앱 운영',
        projectType1: '운영',
        platform: 'APP',
        serviceGroupId: null,
        reportUrl: '',
        reporterMemberId: 'member-1',
        reviewerMemberId: null,
        startDate: '2026-03-01',
        endDate: '2026-03-31',
        isActive: true,
      },
    ]);
    getMembers.mockResolvedValue([{ ...member, authUserId: 'auth-1' }]);
    getServiceGroups.mockResolvedValue([]);

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <QaStatsPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getAllByText('접근성 포털').length).toBeGreaterThan(0);
    });

    expect(screen.queryByText('메이커스 25년 3차')).not.toBeInTheDocument();
    expect(screen.queryByText('2025년 6월 다음앱 정기모니터링')).not.toBeInTheDocument();
    expect(screen.queryByText('앱 운영')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('QA 시작월'), { target: { value: '2025-06' } });
    fireEvent.change(screen.getByLabelText('QA 종료월'), { target: { value: '2025-06' } });
    fireEvent.click(screen.getByRole('button', { name: '검색' }));

    await waitFor(() => {
      expect(screen.getAllByText('메이커스 25년 3차').length).toBeGreaterThan(0);
    });

    expect(screen.getByText('user1(운영자)')).toBeInTheDocument();
    expect(screen.queryByText('2025년 6월 다음앱 정기모니터링')).not.toBeInTheDocument();
    expect(screen.queryByText('앱 운영')).not.toBeInTheDocument();
  });
});
