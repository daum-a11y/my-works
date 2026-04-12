import type {
  ResourceMonthReportNonServiceSummaryRow,
  ResourceMonthReportServiceDetailRow,
  ResourceMonthReportServiceSummaryRow,
  ResourceMonthReportTypeRow,
} from '../../types/domain';
import type { ResourceMonthTableTab } from './ResourceMonthPage.types';
import {
  ResourceMonthReportTable,
  ResourceMonthServiceTable,
  ResourceMonthTypeTable,
} from './ResourceMonthPage.tables';

interface ResourceMonthTableSectionProps {
  hasTableData: boolean;
  activeTableTab: ResourceMonthTableTab;
  onTableTabChange: (tab: ResourceMonthTableTab) => void;
  workFold: boolean;
  svcFold: boolean;
  onWorkFoldToggle: () => void;
  onSvcFoldToggle: () => void;
  typeRows: ResourceMonthReportTypeRow[];
  serviceSummaryRows: ResourceMonthReportServiceSummaryRow[];
  nonServiceSummaryRows: ResourceMonthReportNonServiceSummaryRow[];
  serviceDetailRows: ResourceMonthReportServiceDetailRow[];
  totalMinutes: number;
  adjustedTotalMinutes: number;
  projectMinutes: number;
  workingDays: number;
}

export function ResourceMonthTableSection({
  hasTableData,
  activeTableTab,
  onTableTabChange,
  workFold,
  svcFold,
  onWorkFoldToggle,
  onSvcFoldToggle,
  typeRows,
  serviceSummaryRows,
  nonServiceSummaryRows,
  serviceDetailRows,
  totalMinutes,
  adjustedTotalMinutes,
  projectMinutes,
  workingDays,
}: ResourceMonthTableSectionProps) {
  if (!hasTableData) {
    return (
      <section className="resource-page__table-tabs-section">
        <div className="dashboard-page__table-wrap">
          <div className="projects-feature__empty-state">데이터가 없습니다.</div>
        </div>
      </section>
    );
  }

  return (
    <section className="resource-page__table-tabs-section">
      <div className="resource-page__table-tabs" role="tablist" aria-label="월간 리포트 표 보기">
        <button
          type="button"
          className={[
            'resource-page__table-tab',
            activeTableTab === 'report' ? 'resource-page__table-tab--active' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          aria-pressed={activeTableTab === 'report'}
          onClick={() => onTableTabChange('report')}
        >
          월간 보고서
        </button>
        <button
          type="button"
          className={[
            'resource-page__table-tab',
            activeTableTab === 'service' ? 'resource-page__table-tab--active' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          aria-pressed={activeTableTab === 'service'}
          onClick={() => onTableTabChange('service')}
        >
          서비스 그룹별 합계
        </button>
        <button
          type="button"
          className={[
            'resource-page__table-tab',
            activeTableTab === 'type' ? 'resource-page__table-tab--active' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          aria-pressed={activeTableTab === 'type'}
          onClick={() => onTableTabChange('type')}
        >
          업무타입별 합계
        </button>
      </div>

      {activeTableTab === 'type' ? (
        <section className="resource-page__table-tab-panel">
          <div className="resource-page__table-tab-actions">
            <button
              type="button"
              className="projects-feature__header-action"
              onClick={onWorkFoldToggle}
              disabled={!typeRows.length}
            >
              {workFold ? '상세' : '요약'}
            </button>
          </div>
          <ResourceMonthTypeTable
            typeRows={typeRows}
            totalMinutes={totalMinutes}
            workingDays={workingDays}
            workFold={workFold}
          />
        </section>
      ) : null}

      {activeTableTab === 'service' ? (
        <section className="resource-page__table-tab-panel">
          <div className="resource-page__table-tab-actions">
            <button
              type="button"
              className="projects-feature__header-action"
              onClick={onSvcFoldToggle}
              disabled={!serviceDetailRows.length}
            >
              {svcFold ? '상세' : '요약'}
            </button>
          </div>
          <ResourceMonthServiceTable
            serviceDetailRows={serviceDetailRows}
            projectMinutes={projectMinutes}
            workingDays={workingDays}
            svcFold={svcFold}
          />
        </section>
      ) : null}

      {activeTableTab === 'report' ? (
        <section className="resource-page__table-tab-panel">
          <ResourceMonthReportTable
            serviceSummaryRows={serviceSummaryRows}
            nonServiceSummaryRows={nonServiceSummaryRows}
            adjustedTotalMinutes={adjustedTotalMinutes}
            workingDays={workingDays}
          />
        </section>
      ) : null}
    </section>
  );
}
