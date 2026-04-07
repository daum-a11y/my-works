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
    <div className={'reports-page__panel-head'}>
      <div>
        <h2 className={'reports-page__panel-title'}>{title}</h2>
        <p className={'reports-page__date-text'}>{dateText}</p>
      </div>
      <div className={'reports-page__tab-row'}>
        <button
          type="button"
          className={[
            'reports-page__tab-button',
            activeTab === 'report' ? 'reports-page__tab-button--active' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          onClick={() => onTabChange('report')}
        >
          기본 입력
        </button>
        <button
          type="button"
          className={[
            'reports-page__tab-button',
            activeTab === 'period' ? 'reports-page__tab-button--active' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          onClick={() => onTabChange('period')}
        >
          TYPE 입력
        </button>
      </div>
    </div>
  );
}
