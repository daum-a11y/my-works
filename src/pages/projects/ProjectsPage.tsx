import { Button, Pagination, Select } from 'krds-react';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { PageHeader } from '../../components/shared/PageHeader';
import { PageResultBar } from '../../components/shared/PageResultBar';
import { PageSection } from '../../components/shared/PageSection';
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
          <Button as={RouterLink} to="/projects/new" role="link" variant="primary" size="medium">
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
        aria-label="프로젝트 목록 요약"
        metrics={
          <>
            <div aria-label="프로젝트 목록 페이지 이동">
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
                  !(page.currentPageSafe < page.totalPages && page.totalProjects > 0)
                }
              />
            </div>
            <p>
              <span>총 건수</span>
              <strong>{numberFormatter.format(page.totalProjects)}건</strong>
            </p>
          </>
        }
        controls={
          <>
            <strong className="sort-label">
              <label htmlFor="projects-page-size">페이지당 행 수</label>
            </strong>
            <Select
              id="projects-page-size"
              value={String(page.pageSize)}
              variant="sorting"
              size="small"
              options={PROJECTS_PAGE_SIZE_OPTIONS.map((option) => ({
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

      <ProjectsResultsTable
        projects={page.projects}
        sortState={page.sortState}
        onSortChange={page.setSortState}
      />
    </section>
  );
}
