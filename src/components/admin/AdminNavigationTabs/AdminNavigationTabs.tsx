import { Tab, TabList, TabTrigger } from 'krds-react';
import { useNavigate } from 'react-router-dom';
import { ADMIN_NAVIGATION_TABS } from './AdminNavigationTabs.constants';
import type { AdminNavigationTabsProps } from './AdminNavigationTabs.types';

export function AdminNavigationTabs({ active }: AdminNavigationTabsProps) {
  const navigate = useNavigate();

  return (
    <Tab
      value={active}
      variant="line"
      size="full"
      onValueChange={(nextValue) => {
        const nextTab = ADMIN_NAVIGATION_TABS.find((tab) => tab.key === nextValue);
        if (nextTab) {
          navigate(nextTab.to);
        }
      }}
    >
      <TabList aria-label="관리자 섹션">
        {ADMIN_NAVIGATION_TABS.map((tab) => (
          <TabTrigger key={tab.key} value={tab.key}>
            {tab.label}
          </TabTrigger>
        ))}
      </TabList>
    </Tab>
  );
}
