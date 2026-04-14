import { PageHeader } from '../../components/shared/PageHeader';
import { PagePager } from '../../components/shared/PagePager';
import { PageResultBar } from '../../components/shared/PageResultBar';
import { PageSection } from '../../components/shared/PageSection';
import { PageSizeField } from '../../components/shared/PageSizeField';
import { formatReportTaskUsedtime } from '../reports/reportUtils';
import { SEARCH_PAGE_SIZE_OPTIONS } from './SearchPage.constants';
import { SearchFilterForm } from './SearchFilterForm';
import { SearchResultsTable } from './SearchResultsTable';
import { useSearchPage } from './useSearchPage';
const numberFormatter = new Intl.NumberFormat('ko-KR');

export function SearchPage() {
  const page = useSearchPage();

  return (
    <section className="search-page page-shell">
      <PageHeader title="내 업무 내역" />

      <PageSection title="필터">
        <SearchFilterForm
          filterDraft={page.filterDraft}
          searchInput={page.searchInput}
          totalReports={page.totalReports}
          onSubmit={page.handleSearchSubmit}
          onReset={page.handleReset}
          onDownload={() => void page.handleDownload()}
          onFilterDraftChange={page.setFilterDraft}
          onSearchInputChange={page.setSearchInput}
        />
      </PageSection>

      <PageResultBar
        aria-label="업무 내역 목록 요약"
        metrics={
          <>
            <PagePager
              aria-label="업무 내역 목록 페이지 이동"
              currentPage={page.currentPageSafe}
              totalPages={page.totalPages}
              canGoPrevious={page.currentPageSafe > 1}
              canGoNext={page.currentPageSafe < page.totalPages && page.totalReports > 0}
              onPrevious={() => page.setCurrentPage((current) => Math.max(1, current - 1))}
              onNext={() =>
                page.setCurrentPage((current) => Math.min(page.totalPages, current + 1))
              }
            />
            <p className="page-result-bar__metric">
              <span className="page-result-bar__label">총 건수</span>
              <strong className="page-result-bar__value">
                {numberFormatter.format(page.totalReports)}건
              </strong>
            </p>
            <p className="page-result-bar__metric">
              <span className="page-result-bar__label">총 시간</span>
              <strong className="page-result-bar__value">
                {formatReportTaskUsedtime(page.totalMinutes)}
              </strong>
            </p>
          </>
        }
        controls={
          <PageSizeField
            aria-label="페이지당 행 수"
            value={page.pageSize}
            options={SEARCH_PAGE_SIZE_OPTIONS}
            onValueChange={(next) => {
              page.setPageSize(next);
              page.setCurrentPage(1);
            }}
          />
        }
      />

      <SearchResultsTable
        reports={page.sortedReports}
        sortState={page.sortState}
        onSortChange={page.setSortState}
      />
    </section>
  );
}
