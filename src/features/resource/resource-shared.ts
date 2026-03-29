import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { opsDataClient } from '../../lib/data-client';
import {
  type Member,
  type Project,
  type ServiceGroup,
  type Task,
  type TaskType,
} from '../../lib/domain';
import { getToday } from '../../lib/utils';
import { useAuth } from '../auth/AuthContext';

export interface ResourceDataset {
  member: Member;
  tasks: Task[];
  members: Member[];
  projects: Project[];
  serviceGroups: ServiceGroup[];
  taskTypes: TaskType[];
}

export function shiftMonth(month: string, offset: number) {
  const [year, value] = month.split('-').map(Number);
  const date = new Date(year, value - 1 + offset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function getCurrentMonth(reference = new Date()) {
  return `${reference.getFullYear()}-${String(reference.getMonth() + 1).padStart(2, '0')}`;
}

export function getPreviousBusinessDay(reference = new Date()) {
  const date = new Date(reference);
  const day = date.getDay();

  if (day === 1) {
    date.setDate(date.getDate() - 3);
  } else if (day === 0) {
    date.setDate(date.getDate() - 2);
  } else {
    date.setDate(date.getDate() - 1);
  }

  return date.toISOString().slice(0, 10);
}

export function getNextBusinessDay(reference = new Date()) {
  const date = new Date(reference);
  const day = date.getDay();

  if (day === 5) {
    date.setDate(date.getDate() + 3);
  } else if (day === 6) {
    date.setDate(date.getDate() + 2);
  } else {
    date.setDate(date.getDate() + 1);
  }

  return date.toISOString().slice(0, 10);
}

export function buildMonthDays(month: string) {
  const [year, value] = month.split('-').map(Number);
  const count = new Date(year, value, 0).getDate();
  return Array.from({ length: count }, (_, index) => {
    const day = index + 1;
    const date = `${month}-${String(day).padStart(2, '0')}`;
    return {
      day,
      date,
      weekday: new Date(year, value - 1, day).getDay(),
    };
  });
}

export function buildCalendarWeeks(month: string) {
  const days = buildMonthDays(month);
  const firstWeekday = days[0]?.weekday ?? 0;
  const lastWeekday = days[days.length - 1]?.weekday ?? 0;
  const cells = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...days,
    ...Array.from({ length: 6 - lastWeekday }, () => null),
  ];
  const weeks: Array<Array<(typeof days)[number] | null>> = [];

  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7));
  }

  return weeks;
}

export function countWorkingDays(month: string) {
  return buildMonthDays(month).filter((day) => day.weekday !== 0 && day.weekday !== 6).length;
}

export function countWorkingDaysUntil(month: string, day: number) {
  return buildMonthDays(month).filter(
    (item) => item.day <= day && item.weekday !== 0 && item.weekday !== 6,
  ).length;
}

export function minutesFromHours(hours: number) {
  return Math.round(hours * 60);
}

export function minutesToMm(minutes: number, workingDays = 21) {
  const total = workingDays * 480;
  return total > 0 ? minutes / total : 0;
}

export function minutesToMd(minutes: number) {
  return minutes / 480;
}

export function formatMm(minutes: number, workingDays = 21) {
  return minutesToMm(minutes, workingDays).toFixed(2);
}

export function formatMd(minutes: number) {
  return minutesToMd(minutes).toFixed(2);
}

export function buildTaskTypeRequirementMap(taskTypes: TaskType[]) {
  return new Map(
    taskTypes.map(
      (taskType) =>
        [`${taskType.type1}__${taskType.type2}`, taskType.requiresServiceGroup] as const,
    ),
  );
}

export function isServiceTask(task: Task, requirementMap: Map<string, boolean>) {
  return requirementMap.get(`${task.taskType1}__${task.taskType2}`) ?? Boolean(task.projectId);
}

export function useResourceDataset() {
  const { session } = useAuth();
  const member = session?.member ?? null;

  return useQuery({
    queryKey: ['resource', member?.id],
    enabled: Boolean(member),
    queryFn: async (): Promise<ResourceDataset> => {
      const [members, projects, serviceGroups, taskTypes] = await Promise.all([
        opsDataClient.getMembers(),
        opsDataClient.getProjects(),
        opsDataClient.getServiceGroups(),
        opsDataClient.getTaskTypes(),
      ]);

      const activeMembers = members.filter((item) => item.isActive);
      const tasks =
        member!.role === 'admin'
          ? (
              await Promise.all(
                activeMembers.map(async (item) => {
                  try {
                    return await opsDataClient.getTasks(item);
                  } catch {
                    return [];
                  }
                }),
              )
            ).flat()
          : await opsDataClient.getTasks(member!);

      return {
        member: member!,
        tasks,
        members: activeMembers,
        projects,
        serviceGroups,
        taskTypes,
      };
    },
  });
}

export function useResourceFilters(defaultMemberId?: string) {
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [selectedMonth, setSelectedMonth] = useState(getToday().slice(0, 7));
  const [selectedMemberId, setSelectedMemberId] = useState(defaultMemberId ?? '');

  return {
    selectedDate,
    setSelectedDate,
    selectedMonth,
    setSelectedMonth,
    selectedMemberId,
    setSelectedMemberId,
  };
}

export function buildProjectMaps(projects: Project[], serviceGroups: ServiceGroup[]) {
  const projectsById = new Map(projects.map((project) => [project.id, project] as const));
  const serviceGroupsById = new Map(serviceGroups.map((group) => [group.id, group] as const));
  return { projectsById, serviceGroupsById };
}

export function getTaskServiceInfo(
  task: Task,
  projectsById: Map<string, Project>,
  serviceGroupsById: Map<string, ServiceGroup>,
) {
  const project = task.projectId ? projectsById.get(task.projectId) : undefined;
  const rawServiceGroupName = project?.serviceGroupId
    ? (serviceGroupsById.get(project.serviceGroupId)?.name ?? '')
    : '';
  const parsedService = splitNormalizedServiceName(rawServiceGroupName);
  const hasMergedServiceName = rawServiceGroupName.includes(' / ');

  return {
    group: parsedService.group || '미분류',
    name: hasMergedServiceName ? parsedService.name : '미분류',
  };
}

export function getServiceGroupName(
  task: Task,
  projectsById: Map<string, Project>,
  serviceGroupsById: Map<string, ServiceGroup>,
) {
  const service = getTaskServiceInfo(task, projectsById, serviceGroupsById);
  if (service.group === '미분류' && service.name === '미분류') {
    return '미분류';
  }

  return `${service.group} / ${service.name}`;
}

export function splitNormalizedServiceName(name: string) {
  const normalized = name.trim();
  if (!normalized || normalized === '미분류') {
    return { group: '미분류', name: '미분류' };
  }

  const [group, ...rest] = normalized.split(' / ');
  if (rest.length === 0) {
    return { group: normalized, name: normalized };
  }

  return {
    group: group.trim(),
    name: rest.join(' / ').trim(),
  };
}

export function filterTasksByMonth(tasks: Task[], month: string) {
  return tasks.filter((task) => task.taskDate.startsWith(month));
}

export function useResourceLookups(data: ResourceDataset | undefined) {
  return useMemo(() => {
    if (!data) {
      return {
        membersById: new Map<string, Member>(),
        projectsById: new Map<string, Project>(),
        serviceGroupsById: new Map<string, ServiceGroup>(),
      };
    }

    return {
      membersById: new Map(data.members.map((member) => [member.id, member] as const)),
      projectsById: new Map(data.projects.map((project) => [project.id, project] as const)),
      serviceGroupsById: new Map(data.serviceGroups.map((group) => [group.id, group] as const)),
    };
  }, [data]);
}
