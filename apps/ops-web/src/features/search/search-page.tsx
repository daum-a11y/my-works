import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "../auth/AuthContext";
import { opsDataClient } from "../../lib/data-client";
import type { Project, ProjectPage, ReportFilters, Task } from "../../lib/domain";
import {
  DEFAULT_REPORT_FILTERS,
  REPORT_TYPE1_OPTIONS,
  REPORT_TYPE2_OPTIONS,
  formatReportDate,
  formatReportHours,
  sortReportsDescending,
  type ReportRecord,
  type ReportType1,
  type ReportType2,
} from "../reports/report-domain";
import styles from "./search-page.module.css";

function toReportRecord(
  task: Task,
  member: { id: string; name: string },
  projectsById: Map<string, Project>,
  pagesById: Map<string, ProjectPage>,
): ReportRecord {
  const project = task.projectId ? projectsById.get(task.projectId) ?? null : null;
  const page = task.pageId ? pagesById.get(task.pageId) ?? null : null;

  return {
    id: task.id,
    ownerId: member.id,
    ownerName: member.name,
    reportDate: task.taskDate,
    projectId: task.projectId ?? "",
    pageId: task.pageId ?? "",
    projectName: project?.name ?? "",
    pageName: page?.title ?? "",
    type1: task.taskType1 as ReportType1,
    type2: task.taskType2 as ReportType2,
    workHours: task.hours,
    content: task.content,
    note: task.note,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

export function SearchPage() {
  const { session } = useAuth();
  const member = session?.member ?? null;
  const [filters, setFilters] = useState<ReportFilters>(DEFAULT_REPORT_FILTERS);

  const projectsQuery = useQuery({
    queryKey: ["search", "projects"],
    queryFn: async () => opsDataClient.getProjects(),
    enabled: Boolean(member),
  });

  const pagesQuery = useQuery({
    queryKey: ["search", "pages", member?.id],
    queryFn: async () => opsDataClient.getProjectPages(member!),
    enabled: Boolean(member),
  });

  const tasksQuery = useQuery({
    queryKey: ["search", "tasks", member?.id, filters],
    queryFn: async () => opsDataClient.searchTasks(member!, filters),
    enabled: Boolean(member),
  });

  const projects = projectsQuery.data ?? [];
  const pages = pagesQuery.data ?? [];
  const filterPages = useMemo(
    () => (filters.projectId ? pages.filter((page) => page.projectId === filters.projectId) : pages),
    [filters.projectId, pages],
  );

  const projectsById = useMemo(
    () => new Map(projects.map((project) => [project.id, project] as const)),
    [projects],
  );
  const pagesById = useMemo(
    () => new Map(pages.map((page) => [page.id, page] as const)),
    [pages],
  );

  const reports = useMemo(() => {
    if (!member) {
      return [];
    }

    return sortReportsDescending(
      (tasksQuery.data ?? []).map((task) => toReportRecord(task, member, projectsById, pagesById)),
    );
  }, [member, tasksQuery.data, projectsById, pagesById]);

  const totalHours = useMemo(
    () => reports.reduce((sum, report) => sum + report.workHours, 0),
    [reports],
  );

  const setFilterField = <K extends keyof ReportFilters>(key: K, value: ReportFilters[K]) => {
    setFilters((current: ReportFilters) => {
      if (key === "projectId") {
        return {
          ...current,
          projectId: value as ReportFilters["projectId"],
          pageId: "",
        };
      }

      return { ...current, [key]: value };
    });
  };

  const clearFilters = () => {
    setFilters(DEFAULT_REPORT_FILTERS);
  };

  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroMain}>
          <p className={styles.kicker}>개인 검색</p>
          <h1 className={styles.title}>내 보고서를 조건별로 빠르게 찾습니다.</h1>
          <p className={styles.description}>
            업무보고 원본을 바꾸지 않고, 실사용 필터만 남겨 필요한 기록을 바로 조회합니다.
          </p>
        </div>

        <div className={styles.heroAside} aria-label="검색 요약">
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>조회 결과</span>
            <strong className={`${styles.metricValue} tabularNums`}>{reports.length}</strong>
          </div>
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>합계 시간</span>
            <strong className={`${styles.metricValue} tabularNums`}>{formatReportHours(totalHours)}</strong>
          </div>
        </div>
      </header>

      <div className={styles.layout}>
        <aside className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <p className={styles.panelEyebrow}>필터</p>
              <h2 className={styles.panelTitle}>검색 조건</h2>
            </div>
            <button type="button" className={styles.secondaryButton} onClick={clearFilters}>
              초기화
            </button>
          </div>

          <form className={styles.filterGrid} aria-label="개인 보고서 검색 필터">
            <label className={styles.field}>
              <span>검색어</span>
              <input
                value={filters.query}
                onChange={(event) => setFilterField("query", event.target.value)}
                placeholder="내용, 메모"
              />
            </label>
            <label className={styles.field}>
              <span>프로젝트</span>
              <select
                value={filters.projectId}
                onChange={(event) => setFilterField("projectId", event.target.value)}
              >
                <option value="">전체</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span>페이지</span>
              <select
                value={filters.pageId}
                onChange={(event) => setFilterField("pageId", event.target.value)}
              >
                <option value="">전체</option>
                {filterPages.map((page) => (
                  <option key={page.id} value={page.id}>
                    {page.title}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span>유형 1</span>
              <select
                value={filters.taskType1}
                onChange={(event) => setFilterField("taskType1", event.target.value)}
              >
                <option value="">전체</option>
                {REPORT_TYPE1_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span>유형 2</span>
              <select
                value={filters.taskType2}
                onChange={(event) => setFilterField("taskType2", event.target.value)}
              >
                <option value="">전체</option>
                {REPORT_TYPE2_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span>시작일</span>
              <input
                type="date"
                value={filters.startDate}
                onChange={(event) => setFilterField("startDate", event.target.value)}
              />
            </label>
            <label className={styles.field}>
              <span>종료일</span>
              <input
                type="date"
                value={filters.endDate}
                onChange={(event) => setFilterField("endDate", event.target.value)}
              />
            </label>
            <label className={styles.field}>
              <span>최소 시간</span>
              <input
                type="number"
                min="0"
                step="0.5"
                value={filters.minHours}
                onChange={(event) => setFilterField("minHours", event.target.value)}
              />
            </label>
            <label className={styles.field}>
              <span>최대 시간</span>
              <input
                type="number"
                min="0"
                step="0.5"
                value={filters.maxHours}
                onChange={(event) => setFilterField("maxHours", event.target.value)}
              />
            </label>
          </form>
        </aside>

        <main className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <p className={styles.panelEyebrow}>결과</p>
              <h2 className={styles.panelTitle}>검색 결과</h2>
            </div>
            <p className={styles.status} aria-live="polite">
              {reports.length ? `${reports.length}건 조회됨` : "검색 결과 없음"}
            </p>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <caption className="srOnly">내 보고서 검색 결과</caption>
              <thead>
                <tr>
                  <th scope="col">일자</th>
                  <th scope="col">프로젝트 / 페이지</th>
                  <th scope="col">유형</th>
                  <th scope="col">시간</th>
                  <th scope="col">내용</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id}>
                    <td className="tabularNums">{formatReportDate(report.reportDate)}</td>
                    <td>
                      <strong>{report.projectName}</strong>
                      <span>{report.pageName}</span>
                    </td>
                    <td>
                      <strong>{report.type1}</strong>
                      <span>{report.type2}</span>
                    </td>
                    <td className="tabularNums">{formatReportHours(report.workHours)}</td>
                    <td>
                      <strong>{report.content}</strong>
                      {report.note ? <span>{report.note}</span> : <span>메모 없음</span>}
                    </td>
                  </tr>
                ))}
                {!reports.length && (
                  <tr>
                    <td colSpan={5} className={styles.emptyState}>
                      조건에 맞는 보고서가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </section>
  );
}

export default SearchPage;
