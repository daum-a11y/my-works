import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ResourceMonthPage } from '../pages/resource/ResourceMonthPage';

const mockUseAuth = vi.hoisted(() => vi.fn());
const mockDataClient = vi.hoisted(() => ({
  mode: 'supabase' as const,
  getResourceMonthReport: vi.fn(),
}));

vi.mock('../pages/auth/AuthContext', () => ({
  useAuth: mockUseAuth,
}));

vi.mock('../api/client', async () => {
  const actual = await vi.importActual<typeof import('../api/client')>('../api/client');
  return {
    ...actual,
    dataClient: {
      ...actual.dataClient,
      ...mockDataClient,
    },
  };
});

function renderPage(initialEntry = '/resource/month/2026-03') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <QueryClientProvider client={queryClient}>
        <Routes>
          <Route path="/resource/month/:type" element={<ResourceMonthPage />} />
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe('ResourceMonthPage', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      session: {
        member: {
          id: 'member-1',
          accountId: 'legacy-1',
          name: '운영 사용자',
          email: 'operator@example.com',
          role: 'admin',
          isActive: true,
        },
      },
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders the aggregated month report payload', async () => {
    mockDataClient.getResourceMonthReport.mockResolvedValue({
      typeRows: [
        {
          type1: '운영',
          totalMinutes: 120,
          requiresServiceGroup: true,
          items: [{ type2: '점검', minutes: 120, requiresServiceGroup: true }],
        },
        {
          type1: '휴무',
          totalMinutes: 60,
          requiresServiceGroup: false,
          items: [{ type2: '무급휴가', minutes: 60, requiresServiceGroup: false }],
        },
      ],
      serviceSummaryRows: [
        {
          costGroup: '커머스',
          group: '선물하기',
          totalMinutes: 120,
          names: [{ name: '카카오 선물하기', minutes: 120 }],
        },
      ],
      serviceDetailRows: [
        {
          costGroup: '커머스',
          group: '선물하기',
          totalMinutes: 120,
          names: [
            {
              name: '카카오 선물하기',
              items: [{ type1: '운영', minutes: 120 }],
            },
          ],
        },
      ],
      memberTotals: [{ id: 'member-1', accountId: 'legacy-1', totalMinutes: 180 }],
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('카카오 선물하기')).toBeInTheDocument();
    });

    expect(screen.getByText(/legacy-1/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '업무타입별 합계' }));

    expect(screen.getByText('운영')).toBeInTheDocument();
    expect(screen.getByText('점검')).toBeInTheDocument();
  });

  it('keeps the previous month data visible while the next month is loading', async () => {
    const deferred = createDeferred<{
      typeRows: [];
      serviceSummaryRows: [];
      serviceDetailRows: [];
      memberTotals: [];
    }>();

    mockDataClient.getResourceMonthReport.mockImplementation((_member: unknown, month: string) => {
      if (month === '2026-03') {
        return Promise.resolve({
          typeRows: [
            {
              type1: '운영',
              totalMinutes: 120,
              requiresServiceGroup: true,
              items: [{ type2: '점검', minutes: 120, requiresServiceGroup: true }],
            },
          ],
          serviceSummaryRows: [
            {
              costGroup: '커머스',
              group: '선물하기',
              totalMinutes: 120,
              names: [{ name: '카카오 선물하기', minutes: 120 }],
            },
          ],
          serviceDetailRows: [
            {
              costGroup: '커머스',
              group: '선물하기',
              totalMinutes: 120,
              names: [{ name: '카카오 선물하기', items: [{ type1: '운영', minutes: 120 }] }],
            },
          ],
          memberTotals: [{ id: 'member-1', accountId: 'legacy-1', totalMinutes: 120 }],
        });
      }

      return deferred.promise;
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('카카오 선물하기')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('link', { name: '다음달 보기' }));

    expect(screen.getByText('카카오 선물하기')).toBeInTheDocument();
    expect(screen.queryByText('데이터를 불러오는 중입니다.')).not.toBeInTheDocument();

    deferred.resolve({
      typeRows: [],
      serviceSummaryRows: [],
      serviceDetailRows: [],
      memberTotals: [],
    });

    await waitFor(() => {
      expect(screen.getByText('데이터가 없습니다.')).toBeInTheDocument();
    });
  });
});
