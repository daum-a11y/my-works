import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminCostGroupsPage } from '../pages/admin/cost-groups/AdminCostGroupsPage';

const listCostGroups = vi.fn();
const reorderCostGroups = vi.fn();

vi.mock('../api/costGroups', () => ({
    listCostGroups: (...args: unknown[]) => listCostGroups(...args),
    reorderCostGroups: (...args: unknown[]) => reorderCostGroups(...args),
}));

beforeEach(() => {
  listCostGroups.mockReset();
  reorderCostGroups.mockReset();
});

afterEach(() => {
  cleanup();
});

describe('AdminCostGroupsPage', () => {
  it('saves reordered cost groups from the order dialog', async () => {
    listCostGroups.mockResolvedValue([
      { id: 'cg-1', name: '내부', displayOrder: 1, isActive: true },
      { id: 'cg-2', name: '외부', displayOrder: 2, isActive: true },
      { id: 'cg-3', name: '정산', displayOrder: 3, isActive: false },
    ]);
    reorderCostGroups.mockResolvedValue(undefined);

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <AdminCostGroupsPage />
        </QueryClientProvider>
      </MemoryRouter>,
    );

    await screen.findByRole('link', { name: '청구그룹 추가' });

    await user.click(screen.getByRole('button', { name: '순서변경' }));

    const moveHandle = await screen.findByRole('button', { name: '내부 순서 이동 핸들' });
    moveHandle.focus();
    await user.keyboard('{ArrowDown}');
    await user.click(screen.getByRole('button', { name: '저장' }));

    expect(reorderCostGroups).toHaveBeenCalledWith({ ids: ['cg-2', 'cg-1', 'cg-3'] });
    await screen.findByText('청구그룹 순서를 저장했습니다.');
  });
});
