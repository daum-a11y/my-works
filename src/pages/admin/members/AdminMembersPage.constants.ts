export const ADMIN_MEMBERS_PAGE_TITLE = '사용자 관리';

export const ADMIN_MEMBERS_PAGE_SIZE_OPTIONS = [25, 50, 100] as const;

export const ADMIN_MEMBERS_DEFAULT_PAGE_SIZE = 50;

export const ADMIN_MEMBERS_DEFAULT_SORT = {
  key: 'accountId',
  direction: 'asc',
} as const;
