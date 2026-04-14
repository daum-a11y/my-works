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
  MONITORING_STATS_DEFAULT_SUMMARY_VIEW,
  TASK_MONITORING_DEFAULT_SORT,
  TASK_MONITORING_PAGE_TITLE,
} from './ProjectStatsPage.constants';
import { toMonitoringStatsRow } from './statsApiTransform';
import { TaskMonitoringFilterForm } from './TaskMonitoringFilterForm';
import type {
  StatsSummaryView,
  TaskMonitoringMonthlyRow,
  TaskMonitoringSortState,
} from './ProjectStatsPage.types';
import { buildMonthRange, monthKeyFromTaskMonth } from './ProjectStatsPage.utils';
import { TaskMonitoringResultsTable } from './TaskMonitoringResultsTable';
import { TaskMonitoringSummarySection } from './TaskMonitoringSummarySection';
import './StatsPage.css';

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
  const [summaryView, setSummaryView] = useState<StatsSummaryView>(
    MONITORING_STATS_DEFAULT_SUMMARY_VIEW,
  );
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
  const monthlyRows = useMemo<TaskMonitoringMonthlyRow[]>(() => {
    if (!rows.length) {
      return [];
    }

    const grouped = new Map<
      string,
      TaskMonitoringMonthlyRow['statusCounts'] & { __total: number }
    >();
    const monthKeys = rows.map((row) => monthKeyFromTaskMonth(row.taskDate)).filter(Boolean);

    for (const row of rows) {
      const monthKey = monthKeyFromTaskMonth(row.taskDate);
      if (!monthKey) {
        continue;
      }

      const current = grouped.get(monthKey) ?? {
        미수정: 0,
        '일부 수정': 0,
        '전체 수정': 0,
        __total: 0,
      };
      current[row.taskStatus] += 1;
      current.__total += 1;
      grouped.set(monthKey, current);
    }

    return buildMonthRange(monthKeys).map((monthKey) => {
      const current = grouped.get(monthKey) ?? {
        미수정: 0,
        '일부 수정': 0,
        '전체 수정': 0,
        __total: 0,
      };

      return {
        monthKey,
        label: monthKey.replace('-', '/'),
        totalCount: current.__total,
        statusCounts: {
          미수정: current.미수정,
          '일부 수정': current['일부 수정'],
          '전체 수정': current['전체 수정'],
        },
      };
    });
  }, [rows]);

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

      <PageSection title="월별 태스크 현황">
        <TaskMonitoringSummarySection
          summaryView={summaryView}
          monthlyRows={monthlyRows}
          onSummaryViewChange={setSummaryView}
        />
      </PageSection>

      <PageSection title="태스크 목록">
        <TaskMonitoringResultsTable rows={rows} sortState={sortState} onSortChange={setSortState} />
      </PageSection>
    </div>
  );
}
