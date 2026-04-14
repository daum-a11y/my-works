import { Button, Tab, TabList, TabTrigger } from 'krds-react';
import type {
  ResourceMonthReportNonServiceSummaryRow,
  ResourceMonthReportServiceDetailRow,
  ResourceMonthReportServiceSummaryRow,
  ResourceMonthReportTypeRow,
} from '../../types/domain';
import { EmptyState } from '../../components/shared/EmptyState';
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
      <section className="krds-page__table-tabs-section">
        <div className="krds-page__table-wrap">
          <EmptyState message="표시할 월간 리소스 데이터가 없습니다." />
        </div>
      </section>
    );
  }

  return (
    <section className="krds-page__table-tabs-section">
      <Tab
        value={activeTableTab}
        onValueChange={(value) => onTableTabChange(value as ResourceMonthTableTab)}
      >
        <TabList aria-label="월간 리포트 표 보기">
          <TabTrigger value="report">월간 보고서</TabTrigger>
          <TabTrigger value="service">서비스 그룹별 합계</TabTrigger>
          <TabTrigger value="type">업무타입별 합계</TabTrigger>
        </TabList>
      </Tab>

      {activeTableTab === 'type' ? (
        <section className="krds-page__table-tab-panel">
          <div className="krds-page__table-tab-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={onWorkFoldToggle}
              disabled={!typeRows.length}
            >
              {workFold ? '상세' : '요약'}
            </Button>
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
        <section className="krds-page__table-tab-panel">
          <div className="krds-page__table-tab-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={onSvcFoldToggle}
              disabled={!serviceDetailRows.length}
            >
              {svcFold ? '상세' : '요약'}
            </Button>
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
        <section className="krds-page__table-tab-panel">
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
