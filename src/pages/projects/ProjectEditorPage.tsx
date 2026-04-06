import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { dataClient } from '../../api/client';
import { type Member, type PageStatus, type Project, type ProjectPage } from '../../types/domain';
import { buildProjectTypeOptions } from '../../utils/taskType';
import { getToday } from '../../utils';
import '../../styles/domain/pages/projects-feature.scss';

interface ProjectFormState {
  id?: string;
  projectType1: string;
  name: string;
  platformId: string;
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

const initialProjectDraft = (): ProjectFormState => ({
  projectType1: '',
  name: '',
  platformId: '',
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
    platformId: project.platformId ?? '',
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
    platformId: draft.platformId.trim() || null,
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

function splitServiceGroupName(value: string) {
  const normalized = value.trim();
  if (!normalized) {
    return {
      serviceGroup: '',
      serviceName: '',
    };
  }

  const separator = normalized.indexOf(' / ');
  if (separator < 0) {
    return {
      serviceGroup: normalized,
      serviceName: '',
    };
  }

  return {
    serviceGroup: normalized.slice(0, separator),
    serviceName: normalized.slice(separator + 3),
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
    queryKey: ['project-editor', member?.id, projectId ?? 'new'],
    enabled: Boolean(member),
    queryFn: async () => {
      const [project, pages, members, serviceGroups, platforms, taskTypes] = await Promise.all([
        projectId ? dataClient.getProject(projectId) : Promise.resolve(null),
        projectId ? dataClient.getProjectPagesByProjectId(projectId) : Promise.resolve([]),
        dataClient.getMembers(),
        dataClient.getServiceGroups(),
        dataClient.getPlatforms(),
        dataClient.getTaskTypes(),
      ]);
      return { project, pages, members, serviceGroups, platforms, taskTypes };
    },
  });

  const selectedProject = useMemo(() => query.data?.project ?? null, [query.data?.project]);
  const pages = useMemo(() => query.data?.pages ?? [], [query.data?.pages]);
  const members = useMemo(() => query.data?.members ?? [], [query.data?.members]);
  const serviceGroups = useMemo(() => query.data?.serviceGroups ?? [], [query.data?.serviceGroups]);
  const platforms = useMemo(() => query.data?.platforms ?? [], [query.data?.platforms]);
  const taskTypes = useMemo(() => query.data?.taskTypes ?? [], [query.data?.taskTypes]);
  const projectTypeOptions = useMemo(
    () => buildProjectTypeOptions(taskTypes, projectDraft.projectType1),
    [projectDraft.projectType1, taskTypes],
  );

  const selectedProjectPages = useMemo(() => sortPages(pages), [pages]);
  const visibleServiceGroups = useMemo(
    () =>
      serviceGroups.filter((group) => group.isActive || group.id === projectDraft.serviceGroupId),
    [projectDraft.serviceGroupId, serviceGroups],
  );
  const selectedServiceGroup = useMemo(
    () => visibleServiceGroups.find((group) => group.id === projectDraft.serviceGroupId) ?? null,
    [projectDraft.serviceGroupId, visibleServiceGroups],
  );
  const selectedServiceParts = useMemo(
    () => splitServiceGroupName(selectedServiceGroup?.name ?? ''),
    [selectedServiceGroup?.name],
  );
  const serviceGroupOptions = useMemo(() => {
    const seen = new Set<string>();
    return visibleServiceGroups.filter((group) => {
      if (seen.has(group.costGroupId ?? '')) {
        return false;
      }
      seen.add(group.costGroupId ?? '');
      return true;
    });
  }, [visibleServiceGroups]);
  const selectedCostGroupId = selectedServiceGroup?.costGroupId ?? '';
  const serviceGroupNameOptions = useMemo(() => {
    if (!selectedCostGroupId) {
      return [] as string[];
    }

    return Array.from(
      new Set(
        visibleServiceGroups
          .filter((group) => group.costGroupId === selectedCostGroupId)
          .map((group) => splitServiceGroupName(group.name).serviceGroup)
          .filter(Boolean),
      ),
    ).sort((left, right) => left.localeCompare(right, 'ko'));
  }, [selectedCostGroupId, visibleServiceGroups]);
  const serviceNameOptions = useMemo(() => {
    if (!selectedCostGroupId || !selectedServiceParts.serviceGroup) {
      return [] as string[];
    }

    return Array.from(
      new Set(
        visibleServiceGroups
          .filter((group) => group.costGroupId === selectedCostGroupId)
          .filter(
            (group) =>
              splitServiceGroupName(group.name).serviceGroup === selectedServiceParts.serviceGroup,
          )
          .map((group) => splitServiceGroupName(group.name).serviceName)
          .filter(Boolean),
      ),
    ).sort((left, right) => left.localeCompare(right, 'ko'));
  }, [selectedCostGroupId, selectedServiceParts.serviceGroup, visibleServiceGroups]);

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

  const handleCostGroupChange = (costGroupId: string) => {
    setProjectDraft((current) => {
      const matched = visibleServiceGroups.find((group) => group.costGroupId === costGroupId);
      return {
        ...current,
        serviceGroupId: matched?.id ?? '',
      };
    });
  };

  const handleServiceGroupChange = (serviceGroupName: string) => {
    setProjectDraft((current) => {
      const matched = visibleServiceGroups.find((group) => {
        const parts = splitServiceGroupName(group.name);
        return group.costGroupId === selectedCostGroupId && parts.serviceGroup === serviceGroupName;
      });

      return {
        ...current,
        serviceGroupId: matched?.id ?? '',
      };
    });
  };

  const handleServiceNameChange = (serviceName: string) => {
    setProjectDraft((current) => {
      const matched = visibleServiceGroups.find((group) => {
        const parts = splitServiceGroupName(group.name);
        return (
          group.costGroupId === selectedCostGroupId &&
          parts.serviceGroup === selectedServiceParts.serviceGroup &&
          parts.serviceName === serviceName
        );
      });

      return {
        ...current,
        serviceGroupId: matched?.id ?? '',
      };
    });
  };

  const saveProjectMutation = useMutation({
    mutationFn: async (draft: ProjectFormState) => {
      if (!member) {
        throw new Error('로그인 정보가 없습니다.');
      }

      return dataClient.saveProject(toProjectInput(draft));
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

      return dataClient.saveProjectPage(toPageInput(draft));
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
    mutationFn: async (id: string) => dataClient.deleteProject(id),
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
    mutationFn: async (id: string) => dataClient.deleteProjectPage(id),
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
      <section className="projects-feature projects-feature--shell projects-feature--editor">
        <header className={'projects-feature__editor-header'}>
          <h1 className={'projects-feature__title'}>프로젝트 수정</h1>
          <Link
            to="/projects"
            className={'projects-feature__button projects-feature__button--secondary'}
          >
            목록으로
          </Link>
        </header>
        <p className={'projects-feature__status-message'}>프로젝트를 찾을 수 없습니다.</p>
      </section>
    );
  }

  return (
    <section className="projects-feature projects-feature--shell projects-feature--editor">
      <header className={'projects-feature__editor-header'}>
        <h1 className={'projects-feature__title'}>
          {isEditMode ? '프로젝트 수정' : '프로젝트 추가'}
        </h1>
      </header>

      {statusMessage ? <p className={'projects-feature__status-message'}>{statusMessage}</p> : null}

      <section
        className="projects-feature__modal projects-feature__editor-surface"
        aria-label="프로젝트 편집 패널"
      >
        <form
          className="projects-feature__detail-form projects-feature__editor-detail-form"
          onSubmit={handleProjectSave}
        >
          <div className={'projects-feature__editor-form-grid'}>
            <label className={'projects-feature__field'}>
              <span>프로젝트 종류</span>
              <select
                value={projectDraft.projectType1}
                onChange={(event) =>
                  setProjectDraft((current) => ({ ...current, projectType1: event.target.value }))
                }
              >
                <option value="">선택하세요</option>
                {projectTypeOptions.map((projectType1) => (
                  <option key={projectType1} value={projectType1}>
                    {projectType1}
                  </option>
                ))}
              </select>
            </label>

            <label className={'projects-feature__field'}>
              <span>플랫폼</span>
              <select
                value={projectDraft.platformId}
                onChange={(event) =>
                  setProjectDraft((current) => ({ ...current, platformId: event.target.value }))
                }
              >
                <option value="">선택</option>
                {platforms
                  .filter(
                    (platform) => platform.isVisible || platform.id === projectDraft.platformId,
                  )
                  .map((platform) => (
                    <option key={platform.id} value={platform.id}>
                      {platform.name}
                    </option>
                  ))}
              </select>
            </label>

            <label className={'projects-feature__field'}>
              <span>청구그룹</span>
              <select
                value={selectedCostGroupId}
                onChange={(event) => handleCostGroupChange(event.target.value)}
              >
                <option value="">선택</option>
                {serviceGroupOptions.map((group) =>
                  group.costGroupId ? (
                    <option key={group.costGroupId} value={group.costGroupId}>
                      {group.costGroupName}
                    </option>
                  ) : null,
                )}
              </select>
            </label>

            <label className={'projects-feature__field'}>
              <span>서비스그룹</span>
              <select
                value={selectedServiceParts.serviceGroup}
                onChange={(event) => handleServiceGroupChange(event.target.value)}
                disabled={!selectedCostGroupId}
              >
                <option value="">선택</option>
                {serviceGroupNameOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>

            <label className={'projects-feature__field'}>
              <span>서비스명</span>
              <select
                value={selectedServiceParts.serviceName}
                onChange={(event) => handleServiceNameChange(event.target.value)}
                disabled={!selectedServiceParts.serviceGroup}
              >
                <option value="">선택</option>
                {serviceNameOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>

            <label className={'projects-feature__field projects-feature__field--wide'}>
              <span>프로젝트명</span>
              <input
                ref={titleRef}
                value={projectDraft.name}
                onChange={(event) =>
                  setProjectDraft((current) => ({ ...current, name: event.target.value }))
                }
              />
            </label>

            <label className={'projects-feature__field projects-feature__field--wide'}>
              <span>보고서URL</span>
              <input
                value={projectDraft.reportUrl}
                onChange={(event) =>
                  setProjectDraft((current) => ({ ...current, reportUrl: event.target.value }))
                }
              />
            </label>

            <label className={'projects-feature__field'}>
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

            <label className={'projects-feature__field'}>
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

            <label className={'projects-feature__field'}>
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
                    {`${item.accountId}(${item.name})`}
                  </option>
                ))}
              </select>
            </label>

            <label className={'projects-feature__field'}>
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
                    {`${item.accountId}(${item.name})`}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="projects-feature__form-actions projects-feature__editor-form-actions">
            <div
              className={
                'projects-feature__editor-form-actions projects-feature__editor-form-actions--start'
              }
            >
              {isEditMode &&
              selectedProject &&
              canDeleteProject(selectedProject, member?.id ?? null, member?.role) ? (
                <button
                  type="button"
                  className={'projects-feature__delete-button'}
                  onClick={() => void handleProjectDelete()}
                >
                  삭제
                </button>
              ) : null}
            </div>
            <div
              className={
                'projects-feature__editor-form-actions projects-feature__editor-form-actions--end'
              }
            >
              <Link
                to="/projects"
                className={'projects-feature__button projects-feature__button--secondary'}
              >
                취소
              </Link>
              <button
                type="submit"
                className={'projects-feature__button projects-feature__button--primary'}
                disabled={saveProjectMutation.isPending}
              >
                저장
              </button>
            </div>
          </div>
        </form>
      </section>

      {isEditMode && selectedProject ? (
        <section className={'projects-feature__modal'} aria-label="페이지 목록 패널">
          <section className={'projects-feature__page-section'}>
            <div className={'projects-feature__section-header'}>
              <h2 className={'projects-feature__section-title'}>페이지 목록</h2>
              <button
                type="button"
                className={'projects-feature__button projects-feature__button--secondary'}
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
              <form className={'projects-feature__page-form-panel'} onSubmit={handlePageAdd}>
                <div className={'projects-feature__page-form-grid'}>
                  <label className={'projects-feature__field'}>
                    <span className={'sr-only'}>페이지명</span>
                    <input
                      value={newPageDraft.title}
                      placeholder="페이지명"
                      onChange={(event) => handleNewPageDraftChange({ title: event.target.value })}
                    />
                  </label>
                  <label className={'projects-feature__field'}>
                    <span className={'sr-only'}>페이지URL</span>
                    <input
                      value={newPageDraft.url}
                      placeholder="페이지URL"
                      onChange={(event) => handleNewPageDraftChange({ url: event.target.value })}
                    />
                  </label>
                </div>
                <div className="projects-feature__form-actions projects-feature__page-table-actions">
                  <button
                    type="submit"
                    className={'projects-feature__button projects-feature__button--primary'}
                    disabled={savePageMutation.isPending}
                  >
                    추가
                  </button>
                </div>
              </form>
            ) : null}

            {selectedProjectPages.length ? (
              <div className={'projects-feature__page-table-wrap'}>
                <table className={'projects-feature__page-table'}>
                  <caption className={'sr-only'}>페이지 리스트</caption>
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
                            <label className={'sr-only'} htmlFor={`page-title-${page.id}`}>
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
                            <label className={'sr-only'} htmlFor={`page-url-${page.id}`}>
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
                            <div className={'projects-feature__page-table-actions'}>
                              <button
                                type="button"
                                className={
                                  'projects-feature__button projects-feature__button--secondary'
                                }
                                onClick={() => void handlePageSave(page.id)}
                              >
                                수정
                              </button>
                              {canDeletePage(page, member?.id ?? null, member?.role) ? (
                                <button
                                  type="button"
                                  className={'projects-feature__delete-button'}
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
              <div className={'projects-feature__empty-state'}>등록된 페이지가 없습니다.</div>
            )}
          </section>
        </section>
      ) : null}
    </section>
  );
}
