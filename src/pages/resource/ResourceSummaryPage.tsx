import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { setDocumentTitle } from '../../router/navigation';
import { MonthlyReportCalendar } from '../../components/shared/MonthlyReportCalendar';
import { PageSection } from '../../components/shared/PageSection';
import { dataClient } from '../../api/client';
import { getToday } from '../../utils';
import { buildCalendarWeeks, buildMonthDays, getCurrentMonth } from './resourceUtils';
import { useAuth } from '../../auth/AuthContext';
import '../../styles/domain/pages/projects-feature.scss';
import '../../styles/domain/pages/resource-summary-page.scss';
const numberFormatter = new Intl.NumberFormat('ko-KR');

function formatMemberLabel(accountId: string, name: string) {
  return `${accountId}(${name})`;
}

function formatSignedMinutes(minutes: number) {
  const absolute = numberFormatter.format(Math.abs(minutes));

  if (minutes > 0) {
    return `+${absolute}분`;
  }

  if (minutes < 0) {
    return `-${absolute}분`;
  }

  return '0';
}

function getMinuteTone(minutes: number) {
  if (minutes > 0) {
    return 'positive';
  }

  if (minutes < 0) {
    return 'negative';
  }

  return 'neutral';
}

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
    setDocumentTitle('업무보고 현황');
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

  const rows = useMemo(() => {
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

      <section className="resource-summary-page__content-section">
        <div className="projects-feature__table-wrap">
          <table className="projects-feature__table">
            <caption className="sr-only">월별 사용자 업무보고 현황</caption>
            <thead>
              <tr>
                <th>이름</th>
                <th>미작성 시간</th>
                <th>상세</th>
              </tr>
            </thead>
            <tbody>
              {rows.length ? (
                rows.map((row) => {
                  const tone = getMinuteTone(row.diffMinutes);
                  return (
                    <tr key={row.id}>
                      <td>{row.label}</td>
                      <td>
                        <span
                          className={[
                            'resource-summary-page__minute-value',
                            `resource-summary-page__minute-value--${tone}`,
                          ].join(' ')}
                        >
                          {formatSignedMinutes(row.diffMinutes)}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="projects-feature__table-link"
                          onClick={() => {
                            setDetailMemberId(row.id);
                            setDetailOpen(true);
                          }}
                        >
                          상세
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={3} className="projects-feature__empty-state">
                    검색 결과가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {detailOpen && detailMember && monthState ? (
        <div className="resource-summary-page__modal-scrim" onClick={() => setDetailOpen(false)}>
          <section
            className="projects-feature__modal"
            aria-label="월간 작성 현황"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="projects-feature__modal-header">
              <div className="resource-summary-page__detail-header-text">
                <h2 className="projects-feature__detail-title">
                  {formatMemberLabel(detailMember.accountId, detailMember.name)}
                </h2>
                <p className="resource-summary-page__detail-period">{monthState.label}</p>
              </div>
              <button
                type="button"
                className="projects-feature__icon-button"
                onClick={() => setDetailOpen(false)}
                aria-label="상세 닫기"
              >
                닫기
              </button>
            </div>

            <div className="resource-summary-page__detail-body">
              <MonthlyReportCalendar
                weeks={monthState.weeks}
                summary={monthState.summary}
                currentMonth={monthState.currentMonth}
                futureMonth={monthState.futureMonth}
                todayDay={monthState.todayDay}
                padded={false}
                className="resource-summary-page__calendar"
              />
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
