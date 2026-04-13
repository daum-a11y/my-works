import type { ApiRecord } from '../../api/api.types';
import {
  normalizeSubtaskStatus,
  type MonitoringStatsRow,
  type ProjectStatsRow,
} from '../../types/domain';

function readValue(record: ApiRecord, snakeKey: string, camelKey: string) {
  return record[snakeKey] ?? record[camelKey];
}

function readFirst(record: ApiRecord, ...keys: string[]) {
  for (const key of keys) {
    if (record[key] != null) {
      return record[key];
    }
  }
  return null;
}

export function toMonitoringStatsRow(record: ApiRecord): MonitoringStatsRow {
  return {
    subtaskId: String(readFirst(record, 'subtask_id', 'subtaskId', 'id') ?? ''),
    projectId: String(readValue(record, 'project_id', 'projectId') ?? ''),
    type1:
      readValue(record, 'type1', 'type1') == null ? null : String(readValue(record, 'type1', 'type1')),
    title: String(readFirst(record, 'title', 'subtask_title', 'subtaskTitle', 'page_name', 'pj_page_name') ?? ''),
    url: String(record.url ?? ''),
    ownerMemberId: readValue(record, 'owner_member_id', 'ownerMemberId')
      ? String(readValue(record, 'owner_member_id', 'ownerMemberId'))
      : null,
    taskMonth: String(
      readFirst(record, 'task_month', 'taskMonth', 'monitoring_month', 'monitoringMonth', 'pj_page_date') ?? '',
    ),
    taskStatus: normalizeSubtaskStatus(
      String(readFirst(record, 'task_status', 'taskStatus', 'track_status', 'trackStatus') ?? '미수정'),
    ),
    note: record.note == null ? null : String(record.note),
    updatedAt: String(readValue(record, 'updated_at', 'updatedAt') ?? ''),
    costGroupName:
      readValue(record, 'cost_group_name', 'costGroupName') == null
        ? null
        : String(readValue(record, 'cost_group_name', 'costGroupName')),
    serviceGroupName:
      readValue(record, 'service_group_name', 'serviceGroupName') == null
        ? null
        : String(readValue(record, 'service_group_name', 'serviceGroupName')),
    projectName:
      readValue(record, 'project_name', 'projectName') == null
        ? null
        : String(readValue(record, 'project_name', 'projectName')),
    platform: record.platform == null ? null : String(record.platform),
    assigneeDisplay:
      readValue(record, 'assignee_display', 'assigneeDisplay') == null
        ? null
        : String(readValue(record, 'assignee_display', 'assigneeDisplay')),
    reportUrl:
      readValue(record, 'report_url', 'reportUrl') == null
        ? null
        : String(readValue(record, 'report_url', 'reportUrl')),
  };
}

export function toProjectStatsRow(record: ApiRecord): ProjectStatsRow {
  return {
    projectId: String(readValue(record, 'project_id', 'projectId') ?? ''),
    type1:
      readValue(record, 'type1', 'type1') == null
        ? null
        : String(readValue(record, 'type1', 'type1')),
    projectName:
      readValue(record, 'project_name', 'projectName') == null
        ? null
        : String(readValue(record, 'project_name', 'projectName')),
    platform:
      readValue(record, 'platform', 'platform') == null
        ? null
        : String(readValue(record, 'platform', 'platform')),
    costGroupName:
      readValue(record, 'cost_group_name', 'costGroupName') == null
        ? null
        : String(readValue(record, 'cost_group_name', 'costGroupName')),
    serviceGroupName:
      readValue(record, 'service_group_name', 'serviceGroupName') == null
        ? null
        : String(readValue(record, 'service_group_name', 'serviceGroupName')),
    reportUrl:
      readValue(record, 'report_url', 'reportUrl') == null
        ? null
        : String(readValue(record, 'report_url', 'reportUrl')),
    reporterDisplay:
      readValue(record, 'reporter_display', 'reporterDisplay') == null
        ? null
        : String(readValue(record, 'reporter_display', 'reporterDisplay')),
    reviewerDisplay:
      readValue(record, 'reviewer_display', 'reviewerDisplay') == null
        ? null
        : String(readValue(record, 'reviewer_display', 'reviewerDisplay')),
    startDate: String(readValue(record, 'start_date', 'startDate') ?? ''),
    endDate: String(readValue(record, 'end_date', 'endDate') ?? ''),
    subtaskCount: Number(readValue(record, 'subtask_count', 'subtaskCount') ?? 0),
    untouchedSubtaskCount: Number(
      readValue(record, 'untouched_subtask_count', 'untouchedSubtaskCount') ?? 0,
    ),
    partialSubtaskCount: Number(
      readValue(record, 'partial_subtask_count', 'partialSubtaskCount') ?? 0,
    ),
    completedSubtaskCount: Number(
      readValue(record, 'completed_subtask_count', 'completedSubtaskCount') ?? 0,
    ),
  };
}
