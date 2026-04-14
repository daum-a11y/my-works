import clsx from 'clsx';
import { Link } from 'react-router-dom';
import { ADMIN_SECTION_TABS } from './AdminSectionTabs.constants';
import type { AdminSectionTabsProps } from './AdminSectionTabs.types';

export function AdminSectionTabs({ active }: AdminSectionTabsProps) {
  return (
    <nav aria-label="관리자 섹션" className="admin-page__tab-list">
      {ADMIN_SECTION_TABS.map((tab) => {
        const isActive = tab.key === active;

        return (
          <Link
            key={tab.key}
            to={tab.to}
            className={clsx('admin-page__tab-link', isActive && 'admin-page__tab-link--active')}
            aria-current={isActive ? 'page' : undefined}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
