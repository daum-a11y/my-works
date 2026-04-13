import type { ApiRecord } from '../../api/api.types';
import { type ProjectStatsRow } from '../../types/domain';

function readValue(record: ApiRecord, snakeKey: string, camelKey: string) {
  return record[snakeKey] ?? record[camelKey];
}

function formatMemberDisplay(accountId: string | null, name: string | null) {
  if (accountId && name) {
    return `${accountId}(${name})`;
  }
  return accountId || name;
}

export function toProjectStatsRow(record: ApiRecord): ProjectStatsRow {
  const reporterAccountId =
    readValue(record, 'reporter_account_id', 'reporterAccountId') == null
      ? null
      : String(readValue(record, 'reporter_account_id', 'reporterAccountId'));
  const reporterName =
    readValue(record, 'reporter_name', 'reporterName') == null
      ? null
      : String(readValue(record, 'reporter_name', 'reporterName'));
  const reviewerAccountId =
    readValue(record, 'reviewer_account_id', 'reviewerAccountId') == null
      ? null
      : String(readValue(record, 'reviewer_account_id', 'reviewerAccountId'));
  const reviewerName =
    readValue(record, 'reviewer_name', 'reviewerName') == null
      ? null
      : String(readValue(record, 'reviewer_name', 'reviewerName'));

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
    serviceName:
      readValue(record, 'service_name', 'serviceName') == null
        ? null
        : String(readValue(record, 'service_name', 'serviceName')),
    reportUrl:
      readValue(record, 'report_url', 'reportUrl') == null
        ? null
        : String(readValue(record, 'report_url', 'reportUrl')),
    reporterAccountId,
    reporterName,
    reporterDisplay: formatMemberDisplay(reporterAccountId, reporterName),
    reviewerAccountId,
    reviewerName,
    reviewerDisplay: formatMemberDisplay(reviewerAccountId, reviewerName),
    startDate: String(readValue(record, 'start_date', 'startDate') ?? ''),
    endDate: String(readValue(record, 'end_date', 'endDate') ?? ''),
    subtaskCount: Number(readValue(record, 'subtask_count', 'subtaskCount') ?? 0),
  };
}
