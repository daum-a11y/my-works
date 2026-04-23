import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
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
  getProjectSubtasks: vi.fn(),
  getProjectSubtasksByProjectId: vi.fn(),
  getProjectSubtasksByProjectIds: vi.fn(),
  getAllProjectSubtasks: vi.fn(),
  saveProjectSubtask: vi.fn(),
  deleteProjectSubtask: vi.fn(),
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

vi.mock('../api/members', () => (mockDataClient));

vi.mock('../api/platforms', () => (mockDataClient));

vi.mock('../api/projects', () => (mockDataClient));

vi.mock('../api/serviceGroups', () => (mockDataClient));

vi.mock('../api/taskTypes', () => (mockDataClient));

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
    mockDataClient.getProjectSubtasks.mockReset();
    mockDataClient.getProjectSubtasksByProjectId.mockReset();
    mockDataClient.getProjectSubtasksByProjectIds.mockReset();
    mockDataClient.getAllProjectSubtasks.mockReset();
    mockDataClient.saveProjectSubtask.mockReset();
    mockDataClient.deleteProjectSubtask.mockReset();
    mockDataClient.getTasks.mockReset();
    mockDataClient.getAllTasks.mockReset();
    mockDataClient.saveTask.mockReset();
    mockDataClient.deleteTask.mockReset();
    mockDataClient.searchTasks.mockReset();
    mockDataClient.getDashboard.mockReset();
    mockDataClient.getStats.mockReset();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(window, 'alert').mockImplementation(() => undefined);
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
      taskTypeId: 'type-qa',
      taskType1: 'QA',
      name: '알파',
      platformId: 'platform-1',
      platform: 'iOS-App',
      costGroupName: '내부',
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
          serviceName: '접근성 포털',
          reporterAccountId: 'legacy-1',
          reporterName: '운영 사용자',
          reviewerAccountId: 'legacy-2',
          reviewerName: '리뷰어',
          subtaskCount: 1,
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
    mockDataClient.getProjectSubtasks.mockResolvedValue([
      {
        id: 'subtask-1',
        projectId: 'project-1',
        title: '로그인',
        url: 'https://example.com/login',
        ownerMemberId: 'member-1',
        taskDate: '2026-03-24',
        taskStatus: '전체 수정',
        note: '메모',
        updatedAt: '2026-03-24T09:00:00.000Z',
      },
    ]);
    mockDataClient.getProjectSubtasksByProjectId.mockResolvedValue([
      {
        id: 'subtask-1',
        projectId: 'project-1',
        title: '로그인',
        url: 'https://example.com/login',
        ownerMemberId: 'member-1',
        taskDate: '2026-03-24',
        taskStatus: '전체 수정',
        note: '메모',
        updatedAt: '2026-03-24T09:00:00.000Z',
      },
    ]);
    mockDataClient.getProjectSubtasksByProjectIds.mockResolvedValue([
      {
        id: 'subtask-1',
        projectId: 'project-1',
        title: '로그인',
        url: 'https://example.com/login',
        ownerMemberId: 'member-1',
        taskDate: '2026-03-24',
        taskStatus: '전체 수정',
        note: '메모',
        updatedAt: '2026-03-24T09:00:00.000Z',
      },
    ]);
    mockDataClient.saveProject.mockResolvedValue({
      id: 'project-1',
      createdByMemberId: null,
      taskType1: 'QA',
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
    mockDataClient.saveProjectSubtask.mockResolvedValue({
      id: 'subtask-2',
      projectId: 'project-1',
      title: '신규 태스크',
      url: 'https://example.com/new',
      ownerMemberId: 'member-1',
      taskDate: '',
      taskStatus: '미수정',
      note: '',
      updatedAt: '2026-03-24T09:00:00.000Z',
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
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
    expect(screen.getByRole('button', { name: /청구그룹 정렬/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /태스크 수 정렬/ })).toBeInTheDocument();
    expect(screen.getByLabelText('페이지당 행 수')).toHaveValue('50');
    expect(screen.getByLabelText('시작일')).toHaveValue(
      toLocalDateInputValue(aYearAgo).replaceAll('-', '.'),
    );
    expect(screen.getByLabelText('종료일')).toHaveValue(
      toLocalDateInputValue(today).replaceAll('-', '.'),
    );
    expect(screen.getByLabelText('시작일')).toHaveAttribute('max', toLocalDateInputValue(today));
    expect(screen.getByLabelText('종료일')).toHaveAttribute('min', toLocalDateInputValue(aYearAgo));
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
    expect(screen.getByText('내부')).toBeInTheDocument();
    expect(screen.getByText('접근성 포털')).toBeInTheDocument();
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
      expect(screen.getByText('검색 조건에 맞는 프로젝트가 없습니다.')).toBeInTheDocument();
      expect(screen.getByText('검색어 또는 기간을 조정하십시오.')).toBeInTheDocument();
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
      expect(screen.getByText('검색 조건에 맞는 프로젝트가 없습니다.')).toBeInTheDocument();
      expect(screen.getByText('검색어 또는 기간을 조정하십시오.')).toBeInTheDocument();
    });
  });

  it('sorts projects by sortable headers', async () => {
    const user = userEvent.setup();
    const baseProjectA = {
      id: 'project-1',
      createdByMemberId: null,
      taskTypeId: 'type-qa',
      taskType1: 'QA',
      name: '알파',
      platformId: 'platform-1',
      platform: 'iOS-App',
      costGroupName: '내부',
      serviceGroupId: 'svc-1',
      serviceGroupName: '접근성',
      serviceName: '접근성 포털',
      reportUrl: 'https://example.com/report-a',
      reporterMemberId: 'member-1',
      reviewerMemberId: 'member-2',
      reporterAccountId: 'legacy-1',
      reporterName: '운영 사용자',
      reviewerAccountId: 'legacy-2',
      reviewerName: '리뷰어',
      startDate: '2026-03-01',
      endDate: '2026-03-31',
      isActive: true,
      subtaskCount: 3,
    };
    const baseProjectB = {
      ...baseProjectA,
      id: 'project-2',
      name: '베타',
      costGroupName: '외부',
      serviceGroupName: '검색',
      serviceName: '통합검색',
      reportUrl: 'https://example.com/report-b',
      startDate: '2026-02-01',
      endDate: '2026-02-28',
      subtaskCount: 1,
    };

    mockDataClient.searchProjectsPage.mockResolvedValue({
      items: [baseProjectA, baseProjectB],
      totalCount: 2,
    });

    renderProjectsList();

    await waitFor(() => {
      expect(screen.getByText('알파')).toBeInTheDocument();
      expect(screen.getByText('베타')).toBeInTheDocument();
    });

    const table = screen.getByRole('table', { name: '프로젝트 리스트' });
    const firstDataRow = () => within(table).getAllByRole('row')[1];

    expect(firstDataRow()).toHaveTextContent('알파');

    await user.click(screen.getByRole('button', { name: /태스크 수 정렬, 클릭하면 오름차순/ }));

    expect(firstDataRow()).toHaveTextContent('베타');
    expect(
      within(table).getByRole('columnheader', { name: /태스크 수 오름차순으로 정렬 중/ }),
    ).toBeInTheDocument();
  });

  it('paginates projects in 50-row chunks', async () => {
    const user = userEvent.setup();

    const pagedProjects = Array.from({ length: 51 }, (_, index) => ({
      id: `project-${index + 1}`,
      createdByMemberId: null,
      taskType1: 'QA',
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
    mockDataClient.getProjectSubtasksByProjectIds.mockResolvedValue(
      Array.from({ length: 51 }, (_, index) => ({
        id: `subtask-${index + 1}`,
        projectId: `project-${index + 1}`,
        title: `태스크 ${index + 1}`,
        url: `https://example.com/subtask-${index + 1}`,
        ownerMemberId: 'member-1',
        taskDate: '2026-03-24',
        taskStatus: '전체 수정',
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

  it('opens the edit page and saves project and subtask drafts', async () => {
    const user = userEvent.setup();

    renderProjectEditor('/projects/project-1/edit');

    await waitFor(() => {
      expect(screen.getByLabelText('프로젝트 종류')).toHaveValue('type-qa');
    });
    expect(screen.getByLabelText('QA시작일')).toHaveAttribute('max', '2026-03-31');
    expect(screen.getByLabelText('QA종료일')).toHaveAttribute('min', '2026-03-01');

    await user.clear(screen.getByLabelText('프로젝트명'));
    await user.type(screen.getByLabelText('프로젝트명'), '알파 수정');
    await user.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() => {
      expect(mockDataClient.saveProject).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'project-1',
          taskTypeId: 'type-qa',
          name: '알파 수정',
          platformId: 'platform-1',
          serviceGroupId: 'svc-1',
        }),
      );
    });

    const taskTable = await screen.findByRole('table', { name: '태스크 리스트' });
    await user.click(within(taskTable).getByRole('button', { name: '수정' }));
    await waitFor(() => {
      expect(document.querySelector('#subtask-status-subtask-1')).toBeInTheDocument();
    });
    await user.selectOptions(document.querySelector('#subtask-status-subtask-1')!, '미수정');
    await user.clear(await screen.findByLabelText('비고'));
    await user.type(screen.getByLabelText('비고'), '비고 수정');
    await user.click(screen.getByRole('button', { name: '태스크 저장' }));

    await waitFor(() => {
      expect(mockDataClient.saveProjectSubtask).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'subtask-1',
          taskStatus: '미수정',
          note: '비고 수정',
        }),
      );
    });

    await user.click(screen.getByRole('button', { name: '태스크 추가' }));
    await user.type(screen.getAllByLabelText('태스크명')[0], '신규 태스크');
    await user.type(screen.getAllByLabelText('보고서 URL')[0], 'https://example.com/new');
    await user.type(screen.getAllByLabelText('비고')[0], '신규 비고');
    await user.selectOptions(screen.getAllByLabelText('상태')[0], '일부 수정');
    await user.click(screen.getByRole('button', { name: '추가' }));

    await waitFor(() => {
      expect(mockDataClient.saveProjectSubtask).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: 'project-1',
          title: '신규 태스크',
          url: 'https://example.com/new',
          ownerMemberId: 'member-1',
          taskStatus: '일부 수정',
          note: '신규 비고',
        }),
      );
    });
  }, 20_000);

  it('alerts when subtask save is rejected', async () => {
    const user = userEvent.setup();
    mockDataClient.saveProjectSubtask.mockRejectedValueOnce({
      code: 'P0001',
      message: 'project not found',
    });

    renderProjectEditor('/projects/project-1/edit');

    await waitFor(() => {
      expect(screen.getByLabelText('프로젝트 종류')).toHaveValue('type-qa');
    });

    const taskTable = await screen.findByRole('table', { name: '태스크 리스트' });
    await user.click(within(taskTable).getByRole('button', { name: '수정' }));
    await waitFor(() => {
      expect(document.querySelector('#subtask-status-subtask-1')).toBeInTheDocument();
    });
    await user.selectOptions(document.querySelector('#subtask-status-subtask-1')!, '미수정');
    await user.click(screen.getByRole('button', { name: '태스크 저장' }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        '프로젝트 수정 권한이 없거나 프로젝트를 찾을 수 없습니다.',
      );
    });
  });

  it('renders billing group before type, service, and platform in the editor form', async () => {
    renderProjectEditor('/projects/project-1/edit');

    const costGroupField = await screen.findByLabelText('청구그룹');
    const projectTypeField = screen.getByLabelText('프로젝트 종류');
    const serviceGroupField = screen.getByLabelText('서비스 그룹');
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
      expect(window.alert).toHaveBeenCalledWith('프로젝트 조회 실패');
    });
    expect(screen.queryByText('프로젝트를 찾을 수 없습니다.')).not.toBeInTheDocument();
  });

  it('deletes project and subtask when delete actions are confirmed', async () => {
    const user = userEvent.setup();

    renderProjectEditor('/projects/project-1/edit');

    await screen.findByRole('button', { name: '수정' });
    await user.click(screen.getByRole('button', { name: '수정' }));

    await user.click(screen.getByRole('button', { name: '태스크 삭제' }));

    await waitFor(() => {
      expect(mockDataClient.deleteProjectSubtask).toHaveBeenCalledWith('subtask-1');
    });

    await user.click(screen.getAllByRole('button', { name: '삭제' })[0]);

    await waitFor(() => {
      expect(mockDataClient.deleteProject).toHaveBeenCalledWith('project-1');
    });
  });
});
