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
      <div className="projects-feature__table-wrap">
        <table className="projects-feature__table">
          <caption className="sr-only">연도와 월 기준 서비스그룹 집계 표</caption>
          <thead>
            <tr>
              <th scope="col">월</th>
              <th scope="col">청구그룹</th>
              <th scope="col">서비스그룹</th>
              <th scope="col">서비스명</th>
              <th scope="col">MM</th>
            </tr>
          </thead>
          <tbody>
            <TableEmptyRow
              colSpan={5}
              className="projects-feature__empty-state"
              message="표시할 서비스그룹 집계가 없습니다."
            />
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <section className="resource-page__table-tabs-section">
      <div className="resource-page__table-tabs-scroller">
        <div className="resource-page__table-tabs" role="tablist" aria-label="서비스그룹 집계 연도">
          {years.map((year) => {
            const selected = year === activeYear;

            return (
              <button
                key={year}
                id={`resource-service-tab-${year}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={`resource-service-panel-${year}`}
                tabIndex={selected ? 0 : -1}
                className={[
                  'resource-page__table-tab',
                  selected ? 'resource-page__table-tab--active' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => onYearChange(year)}
              >
                {year}년
              </button>
            );
          })}
        </div>
      </div>

      {activeRow ? (
        <div
          id={`resource-service-panel-${activeRow.year}`}
          role="tabpanel"
          aria-labelledby={`resource-service-tab-${activeRow.year}`}
          className="resource-page__table-tab-panel"
        >
          <div className="projects-feature__table-wrap">
            <table className="projects-feature__table">
              <caption className="sr-only">{activeRow.year}년 월 기준 서비스그룹 집계 표</caption>
              <thead>
                <tr>
                  <th scope="col">월</th>
                  <th scope="col">청구그룹</th>
                  <th scope="col">서비스그룹</th>
                  <th scope="col">서비스명</th>
                  <th scope="col">MM</th>
                </tr>
              </thead>
              <tbody>
                <ResourceServiceYearRows row={activeRow} fold={fold} />
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </section>
  );
}
