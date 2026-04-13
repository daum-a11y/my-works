import { getToday } from '../../utils';
import type { Project, ProjectSubtask } from '../../types/domain';
import type { SubtaskFormState, ProjectFormState } from './ProjectEditorPage.types';

export const initialProjectDraft = (): ProjectFormState => ({
  taskTypeId: '',
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

export const initialSubtaskDraft = (projectId = '', ownerMemberId = ''): SubtaskFormState => ({
  projectId,
  title: '',
  url: '',
  ownerMemberId,
  taskDate: '',
  taskStatus: '미수정',
  note: '',
});

export function toProjectDraft(project: Project): ProjectFormState {
  return {
    id: project.id,
    taskTypeId: project.taskTypeId ?? '',
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

export function toSubtaskDraft(subtask: ProjectSubtask): SubtaskFormState {
  return {
    id: subtask.id,
    projectId: subtask.projectId,
    title: subtask.title,
    url: subtask.url,
    ownerMemberId: subtask.ownerMemberId ?? '',
    taskDate: subtask.taskDate,
    taskStatus: subtask.taskStatus,
    note: subtask.note,
  };
}

export function toProjectInput(draft: ProjectFormState) {
  return {
    id: draft.id,
    taskTypeId: draft.taskTypeId.trim() || null,
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

export function toSubtaskInput(draft: SubtaskFormState) {
  return {
    id: draft.id,
    projectId: draft.projectId,
    title: draft.title.trim(),
    url: draft.url.trim(),
    ownerMemberId: draft.ownerMemberId.trim() || null,
    taskDate: draft.taskDate.trim() || undefined,
    taskStatus: draft.taskStatus,
    note: draft.note.trim(),
  };
}

export function sortSubtasks(subtasks: ProjectSubtask[]) {
  return [...subtasks].sort(
    (left, right) =>
      right.updatedAt.localeCompare(left.updatedAt) || left.title.localeCompare(right.title, 'ko'),
  );
}
