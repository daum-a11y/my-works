import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { setDocumentTitle } from '../../app/navigation';
import { useAuth } from '../auth/AuthContext';
import { PageSection } from '../../components/common/PageSection';
import { opsDataClient } from '../../lib/dataClient';
import { downloadExcelFile } from '../../lib/excelExport';
import { getToday, parseLocalDateInput, toLocalDateInputValue } from '../../lib/utils';
import {
  DEFAULT_REPORT_FILTERS,
  formatReportDate,
  formatReportTaskUsedtime,
} from '../reports/reportDomain';
import '../../styles/domain/pages/search-page.scss';

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

function isDownloadRangeWithinThreeMonths(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return false;
  }

  const maxEnd = new Date(start);
  maxEnd.setMonth(maxEnd.getMonth() + 3);
  return end <= maxEnd;
}

const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 25;
const numberFormatter = new Intl.NumberFormat('ko-KR');

function sortSearchRows<T extends { taskDate: string; updatedAt: string; id: string }>(items: T[]) {
  return [...items].sort(
    (left, right) =>
      right.taskDate.localeCompare(left.taskDate) ||
      right.updatedAt.localeCompare(left.updatedAt) ||
      right.id.localeCompare(left.id),
  );
}

export function SearchPage() {
  const { session } = useAuth();
  const member = session?.member ?? null;

  const [filterDraft, setFilterDraft] = useState<SearchFilters>(buildCurrentMonthFilters);
  const [appliedFilters, setAppliedFilters] = useState<SearchFilters>(buildCurrentMonthFilters);
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setDocumentTitle('내 업무내역');
  }, []);

  const tasksQuery = useQuery({
    queryKey: [
      'search',
      'tasks',
      member?.id,
      appliedFilters.startDate,
      appliedFilters.endDate,
      appliedSearch,
      currentPage,
      pageSize,
    ],
    queryFn: async () =>
      opsDataClient.searchTasksPage(
        member!,
        {
          ...DEFAULT_REPORT_FILTERS,
          query: appliedSearch,
          startDate: appliedFilters.startDate,
          endDate: appliedFilters.endDate,
        },
        currentPage,
        pageSize,
      ),
    enabled: Boolean(member),
  });

  const tasks = useMemo(() => tasksQuery.data?.items ?? [], [tasksQuery.data]);
  const sortedReports = useMemo(() => sortSearchRows(tasks), [tasks]);
  const totalMinutes = useMemo(
    () => sortedReports.reduce((sum, report) => sum + report.taskUsedtime, 0),
    [sortedReports],
  );

  const totalReports = tasksQuery.data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalReports / pageSize));
  const currentPageSafe = Math.min(currentPage, totalPages);

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

  const handleDownload = async () => {
    if (!member) {
      return;
    }

    if (!appliedFilters.startDate) {
      window.alert('시작일을 지정해주세요.');
      return;
    }

    if (!appliedFilters.endDate) {
      window.alert('종료일을 지정해주세요.');
      return;
    }

    if (!isDownloadRangeWithinThreeMonths(appliedFilters.startDate, appliedFilters.endDate)) {
      window.alert('다운로드 기간은 최대 3개월까지 가능합니다.');
      return;
    }

    const downloadTasks = await opsDataClient.exportTasks(member, {
      ...DEFAULT_REPORT_FILTERS,
      query: appliedSearch,
      startDate: appliedFilters.startDate,
      endDate: appliedFilters.endDate,
    });
    await downloadExcelFile(
      buildExportFilename(appliedFilters.startDate, appliedFilters.endDate),
      '검색결과',
      sortSearchRows(downloadTasks),
      [
        { header: '일자', value: (report) => formatReportDate(report.taskDate), width: 12 },
        { header: '청구그룹', value: (report) => report.costGroupName || '-', width: 16 },
        { header: '타입1', value: (report) => report.taskType1, width: 12 },
        { header: '타입2', value: (report) => report.taskType2, width: 12 },
        { header: '플랫폼', value: (report) => report.platform || '-', width: 14 },
        { header: '서비스그룹', value: (report) => report.serviceGroupName || '-', width: 16 },
        { header: '서비스명', value: (report) => report.serviceName || '-', width: 18 },
        { header: '프로젝트명', value: (report) => report.projectDisplayName, width: 24 },
        { header: '페이지명', value: (report) => report.pageDisplayName || '-', width: 20 },
        { header: '내용', value: (report) => report.content || '-', width: 30 },
        { header: 'URL', value: (report) => report.pageUrl || '-', width: 32 },
        {
          header: '작업시간',
          value: (report) => formatReportTaskUsedtime(report.taskUsedtime),
          width: 12,
        },
        { header: '비고', value: (report) => report.note || '-', width: 24 },
      ],
    );
  };

  return (
    <section className="search-page search-page--shell">
      <header className="search-page__page-header">
        <div className="search-page__page-header-top">
          <h1 className="search-page__title">내 업무내역</h1>
        </div>
      </header>

      <PageSection title="필터">
        <form className="search-page__filter-bar" onSubmit={handleSearchSubmit}>
          <label className="search-page__filter-field">
            <span>시작일</span>
            <input
              type="date"
              value={filterDraft.startDate}
              onChange={(event) =>
                setFilterDraft((current) => ({ ...current, startDate: event.target.value }))
              }
            />
          </label>
          <label className="search-page__filter-field">
            <span>종료일</span>
            <input
              type="date"
              value={filterDraft.endDate}
              onChange={(event) =>
                setFilterDraft((current) => ({ ...current, endDate: event.target.value }))
              }
            />
          </label>
          <label className="search-page__filter-field">
            <span>검색어</span>
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="프로젝트, 페이지, 내용, 비고 검색"
            />
          </label>
          <div className="search-page__filter-actions">
            <button type="submit" className="search-page__filter-button">
              검색
            </button>
            <button
              type="button"
              className="search-page__filter-button search-page__filter-button--secondary"
              onClick={handleReset}
            >
              초기화
            </button>
            <span className="search-page__filter-divider" aria-hidden="true" />
            <button
              type="button"
              className="search-page__filter-button search-page__filter-button--secondary"
              onClick={handleDownload}
              disabled={!totalReports}
            >
              다운로드
            </button>
          </div>
        </form>
      </PageSection>

      <section className="search-page__result-bar" aria-label="업무내역 목록 요약">
        <div className="search-page__result-metrics">
          <div className="search-page__pager" aria-label="업무내역 목록 페이지 이동">
            <button
              type="button"
              className="search-page__page-button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPageSafe === 1}
              aria-label="이전 페이지"
            >
              이전
            </button>
            <p className="search-page__page-status">
              <strong>{currentPageSafe}</strong>
              <span>/ {numberFormatter.format(totalPages)}</span>
            </p>
            <button
              type="button"
              className="search-page__page-button"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={currentPageSafe === totalPages || totalReports === 0}
              aria-label="다음 페이지"
            >
              다음
            </button>
          </div>
          <p className="search-page__result-metric">
            <span className="search-page__result-label">총 건수</span>
            <strong className="search-page__result-value">
              {numberFormatter.format(totalReports)}건
            </strong>
          </p>
          <p className="search-page__result-metric">
            <span className="search-page__result-label">현재 페이지 작업시간</span>
            <strong className="search-page__result-value">
              {formatReportTaskUsedtime(totalMinutes)}
            </strong>
          </p>
        </div>
        <div className="search-page__result-controls">
          <label className="search-page__page-size-field">
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

      <section className="search-page__panel">
        <div className="search-page__table-wrap">
          <table className="search-page__table">
            <caption className="search-page__sr-only">업무 리스트 테이블</caption>
            <thead>
              <tr>
                <th scope="col">일자</th>
                <th scope="col">청구그룹</th>
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
              {sortedReports.map((report) => (
                <tr key={report.id}>
                  <td className="search-page__table-number">{formatReportDate(report.taskDate)}</td>
                  <td>
                    <strong>{report.costGroupName || '-'}</strong>
                  </td>
                  <td>
                    <strong>{report.taskType1}</strong>
                  </td>
                  <td>
                    <strong>{report.taskType2}</strong>
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
                  <td className="search-page__table-number">
                    {formatReportTaskUsedtime(report.taskUsedtime)}
                  </td>
                  <td>{report.note || '-'}</td>
                </tr>
              ))}
              {!sortedReports.length ? (
                <tr>
                  <td colSpan={13} className="search-page__empty-state">
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
