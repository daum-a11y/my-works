import { Tab, TabList, TabTrigger } from 'krds-react';
import { useNavigate } from 'react-router-dom';
import { ADMIN_SECTION_TABS } from './AdminSectionTabs.constants';
import type { AdminSectionTabsProps } from './AdminSectionTabs.types';

export function AdminSectionTabs({ active }: AdminSectionTabsProps) {
  const navigate = useNavigate();

  return (
    <Tab
      value={active}
      variant="line"
      size="full"
      onValueChange={(nextValue) => {
        const nextTab = ADMIN_SECTION_TABS.find((tab) => tab.key === nextValue);
        if (nextTab) {
          navigate(nextTab.to);
        }
      }}
    >
      <TabList aria-label="관리자 섹션">
        {ADMIN_SECTION_TABS.map((tab) => (
          <TabTrigger key={tab.key} value={tab.key}>
            {tab.label}
          </TabTrigger>
        ))}
      </TabList>
    </Tab>
  );
}
