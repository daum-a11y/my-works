export type ApiRecord = Record<string, unknown>;

export interface RawPagedResult<T = ApiRecord> {
  items: T[];
  totalCount: number;
}
