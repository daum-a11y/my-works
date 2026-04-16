import { Link } from 'react-router-dom';
import { SortableTableHeaderButton, TableEmptyRow } from '../../components/shared';
import type { MonitoringStatsRow } from '../../types/domain';
import type { TaskMonitoringSortState } from './ProjectStatsPage.types';
import { formatTaskMonthValue, formatTaskStatus } from './ProjectStatsPage.utils';

interface TaskMonitoringResultsTableProps {
  rows: MonitoringStatsRow[];
  sortState: TaskMonitoringSortState;
  onSortChange: (next: TaskMonitoringSortState) => void;
}

export function TaskMonitoringResultsTable({
  rows,
  sortState,
  onSortChange,
}: TaskMonitoringResultsTableProps) {
  const getAriaSort = (key: TaskMonitoringSortState['key']) => {
    if (sortState.key !== key) {
      return 'none';
    }

    return sortState.direction === 'asc' ? 'ascending' : 'descending';
  };

  return (
    <div className="table-wrap">
      <table className="krds-table">
        <caption className="sr-only">필터링된 태스크 현황 목록</caption>
        <colgroup>
          <col className="table-col col-month" />
          <col className="table-col col-group" />
          <col className="table-col col-type" />
          <col className="table-col col-group" />
          <col className="table-col col-platform" />
          <col className="table-col col-project" />
          <col className="table-col col-project" />
          <col className="table-col col-group" />
          <col className="table-col col-group" />
          <col className="table-col col-report" />
        </colgroup>
        <thead>
          <tr>
            <th scope="col" aria-sort={getAriaSort('month')}>
              <SortableTableHeaderButton
                label="종료월"
                sortKey="month"
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
            <th scope="col" aria-sort={getAriaSort('type1')}>
              <SortableTableHeaderButton
                label="타입1"
                sortKey="type1"
                sortState={sortState}
                onChange={onSortChange}
              />
            </th>
            <th scope="col" aria-sort={getAriaSort('serviceName')}>
              <SortableTableHeaderButton
                label="서비스명"
                sortKey="serviceName"
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
            <th scope="col" aria-sort={getAriaSort('projectName')}>
              <SortableTableHeaderButton
                label="프로젝트명"
                sortKey="projectName"
                sortState={sortState}
                onChange={onSortChange}
              />
            </th>
            <th scope="col" aria-sort={getAriaSort('title')}>
              <SortableTableHeaderButton
                label="태스크명"
                sortKey="title"
                sortState={sortState}
                onChange={onSortChange}
              />
            </th>
            <th scope="col" aria-sort={getAriaSort('ownerAccountId')}>
              <SortableTableHeaderButton
                label="담당자"
                sortKey="ownerAccountId"
                sortState={sortState}
                onChange={onSortChange}
              />
            </th>
            <th scope="col" aria-sort={getAriaSort('taskStatus')}>
              <SortableTableHeaderButton
                label="상태"
                sortKey="taskStatus"
                sortState={sortState}
                onChange={onSortChange}
              />
            </th>
            <th scope="col">보고서URL</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.subtaskId}>
              <td>{formatTaskMonthValue(row.taskDate)}</td>
              <td>{row.costGroupName || '-'}</td>
              <td>{row.type1 || '-'}</td>
              <td>{row.serviceName || row.serviceGroupName || '-'}</td>
              <td>{row.platform || '-'}</td>
              <td>
                {row.projectId && row.projectName ? (
                  <Link to={`/projects/${row.projectId}/edit`} className="table-link">
                    {row.projectName}
                  </Link>
                ) : (
                  row.projectName || '-'
                )}
              </td>
              <td>{row.title || '-'}</td>
              <td>{row.ownerDisplay || '-'}</td>
              <td>
                <span className="status-badge" data-status={row.taskStatus}>
                  {formatTaskStatus(row.taskStatus)}
                </span>
              </td>
              <td>
                {row.reportUrl ? (
                  <a href={row.reportUrl} target="_blank" rel="noreferrer" className="table-link">
                    링크
                  </a>
                ) : (
                  '-'
                )}
              </td>
            </tr>
          ))}
          {!rows.length ? (
            <TableEmptyRow colSpan={10} message="조건에 맞는 태스크가 없습니다." />
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
