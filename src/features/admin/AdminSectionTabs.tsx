import { Link } from 'react-router-dom';
import styles from './AdminPage.module.css';

export type AdminSectionTabKey = 'summary' | 'task-types' | 'service-groups' | 'users';

const TABS: Array<{ key: AdminSectionTabKey; label: string; to: string }> = [
  { key: 'summary', label: '요약', to: '/org/search' },
  { key: 'task-types', label: '업무 타입', to: '/org/type' },
  { key: 'service-groups', label: '서비스 그룹', to: '/org/group' },
  { key: 'users', label: '사용자', to: '/admin/members' },
];

export function AdminSectionTabs({ active }: { active: AdminSectionTabKey }) {
  return (
    <nav aria-label="관리자 섹션" className={styles.tabList}>
      {TABS.map((tab) => {
        const isActive = tab.key === active;

        return (
          <Link
            key={tab.key}
            to={tab.to}
            className={`${styles.tabLink} ${isActive ? styles.tabLinkActive : ''}`.trim()}
            aria-current={isActive ? 'page' : undefined}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
