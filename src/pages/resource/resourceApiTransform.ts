import type { ApiRecord } from '../../api/api.types';
import type {
  ResourceMonthReport,
  ResourceMonthReportMemberTotal,
  ResourceMonthReportServiceDetailRow,
  ResourceMonthReportServiceSummaryRow,
  ResourceMonthReportTypeRow,
  ResourceServiceSummaryRow,
  ResourceSummaryDayRow,
  ResourceSummaryMemberRow,
  ResourceTypeSummaryRow,
} from '../../types/domain';
import { getToday } from '../../utils';

export function toResourceSummaryMember(record: ApiRecord): ResourceSummaryMemberRow {
  return {
    id: String(record.id ?? ''),
    accountId: String(record.account_id ?? ''),
    name: String(record.name ?? ''),
  };
}

export function toResourceSummaryDay(record: ApiRecord): ResourceSummaryDayRow {
  return {
    memberId: String(record.member_id ?? ''),
    accountId: String(record.account_id ?? ''),
    memberName: String(record.member_name ?? ''),
    taskDate: String(record.task_date ?? getToday()),
    taskUsedtime: Number(record.task_usedtime ?? 0),
  };
}

export function toResourceTypeSummaryRow(record: ApiRecord): ResourceTypeSummaryRow {
  return {
    year: String(record.year ?? ''),
    month: String(record.month ?? ''),
    taskType1: String(record.task_type1 ?? ''),
    taskUsedtime: Number(record.task_usedtime ?? 0),
  };
}

export function toResourceServiceSummaryRow(record: ApiRecord): ResourceServiceSummaryRow {
  return {
    year: String(record.year ?? ''),
    month: String(record.month ?? ''),
    costGroupName: String(record.cost_group_name ?? ''),
    serviceGroupName: String(record.service_group_name ?? ''),
    serviceName: String(record.service_name ?? ''),
    taskUsedtime: Number(record.task_usedtime ?? 0),
  };
}

function asRecord(value: unknown) {
  return value as ApiRecord;
}

export function toResourceMonthReport(data: unknown): ResourceMonthReport {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { typeRows: [], serviceSummaryRows: [], serviceDetailRows: [], memberTotals: [] };
  }

  const record = asRecord(data);
  const typeRows = Array.isArray(record.type_rows)
    ? record.type_rows.map((entry) => {
        const item = asRecord(entry);
        return {
          type1: String(item.type1 ?? ''),
          totalMinutes: Number(item.total_minutes ?? 0),
          requiresServiceGroup: Boolean(item.requires_service_group ?? false),
          items: Array.isArray(item.items)
            ? item.items.map((subEntry) => {
                const subItem = asRecord(subEntry);
                return {
                  type2: String(subItem.type2 ?? ''),
                  minutes: Number(subItem.minutes ?? 0),
                  requiresServiceGroup: Boolean(subItem.requires_service_group ?? false),
                };
              })
            : [],
        } satisfies ResourceMonthReportTypeRow;
      })
    : [];

  const serviceSummaryRows = Array.isArray(record.service_summary_rows)
    ? record.service_summary_rows.map((entry) => {
        const item = asRecord(entry);
        return {
          costGroup: String(item.cost_group ?? ''),
          group: String(item.group ?? ''),
          totalMinutes: Number(item.total_minutes ?? 0),
          names: Array.isArray(item.names)
            ? item.names.map((subEntry) => {
                const subItem = asRecord(subEntry);
                return {
                  name: String(subItem.name ?? ''),
                  minutes: Number(subItem.minutes ?? 0),
                };
              })
            : [],
        } satisfies ResourceMonthReportServiceSummaryRow;
      })
    : [];

  const serviceDetailRows = Array.isArray(record.service_detail_rows)
    ? record.service_detail_rows.map((entry) => {
        const item = asRecord(entry);
        return {
          costGroup: String(item.cost_group ?? ''),
          group: String(item.group ?? ''),
          totalMinutes: Number(item.total_minutes ?? 0),
          names: Array.isArray(item.names)
            ? item.names.map((subEntry) => {
                const subItem = asRecord(subEntry);
                return {
                  name: String(subItem.name ?? ''),
                  items: Array.isArray(subItem.items)
                    ? subItem.items.map((typeEntry) => {
                        const typeItem = asRecord(typeEntry);
                        return {
                          type1: String(typeItem.type1 ?? ''),
                          minutes: Number(typeItem.minutes ?? 0),
                        };
                      })
                    : [],
                };
              })
            : [],
        } satisfies ResourceMonthReportServiceDetailRow;
      })
    : [];

  const memberTotals = Array.isArray(record.member_totals)
    ? record.member_totals.map((entry) => {
        const item = asRecord(entry);
        return {
          id: String(item.id ?? ''),
          accountId: String(item.account_id ?? ''),
          totalMinutes: Number(item.total_minutes ?? 0),
        } satisfies ResourceMonthReportMemberTotal;
      })
    : [];

  return { typeRows, serviceSummaryRows, serviceDetailRows, memberTotals };
}
