import { Tab, TabList, TabTrigger } from 'krds-react';
import type { AdminReportEditorTab } from './AdminReportEditorPage.types';

interface AdminReportEditorPanelHeaderProps {
  title: string;
  dateText: string;
  activeTab: AdminReportEditorTab;
  onTabChange: (tab: AdminReportEditorTab) => void;
}

export function AdminReportEditorPanelHeader({
  title,
  dateText,
  activeTab,
  onTabChange,
}: AdminReportEditorPanelHeaderProps) {
  return (
    <div className={'panel-head'}>
      <div>
        <h2 className={'panel-title'}>{title}</h2>
        <p className={'date-text'}>{dateText}</p>
      </div>
      <Tab value={activeTab} onValueChange={(value) => onTabChange(value as AdminReportEditorTab)}>
        <TabList aria-label="업무보고 입력 탭">
          <TabTrigger value="report">기본 입력</TabTrigger>
          <TabTrigger value="period">TYPE 입력</TabTrigger>
        </TabList>
      </Tab>
    </div>
  );
}
