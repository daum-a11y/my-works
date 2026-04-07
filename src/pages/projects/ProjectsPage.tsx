import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { setDocumentTitle } from '../../router/navigation';
import { useAuth } from '../../auth/AuthContext';
import { PageHeader } from '../../components/shared/PageHeader';
import { PagePager } from '../../components/shared/PagePager';
import { PageResultBar } from '../../components/shared/PageResultBar';
import { PageSection } from '../../components/shared/PageSection';
import { PageSizeField } from '../../components/shared/PageSizeField';
import { dataClient } from '../../api/client';
import {
  PROJECTS_DEFAULT_PAGE_SIZE,
  PROJECTS_PAGE_SIZE_OPTIONS,
  PROJECTS_PAGE_TITLE,
} from './ProjectsPage.constants';
import { ProjectsFilterForm } from './ProjectsFilterForm';
import { ProjectsResultsTable } from './ProjectsResultsTable';
import type { ProjectFilterState } from './ProjectsPage.types';
import { createInitialProjectFilters } from './ProjectsPage.utils';
import '../../styles/domain/pages/projects-feature.scss';
const numberFormatter = new Intl.NumberFormat('ko-KR');

export function ProjectsPage() {
  const { session } = useAuth();
  const member = session?.member ?? null;
  const [filterDraft, setFilterDraft] = useState<ProjectFilterState>(createInitialProjectFilters);
  const [appliedFilters, setAppliedFilters] = useState<ProjectFilterState>(
    createInitialProjectFilters,
  );
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [pageSize, setPageSize] = useState<number>(PROJECTS_DEFAULT_PAGE_SIZE);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setDocumentTitle(PROJECTS_PAGE_TITLE);
  }, []);

  const query = useQuery({
    queryKey: ['projects', 'paged', appliedFilters, appliedSearch, currentPage, pageSize],
    enabled: Boolean(member),
    placeholderData: (previousData) => previousData,
    queryFn: async () =>
      dataClient.searchProjectsPage(appliedFilters, appliedSearch, currentPage, pageSize),
  });

  const projects = useMemo(() => query.data?.items ?? [], [query.data?.items]);

  const totalProjects = query.data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalProjects / pageSize));
  const currentPageSafe = Math.min(currentPage, totalPages);
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAppliedFilters(filterDraft);
    setAppliedSearch(searchInput);
    setCurrentPage(1);
  };

  const handleReset = () => {
    const initialFilters = createInitialProjectFilters();
    setFilterDraft(initialFilters);
    setAppliedFilters(initialFilters);
    setSearchInput('');
    setAppliedSearch('');
    setCurrentPage(1);
  };

  return (
    <section className="projects-feature projects-feature--shell">
      <PageHeader
        title="프로젝트 관리"
        actions={
          <Link to="/projects/new" className="projects-feature__header-action">
            프로젝트 추가
          </Link>
        }
      />

      <PageSection title="필터">
        <ProjectsFilterForm
          filterDraft={filterDraft}
          searchInput={searchInput}
          onSubmit={handleSearchSubmit}
          onReset={handleReset}
          onFilterDraftChange={setFilterDraft}
          onSearchInputChange={setSearchInput}
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
              currentPage={currentPageSafe}
              totalPages={totalPages}
              canGoPrevious={currentPageSafe > 1}
              canGoNext={currentPageSafe < totalPages && totalProjects > 0}
              onPrevious={() => setCurrentPage((page) => Math.max(1, page - 1))}
              onNext={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            />
            <p className="projects-feature__result-metric">
              <span className="projects-feature__result-label">총 건수</span>
              <strong className="projects-feature__result-value">
                {numberFormatter.format(totalProjects)}건
              </strong>
            </p>
          </>
        }
        controls={
          <PageSizeField
            className="projects-feature__page-size-field"
            aria-label="페이지당 행 수"
            value={pageSize}
            options={PROJECTS_PAGE_SIZE_OPTIONS}
            onValueChange={(next) => {
              setPageSize(next);
              setCurrentPage(1);
            }}
          />
        }
      />

      <ProjectsResultsTable projects={projects} />
    </section>
  );
}
