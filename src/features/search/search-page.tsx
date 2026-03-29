import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { useAuth } from '../auth/AuthContext';
import { PageSection } from '../../components/ui/PageSection';
import { opsDataClient } from '../../lib/data-client';
import { downloadExcelFile } from '../../lib/excel-export';
import type { Project, ProjectPage, Task } from '../../lib/domain';
import { getToday, parseLocalDateInput, toLocalDateInputValue } from '../../lib/utils';
import {
  buildReportViewModel,
  DEFAULT_REPORT_FILTERS,
  formatReportDate,
  formatReportHours,
  sortReportsDescending,
  type ReportViewModel,
} from '../reports/report-domain';
import styles from './search-page.module.css';

interface SearchFilters {
  startDate: string;
  endDate: string;
}

function buildCurrentMonthFilters(): SearchFilters {
  const today = parseLocalDateInput(getToday()) ?? new Date();
  const startDate = new Date(today.getFullYear(), today.getMonth(), 1, 12, 0, 0, 0);
  const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 12, 0, 0, 0);

  return {
    startDate: toLocalDateInputValue(startDate),
    endDate: toLocalDateInputValue(endDate),
  };
}

function buildExportFilename(startDate: string, endDate: string) {
  const compact = (value: string) => value.replaceAll('-', '').slice(2);

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

  return '검색결과.xlsx';
}

function toReportRecord(
  task: Task,
  member: { id: string; name: string },
  projectsById: Map<string, Project>,
  pagesById: Map<string, ProjectPage>,
) {
  const project = task.projectId ? (projectsById.get(task.projectId) ?? null) : null;
  const page = task.pageId ? (pagesById.get(task.pageId) ?? null) : null;

  return {
    id: task.id,
    ownerId: member.id,
    ownerName: member.name,
    reportDate: task.taskDate,
    projectId: task.projectId ?? '',
    pageId: task.pageId ?? '',
    projectName: project?.name ?? '',
    pageName: page?.title ?? '',
    type1: task.taskType1 as ReportViewModel['type1'],
    type2: task.taskType2 as ReportViewModel['type2'],
    workHours: task.hours,
    content: task.content,
    note: task.note,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 25;
const numberFormatter = new Intl.NumberFormat('ko-KR');

export function SearchPage() {
  const { session } = useAuth();
  const member = session?.member ?? null;

  const [filterDraft, setFilterDraft] = useState<SearchFilters>(buildCurrentMonthFilters);
  const [appliedFilters, setAppliedFilters] = useState<SearchFilters>(buildCurrentMonthFilters);
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [currentPage, setCurrentPage] = useState(1);

  const projectsQuery = useQuery({
    queryKey: ['search', 'projects'],
    queryFn: async () => opsDataClient.getProjects(),
    enabled: Boolean(member),
  });

  const serviceGroupsQuery = useQuery({
    queryKey: ['search', 'service-groups'],
    queryFn: async () => opsDataClient.getServiceGroups(),
    enabled: Boolean(member),
  });

  const pagesQuery = useQuery({
    queryKey: ['search', 'pages', member?.id],
    queryFn: async () => opsDataClient.getProjectPages(member!),
    enabled: Boolean(member),
  });

  const tasksQuery = useQuery({
    queryKey: [
      'search',
      'tasks',
      member?.id,
      appliedFilters.startDate,
      appliedFilters.endDate,
      appliedSearch,
    ],
    queryFn: async () =>
      opsDataClient.searchTasks(member!, {
        ...DEFAULT_REPORT_FILTERS,
        query: appliedSearch,
        startDate: appliedFilters.startDate,
        endDate: appliedFilters.endDate,
      }),
    enabled: Boolean(member),
  });

  const projects = useMemo(() => projectsQuery.data ?? [], [projectsQuery.data]);
  const serviceGroups = useMemo(() => serviceGroupsQuery.data ?? [], [serviceGroupsQuery.data]);
  const pages = useMemo(() => pagesQuery.data ?? [], [pagesQuery.data]);
  const tasks = useMemo(() => tasksQuery.data ?? [], [tasksQuery.data]);

  const projectsById = useMemo(
    () => new Map(projects.map((project) => [project.id, project] as const)),
    [projects],
  );
  const pagesById = useMemo(() => new Map(pages.map((page) => [page.id, page] as const)), [pages]);
  const serviceGroupsById = useMemo(
    () => new Map(serviceGroups.map((group) => [group.id, group] as const)),
    [serviceGroups],
  );

  const reports = useMemo(() => {
    if (!member) {
      return [];
    }

    return tasks.map((task) =>
      buildReportViewModel(
        toReportRecord(task, member, projectsById, pagesById),
        projectsById,
        serviceGroupsById,
        pagesById,
      ),
    );
  }, [member, tasks, projectsById, pagesById, serviceGroupsById]);

  const sortedReports = useMemo(() => sortReportsDescending(reports), [reports]);
  const totalMinutes = useMemo(
    () => sortedReports.reduce((sum, report) => sum + report.workHours, 0),
    [sortedReports],
  );

  const totalReports = sortedReports.length;
  const totalPages = Math.max(1, Math.ceil(totalReports / pageSize));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const pageStartIndex = totalReports ? (currentPageSafe - 1) * pageSize : 0;
  const paginatedReports = sortedReports.slice(pageStartIndex, pageStartIndex + pageSize);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAppliedFilters(filterDraft);
    setAppliedSearch(searchInput.trim());
    setCurrentPage(1);
  };

  const handleReset = () => {
    const initialFilters = buildCurrentMonthFilters();
    setFilterDraft(initialFilters);
    setAppliedFilters(initialFilters);
    setSearchInput('');
    setAppliedSearch('');
    setPageSize(DEFAULT_PAGE_SIZE);
    setCurrentPage(1);
  };

  const handleDownload = () => {
    if (!appliedFilters.startDate) {
      window.alert('시작일을 지정해주세요.');
      return;
    }

    if (!appliedFilters.endDate) {
      window.alert('종료일을 지정해주세요.');
      return;
    }

    downloadExcelFile(
      buildExportFilename(appliedFilters.startDate, appliedFilters.endDate),
      '검색결과',
      sortedReports,
      [
        { header: '일자', value: (report) => formatReportDate(report.reportDate), width: 12 },
        { header: '타입1', value: (report) => report.type1, width: 12 },
        { header: '타입2', value: (report) => report.type2, width: 12 },
        { header: '플랫폼', value: (report) => report.platform || '-', width: 14 },
        { header: '서비스그룹', value: (report) => report.serviceGroupName || '-', width: 16 },
        { header: '서비스명', value: (report) => report.serviceName || '-', width: 18 },
        { header: '프로젝트명', value: (report) => report.projectDisplayName, width: 24 },
        { header: '페이지명', value: (report) => report.pageDisplayName || '-', width: 20 },
        { header: '내용', value: (report) => report.content || '-', width: 30 },
        { header: 'URL', value: (report) => report.pageUrl || '-', width: 32 },
        { header: '작업시간', value: (report) => formatReportHours(report.workHours), width: 12 },
        { header: '비고', value: (report) => report.note || '-', width: 24 },
      ],
    );
  };

  return (
    <section className={styles.shell}>
      <header className={styles.pageHeader}>
        <div className={styles.pageHeaderTop}>
          <h1 className={styles.title}>내 업무내역</h1>
        </div>
      </header>

      <PageSection title="필터">
        <form className={styles.filterBar} onSubmit={handleSearchSubmit}>
          <label className={styles.filterField}>
            <span>시작일</span>
            <input
              type="date"
              value={filterDraft.startDate}
              onChange={(event) =>
                setFilterDraft((current) => ({ ...current, startDate: event.target.value }))
              }
            />
          </label>
          <label className={styles.filterField}>
            <span>종료일</span>
            <input
              type="date"
              value={filterDraft.endDate}
              onChange={(event) =>
                setFilterDraft((current) => ({ ...current, endDate: event.target.value }))
              }
            />
          </label>
          <label className={styles.filterField}>
            <span>검색어</span>
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="프로젝트, 페이지, 내용, 비고 검색"
            />
          </label>
          <div className={styles.filterActions}>
            <button type="submit" className={styles.filterButton}>
              검색
            </button>
            <button type="button" className={styles.filterButtonSecondary} onClick={handleReset}>
              초기화
            </button>
            <span className={styles.filterDivider} aria-hidden="true" />
            <button
              type="button"
              className={styles.filterButtonSecondary}
              onClick={handleDownload}
              disabled={!sortedReports.length}
            >
              다운로드
            </button>
          </div>
        </form>
      </PageSection>

      <section className={styles.resultBar} aria-label="업무내역 목록 요약">
        <div className={styles.resultMetrics}>
          <div className={styles.pager} aria-label="업무내역 목록 페이지 이동">
            <button
              type="button"
              className={styles.pageButton}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPageSafe === 1}
              aria-label="이전 페이지"
            >
              이전
            </button>
            <p className={styles.pageStatus}>
              <strong>{currentPageSafe}</strong>
              <span>/ {numberFormatter.format(totalPages)}</span>
            </p>
            <button
              type="button"
              className={styles.pageButton}
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={currentPageSafe === totalPages || totalReports === 0}
              aria-label="다음 페이지"
            >
              다음
            </button>
          </div>
          <p className={styles.resultMetric}>
            <span className={styles.resultLabel}>검색기간</span>
            <strong className={styles.resultValue}>
              {formatReportDate(appliedFilters.startDate)} ~{' '}
              {formatReportDate(appliedFilters.endDate)}
            </strong>
          </p>
          <p className={styles.resultMetric}>
            <span className={styles.resultLabel}>총 건수</span>
            <strong className={styles.resultValue}>{numberFormatter.format(totalReports)}건</strong>
          </p>
          <p className={styles.resultMetric}>
            <span className={styles.resultLabel}>총 작업시간</span>
            <strong className={styles.resultValue}>{formatReportHours(totalMinutes)}</strong>
          </p>
        </div>
        <div className={styles.resultControls}>
          <label className={styles.pageSizeField}>
            <span>페이지당</span>
            <select
              value={String(pageSize)}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setCurrentPage(1);
              }}
              aria-label="페이지당 행 수"
            >
              {PAGE_SIZE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}행
                </option>
              ))}
            </select>
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
                <th scope="col">페이지명</th>
                <th scope="col">내용</th>
                <th scope="col">URL</th>
                <th scope="col">작업시간</th>
                <th scope="col">비고</th>
              </tr>
            </thead>
            <tbody>
              {paginatedReports.map((report) => (
                <tr key={report.id}>
                  <td className="tabularNums">{formatReportDate(report.reportDate)}</td>
                  <td>
                    <strong>{report.type1}</strong>
                  </td>
                  <td>
                    <strong>{report.type2}</strong>
                  </td>
                  <td>
                    <strong>{report.platform || '-'}</strong>
                  </td>
                  <td>
                    <strong>{report.serviceGroupName || '-'}</strong>
                  </td>
                  <td>
                    <strong>{report.serviceName || '-'}</strong>
                  </td>
                  <td>
                    <strong>{report.projectDisplayName}</strong>
                  </td>
                  <td>
                    <strong>{report.pageDisplayName || '-'}</strong>
                  </td>
                  <td>{report.content || '-'}</td>
                  <td>
                    {report.pageUrl ? (
                      <a href={report.pageUrl} target="_blank" rel="noreferrer">
                        링크
                      </a>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="tabularNums">{formatReportHours(report.workHours)}</td>
                  <td>{report.note || '-'}</td>
                </tr>
              ))}
              {!sortedReports.length ? (
                <tr>
                  <td colSpan={12} className={styles.emptyState}>
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
