import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from 'krds-react';
import { setDocumentTitle } from '../../router/navigation';
import { PageHeader } from '../../components/shared/PageHeader';
import { dataClient } from '../../api/client';
import { RESOURCE_TYPE_PAGE_TITLE } from './ResourceTypePage.constants';
import { buildResourceTypeYearRows } from './ResourceTypePage.summary';
import { ResourceTypeTableSection } from './ResourceTypeTableSection';
import { useAuth } from '../../auth/AuthContext';
import { toResourceTypeSummaryRow } from './resourceApiTransform';

export function ResourceTypePage() {
  const { session } = useAuth();
  const member = session?.member ?? null;
  const [activeYear, setActiveYear] = useState('');
  const yearsQuery = useQuery({
    queryKey: ['resource', 'type-summary-years', member?.id],
    queryFn: () => dataClient.getResourceTypeSummaryYears(member!),
    enabled: Boolean(member),
  });
  const detailQuery = useQuery({
    queryKey: ['resource', 'type-summary', member?.id, activeYear],
    queryFn: () => dataClient.getResourceTypeSummaryByYear(member!, activeYear),
    enabled: Boolean(member && activeYear),
  });
  const years = useMemo(() => yearsQuery.data ?? [], [yearsQuery.data]);
  const rowsData = useMemo(
    () => (detailQuery.data ?? []).map(toResourceTypeSummaryRow),
    [detailQuery.data],
  );
  const [fold, setFold] = useState(false);

  useEffect(() => {
    setDocumentTitle(RESOURCE_TYPE_PAGE_TITLE);
  }, []);

  const rows = useMemo(() => buildResourceTypeYearRows(rowsData), [rowsData]);

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
    <section className="projects-feature resource-page page-shell">
      <PageHeader
        title={RESOURCE_TYPE_PAGE_TITLE}
        actions={
          <div className="resource-page__year-actions">
            <Button
              type="button"
              onClick={() => setFold((current) => !current)}
              aria-pressed={fold}
              disabled={!rows.length}
              variant="secondary"
            >
              {fold ? '펼치기' : '접기'}
            </Button>
          </div>
        }
      />

      <ResourceTypeTableSection
        years={years}
        activeYear={activeYear}
        activeRow={activeRow}
        fold={fold}
        onYearChange={setActiveYear}
      />
    </section>
  );
}
