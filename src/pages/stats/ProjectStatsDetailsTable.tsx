import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { SortableTableHeaderButton, TableEmptyRow } from '../../components/shared';
import { type ProjectStatsRow, type ProjectSubtaskStatsRow } from '../../types/domain';
import type { ProjectStatsPeriodBasis, ProjectStatsSortState } from './ProjectStatsPage.types';
import {
  formatMonthLabel,
  formatTaskMonthValue,
  formatTaskStatus,
  monthKeyFromDate,
} from './ProjectStatsPage.utils';

interface ProjectStatsDetailsTableProps {
  rows: ProjectStatsRow[];
  periodBasis: ProjectStatsPeriodBasis;
  sortState: ProjectStatsSortState;
  onSortChange: (next: ProjectStatsSortState) => void;
  expandedProjectIds: ReadonlySet<string>;
  onToggleProject: (projectId: string) => void;
  subtasksByProjectId: Map<string, ProjectSubtaskStatsRow[]>;
  subtaskPeriodLabelByProjectId: Map<string, string>;
  memberLabelById: Map<string, string>;
}

function renderSubtaskAssignee(
  row: ProjectSubtaskStatsRow,
  memberLabelById: Map<string, string>,
) {
  if (!row.ownerMemberId) {
    return '-';
  }
  return memberLabelById.get(row.ownerMemberId) ?? row.ownerMemberId;
}

function renderTaskMonth(value: string) {
  return formatTaskMonthValue(value);
}

export function ProjectStatsDetailsTable({
  rows,
  periodBasis,
  sortState,
  onSortChange,
  expandedProjectIds,
  onToggleProject,
  subtasksByProjectId,
  subtaskPeriodLabelByProjectId,
  memberLabelById,
}: ProjectStatsDetailsTableProps) {
  const getAriaSort = (key: ProjectStatsSortState['key']) => {
    if (sortState.key !== key) {
      return 'none';
    }

    return sortState.direction === 'asc' ? 'ascending' : 'descending';
  };

  return (
    <div className={'stats-page__table-wrap'}>
      <table className={'stats-page__table'}>
        <caption className={'sr-only'}>필터링된 프로젝트 목록</caption>
        <colgroup>
          <col className={'stats-page__table-col stats-page__table-col--toggle'} />
          <col className={'stats-page__table-col stats-page__table-col--month'} />
          <col className={'stats-page__table-col stats-page__table-col--type'} />
          <col className={'stats-page__table-col stats-page__table-col--platform'} />
          <col className={'stats-page__table-col stats-page__table-col--group'} />
          <col className={'stats-page__table-col stats-page__table-col--group'} />
          <col className={'stats-page__table-col stats-page__table-col--project'} />
          <col className={'stats-page__table-col stats-page__table-col--count'} />
          <col className={'stats-page__table-col stats-page__table-col--count'} />
          <col className={'stats-page__table-col stats-page__table-col--count'} />
          <col className={'stats-page__table-col stats-page__table-col--count'} />
          <col className={'stats-page__table-col stats-page__table-col--report'} />
        </colgroup>
        <thead>
          <tr>
            <th scope="col">상세</th>
            <th scope="col" aria-sort={getAriaSort('month')}>
              <SortableTableHeaderButton
                label={periodBasis === 'subtask' ? '과업월' : '종료월'}
                sortKey="month"
                sortState={sortState}
                onChange={onSortChange}
              />
            </th>
            <th scope="col" aria-sort={getAriaSort('type1')}>
              <SortableTableHeaderButton
                label="타입1"
                sortKey="type1"
                sortState={sortState}
                onChange={onSortChange}
              />
            </th>
            <th scope="col" aria-sort={getAriaSort('platform')}>
              <SortableTableHeaderButton
                label="플랫폼"
                sortKey="platform"
                sortState={sortState}
                onChange={onSortChange}
              />
            </th>
            <th scope="col" aria-sort={getAriaSort('costGroupName')}>
              <SortableTableHeaderButton
                label="청구그룹"
                sortKey="costGroupName"
                sortState={sortState}
                onChange={onSortChange}
              />
            </th>
            <th scope="col" aria-sort={getAriaSort('serviceGroupName')}>
              <SortableTableHeaderButton
                label="서비스 그룹"
                sortKey="serviceGroupName"
                sortState={sortState}
                onChange={onSortChange}
              />
            </th>
            <th scope="col" aria-sort={getAriaSort('projectName')}>
              <SortableTableHeaderButton
                label="프로젝트명"
                sortKey="projectName"
                sortState={sortState}
                onChange={onSortChange}
              />
            </th>
            <th scope="col" aria-sort={getAriaSort('subtaskCount')}>
              <SortableTableHeaderButton
                label="서브태스크 수"
                sortKey="subtaskCount"
                sortState={sortState}
                onChange={onSortChange}
              />
            </th>
            <th scope="col" aria-sort={getAriaSort('untouchedSubtaskCount')}>
              <SortableTableHeaderButton
                label="미수정"
                sortKey="untouchedSubtaskCount"
                sortState={sortState}
                onChange={onSortChange}
              />
            </th>
            <th scope="col" aria-sort={getAriaSort('partialSubtaskCount')}>
              <SortableTableHeaderButton
                label="일부 수정"
                sortKey="partialSubtaskCount"
                sortState={sortState}
                onChange={onSortChange}
              />
            </th>
            <th scope="col" aria-sort={getAriaSort('completedSubtaskCount')}>
              <SortableTableHeaderButton
                label="전체 수정"
                sortKey="completedSubtaskCount"
                sortState={sortState}
                onChange={onSortChange}
              />
            </th>
            <th scope="col">보고서 URL</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isExpanded = expandedProjectIds.has(row.projectId);
            const subtasks = subtasksByProjectId.get(row.projectId) ?? [];

            return (
              <Fragment key={row.projectId}>
                <tr key={row.projectId}>
                  <td>
                    <button
                      type="button"
                      className={'stats-page__expand-button'}
                      aria-expanded={isExpanded}
                      aria-controls={`project-stats-subtasks-${row.projectId}`}
                      aria-label={`${row.projectName ?? '프로젝트'} 서브태스크 ${isExpanded ? '접기' : '펼치기'}`}
                      onClick={() => onToggleProject(row.projectId)}
                    >
                      {isExpanded ? '접기' : '펼치기'}
                    </button>
                  </td>
                  <td>
                    {periodBasis === 'subtask'
                      ? (subtaskPeriodLabelByProjectId.get(row.projectId) ?? '-')
                      : (formatMonthLabel(monthKeyFromDate(row.endDate)) || '-')}
                  </td>
                  <td>{row.type1 || '-'}</td>
                  <td>{row.platform || '-'}</td>
                  <td>{row.costGroupName || '-'}</td>
                  <td>{row.serviceGroupName || '-'}</td>
                  <td>
                    <div className={'stats-page__stack-cell'}>
                      {row.projectId && row.projectName ? (
                        <Link to={`/projects/${row.projectId}/edit`} className={'stats-page__link'}>
                          {row.projectName}
                        </Link>
                      ) : (
                        <strong>{row.projectName || '-'}</strong>
                      )}
                      <span>{row.reporterDisplay ? `리포터 ${row.reporterDisplay}` : '리포터 -'}</span>
                      <span>{row.reviewerDisplay ? `리뷰어 ${row.reviewerDisplay}` : '리뷰어 -'}</span>
                    </div>
                  </td>
                  <td className="stats-page__table-number">
                    {row.subtaskCount > 0 ? row.subtaskCount : '과업 없음'}
                  </td>
                  <td className="stats-page__table-number">{row.untouchedSubtaskCount}</td>
                  <td className="stats-page__table-number">{row.partialSubtaskCount}</td>
                  <td className="stats-page__table-number">{row.completedSubtaskCount}</td>
                  <td>
                    {row.reportUrl ? (
                      <a
                        href={row.reportUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={'stats-page__link'}
                      >
                        링크
                      </a>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
                {isExpanded ? (
                  <tr
                    key={`${row.projectId}-subtasks`}
                    id={`project-stats-subtasks-${row.projectId}`}
                    className={'stats-page__subtasks-row'}
                  >
                    <td colSpan={12}>
                      <div className={'stats-page__subtable-wrap'}>
                        <table className={'stats-page__subtable'}>
                          <caption className={'sr-only'}>
                            {row.projectName ?? '프로젝트'} 서브태스크 목록
                          </caption>
                          <colgroup>
                            <col className={'stats-page__subtable-col stats-page__subtable-col--task'} />
                            <col className={'stats-page__subtable-col stats-page__subtable-col--assignee'} />
                            <col className={'stats-page__subtable-col stats-page__subtable-col--status'} />
                            <col className={'stats-page__subtable-col stats-page__subtable-col--month'} />
                            <col className={'stats-page__subtable-col stats-page__subtable-col--link'} />
                          </colgroup>
                          <thead>
                            <tr>
                              <th scope="col">과업명</th>
                              <th scope="col">담당자</th>
                              <th scope="col">상태</th>
                              <th scope="col">과업월</th>
                              <th scope="col">링크</th>
                            </tr>
                          </thead>
                          <tbody>
                            {subtasks.map((subtask) => (
                              <tr key={subtask.subtaskId}>
                                <td>{subtask.title}</td>
                                <td>{renderSubtaskAssignee(subtask, memberLabelById)}</td>
                                <td>
                                  <span
                                    className="stats-page__status-badge"
                                    data-status={subtask.taskStatus}
                                  >
                                    {formatTaskStatus(subtask.taskStatus)}
                                  </span>
                                </td>
                                <td>{renderTaskMonth(subtask.taskMonth)}</td>
                                <td>
                                  {subtask.url ? (
                                    <a
                                      href={subtask.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className={'stats-page__link'}
                                    >
                                      링크
                                    </a>
                                  ) : (
                                    '-'
                                  )}
                                </td>
                              </tr>
                            ))}
                            {!subtasks.length ? (
                              <TableEmptyRow
                                colSpan={5}
                                message="등록된 서브태스크가 없습니다."
                              />
                            ) : null}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
          {!rows.length ? (
            <TableEmptyRow colSpan={12} message="조건에 맞는 프로젝트가 없습니다." />
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
