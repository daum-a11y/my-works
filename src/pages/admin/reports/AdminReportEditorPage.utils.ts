import type {
  CostGroup,
  Platform,
  Project,
  ProjectPage,
  ServiceGroup,
  TaskType,
} from '../../../types/domain';
import { adminDataClient } from '../../../api/admin';
import {
  toAdminCostGroup,
  toAdminPage,
  toAdminPlatform,
  toAdminProject,
  toAdminServiceGroup,
  toAdminTaskType,
} from '../adminApiTransform';
import type { ReportDraft } from '../../reports/reportUtils';
import type { AdminTaskSearchItem } from '../admin.types';

export function formatCompactDate(value: string, mode: 'short' | 'long') {
  if (!value) {
    return '';
  }

  const digits = value.replaceAll('-', '');
  if (digits.length !== 8) {
    return value;
  }

  return mode === 'short' ? digits.slice(2) : digits;
}

export function parseCompactDate(value: string, mode: 'short' | 'long') {
  const digits = value.replace(/\D/g, '');

  if (mode === 'short' && digits.length === 6) {
    return `20${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4, 6)}`;
  }

  if (mode === 'long' && digits.length === 8) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
  }

  return value;
}

export function toTaskTypes(
  items: Awaited<ReturnType<typeof adminDataClient.listTaskTypes>>,
): TaskType[] {
  return items.map(toAdminTaskType).map((item) => ({
    id: item.id,
    type1: item.type1,
    type2: item.type2,
    label: item.displayLabel,
    displayOrder: item.displayOrder,
    requiresServiceGroup: item.requiresServiceGroup,
    isActive: item.isActive,
  }));
}

export function toServiceGroups(
  items: Awaited<ReturnType<typeof adminDataClient.listServiceGroups>>,
): ServiceGroup[] {
  return items.map(toAdminServiceGroup).map((item) => ({
    id: item.id,
    name: item.name,
    costGroupId: item.costGroupId,
    costGroupName: item.costGroupName,
    displayOrder: item.displayOrder,
    isActive: item.isActive,
  }));
}

export function toProjects(
  items: Awaited<ReturnType<typeof adminDataClient.listProjects>>,
): Project[] {
  return items.map(toAdminProject).map((item) => ({
    id: item.id,
    createdByMemberId: null,
    projectType1: item.projectType1,
    name: item.name,
    platformId: item.platformId,
    platform: item.platform,
    serviceGroupId: item.serviceGroupId,
    reportUrl: item.reportUrl,
    reporterMemberId: null,
    reviewerMemberId: null,
    startDate: '',
    endDate: '',
    isActive: item.isActive,
  }));
}

export function toCostGroups(
  items: Awaited<ReturnType<typeof adminDataClient.listCostGroups>>,
): CostGroup[] {
  return items.map(toAdminCostGroup).map((item) => ({
    id: item.id,
    name: item.name,
    displayOrder: item.displayOrder,
    isActive: item.isActive,
  }));
}

export function toPlatforms(
  items: Awaited<ReturnType<typeof adminDataClient.listPlatforms>>,
): Platform[] {
  return items.map(toAdminPlatform).map((item) => ({
    id: item.id,
    name: item.name,
    displayOrder: item.displayOrder,
    isVisible: item.isVisible,
  }));
}

export function toPages(
  items: Awaited<ReturnType<typeof adminDataClient.listProjectPages>>,
): ProjectPage[] {
  return items.map(toAdminPage).map((item) => ({
    id: item.id,
    projectId: item.projectId,
    title: item.title,
    url: item.url,
    ownerMemberId: null,
    monitoringMonth: '',
    trackStatus: item.trackStatus as ProjectPage['trackStatus'],
    monitoringInProgress: item.monitoringInProgress,
    qaInProgress: item.qaInProgress,
    note: '',
    updatedAt: '',
  }));
}

export function createDraftFromTask(task: AdminTaskSearchItem): ReportDraft {
  return {
    reportDate: task.taskDate,
    costGroupId: task.costGroupId,
    costGroupName: task.costGroupName,
    projectId: task.projectId ?? '',
    pageId: task.pageId ?? '',
    type1: task.taskType1,
    type2: task.taskType2,
    platform: task.platform || '',
    serviceGroupName: task.serviceGroupName || '',
    serviceName: task.serviceName || '',
    manualPageName: task.pageTitle || '',
    pageUrl: task.pageUrl || '',
    taskUsedtime: String(task.taskUsedtime ?? 0),
    content: task.content || '',
    note: task.note || '',
  };
}
