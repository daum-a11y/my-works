import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { setDocumentTitle } from '../../router/navigation';
import { useAuth } from '../../auth/AuthContext';
import { PageSection } from '../../components/shared/PageSection';
import { dataClient } from '../../api/client';
import { formatDateLabel, getToday, parseLocalDateInput, toLocalDateInputValue } from '../../utils';
import '../../styles/domain/pages/projects-feature.scss';

interface ProjectFilterState {
  startDate: string;
  endDate: string;
}

function createInitialProjectFilters(): ProjectFilterState {
  const endDate = getToday();
  const end = parseLocalDateInput(endDate) ?? new Date();
  const start = new Date(end);
  start.setFullYear(start.getFullYear() - 1);

  return {
    startDate: toLocalDateInputValue(start),
    endDate,
  };
}

const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 50;
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
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setDocumentTitle('프로젝트 관리');
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
      <header className="projects-feature__page-header">
        <div className="projects-feature__page-header-top">
          <h1 className="projects-feature__title">프로젝트 관리</h1>
          <Link to="/projects/new" className="projects-feature__header-action">
            프로젝트 추가
          </Link>
        </div>
      </header>

      <PageSection title="필터">
        <form className="projects-feature__filter-bar" onSubmit={handleSearchSubmit}>
          <label className="projects-feature__filter-field">
            <span>시작일</span>
            <input
              type="date"
              value={filterDraft.startDate}
              onChange={(event) =>
                setFilterDraft((current) => ({ ...current, startDate: event.target.value }))
              }
            />
          </label>
          <label className="projects-feature__filter-field">
            <span>종료일</span>
            <input
              type="date"
              value={filterDraft.endDate}
              onChange={(event) =>
                setFilterDraft((current) => ({ ...current, endDate: event.target.value }))
              }
            />
          </label>
          <label className="projects-feature__filter-field">
            <span>검색어</span>
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="검색어 입력"
            />
          </label>
          <div className="projects-feature__filter-actions">
            <button type="submit" className="projects-feature__filter-button">
              검색
            </button>
            <button
              type="button"
              className="projects-feature__filter-button projects-feature__filter-button--secondary"
              onClick={handleReset}
            >
              초기화
            </button>
          </div>
        </form>
      </PageSection>

      <section className="projects-feature__result-bar" aria-label="프로젝트 목록 요약">
        <div className="projects-feature__result-metrics">
          <div className="projects-feature__pager" aria-label="프로젝트 목록 페이지 이동">
            <button
              type="button"
              className="projects-feature__page-button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPageSafe === 1}
              aria-label="이전 페이지"
            >
              이전
            </button>
            <p className="projects-feature__page-status">
              <strong>{currentPageSafe}</strong>
              <span>/ {numberFormatter.format(totalPages)}</span>
            </p>
            <button
              type="button"
              className="projects-feature__page-button"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={currentPageSafe === totalPages || totalProjects === 0}
              aria-label="다음 페이지"
            >
              다음
            </button>
          </div>
          <p className="projects-feature__result-metric">
            <span className="projects-feature__result-label">총 건수</span>
            <strong className="projects-feature__result-value">
              {numberFormatter.format(totalProjects)}건
            </strong>
          </p>
        </div>
        <div className="projects-feature__result-controls">
          <label className="projects-feature__page-size-field">
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

      <div className="projects-feature__table-wrap">
        <table className="projects-feature__table">
          <caption className="projects-feature__sr-only">프로젝트 리스트</caption>
          <thead>
            <tr>
              <th scope="col">타입1</th>
              <th scope="col">플랫폼</th>
              <th scope="col">서비스그룹</th>
              <th scope="col">프로젝트명</th>
              <th scope="col">페이지 수</th>
              <th scope="col">보고서URL</th>
              <th scope="col">QA시작일</th>
              <th scope="col">QA종료일</th>
              <th scope="col">리포터</th>
              <th scope="col">리뷰어</th>
              <th scope="col">수정</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => {
              return (
                <tr key={project.id}>
                  <td>{project.projectType1 || '-'}</td>
                  <td>{project.platform}</td>
                  <td>{project.serviceGroupName || '-'}</td>
                  <td>{project.name}</td>
                  <td>{project.pageCount}</td>
                  <td>
                    {project.reportUrl ? (
                      <a
                        href={project.reportUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="projects-feature__table-link"
                      >
                        링크
                      </a>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="projects-feature__date-cell">
                    {formatDateLabel(project.startDate)}
                  </td>
                  <td className="projects-feature__date-cell">
                    {formatDateLabel(project.endDate)}
                  </td>
                  <td>{project.reporterDisplay || '-'}</td>
                  <td>{project.reviewerDisplay || '-'}</td>
                  <td>
                    <Link
                      to={`/projects/${project.id}/edit`}
                      className="projects-feature__action-button"
                    >
                      수정
                    </Link>
                  </td>
                </tr>
              );
            })}
            {!projects.length ? (
              <tr>
                <td colSpan={11} className="projects-feature__empty-state">
                  검색 결과가 없습니다. 새 프로젝트를 등록하거나 기간을 조정하십시오.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default ProjectsPage;
