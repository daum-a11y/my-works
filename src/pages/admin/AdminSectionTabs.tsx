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
  { key: 'task-types', label: '업무 타입', to: '/admin/type' },
  { key: 'platforms', label: '플랫폼', to: '/admin/platform' },
  { key: 'cost-groups', label: '청구 그룹', to: '/admin/cost-group' },
  { key: 'service-groups', label: '서비스 그룹', to: '/admin/group' },
  { key: 'users', label: '사용자', to: '/admin/members' },
];

export function AdminSectionTabs({ active }: { active: AdminSectionTabKey }) {
  return (
    <nav aria-label="관리자 섹션" className="admin-page__tab-list">
      {TABS.map((tab) => {
        const isActive = tab.key === active;

        return (
          <Link
            key={tab.key}
            to={tab.to}
            className={['admin-page__tab-link', isActive ? 'admin-page__tab-link--active' : '']
              .filter(Boolean)
              .join(' ')}
            aria-current={isActive ? 'page' : undefined}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
