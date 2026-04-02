import type { TaskType } from './domain';

const MANUAL_PAGE_WITH_URL_TYPE_NAMES = new Set(['데이터버퍼', 'RnD']);
const MANUAL_PAGE_ONLY_TYPE_NAMES = new Set([
  '일반버퍼',
  '교육',
  '매니징',
  '매니징버퍼',
  '기타버퍼',
]);
const PROJECT_PAGE_SELECT_TYPE_NAMES = new Set(['모니터링', '민원']);
const QA_PROJECT_TYPE_NAMES = new Set(['QA', '접근성테스트']);

function normalizeTypeName(value: string) {
  return value.trim();
}

function isTaskTypeVisible(taskType: TaskType, currentValue: string) {
  const normalizedCurrentValue = normalizeTypeName(currentValue);
  const normalizedType1 = normalizeTypeName(taskType.type1);
  const normalizedType2 = normalizeTypeName(taskType.type2);
  return (
    taskType.isActive ||
    normalizedType1 === normalizedCurrentValue ||
    normalizedType2 === normalizedCurrentValue
  );
}

export function buildTaskType1Options(
  taskTypes: TaskType[],
  options: {
    currentValue?: string;
    projectOnly?: boolean;
  } = {},
) {
  const currentValue = normalizeTypeName(options.currentValue ?? '');
  const unique = new Set<string>();
  const values: string[] = [];

  for (const taskType of taskTypes) {
    const normalizedType1 = normalizeTypeName(taskType.type1);
    if (!normalizedType1) {
      continue;
    }

    if (options.projectOnly && !taskType.requiresServiceGroup) {
      continue;
    }

    if (!isTaskTypeVisible(taskType, currentValue) || unique.has(normalizedType1)) {
      continue;
    }

    unique.add(normalizedType1);
    values.push(normalizedType1);
  }

  if (currentValue && !unique.has(currentValue)) {
    values.push(currentValue);
  }

  return values;
}

export function buildProjectTypeOptions(taskTypes: TaskType[], currentValue = '') {
  return buildTaskType1Options(taskTypes, { currentValue, projectOnly: true });
}

export function buildTaskType2Options(
  taskTypes: TaskType[],
  selectedType1 = '',
  currentValue = '',
) {
  const normalizedType1 = normalizeTypeName(selectedType1);
  const normalizedCurrentValue = normalizeTypeName(currentValue);
  if (!normalizedType1) {
    return [];
  }

  const unique = new Set<string>();
  const values: string[] = [];

  for (const taskType of taskTypes) {
    if (normalizeTypeName(taskType.type1) !== normalizedType1) {
      continue;
    }

    const normalizedType2 = normalizeTypeName(taskType.type2);
    if (!normalizedType2 || unique.has(normalizedType2)) {
      continue;
    }

    if (!isTaskTypeVisible(taskType, normalizedCurrentValue)) {
      continue;
    }

    unique.add(normalizedType2);
    values.push(normalizedType2);
  }

  if (normalizedCurrentValue && !unique.has(normalizedCurrentValue)) {
    values.push(normalizedCurrentValue);
  }

  return values;
}

export function isProjectType(type1: string, taskTypes: TaskType[]) {
  const normalizedType1 = normalizeTypeName(type1);
  if (!normalizedType1) {
    return false;
  }

  return taskTypes.some(
    (taskType) =>
      normalizeTypeName(taskType.type1) === normalizedType1 && taskType.requiresServiceGroup,
  );
}

export function isQaProjectType(type1: string) {
  return QA_PROJECT_TYPE_NAMES.has(normalizeTypeName(type1));
}

export function getTaskTypeUiRule(type1: string, taskTypes: TaskType[]) {
  const normalizedType1 = normalizeTypeName(type1);
  const projectLinked = isProjectType(normalizedType1, taskTypes);

  return {
    projectLinked,
    vacation: normalizedType1 === '휴무',
    manualPageWithUrl: MANUAL_PAGE_WITH_URL_TYPE_NAMES.has(normalizedType1),
    manualPageOnly: MANUAL_PAGE_ONLY_TYPE_NAMES.has(normalizedType1),
    projectPageSelectable: PROJECT_PAGE_SELECT_TYPE_NAMES.has(normalizedType1),
  };
}
