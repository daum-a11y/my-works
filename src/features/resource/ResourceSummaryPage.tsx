import { useMemo } from "react";
import { PageSection } from "../../components/ui/PageSection";
import { addDays } from "../../lib/utils";
import {
  buildProjectMaps,
  createHoursLabel,
  getServiceGroupName,
  useResourceDataset,
  useResourceFilters,
  useResourceLookups,
} from "./resource-shared";
import styles from "./ResourcePage.module.css";

export function ResourceSummaryPage() {
  const query = useResourceDataset();
  const data = query.data;
  const lookups = useResourceLookups(data);
  const filters = useResourceFilters(data?.member.id);

  const dailyTasks = useMemo(
    () => (data?.tasks ?? []).filter((task) => task.taskDate === filters.selectedDate),
    [data?.tasks, filters.selectedDate],
  );

  const rows = useMemo(() => {
    if (!data) {
      return [];
    }

    const { projectsById, serviceGroupsById } = buildProjectMaps(data.projects, data.serviceGroups);
    const visibleMembers =
      data.member.role === "admin"
        ? data.members
        : data.members.filter((item) => item.id === data.member.id);

    return visibleMembers.map((member) => {
      const tasks = dailyTasks.filter((task) => task.memberId === member.id);
      const totalHours = tasks.reduce((sum, task) => sum + task.hours, 0);
      const serviceNames = Array.from(
        new Set(tasks.map((task) => getServiceGroupName(task, projectsById, serviceGroupsById))),
      )
        .filter(Boolean)
        .join(", ");

      return {
        member,
        count: tasks.length,
        totalHours,
        serviceNames: serviceNames || "-",
      };
    });
  }, [dailyTasks, data]);

  return (
    <>
      <PageSection title="일간 작성현황" description="선택한 날짜 기준으로 사용자별 작성 건수와 시간을 확인합니다.">
        <div className={styles.toolbar}>
          <button type="button" onClick={() => filters.setSelectedDate(addDays(filters.selectedDate, -1))}>
            이전날
          </button>
          <input
            type="date"
            value={filters.selectedDate}
            onChange={(event) => filters.setSelectedDate(event.target.value)}
          />
          <button type="button" onClick={() => filters.setSelectedDate(addDays(filters.selectedDate, 1))}>
            다음날
          </button>
        </div>

        <div className={styles.metrics}>
          <article className={styles.metricCard}>
            <span>작성 건수</span>
            <strong>{dailyTasks.length}</strong>
          </article>
          <article className={styles.metricCard}>
            <span>합계 시간</span>
            <strong>{createHoursLabel(dailyTasks.reduce((sum, task) => sum + task.hours, 0))}</strong>
          </article>
        </div>

        {query.isLoading ? (
          <div className={styles.empty}>리소스 데이터를 불러오는 중입니다.</div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>사용자</th>
                  <th>작성건수</th>
                  <th>총시간</th>
                  <th>서비스 그룹</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.member.id}>
                    <td>
                      <strong>{row.member.name}</strong>
                      <div>{row.member.legacyUserId}</div>
                    </td>
                    <td>{row.count}</td>
                    <td>{createHoursLabel(row.totalHours)}</td>
                    <td>{row.serviceNames}</td>
                    <td>{row.count > 0 ? "작성" : "미작성"}</td>
                  </tr>
                ))}
                {!rows.length ? (
                  <tr>
                    <td colSpan={5} className={styles.empty}>표시할 작성현황이 없습니다.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </PageSection>

      <PageSection title="당일 업무 목록" description="선택한 날짜의 업무를 시간 순으로 표시합니다.">
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>사용자</th>
                <th>업무유형</th>
                <th>내용</th>
                <th>시간</th>
              </tr>
            </thead>
            <tbody>
              {dailyTasks.map((task) => (
                <tr key={task.id}>
                  <td>{lookups.membersById.get(task.memberId)?.name ?? "-"}</td>
                  <td>
                    <strong>{task.taskType1}</strong>
                    <div>{task.taskType2}</div>
                  </td>
                  <td>{task.content || "-"}</td>
                  <td>{createHoursLabel(task.hours)}</td>
                </tr>
              ))}
              {!dailyTasks.length ? (
                <tr>
                  <td colSpan={4} className={styles.empty}>선택한 날짜의 업무가 없습니다.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </PageSection>
    </>
  );
}
