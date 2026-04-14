import { Tab, TabList, TabPanel, TabTrigger } from 'krds-react';
import { TableEmptyRow } from '../../components/shared/TableEmptyRow';
import type { ResourceTypeYearSummary } from './ResourceTypePage.types';
import { ResourceTypeYearRows } from './ResourceTypeYearRows';

interface ResourceTypeTableSectionProps {
  years: readonly string[];
  activeYear: string;
  activeRow: ResourceTypeYearSummary | null;
  fold: boolean;
  onYearChange: (year: string) => void;
}

export function ResourceTypeTableSection({
  years,
  activeYear,
  activeRow,
  fold,
  onYearChange,
}: ResourceTypeTableSectionProps) {
  if (!years.length) {
    return (
      <div className="krds-page__table-wrap krds-table-wrap">
        <table className="krds-page__table tbl data">
          <caption className="sr-only">연도와 월 기준 업무 타입 집계 표</caption>
          <thead>
            <tr>
              <th scope="col">월</th>
              <th scope="col">타입1</th>
              <th scope="col">타입2</th>
              <th scope="col">MM</th>
            </tr>
          </thead>
          <tbody>
            <TableEmptyRow colSpan={4} message="표시할 타입별 집계가 없습니다." />
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <section className="krds-page__table-tabs-section">
      <Tab value={activeYear} onValueChange={onYearChange}>
        <div className="krds-page__table-tabs-scroller">
          <TabList aria-label="업무 타입 집계 연도">
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
                <caption className="sr-only">{activeRow.year}년 월 기준 업무 타입 집계 표</caption>
                <thead>
                  <tr>
                    <th scope="col">월</th>
                    <th scope="col">타입1</th>
                    <th scope="col">타입2</th>
                    <th scope="col">MM</th>
                  </tr>
                </thead>
                <tbody>
                  <ResourceTypeYearRows row={activeRow} fold={fold} />
                </tbody>
              </table>
            </div>
          </TabPanel>
        ) : null}
      </Tab>
    </section>
  );
}
