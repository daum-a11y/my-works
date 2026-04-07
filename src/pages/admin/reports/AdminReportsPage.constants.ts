import type { SortState } from './AdminReportsPage.types';

export const ADMIN_REPORTS_PAGE_TITLE = '업무보고 조회';

export const ADMIN_REPORTS_PAGE_SIZE_OPTIONS = [25, 50, 100] as const;

export const ADMIN_REPORTS_DEFAULT_PAGE_SIZE = 50;

export const ADMIN_REPORTS_DEFAULT_SORT: SortState = {
  key: 'taskDate',
  direction: 'desc',
};
