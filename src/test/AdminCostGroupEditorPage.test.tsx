import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminCostGroupEditorPage } from '../pages/admin/cost-groups/AdminCostGroupEditorPage';

const listCostGroups = vi.fn();
const saveCostGroupAdmin = vi.fn();
const deleteCostGroupAdmin = vi.fn();
const replaceCostGroupUsage = vi.fn();

vi.mock('../api/admin', () => ({
  adminDataClient: {
    listCostGroups: (...args: unknown[]) => listCostGroups(...args),
    saveCostGroupAdmin: (...args: unknown[]) => saveCostGroupAdmin(...args),
    deleteCostGroupAdmin: (...args: unknown[]) => deleteCostGroupAdmin(...args),
    replaceCostGroupUsage: (...args: unknown[]) => replaceCostGroupUsage(...args),
  },
}));

function CostGroupsListRoute() {
  const location = useLocation();
  const statusMessage = (location.state as { statusMessage?: string } | null)?.statusMessage;
  return <div>{statusMessage ?? 'cost groups list'}</div>;
}

function renderEditor(initialEntry = '/admin/cost-group/cost-group-1/edit') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <QueryClientProvider client={queryClient}>
        <Routes>
          <Route path="/admin/cost-group" element={<CostGroupsListRoute />} />
          <Route
            path="/admin/cost-group/:costGroupId/edit"
            element={<AdminCostGroupEditorPage />}
          />
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  listCostGroups.mockReset();
  saveCostGroupAdmin.mockReset();
  deleteCostGroupAdmin.mockReset();
  replaceCostGroupUsage.mockReset();
});

afterEach(() => {
  cleanup();
});

describe('AdminCostGroupEditorPage', () => {
  it('opens the task search page filtered by the current cost group in a new tab', async () => {
    listCostGroups.mockResolvedValue([
      { id: 'cost-group-1', name: '기존 청구그룹', display_order: 1, is_active: true },
      { id: 'cost-group-2', name: '새 청구그룹', display_order: 2, is_active: true },
    ]);
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    const user = userEvent.setup();

    renderEditor();

    await user.click(await screen.findByRole('button', { name: '조회' }));

    expect(openSpy).toHaveBeenCalledWith(
      '/org/search?startDate=&endDate=&costGroupId=cost-group-1',
      '_blank',
      'noopener,noreferrer',
    );
    openSpy.mockRestore();
  });

  it('opens the transfer dialog with active target cost groups only and closes without saving', async () => {
    listCostGroups.mockResolvedValue([
      { id: 'cost-group-1', name: '기존 청구그룹', display_order: 1, is_active: true },
      { id: 'cost-group-2', name: '새 청구그룹', display_order: 2, is_active: true },
      { id: 'cost-group-3', name: '비활성 청구그룹', display_order: 3, is_active: false },
    ]);
    replaceCostGroupUsage.mockResolvedValue(undefined);
    const user = userEvent.setup();

    renderEditor();

    await screen.findByRole('heading', { name: '청구그룹 수정' });
    expect(screen.getByRole('button', { name: '삭제' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '전환' }));

    expect(screen.getByRole('dialog', { name: '청구그룹 전환' })).toBeInTheDocument();
    expect(screen.getByText('기존 청구그룹')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: '기존 항목 삭제' })).not.toBeChecked();

    const targetSelect = screen.getByLabelText('변경할 항목');
    expect(within(targetSelect).getByRole('option', { name: '새 청구그룹' })).toBeInTheDocument();
    expect(
      within(targetSelect).queryByRole('option', { name: '기존 청구그룹' }),
    ).not.toBeInTheDocument();
    expect(
      within(targetSelect).queryByRole('option', { name: '비활성 청구그룹' }),
    ).not.toBeInTheDocument();

    await user.click(
      within(screen.getByRole('dialog', { name: '청구그룹 전환' })).getByRole('button', {
        name: '취소',
      }),
    );
    expect(screen.queryByRole('dialog', { name: '청구그룹 전환' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '전환' }));
    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: '청구그룹 전환' })).not.toBeInTheDocument();
    });
    expect(replaceCostGroupUsage).not.toHaveBeenCalled();
  });

  it('saves cost group usage transfer and returns to the cost group list', async () => {
    listCostGroups.mockResolvedValue([
      { id: 'cost-group-1', name: '기존 청구그룹', display_order: 1, is_active: true },
      { id: 'cost-group-2', name: '새 청구그룹', display_order: 2, is_active: true },
    ]);
    replaceCostGroupUsage.mockResolvedValue(undefined);
    const user = userEvent.setup();

    renderEditor();

    await user.click(await screen.findByRole('button', { name: '전환' }));
    await user.click(screen.getByRole('checkbox', { name: '기존 항목 삭제' }));
    await user.click(
      within(screen.getByRole('dialog', { name: '청구그룹 전환' })).getByRole('button', {
        name: '저장',
      }),
    );

    expect(replaceCostGroupUsage).toHaveBeenCalledWith('cost-group-1', 'cost-group-2', true);
    await screen.findByText('청구그룹 연관관계를 전환했습니다.');
  });

  it('keeps the transfer dialog open and shows an error when transfer fails', async () => {
    listCostGroups.mockResolvedValue([
      { id: 'cost-group-1', name: '기존 청구그룹', display_order: 1, is_active: true },
      { id: 'cost-group-2', name: '새 청구그룹', display_order: 2, is_active: true },
    ]);
    replaceCostGroupUsage.mockRejectedValue(new Error('전환에 실패했습니다.'));
    const user = userEvent.setup();

    renderEditor();

    await user.click(await screen.findByRole('button', { name: '전환' }));
    await user.click(
      within(screen.getByRole('dialog', { name: '청구그룹 전환' })).getByRole('button', {
        name: '저장',
      }),
    );

    expect(await screen.findByText('전환에 실패했습니다.')).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: '청구그룹 전환' })).toBeInTheDocument();
  });

  it('disables transfer when there is no active target cost group', async () => {
    listCostGroups.mockResolvedValue([
      { id: 'cost-group-1', name: '기존 청구그룹', display_order: 1, is_active: true },
      { id: 'cost-group-2', name: '비활성 청구그룹', display_order: 2, is_active: false },
    ]);
    const user = userEvent.setup();

    renderEditor();

    const transferButton = await screen.findByRole('button', { name: '전환' });
    expect(transferButton).toBeDisabled();
    expect(screen.getByText('전환할 활성 청구그룹이 없습니다.')).toBeInTheDocument();

    await user.click(transferButton);
    expect(screen.queryByRole('dialog', { name: '청구그룹 전환' })).not.toBeInTheDocument();
  });
});
