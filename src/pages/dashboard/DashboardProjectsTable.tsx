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
    <section className="dashboard-page__section">
      <div className="dashboard-page__section-head">
        <h2 className="dashboard-page__section-title">진행중인 프로젝트</h2>
      </div>
      <div className="dashboard-page__table-wrap">
        <table className="dashboard-page__table">
          <caption className="sr-only">진행중인 프로젝트</caption>
          <thead>
            <tr>
              <th scope="col" aria-sort={getAriaSort('costGroupName')} aria-label="청구그룹">
                <SortableTableHeaderButton
                  label="청구그룹"
                  sortKey="costGroupName"
                  sortState={sortState}
                  onChange={onSortChange}
                />
              </th>
              <th scope="col" aria-sort={getAriaSort('type1')} aria-label="타입1">
                <SortableTableHeaderButton
                  label="타입1"
                  sortKey="type1"
                  sortState={sortState}
                  onChange={onSortChange}
                />
              </th>
              <th
                scope="col"
                aria-sort={getAriaSort('serviceGroupName')}
                aria-label="서비스 그룹"
              >
                <SortableTableHeaderButton
                  label="서비스 그룹"
                  sortKey="serviceGroupName"
                  sortState={sortState}
                  onChange={onSortChange}
                />
              </th>
              <th scope="col" aria-sort={getAriaSort('projectName')} aria-label="프로젝트명">
                <SortableTableHeaderButton
                  label="프로젝트명"
                  sortKey="projectName"
                  sortState={sortState}
                  onChange={onSortChange}
                />
              </th>
              <th scope="col" aria-sort={getAriaSort('platform')} aria-label="플랫폼">
                <SortableTableHeaderButton
                  label="플랫폼"
                  sortKey="platform"
                  sortState={sortState}
                  onChange={onSortChange}
                />
              </th>
              <th scope="col" aria-sort={getAriaSort('startDate')} aria-label="시작일">
                <SortableTableHeaderButton
                  label="시작일"
                  sortKey="startDate"
                  sortState={sortState}
                  onChange={onSortChange}
                />
              </th>
              <th scope="col" aria-sort={getAriaSort('endDate')} aria-label="종료일">
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
