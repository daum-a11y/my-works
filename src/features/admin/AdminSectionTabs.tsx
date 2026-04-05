import { Link } from 'react-router-dom';
import '../../styles/domain/pages/admin-page.scss';

export type AdminSectionTabKey =
  | 'summary'
  | 'task-types'
  | 'platforms'
  | 'cost-groups'
  | 'service-groups'
  | 'users';

const TABS: Array<{ key: AdminSectionTabKey; label: string; to: string }> = [
  { key: 'summary', label: '요약', to: '/org/search' },
  { key: 'task-types', label: '업무 타입', to: '/org/type' },
  { key: 'platforms', label: '플랫폼', to: '/org/platform' },
  { key: 'cost-groups', label: '청구 그룹', to: '/org/cost-group' },
  { key: 'service-groups', label: '서비스 그룹', to: '/org/group' },
  { key: 'users', label: '사용자', to: '/admin/members' },
];

export function AdminSectionTabs({ active }: { active: AdminSectionTabKey }) {
  return (
    <nav aria-label="관리자 섹션" className="adminPageScope tabList">
      {TABS.map((tab) => {
        const isActive = tab.key === active;

        return (
          <Link
            key={tab.key}
            to={tab.to}
            className={`tabLink ${isActive ? 'tabLinkActive' : ''}`.trim()}
            aria-current={isActive ? 'page' : undefined}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
