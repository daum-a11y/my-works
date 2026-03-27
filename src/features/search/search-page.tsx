import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "../auth/AuthContext";
import { opsDataClient } from "../../lib/data-client";
import { downloadExcelFile } from "../../lib/excel-export";
import type { Project, ProjectPage, Task } from "../../lib/domain";
import {
  buildReportViewModel,
  DEFAULT_REPORT_FILTERS,
  formatReportDate,
  formatReportHours,
  getTodayInputValue,
  shiftDateInput,
  sortReportsDescending,
  type ReportViewModel,
} from "../reports/report-domain";
import styles from "./search-page.module.css";

interface SearchDraft {
  startDate: string;
  endDate: string;
}

function formatLongCompactDate(value: string) {
  return value ? value.replaceAll("-", "") : "";
}

function parseLongCompactDate(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.length === 8) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
  }

  return value;
}

function buildExportFilename(startDate: string, endDate: string) {
  const compact = (value: string) => value.replaceAll("-", "").slice(2);

  if (startDate && endDate && startDate === endDate) {
    return `${compact(startDate)}_검색결과.xlsx`;
  }

  if (startDate && endDate) {
    return `${compact(startDate)}~${compact(endDate)}_검색결과.xlsx`;
  }

  if (startDate && !endDate) {
    return `${compact(startDate)}~${compact(startDate)}_검색결과.xlsx`;
  }

  if (!startDate && endDate) {
    return `${compact(endDate)}~${compact(endDate)}_검색결과.xlsx`;
  }

  return "검색결과.xlsx";
}

function toReportRecord(
  task: Task,
  member: { id: string; name: string },
  projectsById: Map<string, Project>,
  pagesById: Map<string, ProjectPage>,
) {
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
    type1: task.taskType1 as ReportViewModel["type1"],
    type2: task.taskType2 as ReportViewModel["type2"],
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

  const [searchDraft, setSearchDraft] = useState<SearchDraft>({
    startDate: "",
    endDate: "",
  });
  const [appliedSearch, setAppliedSearch] = useState<SearchDraft>(searchDraft);

  const projectsQuery = useQuery({
    queryKey: ["search", "projects"],
    queryFn: async () => opsDataClient.getProjects(),
    enabled: Boolean(member),
  });

  const serviceGroupsQuery = useQuery({
    queryKey: ["search", "service-groups"],
    queryFn: async () => opsDataClient.getServiceGroups(),
    enabled: Boolean(member),
  });

  const pagesQuery = useQuery({
    queryKey: ["search", "pages", member?.id],
    queryFn: async () => opsDataClient.getProjectPages(member!),
    enabled: Boolean(member),
  });

  const tasksQuery = useQuery({
    queryKey: ["search", "tasks", member?.id, appliedSearch.startDate, appliedSearch.endDate],
    queryFn: async () =>
      opsDataClient.searchTasks(member!, {
        ...DEFAULT_REPORT_FILTERS,
        startDate: appliedSearch.startDate,
        endDate: appliedSearch.endDate,
      }),
    enabled: Boolean(member),
  });

  const projects = projectsQuery.data ?? [];
  const serviceGroups = serviceGroupsQuery.data ?? [];
  const pages = pagesQuery.data ?? [];
  const tasks = tasksQuery.data ?? [];

  const projectsById = useMemo(
    () => new Map(projects.map((project) => [project.id, project] as const)),
    [projects],
  );
  const pagesById = useMemo(
    () => new Map(pages.map((page) => [page.id, page] as const)),
    [pages],
  );
  const serviceGroupsById = useMemo(
    () => new Map(serviceGroups.map((group) => [group.id, group] as const)),
    [serviceGroups],
  );

  const reports = useMemo(() => {
    if (!member) {
      return [];
    }

    return tasks.map((task) =>
      buildReportViewModel(toReportRecord(task, member, projectsById, pagesById), projectsById, serviceGroupsById, pagesById),
    );
  }, [member, tasks, projectsById, pagesById, serviceGroupsById]);

  const sortedReports = useMemo(() => sortReportsDescending(reports), [reports]);
  const totalMinutes = useMemo(
    () => sortedReports.reduce((sum, report) => sum + report.workHours, 0),
    [sortedReports],
  );

  const runSearch = () => {
    setAppliedSearch(searchDraft);
  };

  const applyPresetDate = (offsetDays: number) => {
    const date = shiftDateInput(getTodayInputValue(), offsetDays);
    const nextDraft = { startDate: date, endDate: date };
    setSearchDraft(nextDraft);
    setAppliedSearch(nextDraft);
  };

  const handleDownload = () => {
    if (!appliedSearch.startDate) {
      window.alert("시작일을 지정해주세요.");
      return;
    }

    if (!appliedSearch.endDate) {
      window.alert("종료일을 지정해주세요.");
      return;
    }

    downloadExcelFile(buildExportFilename(appliedSearch.startDate, appliedSearch.endDate), "검색결과", sortedReports, [
      { header: "일자", value: (report) => formatReportDate(report.reportDate), width: 12 },
      { header: "타입1", value: (report) => report.type1, width: 12 },
      { header: "타입2", value: (report) => report.type2, width: 12 },
      { header: "플랫폼", value: (report) => report.platform || "-", width: 14 },
      { header: "서비스그룹", value: (report) => report.serviceGroupName || "-", width: 16 },
      { header: "서비스명", value: (report) => report.serviceName || "-", width: 18 },
      { header: "프로젝트명", value: (report) => report.projectDisplayName, width: 24 },
      { header: "페이지&내용", value: (report) => `${report.pageDisplayName} ${report.content}`.trim(), width: 36 },
      { header: "URL", value: (report) => report.pageUrl || "-", width: 32 },
      { header: "총시간", value: (report) => formatReportHours(report.workHours), width: 12 },
      { header: "비고", value: (report) => report.note || "-", width: 24 },
    ]);
  };

  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroMain}>
          <h1 className={styles.title}>업무보고 검색</h1>
        </div>
      </header>

      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <div>
            <h2 className={styles.panelTitle}>일자별 등록 업무 검색</h2>
          </div>
          <div className={styles.toolbarActions}>
            <button type="button" className={styles.secondaryButton} onClick={() => applyPresetDate(-1)}>
              어제
            </button>
            <button type="button" className={styles.secondaryButton} onClick={() => applyPresetDate(0)}>
              오늘
            </button>
            <button type="button" className={styles.primaryButton} onClick={runSearch}>
              검색
            </button>
            <button type="button" className={styles.secondaryButton} onClick={handleDownload} disabled={!sortedReports.length}>
              다운로드
            </button>
          </div>
        </div>

        <div className={styles.searchGrid}>
          <label className={styles.field}>
            <span>시작일</span>
            <input
              type="text"
              placeholder="YYYYMMDD"
              value={formatLongCompactDate(searchDraft.startDate)}
              onChange={(event) => setSearchDraft((current) => ({ ...current, startDate: parseLongCompactDate(event.target.value) }))}
            />
          </label>

          <label className={styles.field}>
            <span>종료일</span>
            <input
              type="text"
              placeholder="YYYYMMDD"
              value={formatLongCompactDate(searchDraft.endDate)}
              onChange={(event) => setSearchDraft((current) => ({ ...current, endDate: parseLongCompactDate(event.target.value) }))}
            />
          </label>
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <div>
            <h2 className={styles.panelTitle}>업무 리스트</h2>
          </div>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <caption className={styles.srOnly}>업무 리스트 테이블</caption>
            <thead>
              <tr>
                <th scope="col">일자</th>
                <th scope="col">타입1</th>
                <th scope="col">타입2</th>
                <th scope="col">플랫폼</th>
                <th scope="col">서비스그룹</th>
                <th scope="col">서비스명</th>
                <th scope="col">프로젝트명</th>
                <th scope="col">페이지명&amp;내용</th>
                <th scope="col">URL</th>
                <th scope="col">총시간</th>
                <th scope="col">비고</th>
              </tr>
            </thead>
            <tbody>
              {sortedReports.map((report) => (
                <tr key={report.id}>
                  <td className="tabularNums">{formatReportDate(report.reportDate)}</td>
                  <td>
                    <strong>{report.type1}</strong>
                  </td>
                  <td>
                    <strong>{report.type2}</strong>
                  </td>
                  <td>
                    <strong>{report.platform || "-"}</strong>
                  </td>
                  <td>
                    <strong>{report.serviceGroupName || "-"}</strong>
                  </td>
                  <td>
                    <strong>{report.serviceName || "-"}</strong>
                  </td>
                  <td>
                    <strong>{report.projectDisplayName}</strong>
                  </td>
                  <td>
                    <strong>{report.pageDisplayName}</strong>
                    <span>{report.content || "-"}</span>
                  </td>
                  <td>
                    {report.pageUrl ? (
                      <a href={report.pageUrl} target="_blank" rel="noreferrer">
                        링크
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="tabularNums">{formatReportHours(report.workHours)}</td>
                  <td>{report.note || "-"}</td>
                </tr>
              ))}
              {sortedReports.length ? (
                <tr>
                  <td colSpan={9} className={styles.emptyState}>
                    {formatReportDate(appliedSearch.startDate)} ~ {formatReportDate(appliedSearch.endDate)}
                  </td>
                  <td className="tabularNums">{formatReportHours(totalMinutes)}</td>
                  <td />
                </tr>
              ) : null}
              {!sortedReports.length ? (
                <tr>
                  <td colSpan={11} className={styles.emptyState}>
                    검색 결과가 없습니다.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
