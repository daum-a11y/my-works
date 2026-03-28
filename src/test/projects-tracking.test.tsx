import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProjectEditorPage, ProjectsFeature } from '../features/projects';
import { toLocalDateInputValue } from '../lib/utils';

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

function renderProjectsList() {
  const queryClient = new QueryClient();

  return render(
    <MemoryRouter initialEntries={['/projects']}>
      <QueryClientProvider client={queryClient}>
        <Routes>
          <Route path="/projects" element={<ProjectsFeature />} />
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

function renderProjectEditor(initialEntry: string) {
  const queryClient = new QueryClient();

  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <QueryClientProvider client={queryClient}>
        <Routes>
          <Route path="/projects" element={<div>projects-list-page</div>} />
          <Route path="/projects/new" element={<ProjectEditorPage />} />
          <Route path="/projects/:projectId/edit" element={<ProjectEditorPage />} />
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe('Projects routes', () => {
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
        trackStatus: '전체 수정',
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
      trackStatus: '미수정',
      monitoringInProgress: false,
      qaInProgress: false,
      note: '',
      updatedAt: '2026-03-24T09:00:00.000Z',
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders date range filters and links to the new project page', async () => {
    renderProjectsList();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: '프로젝트 관리' })).toBeInTheDocument();
      expect(screen.getByText('알파')).toBeInTheDocument();
    });

    const today = new Date();
    const aYearAgo = new Date(today);
    aYearAgo.setFullYear(aYearAgo.getFullYear() - 1);

    expect(screen.getByText('총 건수')).toBeInTheDocument();
    expect(screen.getByText('1건')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '페이지 수' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '1' })).toBeInTheDocument();
    expect(screen.getByLabelText('페이지당 행 수')).toHaveValue('50');
    expect(screen.getByLabelText('시작일')).toHaveValue(toLocalDateInputValue(aYearAgo));
    expect(screen.getByLabelText('종료일')).toHaveValue(toLocalDateInputValue(today));
    expect(screen.getByRole('link', { name: '프로젝트 추가' })).toHaveAttribute(
      'href',
      '/projects/new',
    );
    expect(screen.getByRole('link', { name: '수정' })).toHaveAttribute(
      'href',
      '/projects/project-1/edit',
    );
    expect(screen.getByRole('link', { name: '링크' })).toHaveAttribute(
      'href',
      'https://example.com/report',
    );
    expect(screen.getByText('legacy-1(운영 사용자)')).toBeInTheDocument();
    expect(screen.getByText('legacy-2(리뷰어)')).toBeInTheDocument();
  });

  it('filters projects by the selected start and end date', async () => {
    const user = userEvent.setup();

    renderProjectsList();

    await waitFor(() => {
      expect(screen.getByText('알파')).toBeInTheDocument();
    });

    await user.clear(screen.getByLabelText('시작일'));
    await user.type(screen.getByLabelText('시작일'), '2026-04-01');
    await user.clear(screen.getByLabelText('종료일'));
    await user.type(screen.getByLabelText('종료일'), '2026-04-30');
    await user.click(screen.getByRole('button', { name: '검색' }));

    await waitFor(() => {
      expect(
        screen.getByText('검색 결과가 없습니다. 새 프로젝트를 등록하거나 기간을 조정하십시오.'),
      ).toBeInTheDocument();
    });
  });

  it('searches across project metadata and member names', async () => {
    const user = userEvent.setup();

    renderProjectsList();

    await waitFor(() => {
      expect(screen.getByText('알파')).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText('검색어'), '리뷰어');
    await user.click(screen.getByRole('button', { name: '검색' }));

    await waitFor(() => {
      expect(screen.getByText('알파')).toBeInTheDocument();
    });

    await user.clear(screen.getByLabelText('검색어'));
    await user.type(screen.getByLabelText('검색어'), 'legacy-2');
    await user.click(screen.getByRole('button', { name: '검색' }));

    await waitFor(() => {
      expect(screen.getByText('알파')).toBeInTheDocument();
    });

    await user.clear(screen.getByLabelText('검색어'));
    await user.type(screen.getByLabelText('검색어'), '없는검색어');
    await user.click(screen.getByRole('button', { name: '검색' }));

    await waitFor(() => {
      expect(
        screen.getByText('검색 결과가 없습니다. 새 프로젝트를 등록하거나 기간을 조정하십시오.'),
      ).toBeInTheDocument();
    });
  });

  it('paginates projects in 50-row chunks', async () => {
    const user = userEvent.setup();

    mockOpsDataClient.getProjects.mockResolvedValue(
      Array.from({ length: 51 }, (_, index) => ({
        id: `project-${index + 1}`,
        legacyProjectId: `legacy-project-${index + 1}`,
        createdByMemberId: null,
        projectType1: 'QA',
        name: `프로젝트 ${String(index + 1).padStart(3, '0')}`,
        platform: 'iOS-App',
        serviceGroupId: 'svc-1',
        reportUrl: '',
        reporterMemberId: 'member-1',
        reviewerMemberId: 'member-2',
        startDate: '2026-03-01',
        endDate: '2026-03-31',
        isActive: true,
      })),
    );
    mockOpsDataClient.getProjectPages.mockResolvedValue(
      Array.from({ length: 51 }, (_, index) => ({
        id: `page-${index + 1}`,
        legacyPageId: `legacy-page-${index + 1}`,
        projectId: `project-${index + 1}`,
        title: `페이지 ${index + 1}`,
        url: `https://example.com/page-${index + 1}`,
        ownerMemberId: 'member-1',
        monitoringMonth: '2026-03',
        trackStatus: '전체 수정',
        monitoringInProgress: false,
        qaInProgress: false,
        note: '',
        updatedAt: '2026-03-24T09:00:00.000Z',
      })),
    );

    renderProjectsList();

    await waitFor(() => {
      expect(screen.getByText('51건')).toBeInTheDocument();
    });

    expect(screen.getByText('프로젝트 001')).toBeInTheDocument();
    expect(screen.queryByText('프로젝트 051')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '다음 페이지' }));

    await waitFor(() => {
      expect(screen.getByText('프로젝트 051')).toBeInTheDocument();
    });
  });

  it('opens the edit page and saves project and page drafts', async () => {
    const user = userEvent.setup();

    renderProjectEditor('/projects/project-1/edit');

    await waitFor(() => {
      expect(screen.getByLabelText('프로젝트 종류')).toHaveValue('QA');
    });

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

    await user.click(screen.getByRole('button', { name: '페이지 추가' }));
    await user.type(screen.getAllByLabelText('페이지명')[0], '신규 페이지');
    await user.type(screen.getAllByLabelText('페이지URL')[0], 'https://example.com/new');
    await user.click(screen.getByRole('button', { name: '추가' }));

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

    renderProjectEditor('/projects/project-1/edit');

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: '삭제' }).length).toBeGreaterThan(0);
    });

    await user.click(screen.getAllByRole('button', { name: '삭제' })[1]);

    await waitFor(() => {
      expect(mockOpsDataClient.deleteProjectPage).toHaveBeenCalledWith('page-1');
    });

    await user.click(screen.getAllByRole('button', { name: '삭제' })[0]);

    await waitFor(() => {
      expect(mockOpsDataClient.deleteProject).toHaveBeenCalledWith('project-1');
    });
  });
});
