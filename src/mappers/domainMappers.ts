import type { ApiRecord, RawPagedResult } from '../api/api.types';
import {
  type CostGroup,
  type DashboardSnapshot,
  type DashboardTaskCalendarDay,
  type Member,
  type MonitoringStatsRow,
  normalizePageStatus,
  type PagedResult,
  type Platform,
  type Project,
  type ProjectListRow,
  type ProjectPage,
  type QaStatsProjectRow,
  type ReportProjectOptionRow,
  type ResourceMonthReport,
  type ResourceMonthReportMemberTotal,
  type ResourceMonthReportRow,
  type ResourceMonthReportServiceDetailRow,
  type ResourceMonthReportServiceSummaryRow,
  type ResourceMonthReportTypeRow,
  type ResourceServiceSummaryRow,
  type ResourceSummaryDayRow,
  type ResourceSummaryMemberRow,
  type ResourceTypeSummaryRow,
  type SearchTaskRow,
  type ServiceGroup,
  type StatsSnapshot,
  type Task,
  type TaskActivity,
  type TaskType,
} from '../types/domain';
import { getToday, readBooleanFlag } from '../utils';

function requireRecord(data: unknown, message: string): ApiRecord {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error(message);
  }

  return data as ApiRecord;
}

function dedupeById<T extends { id: string }>(items: T[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }

    seen.add(item.id);
    return true;
  });
}

export function mapMemberRecord(record: ApiRecord): Member {
  const reportRequired =
    typeof record.report_required === 'boolean'
      ? record.report_required
      : typeof record.report_required === 'number'
        ? record.report_required === 1
        : String(record.report_required ?? 0) === '1' ||
          String(record.report_required ?? false) === 'true';

  return {
    id: String(record.id),
    accountId: String(record.account_id ?? ''),
    name: String(record.name ?? ''),
    email: String(record.email ?? ''),
    role: Number(record.user_level ?? 0) === 1 ? 'admin' : 'user',
    isActive: readBooleanFlag(record.user_active ?? record.is_active, true),
    status: String(record.member_status ?? 'active') === 'pending' ? 'pending' : 'active',
    reportRequired,
    joinedAt: String(record.joined_at ?? record.created_at ?? getToday()),
    authUserId: record.auth_user_id ? String(record.auth_user_id) : null,
  };
}

export function mapMemberRecords(records: ApiRecord[]): Member[] {
  return records.map(mapMemberRecord);
}

export function mapTaskTypeRecord(record: ApiRecord): TaskType {
  return {
    id: String(record.id ?? ''),
    type1: String(record.type1 ?? ''),
    type2: String(record.type2 ?? ''),
    label: String(record.display_label ?? ''),
    displayOrder: Number(record.display_order ?? 0),
    requiresServiceGroup: Boolean(record.requires_service_group ?? false),
    isActive: Boolean(record.is_active ?? true),
  };
}

export function mapTaskTypeRecords(records: ApiRecord[]): TaskType[] {
  return records.map(mapTaskTypeRecord);
}

export function mapPlatformRecord(record: ApiRecord): Platform {
  return {
    id: String(record.id ?? ''),
    name: String(record.name ?? ''),
    displayOrder: Number(record.display_order ?? 0),
    isVisible: readBooleanFlag(record.is_visible, true),
  };
}

export function mapPlatformRecords(records: ApiRecord[]): Platform[] {
  return records.map(mapPlatformRecord);
}

export function mapCostGroupRecord(record: ApiRecord): CostGroup {
  return {
    id: String(record.id ?? ''),
    name: String(record.name ?? ''),
    displayOrder: Number(record.display_order ?? 0),
    isActive: Boolean(record.is_active ?? true),
  };
}

export function mapCostGroupRecords(records: ApiRecord[]): CostGroup[] {
  return records.map(mapCostGroupRecord);
}

export function mapServiceGroupRecord(record: ApiRecord): ServiceGroup {
  const costGroup = Array.isArray(record.cost_groups) ? record.cost_groups[0] : record.cost_groups;
  const costGroupName =
    costGroup && typeof costGroup === 'object'
      ? String((costGroup as ApiRecord).name ?? '')
      : String(record.cost_group_name ?? '');

  return {
    id: String(record.id ?? ''),
    name: String(record.name ?? ''),
    costGroupId: record.cost_group_id ? String(record.cost_group_id) : null,
    costGroupName,
    displayOrder: Number(record.display_order ?? 0),
    isActive: Boolean(record.is_active ?? true),
  };
}

export function mapServiceGroupRecords(records: ApiRecord[]): ServiceGroup[] {
  return records.map(mapServiceGroupRecord);
}

export function mapProjectRecord(record: ApiRecord): Project {
  return {
    id: String(record.id),
    createdByMemberId: record.created_by_member_id ? String(record.created_by_member_id) : null,
    projectType1: String(record.project_type1 ?? ''),
    name: String(record.name ?? ''),
    platformId: record.platform_id ? String(record.platform_id) : null,
    platform: String(record.platform ?? (record.platforms as ApiRecord | undefined)?.name ?? ''),
    serviceGroupId: record.service_group_id ? String(record.service_group_id) : null,
    reportUrl: String(record.report_url ?? ''),
    reporterMemberId: record.reporter_member_id ? String(record.reporter_member_id) : null,
    reviewerMemberId: record.reviewer_member_id ? String(record.reviewer_member_id) : null,
    startDate: String(record.start_date ?? getToday()),
    endDate: String(record.end_date ?? getToday()),
    isActive: Boolean(record.is_active ?? true),
  };
}

export function mapProjectRecords(records: ApiRecord[]): Project[] {
  return records.map(mapProjectRecord);
}

export function mapProjectPageRecord(record: ApiRecord): ProjectPage {
  return {
    id: String(record.id),
    projectId: String(record.project_id ?? ''),
    title: String(record.title ?? ''),
    url: String(record.url ?? ''),
    ownerMemberId: record.owner_member_id ? String(record.owner_member_id) : null,
    monitoringMonth: String(record.monitoring_month ?? ''),
    trackStatus: normalizePageStatus(String(record.track_status ?? '미수정')),
    monitoringInProgress: Boolean(record.monitoring_in_progress ?? false),
    qaInProgress: Boolean(record.qa_in_progress ?? false),
    note: String(record.note ?? ''),
    updatedAt: String(record.updated_at ?? getToday()),
  };
}

export function mapProjectPageRecords(records: ApiRecord[]): ProjectPage[] {
  return records.map(mapProjectPageRecord);
}

export function mapProjectListRowRecord(record: ApiRecord): ProjectListRow {
  return {
    id: String(record.id),
    createdByMemberId: record.created_by_member_id ? String(record.created_by_member_id) : null,
    projectType1: String(record.project_type1 ?? ''),
    name: String(record.name ?? ''),
    platformId: record.platform_id ? String(record.platform_id) : null,
    platform: String(record.platform ?? ''),
    serviceGroupId: record.service_group_id ? String(record.service_group_id) : null,
    serviceGroupName: String(record.service_group_name ?? '-'),
    reportUrl: String(record.report_url ?? ''),
    reporterMemberId: record.reporter_member_id ? String(record.reporter_member_id) : null,
    reporterDisplay: String(record.reporter_display ?? '-'),
    reviewerMemberId: record.reviewer_member_id ? String(record.reviewer_member_id) : null,
    reviewerDisplay: String(record.reviewer_display ?? '-'),
    startDate: String(record.start_date ?? getToday()),
    endDate: String(record.end_date ?? getToday()),
    isActive: Boolean(record.is_active ?? true),
    pageCount: Number(record.page_count ?? 0),
  };
}

export function mapProjectListRows(result: RawPagedResult): PagedResult<ProjectListRow> {
  return {
    items: dedupeById(result.items.map(mapProjectListRowRecord)),
    totalCount: result.totalCount,
  };
}

export function mapReportProjectOptionRowRecord(record: ApiRecord): ReportProjectOptionRow {
  return {
    id: String(record.id ?? ''),
    projectType1: String(record.project_type1 ?? ''),
    name: String(record.name ?? ''),
    platform: String(record.platform ?? ''),
    serviceGroupId: record.service_group_id ? String(record.service_group_id) : null,
    serviceGroupName: String(record.service_group_name ?? ''),
    serviceName: String(record.service_name ?? ''),
    costGroupId: record.cost_group_id ? String(record.cost_group_id) : null,
    costGroupName: String(record.cost_group_name ?? ''),
    reportUrl: String(record.report_url ?? ''),
  };
}

export function mapReportProjectOptionRows(records: ApiRecord[]): ReportProjectOptionRow[] {
  return dedupeById(records.map(mapReportProjectOptionRowRecord));
}

export function mapTaskRecord(record: ApiRecord): Task {
  return {
    id: String(record.id),
    memberId: String(record.member_id ?? ''),
    taskDate: String(record.task_date ?? getToday()),
    costGroupId: String(record.cost_group_id ?? ''),
    costGroupName: String(record.cost_group_name ?? ''),
    projectId: record.project_id ? String(record.project_id) : null,
    pageId: record.project_page_id ? String(record.project_page_id) : null,
    taskType1: String(record.task_type1 ?? ''),
    taskType2: String(record.task_type2 ?? ''),
    taskUsedtime: Number(record.task_usedtime ?? 0),
    content: String(record.content ?? ''),
    note: String(record.note ?? ''),
    createdAt: String(record.created_at ?? getToday()),
    updatedAt: String(record.updated_at ?? getToday()),
    platform: String(record.platform ?? '-'),
    serviceGroupName: String(record.service_group_name ?? ''),
    serviceName: String(record.service_name ?? ''),
    projectDisplayName: String(record.project_display_name ?? ''),
    pageDisplayName: String(record.page_display_name ?? ''),
    pageUrl: String(record.page_url ?? ''),
  };
}

export function mapTaskRecords(records: ApiRecord[]): Task[] {
  return dedupeById(records.map(mapTaskRecord));
}

export function mapSearchTaskRowRecord(record: ApiRecord): SearchTaskRow {
  return {
    id: String(record.id ?? ''),
    taskDate: String(record.task_date ?? getToday()),
    costGroupId: String(record.cost_group_id ?? ''),
    costGroupName: String(record.cost_group_name ?? ''),
    taskType1: String(record.task_type1 ?? ''),
    taskType2: String(record.task_type2 ?? ''),
    taskUsedtime: Number(record.task_usedtime ?? 0),
    content: String(record.content ?? ''),
    note: String(record.note ?? ''),
    updatedAt: String(record.updated_at ?? getToday()),
    platform: String(record.platform ?? '-'),
    serviceGroupName: String(record.service_group_name ?? '-'),
    serviceName: String(record.service_name ?? '-'),
    projectDisplayName: String(record.project_display_name ?? '-'),
    pageDisplayName: String(record.page_display_name ?? '-'),
    pageUrl: String(record.page_url ?? ''),
  };
}

export function mapSearchTaskRows(records: ApiRecord[]): SearchTaskRow[] {
  return dedupeById(records.map(mapSearchTaskRowRecord));
}

export function mapSearchTaskPage(result: RawPagedResult): PagedResult<SearchTaskRow> {
  return {
    items: mapSearchTaskRows(result.items),
    totalCount: result.totalCount,
  };
}

export function mapDashboardTaskCalendarDayRecord(record: ApiRecord): DashboardTaskCalendarDay {
  return {
    taskDate: String(record.task_date ?? getToday()),
    taskUsedtime: Number(record.task_usedtime ?? 0),
  };
}

export function mapDashboardTaskCalendarDayRecords(
  records: ApiRecord[],
): DashboardTaskCalendarDay[] {
  return records.map(mapDashboardTaskCalendarDayRecord);
}

export function mapTaskActivityRecord(record: ApiRecord): TaskActivity {
  return {
    memberId: String(record.member_id ?? ''),
    taskDate: String(record.task_date ?? getToday()),
    taskUsedtime: Number(record.task_usedtime ?? 0),
  };
}

export function mapTaskActivityRecords(records: ApiRecord[]): TaskActivity[] {
  return records.map(mapTaskActivityRecord);
}

export function mapResourceSummaryDayRowRecord(record: ApiRecord): ResourceSummaryDayRow {
  return {
    memberId: String(record.member_id ?? ''),
    accountId: String(record.account_id ?? ''),
    memberName: String(record.member_name ?? ''),
    taskDate: String(record.task_date ?? getToday()),
    taskUsedtime: Number(record.task_usedtime ?? 0),
  };
}

export function mapResourceSummaryDayRowRecords(records: ApiRecord[]): ResourceSummaryDayRow[] {
  return records.map(mapResourceSummaryDayRowRecord);
}

export function mapResourceSummaryMemberRowRecord(record: ApiRecord): ResourceSummaryMemberRow {
  return {
    id: String(record.id ?? ''),
    accountId: String(record.account_id ?? ''),
    name: String(record.name ?? ''),
  };
}

export function mapResourceSummaryMemberRowRecords(
  records: ApiRecord[],
): ResourceSummaryMemberRow[] {
  return records.map(mapResourceSummaryMemberRowRecord);
}

export function mapResourceTypeSummaryRowRecord(record: ApiRecord): ResourceTypeSummaryRow {
  return {
    year: String(record.year ?? ''),
    month: String(record.month ?? ''),
    taskType1: String(record.task_type1 ?? ''),
    taskUsedtime: Number(record.task_usedtime ?? 0),
  };
}

export function mapResourceTypeSummaryRowRecords(records: ApiRecord[]): ResourceTypeSummaryRow[] {
  return records.map(mapResourceTypeSummaryRowRecord);
}

export function mapResourceServiceSummaryRowRecord(record: ApiRecord): ResourceServiceSummaryRow {
  return {
    year: String(record.year ?? ''),
    month: String(record.month ?? ''),
    costGroupName: String(record.cost_group_name ?? ''),
    serviceGroupName: String(record.service_group_name ?? ''),
    serviceName: String(record.service_name ?? ''),
    taskUsedtime: Number(record.task_usedtime ?? 0),
  };
}

export function mapResourceServiceSummaryRowRecords(
  records: ApiRecord[],
): ResourceServiceSummaryRow[] {
  return records.map(mapResourceServiceSummaryRowRecord);
}

export function mapResourceMonthReportRowRecord(record: ApiRecord): ResourceMonthReportRow {
  return {
    memberId: String(record.member_id ?? ''),
    accountId: String(record.account_id ?? ''),
    taskDate: String(record.task_date ?? getToday()),
    costGroupId: String(record.cost_group_id ?? ''),
    taskType1: String(record.task_type1 ?? ''),
    taskType2: String(record.task_type2 ?? ''),
    taskUsedtime: Number(record.task_usedtime ?? 0),
    isServiceTask: Boolean(record.is_service_task ?? false),
    costGroupName: String(record.cost_group_name ?? ''),
    serviceGroupName: String(record.service_group_name ?? ''),
    serviceName: String(record.service_name ?? ''),
  };
}

function aggregateResourceMonthReport(rows: ResourceMonthReportRow[]): ResourceMonthReport {
  const typeGrouped = new Map<
    string,
    Map<string, { minutes: number; requiresServiceGroup: boolean }>
  >();
  const serviceSummaryGrouped = new Map<string, Map<string, Map<string, number>>>();
  const serviceDetailGrouped = new Map<string, Map<string, Map<string, Map<string, number>>>>();
  const memberTotals = new Map<string, ResourceMonthReportMemberTotal>();

  for (const row of rows) {
    const type1 = row.taskType1 || '미분류';
    const type2 = row.taskType2 || '미분류';
    const minutes = Math.round(row.taskUsedtime);
    const requiresServiceGroup = row.isServiceTask;

    const typeItems =
      typeGrouped.get(type1) ??
      new Map<string, { minutes: number; requiresServiceGroup: boolean }>();
    const currentType = typeItems.get(type2) ?? { minutes: 0, requiresServiceGroup };
    currentType.minutes += minutes;
    currentType.requiresServiceGroup = currentType.requiresServiceGroup || requiresServiceGroup;
    typeItems.set(type2, currentType);
    typeGrouped.set(type1, typeItems);

    const currentMember = memberTotals.get(row.memberId) ?? {
      id: row.memberId,
      accountId: row.accountId,
      totalMinutes: 0,
    };
    currentMember.totalMinutes += minutes;
    memberTotals.set(row.memberId, currentMember);

    if (!requiresServiceGroup) {
      continue;
    }

    const costGroupName = row.costGroupName || '미분류';
    const serviceGroupName = row.serviceGroupName || '미분류';
    const serviceName = row.serviceName || '미분류';

    const summaryServiceGroups =
      serviceSummaryGrouped.get(costGroupName) ?? new Map<string, Map<string, number>>();
    const summaryNames = summaryServiceGroups.get(serviceGroupName) ?? new Map<string, number>();
    summaryNames.set(serviceName, (summaryNames.get(serviceName) ?? 0) + minutes);
    summaryServiceGroups.set(serviceGroupName, summaryNames);
    serviceSummaryGrouped.set(costGroupName, summaryServiceGroups);

    const detailServiceGroups =
      serviceDetailGrouped.get(costGroupName) ??
      new Map<string, Map<string, Map<string, number>>>();
    const detailNames =
      detailServiceGroups.get(serviceGroupName) ?? new Map<string, Map<string, number>>();
    const detailTypes = detailNames.get(serviceName) ?? new Map<string, number>();
    detailTypes.set(type1, (detailTypes.get(type1) ?? 0) + minutes);
    detailNames.set(serviceName, detailTypes);
    detailServiceGroups.set(serviceGroupName, detailNames);
    serviceDetailGrouped.set(costGroupName, detailServiceGroups);
  }

  const typeRows: ResourceMonthReportTypeRow[] = Array.from(typeGrouped.entries())
    .map(([type1, items]) => {
      const mappedItems = Array.from(items.entries())
        .map(([type2, item]) => ({
          type2,
          minutes: item.minutes,
          requiresServiceGroup: item.requiresServiceGroup,
        }))
        .sort(
          (left, right) =>
            Number(right.requiresServiceGroup) - Number(left.requiresServiceGroup) ||
            left.type2.localeCompare(right.type2),
        );

      return {
        type1,
        totalMinutes: mappedItems.reduce((sum, item) => sum + item.minutes, 0),
        requiresServiceGroup: mappedItems.some((item) => item.requiresServiceGroup),
        items: mappedItems,
      };
    })
    .sort(
      (left, right) =>
        Number(right.requiresServiceGroup) - Number(left.requiresServiceGroup) ||
        left.type1.localeCompare(right.type1),
    );

  const serviceSummaryRows: ResourceMonthReportServiceSummaryRow[] = Array.from(
    serviceSummaryGrouped.entries(),
  )
    .flatMap(([costGroup, serviceGroups]) =>
      Array.from(serviceGroups.entries()).map(([group, names]) => ({
        costGroup,
        group,
        totalMinutes: Array.from(names.values()).reduce((sum, value) => sum + value, 0),
        names: Array.from(names.entries())
          .map(([name, minutes]) => ({ name, minutes }))
          .sort((left, right) => left.name.localeCompare(right.name)),
      })),
    )
    .sort(
      (left, right) =>
        left.costGroup.localeCompare(right.costGroup) || left.group.localeCompare(right.group),
    );

  const serviceDetailRows: ResourceMonthReportServiceDetailRow[] = Array.from(
    serviceDetailGrouped.entries(),
  )
    .flatMap(([costGroup, serviceGroups]) =>
      Array.from(serviceGroups.entries()).map(([group, names]) => ({
        costGroup,
        group,
        totalMinutes: Array.from(names.values())
          .flatMap((items) => Array.from(items.values()))
          .reduce((sum, value) => sum + value, 0),
        names: Array.from(names.entries())
          .map(([name, items]) => ({
            name,
            items: Array.from(items.entries())
              .map(([type1, minutes]) => ({ type1, minutes }))
              .sort((left, right) => left.type1.localeCompare(right.type1)),
          }))
          .sort((left, right) => left.name.localeCompare(right.name)),
      })),
    )
    .sort(
      (left, right) =>
        left.costGroup.localeCompare(right.costGroup) || left.group.localeCompare(right.group),
    );

  return {
    typeRows,
    serviceSummaryRows,
    serviceDetailRows,
    memberTotals: Array.from(memberTotals.values()).filter((item) => item.totalMinutes > 0),
  };
}

function mapResourceMonthReportTypeRows(value: unknown): ResourceMonthReportTypeRow[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((entry) => {
    const record = requireRecord(entry, '월간 타입 집계 형식이 올바르지 않습니다.');
    return {
      type1: String(record.type1 ?? ''),
      totalMinutes: Number(record.total_minutes ?? 0),
      requiresServiceGroup: Boolean(record.requires_service_group ?? false),
      items: Array.isArray(record.items)
        ? record.items.map((item) => {
            const itemRecord = requireRecord(item, '월간 타입 집계 항목 형식이 올바르지 않습니다.');
            return {
              type2: String(itemRecord.type2 ?? ''),
              minutes: Number(itemRecord.minutes ?? 0),
              requiresServiceGroup: Boolean(itemRecord.requires_service_group ?? false),
            };
          })
        : [],
    };
  });
}

function mapResourceMonthReportServiceSummaryRows(
  value: unknown,
): ResourceMonthReportServiceSummaryRow[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((entry) => {
    const record = requireRecord(entry, '월간 서비스 요약 형식이 올바르지 않습니다.');
    return {
      costGroup: String(record.cost_group ?? ''),
      group: String(record.group ?? ''),
      totalMinutes: Number(record.total_minutes ?? 0),
      names: Array.isArray(record.names)
        ? record.names.map((item) => {
            const itemRecord = requireRecord(
              item,
              '월간 서비스 요약 상세 항목 형식이 올바르지 않습니다.',
            );
            return {
              name: String(itemRecord.name ?? ''),
              minutes: Number(itemRecord.minutes ?? 0),
            };
          })
        : [],
    };
  });
}

function mapResourceMonthReportServiceDetailRows(
  value: unknown,
): ResourceMonthReportServiceDetailRow[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((entry) => {
    const record = requireRecord(entry, '월간 서비스 상세 형식이 올바르지 않습니다.');
    return {
      costGroup: String(record.cost_group ?? ''),
      group: String(record.group ?? ''),
      totalMinutes: Number(record.total_minutes ?? 0),
      names: Array.isArray(record.names)
        ? record.names.map((item) => {
            const itemRecord = requireRecord(
              item,
              '월간 서비스 상세 이름 형식이 올바르지 않습니다.',
            );
            return {
              name: String(itemRecord.name ?? ''),
              items: Array.isArray(itemRecord.items)
                ? itemRecord.items.map((subItem) => {
                    const subItemRecord = requireRecord(
                      subItem,
                      '월간 서비스 상세 타입 형식이 올바르지 않습니다.',
                    );
                    return {
                      type1: String(subItemRecord.type1 ?? ''),
                      minutes: Number(subItemRecord.minutes ?? 0),
                    };
                  })
                : [],
            };
          })
        : [],
    };
  });
}

function mapResourceMonthReportMemberTotals(value: unknown): ResourceMonthReportMemberTotal[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((entry) => {
    const record = requireRecord(entry, '월간 인원 집계 형식이 올바르지 않습니다.');
    return {
      id: String(record.id ?? ''),
      accountId: String(record.account_id ?? ''),
      totalMinutes: Number(record.total_minutes ?? 0),
    };
  });
}

function mapResourceMonthReportRecord(record: ApiRecord): ResourceMonthReport {
  return {
    typeRows: mapResourceMonthReportTypeRows(record.type_rows),
    serviceSummaryRows: mapResourceMonthReportServiceSummaryRows(record.service_summary_rows),
    serviceDetailRows: mapResourceMonthReportServiceDetailRows(record.service_detail_rows),
    memberTotals: mapResourceMonthReportMemberTotals(record.member_totals),
  };
}

export function mapResourceMonthReportData(data: unknown): ResourceMonthReport {
  if (Array.isArray(data)) {
    return aggregateResourceMonthReport(
      data.map((record) => mapResourceMonthReportRowRecord(record as ApiRecord)),
    );
  }

  if (data && typeof data === 'object') {
    return mapResourceMonthReportRecord(data as ApiRecord);
  }

  return {
    typeRows: [],
    serviceSummaryRows: [],
    serviceDetailRows: [],
    memberTotals: [],
  };
}

export function mapMonitoringStatsRowRecord(record: ApiRecord): MonitoringStatsRow {
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

export function mapMonitoringStatsRowRecords(records: ApiRecord[]): MonitoringStatsRow[] {
  return records.map(mapMonitoringStatsRowRecord);
}

export function mapQaStatsProjectRowRecord(record: ApiRecord): QaStatsProjectRow {
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

export function mapQaStatsProjectRowRecords(records: ApiRecord[]): QaStatsProjectRow[] {
  return records.map(mapQaStatsProjectRowRecord);
}

export function mapDashboardSnapshot(data: unknown): DashboardSnapshot {
  const records = Array.isArray(data) ? data : [];

  return {
    inProgressProjects: records.map((entry) => {
      const record = entry as ApiRecord;
      return {
        projectId: String(record.project_id ?? ''),
        type1: String(record.type1 ?? '-'),
        projectName: String(record.project_name ?? '-'),
        platform: String(record.platform ?? '-'),
        serviceGroupName: String(record.service_group_name ?? '-'),
        startDate: String(record.start_date ?? getToday()),
        endDate: String(record.end_date ?? getToday()),
      } satisfies DashboardSnapshot['inProgressProjects'][number];
    }),
  };
}

export function mapStatsSnapshot(data: unknown): StatsSnapshot {
  const record = requireRecord(data, '통계 결과를 확인할 수 없습니다.');
  const statusBreakdownRaw = Array.isArray(record.status_breakdown) ? record.status_breakdown : [];
  const typeBreakdownRaw = Array.isArray(record.type_breakdown) ? record.type_breakdown : [];

  return {
    totalTaskUsedtime: Number(record.total_task_usedtime ?? 0),
    totalTasks: Number(record.total_tasks ?? 0),
    monitoringInProgress: Number(record.monitoring_in_progress ?? 0),
    qaInProgress: Number(record.qa_in_progress ?? 0),
    statusBreakdown: statusBreakdownRaw.map((item) => {
      const row = requireRecord(item, '상태 통계 결과를 확인할 수 없습니다.');
      return {
        status: String(
          row.status ?? '미수정',
        ) as StatsSnapshot['statusBreakdown'][number]['status'],
        count: Number(row.count ?? 0),
      };
    }),
    typeBreakdown: typeBreakdownRaw.map((item) => {
      const row = requireRecord(item, '업무유형 통계 결과를 확인할 수 없습니다.');
      return {
        type: String(row.type ?? ''),
        taskUsedtime: Number(row.task_usedtime ?? 0),
      };
    }),
  };
}
