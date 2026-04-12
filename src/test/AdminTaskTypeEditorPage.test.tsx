import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminTaskTypeEditorPage } from '../pages/admin/types/AdminTaskTypeEditorPage';

const listTaskTypes = vi.fn();
const getTaskTypeUsageSummary = vi.fn();
const saveTaskTypeAdmin = vi.fn();
const deleteTaskTypeAdmin = vi.fn();
const replaceTaskTypeUsageById = vi.fn();

vi.mock('../api/admin', () => ({
  adminDataClient: {
    listTaskTypes: (...args: unknown[]) => listTaskTypes(...args),
    getTaskTypeUsageSummary: (...args: unknown[]) => getTaskTypeUsageSummary(...args),
    saveTaskTypeAdmin: (...args: unknown[]) => saveTaskTypeAdmin(...args),
    deleteTaskTypeAdmin: (...args: unknown[]) => deleteTaskTypeAdmin(...args),
    replaceTaskTypeUsageById: (...args: unknown[]) => replaceTaskTypeUsageById(...args),
  },
}));

function TaskTypesListRoute() {
  const location = useLocation();
  const statusMessage = (location.state as { statusMessage?: string } | null)?.statusMessage;
  return <div>{statusMessage ?? 'task types list'}</div>;
}

function renderEditor(initialEntry = '/admin/type/task-type-1/edit') {
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
          <Route path="/admin/type" element={<TaskTypesListRoute />} />
          <Route path="/admin/type/:taskTypeId/edit" element={<AdminTaskTypeEditorPage />} />
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  listTaskTypes.mockReset();
  getTaskTypeUsageSummary.mockReset();
  saveTaskTypeAdmin.mockReset();
  deleteTaskTypeAdmin.mockReset();
  replaceTaskTypeUsageById.mockReset();
  getTaskTypeUsageSummary.mockResolvedValue([{ task_count: 0 }]);
});

afterEach(() => {
  cleanup();
});

describe('AdminTaskTypeEditorPage', () => {
  it('opens the task search page filtered by the current task type in a new tab', async () => {
    listTaskTypes.mockResolvedValue([
      {
        id: 'task-type-1',
        type1: '개발',
        type2: '구현',
        note: '',
        display_order: 1,
        requires_service_group: true,
        is_active: true,
      },
      {
        id: 'task-type-2',
        type1: 'QA',
        type2: '검수',
        note: '',
        display_order: 2,
        requires_service_group: false,
        is_active: true,
      },
    ]);
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    const user = userEvent.setup();

    renderEditor();

    await user.click(await screen.findByRole('button', { name: '조회' }));

    const url = new URL(String(openSpy.mock.calls[0][0]), 'http://localhost');
    expect(url.pathname).toBe('/org/search');
    expect(url.searchParams.get('startDate')).toBe('');
    expect(url.searchParams.get('endDate')).toBe('');
    expect(url.searchParams.get('taskTypeId')).toBe('task-type-1');
    expect(url.searchParams.get('taskType1')).toBe('개발');
    expect(url.searchParams.get('taskType2')).toBe('구현');
    expect(openSpy.mock.calls[0][1]).toBe('_blank');
    expect(openSpy.mock.calls[0][2]).toBe('noopener,noreferrer');
    openSpy.mockRestore();
  });

  it('opens the transfer dialog with active target task types only and closes without saving', async () => {
    listTaskTypes.mockResolvedValue([
      {
        id: 'task-type-1',
        type1: '개발',
        type2: '구현',
        note: '',
        display_order: 1,
        requires_service_group: true,
        is_active: true,
      },
      {
        id: 'task-type-2',
        type1: 'QA',
        type2: '검수',
        note: '',
        display_order: 2,
        requires_service_group: false,
        is_active: true,
      },
      {
        id: 'task-type-4',
        type1: 'QA',
        type2: '리뷰',
        note: '',
        display_order: 4,
        requires_service_group: false,
        is_active: true,
      },
      {
        id: 'task-type-3',
        type1: '운영',
        type2: '지원',
        note: '',
        display_order: 3,
        requires_service_group: false,
        is_active: false,
      },
    ]);
    replaceTaskTypeUsageById.mockResolvedValue(undefined);
    const user = userEvent.setup();

    renderEditor();

    await screen.findByRole('heading', { name: '업무 타입 수정' });
    expect(screen.getByRole('button', { name: '삭제' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '전환' }));

    expect(screen.getByRole('dialog', { name: '업무 타입 전환' })).toBeInTheDocument();
    expect(screen.getByText('개발 / 구현')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: '기존 항목 삭제' })).not.toBeChecked();

    const targetType1Select = screen.getByLabelText('변경할 타입1');
    const targetType2Select = screen.getByLabelText('변경할 타입2');
    expect(within(targetType1Select).getByRole('option', { name: 'QA' })).toBeInTheDocument();
    expect(within(targetType2Select).getByRole('option', { name: '검수' })).toBeInTheDocument();
    expect(within(targetType2Select).getByRole('option', { name: '리뷰' })).toBeInTheDocument();
    expect(
      within(targetType1Select).queryByRole('option', { name: '개발' }),
    ).not.toBeInTheDocument();
    expect(
      within(targetType1Select).queryByRole('option', { name: '운영' }),
    ).not.toBeInTheDocument();
    expect(
      within(targetType2Select).queryByRole('option', { name: '구현' }),
    ).not.toBeInTheDocument();
    expect(
      within(targetType2Select).queryByRole('option', { name: '지원' }),
    ).not.toBeInTheDocument();

    await user.click(
      within(screen.getByRole('dialog', { name: '업무 타입 전환' })).getByRole('button', {
        name: '취소',
      }),
    );
    expect(screen.queryByRole('dialog', { name: '업무 타입 전환' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '전환' }));
    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: '업무 타입 전환' })).not.toBeInTheDocument();
    });
    expect(replaceTaskTypeUsageById).not.toHaveBeenCalled();
  });

  it('saves task type usage transfer and returns to the task type list', async () => {
    listTaskTypes.mockResolvedValue([
      {
        id: 'task-type-1',
        type1: '개발',
        type2: '구현',
        note: '',
        display_order: 1,
        requires_service_group: true,
        is_active: true,
      },
      {
        id: 'task-type-2',
        type1: 'QA',
        type2: '검수',
        note: '',
        display_order: 2,
        requires_service_group: false,
        is_active: true,
      },
    ]);
    replaceTaskTypeUsageById.mockResolvedValue(undefined);
    const user = userEvent.setup();

    renderEditor();

    await user.click(await screen.findByRole('button', { name: '전환' }));
    await user.click(screen.getByRole('checkbox', { name: '기존 항목 삭제' }));
    await user.click(
      within(screen.getByRole('dialog', { name: '업무 타입 전환' })).getByRole('button', {
        name: '저장',
      }),
    );

    expect(replaceTaskTypeUsageById).toHaveBeenCalledWith('task-type-1', 'task-type-2', true);
    await screen.findByText('업무 타입 연관관계를 전환했습니다.');
  });

  it('keeps the transfer dialog open and shows an error when transfer fails', async () => {
    listTaskTypes.mockResolvedValue([
      {
        id: 'task-type-1',
        type1: '개발',
        type2: '구현',
        note: '',
        display_order: 1,
        requires_service_group: true,
        is_active: true,
      },
      {
        id: 'task-type-2',
        type1: 'QA',
        type2: '검수',
        note: '',
        display_order: 2,
        requires_service_group: false,
        is_active: true,
      },
    ]);
    replaceTaskTypeUsageById.mockRejectedValue(new Error('전환에 실패했습니다.'));
    const user = userEvent.setup();

    renderEditor();

    await user.click(await screen.findByRole('button', { name: '전환' }));
    await user.click(
      within(screen.getByRole('dialog', { name: '업무 타입 전환' })).getByRole('button', {
        name: '저장',
      }),
    );

    expect(await screen.findByText('전환에 실패했습니다.')).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: '업무 타입 전환' })).toBeInTheDocument();
  });

  it('disables transfer when no active target task type exists', async () => {
    listTaskTypes.mockResolvedValue([
      {
        id: 'task-type-1',
        type1: '개발',
        type2: '구현',
        note: '',
        display_order: 1,
        requires_service_group: true,
        is_active: true,
      },
      {
        id: 'task-type-2',
        type1: '운영',
        type2: '지원',
        note: '',
        display_order: 2,
        requires_service_group: false,
        is_active: false,
      },
    ]);

    renderEditor();

    const transferButton = await screen.findByRole('button', { name: '전환' });
    expect(transferButton).toBeDisabled();
    expect(screen.getByText('전환할 활성 업무 타입이 없습니다.')).toBeInTheDocument();
  });
});
