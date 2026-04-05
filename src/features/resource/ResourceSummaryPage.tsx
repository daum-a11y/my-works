import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { setDocumentTitle } from '../../app/navigation';
import { MonthlyReportCalendar } from '../../components/common/MonthlyReportCalendar';
import { PageSection } from '../../components/common/PageSection';
import { opsDataClient } from '../../lib/dataClient';
import { getToday } from '../../lib/utils';
import { buildCalendarWeeks, buildMonthDays, getCurrentMonth } from './resourceShared';
import { useAuth } from '../auth/AuthContext';
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
    queryFn: () => opsDataClient.getResourceSummaryMembers(member!),
    enabled: Boolean(member),
  });

  const summaryQuery = useQuery({
    queryKey: ['resource', 'summary', member?.id, appliedMonth],
    queryFn: () => opsDataClient.getResourceSummary(member!, appliedMonth),
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
    <section className={'shell'}>
      <header className={'pageHeader'}>
        <div className={'pageHeaderTop'}>
          <h1 className={'title'}>업무보고 현황</h1>
        </div>
      </header>

      <PageSection title="필터">
        <form className={'filterBar'} onSubmit={handleSearchSubmit}>
          <label className={'filterField'}>
            <span>기간</span>
            <input
              type="month"
              value={monthDraft}
              onChange={(event) => setMonthDraft(event.target.value)}
            />
          </label>
          <label className={clsx('filterField', 'checkboxField')}>
            <span>미작성자만 보기</span>
            <input
              type="checkbox"
              checked={missingOnlyDraft}
              onChange={(event) => setMissingOnlyDraft(event.target.checked)}
            />
          </label>
          <div className={'filterActions'}>
            <button type="submit" className={'filterButton'}>
              검색
            </button>
          </div>
        </form>
      </PageSection>

      <section className={'contentSection'}>
        <div className={'tableWrap'}>
          <table className={'table'}>
            <caption className={'srOnly'}>월별 사용자 업무보고 현황</caption>
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
                        <span className={`minuteValue${tone}`}>
                          {formatSignedMinutes(row.diffMinutes)}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className={'tableLink'}
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
                  <td colSpan={3} className={'emptyState'}>
                    검색 결과가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {detailOpen && detailMember && monthState ? (
        <div className={'modalScrim'} onClick={() => setDetailOpen(false)}>
          <section
            className={'modal'}
            aria-label="월간 작성 현황"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={'modalHeader'}>
              <div className={'detailHeaderText'}>
                <h2 className={'detailTitle'}>
                  {formatMemberLabel(detailMember.accountId, detailMember.name)}
                </h2>
                <p className={'detailPeriod'}>{monthState.label}</p>
              </div>
              <button
                type="button"
                className={'iconButton'}
                onClick={() => setDetailOpen(false)}
                aria-label="상세 닫기"
              >
                닫기
              </button>
            </div>

            <div className={'detailBody'}>
              <MonthlyReportCalendar
                weeks={monthState.weeks}
                summary={monthState.summary}
                currentMonth={monthState.currentMonth}
                futureMonth={monthState.futureMonth}
                todayDay={monthState.todayDay}
                padded={false}
                className={'calendar'}
              />
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
