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
  getResourceServiceSummaryYears: vi.fn(),
  getResourceServiceSummaryByYear: vi.fn(),
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

    mockOpsDataClient.getResourceServiceSummaryYears.mockResolvedValue(['2024', '2023']);
    mockOpsDataClient.getResourceServiceSummaryByYear.mockImplementation(
      async (_member: unknown, year: string) => {
        if (year === '2024') {
          return [
            {
              year: '2024',
              month: '01',
              costGroupName: '커머스',
              serviceGroupName: '선물하기',
              serviceName: '카카오 T',
              taskUsedtime: 60,
            },
          ];
        }

        return [
          {
            year: '2023',
            month: '04',
            costGroupName: '커머스',
            serviceGroupName: '선물하기',
            serviceName: '선물하기',
            taskUsedtime: 60,
          },
          {
            year: '2023',
            month: '05',
            costGroupName: '플랫폼',
            serviceGroupName: '카카오맵',
            serviceName: '카카오맵',
            taskUsedtime: 120,
          },
        ];
      },
    );
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
      expect(screen.getAllByRole('cell', { name: '커머스' }).length).toBeGreaterThan(0);
    });

    expect(screen.getByRole('tab', { name: '2023년' })).toBeInTheDocument();
    expect(screen.getAllByRole('cell', { name: '커머스' }).length).toBeGreaterThan(0);
    expect(screen.getByText('카카오 T')).toBeInTheDocument();
    expect(screen.queryByRole('cell', { name: '플랫폼' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: '2023년' }));

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: '2023년' })).toHaveAttribute('aria-selected', 'true');
      expect(screen.getAllByRole('cell', { name: '커머스' }).length).toBeGreaterThan(0);
    });

    expect(screen.getAllByRole('cell', { name: '커머스' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('cell', { name: '선물하기' }).length).toBeGreaterThan(0);
    expect(screen.getByRole('cell', { name: '플랫폼' })).toBeInTheDocument();
    expect(screen.getAllByRole('cell', { name: '카카오맵' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('cell', { name: '선물하기' }).length).toBeGreaterThan(0);
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
      expect(screen.getAllByRole('cell', { name: '커머스' }).length).toBeGreaterThan(0);
    });

    expect(screen.getAllByRole('cell', { name: '선물하기' }).length).toBeGreaterThan(0);
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
      expect(screen.getAllByRole('cell', { name: '커머스' }).length).toBeGreaterThan(0);
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
