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
    platform: record.platform == null ? null : String(record.platform),
    serviceGroupName: record.service_group_name == null ? null : String(record.service_group_name),
    serviceName: record.service_name == null ? null : String(record.service_name),
    projectDisplayName:
      record.project_display_name == null ? null : String(record.project_display_name),
    pageDisplayName: record.page_display_name == null ? null : String(record.page_display_name),
    pageUrl: record.page_url == null ? null : String(record.page_url),
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
