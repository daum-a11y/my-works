import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { opsDataClient } from '../../lib/data-client';
import { type Member, type PageStatus, type Project, type ProjectPage } from '../../lib/domain';
import { getToday } from '../../lib/utils';
import styles from './ProjectsFeature.module.css';

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
  trackStatus: '미수정',
  monitoringInProgress: false,
  qaInProgress: false,
  note: '',
});

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

function sortPages(pages: ProjectPage[]) {
  return [...pages].sort(
    (left, right) =>
      right.updatedAt.localeCompare(left.updatedAt) || left.title.localeCompare(right.title, 'ko'),
  );
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

export function ProjectEditorPage() {
  const { session } = useAuth();
  const member = session?.member ?? null;
  const { projectId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const titleRef = useRef<HTMLInputElement | null>(null);
  const isEditMode = Boolean(projectId);

  const [projectDraft, setProjectDraft] = useState<ProjectFormState>(initialProjectDraft);
  const [pageDrafts, setPageDrafts] = useState<Record<string, PageFormState>>({});
  const [newPageDraft, setNewPageDraft] = useState<PageFormState | null>(null);
  const [pageAddOpen, setPageAddOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const query = useQuery({
    queryKey: ['project-editor', member?.id],
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

  const projects = useMemo(() => query.data?.projects ?? [], [query.data?.projects]);
  const pages = useMemo(() => query.data?.pages ?? [], [query.data?.pages]);
  const members = useMemo(() => query.data?.members ?? [], [query.data?.members]);
  const serviceGroups = useMemo(() => query.data?.serviceGroups ?? [], [query.data?.serviceGroups]);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === projectId) ?? null,
    [projectId, projects],
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

  useEffect(() => {
    if (!isEditMode || !selectedProject) {
      return;
    }

    setProjectDraft(toProjectDraft(selectedProject));
    setPageDrafts(
      Object.fromEntries(selectedProjectPages.map((page) => [page.id, toPageDraft(page)] as const)),
    );
    setNewPageDraft(initialPageDraft(selectedProject.id, selectedProject.reporterMemberId ?? ''));
    setPageAddOpen(false);
  }, [isEditMode, selectedProject, selectedProjectPages]);

  useEffect(() => {
    if (isEditMode) {
      return;
    }

    setProjectDraft(initialProjectDraft());
    setPageDrafts({});
    setNewPageDraft(null);
    setPageAddOpen(false);
  }, [isEditMode]);

  useEffect(() => {
    titleRef.current?.focus();
  }, [projectId]);

  const saveProjectMutation = useMutation({
    mutationFn: async (draft: ProjectFormState) => {
      if (!member) {
        throw new Error('로그인 정보가 없습니다.');
      }

      return opsDataClient.saveProject(toProjectInput(draft));
    },
    onSuccess: async (saved) => {
      await queryClient.invalidateQueries({ queryKey: ['projects', member?.id] });
      await queryClient.invalidateQueries({ queryKey: ['project-editor', member?.id] });
      setStatusMessage('프로젝트를 저장했습니다.');

      if (!isEditMode) {
        navigate(`/projects/${saved.id}/edit`, { replace: true });
        return;
      }

      setProjectDraft(toProjectDraft(saved));
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
      await queryClient.invalidateQueries({ queryKey: ['project-editor', member?.id] });
      setPageDrafts((current) => ({ ...current, [saved.id]: toPageDraft(saved) }));
      setStatusMessage('페이지를 저장했습니다.');
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
    mutationFn: async (id: string) => opsDataClient.deleteProject(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['projects', member?.id] });
      setStatusMessage('프로젝트를 삭제했습니다.');
      navigate('/projects', { replace: true });
    },
    onError: (error) => {
      setStatusMessage(error instanceof Error ? error.message : '프로젝트를 삭제하지 못했습니다.');
    },
  });

  const deletePageMutation = useMutation({
    mutationFn: async (id: string) => opsDataClient.deleteProjectPage(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['projects', member?.id] });
      await queryClient.invalidateQueries({ queryKey: ['project-editor', member?.id] });
      setStatusMessage('페이지를 삭제했습니다.');
    },
    onError: (error) => {
      setStatusMessage(error instanceof Error ? error.message : '페이지를 삭제하지 못했습니다.');
    },
  });

  const handleProjectSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await saveProjectMutation.mutateAsync(projectDraft);
  };

  const handlePageDraftChange = (pageId: string, patch: Partial<PageFormState>) => {
    const basePage = selectedProjectPages.find((page) => page.id === pageId);

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
      setStatusMessage('페이지 명이 공백입니다.');
      return;
    }

    await savePageMutation.mutateAsync(newPageDraft);
  };

  const handleProjectDelete = async () => {
    if (!selectedProject || deleteProjectMutation.isPending) {
      return;
    }

    const confirmed = window.confirm(
      '정말 삭제 하시겠습니까?\n프로젝트와 연결된 페이지도 함께 삭제됩니다.',
    );
    if (!confirmed) {
      return;
    }

    await deleteProjectMutation.mutateAsync(selectedProject.id);
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

  if (isEditMode && !query.isLoading && !selectedProject) {
    return (
      <section className={`${styles.shell} ${styles.editorShell}`}>
        <header className={styles.editorHeader}>
          <h1 className={styles.title}>프로젝트 수정</h1>
          <Link to="/projects" className={styles.secondaryButton}>
            목록으로
          </Link>
        </header>
        <p className={styles.statusMessage}>프로젝트를 찾을 수 없습니다.</p>
      </section>
    );
  }

  return (
    <section className={`${styles.shell} ${styles.editorShell}`}>
      <header className={styles.editorHeader}>
        <h1 className={styles.title}>{isEditMode ? '프로젝트 수정' : '프로젝트 추가'}</h1>
      </header>

      {statusMessage ? <p className={styles.statusMessage}>{statusMessage}</p> : null}

      <section
        className={`${styles.modal} ${styles.editorSurface}`}
        aria-label="프로젝트 편집 패널"
      >
        <form
          className={`${styles.detailForm} ${styles.editorDetailForm}`}
          onSubmit={handleProjectSave}
        >
          <div className={styles.editorFormGrid}>
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

            <label className={`${styles.field} ${styles.editorFieldWide}`}>
              <span>서비스그룹</span>
              <select
                value={projectDraft.serviceGroupId}
                onChange={(event) =>
                  setProjectDraft((current) => ({ ...current, serviceGroupId: event.target.value }))
                }
              >
                <option value="">선택</option>
                {serviceGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
              <small className={styles.helpText}>검색되지 않는 서비스는 문의하십시오.</small>
            </label>

            <label className={`${styles.field} ${styles.editorFieldWide}`}>
              <span>프로젝트명</span>
              <input
                ref={titleRef}
                value={projectDraft.name}
                onChange={(event) =>
                  setProjectDraft((current) => ({ ...current, name: event.target.value }))
                }
              />
            </label>

            <label className={`${styles.field} ${styles.editorFieldWide}`}>
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
                type="date"
                value={projectDraft.startDate}
                onChange={(event) =>
                  setProjectDraft((current) => ({
                    ...current,
                    startDate: event.target.value,
                  }))
                }
              />
            </label>

            <label className={styles.field}>
              <span>QA종료일</span>
              <input
                type="date"
                value={projectDraft.endDate}
                onChange={(event) =>
                  setProjectDraft((current) => ({
                    ...current,
                    endDate: event.target.value,
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
                    {`${item.legacyUserId}(${item.name})`}
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
                    {`${item.legacyUserId}(${item.name})`}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className={`${styles.formActions} ${styles.editorFormActions}`}>
            <div className={styles.editorFormActionsStart}>
              {isEditMode &&
              selectedProject &&
              canDeleteProject(selectedProject, member?.id ?? null, member?.role) ? (
                <button
                  type="button"
                  className={styles.deleteButton}
                  onClick={() => void handleProjectDelete()}
                >
                  삭제
                </button>
              ) : null}
            </div>
            <div className={styles.editorFormActionsEnd}>
              <Link to="/projects" className={styles.secondaryButton}>
                취소
              </Link>
              <button
                type="submit"
                className={styles.primaryButton}
                disabled={saveProjectMutation.isPending}
              >
                저장하기
              </button>
            </div>
          </div>
        </form>
      </section>

      {isEditMode && selectedProject ? (
        <section className={styles.modal} aria-label="페이지 목록 패널">
          <section className={styles.pageSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>페이지 목록</h2>
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
                페이지 추가
              </button>
            </div>

            {pageAddOpen && newPageDraft ? (
              <form className={styles.pageFormPanel} onSubmit={handlePageAdd}>
                <div className={styles.pageFormGrid}>
                  <label className={styles.field}>
                    <span className={styles.srOnly}>페이지명</span>
                    <input
                      value={newPageDraft.title}
                      placeholder="페이지명"
                      onChange={(event) => handleNewPageDraftChange({ title: event.target.value })}
                    />
                  </label>
                  <label className={styles.field}>
                    <span className={styles.srOnly}>페이지URL</span>
                    <input
                      value={newPageDraft.url}
                      placeholder="페이지URL"
                      onChange={(event) => handleNewPageDraftChange({ url: event.target.value })}
                    />
                  </label>
                </div>
                <div className={`${styles.formActions} ${styles.pageTableActions}`}>
                  <button
                    type="submit"
                    className={styles.primaryButton}
                    disabled={savePageMutation.isPending}
                  >
                    추가
                  </button>
                </div>
              </form>
            ) : null}

            {selectedProjectPages.length ? (
              <div className={styles.pageTableWrap}>
                <table className={styles.pageTable}>
                  <caption className={styles.srOnly}>페이지 리스트</caption>
                  <thead>
                    <tr>
                      <th scope="col">페이지명</th>
                      <th scope="col">페이지URL</th>
                      <th scope="col">작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedProjectPages.map((page) => {
                      const draft = pageDrafts[page.id] ?? toPageDraft(page);

                      return (
                        <tr key={page.id}>
                          <td>
                            <label className={styles.srOnly} htmlFor={`page-title-${page.id}`}>
                              페이지명
                            </label>
                            <input
                              id={`page-title-${page.id}`}
                              value={draft.title}
                              placeholder="페이지명"
                              onChange={(event) =>
                                handlePageDraftChange(page.id, { title: event.target.value })
                              }
                            />
                          </td>
                          <td>
                            <label className={styles.srOnly} htmlFor={`page-url-${page.id}`}>
                              페이지URL
                            </label>
                            <input
                              id={`page-url-${page.id}`}
                              value={draft.url}
                              placeholder="페이지URL"
                              onChange={(event) =>
                                handlePageDraftChange(page.id, { url: event.target.value })
                              }
                            />
                          </td>
                          <td>
                            <div className={styles.pageTableActions}>
                              <button
                                type="button"
                                className={styles.secondaryButton}
                                onClick={() => void handlePageSave(page.id)}
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
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className={styles.emptyState}>등록된 페이지가 없습니다.</div>
            )}
          </section>
        </section>
      ) : null}
    </section>
  );
}
