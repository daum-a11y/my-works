import type { ApiRecord } from '../../api/api.types';
import {
  normalizePageStatus,
  type MonitoringStatsRow,
  type QaStatsProjectRow,
} from '../../types/domain';

function readValue(record: ApiRecord, snakeKey: string, camelKey: string) {
  return record[snakeKey] ?? record[camelKey];
}

export function toMonitoringStatsRow(record: ApiRecord): MonitoringStatsRow {
  return {
    pageId: String(readValue(record, 'page_id', 'pageId') ?? ''),
    projectId: String(readValue(record, 'project_id', 'projectId') ?? ''),
    title: String(record.title ?? ''),
    url: String(record.url ?? ''),
    ownerMemberId: readValue(record, 'owner_member_id', 'ownerMemberId')
      ? String(readValue(record, 'owner_member_id', 'ownerMemberId'))
      : null,
    monitoringMonth: String(readValue(record, 'monitoring_month', 'monitoringMonth') ?? ''),
    trackStatus: normalizePageStatus(
      String(readValue(record, 'track_status', 'trackStatus') ?? '미수정'),
    ),
    monitoringInProgress: Boolean(
      readValue(record, 'monitoring_in_progress', 'monitoringInProgress') ?? false,
    ),
    qaInProgress: Boolean(readValue(record, 'qa_in_progress', 'qaInProgress') ?? false),
    note: record.note == null ? null : String(record.note),
    updatedAt: String(readValue(record, 'updated_at', 'updatedAt') ?? ''),
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

export function toQaStatsProject(record: ApiRecord): QaStatsProjectRow {
  return {
    id: String(record.id ?? ''),
    type1: record.type1 == null ? null : String(record.type1),
    name: record.name == null ? null : String(record.name),
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
    startDate: String(readValue(record, 'start_date', 'startDate') ?? ''),
    endDate: String(readValue(record, 'end_date', 'endDate') ?? ''),
    isActive: Boolean(readValue(record, 'is_active', 'isActive') ?? true),
  };
}
