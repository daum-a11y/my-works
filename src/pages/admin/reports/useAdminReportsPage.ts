import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { adminDataClient } from '../../../api/admin';
import {
  mapAdminCostGroupRecords,
  mapAdminProjectRecords,
  mapAdminTaskPage,
  mapAdminTaskTypeRecords,
  mapMemberAdminRecords,
} from '../../../mappers/adminMappers';
import { setDocumentTitle } from '../../../router/navigation';
import { downloadExcelFile } from '../../../utils/excel';
import type { AdminTaskSearchFilters } from '../admin.types';
import {
  ADMIN_REPORTS_DEFAULT_PAGE_SIZE,
  ADMIN_REPORTS_DEFAULT_SORT,
  ADMIN_REPORTS_PAGE_TITLE,
} from './AdminReportsPage.constants';
import type { SortState } from './AdminReportsPage.types';
import {
  buildExportFilename,
  createDefaultFilters,
  formatSummaryMinutes,
  getTaskType1Options,
  getTaskType2Options,
  isDownloadRangeWithinThreeMonths,
  sortTasks,
} from './AdminReportsPage.utils';

export function useAdminReportsPage() {
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
    const items = mapMemberAdminRecords(membersQuery.data ?? []);
    const seen = new Set<string>();

    return items.filter((member) => {
      if (seen.has(member.id)) {
        return false;
      }

      seen.add(member.id);
      return true;
    });
  }, [membersQuery.data]);
  const taskTypes = useMemo(
    () => mapAdminTaskTypeRecords(taskTypesQuery.data ?? []),
    [taskTypesQuery.data],
  );
  const costGroups = useMemo(
    () => mapAdminCostGroupRecords(costGroupsQuery.data ?? []),
    [costGroupsQuery.data],
  );
  const projects = useMemo(
    () => mapAdminProjectRecords(projectsQuery.data ?? []),
    [projectsQuery.data],
  );
  const tasks = useMemo(
    () => mapAdminTaskPage(searchQuery.data ?? { items: [], totalCount: 0 }).items,
    [searchQuery.data],
  );
  const membersById = useMemo(
    () => new Map(members.map((member) => [member.id, member] as const)),
    [members],
  );
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
  const totalTasks = useMemo(
    () => mapAdminTaskPage(searchQuery.data ?? { items: [], totalCount: 0 }).totalCount,
    [searchQuery.data],
  );
  const totalPages = Math.max(1, Math.ceil(totalTasks / pageSize));
  const currentPageSafe = Math.min(currentPage, totalPages);

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
      document.getElementById('admin-reports-start-date')?.focus();
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

  const handleDelete = async (taskId: string) => {
    if (
      deleteMutation.isPending ||
      !window.confirm('정말 삭제 하시겠습니까? 복구할 수 없습니다.')
    ) {
      return;
    }

    await deleteMutation.mutateAsync(taskId);
  };

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

  return {
    costGroups,
    currentPageSafe,
    deletePending: deleteMutation.isPending,
    filters,
    handleClearAllMembers: () => setMemberFilterIds([]),
    handleCreate: () =>
      navigate('/org/search/new', {
        state: {
          memberId: memberFilterIds.length === 1 ? memberFilterIds[0] : '',
        },
      }),
    handleDelete,
    handleEdit: (taskId: string) => navigate(`/org/search/${taskId}/edit`),
    handleExport,
    handleFilterField,
    handleMemberCheckedChange: (memberId: string, checked: boolean) => {
      setMemberFilterIds((current) =>
        checked ? [...current, memberId] : current.filter((id) => id !== memberId),
      );
    },
    handleMemberFilterOpenToggle: () => setMemberFilterOpen((current) => !current),
    handleReset,
    handleSearchSubmit,
    handleSelectAllMembers: () => setMemberFilterIds(members.map((member) => member.id)),
    loading,
    memberFilterIds,
    memberFilterOpen,
    memberSearchInput,
    members,
    membersById,
    mutationError,
    pageSize,
    queryError,
    searching: searchQuery.isFetching,
    setCurrentPage,
    setMemberSearchInput,
    setPageSize,
    setSortState,
    sortState,
    sortedTasks,
    summaryTime: formatSummaryMinutes(totalMinutes),
    taskType1Options,
    taskType2Options,
    totalPages,
    totalTasks,
    visibleMembers,
    visibleProjects: projects,
  };
}
