import { Button } from 'krds-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { PageHeader } from '../../components/shared/PageHeader';
import { PagePager } from '../../components/shared/PagePager';
import { PageResultBar } from '../../components/shared/PageResultBar';
import { PageSection } from '../../components/shared/PageSection';
import { PageSizeField } from '../../components/shared/PageSizeField';
import { PROJECTS_PAGE_SIZE_OPTIONS } from './ProjectsPage.constants';
import { ProjectsFilterForm } from './ProjectsFilterForm';
import { ProjectsResultsTable } from './ProjectsResultsTable';
import { useProjectsPage } from './useProjectsPage';
import './ProjectsPage.css';
const numberFormatter = new Intl.NumberFormat('ko-KR');

export function ProjectsPage() {
  const { session } = useAuth();
  const member = session?.member ?? null;
  const page = useProjectsPage(member);

  return (
    <section className="projects-feature projects-feature--shell">
      <PageHeader
        title="프로젝트 관리"
        actions={
          <Button as={Link} to="/projects/new" variant="primary">
            프로젝트 추가
          </Button>
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
        className="projects-feature__result-bar"
        aria-label="프로젝트 목록 요약"
        metrics={
          <>
            <PagePager
              className="projects-feature__pager"
              aria-label="프로젝트 목록 페이지 이동"
              buttonClassName="projects-feature__page-button"
              statusClassName="projects-feature__page-status"
              currentPage={page.currentPageSafe}
              totalPages={page.totalPages}
              canGoPrevious={page.currentPageSafe > 1}
              canGoNext={page.currentPageSafe < page.totalPages && page.totalProjects > 0}
              onPrevious={() => page.setCurrentPage((current) => Math.max(1, current - 1))}
              onNext={() =>
                page.setCurrentPage((current) => Math.min(page.totalPages, current + 1))
              }
            />
            <p className="projects-feature__result-metric">
              <span className="projects-feature__result-label">총 건수</span>
              <strong className="projects-feature__result-value">
                {numberFormatter.format(page.totalProjects)}건
              </strong>
            </p>
          </>
        }
        controls={
          <PageSizeField
            className="projects-feature__page-size-field"
            aria-label="페이지당 행 수"
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
