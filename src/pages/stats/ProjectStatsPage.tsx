import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '../../components/shared/PageHeader';
import { PageSection } from '../../components/shared/PageSection';
import { dataClient } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { setDocumentTitle } from '../../router/navigation';
import { type ProjectStatsRow } from '../../types/domain';
import { getCurrentMonth, shiftMonth } from '../resource/resourceUtils';
import { toTaskType } from '../projects/projectApiTransform';
import { buildProjectTypeOptions } from '../../utils/taskType';
import {
  MONITORING_STATS_DEFAULT_SORT,
  MONITORING_STATS_DEFAULT_SUMMARY_VIEW,
  PROJECT_STATS_PAGE_TITLE,
} from './ProjectStatsPage.constants';
import { ProjectStatsDetailsTable } from './ProjectStatsDetailsTable';
import { ProjectStatsFilterForm } from './ProjectStatsFilterForm';
import { ProjectStatsSummarySection } from './ProjectStatsSummarySection';
import type {
  ProjectStatsMonthlyRow,
  ProjectStatsSortState,
  StatsSummaryView,
} from './ProjectStatsPage.types';
import { buildMonthRange, monthKeyFromDate } from './ProjectStatsPage.utils';
import { toProjectStatsRow } from './statsApiTransform';
import './StatsPage.css';

const ALL_TASK_TYPE1 = '전체';

export function ProjectStatsPage() {
  const { session } = useAuth();
  const member = session?.member;
  const defaultEndMonth = getCurrentMonth();
  const defaultStartMonth = shiftMonth(defaultEndMonth, -5);
  const [draftStartMonth, setDraftStartMonth] = useState(defaultStartMonth);
  const [draftEndMonth, setDraftEndMonth] = useState(defaultEndMonth);
  const [startMonth, setStartMonth] = useState(defaultStartMonth);
  const [endMonth, setEndMonth] = useState(defaultEndMonth);
  const [draftTaskType1, setDraftTaskType1] = useState('');
  const [taskType1, setTaskType1] = useState('');
  const [summaryView, setSummaryView] = useState<StatsSummaryView>(
    MONITORING_STATS_DEFAULT_SUMMARY_VIEW,
  );
  const [sortState, setSortState] = useState<ProjectStatsSortState>(MONITORING_STATS_DEFAULT_SORT);

  const taskTypesQuery = useQuery({
    queryKey: ['task-types', member?.id],
    queryFn: async () => dataClient.getTaskTypes(),
    enabled: Boolean(member),
  });
  const taskType1Options = useMemo(
    () => buildProjectTypeOptions((taskTypesQuery.data ?? []).map(toTaskType), draftTaskType1),
    [draftTaskType1, taskTypesQuery.data],
  );
  const defaultTaskType1 = taskType1Options[0] ?? ALL_TASK_TYPE1;
  const queryTaskType1 = taskType1 === ALL_TASK_TYPE1 ? null : taskType1;
  const summaryType1Keys = useMemo(
    () => taskType1Options.filter((option) => option && option !== ALL_TASK_TYPE1),
    [taskType1Options],
  );

  const projectStatsQuery = useQuery({
    queryKey: [
      'project-stats',
      member?.id,
      startMonth,
      endMonth,
      queryTaskType1 ?? ALL_TASK_TYPE1,
      sortState.key,
      sortState.direction,
    ],
    queryFn: async () =>
      dataClient.getProjectStatsRows({
        startMonth,
        endMonth,
        taskType1: queryTaskType1,
        sortKey: sortState.key,
        sortDirection: sortState.direction,
      }),
    enabled: Boolean(member && startMonth && endMonth && taskType1),
  });

  const projectRows = useMemo<ProjectStatsRow[]>(
    () => (projectStatsQuery.data ?? []).map(toProjectStatsRow),
    [projectStatsQuery.data],
  );
  const monthlyRows = useMemo<ProjectStatsMonthlyRow[]>(() => {
    if (!projectRows.length) {
      return [];
    }

    const grouped = new Map<
      string,
      { totalProjectCount: number; projectCountByType1: Record<string, number> }
    >();
    const monthKeys = projectRows.map((row) => monthKeyFromDate(row.endDate)).filter(Boolean);

    for (const row of projectRows) {
      const monthKey = monthKeyFromDate(row.endDate);
      if (!monthKey) {
        continue;
      }
      const current = grouped.get(monthKey) ?? {
        totalProjectCount: 0,
        projectCountByType1: Object.fromEntries(summaryType1Keys.map((type1) => [type1, 0])),
      };
      current.totalProjectCount += 1;
      if (row.type1 && summaryType1Keys.includes(row.type1)) {
        current.projectCountByType1[row.type1] = (current.projectCountByType1[row.type1] ?? 0) + 1;
      }
      grouped.set(monthKey, current);
    }

    return buildMonthRange(monthKeys).map((monthKey) => {
      const current = grouped.get(monthKey);
      return {
        monthKey,
        label: monthKey.replace('-', '/'),
        totalProjectCount: current?.totalProjectCount ?? 0,
        projectCountByType1:
          current?.projectCountByType1 ??
          Object.fromEntries(summaryType1Keys.map((type1) => [type1, 0])),
      };
    });
  }, [projectRows, summaryType1Keys]);

  useEffect(() => {
    setDocumentTitle(PROJECT_STATS_PAGE_TITLE);
  }, []);

  useEffect(() => {
    if (!defaultTaskType1) {
      return;
    }

    setDraftTaskType1((current) =>
      current && taskType1Options.includes(current) ? current : defaultTaskType1,
    );
    setTaskType1((current) =>
      current && taskType1Options.includes(current) ? current : defaultTaskType1,
    );
  }, [defaultTaskType1, taskType1Options]);

  const handleSearch = () => {
    const nextStart =
      draftStartMonth && draftEndMonth && draftStartMonth > draftEndMonth
        ? draftEndMonth
        : draftStartMonth;
    const nextEnd =
      draftStartMonth && draftEndMonth && draftStartMonth > draftEndMonth
        ? draftStartMonth
        : draftEndMonth;
    setStartMonth(nextStart);
    setEndMonth(nextEnd);
    setDraftStartMonth(nextStart);
    setDraftEndMonth(nextEnd);
    setTaskType1(draftTaskType1);
  };

  const handleReset = () => {
    setDraftStartMonth(defaultStartMonth);
    setDraftEndMonth(defaultEndMonth);
    setStartMonth(defaultStartMonth);
    setEndMonth(defaultEndMonth);
    setDraftTaskType1(defaultTaskType1);
    setTaskType1(defaultTaskType1);
  };

  return (
    <div className={'stats-page stats-page--page'}>
      <PageHeader title={PROJECT_STATS_PAGE_TITLE} />

      <PageSection title="필터">
        <ProjectStatsFilterForm
          draftStartMonth={draftStartMonth}
          draftEndMonth={draftEndMonth}
          draftTaskType1={draftTaskType1}
          taskType1Options={taskType1Options}
          onSubmit={(event) => {
            event.preventDefault();
            handleSearch();
          }}
          onReset={handleReset}
          onDraftStartMonthChange={setDraftStartMonth}
          onDraftEndMonthChange={setDraftEndMonth}
          onDraftTaskType1Change={setDraftTaskType1}
        />
      </PageSection>

      <PageSection title="월별 프로젝트 현황">
        <ProjectStatsSummarySection
          summaryView={summaryView}
          monthlyRows={monthlyRows}
          selectedTaskType1={taskType1}
          summaryType1Keys={summaryType1Keys}
          onSummaryViewChange={setSummaryView}
        />
      </PageSection>

      <PageSection title="프로젝트 목록">
        <ProjectStatsDetailsTable
          rows={projectRows}
          sortState={sortState}
          onSortChange={setSortState}
        />
      </PageSection>
    </div>
  );
}
