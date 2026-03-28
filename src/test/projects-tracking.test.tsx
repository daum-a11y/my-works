import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProjectsFeature } from '../features/projects';

const mockUseAuth = vi.hoisted(() => vi.fn());
const mockOpsDataClient = vi.hoisted(() => ({
  mode: 'supabase' as const,
  getMembers: vi.fn(),
  getMemberByEmail: vi.fn(),
  getMemberByAuthId: vi.fn(),
  bindAuthSessionMember: vi.fn(),
  getTaskTypes: vi.fn(),
  getServiceGroups: vi.fn(),
  getProjects: vi.fn(),
  saveProject: vi.fn(),
  deleteProject: vi.fn(),
  getProjectPages: vi.fn(),
  getAllProjectPages: vi.fn(),
  saveProjectPage: vi.fn(),
  deleteProjectPage: vi.fn(),
  getTasks: vi.fn(),
  getAllTasks: vi.fn(),
  saveTask: vi.fn(),
  deleteTask: vi.fn(),
  searchTasks: vi.fn(),
  getDashboard: vi.fn(),
  getStats: vi.fn(),
}));

vi.mock('../features/auth/AuthContext', () => ({
  useAuth: mockUseAuth,
}));

vi.mock('../lib/data-client', () => ({
  opsDataClient: mockOpsDataClient,
}));

describe('ProjectsFeature', () => {
  beforeEach(() => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    mockUseAuth.mockReturnValue({
      status: 'authenticated',
      session: {
        member: {
          id: 'member-1',
          legacyUserId: 'legacy-1',
          name: '운영 사용자',
          email: 'operator@example.com',
          role: 'user',
          isActive: true,
        },
      },
    });

    mockOpsDataClient.getMembers.mockResolvedValue([
      {
        id: 'member-1',
        legacyUserId: 'legacy-1',
        name: '운영 사용자',
        email: 'operator@example.com',
        role: 'user',
        isActive: true,
      },
      {
        id: 'member-2',
        legacyUserId: 'legacy-2',
        name: '리뷰어',
        email: 'reviewer@example.com',
        role: 'admin',
        isActive: true,
      },
    ]);
    mockOpsDataClient.getServiceGroups.mockResolvedValue([
      {
        id: 'svc-1',
        legacyServiceGroupId: 'legacy-svc-1',
        name: '접근성',
        displayOrder: 1,
      },
    ]);
    mockOpsDataClient.getProjects.mockResolvedValue([
      {
        id: 'project-1',
        legacyProjectId: 'legacy-project-1',
        createdByMemberId: null,
        projectType1: 'QA',
        name: '알파',
        platform: 'iOS-App',
        serviceGroupId: 'svc-1',
        reportUrl: 'https://example.com/report',
        reporterMemberId: 'member-1',
        reviewerMemberId: 'member-2',
        startDate: '2026-03-01',
        endDate: '2026-03-31',
        isActive: true,
      },
    ]);
    mockOpsDataClient.getProjectPages.mockResolvedValue([
      {
        id: 'page-1',
        legacyPageId: 'legacy-page-1',
        projectId: 'project-1',
        title: '로그인',
        url: 'https://example.com/login',
        ownerMemberId: 'member-1',
        trackStatus: '개선',
        monitoringInProgress: true,
        qaInProgress: false,
        note: '메모',
        updatedAt: '2026-03-24T09:00:00.000Z',
      },
    ]);
    mockOpsDataClient.saveProject.mockResolvedValue({
      id: 'project-1',
      legacyProjectId: 'legacy-project-1',
      createdByMemberId: null,
      projectType1: 'QA',
      name: '알파 수정',
      platform: 'iOS-App',
      serviceGroupId: 'svc-1',
      reportUrl: 'https://example.com/report',
      reporterMemberId: 'member-1',
      reviewerMemberId: 'member-2',
      startDate: '2026-03-01',
      endDate: '2026-03-31',
      isActive: true,
    });
    mockOpsDataClient.saveProjectPage.mockResolvedValue({
      id: 'page-2',
      legacyPageId: 'legacy-page-2',
      projectId: 'project-1',
      title: '신규 페이지',
      url: 'https://example.com/new',
      ownerMemberId: 'member-1',
      trackStatus: '미개선',
      monitoringInProgress: false,
      qaInProgress: false,
      note: '',
      updatedAt: '2026-03-24T09:00:00.000Z',
    });
  });

  it('renders the original project list controls', async () => {
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <ProjectsFeature />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: '프로젝트 관리' })).toBeInTheDocument();
      expect(screen.getByText('알파')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: '프로젝트 추가하기' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '전체' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '전년 하반기' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '올해 상반기' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '올해 하반기' })).toBeInTheDocument();
    expect(screen.getByText('QA')).toBeInTheDocument();
    expect(screen.getByText('접근성')).toBeInTheDocument();
    expect(screen.getByText('https://example.com/report')).toBeInTheDocument();
  });

  it('opens the editor and saves project and page drafts', async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <ProjectsFeature />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '수정 및 추가' })).toBeInTheDocument();
    });

    await user.click(screen.getAllByRole('button', { name: '수정 및 추가' })[0]);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: '프로젝트 정보 수정' })).toBeInTheDocument();
    });

    expect(screen.getByLabelText('프로젝트 종류')).toHaveValue('QA');
    await user.clear(screen.getByLabelText('프로젝트명'));
    await user.type(screen.getByLabelText('프로젝트명'), '알파 수정');
    await user.click(screen.getByRole('button', { name: '저장하기' }));

    await waitFor(() => {
      expect(mockOpsDataClient.saveProject).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'project-1',
          projectType1: 'QA',
          name: '알파 수정',
          platform: 'iOS-App',
          serviceGroupId: 'svc-1',
        }),
      );
    });

    await user.click(screen.getByRole('button', { name: '페이지 추가하기' }));

    await user.type(screen.getAllByLabelText('페이지명')[0], '신규 페이지');
    await user.type(screen.getAllByLabelText('페이지URL')[0], 'https://example.com/new');
    await user.click(screen.getByRole('button', { name: '추가하기' }));

    await waitFor(() => {
      expect(mockOpsDataClient.saveProjectPage).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: 'project-1',
          title: '신규 페이지',
          url: 'https://example.com/new',
          ownerMemberId: 'member-1',
        }),
      );
    });
  });

  it('deletes project and page when delete actions are confirmed', async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <ProjectsFeature />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: '삭제' }).length).toBeGreaterThan(0);
    });

    await user.click(screen.getAllByRole('button', { name: '수정 및 추가' })[0]);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: '프로젝트 정보 수정' })).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: '삭제' });
    await user.click(deleteButtons[1]);

    await waitFor(() => {
      expect(mockOpsDataClient.deleteProjectPage).toHaveBeenCalledWith('page-1');
    });

    await user.click(screen.getAllByRole('button', { name: '삭제' })[0]);

    await waitFor(() => {
      expect(mockOpsDataClient.deleteProject).toHaveBeenCalledWith('project-1');
    });
  });
});
