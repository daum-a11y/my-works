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

function readValue(record: ApiRecord, snakeKey: string, camelKey: string) {
  return record[snakeKey] ?? record[camelKey];
}

export function toResourceSummaryMember(record: ApiRecord): ResourceSummaryMemberRow {
  return {
    id: String(record.id ?? ''),
    accountId: String(readValue(record, 'account_id', 'accountId') ?? ''),
    name: String(record.name ?? ''),
  };
}

export function toResourceSummaryDay(record: ApiRecord): ResourceSummaryDayRow {
  return {
    memberId: String(readValue(record, 'member_id', 'memberId') ?? ''),
    accountId: String(readValue(record, 'account_id', 'accountId') ?? ''),
    memberName: String(readValue(record, 'member_name', 'memberName') ?? ''),
    taskDate: String(readValue(record, 'task_date', 'taskDate') ?? getToday()),
    taskUsedtime: Number(readValue(record, 'task_usedtime', 'taskUsedtime') ?? 0),
  };
}

export function toResourceTypeSummaryRow(record: ApiRecord): ResourceTypeSummaryRow {
  return {
    year: String(record.year ?? ''),
    month: String(record.month ?? ''),
    taskType1: String(readValue(record, 'task_type1', 'taskType1') ?? ''),
    taskUsedtime: Number(readValue(record, 'task_usedtime', 'taskUsedtime') ?? 0),
  };
}

export function toResourceServiceSummaryRow(record: ApiRecord): ResourceServiceSummaryRow {
  return {
    year: String(record.year ?? ''),
    month: String(record.month ?? ''),
    costGroupName: String(readValue(record, 'cost_group_name', 'costGroupName') ?? ''),
    serviceGroupName: String(readValue(record, 'service_group_name', 'serviceGroupName') ?? ''),
    serviceName: String(readValue(record, 'service_name', 'serviceName') ?? ''),
    taskUsedtime: Number(readValue(record, 'task_usedtime', 'taskUsedtime') ?? 0),
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
  const typeRowsRaw = readValue(record, 'type_rows', 'typeRows');
  const serviceSummaryRowsRaw = readValue(record, 'service_summary_rows', 'serviceSummaryRows');
  const serviceDetailRowsRaw = readValue(record, 'service_detail_rows', 'serviceDetailRows');
  const memberTotalsRaw = readValue(record, 'member_totals', 'memberTotals');

  const typeRows = Array.isArray(typeRowsRaw)
    ? typeRowsRaw.map((entry) => {
        const item = asRecord(entry);
        return {
          type1: String(item.type1 ?? ''),
          totalMinutes: Number(readValue(item, 'total_minutes', 'totalMinutes') ?? 0),
          requiresServiceGroup: Boolean(
            readValue(item, 'requires_service_group', 'requiresServiceGroup') ?? false,
          ),
          items: Array.isArray(item.items)
            ? item.items.map((subEntry) => {
                const subItem = asRecord(subEntry);
                return {
                  type2: String(subItem.type2 ?? ''),
                  minutes: Number(subItem.minutes ?? 0),
                  requiresServiceGroup: Boolean(
                    readValue(subItem, 'requires_service_group', 'requiresServiceGroup') ?? false,
                  ),
                };
              })
            : [],
        } satisfies ResourceMonthReportTypeRow;
      })
    : [];

  const serviceSummaryRows = Array.isArray(serviceSummaryRowsRaw)
    ? serviceSummaryRowsRaw.map((entry) => {
        const item = asRecord(entry);
        return {
          costGroup: String(readValue(item, 'cost_group', 'costGroup') ?? ''),
          group: String(item.group ?? ''),
          totalMinutes: Number(readValue(item, 'total_minutes', 'totalMinutes') ?? 0),
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

  const serviceDetailRows = Array.isArray(serviceDetailRowsRaw)
    ? serviceDetailRowsRaw.map((entry) => {
        const item = asRecord(entry);
        return {
          costGroup: String(readValue(item, 'cost_group', 'costGroup') ?? ''),
          group: String(item.group ?? ''),
          totalMinutes: Number(readValue(item, 'total_minutes', 'totalMinutes') ?? 0),
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

  const memberTotals = Array.isArray(memberTotalsRaw)
    ? memberTotalsRaw.map((entry) => {
        const item = asRecord(entry);
        return {
          id: String(item.id ?? ''),
          accountId: String(readValue(item, 'account_id', 'accountId') ?? ''),
          totalMinutes: Number(readValue(item, 'total_minutes', 'totalMinutes') ?? 0),
        } satisfies ResourceMonthReportMemberTotal;
      })
    : [];

  return { typeRows, serviceSummaryRows, serviceDetailRows, memberTotals };
}
