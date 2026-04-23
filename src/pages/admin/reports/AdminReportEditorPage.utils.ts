import type {
  CostGroup,
  Platform,
  Project,
  ProjectSubtask,
  ServiceGroup,
  TaskType,
} from '../../../types/domain';
import { deleteCostGroupAdmin, listCostGroups, reorderCostGroups, replaceCostGroupUsage, saveCostGroupAdmin } from '../../../api/costGroups';
import { deletePlatformAdmin, listPlatforms, reorderPlatforms, replacePlatformUsage, savePlatformAdmin } from '../../../api/platforms';
import { getProjectAdminOption, listProjects, listProjectSubtasks, listProjectSubtasksByProjectId, searchReportProjectsAdmin } from '../../../api/projects';
import { deleteServiceGroupAdmin, getServiceGroupUsageSummary, listServiceGroups, reorderServiceGroups, replaceServiceGroupUsage, saveServiceGroupAdmin } from '../../../api/serviceGroups';
import { deleteTaskTypeAdmin, getTaskTypeUsageSummary, listTaskTypes, reorderTaskTypes, replaceTaskTypeUsageById, saveTaskTypeAdmin } from '../../../api/taskTypes';
import {
  toAdminCostGroup,
  toAdminSubtask,
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
  items: Awaited<ReturnType<typeof listTaskTypes>>,
): TaskType[] {
  return items.map(toAdminTaskType).map((item) => ({
    id: item.id,
    type1: item.type1,
    type2: item.type2,
    label: [item.type1, item.type2].filter(Boolean).join(' / '),
    displayOrder: item.displayOrder,
    requiresServiceGroup: item.requiresServiceGroup,
    isActive: item.isActive,
  }));
}

export function toServiceGroups(
  items: Awaited<ReturnType<typeof listServiceGroups>>,
): ServiceGroup[] {
  return items.map(toAdminServiceGroup).map((item) => ({
    id: item.id,
    serviceGroupName: item.serviceGroupName,
    serviceName: item.serviceName,
    name: item.name,
    costGroupId: item.costGroupId,
    costGroupName: item.costGroupName,
    displayOrder: item.displayOrder,
    isActive: item.isActive,
  }));
}

export function toProjects(
  items: Awaited<ReturnType<typeof listProjects>>,
): Project[] {
  return items.map(toAdminProject).map((item) => ({
    id: item.id,
    createdByMemberId: null,
    taskTypeId: item.taskTypeId,
    taskType1: item.taskType1,
    name: item.name,
    platformId: item.platformId,
    platform: item.platform,
    costGroupId: item.costGroupId,
    costGroupName: item.costGroupName,
    serviceGroupId: item.serviceGroupId,
    serviceGroupName: item.serviceGroupName,
    serviceName: item.serviceName,
    reportUrl: item.reportUrl,
    reporterMemberId: null,
    reviewerMemberId: null,
    startDate: '',
    endDate: '',
    isActive: item.isActive,
  }));
}

export function toCostGroups(
  items: Awaited<ReturnType<typeof listCostGroups>>,
): CostGroup[] {
  return items.map(toAdminCostGroup).map((item) => ({
    id: item.id,
    name: item.name,
    displayOrder: item.displayOrder,
    isActive: item.isActive,
  }));
}

export function toPlatforms(
  items: Awaited<ReturnType<typeof listPlatforms>>,
): Platform[] {
  return items.map(toAdminPlatform).map((item) => ({
    id: item.id,
    name: item.name,
    displayOrder: item.displayOrder,
    isVisible: item.isVisible,
  }));
}

export function toPages(
  items: Awaited<ReturnType<typeof listProjectSubtasks>>,
): ProjectSubtask[] {
  return items.map(toAdminSubtask).map((item) => ({
    id: item.id,
    projectId: item.projectId,
    title: item.title,
    url: item.url,
    ownerMemberId: null,
    taskDate: '',
    taskStatus: item.taskStatus as ProjectSubtask['taskStatus'],
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
    subtaskId: task.subtaskId ?? '',
    type1: task.taskType1,
    type2: task.taskType2,
    platform: task.platform || '',
    serviceGroupName: task.serviceGroupName || '',
    serviceName: task.serviceName || '',
    manualSubtaskName: task.subtaskTitle || '',
    url: task.url || '',
    taskUsedtime: String(task.taskUsedtime ?? 0),
    content: task.content || '',
    note: task.note || '',
  };
}
