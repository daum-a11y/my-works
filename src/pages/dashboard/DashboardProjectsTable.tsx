import { SortableTableHeaderButton, TableEmptyRow } from '../../components/shared';
import type {
  DashboardProjectRow,
  DashboardProjectsSortState,
} from './DashboardProjectsTable.sort';

interface DashboardProjectsTableProps {
  projects: readonly DashboardProjectRow[];
  sortState: DashboardProjectsSortState;
  onSortChange: (next: DashboardProjectsSortState) => void;
}

export function DashboardProjectsTable({
  projects,
  sortState,
  onSortChange,
}: DashboardProjectsTableProps) {
  const getAriaSort = (key: DashboardProjectsSortState['key']) => {
    if (sortState.key !== key) {
      return 'none';
    }

    return sortState.direction === 'asc' ? 'ascending' : 'descending';
  };

  return (
    <section className="page-section">
      <div className="section-head">
        <h2 className="section-title">진행중인 프로젝트</h2>
      </div>
      <div className="table-wrap">
        <table className="krds-table">
          <caption className="sr-only">진행중인 프로젝트</caption>
          <thead>
            <tr>
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
              <th scope="col" aria-sort={getAriaSort('projectName')}>
                <SortableTableHeaderButton
                  label="프로젝트명"
                  sortKey="projectName"
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
              <th scope="col" aria-sort={getAriaSort('startDate')}>
                <SortableTableHeaderButton
                  label="시작일"
                  sortKey="startDate"
                  sortState={sortState}
                  onChange={onSortChange}
                />
              </th>
              <th scope="col" aria-sort={getAriaSort('endDate')}>
                <SortableTableHeaderButton
                  label="종료일"
                  sortKey="endDate"
                  sortState={sortState}
                  onChange={onSortChange}
                />
              </th>
            </tr>
          </thead>
          <tbody>
            {projects.map((item) => (
              <tr key={item.projectId}>
                <td>{item.costGroupName || '-'}</td>
                <td>{item.type1 || '-'}</td>
                <td>{item.serviceGroupName || '-'}</td>
                <td>{item.projectName || '-'}</td>
                <td>{item.platform || '-'}</td>
                <td>{item.startDate}</td>
                <td>{item.endDate}</td>
              </tr>
            ))}
            {!projects.length ? (
              <TableEmptyRow colSpan={7} message="진행중인 프로젝트가 없습니다." />
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
