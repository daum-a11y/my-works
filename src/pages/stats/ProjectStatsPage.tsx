import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '../../components/shared/PageHeader';
import { PageSection } from '../../components/shared/PageSection';
import { dataClient } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { setDocumentTitle } from '../../router/navigation';
import { type ProjectStatsRow, type ProjectSubtaskStatsRow } from '../../types/domain';
import { getCurrentMonth, shiftMonth } from '../resource/resourceUtils';
import { toTaskType } from '../projects/projectApiTransform';
import { buildProjectTypeOptions } from '../../utils/taskType';
import {
  MONITORING_STATS_DEFAULT_SORT,
  MONITORING_STATS_DEFAULT_SUMMARY_VIEW,
  MONITORING_STATS_PAGE_TITLE,
} from './ProjectStatsPage.constants';
import { ProjectStatsDetailsTable } from './ProjectStatsDetailsTable';
import { ProjectStatsFilterForm } from './ProjectStatsFilterForm';
import { ProjectStatsSummarySection } from './ProjectStatsSummarySection';
import type {
  ProjectStatsMonthlyRow,
  ProjectStatsPeriodBasis,
  ProjectStatsSortState,
  StatsSummaryView,
} from './ProjectStatsPage.types';
import { buildMonthRange, formatMonthLabel, monthKeyFromDate, monthKeyFromTaskMonth } from './ProjectStatsPage.utils';
import { toMonitoringStatsRow, toProjectStatsRow } from './statsApiTransform';
import '../../styles/pages/StatsPage.scss';

function formatMemberLabel(accountId: string, name: string) {
  if (accountId && name) {
    return `${accountId}(${name})`;
  }
  return accountId || name;
}

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
  const [draftPeriodBasis, setDraftPeriodBasis] = useState<ProjectStatsPeriodBasis>('project');
  const [periodBasis, setPeriodBasis] = useState<ProjectStatsPeriodBasis>('project');
  const [summaryView, setSummaryView] = useState<StatsSummaryView>(
    MONITORING_STATS_DEFAULT_SUMMARY_VIEW,
  );
  const [sortState, setSortState] = useState<ProjectStatsSortState>(
    MONITORING_STATS_DEFAULT_SORT,
  );
  const [expandedProjectIds, setExpandedProjectIds] = useState<string[]>([]);

  const taskTypesQuery = useQuery({
    queryKey: ['task-types', member?.id],
    queryFn: async () => dataClient.getTaskTypes(),
    enabled: Boolean(member),
  });
  const membersQuery = useQuery({
    queryKey: ['members', member?.id],
    queryFn: async () => dataClient.getMembers(),
    enabled: Boolean(member),
  });
  const taskType1Options = useMemo(
    () => buildProjectTypeOptions((taskTypesQuery.data ?? []).map(toTaskType), draftTaskType1),
    [draftTaskType1, taskTypesQuery.data],
  );
  const defaultTaskType1 = taskType1Options[0] ?? '';

  const projectStatsQuery = useQuery({
    queryKey: [
      'project-stats',
      member?.id,
      startMonth,
      endMonth,
      taskType1,
      periodBasis,
      sortState.key,
      sortState.direction,
    ],
    queryFn: async () =>
      dataClient.getProjectStatsRows({
        startMonth,
        endMonth,
        taskType1,
        periodBasis,
        sortKey: sortState.key,
        sortDirection: sortState.direction,
      }),
    enabled: Boolean(member && startMonth && endMonth && taskType1),
  });
  const subtasksQuery = useQuery({
    queryKey: [
      'project-stats-subtasks',
      member?.id,
      [...expandedProjectIds].sort().join(','),
    ],
    queryFn: async () => dataClient.getProjectSubtasksByProjectIds(expandedProjectIds),
    enabled: Boolean(member && periodBasis === 'project' && expandedProjectIds.length > 0),
  });
  const subtaskPeriodRowsQuery = useQuery({
    queryKey: ['project-stats-subtask-period-rows', member?.id, startMonth, endMonth, taskType1],
    queryFn: async () =>
      dataClient.getMonitoringStatsRows({
        startMonth,
        endMonth,
        taskType1,
        sortKey: 'month',
        sortDirection: 'desc',
      }),
    enabled: Boolean(member && periodBasis === 'subtask' && startMonth && endMonth && taskType1),
  });

  const projectRows = useMemo<ProjectStatsRow[]>(
    () => (projectStatsQuery.data ?? []).map(toProjectStatsRow),
    [projectStatsQuery.data],
  );
  const subtaskPeriodRows = useMemo<ProjectSubtaskStatsRow[]>(
    () => (subtaskPeriodRowsQuery.data ?? []).map(toMonitoringStatsRow),
    [subtaskPeriodRowsQuery.data],
  );
  const subtaskRowsByProjectId = useMemo(() => {
    const grouped = new Map<string, ProjectSubtaskStatsRow[]>();
    const sourceRows =
      periodBasis === 'subtask'
        ? subtaskPeriodRows.filter((row) => expandedProjectIds.includes(row.projectId))
        : (subtasksQuery.data ?? []).map(toMonitoringStatsRow);

    for (const row of sourceRows) {
      const current = grouped.get(row.projectId) ?? [];
      current.push(row);
      grouped.set(row.projectId, current);
    }
    return grouped;
  }, [expandedProjectIds, periodBasis, subtaskPeriodRows, subtasksQuery.data]);
  const subtaskPeriodLabelByProjectId = useMemo(() => {
    if (periodBasis !== 'subtask') {
      return new Map<string, string>();
    }

    const monthKeysByProjectId = new Map<string, Set<string>>();
    for (const row of subtaskPeriodRows) {
      const monthKey = monthKeyFromTaskMonth(row.taskMonth);
      if (!monthKey) {
        continue;
      }
      const current = monthKeysByProjectId.get(row.projectId) ?? new Set<string>();
      current.add(monthKey);
      monthKeysByProjectId.set(row.projectId, current);
    }

    const labels = new Map<string, string>();
    monthKeysByProjectId.forEach((monthKeys, projectId) => {
      const ordered = [...monthKeys].sort();
      if (!ordered.length) {
        return;
      }
      if (ordered.length === 1) {
        labels.set(projectId, formatMonthLabel(ordered[0]));
        return;
      }
      labels.set(
        projectId,
        `${formatMonthLabel(ordered[0])}~${formatMonthLabel(ordered[ordered.length - 1])}`,
      );
    });
    return labels;
  }, [periodBasis, subtaskPeriodRows]);
  const memberLabelById = useMemo(() => {
    const labels = new Map<string, string>();
    for (const record of membersQuery.data ?? []) {
      const id = record.id ? String(record.id) : '';
      if (!id) {
        continue;
      }
      labels.set(
        id,
        formatMemberLabel(String(record.account_id ?? ''), String(record.name ?? '')).trim(),
      );
    }
    return labels;
  }, [membersQuery.data]);
  const monthlyRows = useMemo<ProjectStatsMonthlyRow[]>(() => {
    if (periodBasis === 'subtask') {
      if (!subtaskPeriodRows.length) {
        return [];
      }

      const grouped = new Map<string, { projectIds: Set<string>; subtaskCount: number }>();
      const monthKeys: string[] = [];

      for (const row of subtaskPeriodRows) {
        const monthKey = monthKeyFromTaskMonth(row.taskMonth);
        if (!monthKey) {
          continue;
        }
        monthKeys.push(monthKey);
        const current = grouped.get(monthKey) ?? {
          projectIds: new Set<string>(),
          subtaskCount: 0,
        };
        current.projectIds.add(row.projectId);
        current.subtaskCount += 1;
        grouped.set(monthKey, current);
      }

      return buildMonthRange(monthKeys).map((monthKey) => {
        const current = grouped.get(monthKey);
        return {
          monthKey,
          label: monthKey.replace('-', '/'),
          projectCount: current?.projectIds.size ?? 0,
          subtaskCount: current?.subtaskCount ?? 0,
        };
      });
    }

    if (!projectRows.length) {
      return [];
    }

    const grouped = new Map<string, { projectCount: number; subtaskCount: number }>();
    const monthKeys = projectRows.map((row) => monthKeyFromDate(row.endDate)).filter(Boolean);

    for (const row of projectRows) {
      const monthKey = monthKeyFromDate(row.endDate);
      if (!monthKey) {
        continue;
      }
      const current = grouped.get(monthKey) ?? { projectCount: 0, subtaskCount: 0 };
      current.projectCount += 1;
      current.subtaskCount += row.subtaskCount;
      grouped.set(monthKey, current);
    }

    return buildMonthRange(monthKeys).map((monthKey) => {
      const current = grouped.get(monthKey);
      return {
        monthKey,
        label: monthKey.replace('-', '/'),
        projectCount: current?.projectCount ?? 0,
        subtaskCount: current?.subtaskCount ?? 0,
      };
    });
  }, [periodBasis, projectRows, subtaskPeriodRows]);

  useEffect(() => {
    setDocumentTitle(MONITORING_STATS_PAGE_TITLE);
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

  useEffect(() => {
    setExpandedProjectIds((current) =>
      current.filter((projectId) => projectRows.some((row) => row.projectId === projectId)),
    );
  }, [projectRows]);

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
    setPeriodBasis(draftPeriodBasis);
    setExpandedProjectIds([]);
  };

  const handleReset = () => {
    setDraftStartMonth(defaultStartMonth);
    setDraftEndMonth(defaultEndMonth);
    setStartMonth(defaultStartMonth);
    setEndMonth(defaultEndMonth);
    setDraftTaskType1(defaultTaskType1);
    setTaskType1(defaultTaskType1);
    setDraftPeriodBasis('project');
    setPeriodBasis('project');
    setExpandedProjectIds([]);
  };

  const handleToggleProject = (projectId: string) => {
    setExpandedProjectIds((current) =>
      current.includes(projectId)
        ? current.filter((value) => value !== projectId)
        : [...current, projectId],
    );
  };

  return (
    <div className={'stats-page stats-page--page'}>
      <PageHeader title={MONITORING_STATS_PAGE_TITLE} />

      <PageSection title="필터">
        <ProjectStatsFilterForm
          draftStartMonth={draftStartMonth}
          draftEndMonth={draftEndMonth}
          draftTaskType1={draftTaskType1}
          draftPeriodBasis={draftPeriodBasis}
          taskType1Options={taskType1Options}
          onSubmit={(event) => {
            event.preventDefault();
            handleSearch();
          }}
          onReset={handleReset}
          onDraftStartMonthChange={setDraftStartMonth}
          onDraftEndMonthChange={setDraftEndMonth}
          onDraftTaskType1Change={setDraftTaskType1}
          onDraftPeriodBasisChange={setDraftPeriodBasis}
        />
      </PageSection>

      <PageSection title="월별 프로젝트 현황">
        <ProjectStatsSummarySection
          summaryView={summaryView}
          monthlyRows={monthlyRows}
          onSummaryViewChange={setSummaryView}
        />
      </PageSection>

      <PageSection title="프로젝트 목록">
        <ProjectStatsDetailsTable
          rows={projectRows}
          periodBasis={periodBasis}
          sortState={sortState}
          onSortChange={setSortState}
          expandedProjectIds={new Set(expandedProjectIds)}
          onToggleProject={handleToggleProject}
          subtasksByProjectId={subtaskRowsByProjectId}
          subtaskPeriodLabelByProjectId={subtaskPeriodLabelByProjectId}
          memberLabelById={memberLabelById}
        />
      </PageSection>
    </div>
  );
}
