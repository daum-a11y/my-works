import { useAuth } from '../../auth/AuthContext';
import { KrdsRouterButtonLink } from '../../components/shared';
import { PageHeader } from '../../components/shared/PageHeader';
import { PagePager } from '../../components/shared/PagePager';
import { PageResultBar } from '../../components/shared/PageResultBar';
import { PageSection } from '../../components/shared/PageSection';
import { PageSizeField } from '../../components/shared/PageSizeField';
import { PROJECTS_PAGE_SIZE_OPTIONS } from './ProjectsPage.constants';
import { ProjectsFilterForm } from './ProjectsFilterForm';
import { ProjectsResultsTable } from './ProjectsResultsTable';
import { useProjectsPage } from './useProjectsPage';
const numberFormatter = new Intl.NumberFormat('ko-KR');

export function ProjectsPage() {
  const { session } = useAuth();
  const member = session?.member ?? null;
  const page = useProjectsPage(member);

  return (
    <section className="krds-page">
      <PageHeader
        title="프로젝트 관리"
        actions={
          <KrdsRouterButtonLink to="/projects/new" variant="primary" size="large">
            프로젝트 추가
          </KrdsRouterButtonLink>
        }
      />

      <PageSection title="필터">
        <ProjectsFilterForm
          filterDraft={page.filterDraft}
          searchInput={page.searchInput}
          onSubmit={page.handleSearchSubmit}
          onReset={page.handleReset}
          onFilterDraftChange={page.setFilterDraft}
          onSearchInputChange={page.setSearchInput}
        />
      </PageSection>

      <PageResultBar
        aria-label="프로젝트 목록 요약"
        metrics={
          <>
            <PagePager
              aria-label="프로젝트 목록 페이지 이동"
              currentPage={page.currentPageSafe}
              totalPages={page.totalPages}
              canGoPrevious={page.currentPageSafe > 1}
              canGoNext={page.currentPageSafe < page.totalPages && page.totalProjects > 0}
              onPrevious={() => page.setCurrentPage((current) => Math.max(1, current - 1))}
              onNext={() =>
                page.setCurrentPage((current) => Math.min(page.totalPages, current + 1))
              }
              onPageChange={page.setCurrentPage}
            />
            <p>
              <span>총 건수</span>
              <strong>
                {numberFormatter.format(page.totalProjects)}건
              </strong>
            </p>
          </>
        }
        controls={
          <PageSizeField
            value={page.pageSize}
            options={PROJECTS_PAGE_SIZE_OPTIONS}
            onValueChange={(next) => {
              page.setPageSize(next);
              page.setCurrentPage(1);
            }}
          />
        }
      />

      <ProjectsResultsTable
        projects={page.projects}
        sortState={page.sortState}
        onSortChange={page.setSortState}
      />
    </section>
  );
}
