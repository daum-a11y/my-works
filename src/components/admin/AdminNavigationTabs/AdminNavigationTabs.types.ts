export const ADMIN_NAVIGATION_TAB_KEYS = [
  'summary',
  'task-types',
  'platforms',
  'cost-groups',
  'service-groups',
  'users',
] as const;

export type AdminNavigationTabKey = (typeof ADMIN_NAVIGATION_TAB_KEYS)[number];

export interface AdminNavigationTabItem {
  key: AdminNavigationTabKey;
  label: string;
  to: string;
}

export interface AdminNavigationTabsProps {
  active: AdminNavigationTabKey;
}
