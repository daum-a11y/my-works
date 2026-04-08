import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { dataClient } from '../../api/client';
import {
  mapMemberRecords,
  mapPlatformRecords,
  mapProjectPageRecord,
  mapProjectPageRecords,
  mapProjectRecord,
  mapServiceGroupRecords,
  mapTaskTypeRecords,
} from '../../mappers/domainMappers';
import type { ProjectPage } from '../../types/domain';
import { buildProjectTypeOptions } from '../../utils/taskType';
import {
  PROJECT_EDITOR_CREATE_TITLE,
  PROJECT_EDITOR_EDIT_TITLE,
} from './ProjectEditorPage.constants';
import { ProjectEditorActionRow } from './ProjectEditorActionRow';
import { ProjectEditorForm } from './ProjectEditorForm';
import { ProjectEditorPagesSection } from './ProjectEditorPagesSection';
import type { PageFormState, ProjectFormState } from './ProjectEditorPage.types';
import { canDeletePage, canDeleteProject } from './ProjectEditorPage.permissions';
import {
  initialPageDraft,
  initialProjectDraft,
  sortPages,
  toPageDraft,
  toPageInput,
  toProjectDraft,
  toProjectInput,
} from './ProjectEditorPage.draft';
import { splitServiceGroupName } from './ProjectEditorPage.service';
import '../../styles/pages/ProjectsPage.scss';

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

  const projectRecord = query.data?.project ?? null;
  const selectedProject = useMemo(
    () => (projectRecord ? mapProjectRecord(projectRecord) : null),
    [projectRecord],
  );
  const pages = useMemo(() => mapProjectPageRecords(query.data?.pages ?? []), [query.data?.pages]);
  const members = useMemo(() => mapMemberRecords(query.data?.members ?? []), [query.data?.members]);
  const serviceGroups = useMemo(
    () => mapServiceGroupRecords(query.data?.serviceGroups ?? []),
    [query.data?.serviceGroups],
  );
  const platforms = useMemo(
    () => mapPlatformRecords(query.data?.platforms ?? []),
    [query.data?.platforms],
  );
  const taskTypes = useMemo(
    () => mapTaskTypeRecords(query.data?.taskTypes ?? []),
    [query.data?.taskTypes],
  );
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

      setProjectDraft(toProjectDraft(mapProjectRecord(saved)));
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
      const mappedPage = mapProjectPageRecord(saved);
      setPageDrafts((current) => ({ ...current, [mappedPage.id]: toPageDraft(mappedPage) }));
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
          <h1 className={'projects-feature__title'}>{PROJECT_EDITOR_EDIT_TITLE}</h1>
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
          {isEditMode ? PROJECT_EDITOR_EDIT_TITLE : PROJECT_EDITOR_CREATE_TITLE}
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
          <ProjectEditorForm
            projectDraft={projectDraft}
            projectTypeOptions={projectTypeOptions}
            platforms={platforms}
            serviceGroupOptions={serviceGroupOptions}
            selectedCostGroupId={selectedCostGroupId}
            serviceGroupNameOptions={serviceGroupNameOptions}
            serviceNameOptions={serviceNameOptions}
            selectedServiceGroup={selectedServiceParts.serviceGroup}
            selectedServiceName={selectedServiceParts.serviceName}
            members={members}
            titleRef={titleRef}
            onProjectDraftChange={(patch) =>
              setProjectDraft((current) => ({
                ...current,
                ...patch,
              }))
            }
            onCostGroupChange={handleCostGroupChange}
            onServiceGroupChange={handleServiceGroupChange}
            onServiceNameChange={handleServiceNameChange}
          />

          <ProjectEditorActionRow
            canDelete={
              isEditMode &&
              selectedProject !== null &&
              canDeleteProject(selectedProject, member?.id ?? null, member?.role)
            }
            saving={saveProjectMutation.isPending}
            onDelete={() => void handleProjectDelete()}
          />
        </form>
      </section>

      {isEditMode && selectedProject ? (
        <section className={'projects-feature__modal'} aria-label="페이지 목록 패널">
          <ProjectEditorPagesSection
            pageAddOpen={pageAddOpen}
            newPageDraft={newPageDraft}
            selectedProjectPages={selectedProjectPages}
            pageDrafts={pageDrafts}
            canDeletePage={(page) => canDeletePage(page, member?.id ?? null, member?.role)}
            onToggleAdd={() => {
              setPageAddOpen((current) => !current);
              setNewPageDraft(
                initialPageDraft(selectedProject.id, selectedProject.reporterMemberId ?? ''),
              );
            }}
            onNewPageDraftChange={handleNewPageDraftChange}
            onAddSubmit={(event) => void handlePageAdd(event)}
            onPageDraftChange={handlePageDraftChange}
            onPageSave={(pageId) => void handlePageSave(pageId)}
            onPageDelete={(page) => void handlePageDelete(page)}
            savePending={savePageMutation.isPending}
            toPageDraft={toPageDraft}
          />
        </section>
      ) : null}
    </section>
  );
}
