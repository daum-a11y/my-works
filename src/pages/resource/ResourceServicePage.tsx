import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from 'krds-react';
import { setDocumentTitle } from '../../router/navigation';
import { PageHeader } from '../../components/shared/PageHeader';
import { dataClient } from '../../api/client';
import { RESOURCE_SERVICE_PAGE_TITLE } from './ResourceServicePage.constants';
import { buildResourceServiceYearRows } from './ResourceServicePage.summary';
import { ResourceServiceTableSection } from './ResourceServiceTableSection';
import { useAuth } from '../../auth/AuthContext';
import { toResourceServiceSummaryRow } from './resourceApiTransform';

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
  const rowsData = useMemo(
    () => (detailQuery.data ?? []).map(toResourceServiceSummaryRow),
    [detailQuery.data],
  );
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
    <section className="krds-page">
      <PageHeader
        title={RESOURCE_SERVICE_PAGE_TITLE}
        actions={
          <div className="action-group">
            <Button
              size="medium"
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

      <ResourceServiceTableSection
        years={years}
        activeYear={activeYear}
        activeRow={activeRow}
        fold={fold}
        onYearChange={setActiveYear}
      />
    </section>
  );
}
