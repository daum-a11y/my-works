import { getToday } from '../../utils';
import type { Project, ProjectPage } from '../../types/domain';
import type { PageFormState, ProjectFormState } from './ProjectEditorPage.types';

export const initialProjectDraft = (): ProjectFormState => ({
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

export const initialPageDraft = (projectId = '', ownerMemberId = ''): PageFormState => ({
  projectId,
  title: '',
  url: '',
  ownerMemberId,
  trackStatus: '미수정',
  monitoringInProgress: false,
  qaInProgress: false,
  note: '',
});

export function toProjectDraft(project: Project): ProjectFormState {
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

export function toPageDraft(page: ProjectPage): PageFormState {
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

export function toProjectInput(draft: ProjectFormState) {
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

export function toPageInput(draft: PageFormState) {
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

export function sortPages(pages: ProjectPage[]) {
  return [...pages].sort(
    (left, right) =>
      right.updatedAt.localeCompare(left.updatedAt) || left.title.localeCompare(right.title, 'ko'),
  );
}
