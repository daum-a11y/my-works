import { useMemo, useState } from "react";
import { PageSection } from "../../components/ui/PageSection";
import { buildProjectMaps, createHoursLabel, filterTasksByMonth, getServiceGroupName, shiftMonth, useResourceDataset } from "./resource-shared";
import styles from "./ResourcePage.module.css";

export function ResourceServicePage() {
  const query = useResourceDataset();
  const data = query.data;
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const rows = useMemo(() => {
    if (!data) {
      return [];
    }

    const source = filterTasksByMonth(data.tasks, month);
    const visible = data.member.role === "admin"
      ? source
      : source.filter((task) => task.memberId === data.member.id);
    const { projectsById, serviceGroupsById } = buildProjectMaps(data.projects, data.serviceGroups);
    const grouped = new Map<string, { serviceGroupName: string; projectName: string; count: number; totalHours: number }>();

    for (const task of visible) {
      const serviceGroupName = getServiceGroupName(task, projectsById, serviceGroupsById);
      const projectName = task.projectId ? projectsById.get(task.projectId)?.name ?? "미분류 프로젝트" : "미분류 프로젝트";
      const key = `${serviceGroupName}::${projectName}`;
      const current = grouped.get(key) ?? {
        serviceGroupName,
        projectName,
        count: 0,
        totalHours: 0,
      };
      current.count += 1;
      current.totalHours += task.hours;
      grouped.set(key, current);
    }

    return Array.from(grouped.values()).sort((left, right) => right.totalHours - left.totalHours);
  }, [data, month]);

  return (
    <PageSection title="그룹별 요약">
      <div className={styles.toolbar}>
        <button type="button" onClick={() => setMonth(shiftMonth(month, -1))}>
          이전달
        </button>
        <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
        <button type="button" onClick={() => setMonth(shiftMonth(month, 1))}>
          다음달
        </button>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>서비스 그룹</th>
              <th>프로젝트</th>
              <th>건수</th>
              <th>총시간</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.serviceGroupName}-${row.projectName}`}>
                <td>{row.serviceGroupName}</td>
                <td>{row.projectName}</td>
                <td>{row.count}</td>
                <td>{createHoursLabel(row.totalHours)}</td>
              </tr>
            ))}
            {!rows.length ? (
              <tr>
                <td colSpan={4} className={styles.empty}>표시할 그룹별 집계가 없습니다.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </PageSection>
  );
}
