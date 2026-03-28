import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthContext';
import { opsDataClient } from '../../lib/data-client';
import { type Member, type PageStatus, type Project, type ProjectPage } from '../../lib/domain';
import { formatDateLabel, getToday } from '../../lib/utils';
import styles from './ProjectsFeature.module.css';

type ProjectSearchScope =
  | 'current-year'
  | 'all'
  | 'search'
  | 'first-half'
  | 'second-half'
  | 'prev-second-half';

interface ProjectFormState {
  id?: string;
  projectType1: string;
  name: string;
  platform: string;
  serviceGroupId: string;
  reportUrl: string;
  reporterMemberId: string;
  reviewerMemberId: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface PageFormState {
  id?: string;
  projectId: string;
  title: string;
  url: string;
  ownerMemberId: string;
  trackStatus: PageStatus;
  monitoringInProgress: boolean;
  qaInProgress: boolean;
  note: string;
}

const PLATFORM_OPTIONS = ['PC-Web', 'M-Web', 'iOS-App', 'And-App', 'Win-App'] as const;
const PROJECT_TYPE1_OPTIONS = ['QA', '모니터링', '민원', '전수조사'] as const;

const initialProjectDraft = (): ProjectFormState => ({
  projectType1: '',
  name: '',
  platform: PLATFORM_OPTIONS[0],
  serviceGroupId: '',
  reportUrl: '',
  reporterMemberId: '',
  reviewerMemberId: '',
  startDate: getToday(),
  endDate: getToday(),
  isActive: true,
});

const initialPageDraft = (projectId = '', ownerMemberId = ''): PageFormState => ({
  projectId,
  title: '',
  url: '',
  ownerMemberId,
  trackStatus: '미개선',
  monitoringInProgress: false,
  qaInProgress: false,
  note: '',
});

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function memberName(memberId: string | null | undefined, membersById: Map<string, Member>) {
  if (!memberId) {
    return '-';
  }

  return membersById.get(memberId)?.name ?? '-';
}

function serviceGroupName(
  serviceGroupId: string | null | undefined,
  serviceGroupsById: Map<string, string>,
) {
  if (!serviceGroupId) {
    return '-';
  }

  return serviceGroupsById.get(serviceGroupId) ?? '-';
}

function toProjectDraft(project: Project): ProjectFormState {
  return {
    id: project.id,
    projectType1: project.projectType1,
    name: project.name,
    platform: project.platform,
    serviceGroupId: project.serviceGroupId ?? '',
    reportUrl: project.reportUrl,
    reporterMemberId: project.reporterMemberId ?? '',
    reviewerMemberId: project.reviewerMemberId ?? '',
    startDate: project.startDate,
    endDate: project.endDate,
    isActive: project.isActive,
  };
}

function toPageDraft(page: ProjectPage): PageFormState {
  return {
    id: page.id,
    projectId: page.projectId,
    title: page.title,
    url: page.url,
    ownerMemberId: page.ownerMemberId ?? '',
    trackStatus: page.trackStatus,
    monitoringInProgress: page.monitoringInProgress,
    qaInProgress: page.qaInProgress,
    note: page.note,
  };
}

function toProjectInput(draft: ProjectFormState) {
  return {
    id: draft.id,
    projectType1: draft.projectType1.trim(),
    name: draft.name.trim(),
    platform: draft.platform.trim(),
    serviceGroupId: draft.serviceGroupId.trim() || null,
    reportUrl: draft.reportUrl.trim(),
    reporterMemberId: draft.reporterMemberId.trim() || null,
    reviewerMemberId: draft.reviewerMemberId.trim() || null,
    startDate: draft.startDate,
    endDate: draft.endDate,
    isActive: draft.isActive,
  };
}

function toPageInput(draft: PageFormState) {
  return {
    id: draft.id,
    projectId: draft.projectId,
    title: draft.title.trim(),
    url: draft.url.trim(),
    ownerMemberId: draft.ownerMemberId.trim() || null,
    trackStatus: draft.trackStatus,
    monitoringInProgress: draft.monitoringInProgress,
    qaInProgress: draft.qaInProgress,
    note: draft.note.trim(),
  };
}

function matchesProjectScope(project: Project, scope: ProjectSearchScope) {
  const year = new Date().getFullYear();
  const currentYear = `${year}-01-01` <= project.endDate && project.endDate <= `${year}-12-31`;

  switch (scope) {
    case 'all':
      return true;
    case 'first-half':
      return `${year}-01-01` <= project.endDate && project.endDate <= `${year}-06-30`;
    case 'second-half':
      return `${year}-07-01` <= project.endDate && project.endDate <= `${year}-12-31`;
    case 'prev-second-half':
      return `${year - 1}-07-01` <= project.endDate && project.endDate <= `${year - 1}-12-31`;
    case 'search':
    case 'current-year':
    default:
      return currentYear;
  }
}

function buildScopeLabel(scope: ProjectSearchScope, query: string) {
  const year = new Date().getFullYear();

  switch (scope) {
    case 'all':
      return ' 전체 내역';
    case 'first-half':
      return ` ${year}년 상반기`;
    case 'second-half':
      return ` ${year}년 하반기`;
    case 'prev-second-half':
      return ` ${year - 1}년 하반기`;
    case 'search':
      return query.trim() ? ` 검색어 : ${query.trim()}` : ' 검색어';
    case 'current-year':
    default:
      return ` ${year}년 내역`;
  }
}

function projectSearchText(project: Project, serviceGroupLabel: string) {
  return normalizeText(
    [
      project.name,
      project.platform,
      serviceGroupLabel,
      project.reportUrl,
      project.startDate,
      project.endDate,
    ].join(' '),
  );
}

function sortProjects(projects: Project[]) {
  return [...projects].sort(
    (left, right) =>
      right.startDate.localeCompare(left.startDate) || left.name.localeCompare(right.name, 'ko'),
  );
}

function sortPages(pages: ProjectPage[]) {
  return [...pages].sort(
    (left, right) =>
      right.updatedAt.localeCompare(left.updatedAt) || left.title.localeCompare(right.title, 'ko'),
  );
}

function formatLongCompactDate(value: string) {
  return value ? value.replaceAll('-', '') : '';
}

function formatShortCompactDate(value: string) {
  const compact = formatLongCompactDate(value);
  return compact.length === 8 ? compact.slice(2) : compact;
}

function parseShortCompactDate(value: string) {
  const digits = value.replace(/\D/g, '');

  if (digits.length === 6) {
    return `20${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4, 6)}`;
  }

  return value;
}

function canDeleteProject(
  project: Project,
  memberId: string | null,
  role: Member['role'] | undefined,
) {
  if (!memberId) {
    return false;
  }

  return (
    role === 'admin' ||
    project.createdByMemberId === memberId ||
    project.reporterMemberId === memberId
  );
}

function canDeletePage(
  page: ProjectPage,
  memberId: string | null,
  role: Member['role'] | undefined,
) {
  if (!memberId) {
    return false;
  }

  return role === 'admin' || page.ownerMemberId === memberId;
}

export function ProjectsFeature() {
  const { session } = useAuth();
  const member = session?.member ?? null;
  const queryClient = useQueryClient();

  const [searchScope, setSearchScope] = useState<ProjectSearchScope>('current-year');
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [editorMode, setEditorMode] = useState<'add' | 'edit' | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectDraft, setProjectDraft] = useState<ProjectFormState>(initialProjectDraft);
  const [pageDrafts, setPageDrafts] = useState<Record<string, PageFormState>>({});
  const [newPageDraft, setNewPageDraft] = useState<PageFormState | null>(null);
  const [pageAddOpen, setPageAddOpen] = useState(false);
  const [, setStatusMessage] = useState('');

  const query = useQuery({
    queryKey: ['projects', member?.id],
    enabled: Boolean(member),
    queryFn: async () => {
      const [projects, pages, members, serviceGroups] = await Promise.all([
        opsDataClient.getProjects(),
        opsDataClient.getProjectPages(member!),
        opsDataClient.getMembers(),
        opsDataClient.getServiceGroups(),
      ]);
      return { projects, pages, members, serviceGroups };
    },
  });

  const data = query.data;
  const projects = data?.projects ?? [];
  const pages = data?.pages ?? [];
  const members = data?.members ?? [];
  const serviceGroups = data?.serviceGroups ?? [];

  const membersById = useMemo(
    () => new Map(members.map((item) => [item.id, item] as const)),
    [members],
  );
  const serviceGroupsById = useMemo(
    () => new Map(serviceGroups.map((item) => [item.id, item.name] as const)),
    [serviceGroups],
  );

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  );

  const selectedProjectPages = useMemo(() => {
    if (!selectedProject) {
      return [];
    }

    return sortPages(pages.filter((page) => page.projectId === selectedProject.id));
  }, [pages, selectedProject]);

  const availablePlatforms = useMemo(() => {
    return Array.from(
      new Set([
        ...PLATFORM_OPTIONS,
        ...projects.map((project) => project.platform).filter(Boolean),
      ]),
    );
  }, [projects]);

  const searchFilteredProjects = useMemo(() => {
    const sorted = sortProjects(projects);
    const queryText = normalizeText(appliedSearch);

    return sorted.filter((project) => {
      if (!matchesProjectScope(project, searchScope)) {
        return false;
      }

      if (searchScope === 'search' && queryText) {
        const groupLabel = serviceGroupName(project.serviceGroupId, serviceGroupsById);
        return projectSearchText(project, groupLabel).includes(queryText);
      }

      return true;
    });
  }, [appliedSearch, projects, searchScope, serviceGroupsById]);

  const saveProjectMutation = useMutation({
    mutationFn: async (draft: ProjectFormState) => {
      if (!member) {
        throw new Error('로그인 정보가 없습니다.');
      }

      return opsDataClient.saveProject(toProjectInput(draft));
    },
    onSuccess: async (saved) => {
      await queryClient.invalidateQueries({ queryKey: ['projects', member?.id] });
      setEditorMode('edit');
      setSelectedProjectId(saved.id);
      setProjectDraft(toProjectDraft(saved));
      setStatusMessage('프로젝트가 저장되었습니다.');
    },
    onError: (error) => {
      setStatusMessage(error instanceof Error ? error.message : '프로젝트를 저장하지 못했습니다.');
    },
  });

  const savePageMutation = useMutation({
    mutationFn: async (draft: PageFormState) => {
      if (!member) {
        throw new Error('로그인 정보가 없습니다.');
      }

      return opsDataClient.saveProjectPage(toPageInput(draft));
    },
    onSuccess: async (saved) => {
      await queryClient.invalidateQueries({ queryKey: ['projects', member?.id] });
      setPageDrafts((current) => ({
        ...current,
        [saved.id]: toPageDraft(saved),
      }));
      setStatusMessage('페이지가 저장되었습니다.');
      setPageAddOpen(false);
      setNewPageDraft(
        selectedProject
          ? initialPageDraft(selectedProject.id, selectedProject.reporterMemberId ?? '')
          : null,
      );
    },
    onError: (error) => {
      setStatusMessage(error instanceof Error ? error.message : '페이지를 저장하지 못했습니다.');
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) => opsDataClient.deleteProject(projectId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['projects', member?.id] });
      closeEditor();
      setStatusMessage('프로젝트를 삭제했습니다.');
    },
    onError: (error) => {
      setStatusMessage(error instanceof Error ? error.message : '프로젝트를 삭제하지 못했습니다.');
    },
  });

  const deletePageMutation = useMutation({
    mutationFn: async (pageId: string) => opsDataClient.deleteProjectPage(pageId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['projects', member?.id] });
      setStatusMessage('페이지를 삭제했습니다.');
    },
    onError: (error) => {
      setStatusMessage(error instanceof Error ? error.message : '페이지를 삭제하지 못했습니다.');
    },
  });

  useEffect(() => {
    if (!selectedProject) {
      return;
    }

    setPageDrafts(
      Object.fromEntries(selectedProjectPages.map((page) => [page.id, toPageDraft(page)] as const)),
    );
    setNewPageDraft(initialPageDraft(selectedProject.id, selectedProject.reporterMemberId ?? ''));
    setPageAddOpen(false);
  }, [selectedProject?.id]);

  const openAddProject = () => {
    setEditorMode('add');
    setSelectedProjectId(null);
    setProjectDraft(initialProjectDraft());
    setPageDrafts({});
    setNewPageDraft(null);
    setPageAddOpen(false);
    setStatusMessage('');
  };

  const openEditProject = (project: Project) => {
    setEditorMode('edit');
    setSelectedProjectId(project.id);
    setProjectDraft(toProjectDraft(project));
    setPageDrafts(
      Object.fromEntries(
        sortPages(pages.filter((page) => page.projectId === project.id)).map(
          (page) => [page.id, toPageDraft(page)] as const,
        ),
      ),
    );
    setNewPageDraft(initialPageDraft(project.id, project.reporterMemberId ?? ''));
    setPageAddOpen(false);
    setStatusMessage(`"${project.name}" 프로젝트를 불러왔습니다.`);
  };

  const closeEditor = () => {
    setEditorMode(null);
    setSelectedProjectId(null);
    setProjectDraft(initialProjectDraft());
    setPageDrafts({});
    setNewPageDraft(null);
    setPageAddOpen(false);
    setStatusMessage('');
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearchScope('search');
    setAppliedSearch(searchInput);
    setStatusMessage(`검색어 : ${searchInput.trim() || '-'}`);
  };

  const applyScope = (scope: ProjectSearchScope) => {
    setSearchScope(scope);
    if (scope !== 'search') {
      setStatusMessage(buildScopeLabel(scope, appliedSearch));
    }
  };

  const handleProjectSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await saveProjectMutation.mutateAsync(projectDraft);
  };

  const handlePageDraftChange = (pageId: string, patch: Partial<PageFormState>) => {
    const basePage =
      selectedProjectPages.find((page) => page.id === pageId) ??
      pages.find((page) => page.id === pageId);
    if (!basePage) {
      return;
    }

    setPageDrafts((current) => ({
      ...current,
      [pageId]: {
        ...(current[pageId] ?? toPageDraft(basePage)),
        ...patch,
      },
    }));
  };

  const handleNewPageDraftChange = (patch: Partial<PageFormState>) => {
    setNewPageDraft((current) => (current ? { ...current, ...patch } : current));
  };

  const handlePageSave = async (pageId: string) => {
    if (savePageMutation.isPending) {
      return;
    }

    const draft = pageDrafts[pageId];
    if (!draft) {
      return;
    }

    const confirmed = window.confirm(
      '정말 수정 하시겠습니까?\n해당페이지를 사용한 모든 사람들의 내용이 수정됩니다.',
    );
    if (!confirmed) {
      return;
    }

    await savePageMutation.mutateAsync(draft);
  };

  const handlePageAdd = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!newPageDraft) {
      return;
    }

    if (!newPageDraft.title.trim()) {
      setStatusMessage('페이지 명이 공백입니다..');
      return;
    }

    await savePageMutation.mutateAsync(newPageDraft);
  };

  const handleProjectDelete = async (project: Project) => {
    if (deleteProjectMutation.isPending) {
      return;
    }

    const confirmed = window.confirm(
      '정말 삭제 하시겠습니까?\n프로젝트와 연결된 페이지도 함께 삭제됩니다.',
    );
    if (!confirmed) {
      return;
    }

    await deleteProjectMutation.mutateAsync(project.id);
  };

  const handlePageDelete = async (page: ProjectPage) => {
    if (deletePageMutation.isPending) {
      return;
    }

    const confirmed = window.confirm('정말 삭제 하시겠습니까?');
    if (!confirmed) {
      return;
    }

    await deletePageMutation.mutateAsync(page.id);
  };

  const currentSummary = buildScopeLabel(searchScope, appliedSearch);

  return (
    <section className={styles.shell}>
      <header className={styles.hero}>
        <div className={styles.heroTop}>
          <h1 className={styles.title}>프로젝트 관리</h1>
          <button type="button" className={styles.primaryButton} onClick={openAddProject}>
            프로젝트 추가하기
          </button>
        </div>

        <div className={styles.searchBar}>
          <div className={styles.scopeButtons}>
            <button type="button" className={styles.scopeButton} onClick={() => applyScope('all')}>
              전체
            </button>
            <button
              type="button"
              className={styles.scopeButton}
              onClick={() => applyScope('prev-second-half')}
            >
              전년 하반기
            </button>
            <button
              type="button"
              className={styles.scopeButton}
              onClick={() => applyScope('first-half')}
            >
              올해 상반기
            </button>
            <button
              type="button"
              className={styles.scopeButton}
              onClick={() => applyScope('second-half')}
            >
              올해 하반기
            </button>
          </div>

          <form className={styles.searchForm} onSubmit={handleSearchSubmit}>
            <label className={styles.searchField}>
              <span className={styles.srOnly}>프로젝트 검색</span>
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="프로젝트명 입력"
                className={styles.searchInput}
              />
            </label>
            <button type="submit" className={styles.secondaryButton}>
              검색
            </button>
          </form>
        </div>

        <p className={styles.summaryLine}>{currentSummary}</p>
      </header>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <caption className={styles.srOnly}>프로젝트 리스트</caption>
          <thead>
            <tr>
              <th scope="col">타입1</th>
              <th scope="col">플랫폼</th>
              <th scope="col">서비스그룹</th>
              <th scope="col">프로젝트명</th>
              <th scope="col">보고서URL</th>
              <th scope="col">QA시작일</th>
              <th scope="col">QA종료일</th>
              <th scope="col">리포터</th>
              <th scope="col">리뷰어</th>
              <th scope="col">수정 및 페이지 추가</th>
            </tr>
          </thead>
          <tbody>
            {searchFilteredProjects.map((project) => {
              const isSelected = selectedProjectId === project.id;
              const groupLabel = serviceGroupName(project.serviceGroupId, serviceGroupsById);

              return (
                <tr key={project.id} className={isSelected ? styles.rowSelected : ''}>
                  <td>
                    <span>{project.projectType1 || '-'}</span>
                  </td>
                  <td>
                    <span className={styles.platformBadge}>{project.platform}</span>
                  </td>
                  <td>
                    <span>{groupLabel}</span>
                  </td>
                  <td>
                    <strong>{project.name}</strong>
                  </td>
                  <td>
                    {project.reportUrl ? (
                      <a
                        href={project.reportUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.link}
                      >
                        {project.reportUrl}
                      </a>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className={styles.dateCell}>{formatDateLabel(project.startDate)}</td>
                  <td className={styles.dateCell}>{formatDateLabel(project.endDate)}</td>
                  <td>{memberName(project.reporterMemberId, membersById)}</td>
                  <td>{memberName(project.reviewerMemberId, membersById)}</td>
                  <td>
                    <div className={styles.actionStack}>
                      <button
                        type="button"
                        className={styles.actionButton}
                        onClick={() => openEditProject(project)}
                      >
                        수정 및 추가
                      </button>
                      {canDeleteProject(project, member?.id ?? null, member?.role) ? (
                        <button
                          type="button"
                          className={styles.deleteButton}
                          onClick={() => void handleProjectDelete(project)}
                        >
                          삭제
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
            {!searchFilteredProjects.length ? (
              <tr>
                <td colSpan={10} className={styles.emptyState}>
                  결과가 없습니다.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {editorMode ? (
        <section className={styles.modal} aria-label="프로젝트 편집 패널">
          <header className={styles.modalHeader}>
            <div>
              <h2 className={styles.detailTitle}>
                {editorMode === 'add' ? '프로젝트 추가하기' : '프로젝트 정보 수정'}
              </h2>
            </div>
            <button
              type="button"
              className={styles.iconButton}
              onClick={closeEditor}
              aria-label="닫기"
            >
              X
            </button>
          </header>

          <form className={styles.detailForm} onSubmit={handleProjectSave}>
            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span>프로젝트 종류</span>
                <select
                  value={projectDraft.projectType1}
                  onChange={(event) =>
                    setProjectDraft((current) => ({ ...current, projectType1: event.target.value }))
                  }
                >
                  <option value="">선택하세요</option>
                  {PROJECT_TYPE1_OPTIONS.map((projectType1) => (
                    <option key={projectType1} value={projectType1}>
                      {projectType1}
                    </option>
                  ))}
                </select>
              </label>

              <label className={styles.field}>
                <span>플랫폼</span>
                <select
                  value={projectDraft.platform}
                  onChange={(event) =>
                    setProjectDraft((current) => ({ ...current, platform: event.target.value }))
                  }
                >
                  {availablePlatforms.map((platform) => (
                    <option key={platform} value={platform}>
                      {platform}
                    </option>
                  ))}
                </select>
              </label>

              <label className={styles.field}>
                <span>서비스그룹</span>
                <select
                  value={projectDraft.serviceGroupId}
                  onChange={(event) =>
                    setProjectDraft((current) => ({
                      ...current,
                      serviceGroupId: event.target.value,
                    }))
                  }
                >
                  <option value="">선택</option>
                  {serviceGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
                <small className={styles.helpText}>- 검색되지 않는 서비스는 문의</small>
              </label>

              <label className={styles.field}>
                <span>프로젝트명</span>
                <input
                  value={projectDraft.name}
                  onChange={(event) =>
                    setProjectDraft((current) => ({ ...current, name: event.target.value }))
                  }
                />
              </label>

              <label className={styles.field}>
                <span>보고서URL</span>
                <input
                  value={projectDraft.reportUrl}
                  onChange={(event) =>
                    setProjectDraft((current) => ({ ...current, reportUrl: event.target.value }))
                  }
                />
              </label>

              <label className={styles.field}>
                <span>QA시작일</span>
                <input
                  type="text"
                  placeholder="YYMMDD"
                  value={formatShortCompactDate(projectDraft.startDate)}
                  onChange={(event) =>
                    setProjectDraft((current) => ({
                      ...current,
                      startDate: parseShortCompactDate(event.target.value),
                    }))
                  }
                />
              </label>

              <label className={styles.field}>
                <span>QA종료일</span>
                <input
                  type="text"
                  placeholder="YYMMDD"
                  value={formatShortCompactDate(projectDraft.endDate)}
                  onChange={(event) =>
                    setProjectDraft((current) => ({
                      ...current,
                      endDate: parseShortCompactDate(event.target.value),
                    }))
                  }
                />
              </label>

              <label className={styles.field}>
                <span>리포터</span>
                <select
                  value={projectDraft.reporterMemberId}
                  onChange={(event) =>
                    setProjectDraft((current) => ({
                      ...current,
                      reporterMemberId: event.target.value,
                    }))
                  }
                >
                  <option value="">선택</option>
                  {members.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className={styles.field}>
                <span>리뷰어</span>
                <select
                  value={projectDraft.reviewerMemberId}
                  onChange={(event) =>
                    setProjectDraft((current) => ({
                      ...current,
                      reviewerMemberId: event.target.value,
                    }))
                  }
                >
                  <option value="">선택</option>
                  {members.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className={styles.formActions}>
              <button
                type="submit"
                className={styles.primaryButton}
                disabled={saveProjectMutation.isPending}
              >
                저장하기
              </button>
              <button type="button" className={styles.secondaryButton} onClick={closeEditor}>
                취소하기
              </button>
            </div>
          </form>

          {editorMode === 'edit' && selectedProject ? (
            <section className={styles.pageSection}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>페이지 리스트</h3>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => {
                    setPageAddOpen((current) => !current);
                    setNewPageDraft(
                      initialPageDraft(selectedProject.id, selectedProject.reporterMemberId ?? ''),
                    );
                  }}
                >
                  페이지 추가하기
                </button>
              </div>

              {pageAddOpen && newPageDraft ? (
                <form className={styles.pageFormPanel} onSubmit={handlePageAdd}>
                  <div className={styles.pageFormGrid}>
                    <label className={styles.field}>
                      <span>페이지명</span>
                      <input
                        value={newPageDraft.title}
                        onChange={(event) =>
                          handleNewPageDraftChange({ title: event.target.value })
                        }
                      />
                    </label>
                    <label className={styles.field}>
                      <span>페이지URL</span>
                      <input
                        value={newPageDraft.url}
                        onChange={(event) => handleNewPageDraftChange({ url: event.target.value })}
                      />
                    </label>
                  </div>
                  <div className={styles.formActions}>
                    <button
                      type="submit"
                      className={styles.primaryButton}
                      disabled={savePageMutation.isPending}
                    >
                      추가하기
                    </button>
                  </div>
                </form>
              ) : null}

              <ul className={styles.pageList}>
                {selectedProjectPages.map((page) => {
                  const draft = pageDrafts[page.id] ?? toPageDraft(page);

                  return (
                    <li key={page.id} className={styles.pageCard}>
                      <div className={styles.pageFormGrid}>
                        <label className={styles.field}>
                          <span>페이지명</span>
                          <input
                            value={draft.title}
                            onChange={(event) =>
                              handlePageDraftChange(page.id, { title: event.target.value })
                            }
                          />
                        </label>
                        <label className={styles.field}>
                          <span>페이지URL</span>
                          <input
                            value={draft.url}
                            onChange={(event) =>
                              handlePageDraftChange(page.id, { url: event.target.value })
                            }
                          />
                        </label>
                      </div>
                      <div className={styles.formActions}>
                        <button
                          type="button"
                          className={styles.secondaryButton}
                          onClick={() => handlePageSave(page.id)}
                        >
                          수정
                        </button>
                        {canDeletePage(page, member?.id ?? null, member?.role) ? (
                          <button
                            type="button"
                            className={styles.deleteButton}
                            onClick={() => void handlePageDelete(page)}
                          >
                            삭제
                          </button>
                        ) : null}
                      </div>
                    </li>
                  );
                })}

                {!selectedProjectPages.length ? (
                  <li className={styles.emptyState}>등록된 페이지가 없습니다.</li>
                ) : null}
              </ul>
            </section>
          ) : null}
        </section>
      ) : null}
    </section>
  );
}

export default ProjectsFeature;
