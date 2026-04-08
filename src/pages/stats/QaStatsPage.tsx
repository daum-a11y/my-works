import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '../../components/shared/PageHeader';
import { PageSection } from '../../components/shared/PageSection';
import { dataClient } from '../../api/client';
import { mapQaStatsProjectRowRecords } from '../../mappers/domainMappers';
import { setDocumentTitle } from '../../router/navigation';
import { getCurrentMonth, shiftMonth } from '../resource/resourceUtils';
import { QaStatsFilterForm } from './QaStatsFilterForm';
import { QA_STATS_DEFAULT_SUMMARY_VIEW, QA_STATS_PAGE_TITLE } from './QaStatsPage.constants';
import { QaStatsProjectsTable } from './QaStatsProjectsTable';
import { QaStatsSummarySection } from './QaStatsSummarySection';
import type { StatsSummaryView } from './QaStatsPage.types';
import {
  buildMonthRange,
  formatMonthLabel,
  monthKeyFromDate,
  sortProjects,
  type MonthlyQaRow,
} from './QaStatsPage.utils';
import { useAuth } from '../../auth/AuthContext';
import '../../styles/pages/StatsPage.scss';

export function QaStatsPage() {
  const { session } = useAuth();
  const member = session?.member;
  const defaultEndMonth = getCurrentMonth();
  const defaultStartMonth = shiftMonth(defaultEndMonth, -5);
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const projectsQuery = useQuery({
    queryKey: ['qa-projects', member?.id],
    queryFn: async () => dataClient.getQaStatsProjects(),
    enabled: Boolean(member),
  });

  const qaProjects = useMemo(
    () => mapQaStatsProjectRowRecords(projectsQuery.data ?? []),
    [projectsQuery.data],
  );
  const [draftStartMonth, setDraftStartMonth] = useState(defaultStartMonth);
  const [draftEndMonth, setDraftEndMonth] = useState(defaultEndMonth);
  const [startMonth, setStartMonth] = useState(defaultStartMonth);
  const [endMonth, setEndMonth] = useState(defaultEndMonth);
  const [summaryView, setSummaryView] = useState<StatsSummaryView>(QA_STATS_DEFAULT_SUMMARY_VIEW);

  useEffect(() => {
    setDocumentTitle(QA_STATS_PAGE_TITLE);
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
    setStartMonth(nextStart);
    setEndMonth(nextEnd);
    setDraftStartMonth(nextStart);
    setDraftEndMonth(nextEnd);
  };

  const handleReset = () => {
    setDraftStartMonth(defaultStartMonth);
    setDraftEndMonth(defaultEndMonth);
    setStartMonth(defaultStartMonth);
    setEndMonth(defaultEndMonth);
  };

  const filteredProjects = useMemo(() => {
    return qaProjects
      .filter((project) => {
        const monthKey = monthKeyFromDate(project.endDate);
        if (startMonth && monthKey < startMonth) {
          return false;
        }
        if (endMonth && monthKey > endMonth) {
          return false;
        }
        return true;
      })
      .sort(sortProjects);
  }, [endMonth, qaProjects, startMonth]);

  const monthlyRows = useMemo<MonthlyQaRow[]>(() => {
    if (!filteredProjects.length) {
      return [];
    }

    const grouped = new Map<string, { count: number; completed: number }>();
    const monthKeys = filteredProjects.map((project) => monthKeyFromDate(project.endDate));

    for (const project of filteredProjects) {
      const monthKey = monthKeyFromDate(project.endDate);
      const current = grouped.get(monthKey) ?? { count: 0, completed: 0 };
      current.count += 1;
      if (project.endDate <= today) {
        current.completed += 1;
      }
      grouped.set(monthKey, current);
    }

    return buildMonthRange(monthKeys).map((monthKey) => {
      const count = grouped.get(monthKey)?.count ?? 0;
      const completed = grouped.get(monthKey)?.completed ?? 0;

      return {
        monthKey,
        label: formatMonthLabel(monthKey),
        count,
        completed,
      };
    });
  }, [filteredProjects, today]);

  return (
    <div className={'stats-page stats-page--page'}>
      <PageHeader title={QA_STATS_PAGE_TITLE} />

      <PageSection title="필터">
        <QaStatsFilterForm
          draftStartMonth={draftStartMonth}
          draftEndMonth={draftEndMonth}
          onDraftStartMonthChange={setDraftStartMonth}
          onDraftEndMonthChange={setDraftEndMonth}
          onSearch={handleSearch}
          onReset={handleReset}
        />
      </PageSection>

      <PageSection title="월별 QA 현황">
        <QaStatsSummarySection
          summaryView={summaryView}
          monthlyRows={monthlyRows}
          onSummaryViewChange={setSummaryView}
        />
      </PageSection>

      <PageSection title="QA 프로젝트 목록">
        <QaStatsProjectsTable projects={filteredProjects} />
      </PageSection>
    </div>
  );
}
