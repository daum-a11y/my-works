import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { setDocumentTitle } from '../../router/navigation';
import { useAuth } from '../../auth/AuthContext';
import { PageHeader } from '../../components/shared/PageHeader';
import { PagePager } from '../../components/shared/PagePager';
import { PageResultBar } from '../../components/shared/PageResultBar';
import { PageSection } from '../../components/shared/PageSection';
import { PageSizeField } from '../../components/shared/PageSizeField';
import { dataClient } from '../../api/client';
import { downloadExcelFile } from '../../utils/excel';
import {
  DEFAULT_REPORT_FILTERS,
  formatReportDate,
  formatReportTaskUsedtime,
} from '../reports/reportUtils';
import {
  SEARCH_DEFAULT_PAGE_SIZE,
  SEARCH_PAGE_SIZE_OPTIONS,
  SEARCH_PAGE_TITLE,
} from './SearchPage.constants';
import type { SearchFilters } from './SearchPage.types';
import { SearchFilterForm } from './SearchFilterForm';
import { SearchResultsTable } from './SearchResultsTable';
import {
  buildCurrentMonthFilters,
  buildExportFilename,
  isDownloadRangeWithinThreeMonths,
  sortSearchRows,
} from './SearchPage.utils';
import '../../styles/domain/pages/search-page.scss';
const numberFormatter = new Intl.NumberFormat('ko-KR');

export function SearchPage() {
  const { session } = useAuth();
  const member = session?.member ?? null;

  const [filterDraft, setFilterDraft] = useState<SearchFilters>(buildCurrentMonthFilters);
  const [appliedFilters, setAppliedFilters] = useState<SearchFilters>(buildCurrentMonthFilters);
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [pageSize, setPageSize] = useState<number>(SEARCH_DEFAULT_PAGE_SIZE);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setDocumentTitle(SEARCH_PAGE_TITLE);
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
      dataClient.searchTasksPage(
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
    setPageSize(SEARCH_DEFAULT_PAGE_SIZE);
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

    const downloadTasks = await dataClient.exportTasks(member, {
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
      <PageHeader title="내 업무내역" />

      <PageSection title="필터">
        <SearchFilterForm
          filterDraft={filterDraft}
          searchInput={searchInput}
          totalReports={totalReports}
          onSubmit={handleSearchSubmit}
          onReset={handleReset}
          onDownload={() => void handleDownload()}
          onFilterDraftChange={setFilterDraft}
          onSearchInputChange={setSearchInput}
        />
      </PageSection>

      <PageResultBar
        className="search-page__result-bar"
        aria-label="업무내역 목록 요약"
        metrics={
          <>
            <PagePager
              className="search-page__pager"
              aria-label="업무내역 목록 페이지 이동"
              buttonClassName="search-page__page-button"
              statusClassName="search-page__page-status"
              currentPage={currentPageSafe}
              totalPages={totalPages}
              canGoPrevious={currentPageSafe > 1}
              canGoNext={currentPageSafe < totalPages && totalReports > 0}
              onPrevious={() => setCurrentPage((page) => Math.max(1, page - 1))}
              onNext={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            />
            <p className="search-page__result-metric">
              <span className="search-page__result-label">총 건수</span>
              <strong className="search-page__result-value">
                {numberFormatter.format(totalReports)}건
              </strong>
            </p>
            <p className="search-page__result-metric">
              <span className="search-page__result-label">총 시간</span>
              <strong className="search-page__result-value">
                {formatReportTaskUsedtime(totalMinutes)}
              </strong>
            </p>
          </>
        }
        controls={
          <PageSizeField
            className="search-page__page-size-field"
            aria-label="페이지당 행 수"
            value={pageSize}
            options={SEARCH_PAGE_SIZE_OPTIONS}
            onValueChange={(next) => {
              setPageSize(next);
              setCurrentPage(1);
            }}
          />
        }
      />

      <SearchResultsTable reports={sortedReports} />
    </section>
  );
}
