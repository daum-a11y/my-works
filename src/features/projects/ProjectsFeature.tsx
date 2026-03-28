import { type FormEvent, useMemo, useState } from 'react';
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

function projectSearchText(project: Project, serviceGroupLabel: string) {
  return normalizeText(
    [
      project.name,
      project.platform,
      serviceGroupLabel,
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

export function ProjectsFeature() {
  const { session } = useAuth();
  const member = session?.member ?? null;
  const [filterDraft, setFilterDraft] = useState<ProjectFilterState>(createInitialProjectFilters);
  const [appliedFilters, setAppliedFilters] = useState<ProjectFilterState>(
    createInitialProjectFilters,
  );
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');

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
      return projectSearchText(project, groupLabel).includes(queryText);
    });
  }, [appliedFilters, appliedSearch, projects, serviceGroupsById]);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAppliedFilters(filterDraft);
    setAppliedSearch(searchInput);
  };

  const handleReset = () => {
    const initialFilters = createInitialProjectFilters();
    setFilterDraft(initialFilters);
    setAppliedFilters(initialFilters);
    setSearchInput('');
    setAppliedSearch('');
  };

  return (
    <section className={styles.shell}>
      <header className={styles.hero}>
        <div className={styles.heroTop}>
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
            <span>프로젝트명</span>
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="프로젝트명 입력"
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
            {filteredProjects.map((project) => {
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
            {!filteredProjects.length ? (
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
