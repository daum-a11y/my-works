export const ADMIN_SECTION_TAB_KEYS = [
  'summary',
  'task-types',
  'platforms',
  'cost-groups',
  'service-groups',
  'users',
] as const;

export type AdminSectionTabKey = (typeof ADMIN_SECTION_TAB_KEYS)[number];

export interface AdminSectionTabItem {
  key: AdminSectionTabKey;
  label: string;
  to: string;
}

export interface AdminSectionTabsProps {
  active: AdminSectionTabKey;
}
