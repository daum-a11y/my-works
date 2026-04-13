import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dataClient } from '../../api/client';
import { PageHeader } from '../../components/shared/PageHeader';
import { PageSection } from '../../components/shared/PageSection';
import { useAuth } from '../../auth/AuthContext';
import { setDocumentTitle } from '../../router/navigation';
import type { MonitoringStatsRow } from '../../types/domain';
import { getCurrentMonth, shiftMonth } from '../resource/resourceUtils';
import {
  TASK_MONITORING_DEFAULT_SORT,
  TASK_MONITORING_PAGE_TITLE,
} from './ProjectStatsPage.constants';
import { toMonitoringStatsRow } from './statsApiTransform';
import { TaskMonitoringFilterForm } from './TaskMonitoringFilterForm';
import type { TaskMonitoringSortState } from './ProjectStatsPage.types';
import { TaskMonitoringResultsTable } from './TaskMonitoringResultsTable';
import '../../styles/pages/StatsPage.scss';

export function TaskMonitoringPage() {
  const { session } = useAuth();
  const member = session?.member;
  const defaultEndMonth = getCurrentMonth();
  const defaultStartMonth = shiftMonth(defaultEndMonth, -5);
  const [draftStartMonth, setDraftStartMonth] = useState(defaultStartMonth);
  const [draftEndMonth, setDraftEndMonth] = useState(defaultEndMonth);
  const [startMonth, setStartMonth] = useState(defaultStartMonth);
  const [endMonth, setEndMonth] = useState(defaultEndMonth);
  const [draftQuery, setDraftQuery] = useState('');
  const [query, setQuery] = useState('');
  const [sortState, setSortState] = useState<TaskMonitoringSortState>(TASK_MONITORING_DEFAULT_SORT);

  const monitoringStatsQuery = useQuery({
    queryKey: [
      'monitoring-stats',
      member?.id,
      startMonth,
      endMonth,
      query,
      sortState.key,
      sortState.direction,
    ],
    queryFn: async () =>
      dataClient.getMonitoringStatsRows({
        startMonth,
        endMonth,
        query: query || null,
        sortKey: sortState.key,
        sortDirection: sortState.direction,
      }),
    enabled: Boolean(member && startMonth && endMonth),
  });

  const rows = useMemo<MonitoringStatsRow[]>(
    () => (monitoringStatsQuery.data ?? []).map(toMonitoringStatsRow),
    [monitoringStatsQuery.data],
  );

  useEffect(() => {
    setDocumentTitle(TASK_MONITORING_PAGE_TITLE);
  }, []);

  const handleSearch = () => {
    const nextStart =
      draftStartMonth && draftEndMonth && draftStartMonth > draftEndMonth
        ? draftEndMonth
        : draftStartMonth;
    const nextEnd =
      draftStartMonth && draftEndMonth && draftStartMonth > draftEndMonth
        ? draftStartMonth
        : draftEndMonth;

    setDraftStartMonth(nextStart);
    setDraftEndMonth(nextEnd);
    setStartMonth(nextStart);
    setEndMonth(nextEnd);
    setQuery(draftQuery.trim());
  };

  const handleReset = () => {
    setDraftStartMonth(defaultStartMonth);
    setDraftEndMonth(defaultEndMonth);
    setStartMonth(defaultStartMonth);
    setEndMonth(defaultEndMonth);
    setDraftQuery('');
    setQuery('');
    setSortState(TASK_MONITORING_DEFAULT_SORT);
  };

  return (
    <div className="stats-page stats-page--page">
      <PageHeader title={TASK_MONITORING_PAGE_TITLE} />

      <PageSection title="필터">
        <TaskMonitoringFilterForm
          draftStartMonth={draftStartMonth}
          draftEndMonth={draftEndMonth}
          draftQuery={draftQuery}
          onSubmit={(event) => {
            event.preventDefault();
            handleSearch();
          }}
          onReset={handleReset}
          onDraftStartMonthChange={setDraftStartMonth}
          onDraftEndMonthChange={setDraftEndMonth}
          onDraftQueryChange={setDraftQuery}
        />
      </PageSection>

      <PageSection title="태스크 현황">
        <TaskMonitoringResultsTable rows={rows} sortState={sortState} onSortChange={setSortState} />
      </PageSection>
    </div>
  );
}
