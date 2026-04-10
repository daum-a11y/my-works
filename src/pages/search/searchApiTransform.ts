import type { ApiRecord, RawPagedResult } from '../../api/api.types';
import type { PagedResult, SearchTaskRow } from '../../types/domain';
import { getToday } from '../../utils';

function readValue(record: ApiRecord, snakeKey: string, camelKey: string) {
  return record[snakeKey] ?? record[camelKey];
}

export function toSearchTaskRow(record: ApiRecord): SearchTaskRow {
  return {
    id: String(record.id ?? ''),
    taskDate: String(readValue(record, 'task_date', 'taskDate') ?? getToday()),
    costGroupId: String(readValue(record, 'cost_group_id', 'costGroupId') ?? ''),
    costGroupName: String(readValue(record, 'cost_group_name', 'costGroupName') ?? ''),
    taskType1: String(readValue(record, 'task_type1', 'taskType1') ?? ''),
    taskType2: String(readValue(record, 'task_type2', 'taskType2') ?? ''),
    taskUsedtime: Number(readValue(record, 'task_usedtime', 'taskUsedtime') ?? 0),
    content: String(record.content ?? ''),
    note: String(record.note ?? ''),
    updatedAt: String(readValue(record, 'updated_at', 'updatedAt') ?? getToday()),
    platform: record.platform == null ? null : String(record.platform),
    serviceGroupName:
      readValue(record, 'service_group_name', 'serviceGroupName') == null
        ? null
        : String(readValue(record, 'service_group_name', 'serviceGroupName')),
    serviceName:
      readValue(record, 'service_name', 'serviceName') == null
        ? null
        : String(readValue(record, 'service_name', 'serviceName')),
    projectDisplayName:
      readValue(record, 'project_display_name', 'projectDisplayName') == null
        ? null
        : String(readValue(record, 'project_display_name', 'projectDisplayName')),
    pageDisplayName:
      readValue(record, 'page_display_name', 'pageDisplayName') == null
        ? null
        : String(readValue(record, 'page_display_name', 'pageDisplayName')),
    pageUrl:
      readValue(record, 'page_url', 'pageUrl') == null
        ? null
        : String(readValue(record, 'page_url', 'pageUrl')),
  };
}

export function toSearchTaskPage(result: RawPagedResult): PagedResult<SearchTaskRow> {
  const seen = new Set<string>();
  return {
    items: result.items.map(toSearchTaskRow).filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    }),
    totalCount: result.totalCount,
  };
}
