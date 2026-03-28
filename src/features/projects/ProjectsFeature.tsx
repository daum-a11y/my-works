import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { PageSection } from '../../components/ui/PageSection';
import { opsDataClient } from '../../lib/data-client';
import { type Member, type Project } from '../../lib/domain';
import {
  formatDateLabel,
  getToday,
  parseLocalDateInput,
  toLocalDateInputValue,
} from '../../lib/utils';
import styles from './ProjectsFeature.module.css';

interface ProjectFilterState {
  startDate: string;
  endDate: string;
}

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function memberName(memberId: string | null | undefined, membersById: Map<string, Member>) {
  if (!memberId) {
    return '-';
  }

  return membersById.get(memberId)?.name ?? '-';
}

function serviceGroupName(
  serviceGroupId: string | null | undefined,
  serviceGroupsById: Map<string, string>,
) {
  if (!serviceGroupId) {
    return '-';
  }

  return serviceGroupsById.get(serviceGroupId) ?? '-';
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

function matchesProjectDateRange(project: Project, filters: ProjectFilterState) {
  if (filters.startDate && project.endDate < filters.startDate) {
    return false;
  }

  if (filters.endDate && project.startDate > filters.endDate) {
    return false;
  }

  return true;
}

function projectSearchText(
  project: Project,
  serviceGroupLabel: string,
  reporterLabel: string,
  reviewerLabel: string,
) {
  return normalizeText(
    [
      project.projectType1,
      project.name,
      project.platform,
      serviceGroupLabel,
      reporterLabel,
      reviewerLabel,
      project.reportUrl,
      project.startDate,
      project.endDate,
    ].join(' '),
  );
}

function sortProjects(projects: Project[]) {
  return [...projects].sort(
    (left, right) =>
      right.startDate.localeCompare(left.startDate) || left.name.localeCompare(right.name, 'ko'),
  );
}

const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 50;
const numberFormatter = new Intl.NumberFormat('ko-KR');

export function ProjectsFeature() {
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

  const query = useQuery({
    queryKey: ['projects', member?.id],
    enabled: Boolean(member),
    queryFn: async () => {
      const [projects, pages, members, serviceGroups] = await Promise.all([
        opsDataClient.getProjects(),
        opsDataClient.getProjectPages(),
        opsDataClient.getMembers(),
        opsDataClient.getServiceGroups(),
      ]);
      return { projects, pages, members, serviceGroups };
    },
  });

  const projects = query.data?.projects ?? [];
  const pages = query.data?.pages ?? [];
  const members = query.data?.members ?? [];
  const serviceGroups = query.data?.serviceGroups ?? [];

  const membersById = useMemo(
    () => new Map(members.map((item) => [item.id, item] as const)),
    [members],
  );
  const serviceGroupsById = useMemo(
    () => new Map(serviceGroups.map((item) => [item.id, item.name] as const)),
    [serviceGroups],
  );
  const pageCountByProjectId = useMemo(() => {
    const counts = new Map<string, number>();

    pages.forEach((page) => {
      counts.set(page.projectId, (counts.get(page.projectId) ?? 0) + 1);
    });

    return counts;
  }, [pages]);

  const filteredProjects = useMemo(() => {
    const sorted = sortProjects(projects);
    const queryText = normalizeText(appliedSearch);

    return sorted.filter((project) => {
      if (!matchesProjectDateRange(project, appliedFilters)) {
        return false;
      }

      if (!queryText) {
        return true;
      }

      const groupLabel = serviceGroupName(project.serviceGroupId, serviceGroupsById);
      const reporterLabel = memberName(project.reporterMemberId, membersById);
      const reviewerLabel = memberName(project.reviewerMemberId, membersById);
      return projectSearchText(project, groupLabel, reporterLabel, reviewerLabel).includes(
        queryText,
      );
    });
  }, [appliedFilters, appliedSearch, membersById, projects, serviceGroupsById]);

  const totalProjects = filteredProjects.length;
  const totalPages = Math.max(1, Math.ceil(totalProjects / pageSize));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const pageStartIndex = totalProjects ? (currentPageSafe - 1) * pageSize : 0;
  const paginatedProjects = filteredProjects.slice(pageStartIndex, pageStartIndex + pageSize);
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
    <section className={styles.shell}>
      <header className={styles.pageHeader}>
        <div className={styles.pageHeaderTop}>
          <h1 className={styles.title}>프로젝트 관리</h1>
          <Link to="/projects/new" className={styles.headerAction}>
            프로젝트 추가
          </Link>
        </div>
      </header>

      <PageSection title="필터">
        <form className={styles.filterBar} onSubmit={handleSearchSubmit}>
          <label className={styles.filterField}>
            <span>시작일</span>
            <input
              type="date"
              value={filterDraft.startDate}
              onChange={(event) =>
                setFilterDraft((current) => ({ ...current, startDate: event.target.value }))
              }
            />
          </label>
          <label className={styles.filterField}>
            <span>종료일</span>
            <input
              type="date"
              value={filterDraft.endDate}
              onChange={(event) =>
                setFilterDraft((current) => ({ ...current, endDate: event.target.value }))
              }
            />
          </label>
          <label className={styles.filterField}>
            <span>검색어</span>
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="검색어 입력"
            />
          </label>
          <div className={styles.filterActions}>
            <button type="submit" className={styles.filterButton}>
              검색
            </button>
            <button type="button" className={styles.filterButtonSecondary} onClick={handleReset}>
              초기화
            </button>
          </div>
        </form>
      </PageSection>

      <section className={styles.resultBar} aria-label="프로젝트 목록 요약">
        <div className={styles.resultMetrics}>
          <div className={styles.pager} aria-label="프로젝트 목록 페이지 이동">
            <button
              type="button"
              className={styles.pageButton}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPageSafe === 1}
              aria-label="이전 페이지"
            >
              이전
            </button>
            <p className={styles.pageStatus}>
              <strong>{currentPageSafe}</strong>
              <span>/ {numberFormatter.format(totalPages)}</span>
            </p>
            <button
              type="button"
              className={styles.pageButton}
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={currentPageSafe === totalPages || totalProjects === 0}
              aria-label="다음 페이지"
            >
              다음
            </button>
          </div>
          <p className={styles.resultMetric}>
            <span className={styles.resultLabel}>총 건수</span>
            <strong className={styles.resultValue}>
              {numberFormatter.format(totalProjects)}건
            </strong>
          </p>
        </div>
        <div className={styles.resultControls}>
          <label className={styles.pageSizeField}>
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

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <caption className={styles.srOnly}>프로젝트 리스트</caption>
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
            {paginatedProjects.map((project) => {
              const groupLabel = serviceGroupName(project.serviceGroupId, serviceGroupsById);

              return (
                <tr key={project.id}>
                  <td>{project.projectType1 || '-'}</td>
                  <td>{project.platform}</td>
                  <td>{groupLabel}</td>
                  <td>{project.name}</td>
                  <td>{pageCountByProjectId.get(project.id) ?? 0}</td>
                  <td>
                    {project.reportUrl ? (
                      <a
                        href={project.reportUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.tableLink}
                      >
                        링크
                      </a>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className={styles.dateCell}>{formatDateLabel(project.startDate)}</td>
                  <td className={styles.dateCell}>{formatDateLabel(project.endDate)}</td>
                  <td>{memberName(project.reporterMemberId, membersById)}</td>
                  <td>{memberName(project.reviewerMemberId, membersById)}</td>
                  <td>
                    <Link to={`/projects/${project.id}/edit`} className={styles.actionButton}>
                      수정
                    </Link>
                  </td>
                </tr>
              );
            })}
            {!paginatedProjects.length ? (
              <tr>
                <td colSpan={11} className={styles.emptyState}>
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

export default ProjectsFeature;
