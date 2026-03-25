import { useMemo } from "react";
import { PageSection } from "../../components/ui/PageSection";
import { createHoursLabel, filterTasksByMonth, shiftMonth, useResourceDataset, useResourceFilters } from "./resource-shared";
import styles from "./ResourcePage.module.css";

export function ResourceTypePage() {
  const query = useResourceDataset();
  const data = query.data;
  const filters = useResourceFilters(data?.member.id);

  const rows = useMemo(() => {
    const monthTasks = filterTasksByMonth(data?.tasks ?? [], filters.selectedMonth);
    const source = data?.member.role === "admin"
      ? monthTasks
      : monthTasks.filter((task) => task.memberId === data?.member.id);

    const grouped = new Map<string, { type1: string; type2: string; count: number; totalHours: number }>();
    for (const task of source) {
      const key = `${task.taskType1}::${task.taskType2}`;
      const current = grouped.get(key) ?? {
        type1: task.taskType1,
        type2: task.taskType2,
        count: 0,
        totalHours: 0,
      };
      current.count += 1;
      current.totalHours += task.hours;
      grouped.set(key, current);
    }

    return Array.from(grouped.values()).sort((left, right) => right.totalHours - left.totalHours);
  }, [data, filters.selectedMonth]);

  return (
    <PageSection title="타입별 요약" description="선택 월 기준 업무 타입별 건수와 시간을 집계합니다.">
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
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>업무유형 1</th>
              <th>업무유형 2</th>
              <th>건수</th>
              <th>총시간</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.type1}-${row.type2}`}>
                <td>{row.type1}</td>
                <td>{row.type2}</td>
                <td>{row.count}</td>
                <td>{createHoursLabel(row.totalHours)}</td>
              </tr>
            ))}
            {!rows.length ? (
              <tr>
                <td colSpan={4} className={styles.empty}>표시할 타입별 집계가 없습니다.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </PageSection>
  );
}
