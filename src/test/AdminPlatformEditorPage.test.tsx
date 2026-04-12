import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminPlatformEditorPage } from '../pages/admin/platforms/AdminPlatformEditorPage';

const listPlatforms = vi.fn();
const savePlatformAdmin = vi.fn();
const deletePlatformAdmin = vi.fn();
const replacePlatformUsage = vi.fn();

vi.mock('../api/admin', () => ({
  adminDataClient: {
    listPlatforms: (...args: unknown[]) => listPlatforms(...args),
    savePlatformAdmin: (...args: unknown[]) => savePlatformAdmin(...args),
    deletePlatformAdmin: (...args: unknown[]) => deletePlatformAdmin(...args),
    replacePlatformUsage: (...args: unknown[]) => replacePlatformUsage(...args),
  },
}));

function PlatformListRoute() {
  const location = useLocation();
  const statusMessage = (location.state as { statusMessage?: string } | null)?.statusMessage;
  return <div>{statusMessage ?? 'platform list'}</div>;
}

function renderEditor(initialEntry = '/admin/platform/platform-1/edit') {
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
          <Route path="/admin/platform" element={<PlatformListRoute />} />
          <Route path="/admin/platform/:platformId/edit" element={<AdminPlatformEditorPage />} />
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  listPlatforms.mockReset();
  savePlatformAdmin.mockReset();
  deletePlatformAdmin.mockReset();
  replacePlatformUsage.mockReset();
});

afterEach(() => {
  cleanup();
});

describe('AdminPlatformEditorPage', () => {
  it('opens the transfer dialog with visible target platforms only and closes without saving', async () => {
    listPlatforms.mockResolvedValue([
      { id: 'platform-1', name: '기존 플랫폼', display_order: 1, is_visible: true },
      { id: 'platform-2', name: '새 플랫폼', display_order: 2, is_visible: true },
      { id: 'platform-3', name: '숨김 플랫폼', display_order: 3, is_visible: false },
    ]);
    replacePlatformUsage.mockResolvedValue(undefined);
    const user = userEvent.setup();

    renderEditor();

    await screen.findByRole('heading', { name: '플랫폼 수정' });
    expect(screen.getByRole('button', { name: '삭제' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '전환' }));

    expect(screen.getByRole('dialog', { name: '플랫폼 전환' })).toBeInTheDocument();
    expect(screen.getByText('기존 플랫폼')).toBeInTheDocument();

    const targetSelect = screen.getByLabelText('변경할 항목');
    expect(within(targetSelect).getByRole('option', { name: '새 플랫폼' })).toBeInTheDocument();
    expect(
      within(targetSelect).queryByRole('option', { name: '기존 플랫폼' }),
    ).not.toBeInTheDocument();
    expect(
      within(targetSelect).queryByRole('option', { name: '숨김 플랫폼' }),
    ).not.toBeInTheDocument();

    await user.click(
      within(screen.getByRole('dialog', { name: '플랫폼 전환' })).getByRole('button', {
        name: '취소',
      }),
    );
    expect(screen.queryByRole('dialog', { name: '플랫폼 전환' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '전환' }));
    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: '플랫폼 전환' })).not.toBeInTheDocument();
    });
    expect(replacePlatformUsage).not.toHaveBeenCalled();
  });

  it('saves platform usage transfer and returns to the platform list', async () => {
    listPlatforms.mockResolvedValue([
      { id: 'platform-1', name: '기존 플랫폼', display_order: 1, is_visible: true },
      { id: 'platform-2', name: '새 플랫폼', display_order: 2, is_visible: true },
    ]);
    replacePlatformUsage.mockResolvedValue(undefined);
    const user = userEvent.setup();

    renderEditor();

    await user.click(await screen.findByRole('button', { name: '전환' }));
    await user.click(
      within(screen.getByRole('dialog', { name: '플랫폼 전환' })).getByRole('button', {
        name: '저장',
      }),
    );

    expect(replacePlatformUsage).toHaveBeenCalledWith('platform-1', 'platform-2');
    await screen.findByText('플랫폼 연관관계를 전환했습니다.');
  });

  it('keeps the transfer dialog open and shows an error when transfer fails', async () => {
    listPlatforms.mockResolvedValue([
      { id: 'platform-1', name: '기존 플랫폼', display_order: 1, is_visible: true },
      { id: 'platform-2', name: '새 플랫폼', display_order: 2, is_visible: true },
    ]);
    replacePlatformUsage.mockRejectedValue(new Error('전환에 실패했습니다.'));
    const user = userEvent.setup();

    renderEditor();

    await user.click(await screen.findByRole('button', { name: '전환' }));
    await user.click(
      within(screen.getByRole('dialog', { name: '플랫폼 전환' })).getByRole('button', {
        name: '저장',
      }),
    );

    expect(await screen.findByText('전환에 실패했습니다.')).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: '플랫폼 전환' })).toBeInTheDocument();
  });

  it('disables transfer when no visible target platform exists', async () => {
    listPlatforms.mockResolvedValue([
      { id: 'platform-1', name: '기존 플랫폼', display_order: 1, is_visible: true },
      { id: 'platform-2', name: '숨김 플랫폼', display_order: 2, is_visible: false },
    ]);

    renderEditor();

    const transferButton = await screen.findByRole('button', { name: '전환' });
    expect(transferButton).toBeDisabled();
    expect(screen.getByText('전환할 노출 플랫폼이 없습니다.')).toBeInTheDocument();
  });
});
