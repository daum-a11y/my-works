import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { dataClient } from '../../api/client';
import {
  toMember,
  toPlatform,
  toProject,
  toProjectSubtask,
  toServiceGroup,
  toTaskType,
} from './projectApiTransform';
import type { ProjectSubtask } from '../../types/domain';
import { buildTaskTypeOptionsForProjects } from '../../utils/taskType';
import {
  PROJECT_EDITOR_CREATE_TITLE,
  PROJECT_EDITOR_EDIT_TITLE,
} from './ProjectEditorPage.constants';
import { ProjectEditorActionRow } from './ProjectEditorActionRow';
import { ProjectEditorForm } from './ProjectEditorForm';
import { ProjectEditorSubtasksSection } from './ProjectEditorSubtasksSection';
import type { SubtaskFormState, ProjectFormState } from './ProjectEditorPage.types';
import { canDeleteSubtask, canDeleteProject } from './ProjectEditorPage.permissions';
import {
  initialSubtaskDraft,
  initialProjectDraft,
  sortSubtasks,
  toSubtaskDraft,
  toSubtaskInput,
  toProjectDraft,
  toProjectInput,
} from './ProjectEditorPage.draft';
import { splitServiceGroupName } from './ProjectEditorPage.service';
import '../../styles/pages/ProjectsPage.scss';

export function ProjectEditorPage() {
  const { session, status } = useAuth();
  const member = session?.member ?? null;
  const { projectId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const titleRef = useRef<HTMLInputElement | null>(null);
  const isEditMode = Boolean(projectId);

  const [projectDraft, setProjectDraft] = useState<ProjectFormState>(initialProjectDraft);
  const [subtaskDrafts, setSubtaskDrafts] = useState<Record<string, SubtaskFormState>>({});
  const [newSubtaskDraft, setNewSubtaskDraft] = useState<SubtaskFormState | null>(null);
  const [subtaskAddOpen, setSubtaskAddOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const query = useQuery({
    queryKey: ['project-editor', member?.id, projectId ?? 'new'],
    enabled: Boolean(member),
    retry: false,
    queryFn: async () => {
      const [project, subtasks, members, serviceGroups, platforms, taskTypes] = await Promise.all([
        projectId ? dataClient.getProject(projectId) : Promise.resolve(null),
        projectId ? dataClient.getProjectSubtasksByProjectId(projectId) : Promise.resolve([]),
        dataClient.getMembers(),
        dataClient.getServiceGroups(),
        dataClient.getPlatforms(),
        dataClient.getTaskTypes(),
      ]);
      return { project, subtasks, members, serviceGroups, platforms, taskTypes };
    },
  });

  const projectRecord = query.data?.project ?? null;
  const selectedProject = useMemo(
    () => (projectRecord ? toProject(projectRecord) : null),
    [projectRecord],
  );
  const subtasks = useMemo(
    () => (query.data?.subtasks ?? []).map(toProjectSubtask),
    [query.data?.subtasks],
  );
  const members = useMemo(() => (query.data?.members ?? []).map(toMember), [query.data?.members]);
  const serviceGroups = useMemo(
    () => (query.data?.serviceGroups ?? []).map(toServiceGroup),
    [query.data?.serviceGroups],
  );
  const platforms = useMemo(
    () => (query.data?.platforms ?? []).map(toPlatform),
    [query.data?.platforms],
  );
  const taskTypes = useMemo(
    () => (query.data?.taskTypes ?? []).map(toTaskType),
    [query.data?.taskTypes],
  );
  const projectTypeOptions = useMemo(
    () => buildTaskTypeOptionsForProjects(taskTypes, projectDraft.taskTypeId),
    [projectDraft.taskTypeId, taskTypes],
  );

  const selectedProjectSubtasks = useMemo(() => sortSubtasks(subtasks), [subtasks]);
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
    setSubtaskDrafts(
      Object.fromEntries(
        selectedProjectSubtasks.map((subtask) => [subtask.id, toSubtaskDraft(subtask)] as const),
      ),
    );
    setNewSubtaskDraft(
      initialSubtaskDraft(selectedProject.id, selectedProject.reporterMemberId ?? ''),
    );
    setSubtaskAddOpen(false);
  }, [isEditMode, selectedProject, selectedProjectSubtasks]);

  useEffect(() => {
    if (isEditMode) {
      return;
    }

    setProjectDraft(initialProjectDraft());
    setSubtaskDrafts({});
    setNewSubtaskDraft(null);
    setSubtaskAddOpen(false);
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

      setProjectDraft(toProjectDraft(toProject(saved)));
    },
    onError: (error) => {
      setStatusMessage(error instanceof Error ? error.message : '프로젝트를 저장하지 못했습니다.');
    },
  });

  const saveSubtaskMutation = useMutation({
    mutationFn: async (draft: SubtaskFormState) => {
      if (!member) {
        throw new Error('로그인 정보가 없습니다.');
      }

      return dataClient.saveProjectSubtask(toSubtaskInput(draft));
    },
    onSuccess: async (saved) => {
      await queryClient.invalidateQueries({ queryKey: ['projects', member?.id] });
      await queryClient.invalidateQueries({ queryKey: ['project-editor', member?.id] });
      const mappedSubtask = toProjectSubtask(saved);
      setSubtaskDrafts((current) => ({
        ...current,
        [mappedSubtask.id]: toSubtaskDraft(mappedSubtask),
      }));
      setStatusMessage('과업을 저장했습니다.');
      setSubtaskAddOpen(false);
      setNewSubtaskDraft(
        selectedProject
          ? initialSubtaskDraft(selectedProject.id, selectedProject.reporterMemberId ?? '')
          : null,
      );
    },
    onError: (error) => {
      setStatusMessage(error instanceof Error ? error.message : '과업을 저장하지 못했습니다.');
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

  const deleteSubtaskMutation = useMutation({
    mutationFn: async (id: string) => dataClient.deleteProjectSubtask(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['projects', member?.id] });
      await queryClient.invalidateQueries({ queryKey: ['project-editor', member?.id] });
      setStatusMessage('과업을 삭제했습니다.');
    },
    onError: (error) => {
      setStatusMessage(error instanceof Error ? error.message : '과업을 삭제하지 못했습니다.');
    },
  });

  const handleProjectSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await saveProjectMutation.mutateAsync(projectDraft);
  };

  const handleSubtaskDraftChange = (subtaskId: string, patch: Partial<SubtaskFormState>) => {
    const baseSubtask = selectedProjectSubtasks.find((subtask) => subtask.id === subtaskId);

    if (!baseSubtask) {
      return;
    }

    setSubtaskDrafts((current) => ({
      ...current,
      [subtaskId]: {
        ...(current[subtaskId] ?? toSubtaskDraft(baseSubtask)),
        ...patch,
      },
    }));
  };

  const handleNewSubtaskDraftChange = (patch: Partial<SubtaskFormState>) => {
    setNewSubtaskDraft((current) => (current ? { ...current, ...patch } : current));
  };

  const handleSubtaskSave = async (subtaskId: string) => {
    if (saveSubtaskMutation.isPending) {
      return;
    }

    const draft = subtaskDrafts[subtaskId];
    if (!draft) {
      return;
    }

    const confirmed = window.confirm(
      '정말 수정 하시겠습니까?\n해당 과업을 사용한 모든 사람들의 내용이 수정됩니다.',
    );
    if (!confirmed) {
      return;
    }

    await saveSubtaskMutation.mutateAsync(draft);
  };

  const handleSubtaskAdd = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!newSubtaskDraft) {
      return;
    }

    if (!newSubtaskDraft.title.trim()) {
      setStatusMessage('과업명이 공백입니다.');
      return;
    }

    await saveSubtaskMutation.mutateAsync(newSubtaskDraft);
  };

  const handleProjectDelete = async () => {
    if (!selectedProject || deleteProjectMutation.isPending) {
      return;
    }

    const confirmed = window.confirm(
      '정말 삭제 하시겠습니까?\n프로젝트와 연결된 과업도 함께 삭제됩니다.',
    );
    if (!confirmed) {
      return;
    }

    await deleteProjectMutation.mutateAsync(selectedProject.id);
  };

  const handleSubtaskDelete = async (subtask: ProjectSubtask) => {
    if (deleteSubtaskMutation.isPending) {
      return;
    }

    const confirmed = window.confirm('정말 삭제 하시겠습니까?');
    if (!confirmed) {
      return;
    }

    await deleteSubtaskMutation.mutateAsync(subtask.id);
  };

  const loading = status === 'loading' || query.isLoading;
  const queryError = query.error instanceof Error ? query.error.message : '';

  if (loading) {
    return (
      <section className="projects-feature projects-feature--shell projects-feature--editor">
        <header className={'projects-feature__editor-header'}>
          <h1 className={'projects-feature__title'}>
            {isEditMode ? PROJECT_EDITOR_EDIT_TITLE : PROJECT_EDITOR_CREATE_TITLE}
          </h1>
          {isEditMode ? (
            <Link
              to="/projects"
              className={'projects-feature__button projects-feature__button--secondary'}
            >
              목록으로
            </Link>
          ) : null}
        </header>
        <p className={'projects-feature__status-message'}>프로젝트 데이터를 불러오는 중입니다.</p>
      </section>
    );
  }

  if (queryError) {
    return (
      <section className="projects-feature projects-feature--shell projects-feature--editor">
        <header className={'projects-feature__editor-header'}>
          <h1 className={'projects-feature__title'}>
            {isEditMode ? PROJECT_EDITOR_EDIT_TITLE : PROJECT_EDITOR_CREATE_TITLE}
          </h1>
          <Link
            to="/projects"
            className={'projects-feature__button projects-feature__button--secondary'}
          >
            목록으로
          </Link>
        </header>
        <p className={'projects-feature__status-message'}>{queryError}</p>
      </section>
    );
  }

  if (isEditMode && !selectedProject) {
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
        <section className={'projects-feature__modal'} aria-label="과업 목록 패널">
          <ProjectEditorSubtasksSection
            subtaskAddOpen={subtaskAddOpen}
            newSubtaskDraft={newSubtaskDraft}
            selectedProjectSubtasks={selectedProjectSubtasks}
            subtaskDrafts={subtaskDrafts}
            members={members}
            canDeleteSubtask={(subtask) =>
              canDeleteSubtask(subtask, member?.id ?? null, member?.role)
            }
            onToggleAdd={() => {
              setSubtaskAddOpen((current) => !current);
              setNewSubtaskDraft(
                initialSubtaskDraft(selectedProject.id, selectedProject.reporterMemberId ?? ''),
              );
            }}
            onNewSubtaskDraftChange={handleNewSubtaskDraftChange}
            onAddSubmit={(event) => void handleSubtaskAdd(event)}
            onSubtaskDraftChange={handleSubtaskDraftChange}
            onSubtaskSave={(subtaskId) => void handleSubtaskSave(subtaskId)}
            onSubtaskDelete={(subtask) => void handleSubtaskDelete(subtask)}
            savePending={saveSubtaskMutation.isPending}
            toSubtaskDraft={toSubtaskDraft}
          />
        </section>
      ) : null}
    </section>
  );
}
