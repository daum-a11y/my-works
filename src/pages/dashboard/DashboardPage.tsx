import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { setDocumentTitle } from '../../router/navigation';
import { dataClient } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { buildCalendarWeeks, getCurrentMonth, shiftMonth } from '../resource/resourceUtils';
import { DashboardCalendarSection } from './DashboardCalendarSection';
import { DashboardProjectsTable } from './DashboardProjectsTable';
import { DASHBOARD_PROJECTS_DEFAULT_SORT } from './DashboardPage.constants';
import {
  sortDashboardProjects,
  type DashboardProjectsSortState,
} from './DashboardProjectsTable.sort';
import { toDashboardSnapshot, toDashboardTaskCalendarDay } from './dashboardApiTransform';
import { PageHeader } from '../../components/shared';

export function DashboardPage() {
  const { session } = useAuth();
  const member = session?.member;
  const [selectedMonth, setSelectedMonth] = useState(() => getCurrentMonth());
  const [projectsSortState, setProjectsSortState] = useState<DashboardProjectsSortState>(
    DASHBOARD_PROJECTS_DEFAULT_SORT,
  );
  const shouldShowWorklogCalendar = member?.reportRequired === true;

  useEffect(() => {
    setDocumentTitle('대시보드');
  }, []);

  const dashboardQuery = useQuery({
    queryKey: ['dashboard', member?.id],
    queryFn: async () => dataClient.getDashboard(member!),
    enabled: Boolean(member),
  });

  const tasksQuery = useQuery({
    queryKey: ['dashboard', 'tasks', member?.id, selectedMonth],
    queryFn: async () => dataClient.getDashboardTaskCalendar(member!, selectedMonth),
    enabled: Boolean(member),
  });

  const dashboard = useMemo(() => toDashboardSnapshot(dashboardQuery.data), [dashboardQuery.data]);
  const inProgressProjects = useMemo(
    () => sortDashboardProjects(dashboard?.inProgressProjects ?? [], projectsSortState),
    [dashboard?.inProgressProjects, projectsSortState],
  );
  const calendarTasks = useMemo(
    () => (tasksQuery.data ?? []).map(toDashboardTaskCalendarDay),
    [tasksQuery.data],
  );
  const monthState = useMemo(() => {
    if (!member || !shouldShowWorklogCalendar) {
      return null;
    }

    const summary = new Map<number, number>();

    for (const task of calendarTasks) {
      const day = Number(task.taskDate.slice(8, 10));
      summary.set(day, (summary.get(day) ?? 0) + Math.round(task.taskUsedtime));
    }

    const today = new Date();
    const currentYearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const currentMonth = currentYearMonth === selectedMonth;
    const future = selectedMonth > currentYearMonth;

    return {
      currentMonth,
      future,
      today: today.getDate(),
      weeks: buildCalendarWeeks(selectedMonth),
      year: Number(selectedMonth.slice(0, 4)),
      month: Number(selectedMonth.slice(5, 7)),
      summary,
    };
  }, [calendarTasks, member, selectedMonth, shouldShowWorklogCalendar]);

  return (
    <div className="krds-page">
      <PageHeader title="대시보드" />
      {shouldShowWorklogCalendar ? (
        <DashboardCalendarSection
          monthState={monthState}
          onShiftMonth={(offset) => setSelectedMonth((current) => shiftMonth(current, offset))}
        />
      ) : null}

      <DashboardProjectsTable
        projects={inProgressProjects}
        sortState={projectsSortState}
        onSortChange={setProjectsSortState}
      />
    </div>
  );
}
