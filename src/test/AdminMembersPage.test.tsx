import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminMembersPage } from '../pages/admin/members/AdminMembersPage';

const listMembersAdmin = vi.fn();
const saveMemberAdmin = vi.fn();
const inviteMemberAdmin = vi.fn();
const deleteMemberAdmin = vi.fn<(...args: unknown[]) => Promise<'deleted' | 'deactivated'>>();

vi.mock('../api/admin', () => ({
  adminDataClient: {
    listMembersAdmin: (...args: unknown[]) => listMembersAdmin(...args),
    saveMemberAdmin: (...args: unknown[]) => saveMemberAdmin(...args),
    inviteMemberAdmin: (...args: unknown[]) => inviteMemberAdmin(...args),
    deleteMemberAdmin: (...args: unknown[]) => deleteMemberAdmin(...args),
  },
}));

beforeEach(() => {
  vi.restoreAllMocks();
  listMembersAdmin.mockReset();
  saveMemberAdmin.mockReset();
  inviteMemberAdmin.mockReset();
  deleteMemberAdmin.mockReset();
  vi.spyOn(window, 'confirm').mockReturnValue(true);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('AdminMembersPage', () => {
  it('renders the original-style member table without auth queue columns', async () => {
    listMembersAdmin.mockResolvedValue([
      {
        id: 'member-1',
        authUserId: 'auth-1',
        accountId: 'jenny.c',
        name: '제니',
        email: 'jenny@example.com',
        note: '',
        role: 'user',
        userActive: true,
        reportRequired: true,
        isActive: true,
        authEmail: 'jenny@example.com',
        queueReasons: [],
        joinedAt: '2026-03-01T00:00:00.000Z',
        lastLoginAt: '2026-03-28T00:00:00.000Z',
        updatedAt: '2026-03-27T00:00:00.000Z',
      },
    ]);

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <AdminMembersPage />
        </QueryClientProvider>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: '사용자 관리' })).toBeInTheDocument();
    await screen.findAllByRole('link', { name: '수정' });
    expect(screen.getByRole('heading', { name: '필터' })).toBeInTheDocument();
    expect(screen.getByText('활성 사용자')).toBeInTheDocument();
    expect(screen.getByLabelText('사용자 목록 상태')).toHaveTextContent('활성 사용자1명');
    expect(screen.getByLabelText('사용자 목록 페이지 이동')).toHaveTextContent('1/ 1');
    expect(screen.getByLabelText('페이지당 행 수')).toHaveValue('50');

    expect(screen.getByRole('columnheader', { name: /ID/ })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /이름/ })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /이메일/ })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /권한/ })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /활성여부/ })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /승인상태/ })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /업무보고접근/ })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /등록일/ })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /최종로그인/ })).toBeInTheDocument();
    expect(screen.getByText('허용')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '사용자 추가' })).toHaveAttribute(
      'href',
      '/admin/members/new',
    );
    expect(screen.getByRole('link', { name: '수정' })).toHaveAttribute(
      'href',
      '/admin/members/member-1/edit',
    );
    expect(screen.queryByRole('button', { name: '초대 메일' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '삭제' })).not.toBeInTheDocument();
    expect(screen.queryByText('Auth 연결')).not.toBeInTheDocument();
  });

  it('filters members by status and keyword', async () => {
    listMembersAdmin.mockResolvedValue([
      {
        id: 'member-1',
        authUserId: 'auth-1',
        accountId: 'jenny.c',
        name: '제니',
        email: 'jenny@example.com',
        note: '',
        role: 'user',
        userActive: true,
        reportRequired: true,
        isActive: true,
        authEmail: 'jenny@example.com',
        queueReasons: [],
        joinedAt: '2026-03-01T00:00:00.000Z',
        lastLoginAt: '2026-03-28T00:00:00.000Z',
        updatedAt: '2026-03-27T00:00:00.000Z',
      },
      {
        id: 'member-2',
        authUserId: 'auth-2',
        accountId: 'baro.h',
        name: '바로',
        email: 'baro@example.com',
        note: '',
        role: 'admin',
        userActive: false,
        reportRequired: false,
        isActive: false,
        authEmail: 'baro@example.com',
        queueReasons: [],
        joinedAt: '2026-03-05T00:00:00.000Z',
        lastLoginAt: '2026-03-10T00:00:00.000Z',
        updatedAt: '2026-03-27T00:00:00.000Z',
      },
    ]);

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <AdminMembersPage />
        </QueryClientProvider>
      </MemoryRouter>,
    );

    await screen.findAllByRole('link', { name: '수정' });

    await user.selectOptions(screen.getByLabelText('활성 여부'), 'inactive');
    await user.type(screen.getByLabelText('검색어'), 'baro');
    await user.click(screen.getByRole('button', { name: '검색' }));

    expect(screen.getByText('바로')).toBeInTheDocument();
    expect(screen.queryByText('제니')).not.toBeInTheDocument();
  });

  it('paginates member rows with the same controls as the projects page', async () => {
    listMembersAdmin.mockResolvedValue(
      Array.from({ length: 60 }, (_, index) => ({
        id: `member-${index + 1}`,
        authUserId: `auth-${index + 1}`,
        accountId: `user.${index + 1}`,
        name: `사용자${index + 1}`,
        email: `user${index + 1}@example.com`,
        note: '',
        role: 'user',
        userActive: true,
        memberStatus: 'active',
        reportRequired: true,
        isActive: true,
        authEmail: `user${index + 1}@example.com`,
        queueReasons: [],
        joinedAt: '2026-03-01T00:00:00.000Z',
        lastLoginAt: '2026-03-28T00:00:00.000Z',
        updatedAt: '2026-03-27T00:00:00.000Z',
      })),
    );

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <AdminMembersPage />
        </QueryClientProvider>
      </MemoryRouter>,
    );

    await screen.findByText('사용자1');
    expect(screen.queryByText('사용자51')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '다음 페이지' }));

    expect(await screen.findByText('사용자51')).toBeInTheDocument();
    expect(screen.queryByText('사용자1')).not.toBeInTheDocument();
    expect(screen.getByLabelText('사용자 목록 페이지 이동')).toHaveTextContent('2/ 2');
  });
});
