import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { setDocumentTitle } from '../../router/navigation';
import { PageSection } from '../../components/shared/PageSection';
import { dataClient } from '../../api/client';
import { getToday } from '../../utils';
import { buildCalendarWeeks, buildMonthDays, getCurrentMonth } from './resourceUtils';
import { RESOURCE_SUMMARY_PAGE_TITLE } from './ResourceSummaryPage.constants';
import type { ResourceSummaryRow } from './ResourceSummaryPage.types';
import { formatMemberLabel } from './ResourceSummaryPage.utils';
import { ResourceSummaryResults } from './ResourceSummaryResults';
import { useAuth } from '../../auth/AuthContext';
import '../../styles/domain/pages/projects-feature.scss';
import '../../styles/domain/pages/resource-summary-page.scss';

export function ResourceSummaryPage() {
  const { session } = useAuth();
  const member = session?.member ?? null;
  const today = getToday();
  const currentMonth = today.slice(0, 7);

  const [monthDraft, setMonthDraft] = useState(() => getCurrentMonth());
  const [missingOnlyDraft, setMissingOnlyDraft] = useState(false);
  const [appliedMonth, setAppliedMonth] = useState(() => getCurrentMonth());
  const [appliedMissingOnly, setAppliedMissingOnly] = useState(false);
  const [detailMemberId, setDetailMemberId] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    setDocumentTitle(RESOURCE_SUMMARY_PAGE_TITLE);
  }, []);

  const membersQuery = useQuery({
    queryKey: ['resource', 'members', member?.id],
    queryFn: () => dataClient.getResourceSummaryMembers(member!),
    enabled: Boolean(member),
  });

  const summaryQuery = useQuery({
    queryKey: ['resource', 'summary', member?.id, appliedMonth],
    queryFn: () => dataClient.getResourceSummary(member!, appliedMonth),
    enabled: Boolean(member),
  });

  const activeMembers = useMemo(() => membersQuery.data ?? [], [membersQuery.data]);
  const summaryRows = useMemo(() => summaryQuery.data ?? [], [summaryQuery.data]);

  const rows = useMemo<ResourceSummaryRow[]>(() => {
    if (!member) {
      return [];
    }

    const visibleMembers =
      member.role === 'admin'
        ? activeMembers
        : activeMembers.filter((item) => item.id === member.id);
    const businessDays = buildMonthDays(appliedMonth).filter((day) => {
      if (day.weekday === 0 || day.weekday === 6) {
        return false;
      }

      if (appliedMonth > currentMonth) {
        return false;
      }

      if (appliedMonth === currentMonth && day.date > today) {
        return false;
      }

      return true;
    });

    const rowsForMembers = visibleMembers.map((member) => {
      const minutesByDate = new Map<string, number>();

      summaryRows
        .filter((row) => row.memberId === member.id)
        .forEach((row) => {
          minutesByDate.set(
            row.taskDate,
            (minutesByDate.get(row.taskDate) ?? 0) + Math.round(row.taskUsedtime),
          );
        });

      const totalMinutes = businessDays.reduce(
        (sum, day) => sum + (minutesByDate.get(day.date) ?? 0),
        0,
      );
      const requiredMinutes = businessDays.length * 480;
      const diffMinutes = totalMinutes - requiredMinutes;
      const hasMissingDay = businessDays.some((day) => (minutesByDate.get(day.date) ?? 0) < 480);

      return {
        id: member.id,
        label: formatMemberLabel(member.accountId, member.name),
        diffMinutes,
        hasMissingDay,
      };
    });

    const filteredRows = appliedMissingOnly
      ? rowsForMembers.filter((row) => row.hasMissingDay)
      : rowsForMembers;

    return filteredRows.sort((left, right) => left.label.localeCompare(right.label, 'ko'));
  }, [activeMembers, appliedMissingOnly, appliedMonth, currentMonth, member, summaryRows, today]);

  useEffect(() => {
    if (!rows.length) {
      setDetailOpen(false);
      setDetailMemberId('');
      return;
    }

    if (detailMemberId && !rows.some((row) => row.id === detailMemberId)) {
      setDetailOpen(false);
      setDetailMemberId('');
    }
  }, [detailMemberId, rows]);

  const detailMember = useMemo(() => {
    if (!detailMemberId) {
      return null;
    }

    return activeMembers.find((item) => item.id === detailMemberId) ?? null;
  }, [activeMembers, detailMemberId]);

  const monthState = useMemo(() => {
    if (!detailMemberId) {
      return null;
    }

    const summary = new Map<number, number>();

    summaryRows
      .filter((row) => row.memberId === detailMemberId)
      .forEach((row) => {
        const day = Number(row.taskDate.slice(8, 10));
        summary.set(day, (summary.get(day) ?? 0) + Math.round(row.taskUsedtime));
      });

    return {
      currentMonth: appliedMonth === currentMonth,
      futureMonth: appliedMonth > currentMonth,
      todayDay: Number(today.slice(8, 10)),
      label: `${Number(appliedMonth.slice(0, 4))}년 ${Number(appliedMonth.slice(5, 7))}월`,
      summary,
      weeks: buildCalendarWeeks(appliedMonth),
    };
  }, [appliedMonth, currentMonth, detailMemberId, summaryRows, today]);

  const handleSearch = () => {
    setAppliedMonth(monthDraft);
    setAppliedMissingOnly(missingOnlyDraft);
    setDetailOpen(false);
    setDetailMemberId('');
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleSearch();
  };

  return (
    <section className="projects-feature projects-feature--shell resource-summary-page resource-summary-page--shell">
      <header className="projects-feature__page-header">
        <div className="projects-feature__page-header-top">
          <h1 className="projects-feature__title">업무보고 현황</h1>
        </div>
      </header>

      <PageSection title="필터">
        <form className="projects-feature__filter-bar" onSubmit={handleSearchSubmit}>
          <label className="projects-feature__filter-field">
            <span>기간</span>
            <input
              type="month"
              value={monthDraft}
              onChange={(event) => setMonthDraft(event.target.value)}
            />
          </label>
          <label
            className={clsx(
              'projects-feature__filter-field',
              'resource-summary-page__checkbox-field',
            )}
          >
            <span>미작성자만 보기</span>
            <input
              type="checkbox"
              checked={missingOnlyDraft}
              onChange={(event) => setMissingOnlyDraft(event.target.checked)}
            />
          </label>
          <div className="projects-feature__filter-actions">
            <button type="submit" className="projects-feature__filter-button">
              검색
            </button>
          </div>
        </form>
      </PageSection>

      <ResourceSummaryResults
        rows={rows}
        detailOpen={detailOpen}
        detailMember={detailMember}
        monthState={monthState}
        onDetailOpen={(memberId) => {
          setDetailMemberId(memberId);
          setDetailOpen(true);
        }}
        onDetailClose={() => setDetailOpen(false)}
      />
    </section>
  );
}
