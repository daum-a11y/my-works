import { Link } from 'react-router-dom';
import { SortableTableHeaderButton, TableEmptyRow } from '../../components/shared';
import { type ProjectStatsRow } from '../../types/domain';
import type { ProjectStatsSortState } from './ProjectStatsPage.types';
import { formatMonthLabel, monthKeyFromDate } from './ProjectStatsPage.utils';

interface ProjectStatsDetailsTableProps {
  rows: ProjectStatsRow[];
  sortState: ProjectStatsSortState;
  onSortChange: (next: ProjectStatsSortState) => void;
}

export function ProjectStatsDetailsTable({
  rows,
  sortState,
  onSortChange,
}: ProjectStatsDetailsTableProps) {
  const getAriaSort = (key: ProjectStatsSortState['key']) => {
    if (sortState.key !== key) {
      return 'none';
    }

    return sortState.direction === 'asc' ? 'ascending' : 'descending';
  };

  return (
    <div className={'table-wrap krds-table-wrap'}>
      <table className={'krds-table tbl data'}>
        <caption className={'sr-only'}>필터링된 프로젝트 목록</caption>
        <colgroup>
          <col className={'table-col col-month'} />
          <col className={'table-col col-type'} />
          <col className={'table-col col-group'} />
          <col className={'table-col col-group'} />
          <col className={'table-col col-group'} />
          <col className={'table-col col-platform'} />
          <col className={'table-col col-project'} />
          <col className={'table-col col-group'} />
          <col className={'table-col col-group'} />
          <col className={'table-col col-count'} />
          <col className={'table-col col-report'} />
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
            <th scope="col" aria-sort={getAriaSort('serviceGroupName')}>
              <SortableTableHeaderButton
                label="서비스 그룹"
                sortKey="serviceGroupName"
                sortState={sortState}
                onChange={onSortChange}
              />
            </th>
            <th scope="col">서비스명</th>
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
            <th scope="col" aria-sort={getAriaSort('reporterAccountId')}>
              <SortableTableHeaderButton
                label="리포터"
                sortKey="reporterAccountId"
                sortState={sortState}
                onChange={onSortChange}
              />
            </th>
            <th scope="col" aria-sort={getAriaSort('reviewerAccountId')}>
              <SortableTableHeaderButton
                label="리뷰어"
                sortKey="reviewerAccountId"
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
            <th scope="col">보고서 URL</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.projectId}>
              <td>{formatMonthLabel(monthKeyFromDate(row.endDate)) || '-'}</td>
              <td>{row.costGroupName || '-'}</td>
              <td>{row.type1 || '-'}</td>
              <td>{row.serviceGroupName || '-'}</td>
              <td>{row.serviceName || '-'}</td>
              <td>{row.platform || '-'}</td>
              <td>
                {row.projectId && row.projectName ? (
                  <Link to={`/projects/${row.projectId}/edit`} className={'table-link'}>
                    {row.projectName}
                  </Link>
                ) : (
                  <strong>{row.projectName || '-'}</strong>
                )}
              </td>
              <td>{row.reporterDisplay || '-'}</td>
              <td>{row.reviewerDisplay || '-'}</td>
              <td className="number-cell">{row.subtaskCount > 0 ? row.subtaskCount : '-'}</td>
              <td>
                {row.reportUrl ? (
                  <a href={row.reportUrl} target="_blank" rel="noreferrer" className={'table-link'}>
                    링크
                  </a>
                ) : (
                  '-'
                )}
              </td>
            </tr>
          ))}
          {!rows.length ? (
            <TableEmptyRow colSpan={11} message="조건에 맞는 프로젝트가 없습니다." />
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
