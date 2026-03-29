import { useEffect, useMemo, useState } from 'react';
import { PageSection } from '../../components/ui/PageSection';
import {
  buildCalendarWeeks,
  filterTasksByMonth,
  getCurrentMonth,
  getNextBusinessDay,
  getPreviousBusinessDay,
  shiftMonth,
  useResourceDataset,
} from './resource-shared';
import styles from './ResourcePage.module.css';

const weekdayLabels = ['일', '월', '화', '수', '목', '금', '토'];

export function ResourceSummaryPage() {
  const query = useResourceDataset();
  const data = query.data;
  const [selectedDate, setSelectedDate] = useState(() => getPreviousBusinessDay());
  const [selectedMonth, setSelectedMonth] = useState(() => getCurrentMonth());
  const [selectedMemberId, setSelectedMemberId] = useState('');

  useEffect(() => {
    document.title = '투입리소스 | My Works';
  }, []);

  useEffect(() => {
    if (!data) {
      return;
    }

    if (data.member.role === 'admin') {
      setSelectedMemberId((current) => current || data.members[0]?.id || '');
      return;
    }

    setSelectedMemberId(data.member.id);
  }, [data]);

  const dailyRows = useMemo(() => {
    if (!data) {
      return [];
    }

    const visibleMembers =
      data.member.role === 'admin'
        ? data.members
        : data.members.filter((member) => member.id === data.member.id);
    const weekday = new Date(selectedDate).getDay();

    return visibleMembers.map((member) => {
      const minutes = data.tasks
        .filter((task) => task.taskDate === selectedDate && task.memberId === member.id)
        .reduce((sum, task) => sum + Math.round(task.hours), 0);
      const isWeekend = weekday === 0 || weekday === 6;

      return {
        id: member.id,
        accountId: member.accountId,
        isWeekend,
        minutes,
      };
    });
  }, [data, selectedDate]);

  const monthState = useMemo(() => {
    if (!data || !selectedMemberId) {
      return null;
    }

    const tasks = filterTasksByMonth(data.tasks, selectedMonth).filter(
      (task) => task.memberId === selectedMemberId,
    );
    const summary = new Map<number, number>();

    for (const task of tasks) {
      const day = Number(task.taskDate.slice(8, 10));
      summary.set(day, (summary.get(day) ?? 0) + Math.round(task.hours));
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
  }, [data, selectedMemberId, selectedMonth]);

  const isFutureDaily = selectedDate >= new Date().toISOString().slice(0, 10);

  return (
    <div className={styles.splitGrid}>
      <PageSection title="일간" variant="panel">
        <div className={styles.toolbar}>
          <button
            type="button"
            onClick={() => setSelectedDate(getPreviousBusinessDay(new Date(selectedDate)))}
          >
            이전날
          </button>
          <input
            aria-label="일간 날짜 선택"
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
          />
          <button
            type="button"
            onClick={() => setSelectedDate(getNextBusinessDay(new Date(selectedDate)))}
            disabled={isFutureDaily}
          >
            다음날
          </button>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <caption>{selectedDate} 업무일지 작성현황</caption>
            <thead>
              <tr>
                <th>ID</th>
                <th>결과</th>
              </tr>
            </thead>
            <tbody>
              {dailyRows.map((row) => {
                const badgeClass = row.isWeekend
                  ? styles.resultBadgeWeekend
                  : row.minutes < 480
                    ? styles.resultBadgeDanger
                    : styles.resultBadgeSuccess;
                const value = row.isWeekend
                  ? row.minutes > 0
                    ? `${row.minutes} 분`
                    : ''
                  : row.minutes < 480
                    ? `${(480 - row.minutes) * -1} 분`
                    : 'PASS';

                return (
                  <tr key={row.id}>
                    <th>{row.accountId}</th>
                    <td>
                      <span className={`${styles.resultBadge} ${badgeClass}`}>{value}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </PageSection>

      <PageSection title="월간" variant="panel">
        {data?.member.role === 'admin' ? (
          <div className={styles.callout}>
            조회 대상 사용자를 선택한 뒤 월간 현황을 확인할 수 있습니다.
          </div>
        ) : null}

        <div className={styles.toolbar}>
          <button type="button" onClick={() => setSelectedMonth(shiftMonth(selectedMonth, -1))}>
            이전달
          </button>
          {data?.member.role === 'admin' ? (
            <select
              aria-label="아이디"
              value={selectedMemberId}
              onChange={(event) => setSelectedMemberId(event.target.value)}
            >
              {data.members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.accountId} ({member.name})
                </option>
              ))}
            </select>
          ) : null}
          <button type="button" onClick={() => setSelectedMonth(shiftMonth(selectedMonth, 1))}>
            다음달
          </button>
        </div>

        {monthState ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <caption>
                {monthState.year}년 {monthState.month}월 업무일지 작성시간 현황
              </caption>
              <colgroup>
                <col style={{ width: '13%' }} />
                <col style={{ width: '14.8%' }} />
                <col style={{ width: '14.8%' }} />
                <col style={{ width: '14.8%' }} />
                <col style={{ width: '14.8%' }} />
                <col style={{ width: '14.8%' }} />
                <col style={{ width: '13%' }} />
              </colgroup>
              <thead>
                <tr>
                  {weekdayLabels.map((label) => (
                    <th key={label}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthState.weeks.map((week, index) => (
                  <tr key={`${selectedMonth}-week-${index}`}>
                    {week.map((cell, weekdayIndex) => {
                      if (!cell) {
                        return <td key={`${selectedMonth}-${index}-${weekdayIndex}`}>&nbsp;</td>;
                      }

                      const minutes = monthState.summary.get(cell.day) ?? 0;
                      const isWeekend = cell.weekday === 0 || cell.weekday === 6;
                      const showBusinessState =
                        isWeekend === false &&
                        ((monthState.currentMonth && monthState.today >= cell.day) ||
                          (!monthState.future && !monthState.currentMonth));

                      return (
                        <td key={cell.date} className={isWeekend ? styles.weekendCell : undefined}>
                          <span className={styles.dayLabel}>{cell.day}일</span>{' '}
                          {isWeekend ? (
                            minutes > 0 ? (
                              <span
                                className={`${styles.resultBadge} ${styles.resultBadgeWeekend}`}
                              >
                                {minutes}분
                              </span>
                            ) : null
                          ) : showBusinessState ? (
                            minutes > 0 ? (
                              <span
                                className={`${styles.resultBadge} ${minutes >= 480 ? styles.resultBadgeSuccess : styles.resultBadgeWarning}`}
                              >
                                {(480 - minutes) * -1}분
                              </span>
                            ) : (
                              <span className={`${styles.resultBadge} ${styles.resultBadgeDanger}`}>
                                -480분
                              </span>
                            )
                          ) : null}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.empty}>사용자 정보가 없습니다.</div>
        )}
      </PageSection>
    </div>
  );
}
