import {
  buildTaskType1Options as buildTaskType1OptionValues,
  buildTaskType2Options as buildTaskType2OptionValues,
} from '../../../utils/taskType';
import { toLocalDateInputValue } from '../../../utils';
import type { AdminTaskSearchItem, AdminTaskTypeItem } from '../admin.types';
import type { SortKey, SortState } from './AdminReportsPage.types';

export function buildExportFilename(startDate: string, endDate: string) {
  const compact = (value: string) => value.replaceAll('-', '').slice(2);

  if (startDate && endDate && startDate === endDate) {
    return `${compact(startDate)}_검색결과.xlsx`;
  }

  if (startDate && endDate) {
    return `${compact(startDate)}~${compact(endDate)}_검색결과.xlsx`;
  }

  if (startDate && !endDate) {
    return `${compact(startDate)}~${compact(startDate)}_검색결과.xlsx`;
  }

  if (!startDate && endDate) {
    return `${compact(endDate)}~${compact(endDate)}_검색결과.xlsx`;
  }

  return '검색결과.xlsx';
}

export function isDownloadRangeWithinThreeMonths(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return false;
  }

  const maxEnd = new Date(start);
  maxEnd.setMonth(maxEnd.getMonth() + 3);
  return end <= maxEnd;
}

export function formatSummaryMinutes(minutes: number) {
  return `${minutes.toFixed(0).replace(/(\d)(?=(\d{3})+(?:\.\d+)?$)/g, '$1,')}분`;
}

export function formatTimeCell(value: number) {
  return Number.isFinite(value) ? String(value) : '';
}

function compareText(left: string, right: string) {
  return left.localeCompare(right, 'ko');
}

function getSortValue(task: AdminTaskSearchItem, key: SortKey) {
  switch (key) {
    case 'id':
      return task.id;
    case 'member':
      return task.memberAccountId || task.memberId;
    case 'costGroup':
      return task.costGroupName;
    case 'taskType1':
      return task.taskType1;
    case 'taskType2':
      return task.taskType2;
    case 'platform':
      return task.platform;
    case 'serviceGroup':
      return task.serviceGroupName;
    case 'serviceName':
      return task.serviceName;
    case 'projectName':
      return task.projectName;
    case 'subtaskTitle':
      return task.subtaskTitle;
    case 'taskUsedtime':
      return task.taskUsedtime;
    case 'note':
      return task.note;
    case 'taskDate':
    default:
      return task.taskDate;
  }
}

export function sortTasks(tasks: readonly AdminTaskSearchItem[], sort: SortState) {
  const direction = sort.direction === 'asc' ? 1 : -1;

  return [...tasks].sort((left, right) => {
    const leftValue = getSortValue(left, sort.key);
    const rightValue = getSortValue(right, sort.key);

    if (typeof leftValue === 'number' && typeof rightValue === 'number') {
      return (leftValue - rightValue) * direction;
    }

    return compareText(String(leftValue ?? ''), String(rightValue ?? '')) * direction;
  });
}

export function getTaskType1Options(
  taskTypes: readonly AdminTaskTypeItem[],
  currentValue?: string,
) {
  return buildTaskType1OptionValues(
    taskTypes.map((item) => ({
      id: item.id,
      type1: item.type1,
      type2: item.type2,
      label: [item.type1, item.type2].filter(Boolean).join(' / '),
      displayOrder: item.displayOrder,
      requiresServiceGroup: item.requiresServiceGroup,
      isActive: item.isActive,
    })),
    { currentValue },
  );
}

export function getTaskType2Options(
  taskTypes: readonly AdminTaskTypeItem[],
  type1?: string,
  currentValue?: string,
) {
  if (!type1) {
    return currentValue ? [currentValue] : [];
  }

  return buildTaskType2OptionValues(
    taskTypes.map((item) => ({
      id: item.id,
      type1: item.type1,
      type2: item.type2,
      label: [item.type1, item.type2].filter(Boolean).join(' / '),
      displayOrder: item.displayOrder,
      requiresServiceGroup: item.requiresServiceGroup,
      isActive: item.isActive,
    })),
    type1,
    currentValue,
  );
}

export function createDefaultFilters() {
  const today = toLocalDateInputValue(new Date());

  return {
    startDate: today,
    endDate: today,
    memberId: '',
    costGroupId: '',
    platformId: '',
    serviceGroupId: '',
    projectId: '',
    subtaskId: '',
    taskTypeId: '',
    taskType1: '',
    taskType2: '',
    keyword: '',
  };
}
