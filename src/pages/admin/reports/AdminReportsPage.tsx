import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { PagePager } from '../../../components/shared/PagePager';
import { PageResultBar } from '../../../components/shared/PageResultBar';
import { PageSizeField } from '../../../components/shared/PageSizeField';
import { setDocumentTitle } from '../../../router/navigation';
import { PageHeader } from '../../../components/shared/PageHeader';
import { PageSection } from '../../../components/shared/PageSection';
import { downloadExcelFile } from '../../../utils/excel';
import { adminDataClient } from '../../../api/admin';
import type { AdminTaskSearchFilters } from '../types';
import {
  ADMIN_REPORTS_DEFAULT_PAGE_SIZE,
  ADMIN_REPORTS_DEFAULT_SORT,
  ADMIN_REPORTS_PAGE_SIZE_OPTIONS,
  ADMIN_REPORTS_PAGE_TITLE,
} from './AdminReportsPage.constants';
import type { SortState } from './AdminReportsPage.types';
import { AdminReportsFilterForm } from './AdminReportsFilterForm';
import { AdminReportsResultsTable } from './AdminReportsResultsTable';
import {
  buildExportFilename,
  createDefaultFilters,
  formatSummaryMinutes,
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
      <PageHeader
        title="업무보고 조회"
        actions={
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
        }
      />

      <PageSection title="필터">
        <AdminReportsFilterForm
          filters={filters}
          taskType1Options={taskType1Options}
          taskType2Options={taskType2Options}
          costGroups={costGroups}
          visibleProjects={visibleProjects}
          members={members}
          visibleMembers={visibleMembers}
          memberFilterIds={memberFilterIds}
          memberFilterOpen={memberFilterOpen}
          memberSearchInput={memberSearchInput}
          loading={loading}
          searching={searchQuery.isFetching}
          totalTasks={totalTasks}
          onSubmit={handleSearchSubmit}
          onFilterField={handleFilterField}
          onMemberFilterOpenToggle={() => setMemberFilterOpen((current) => !current)}
          onMemberSearchInputChange={setMemberSearchInput}
          onSelectAllMembers={() => setMemberFilterIds(members.map((member) => member.id))}
          onClearAllMembers={() => setMemberFilterIds([])}
          onMemberCheckedChange={(memberId, checked) => {
            setMemberFilterIds((current) =>
              checked ? [...current, memberId] : current.filter((id) => id !== memberId),
            );
          }}
          onReset={handleReset}
          onExport={() => void handleExport()}
        />
      </PageSection>

      {(queryError || mutationError) && (
        <p className={'admin-reports-page__status-message'}>{queryError || mutationError}</p>
      )}

      <PageResultBar
        className={'admin-reports-page__result-bar'}
        aria-label="업무보고 조회 결과 요약"
        metrics={
          <>
            <PagePager
              className={'admin-reports-page__pager'}
              aria-label="업무보고 목록 페이지 이동"
              buttonClassName={'admin-reports-page__button admin-reports-page__button--page'}
              statusClassName={'admin-reports-page__page-status'}
              currentPage={currentPageSafe}
              totalPages={totalPages}
              canGoPrevious={currentPageSafe > 1}
              canGoNext={currentPageSafe < totalPages && totalTasks > 0}
              onPrevious={() => setCurrentPage((page) => Math.max(1, page - 1))}
              onNext={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            />
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
          </>
        }
        controls={
          <PageSizeField
            className={'admin-reports-page__page-size-field'}
            aria-label="페이지당 행 수"
            value={pageSize}
            options={ADMIN_REPORTS_PAGE_SIZE_OPTIONS}
            onValueChange={(next) => {
              setPageSize(next);
              setCurrentPage(1);
            }}
          />
        }
      />

      <AdminReportsResultsTable
        tasks={sortedTasks}
        membersById={membersById}
        sortState={sortState}
        deletePending={deleteMutation.isPending}
        onSortChange={setSortState}
        onEdit={(taskId) => navigate(`/org/search/${taskId}/edit`)}
        onDelete={(taskId) => void deleteTask(taskId)}
      />
    </section>
  );
}
