import type { ApiRecord } from '../../api/api.types';
import type { DashboardSnapshot, DashboardTaskCalendarDay } from '../../types/domain';
import { getToday } from '../../utils';

function readValue(record: ApiRecord, snakeKey: string, camelKey: string) {
  return record[snakeKey] ?? record[camelKey];
}

export function toDashboardTaskCalendarDay(record: ApiRecord): DashboardTaskCalendarDay {
  return {
    taskDate: String(readValue(record, 'task_date', 'taskDate') ?? getToday()),
    taskUsedtime: Number(readValue(record, 'task_usedtime', 'taskUsedtime') ?? 0),
  };
}

export function toDashboardSnapshot(data: unknown): DashboardSnapshot {
  const source =
    data && typeof data === 'object' && !Array.isArray(data)
      ? ((data as ApiRecord).in_progress_projects ?? (data as ApiRecord).inProgressProjects)
      : data;
  const items = Array.isArray(source) ? source : [];
  return {
    inProgressProjects: items.map((item) => {
      const record = item as ApiRecord;
      return {
        projectId: String(readValue(record, 'project_id', 'projectId') ?? ''),
        type1: record.type1 == null ? null : String(record.type1),
        projectName:
          readValue(record, 'project_name', 'projectName') == null
            ? null
            : String(readValue(record, 'project_name', 'projectName')),
        platform: record.platform == null ? null : String(record.platform),
        serviceGroupName:
          readValue(record, 'service_group_name', 'serviceGroupName') == null
            ? null
            : String(readValue(record, 'service_group_name', 'serviceGroupName')),
        startDate: String(readValue(record, 'start_date', 'startDate') ?? getToday()),
        endDate: String(readValue(record, 'end_date', 'endDate') ?? getToday()),
      };
    }),
  };
}
