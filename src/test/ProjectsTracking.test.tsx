import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProjectEditorPage, ProjectsPage } from '../pages/projects';
import { toLocalDateInputValue } from '../utils';

const mockUseAuth = vi.hoisted(() => vi.fn());
const mockDataClient = vi.hoisted(() => ({
  mode: 'supabase' as const,
  getMembers: vi.fn(),
  getMemberByEmail: vi.fn(),
  getMemberByAuthId: vi.fn(),
  bindAuthSessionMember: vi.fn(),
  getTaskTypes: vi.fn(),
  getPlatforms: vi.fn(),
  getServiceGroups: vi.fn(),
  getProjects: vi.fn(),
  searchProjectsPage: vi.fn(),
  getProject: vi.fn(),
  saveProject: vi.fn(),
  deleteProject: vi.fn(),
  getProjectPages: vi.fn(),
  getProjectPagesByProjectId: vi.fn(),
  getProjectPagesByProjectIds: vi.fn(),
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

vi.mock('../auth/AuthContext', () => ({
  useAuth: mockUseAuth,
}));

vi.mock('../api/client', () => ({
  dataClient: mockDataClient,
}));

function renderProjectsList() {
  const queryClient = new QueryClient();

  return render(
    <MemoryRouter initialEntries={['/projects']}>
      <QueryClientProvider client={queryClient}>
        <Routes>
          <Route path="/projects" element={<ProjectsPage />} />
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
    mockUseAuth.mockReset();
    mockDataClient.getMembers.mockReset();
    mockDataClient.getMemberByEmail.mockReset();
    mockDataClient.getMemberByAuthId.mockReset();
    mockDataClient.bindAuthSessionMember.mockReset();
    mockDataClient.getTaskTypes.mockReset();
    mockDataClient.getPlatforms.mockReset();
    mockDataClient.getServiceGroups.mockReset();
    mockDataClient.getProjects.mockReset();
    mockDataClient.searchProjectsPage.mockReset();
    mockDataClient.getProject.mockReset();
    mockDataClient.saveProject.mockReset();
    mockDataClient.deleteProject.mockReset();
    mockDataClient.getProjectPages.mockReset();
    mockDataClient.getProjectPagesByProjectId.mockReset();
    mockDataClient.getProjectPagesByProjectIds.mockReset();
    mockDataClient.getAllProjectPages.mockReset();
    mockDataClient.saveProjectPage.mockReset();
    mockDataClient.deleteProjectPage.mockReset();
    mockDataClient.getTasks.mockReset();
    mockDataClient.getAllTasks.mockReset();
    mockDataClient.saveTask.mockReset();
    mockDataClient.deleteTask.mockReset();
    mockDataClient.searchTasks.mockReset();
    mockDataClient.getDashboard.mockReset();
    mockDataClient.getStats.mockReset();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    mockUseAuth.mockReturnValue({
      status: 'authenticated',
      session: {
        member: {
          id: 'member-1',
          accountId: 'legacy-1',
          name: '운영 사용자',
          email: 'operator@example.com',
          role: 'user',
          isActive: true,
        },
      },
    });

    mockDataClient.getMembers.mockResolvedValue([
      {
        id: 'member-1',
        accountId: 'legacy-1',
        name: '운영 사용자',
        email: 'operator@example.com',
        role: 'user',
        isActive: true,
      },
      {
        id: 'member-2',
        accountId: 'legacy-2',
        name: '리뷰어',
        email: 'reviewer@example.com',
        role: 'admin',
        isActive: true,
      },
    ]);
    mockDataClient.getServiceGroups.mockResolvedValue([
      {
        id: 'svc-1',
        name: '접근성',
        costGroupId: null,
        costGroupName: '',
        displayOrder: 1,
        isActive: true,
      },
    ]);
    mockDataClient.getPlatforms.mockResolvedValue([
      {
        id: 'platform-1',
        name: 'iOS-App',
        displayOrder: 1,
        isVisible: true,
      },
    ]);
    mockDataClient.getTaskTypes.mockResolvedValue([
      {
        id: 'type-qa',
        type1: 'QA',
        type2: '사전준비',
        label: 'QA / 사전준비',
        displayOrder: 1,
        requiresServiceGroup: true,
        isActive: true,
      },
    ]);
    const baseProject = {
      id: 'project-1',
      createdByMemberId: null,
      projectType1: 'QA',
      name: '알파',
      platformId: 'platform-1',
      platform: 'iOS-App',
      serviceGroupId: 'svc-1',
      reportUrl: 'https://example.com/report',
      reporterMemberId: 'member-1',
      reviewerMemberId: 'member-2',
      startDate: '2026-03-01',
      endDate: '2026-03-31',
      isActive: true,
    } as const;

    mockDataClient.getProjects.mockResolvedValue([baseProject]);
    mockDataClient.getProject.mockResolvedValue(baseProject);
    mockDataClient.searchProjectsPage.mockImplementation(async (filters, page, pageSize) => {
      const query = filters.query ?? '';
      const items = [
        {
          ...baseProject,
          serviceGroupName: '접근성',
          reporterDisplay: 'legacy-1(운영 사용자)',
          reviewerDisplay: 'legacy-2(리뷰어)',
          pageCount: 1,
        },
      ].filter((project) => {
        if (filters.startDate && project.endDate < filters.startDate) {
          return false;
        }
        if (filters.endDate && project.startDate > filters.endDate) {
          return false;
        }
        if (!query.trim()) {
          return true;
        }

        return [project.name, 'legacy-1', '운영 사용자', 'legacy-2', '리뷰어']
          .join(' ')
          .includes(query.trim());
      });

      return {
        items: items.slice((page - 1) * pageSize, page * pageSize),
        totalCount: items.length,
        page,
        pageSize,
      };
    });
    mockDataClient.getProjectPages.mockResolvedValue([
      {
        id: 'page-1',
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
    mockDataClient.getProjectPagesByProjectId.mockResolvedValue([
      {
        id: 'page-1',
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
    mockDataClient.getProjectPagesByProjectIds.mockResolvedValue([
      {
        id: 'page-1',
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
    mockDataClient.saveProject.mockResolvedValue({
      id: 'project-1',
      createdByMemberId: null,
      projectType1: 'QA',
      name: '알파 수정',
      platformId: 'platform-1',
      platform: 'iOS-App',
      serviceGroupId: 'svc-1',
      reportUrl: 'https://example.com/report',
      reporterMemberId: 'member-1',
      reviewerMemberId: 'member-2',
      startDate: '2026-03-01',
      endDate: '2026-03-31',
      isActive: true,
    });
    mockDataClient.saveProjectPage.mockResolvedValue({
      id: 'page-2',
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

    const pagedProjects = Array.from({ length: 51 }, (_, index) => ({
      id: `project-${index + 1}`,
      createdByMemberId: null,
      projectType1: 'QA',
      name: `프로젝트 ${String(index + 1).padStart(3, '0')}`,
      platformId: 'platform-1',
      platform: 'iOS-App',
      serviceGroupId: 'svc-1',
      reportUrl: '',
      reporterMemberId: 'member-1',
      reviewerMemberId: 'member-2',
      startDate: '2026-03-01',
      endDate: '2026-03-31',
      isActive: true,
    }));
    mockDataClient.searchProjectsPage.mockImplementation(async (_, page, pageSize) => ({
      items: pagedProjects.slice((page - 1) * pageSize, page * pageSize),
      totalCount: pagedProjects.length,
      page,
      pageSize,
    }));
    mockDataClient.getProjectPagesByProjectIds.mockResolvedValue(
      Array.from({ length: 51 }, (_, index) => ({
        id: `page-${index + 1}`,
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
    await user.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() => {
      expect(mockDataClient.saveProject).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'project-1',
          projectType1: 'QA',
          name: '알파 수정',
          platformId: 'platform-1',
          serviceGroupId: 'svc-1',
        }),
      );
    });

    await user.click(screen.getByRole('button', { name: '페이지 추가' }));
    await user.type(screen.getAllByLabelText('페이지명')[0], '신규 페이지');
    await user.type(screen.getAllByLabelText('페이지URL')[0], 'https://example.com/new');
    await user.click(screen.getByRole('button', { name: '추가' }));

    await waitFor(() => {
      expect(mockDataClient.saveProjectPage).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: 'project-1',
          title: '신규 페이지',
          url: 'https://example.com/new',
          ownerMemberId: 'member-1',
        }),
      );
    });
  });

  it('renders billing group before type, service, and platform in the editor form', async () => {
    renderProjectEditor('/projects/project-1/edit');

    const costGroupField = await screen.findByLabelText('청구그룹');
    const projectTypeField = screen.getByLabelText('프로젝트 종류');
    const serviceGroupField = screen.getByLabelText('서비스그룹');
    const platformField = screen.getByLabelText('플랫폼');

    expect(
      costGroupField.compareDocumentPosition(projectTypeField) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      projectTypeField.compareDocumentPosition(serviceGroupField) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      serviceGroupField.compareDocumentPosition(platformField) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('shows the actual query error instead of falling back to not found', async () => {
    mockDataClient.getProject.mockRejectedValueOnce(new Error('프로젝트 조회 실패'));

    renderProjectEditor('/projects/project-1/edit');

    await waitFor(() => {
      expect(screen.getByText('프로젝트 조회 실패')).toBeInTheDocument();
    });
    expect(screen.queryByText('프로젝트를 찾을 수 없습니다.')).not.toBeInTheDocument();
  });

  it('deletes project and page when delete actions are confirmed', async () => {
    const user = userEvent.setup();

    renderProjectEditor('/projects/project-1/edit');

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: '삭제' }).length).toBeGreaterThan(0);
    });

    await user.click(screen.getAllByRole('button', { name: '삭제' })[1]);

    await waitFor(() => {
      expect(mockDataClient.deleteProjectPage).toHaveBeenCalledWith('page-1');
    });

    await user.click(screen.getAllByRole('button', { name: '삭제' })[0]);

    await waitFor(() => {
      expect(mockDataClient.deleteProject).toHaveBeenCalledWith('project-1');
    });
  });
});
