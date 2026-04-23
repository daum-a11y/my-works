import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminServiceGroupEditorPage } from '../pages/admin/groups/AdminServiceGroupEditorPage';

const listServiceGroups = vi.fn();
const listCostGroups = vi.fn();
const saveServiceGroupAdmin = vi.fn();
const deleteServiceGroupAdmin = vi.fn();
const getServiceGroupUsageSummary = vi.fn();
const replaceServiceGroupUsage = vi.fn();

vi.mock('../api/serviceGroups', () => ({
    listServiceGroups: (...args: unknown[]) => listServiceGroups(...args),
    saveServiceGroupAdmin: (...args: unknown[]) => saveServiceGroupAdmin(...args),
    deleteServiceGroupAdmin: (...args: unknown[]) => deleteServiceGroupAdmin(...args),
    getServiceGroupUsageSummary: (...args: unknown[]) => getServiceGroupUsageSummary(...args),
    replaceServiceGroupUsage: (...args: unknown[]) => replaceServiceGroupUsage(...args),
}));

vi.mock('../api/costGroups', () => ({
    listCostGroups: (...args: unknown[]) => listCostGroups(...args),
}));

function ServiceGroupsListRoute() {
  const location = useLocation();
  const statusMessage = (location.state as { statusMessage?: string } | null)?.statusMessage;
  return <div>{statusMessage ?? 'service groups list'}</div>;
}

function renderEditor(initialEntry = '/admin/group/service-group-1/edit') {
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
          <Route path="/admin/group" element={<ServiceGroupsListRoute />} />
          <Route
            path="/admin/group/:serviceGroupId/edit"
            element={<AdminServiceGroupEditorPage />}
          />
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  listServiceGroups.mockReset();
  listCostGroups.mockReset();
  saveServiceGroupAdmin.mockReset();
  deleteServiceGroupAdmin.mockReset();
  getServiceGroupUsageSummary.mockReset();
  replaceServiceGroupUsage.mockReset();
  listCostGroups.mockResolvedValue([
    { id: 'cost-group-1', name: '내부', display_order: 1, is_active: true },
    { id: 'cost-group-2', name: '외부', display_order: 2, is_active: true },
  ]);
  getServiceGroupUsageSummary.mockResolvedValue([{ project_count: 0 }]);
});

afterEach(() => {
  cleanup();
});

describe('AdminServiceGroupEditorPage', () => {
  it('opens the task search page filtered by the current service group in a new tab', async () => {
    listServiceGroups.mockResolvedValue([
      {
        id: 'service-group-1',
        name: '커머스 / 주문',
        service_group_name: '커머스',
        service_name: '주문',
        cost_group_id: 'cost-group-1',
        display_order: 1,
        is_active: true,
        cost_groups: { name: '내부' },
      },
      {
        id: 'service-group-2',
        name: '커머스 / 결제',
        service_group_name: '커머스',
        service_name: '결제',
        cost_group_id: 'cost-group-1',
        display_order: 2,
        is_active: true,
        cost_groups: { name: '내부' },
      },
    ]);
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    const user = userEvent.setup();

    renderEditor();

    await user.click(await screen.findByRole('button', { name: '조회' }));

    expect(openSpy).toHaveBeenCalledWith(
      '/org/search?startDate=&endDate=&costGroupId=cost-group-1&serviceGroupId=service-group-1',
      '_blank',
      'noopener,noreferrer',
    );
    openSpy.mockRestore();
  });

  it('opens the transfer dialog with active target service groups only and closes without saving', async () => {
    listServiceGroups.mockResolvedValue([
      {
        id: 'service-group-1',
        name: '커머스 / 주문',
        service_group_name: '커머스',
        service_name: '주문',
        cost_group_id: 'cost-group-1',
        display_order: 1,
        is_active: true,
        cost_groups: { name: '내부' },
      },
      {
        id: 'service-group-2',
        name: '커머스 / 결제',
        service_group_name: '커머스',
        service_name: '결제',
        cost_group_id: 'cost-group-1',
        display_order: 2,
        is_active: true,
        cost_groups: { name: '내부' },
      },
      {
        id: 'service-group-3',
        name: '플랫폼 / API',
        service_group_name: '플랫폼',
        service_name: 'API',
        cost_group_id: 'cost-group-1',
        display_order: 3,
        is_active: true,
        cost_groups: { name: '내부' },
      },
      {
        id: 'service-group-4',
        name: '제휴 / 정산',
        service_group_name: '제휴',
        service_name: '정산',
        cost_group_id: 'cost-group-2',
        display_order: 4,
        is_active: true,
        cost_groups: { name: '외부' },
      },
      {
        id: 'service-group-5',
        name: '운영 / 지원',
        service_group_name: '운영',
        service_name: '지원',
        cost_group_id: 'cost-group-1',
        display_order: 5,
        is_active: false,
        cost_groups: { name: '내부' },
      },
    ]);
    replaceServiceGroupUsage.mockResolvedValue(undefined);
    const user = userEvent.setup();

    renderEditor();

    await screen.findByRole('heading', { name: '서비스 그룹 수정' });
    expect(screen.getByRole('button', { name: '삭제' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '전환' }));

    expect(screen.getByRole('dialog', { name: '서비스 그룹 전환' })).toBeInTheDocument();
    expect(screen.getByText('내부 / 커머스 / 주문')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: '기존 항목 삭제' })).not.toBeChecked();

    const targetCostGroupSelect = screen.getByLabelText('변경할 청구그룹');
    const targetGroupSelect = screen.getByLabelText('변경할 서비스 그룹');
    const targetServiceSelect = screen.getByLabelText('변경할 서비스명');
    expect(within(targetCostGroupSelect).getByRole('option', { name: '내부' })).toBeInTheDocument();
    expect(within(targetCostGroupSelect).getByRole('option', { name: '외부' })).toBeInTheDocument();
    expect(within(targetGroupSelect).getByRole('option', { name: '커머스' })).toBeInTheDocument();
    expect(within(targetGroupSelect).getByRole('option', { name: '플랫폼' })).toBeInTheDocument();
    expect(
      within(targetGroupSelect).queryByRole('option', { name: '운영' }),
    ).not.toBeInTheDocument();
    expect(within(targetServiceSelect).getByRole('option', { name: '결제' })).toBeInTheDocument();
    expect(
      within(targetServiceSelect).queryByRole('option', { name: '주문' }),
    ).not.toBeInTheDocument();

    await user.selectOptions(targetGroupSelect, '플랫폼');
    expect(within(targetServiceSelect).getByRole('option', { name: 'API' })).toBeInTheDocument();
    expect(
      within(targetServiceSelect).queryByRole('option', { name: '결제' }),
    ).not.toBeInTheDocument();

    await user.selectOptions(targetCostGroupSelect, 'cost-group-2');
    expect(within(targetGroupSelect).getByRole('option', { name: '제휴' })).toBeInTheDocument();
    expect(within(targetServiceSelect).getByRole('option', { name: '정산' })).toBeInTheDocument();
    expect(
      within(targetGroupSelect).queryByRole('option', { name: '커머스' }),
    ).not.toBeInTheDocument();

    await user.click(
      within(screen.getByRole('dialog', { name: '서비스 그룹 전환' })).getByRole('button', {
        name: '취소',
      }),
    );
    expect(screen.queryByRole('dialog', { name: '서비스 그룹 전환' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '전환' }));
    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: '서비스 그룹 전환' })).not.toBeInTheDocument();
    });
    expect(replaceServiceGroupUsage).not.toHaveBeenCalled();
  });

  it('saves service group usage transfer and returns to the service group list', async () => {
    listServiceGroups.mockResolvedValue([
      {
        id: 'service-group-1',
        name: '커머스 / 주문',
        service_group_name: '커머스',
        service_name: '주문',
        cost_group_id: 'cost-group-1',
        display_order: 1,
        is_active: true,
        cost_groups: { name: '내부' },
      },
      {
        id: 'service-group-2',
        name: '커머스 / 결제',
        service_group_name: '커머스',
        service_name: '결제',
        cost_group_id: 'cost-group-1',
        display_order: 2,
        is_active: true,
        cost_groups: { name: '내부' },
      },
    ]);
    replaceServiceGroupUsage.mockResolvedValue(undefined);
    const user = userEvent.setup();

    renderEditor();

    await user.click(await screen.findByRole('button', { name: '전환' }));
    await user.click(screen.getByRole('checkbox', { name: '기존 항목 삭제' }));
    await user.click(
      within(screen.getByRole('dialog', { name: '서비스 그룹 전환' })).getByRole('button', {
        name: '저장',
      }),
    );

    expect(replaceServiceGroupUsage).toHaveBeenCalledWith(
      'service-group-1',
      'service-group-2',
      true,
    );
    await screen.findByText('서비스 그룹 연관관계를 전환했습니다.');
  });

  it('keeps the transfer dialog open and shows an error when transfer fails', async () => {
    listServiceGroups.mockResolvedValue([
      {
        id: 'service-group-1',
        name: '커머스 / 주문',
        service_group_name: '커머스',
        service_name: '주문',
        cost_group_id: 'cost-group-1',
        display_order: 1,
        is_active: true,
        cost_groups: { name: '내부' },
      },
      {
        id: 'service-group-2',
        name: '커머스 / 결제',
        service_group_name: '커머스',
        service_name: '결제',
        cost_group_id: 'cost-group-1',
        display_order: 2,
        is_active: true,
        cost_groups: { name: '내부' },
      },
    ]);
    replaceServiceGroupUsage.mockRejectedValue(new Error('전환에 실패했습니다.'));
    const user = userEvent.setup();

    renderEditor();

    await user.click(await screen.findByRole('button', { name: '전환' }));
    await user.click(
      within(screen.getByRole('dialog', { name: '서비스 그룹 전환' })).getByRole('button', {
        name: '저장',
      }),
    );

    expect(await screen.findByText('전환에 실패했습니다.')).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: '서비스 그룹 전환' })).toBeInTheDocument();
  });

  it('disables transfer when no active target service group exists', async () => {
    listServiceGroups.mockResolvedValue([
      {
        id: 'service-group-1',
        name: '커머스 / 주문',
        service_group_name: '커머스',
        service_name: '주문',
        cost_group_id: 'cost-group-1',
        display_order: 1,
        is_active: true,
        cost_groups: { name: '내부' },
      },
      {
        id: 'service-group-2',
        name: '운영 / 지원',
        service_group_name: '운영',
        service_name: '지원',
        cost_group_id: 'cost-group-1',
        display_order: 2,
        is_active: false,
        cost_groups: { name: '내부' },
      },
    ]);

    renderEditor();

    const transferButton = await screen.findByRole('button', { name: '전환' });
    expect(transferButton).toBeDisabled();
    expect(screen.getByText('전환할 활성 서비스 그룹이 없습니다.')).toBeInTheDocument();
  });
});
