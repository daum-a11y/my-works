import { useEffect, useMemo } from "react";
import { PageSection } from "../../components/ui/PageSection";
import { createHoursLabel, buildMonthDays, filterTasksByMonth, shiftMonth, useResourceDataset, useResourceFilters } from "./resource-shared";
import styles from "./ResourcePage.module.css";

export function ResourceMonthPage() {
  const query = useResourceDataset();
  const data = query.data;
  const filters = useResourceFilters(data?.member.id);

  useEffect(() => {
    if (!data || filters.selectedMemberId) {
      return;
    }
    filters.setSelectedMemberId(data.member.id);
  }, [data, filters]);

  const monthTasks = useMemo(
    () => filterTasksByMonth(data?.tasks ?? [], filters.selectedMonth),
    [data?.tasks, filters.selectedMonth],
  );

  const visibleMemberId =
    data?.member.role === "admin" ? filters.selectedMemberId || data?.member.id : data?.member.id ?? "";
  const memberTasks = monthTasks.filter((task) => task.memberId === visibleMemberId);
  const days = buildMonthDays(filters.selectedMonth);
  const daysWithTotals = days.map((day) => {
    const tasks = memberTasks.filter((task) => task.taskDate === day.date);
    const totalHours = tasks.reduce((sum, task) => sum + task.hours, 0);
    const minutes = Math.round(totalHours * 60);
    return {
      ...day,
      tasks,
      totalHours,
      minutes,
      state: minutes >= 480 ? "filled" : minutes > 0 ? "partial" : "empty",
    };
  });

  const totalHours = memberTasks.reduce((sum, task) => sum + task.hours, 0);
  const over480Count = daysWithTotals.filter((day) => day.minutes >= 480).length;

  return (
    <>
      <PageSection title="월간 작성현황">
        <div className={styles.toolbar}>
          <button type="button" onClick={() => filters.setSelectedMonth(shiftMonth(filters.selectedMonth, -1))}>
            이전달
          </button>
          <input
            type="month"
            value={filters.selectedMonth}
            onChange={(event) => filters.setSelectedMonth(event.target.value)}
          />
          <button type="button" onClick={() => filters.setSelectedMonth(shiftMonth(filters.selectedMonth, 1))}>
            다음달
          </button>
          {data?.member.role === "admin" ? (
            <select
              value={visibleMemberId}
              onChange={(event) => filters.setSelectedMemberId(event.target.value)}
            >
              {data.members.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          ) : null}
        </div>

        <div className={styles.metrics}>
          <div className={styles.metricItem}>
            <span>월 합계</span>
            <strong>{createHoursLabel(totalHours)}</strong>
          </div>
          <div className={styles.metricItem}>
            <span>480분+</span>
            <strong>{over480Count}d</strong>
          </div>
        </div>

        <div className={styles.calendar}>
          {daysWithTotals.map((day) => (
            <div key={day.date} className={styles.calendarCell} data-state={day.state}>
              <strong>{day.day}</strong>
              <div>{day.minutes}분</div>
              <div>{day.tasks.length}건</div>
            </div>
          ))}
        </div>
      </PageSection>

      <PageSection title="일자별 상세">
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>일자</th>
                <th>작성건수</th>
                <th>총시간</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {daysWithTotals.map((day) => (
                <tr key={`row-${day.date}`}>
                  <td>{day.date}</td>
                  <td>{day.tasks.length}</td>
                  <td>{createHoursLabel(day.totalHours)}</td>
                  <td>{day.minutes >= 480 ? "480분 이상" : day.minutes > 0 ? "작성" : "미작성"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PageSection>
    </>
  );
}
