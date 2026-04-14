import { Tab, TabList, TabPanel, TabTrigger } from 'krds-react';
import { PageSection } from '../../components/shared';
import { TableEmptyRow } from '../../components/shared/TableEmptyRow';
import type { ResourceServiceYearSummary } from './ResourceServicePage.types';
import { ResourceServiceYearRows } from './ResourceServiceYearRows';

interface ResourceServiceTableSectionProps {
  years: readonly string[];
  activeYear: string;
  activeRow: ResourceServiceYearSummary | null;
  fold: boolean;
  onYearChange: (year: string) => void;
}

export function ResourceServiceTableSection({
  years,
  activeYear,
  activeRow,
  fold,
  onYearChange,
}: ResourceServiceTableSectionProps) {
  if (!years.length) {
    return (
      <PageSection title="서비스 그룹 집계" className="krds-page__table-tabs-section">
        <div className="krds-page__table-wrap krds-table-wrap">
          <table className="krds-page__table tbl data">
            <caption className="sr-only">연도와 월 기준 서비스 그룹 집계 표</caption>
            <thead>
              <tr>
                <th scope="col">월</th>
                <th scope="col">청구그룹</th>
                <th scope="col">서비스 그룹</th>
                <th scope="col">서비스명</th>
                <th scope="col">MM</th>
              </tr>
            </thead>
            <tbody>
              <TableEmptyRow colSpan={5} message="표시할 서비스 그룹 집계가 없습니다." />
            </tbody>
          </table>
        </div>
      </PageSection>
    );
  }

  return (
    <PageSection title="서비스 그룹 집계" className="krds-page__table-tabs-section">
      <Tab value={activeYear} onValueChange={onYearChange}>
        <div className="krds-page__table-tabs-scroller">
          <TabList aria-label="서비스 그룹 집계 연도">
            {years.map((year) => (
              <TabTrigger key={year} value={year}>
                {year}년
              </TabTrigger>
            ))}
          </TabList>
        </div>

        {activeRow ? (
          <TabPanel value={activeRow.year}>
            <div className="krds-page__table-wrap krds-table-wrap">
              <table className="krds-page__table tbl data">
                <caption className="sr-only">
                  {activeRow.year}년 월 기준 서비스 그룹 집계 표
                </caption>
                <thead>
                  <tr>
                    <th scope="col">월</th>
                    <th scope="col">청구그룹</th>
                    <th scope="col">서비스 그룹</th>
                    <th scope="col">서비스명</th>
                    <th scope="col">MM</th>
                  </tr>
                </thead>
                <tbody>
                  <ResourceServiceYearRows row={activeRow} fold={fold} />
                </tbody>
              </table>
            </div>
          </TabPanel>
        ) : null}
      </Tab>
    </PageSection>
  );
}
