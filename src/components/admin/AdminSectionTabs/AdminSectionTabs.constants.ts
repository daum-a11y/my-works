import type { AdminSectionTabItem } from './AdminSectionTabs.types';

export const ADMIN_SECTION_TABS: ReadonlyArray<AdminSectionTabItem> = [
  { key: 'summary', label: '요약', to: '/org/search' },
  { key: 'task-types', label: '업무 타입', to: '/admin/type' },
  { key: 'platforms', label: '플랫폼', to: '/admin/platform' },
  { key: 'cost-groups', label: '청구 그룹', to: '/admin/cost-group' },
  { key: 'service-groups', label: '서비스 그룹', to: '/admin/group' },
  { key: 'users', label: '사용자', to: '/admin/members' },
];
