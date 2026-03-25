import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { opsDataClient } from "../../lib/data-client";
import { type Member, type Project, type ServiceGroup, type Task, type TaskType } from "../../lib/domain";
import { formatHours, getToday } from "../../lib/utils";
import { useAuth } from "../auth/AuthContext";

export interface ResourceDataset {
  member: Member;
  tasks: Task[];
  members: Member[];
  projects: Project[];
  serviceGroups: ServiceGroup[];
  taskTypes: TaskType[];
}

export function shiftMonth(month: string, offset: number) {
  const [year, value] = month.split("-").map(Number);
  const date = new Date(year, value - 1 + offset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function buildMonthDays(month: string) {
  const [year, value] = month.split("-").map(Number);
  const count = new Date(year, value, 0).getDate();
  return Array.from({ length: count }, (_, index) => {
    const day = index + 1;
    const date = `${month}-${String(day).padStart(2, "0")}`;
    return {
      day,
      date,
      weekday: new Date(year, value - 1, day).getDay(),
    };
  });
}

export function useResourceDataset() {
  const { session } = useAuth();
  const member = session?.member ?? null;

  return useQuery({
    queryKey: ["resource", member?.id],
    enabled: Boolean(member),
    queryFn: async (): Promise<ResourceDataset> => {
      const [tasks, members, projects, serviceGroups, taskTypes] = await Promise.all([
        opsDataClient.getAllTasks(member!),
        opsDataClient.getMembers(),
        opsDataClient.getProjects(),
        opsDataClient.getServiceGroups(),
        opsDataClient.getTaskTypes(),
      ]);

      return {
        member: member!,
        tasks,
        members: members.filter((item) => item.isActive),
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
  const [selectedMemberId, setSelectedMemberId] = useState(defaultMemberId ?? "");

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

export function createHoursLabel(hours: number) {
  return `${formatHours(hours)} / ${Math.round(hours * 60)}분`;
}

export function getServiceGroupName(
  task: Task,
  projectsById: Map<string, Project>,
  serviceGroupsById: Map<string, ServiceGroup>,
) {
  if (!task.projectId) {
    return "미분류";
  }

  const project = projectsById.get(task.projectId);
  if (!project?.serviceGroupId) {
    return "미분류";
  }

  return serviceGroupsById.get(project.serviceGroupId)?.name ?? "미분류";
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
