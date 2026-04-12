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
      <div className="projects-feature__table-wrap">
        <table className="projects-feature__table">
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
    <section className="resource-page__table-tabs-section">
      <div className="resource-page__table-tabs-scroller">
        <div className="resource-page__table-tabs" role="tablist" aria-label="업무 타입 집계 연도">
          {years.map((year) => {
            const selected = year === activeYear;

            return (
              <button
                key={year}
                id={`resource-type-tab-${year}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={`resource-type-panel-${year}`}
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
          id={`resource-type-panel-${activeRow.year}`}
          role="tabpanel"
          aria-labelledby={`resource-type-tab-${activeRow.year}`}
          className="resource-page__table-tab-panel"
        >
          <div className="projects-feature__table-wrap">
            <table className="projects-feature__table">
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
        </div>
      ) : null}
    </section>
  );
}
