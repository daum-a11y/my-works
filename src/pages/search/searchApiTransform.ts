import type { ApiRecord, RawPagedResult } from '../../api/api.types';
import type { PagedResult, SearchTaskRow } from '../../types/domain';
import { getToday } from '../../utils';

export function toSearchTaskRow(record: ApiRecord): SearchTaskRow {
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
