import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { setDocumentTitle } from '../../router/navigation';
import { PageHeader } from '../../components/shared/PageHeader';
import { TableEmptyRow } from '../../components/shared/TableEmptyRow';
import { dataClient } from '../../api/client';
import { RESOURCE_SERVICE_PAGE_TITLE } from './ResourceServicePage.constants';
import { buildResourceServiceYearRows } from './ResourceServicePage.utils';
import { ResourceServiceYearRows } from './ResourceServiceYearRows';
import '../../styles/domain/pages/projects-feature.scss';
import '../../styles/domain/pages/resource-page.scss';
import { useAuth } from '../../auth/AuthContext';

export function ResourceServicePage() {
  const { session } = useAuth();
  const member = session?.member ?? null;
  const [activeYear, setActiveYear] = useState('');
  const yearsQuery = useQuery({
    queryKey: ['resource', 'service-summary-years', member?.id],
    queryFn: () => dataClient.getResourceServiceSummaryYears(member!),
    enabled: Boolean(member),
  });
  const detailQuery = useQuery({
    queryKey: ['resource', 'service-summary', member?.id, activeYear],
    queryFn: () => dataClient.getResourceServiceSummaryByYear(member!, activeYear),
    enabled: Boolean(member && activeYear),
  });
  const years = useMemo(() => yearsQuery.data ?? [], [yearsQuery.data]);
  const rowsData = useMemo(() => detailQuery.data ?? [], [detailQuery.data]);
  const [fold, setFold] = useState(false);

  useEffect(() => {
    setDocumentTitle(RESOURCE_SERVICE_PAGE_TITLE);
  }, []);

  const rows = useMemo(() => buildResourceServiceYearRows(rowsData), [rowsData]);

  useEffect(() => {
    if (!years.length) {
      setActiveYear('');
      return;
    }

    if (!years.includes(activeYear)) {
      setActiveYear(years[0]);
    }
  }, [activeYear, years]);

  const activeRow = rows[0] ?? null;

  return (
    <section className="projects-feature projects-feature--shell resource-page resource-page--page">
      <PageHeader
        title={RESOURCE_SERVICE_PAGE_TITLE}
        actions={
          <button
            type="button"
            className="projects-feature__header-action"
            onClick={() => setFold((current) => !current)}
            aria-pressed={fold}
            disabled={!rows.length}
          >
            {fold ? '펼치기' : '접기'}
          </button>
        }
      />

      {years.length ? (
        <section className="resource-page__table-tabs-section">
          <div className="resource-page__table-tabs-scroller">
            <div
              className="resource-page__table-tabs"
              role="tablist"
              aria-label="서비스그룹 집계 연도"
            >
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
                    onClick={() => setActiveYear(year)}
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
                  <caption className="sr-only">
                    {activeRow.year}년 월 기준 서비스그룹 집계 표
                  </caption>
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
      ) : (
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
      )}
    </section>
  );
}
