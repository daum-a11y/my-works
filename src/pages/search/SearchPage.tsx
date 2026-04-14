import { Pagination, Select } from 'krds-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { PageResultBar } from '../../components/shared/PageResultBar';
import { PageSection } from '../../components/shared/PageSection';
import { formatReportTaskUsedtime } from '../reports/reportUtils';
import { SEARCH_PAGE_SIZE_OPTIONS } from './SearchPage.constants';
import { SearchFilterForm } from './SearchFilterForm';
import { SearchResultsTable } from './SearchResultsTable';
import { useSearchPage } from './useSearchPage';
const numberFormatter = new Intl.NumberFormat('ko-KR');

export function SearchPage() {
  const page = useSearchPage();

  return (
    <section className="krds-page">
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
            <div aria-label="업무 내역 목록 페이지 이동">
              <span className="sr-only">
                {page.currentPageSafe}/ {page.totalPages}
              </span>
              <Pagination
                currentPage={page.currentPageSafe}
                totalPages={page.totalPages}
                onChange={page.setCurrentPage}
                prevLabel="이전 페이지"
                nextLabel="다음 페이지"
                disabled={
                  !(page.currentPageSafe > 1) &&
                  !(page.currentPageSafe < page.totalPages && page.totalReports > 0)
                }
              />
            </div>
            <p>
              <span>검색 결과</span>
              <strong>{numberFormatter.format(page.totalReports)}건</strong>
            </p>
            <p>
              <span>총 시간</span>
              <strong>{formatReportTaskUsedtime(page.totalMinutes)}</strong>
            </p>
          </>
        }
        controls={
          <>
            <strong className="sort-label">
              <label htmlFor="search-page-size">페이지당 행 수</label>
            </strong>
            <Select
              id="search-page-size"
              value={String(page.pageSize)}
              variant="sorting"
              size="small"
              options={SEARCH_PAGE_SIZE_OPTIONS.map((option) => ({
                value: String(option),
                label: `${option}개`,
              }))}
              onChange={(next) => {
                page.setPageSize(Number(next));
                page.setCurrentPage(1);
              }}
            />
          </>
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
