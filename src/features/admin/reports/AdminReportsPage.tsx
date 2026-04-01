import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { setDocumentTitle } from '../../../app/navigation';
import { downloadExcelFile } from '../../../lib/excelExport';
import { toLocalDateInputValue } from '../../../lib/utils';
import { adminDataClient } from '../adminClient';
import type {
  AdminProjectOption,
  AdminServiceGroupItem,
  AdminTaskSearchFilters,
  AdminTaskSearchItem,
  AdminTaskTypeItem,
  MemberAdminItem,
} from '../admin-types';
import styles from './AdminReportsPage.module.css';

type SortKey =
  | 'id'
  | 'taskDate'
  | 'member'
  | 'taskType1'
  | 'taskType2'
  | 'platform'
  | 'serviceGroup'
  | 'serviceName'
  | 'projectName'
  | 'pageTitle'
  | 'hours'
  | 'note';

type SortDirection = 'asc' | 'desc';

interface SortState {
  key: SortKey;
  direction: SortDirection;
}

const defaultSort: SortState = {
  key: 'taskDate',
  direction: 'desc',
};

function getTodayInputValue() {
  return toLocalDateInputValue(new Date());
}

function buildExportFilename(startDate: string, endDate: string) {
  const compact = (value: string) => value.replaceAll('-', '').slice(2);

  if (startDate && endDate && startDate === endDate) {
    return `${compact(startDate)}_검색결과.xlsx`;
  }

  if (startDate && endDate) {
    return `${compact(startDate)}~${compact(endDate)}_검색결과.xlsx`;
  }

  if (startDate && !endDate) {
    return `${compact(startDate)}~${compact(startDate)}_검색결과.xlsx`;
  }

  if (!startDate && endDate) {
    return `${compact(endDate)}~${compact(endDate)}_검색결과.xlsx`;
  }

  return '검색결과.xlsx';
}

function formatSummaryMinutes(minutes: number) {
  return `${minutes.toFixed(0).replace(/(\d)(?=(\d{3})+(?:\.\d+)?$)/g, '$1,')}분`;
}

function formatTimeCell(value: number) {
  return Number.isFinite(value) ? String(value) : '';
}

function compareText(left: string, right: string) {
  return left.localeCompare(right, 'ko');
}

function getSortValue(
  task: AdminTaskSearchItem,
  membersById: Map<string, MemberAdminItem>,
  key: SortKey,
) {
  switch (key) {
    case 'id':
      return task.id;
    case 'member':
      return membersById.get(task.memberId)?.accountId ?? task.memberId;
    case 'taskType1':
      return task.taskType1;
    case 'taskType2':
      return task.taskType2;
    case 'platform':
      return task.platform;
    case 'serviceGroup':
      return task.serviceGroupName;
    case 'serviceName':
      return task.serviceName;
    case 'projectName':
      return task.projectName;
    case 'pageTitle':
      return task.pageTitle;
    case 'hours':
      return task.hours;
    case 'note':
      return task.note;
    case 'taskDate':
    default:
      return task.taskDate;
  }
}

function sortTasks(
  tasks: readonly AdminTaskSearchItem[],
  sort: SortState,
  membersById: Map<string, MemberAdminItem>,
) {
  const direction = sort.direction === 'asc' ? 1 : -1;

  return [...tasks].sort((left, right) => {
    const leftValue = getSortValue(left, membersById, sort.key);
    const rightValue = getSortValue(right, membersById, sort.key);

    if (typeof leftValue === 'number' && typeof rightValue === 'number') {
      return (leftValue - rightValue) * direction;
    }

    return compareText(String(leftValue ?? ''), String(rightValue ?? '')) * direction;
  });
}

function getTaskType1Options(taskTypes: readonly AdminTaskTypeItem[], currentValue?: string) {
  const names = new Set(taskTypes.map((item) => item.type1));
  if (currentValue) {
    names.add(currentValue);
  }
  names.add('project');
  return Array.from(names);
}

function getTaskType2Options(
  taskTypes: readonly AdminTaskTypeItem[],
  type1?: string,
  currentValue?: string,
) {
  if (!type1 || type1 === 'project') {
    return currentValue ? [currentValue] : [];
  }

  const names = new Set(taskTypes.filter((item) => item.type1 === type1).map((item) => item.type2));
  if (currentValue) {
    names.add(currentValue);
  }
  return Array.from(names);
}

function SortButton({
  label,
  sortKey,
  sortState,
  onChange,
}: {
  label: string;
  sortKey: SortKey;
  sortState: SortState;
  onChange: (next: SortState) => void;
}) {
  const active = sortState.key === sortKey;
  const nextDirection: SortDirection = active && sortState.direction === 'asc' ? 'desc' : 'asc';

  return (
    <button
      type="button"
      className={active ? styles.sortButtonActive : styles.sortButton}
      onClick={() => onChange({ key: sortKey, direction: nextDirection })}
      aria-label={`${label} 정렬`}
    >
      <span>{label}</span>
      <span className={styles.sortArrow}>
        {active && sortState.direction === 'asc' ? '▲' : '▼'}
      </span>
    </button>
  );
}

export function AdminReportsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<AdminTaskSearchFilters>(() => createDefaultFilters());
  const [appliedFilters, setAppliedFilters] = useState<AdminTaskSearchFilters>(() =>
    createDefaultFilters(),
  );
  const [memberFilterIds, setMemberFilterIds] = useState<string[]>([]);
  const [appliedMemberFilterIds, setAppliedMemberFilterIds] = useState<string[]>([]);
  const [sortState, setSortState] = useState<SortState>(defaultSort);
  const [localMutationError, setLocalMutationError] = useState('');

  useEffect(() => {
    setDocumentTitle('업무보고 조회');
  }, []);

  const membersQuery = useQuery({
    queryKey: ['admin', 'members'],
    queryFn: () => adminDataClient.listMembersAdmin(),
  });
  const taskTypesQuery = useQuery({
    queryKey: ['admin', 'task-types'],
    queryFn: () => adminDataClient.listTaskTypes(),
  });
  const serviceGroupsQuery = useQuery({
    queryKey: ['admin', 'service-groups'],
    queryFn: () => adminDataClient.listServiceGroups(),
  });
  const projectsQuery = useQuery({
    queryKey: ['admin', 'projects'],
    queryFn: () => adminDataClient.listProjects(),
  });
  const searchQuery = useQuery({
    queryKey: ['admin', 'task-search', appliedFilters],
    queryFn: () => adminDataClient.searchTasksAdmin(appliedFilters),
  });

  const members = useMemo(() => membersQuery.data ?? [], [membersQuery.data]);
  const taskTypes = useMemo(() => taskTypesQuery.data ?? [], [taskTypesQuery.data]);
  const serviceGroups = useMemo(() => serviceGroupsQuery.data ?? [], [serviceGroupsQuery.data]);
  const projects = useMemo(() => projectsQuery.data ?? [], [projectsQuery.data]);
  const tasks = useMemo(() => searchQuery.data ?? [], [searchQuery.data]);
  const membersById = useMemo(
    () => new Map(members.map((member) => [member.id, member] as const)),
    [members],
  );

  const visibleProjects = useMemo(
    () =>
      filters.serviceGroupId
        ? projects.filter((project) => project.serviceGroupId === filters.serviceGroupId)
        : projects,
    [filters.serviceGroupId, projects],
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

  const sortedTasks = useMemo(
    () => sortTasks(filteredTasks, sortState, membersById),
    [filteredTasks, membersById, sortState],
  );
  const totalMinutes = useMemo(
    () => sortedTasks.reduce((sum, task) => sum + task.hours, 0),
    [sortedTasks],
  );

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

      if (key === 'serviceGroupId') {
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
  };

  const handleExport = () => {
    downloadExcelFile(
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
        { header: 'type 1', value: (task) => task.taskType1, width: 14 },
        { header: 'type 2', value: (task) => task.taskType2, width: 14 },
        { header: '플랫폼', value: (task) => task.platform, width: 12 },
        { header: '서비스그룹', value: (task) => task.serviceGroupName, width: 16 },
        { header: '서비스명', value: (task) => task.serviceName, width: 20 },
        { header: '프로젝트명', value: (task) => task.projectName, width: 22 },
        { header: '페이지명', value: (task) => task.pageTitle, width: 22 },
        { header: '링크', value: (task) => task.pageUrl, width: 28 },
        { header: '시간', value: (task) => task.hours, width: 10 },
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

  const selectAllUserChecked =
    members.length > 0 &&
    (memberFilterIds.length === 0 || memberFilterIds.length === members.length);
  const loading =
    membersQuery.isLoading ||
    taskTypesQuery.isLoading ||
    serviceGroupsQuery.isLoading ||
    projectsQuery.isLoading ||
    searchQuery.isLoading;
  const queryError =
    (membersQuery.error instanceof Error && membersQuery.error.message) ||
    (taskTypesQuery.error instanceof Error && taskTypesQuery.error.message) ||
    (serviceGroupsQuery.error instanceof Error && serviceGroupsQuery.error.message) ||
    (projectsQuery.error instanceof Error && projectsQuery.error.message) ||
    (searchQuery.error instanceof Error && searchQuery.error.message) ||
    '';
  const mutationError =
    localMutationError ||
    (deleteMutation.error instanceof Error && deleteMutation.error.message) ||
    '';

  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>관리자</p>
          <h1>업무보고 조회</h1>
        </div>
      </header>

      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <h2>검색 조건</h2>
          <div className={styles.actions}>
            <button
              type="button"
              onClick={handleSearch}
              disabled={loading || searchQuery.isFetching}
            >
              검색
            </button>
          </div>
        </div>

        <div className={styles.filtersGrid}>
          <div className={styles.field}>
            <label htmlFor="admin-reports-start-date">시작일</label>
            <input
              id="admin-reports-start-date"
              type="date"
              value={filters.startDate}
              onChange={(event) => handleFilterField('startDate', event.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="admin-reports-end-date">종료일</label>
            <input
              id="admin-reports-end-date"
              type="date"
              value={filters.endDate}
              onChange={(event) => handleFilterField('endDate', event.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="admin-reports-task-type-1">type 1</label>
            <select
              id="admin-reports-task-type-1"
              value={filters.taskType1}
              onChange={(event) => handleFilterField('taskType1', event.target.value)}
            >
              <option value=""></option>
              {taskType1Options.map((type1) => (
                <option key={`filter-type1-${type1}`} value={type1}>
                  {type1}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="admin-reports-task-type-2">type 2</label>
            <select
              id="admin-reports-task-type-2"
              value={filters.taskType2}
              onChange={(event) => handleFilterField('taskType2', event.target.value)}
              disabled={!filters.taskType1 || filters.taskType1 === 'project'}
            >
              <option value=""></option>
              {taskType2Options.map((type2) => (
                <option key={`filter-type2-${type2}`} value={type2}>
                  {type2}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="admin-reports-service-group">서비스그룹</label>
            <select
              id="admin-reports-service-group"
              value={filters.serviceGroupId}
              onChange={(event) => handleFilterField('serviceGroupId', event.target.value)}
            >
              <option value="">전체</option>
              {serviceGroups.map((group: AdminServiceGroupItem) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="admin-reports-service-name">서비스명</label>
            <select
              id="admin-reports-service-name"
              value={filters.projectId}
              onChange={(event) => handleFilterField('projectId', event.target.value)}
              disabled={!filters.serviceGroupId}
            >
              <option value=""></option>
              {visibleProjects.map((project: AdminProjectOption) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="admin-reports-user-all">사용자</label>
            <div className={styles.checkboxAll}>
              <input
                id="admin-reports-user-all"
                type="checkbox"
                checked={selectAllUserChecked}
                onChange={(event) => {
                  setMemberFilterIds(
                    event.target.checked ? members.map((member) => member.id) : [],
                  );
                }}
              />
              <span>전체</span>
            </div>
          </div>
          <div className={styles.memberCheckboxes}>
            {members.map((member: MemberAdminItem) => (
              <label key={member.id} className={styles.memberCheckbox}>
                <input
                  type="checkbox"
                  checked={memberFilterIds.includes(member.id)}
                  onChange={(event) => {
                    setMemberFilterIds((current) =>
                      event.target.checked
                        ? [...current, member.id]
                        : current.filter((id) => id !== member.id),
                    );
                  }}
                />
                <span>{member.accountId}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {(queryError || mutationError) && (
        <p className={styles.helperText}>{queryError || mutationError}</p>
      )}

      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h2>검색 결과</h2>
            <p className={styles.subText}>
              총 {sortedTasks.length}건, {formatSummaryMinutes(totalMinutes)}
            </p>
          </div>
          <div className={styles.actions}>
            <button
              type="button"
              onClick={() =>
                navigate('/org/search/new', {
                  state: {
                    memberId: memberFilterIds.length === 1 ? memberFilterIds[0] : '',
                  },
                })
              }
              className={styles.primaryButton}
            >
              추가
            </button>
            <button type="button" onClick={handleExport} disabled={sortedTasks.length === 0}>
              엑셀파일로 내려받기
            </button>
          </div>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>
                  <SortButton
                    label="#"
                    sortKey="id"
                    sortState={sortState}
                    onChange={setSortState}
                  />
                </th>
                <th>
                  <SortButton
                    label="일자"
                    sortKey="taskDate"
                    sortState={sortState}
                    onChange={setSortState}
                  />
                </th>
                <th>
                  <SortButton
                    label="ID"
                    sortKey="member"
                    sortState={sortState}
                    onChange={setSortState}
                  />
                </th>
                <th>
                  <SortButton
                    label="type 1"
                    sortKey="taskType1"
                    sortState={sortState}
                    onChange={setSortState}
                  />
                </th>
                <th>
                  <SortButton
                    label="type 2"
                    sortKey="taskType2"
                    sortState={sortState}
                    onChange={setSortState}
                  />
                </th>
                <th>
                  <SortButton
                    label="플랫폼"
                    sortKey="platform"
                    sortState={sortState}
                    onChange={setSortState}
                  />
                </th>
                <th>
                  <SortButton
                    label="서비스그룹"
                    sortKey="serviceGroup"
                    sortState={sortState}
                    onChange={setSortState}
                  />
                </th>
                <th>
                  <SortButton
                    label="서비스명"
                    sortKey="serviceName"
                    sortState={sortState}
                    onChange={setSortState}
                  />
                </th>
                <th>
                  <SortButton
                    label="프로젝트명"
                    sortKey="projectName"
                    sortState={sortState}
                    onChange={setSortState}
                  />
                </th>
                <th>
                  <SortButton
                    label="페이지명"
                    sortKey="pageTitle"
                    sortState={sortState}
                    onChange={setSortState}
                  />
                </th>
                <th>링크</th>
                <th>
                  <SortButton
                    label="시간"
                    sortKey="hours"
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
                  <td colSpan={14} className={styles.emptyState}>
                    검색 결과가 없습니다.
                  </td>
                </tr>
              ) : (
                sortedTasks.map((task, index) => {
                  const member = membersById.get(task.memberId);

                  return (
                    <tr key={task.id}>
                      <td>{index + 1}</td>
                      <td>{task.taskDate}</td>
                      <td>
                        <strong>{member?.accountId ?? task.memberId}</strong>
                        <div className={styles.muted}>{member?.name ?? task.memberName}</div>
                      </td>
                      <td>{task.taskType1}</td>
                      <td>{task.taskType2}</td>
                      <td>{task.platform || '-'}</td>
                      <td>{task.serviceGroupName || '-'}</td>
                      <td>{task.serviceName || '-'}</td>
                      <td>{task.projectName || '-'}</td>
                      <td>{task.pageTitle || '-'}</td>
                      <td>
                        {task.pageUrl ? (
                          <a href={task.pageUrl} target="_blank" rel="noreferrer">
                            {task.pageUrl}
                          </a>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td>{formatTimeCell(task.hours)}</td>
                      <td>{task.note || '-'}</td>
                      <td>
                        <div className={styles.rowActions}>
                          <button
                            type="button"
                            onClick={() => navigate(`/org/search/${task.id}/edit`)}
                          >
                            수정
                          </button>
                          <button
                            type="button"
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
    projectId: '',
    pageId: '',
    taskType1: '',
    taskType2: '',
    serviceGroupId: '',
    keyword: '',
  };
}
