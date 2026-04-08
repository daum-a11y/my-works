import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '../../components/shared/PageHeader';
import { PageSection } from '../../components/shared/PageSection';
import { dataClient } from '../../api/client';
import { mapMonitoringStatsRowRecords } from '../../mappers/domainMappers';
import { setDocumentTitle } from '../../router/navigation';
import { type MonitoringStatsRow, type PageStatus } from '../../types/domain';
import { getCurrentMonth, shiftMonth } from '../resource/resourceUtils';
import {
  MONITORING_STATS_DEFAULT_DRAFT_STATUS,
  MONITORING_STATS_DEFAULT_SUMMARY_VIEW,
  MONITORING_STATS_PAGE_TITLE,
} from './MonitoringStatsPage.constants';
import { MonitoringStatsDetailsTable } from './MonitoringStatsDetailsTable';
import { MonitoringStatsFilterForm } from './MonitoringStatsFilterForm';
import { MonitoringStatsSummarySection } from './MonitoringStatsSummarySection';
import type { StatsSummaryView } from './MonitoringStatsPage.types';
import {
  buildMonthRange,
  formatMonthLabel,
  monthKeyFromMonitoringMonth,
  sortRows,
  type MonthlyMonitoringRow,
} from './MonitoringStatsPage.utils';
import { useAuth } from '../../auth/AuthContext';
import '../../styles/pages/StatsPage.scss';

export function MonitoringStatsPage() {
  const { session } = useAuth();
  const member = session?.member;
  const queryClient = useQueryClient();
  const defaultEndMonth = getCurrentMonth();
  const defaultStartMonth = shiftMonth(defaultEndMonth, -5);

  const monitoringQuery = useQuery({
    queryKey: ['monitoring-detail', member?.id],
    queryFn: async () => dataClient.getMonitoringStatsRows(),
    enabled: Boolean(member),
  });

  const monitoringRows = useMemo<MonitoringStatsRow[]>(
    () => mapMonitoringStatsRowRecords(monitoringQuery.data ?? []),
    [monitoringQuery.data],
  );
  const [draftStartMonth, setDraftStartMonth] = useState(defaultStartMonth);
  const [draftEndMonth, setDraftEndMonth] = useState(defaultEndMonth);
  const [startMonth, setStartMonth] = useState(defaultStartMonth);
  const [endMonth, setEndMonth] = useState(defaultEndMonth);
  const [summaryView, setSummaryView] = useState<StatsSummaryView>(
    MONITORING_STATS_DEFAULT_SUMMARY_VIEW,
  );
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [draftStatus, setDraftStatus] = useState<PageStatus>(MONITORING_STATS_DEFAULT_DRAFT_STATUS);
  const [draftNote, setDraftNote] = useState('');
  const [hoveredNotePageId, setHoveredNotePageId] = useState<string | null>(null);
  const [pinnedNotePageId, setPinnedNotePageId] = useState<string | null>(null);

  useEffect(() => {
    setDocumentTitle(MONITORING_STATS_PAGE_TITLE);
  }, []);

  const savePageMutation = useMutation({
    mutationFn: async (row: MonitoringStatsRow) =>
      dataClient.saveProjectPage({
        id: row.pageId,
        projectId: row.projectId,
        title: row.title,
        url: row.url,
        ownerMemberId: row.ownerMemberId,
        monitoringMonth: row.monitoringMonth,
        trackStatus: draftStatus,
        monitoringInProgress: row.monitoringInProgress,
        qaInProgress: row.qaInProgress,
        note: draftNote.trim(),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['monitoring-detail', member?.id] });
      setEditingPageId(null);
    },
  });

  const startEdit = (row: MonitoringStatsRow) => {
    setEditingPageId(row.pageId);
    setDraftStatus(row.trackStatus);
    setDraftNote(row.note);
  };

  const cancelEdit = () => {
    setEditingPageId(null);
    setDraftStatus(MONITORING_STATS_DEFAULT_DRAFT_STATUS);
    setDraftNote('');
  };

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

  const filteredRows = useMemo(() => {
    return monitoringRows
      .filter((row) => {
        const monthKey = monthKeyFromMonitoringMonth(row.monitoringMonth);
        if (!monthKey) {
          return false;
        }
        if (startMonth && monthKey < startMonth) {
          return false;
        }
        if (endMonth && monthKey > endMonth) {
          return false;
        }
        return true;
      })
      .sort(sortRows);
  }, [endMonth, monitoringRows, startMonth]);

  const monthlyRows = useMemo<MonthlyMonitoringRow[]>(() => {
    if (!filteredRows.length) {
      return [];
    }

    const grouped = new Map<
      string,
      {
        count: number;
        untouched: number;
        partial: number;
        completed: number;
      }
    >();
    const monthKeys = filteredRows
      .map((row) => monthKeyFromMonitoringMonth(row.monitoringMonth))
      .filter(Boolean);

    for (const row of filteredRows) {
      const monthKey = monthKeyFromMonitoringMonth(row.monitoringMonth);
      if (!monthKey) {
        continue;
      }
      const current = grouped.get(monthKey) ?? {
        count: 0,
        untouched: 0,
        partial: 0,
        completed: 0,
      };
      current.count += 1;
      if (row.trackStatus === '전체 수정') {
        current.completed += 1;
      } else if (row.trackStatus === '일부 수정') {
        current.partial += 1;
      } else {
        current.untouched += 1;
      }
      grouped.set(monthKey, current);
    }

    return buildMonthRange(monthKeys).map((monthKey) => {
      const current = grouped.get(monthKey);
      return {
        monthKey,
        label: formatMonthLabel(monthKey),
        count: current?.count ?? 0,
        untouched: current?.untouched ?? 0,
        partial: current?.partial ?? 0,
        completed: current?.completed ?? 0,
      };
    });
  }, [filteredRows]);

  return (
    <div className={'stats-page stats-page--page'}>
      <PageHeader title={MONITORING_STATS_PAGE_TITLE} />

      <PageSection title="필터">
        <MonitoringStatsFilterForm
          draftStartMonth={draftStartMonth}
          draftEndMonth={draftEndMonth}
          onSubmit={(event) => {
            event.preventDefault();
            handleSearch();
          }}
          onReset={handleReset}
          onDraftStartMonthChange={setDraftStartMonth}
          onDraftEndMonthChange={setDraftEndMonth}
        />
      </PageSection>

      <PageSection title="월별 모니터링 현황">
        <MonitoringStatsSummarySection
          summaryView={summaryView}
          monthlyRows={monthlyRows}
          onSummaryViewChange={setSummaryView}
        />
      </PageSection>

      <PageSection title="모니터링 페이지 목록">
        <MonitoringStatsDetailsTable
          rows={filteredRows}
          editingPageId={editingPageId}
          draftStatus={draftStatus}
          draftNote={draftNote}
          hoveredNotePageId={hoveredNotePageId}
          pinnedNotePageId={pinnedNotePageId}
          savePending={savePageMutation.isPending}
          onDraftStatusChange={setDraftStatus}
          onDraftNoteChange={setDraftNote}
          onHoveredNotePageIdChange={setHoveredNotePageId}
          onPinnedNotePageIdChange={setPinnedNotePageId}
          onStartEdit={startEdit}
          onSave={(row) => savePageMutation.mutate(row)}
          onCancel={cancelEdit}
        />
      </PageSection>
    </div>
  );
}
