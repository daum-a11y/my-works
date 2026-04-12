import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { QaStatsPage } from '../pages/stats';

const member = {
  id: 'member-1',
  accountId: 'user1',
  name: '운영자',
  email: 'operator@example.com',
  role: 'user' as const,
  isActive: true,
};

const getQaStatsProjects = vi.fn();

vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({ session: { member } }),
}));

vi.mock('../api/client', () => ({
  dataClient: {
    getQaStatsProjects: (...args: unknown[]) => getQaStatsProjects(...args),
  },
}));

describe('QaStatsPage', () => {
  it('shows QA stats based on the current project structure', async () => {
    getQaStatsProjects.mockResolvedValue([
      {
        id: 'project-1',
        type1: 'QA',
        name: '접근성 포털',
        costGroupName: '청구그룹A',
        serviceGroupName: '-',
        reportUrl: '',
        reporterDisplay: 'user1(운영자)',
        startDate: '2026-03-01',
        endDate: '2026-03-31',
        isActive: true,
      },
      {
        id: 'project-3',
        type1: 'QA',
        name: '메이커스 25년 3차',
        costGroupName: '청구그룹A',
        serviceGroupName: '-',
        reportUrl: '',
        reporterDisplay: 'user1(운영자)',
        startDate: '2025-06-18',
        endDate: '2025-06-30',
        isActive: true,
      },
      {
        id: 'project-4',
        type1: 'QA',
        name: '메이커스 25년 3차 - 후속',
        costGroupName: '청구그룹A',
        serviceGroupName: '-',
        reportUrl: '',
        reporterDisplay: 'user1(운영자)',
        startDate: '2025-06-23',
        endDate: '2025-06-30',
        isActive: true,
      },
    ]);

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <QaStatsPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getAllByText('접근성 포털').length).toBeGreaterThan(0);
    });

    expect(screen.queryByText('메이커스 25년 3차')).not.toBeInTheDocument();
    expect(screen.queryByText('메이커스 25년 3차 - 후속')).not.toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '청구그룹' })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('QA 시작월'), { target: { value: '2025-06' } });
    fireEvent.change(screen.getByLabelText('QA 종료월'), { target: { value: '2025-06' } });
    fireEvent.click(screen.getByRole('button', { name: '검색' }));

    await waitFor(() => {
      expect(screen.getAllByText('메이커스 25년 3차').length).toBeGreaterThan(0);
    });

    expect(screen.getAllByText('user1(운영자)').length).toBeGreaterThan(0);
    expect(screen.getAllByText('메이커스 25년 3차 - 후속').length).toBeGreaterThan(0);
  });
});
