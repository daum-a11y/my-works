import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { setDocumentTitle } from '../../../router/navigation';
import { PageSection } from '../../../components/shared/PageSection';
import { downloadExcelFile } from '../../../utils/excel';
import { toLocalDateInputValue } from '../../../utils';
import { adminDataClient } from '../../../api/admin';
import type {
  AdminCostGroupItem,
  AdminProjectOption,
  AdminTaskSearchFilters,
  MemberAdminItem,
} from '../types';
import {
  ADMIN_REPORTS_DEFAULT_PAGE_SIZE,
  ADMIN_REPORTS_DEFAULT_SORT,
  ADMIN_REPORTS_PAGE_SIZE_OPTIONS,
  ADMIN_REPORTS_PAGE_TITLE,
} from './AdminReportsPage.constants';
import type { SortState } from './AdminReportsPage.types';
import { AdminReportsSortButton } from './AdminReportsSortButton';
import {
  buildExportFilename,
  formatSummaryMinutes,
  formatTimeCell,
  getTaskType1Options,
  getTaskType2Options,
  isDownloadRangeWithinThreeMonths,
  sortTasks,
} from './AdminReportsPage.utils';
import '../../../styles/domain/pages/admin-reports-page.scss';
const numberFormatter = new Intl.NumberFormat('ko-KR');

export function AdminReportsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<AdminTaskSearchFilters>(() => createDefaultFilters());
  const [appliedFilters, setAppliedFilters] = useState<AdminTaskSearchFilters>(() =>
    createDefaultFilters(),
  );
  const [memberFilterIds, setMemberFilterIds] = useState<string[]>([]);
  const [appliedMemberFilterIds, setAppliedMemberFilterIds] = useState<string[]>([]);
  const [sortState, setSortState] = useState<SortState>(ADMIN_REPORTS_DEFAULT_SORT);
  const [localMutationError, setLocalMutationError] = useState('');
  const [memberFilterOpen, setMemberFilterOpen] = useState(false);
  const [memberSearchInput, setMemberSearchInput] = useState('');
  const [pageSize, setPageSize] = useState<number>(ADMIN_REPORTS_DEFAULT_PAGE_SIZE);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setDocumentTitle(ADMIN_REPORTS_PAGE_TITLE);
  }, []);

  const membersQuery = useQuery({
    queryKey: ['admin', 'members'],
    queryFn: () => adminDataClient.listMembersAdmin(),
  });
  const taskTypesQuery = useQuery({
    queryKey: ['admin', 'task-types'],
    queryFn: () => adminDataClient.listTaskTypes(),
  });
  const costGroupsQuery = useQuery({
    queryKey: ['admin', 'cost-groups'],
    queryFn: () => adminDataClient.listCostGroups(),
  });
  const projectsQuery = useQuery({
    queryKey: ['admin', 'report-project-options', filters.costGroupId],
    queryFn: () =>
      filters.costGroupId
        ? adminDataClient.searchReportProjectsAdmin({
            costGroupId: filters.costGroupId,
            platform: '',
            projectType1: '',
            query: '',
          })
        : Promise.resolve([]),
    enabled: Boolean(filters.costGroupId),
  });
  const searchQuery = useQuery({
    queryKey: ['admin', 'task-search', appliedFilters, currentPage, pageSize],
    queryFn: () => adminDataClient.searchTasksAdmin(appliedFilters, currentPage, pageSize),
  });

  const members = useMemo(() => {
    const items = membersQuery.data ?? [];
    const seen = new Set<string>();

    return items.filter((member) => {
      if (seen.has(member.id)) {
        return false;
      }

      seen.add(member.id);
      return true;
    });
  }, [membersQuery.data]);
  const taskTypes = useMemo(() => taskTypesQuery.data ?? [], [taskTypesQuery.data]);
  const costGroups = useMemo(() => costGroupsQuery.data ?? [], [costGroupsQuery.data]);
  const projects = useMemo(() => projectsQuery.data ?? [], [projectsQuery.data]);
  const tasks = useMemo(() => searchQuery.data?.items ?? [], [searchQuery.data]);
  const membersById = useMemo(
    () => new Map(members.map((member) => [member.id, member] as const)),
    [members],
  );

  const visibleProjects = useMemo(() => projects, [projects]);

  const taskType1Options = useMemo(
    () => getTaskType1Options(taskTypes, filters.taskType1),
    [filters.taskType1, taskTypes],
  );
  const taskType2Options = useMemo(
    () => getTaskType2Options(taskTypes, filters.taskType1, filters.taskType2),
    [filters.taskType1, filters.taskType2, taskTypes],
  );

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (appliedMemberFilterIds.length > 0 && !appliedMemberFilterIds.includes(task.memberId)) {
        return false;
      }

      return true;
    });
  }, [appliedMemberFilterIds, tasks]);
  const visibleMembers = useMemo(() => {
    const queryText = memberSearchInput.trim().toLowerCase();

    if (!queryText) {
      return members;
    }

    return members.filter((member) =>
      [member.accountId, member.name, member.email].join(' ').toLowerCase().includes(queryText),
    );
  }, [memberSearchInput, members]);

  const sortedTasks = useMemo(
    () => sortTasks(filteredTasks, sortState, membersById),
    [filteredTasks, membersById, sortState],
  );
  const totalMinutes = useMemo(
    () => sortedTasks.reduce((sum, task) => sum + task.taskUsedtime, 0),
    [sortedTasks],
  );
  const totalTasks = searchQuery.data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalTasks / pageSize));
  const currentPageSafe = Math.min(currentPage, totalPages);
  // const pageStartIndex = totalTasks ? (currentPageSafe - 1) * pageSize : 0;

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const deleteMutation = useMutation({
    mutationFn: (taskId: string) => adminDataClient.deleteTaskAdmin(taskId),
    onSuccess: () => {
      setLocalMutationError('');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'task-search'] });
    },
    onError: (error) => {
      setLocalMutationError(
        error instanceof Error ? error.message : '업무보고를 삭제하지 못했습니다.',
      );
    },
  });

  const handleFilterField = <K extends keyof AdminTaskSearchFilters>(
    key: K,
    value: AdminTaskSearchFilters[K],
  ) => {
    setFilters((current) => {
      const next = { ...current, [key]: value };

      if (key === 'costGroupId') {
        next.projectId = '';
      }

      if (key === 'taskType1') {
        next.taskType2 = '';
      }

      return next;
    });
  };

  const handleSearch = () => {
    if (filters.startDate && filters.endDate && filters.startDate > filters.endDate) {
      window.alert('시작일이 종료일보다 늦습니다.');
      const input = document.getElementById('admin-reports-start-date');
      input?.focus();
      return;
    }

    setAppliedFilters({ ...filters });
    setAppliedMemberFilterIds([...memberFilterIds]);
    setCurrentPage(1);
  };

  const handleExport = async () => {
    if (
      appliedFilters.startDate &&
      appliedFilters.endDate &&
      !isDownloadRangeWithinThreeMonths(appliedFilters.startDate, appliedFilters.endDate)
    ) {
      window.alert('다운로드 기간은 최대 3개월까지 가능합니다.');
      return;
    }

    await downloadExcelFile(
      buildExportFilename(appliedFilters.startDate, appliedFilters.endDate),
      '검색결과',
      sortedTasks,
      [
        { header: '#', value: (task) => task.id, width: 8 },
        { header: '일자', value: (task) => task.taskDate, width: 12 },
        {
          header: 'ID',
          value: (task) => membersById.get(task.memberId)?.accountId ?? task.memberId,
          width: 18,
        },
        { header: '청구그룹', value: (task) => task.costGroupName, width: 16 },
        { header: '타입1', value: (task) => task.taskType1, width: 14 },
        { header: '타입2', value: (task) => task.taskType2, width: 14 },
        { header: '플랫폼', value: (task) => task.platform, width: 12 },
        { header: '서비스그룹', value: (task) => task.serviceGroupName, width: 16 },
        { header: '서비스명', value: (task) => task.serviceName, width: 20 },
        { header: '프로젝트명', value: (task) => task.projectName, width: 22 },
        { header: '페이지명', value: (task) => task.pageTitle, width: 22 },
        { header: '링크', value: (task) => task.pageUrl, width: 28 },
        { header: '시간', value: (task) => task.taskUsedtime, width: 10 },
        { header: '비고', value: (task) => task.note, width: 28 },
      ],
    );
  };

  const deleteTask = async (taskId: string) => {
    if (
      deleteMutation.isPending ||
      !window.confirm('정말 삭제 하시겠습니까? 복구할 수 없습니다.')
    ) {
      return;
    }

    await deleteMutation.mutateAsync(taskId);
  };

  const loading =
    membersQuery.isLoading ||
    taskTypesQuery.isLoading ||
    costGroupsQuery.isLoading ||
    projectsQuery.isLoading ||
    searchQuery.isLoading;
  const queryError =
    (membersQuery.error instanceof Error && membersQuery.error.message) ||
    (taskTypesQuery.error instanceof Error && taskTypesQuery.error.message) ||
    (costGroupsQuery.error instanceof Error && costGroupsQuery.error.message) ||
    (projectsQuery.error instanceof Error && projectsQuery.error.message) ||
    (searchQuery.error instanceof Error && searchQuery.error.message) ||
    '';
  const mutationError =
    localMutationError ||
    (deleteMutation.error instanceof Error && deleteMutation.error.message) ||
    '';

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleSearch();
  };

  const handleReset = () => {
    const initialFilters = createDefaultFilters();
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
    setMemberFilterIds([]);
    setAppliedMemberFilterIds([]);
    setSortState(ADMIN_REPORTS_DEFAULT_SORT);
    setMemberSearchInput('');
    setCurrentPage(1);
  };

  return (
    <section className={'admin-reports-page admin-reports-page--shell'}>
      <header className={'admin-reports-page__page-header'}>
        <div className={'admin-reports-page__page-header-top'}>
          <div className={'admin-reports-page__page-title-group'}>
            <h1 className={'admin-reports-page__title'}>업무보고 조회</h1>
          </div>
          <div className={'admin-reports-page__header-actions'}>
            <button
              type="button"
              className={'admin-reports-page__header-action'}
              onClick={() =>
                navigate('/org/search/new', {
                  state: {
                    memberId: memberFilterIds.length === 1 ? memberFilterIds[0] : '',
                  },
                })
              }
            >
              업무보고 추가
            </button>
          </div>
        </div>
      </header>

      <PageSection title="필터">
        <form className={'admin-reports-page__filter-form'} onSubmit={handleSearchSubmit}>
          <div className={'admin-reports-page__date-row'}>
            <label className={'admin-reports-page__filter-field'}>
              <span>시작일</span>
              <input
                id="admin-reports-start-date"
                type="date"
                value={filters.startDate}
                onChange={(event) => handleFilterField('startDate', event.target.value)}
              />
            </label>
            <label className={'admin-reports-page__filter-field'}>
              <span>종료일</span>
              <input
                id="admin-reports-end-date"
                type="date"
                value={filters.endDate}
                onChange={(event) => handleFilterField('endDate', event.target.value)}
              />
            </label>
          </div>

          <div className={'admin-reports-page__meta-row'}>
            <label className={'admin-reports-page__filter-field'}>
              <span>타입1</span>
              <select
                id="admin-reports-task-type-1"
                value={filters.taskType1}
                onChange={(event) => handleFilterField('taskType1', event.target.value)}
              >
                <option value="">전체</option>
                {taskType1Options.map((type1) => (
                  <option key={`filter-type1-${type1}`} value={type1}>
                    {type1}
                  </option>
                ))}
              </select>
            </label>
            <label className={'admin-reports-page__filter-field'}>
              <span>타입2</span>
              <select
                id="admin-reports-task-type-2"
                value={filters.taskType2}
                onChange={(event) => handleFilterField('taskType2', event.target.value)}
                disabled={!filters.taskType1}
              >
                <option value="">전체</option>
                {taskType2Options.map((type2) => (
                  <option key={`filter-type2-${type2}`} value={type2}>
                    {type2}
                  </option>
                ))}
              </select>
            </label>
            <label className={'admin-reports-page__filter-field'}>
              <span>청구그룹</span>
              <select
                id="admin-reports-cost-group"
                value={filters.costGroupId}
                onChange={(event) => handleFilterField('costGroupId', event.target.value)}
              >
                <option value="">전체</option>
                {costGroups.map((group: AdminCostGroupItem) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={'admin-reports-page__filter-field'}>
              <span>프로젝트</span>
              <select
                id="admin-reports-service-name"
                value={filters.projectId}
                onChange={(event) => handleFilterField('projectId', event.target.value)}
                disabled={!filters.costGroupId}
              >
                <option value="">전체</option>
                {visibleProjects.map((project: AdminProjectOption) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className={'admin-reports-page__search-row'}>
            <div className={'admin-reports-page__filter-field'}>
              <span>사용자</span>
              <div className={'admin-reports-page__member-select'}>
                <button
                  type="button"
                  className={'admin-reports-page__member-accordion-trigger'}
                  onClick={() => setMemberFilterOpen((current) => !current)}
                  aria-expanded={memberFilterOpen}
                  aria-controls="admin-reports-member-panel"
                >
                  <span className={'admin-reports-page__member-accordion-value'}>
                    {memberFilterIds.length === members.length && members.length > 0
                      ? '전체'
                      : memberFilterIds.length === 0
                        ? '전체'
                        : `${memberFilterIds.length}명 선택`}
                  </span>
                  <span className={'admin-reports-page__member-accordion-arrow'} aria-hidden="true">
                    {memberFilterOpen ? '▲' : '▼'}
                  </span>
                </button>
                <div
                  id="admin-reports-member-panel"
                  className={[
                    'admin-reports-page__member-accordion-body',
                    memberFilterOpen ? 'admin-reports-page__member-accordion-body--open' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <div className={'admin-reports-page__member-accordion-inner'}>
                    <div className={'admin-reports-page__member-panel-toolbar'}>
                      <input
                        className={'admin-reports-page__member-search-input'}
                        value={memberSearchInput}
                        onChange={(event) => setMemberSearchInput(event.target.value)}
                        placeholder="ID, 이름, 이메일 검색"
                        aria-label="사용자 검색"
                      />
                    </div>
                    <div className={'admin-reports-page__member-quick-actions'}>
                      <button
                        type="button"
                        className={'admin-reports-page__member-quick-action'}
                        onClick={() => setMemberFilterIds(members.map((member) => member.id))}
                      >
                        전체 선택
                      </button>
                      <button
                        type="button"
                        className={'admin-reports-page__member-quick-action'}
                        onClick={() => setMemberFilterIds([])}
                      >
                        전체 해제
                      </button>
                    </div>
                    <div className={'admin-reports-page__member-checkboxes'}>
                      {visibleMembers.length === 0 ? (
                        <p className={'admin-reports-page__member-empty-state'}>
                          검색 결과가 없습니다.
                        </p>
                      ) : (
                        visibleMembers.map((member: MemberAdminItem) => {
                          const checked = memberFilterIds.includes(member.id);

                          return (
                            <label
                              key={member.id}
                              className={[
                                'admin-reports-page__member-checkbox',
                                checked ? 'admin-reports-page__member-checkbox--selected' : '',
                              ]
                                .filter(Boolean)
                                .join(' ')}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(event) => {
                                  setMemberFilterIds((current) =>
                                    event.target.checked
                                      ? [...current, member.id]
                                      : current.filter((id) => id !== member.id),
                                  );
                                }}
                              />
                              <span className={'admin-reports-page__member-account'}>
                                {member.accountId}
                              </span>
                              <span className={'admin-reports-page__member-name'}>
                                {member.name}
                              </span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <label className={'admin-reports-page__filter-field'}>
              <span>검색어</span>
              <input
                value={filters.keyword}
                onChange={(event) => handleFilterField('keyword', event.target.value)}
                placeholder="ID, 이름, 서비스명, 비고 검색"
              />
            </label>
          </div>

          <div className={'admin-reports-page__filter-actions-row'}>
            <div className={'admin-reports-page__filter-actions'}>
              <button
                type="submit"
                className={'admin-reports-page__button admin-reports-page__button--filter'}
                disabled={loading || searchQuery.isFetching}
              >
                검색
              </button>
              <button
                type="button"
                className={
                  'admin-reports-page__button admin-reports-page__button--filter-secondary'
                }
                onClick={handleReset}
              >
                초기화
              </button>
              <span className={'admin-reports-page__filter-divider'} aria-hidden="true" />
              <button
                type="button"
                className={
                  'admin-reports-page__button admin-reports-page__button--filter-secondary'
                }
                onClick={handleExport}
                disabled={totalTasks === 0}
              >
                다운로드
              </button>
            </div>
          </div>
        </form>
      </PageSection>

      {(queryError || mutationError) && (
        <p className={'admin-reports-page__status-message'}>{queryError || mutationError}</p>
      )}

      <section className={'admin-reports-page__result-bar'} aria-label="업무보고 조회 결과 요약">
        <div className={'admin-reports-page__result-metrics'}>
          <div className={'admin-reports-page__pager'} aria-label="업무보고 목록 페이지 이동">
            <button
              type="button"
              className={'admin-reports-page__button admin-reports-page__button--page'}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPageSafe === 1}
              aria-label="이전 페이지"
            >
              이전
            </button>
            <p className={'admin-reports-page__page-status'}>
              <strong>{currentPageSafe}</strong>
              <span>/ {numberFormatter.format(totalPages)}</span>
            </p>
            <button
              type="button"
              className={'admin-reports-page__button admin-reports-page__button--page'}
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={currentPageSafe === totalPages || totalTasks === 0}
              aria-label="다음 페이지"
            >
              다음
            </button>
          </div>
          <p className={'admin-reports-page__result-metric'}>
            <span className={'admin-reports-page__result-label'}>총 건수</span>
            <strong className={'admin-reports-page__result-value'}>
              {numberFormatter.format(totalTasks)}건
            </strong>
          </p>
          <p className={'admin-reports-page__result-metric'}>
            <span className={'admin-reports-page__result-label'}>총 시간</span>
            <strong className={'admin-reports-page__result-value'}>
              {formatSummaryMinutes(totalMinutes)}
            </strong>
          </p>
        </div>
        <div className={'admin-reports-page__result-controls'}>
          <label className={'admin-reports-page__page-size-field'}>
            <span>페이지당</span>
            <select
              value={String(pageSize)}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setCurrentPage(1);
              }}
              aria-label="페이지당 행 수"
            >
              {ADMIN_REPORTS_PAGE_SIZE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}행
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <div className={'admin-reports-page__panel'}>
        <div className={'admin-reports-page__table-wrap'}>
          <table className={'admin-reports-page__table'}>
            <thead>
              <tr>
                <th>
                  <AdminReportsSortButton
                    label="일자"
                    sortKey="taskDate"
                    sortState={sortState}
                    onChange={setSortState}
                  />
                </th>
                <th>
                  <AdminReportsSortButton
                    label="ID"
                    sortKey="member"
                    sortState={sortState}
                    onChange={setSortState}
                  />
                </th>
                <th>
                  <AdminReportsSortButton
                    label="청구그룹"
                    sortKey="costGroup"
                    sortState={sortState}
                    onChange={setSortState}
                  />
                </th>
                <th>
                  <AdminReportsSortButton
                    label="type 1"
                    sortKey="taskType1"
                    sortState={sortState}
                    onChange={setSortState}
                  />
                </th>
                <th>
                  <AdminReportsSortButton
                    label="type 2"
                    sortKey="taskType2"
                    sortState={sortState}
                    onChange={setSortState}
                  />
                </th>
                <th>
                  <AdminReportsSortButton
                    label="플랫폼"
                    sortKey="platform"
                    sortState={sortState}
                    onChange={setSortState}
                  />
                </th>
                <th>
                  <AdminReportsSortButton
                    label="서비스그룹"
                    sortKey="serviceGroup"
                    sortState={sortState}
                    onChange={setSortState}
                  />
                </th>
                <th>
                  <AdminReportsSortButton
                    label="서비스명"
                    sortKey="serviceName"
                    sortState={sortState}
                    onChange={setSortState}
                  />
                </th>
                <th>
                  <AdminReportsSortButton
                    label="프로젝트명"
                    sortKey="projectName"
                    sortState={sortState}
                    onChange={setSortState}
                  />
                </th>
                <th>
                  <AdminReportsSortButton
                    label="페이지명"
                    sortKey="pageTitle"
                    sortState={sortState}
                    onChange={setSortState}
                  />
                </th>
                <th>링크</th>
                <th>
                  <AdminReportsSortButton
                    label="시간"
                    sortKey="taskUsedtime"
                    sortState={sortState}
                    onChange={setSortState}
                  />
                </th>
                <th>비고</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {sortedTasks.length === 0 ? (
                <tr>
                  <td colSpan={14} className={'admin-reports-page__empty-state'}>
                    검색 결과가 없습니다.
                  </td>
                </tr>
              ) : (
                sortedTasks.map((task) => {
                  const member = membersById.get(task.memberId);

                  return (
                    <tr key={task.id}>
                      <td>{task.taskDate}</td>
                      <td>
                        <strong>{member?.accountId ?? task.memberId}</strong>
                        <div className={'admin-reports-page__muted'}>
                          {member?.name ?? task.memberName}
                        </div>
                      </td>
                      <td>{task.costGroupName || '-'}</td>
                      <td>{task.taskType1}</td>
                      <td>{task.taskType2}</td>
                      <td>{task.platform || '-'}</td>
                      <td>{task.serviceGroupName || '-'}</td>
                      <td>{task.serviceName || '-'}</td>
                      <td>{task.projectName || '-'}</td>
                      <td>{task.pageTitle || '-'}</td>
                      <td>
                        {task.pageUrl ? (
                          <a
                            href={task.pageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className={'admin-reports-page__table-link'}
                          >
                            링크
                          </a>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td>{formatTimeCell(task.taskUsedtime)}</td>
                      <td>{task.note || '-'}</td>
                      <td>
                        <div className={'admin-reports-page__action-stack'}>
                          <button
                            type="button"
                            className={
                              'admin-reports-page__button admin-reports-page__button--action'
                            }
                            onClick={() => navigate(`/org/search/${task.id}/edit`)}
                          >
                            수정
                          </button>
                          <button
                            type="button"
                            className={
                              'admin-reports-page__button admin-reports-page__button--delete'
                            }
                            onClick={() => void deleteTask(task.id)}
                            disabled={deleteMutation.isPending}
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function createDefaultFilters(): AdminTaskSearchFilters {
  const today = getTodayInputValue();
  return {
    startDate: today,
    endDate: today,
    memberId: '',
    costGroupId: '',
    projectId: '',
    pageId: '',
    taskType1: '',
    taskType2: '',
    keyword: '',
  };
}
function getTodayInputValue() {
  return toLocalDateInputValue(new Date());
}
