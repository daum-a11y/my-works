import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Member } from '../../types/domain';
import { dataClient } from '../../api/client';
import { setDocumentTitle } from '../../router/navigation';
import {
  PROJECTS_DEFAULT_PAGE_SIZE,
  PROJECTS_DEFAULT_SORT,
  PROJECTS_PAGE_TITLE,
} from './ProjectsPage.constants';
import type { ProjectFilterState } from './ProjectsPage.types';
import { createInitialProjectFilters, sortProjects } from './ProjectsPage.utils';
import { toProjectListRow } from './projectApiTransform';

export function useProjectsPage(member: Member | null) {
  const [filterDraft, setFilterDraft] = useState<ProjectFilterState>(createInitialProjectFilters);
  const [appliedFilters, setAppliedFilters] = useState<ProjectFilterState>(
    createInitialProjectFilters,
  );
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [sortState, setSortState] = useState(PROJECTS_DEFAULT_SORT);
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
      dataClient.searchProjectsPage(
        {
          startDate: appliedFilters.startDate || null,
          endDate: appliedFilters.endDate || null,
          query: appliedSearch || null,
        },
        currentPage,
        pageSize,
      ),
  });

  const pagedProjects = useMemo(
    () => ({
      items: (query.data?.items ?? []).map(toProjectListRow),
      totalCount: query.data?.totalCount ?? 0,
    }),
    [query.data],
  );
  const projects = useMemo(
    () => sortProjects(pagedProjects.items, sortState),
    [pagedProjects.items, sortState],
  );
  const totalProjects = pagedProjects.totalCount;
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

  return {
    currentPageSafe,
    filterDraft,
    handleReset,
    handleSearchSubmit,
    pageSize,
    projects,
    searchInput,
    setCurrentPage,
    setFilterDraft,
    setPageSize,
    setSearchInput,
    setSortState,
    sortState,
    totalPages,
    totalProjects,
  };
}
