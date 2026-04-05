import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminMemberEditorPage } from './AdminMemberEditorPage';

const listMembersAdmin = vi.fn();
const saveMemberAdmin = vi.fn();
const createMemberAdmin = vi.fn();
const inviteMemberAdmin = vi.fn();
const resetMemberPasswordAdmin = vi.fn();
const deleteMemberAdmin = vi.fn();

vi.mock('../adminClient', () => ({
  adminDataClient: {
    listMembersAdmin: (...args: unknown[]) => listMembersAdmin(...args),
    saveMemberAdmin: (...args: unknown[]) => saveMemberAdmin(...args),
    createMemberAdmin: (...args: unknown[]) => createMemberAdmin(...args),
    inviteMemberAdmin: (...args: unknown[]) => inviteMemberAdmin(...args),
    resetMemberPasswordAdmin: (...args: unknown[]) => resetMemberPasswordAdmin(...args),
    deleteMemberAdmin: (...args: unknown[]) => deleteMemberAdmin(...args),
  },
}));

function renderEditor(initialEntry: string) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <QueryClientProvider client={queryClient}>
        <Routes>
          <Route path="/admin/members/new" element={<AdminMemberEditorPage />} />
          <Route path="/admin/members/:memberId/edit" element={<AdminMemberEditorPage />} />
          <Route path="/admin/members" element={<div>members list</div>} />
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  listMembersAdmin.mockReset();
  saveMemberAdmin.mockReset();
  createMemberAdmin.mockReset();
  inviteMemberAdmin.mockReset();
  resetMemberPasswordAdmin.mockReset();
  deleteMemberAdmin.mockReset();
  listMembersAdmin.mockResolvedValue([]);
  saveMemberAdmin.mockResolvedValue({});
  createMemberAdmin.mockResolvedValue({ action: 'created', memberId: 'member-1' });
  inviteMemberAdmin.mockResolvedValue(undefined);
  resetMemberPasswordAdmin.mockResolvedValue(undefined);
  vi.spyOn(window, 'confirm').mockReturnValue(true);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('AdminMemberEditorPage', () => {
  it('starts new members in pending state and hides extra fields', async () => {
    renderEditor('/admin/members/new');

    expect(await screen.findByRole('heading', { name: '사용자 추가' })).toBeInTheDocument();
    expect(screen.queryByText('승인 상태')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('업무보고 접근')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('비고')).not.toBeInTheDocument();
  });

  it('saves new members with pending status and report target enabled by default', async () => {
    const user = userEvent.setup();

    renderEditor('/admin/members/new');

    await screen.findByRole('heading', { name: '사용자 추가' });

    await user.type(screen.getByLabelText('ID'), 'new.user');
    await user.type(screen.getByLabelText('이름'), '새 사용자');
    await user.type(screen.getByLabelText('이메일'), 'new.user@example.com');
    await user.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() => {
      expect(createMemberAdmin).toHaveBeenCalledWith(
        expect.objectContaining({
          accountId: 'new.user',
          name: '새 사용자',
          email: 'new.user@example.com',
          memberStatus: 'pending',
          reportRequired: true,
          note: '',
        }),
      );
      expect(saveMemberAdmin).not.toHaveBeenCalled();
      expect(inviteMemberAdmin).not.toHaveBeenCalled();
    });
  });

  it('sends an invite for a member without an auth account', async () => {
    const user = userEvent.setup();
    listMembersAdmin.mockResolvedValue([
      {
        id: 'member-1',
        authUserId: null,
        accountId: 'rhea.l',
        name: '이유진',
        email: 'rhea.l@linkagelab.co.kr',
        note: '',
        role: 'user',
        userActive: true,
        memberStatus: 'active',
        reportRequired: true,
        isActive: true,
        authEmail: '',
        queueReasons: [],
        joinedAt: '2026-03-01T00:00:00.000Z',
        lastLoginAt: '',
        updatedAt: '2026-03-27T00:00:00.000Z',
      },
    ]);

    renderEditor('/admin/members/member-1/edit');

    await screen.findByDisplayValue('rhea.l');
    await user.click(screen.getByRole('button', { name: '초대 메일 발송' }));

    await waitFor(() => {
      expect(createMemberAdmin).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'member-1',
          email: 'rhea.l@linkagelab.co.kr',
          accountId: 'rhea.l',
          name: '이유진',
          role: 'user',
          memberStatus: 'active',
          reportRequired: true,
        }),
      );
      expect(resetMemberPasswordAdmin).not.toHaveBeenCalled();
      expect(inviteMemberAdmin).not.toHaveBeenCalled();
    });
  });

  it('shows password reset for members with auth account', async () => {
    const user = userEvent.setup();
    listMembersAdmin.mockResolvedValue([
      {
        id: 'member-1',
        authUserId: 'auth-1',
        accountId: 'rhea.l',
        name: '이유진',
        email: 'rhea.l@linkagelab.co.kr',
        note: '',
        role: 'user',
        userActive: true,
        memberStatus: 'active',
        reportRequired: true,
        isActive: true,
        authEmail: 'rhea.l@linkagelab.co.kr',
        queueReasons: [],
        joinedAt: '2026-03-01T00:00:00.000Z',
        lastLoginAt: '',
        updatedAt: '2026-03-27T00:00:00.000Z',
      },
    ]);

    renderEditor('/admin/members/member-1/edit');

    await screen.findByDisplayValue('rhea.l');
    await user.click(screen.getByRole('button', { name: '비밀번호 재설정' }));

    await waitFor(() => {
      expect(resetMemberPasswordAdmin).toHaveBeenCalledWith({
        email: 'rhea.l@linkagelab.co.kr',
      });
      expect(inviteMemberAdmin).not.toHaveBeenCalled();
    });
  });

  it('locks email edits for members with auth account and preserves the original email on save', async () => {
    const user = userEvent.setup();
    listMembersAdmin.mockResolvedValue([
      {
        id: 'member-1',
        authUserId: 'auth-1',
        accountId: 'rhea.l',
        name: '이유진',
        email: 'rhea.l@linkagelab.co.kr',
        note: '',
        role: 'user',
        userActive: true,
        memberStatus: 'active',
        reportRequired: true,
        isActive: true,
        authEmail: 'rhea.l@linkagelab.co.kr',
        queueReasons: [],
        joinedAt: '2026-03-01T00:00:00.000Z',
        lastLoginAt: '',
        updatedAt: '2026-03-27T00:00:00.000Z',
      },
    ]);

    renderEditor('/admin/members/member-1/edit');

    const emailInput = (await screen.findByDisplayValue(
      'rhea.l@linkagelab.co.kr',
    )) as HTMLInputElement;
    expect(emailInput).toHaveAttribute('readonly');

    await user.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() => {
      expect(saveMemberAdmin).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'rhea.l@linkagelab.co.kr',
        }),
      );
    });
  });

  it('blocks password reset when auth email is missing', async () => {
    const user = userEvent.setup();
    listMembersAdmin.mockResolvedValue([
      {
        id: 'member-1',
        authUserId: 'auth-1',
        accountId: 'rhea.l',
        name: '이유진',
        email: 'changed@linkagelab.co.kr',
        note: '',
        role: 'user',
        userActive: true,
        memberStatus: 'active',
        reportRequired: true,
        isActive: true,
        authEmail: '',
        queueReasons: [],
        joinedAt: '2026-03-01T00:00:00.000Z',
        lastLoginAt: '',
        updatedAt: '2026-03-27T00:00:00.000Z',
      },
    ]);

    renderEditor('/admin/members/member-1/edit');

    await screen.findByDisplayValue('rhea.l');
    await user.click(screen.getByRole('button', { name: '비밀번호 재설정' }));

    await waitFor(() => {
      expect(
        screen.getByText('Auth 이메일이 없어 비밀번호 재설정 메일을 보낼 수 없습니다.'),
      ).toBeInTheDocument();
      expect(resetMemberPasswordAdmin).not.toHaveBeenCalled();
    });
  });
});
