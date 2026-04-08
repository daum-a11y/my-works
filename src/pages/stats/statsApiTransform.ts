import type { ApiRecord } from '../../api/api.types';
import {
  normalizePageStatus,
  type MonitoringStatsRow,
  type QaStatsProjectRow,
} from '../../types/domain';

export function toMonitoringStatsRow(record: ApiRecord): MonitoringStatsRow {
  return {
    pageId: String(record.page_id ?? ''),
    projectId: String(record.project_id ?? ''),
    title: String(record.title ?? ''),
    url: String(record.url ?? ''),
    ownerMemberId: record.owner_member_id ? String(record.owner_member_id) : null,
    monitoringMonth: String(record.monitoring_month ?? ''),
    trackStatus: normalizePageStatus(String(record.track_status ?? '미수정')),
    monitoringInProgress: Boolean(record.monitoring_in_progress ?? false),
    qaInProgress: Boolean(record.qa_in_progress ?? false),
    note: String(record.note ?? ''),
    updatedAt: String(record.updated_at ?? ''),
    serviceGroupName: String(record.service_group_name ?? '-'),
    projectName: String(record.project_name ?? '-'),
    platform: String(record.platform ?? '-'),
    assigneeDisplay: String(record.assignee_display ?? '미지정'),
    reportUrl: String(record.report_url ?? ''),
  };
}

export function toQaStatsProject(record: ApiRecord): QaStatsProjectRow {
  return {
    id: String(record.id ?? ''),
    type1: String(record.type1 ?? ''),
    name: String(record.name ?? ''),
    serviceGroupName: String(record.service_group_name ?? '-'),
    reportUrl: String(record.report_url ?? ''),
    reporterDisplay: String(record.reporter_display ?? '미지정'),
    startDate: String(record.start_date ?? ''),
    endDate: String(record.end_date ?? ''),
    isActive: Boolean(record.is_active ?? true),
  };
}
