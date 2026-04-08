import type { ApiRecord } from '../../api/api.types';
import type { DashboardSnapshot, DashboardTaskCalendarDay } from '../../types/domain';
import { getToday } from '../../utils';

export function toDashboardTaskCalendarDay(record: ApiRecord): DashboardTaskCalendarDay {
  return {
    taskDate: String(record.task_date ?? getToday()),
    taskUsedtime: Number(record.task_usedtime ?? 0),
  };
}

export function toDashboardSnapshot(data: unknown): DashboardSnapshot {
  const items = Array.isArray(data) ? data : [];
  return {
    inProgressProjects: items.map((item) => {
      const record = item as ApiRecord;
      return {
        projectId: String(record.project_id ?? ''),
        type1: String(record.type1 ?? '-'),
        projectName: String(record.project_name ?? '-'),
        platform: String(record.platform ?? '-'),
        serviceGroupName: String(record.service_group_name ?? '-'),
        startDate: String(record.start_date ?? getToday()),
        endDate: String(record.end_date ?? getToday()),
      };
    }),
  };
}
