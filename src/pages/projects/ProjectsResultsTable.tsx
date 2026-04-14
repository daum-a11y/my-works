import { Link as KrdsLink } from 'krds-react';
import {
  KrdsRouterButtonLink,
  SortableTableHeaderButton,
  TableEmptyRow,
} from '../../components/shared';
import type { ProjectListRow } from '../../types/domain';
import { formatDateLabel } from '../../utils';
import type { ProjectsSortState } from './ProjectsPage.types';

interface ProjectsResultsTableProps {
  projects: ProjectListRow[];
  sortState: ProjectsSortState;
  onSortChange: (next: ProjectsSortState) => void;
}

export function ProjectsResultsTable({
  projects,
  sortState,
  onSortChange,
}: ProjectsResultsTableProps) {
  const getAriaSort = (key: ProjectsSortState['key']) => {
    if (sortState.key !== key) {
      return 'none';
    }

    return sortState.direction === 'asc' ? 'ascending' : 'descending';
  };

  return (
    <div className="krds-page__table-wrap krds-table-wrap">
      <table className="krds-page__table tbl data">
        <caption className="sr-only">프로젝트 리스트</caption>
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
            <th scope="col" aria-sort={getAriaSort('taskType1')}>
              <SortableTableHeaderButton
                label="타입1"
                sortKey="taskType1"
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
            <th scope="col" aria-sort={getAriaSort('name')}>
              <SortableTableHeaderButton
                label="프로젝트명"
                sortKey="name"
                sortState={sortState}
                onChange={onSortChange}
              />
            </th>
            <th scope="col" aria-sort={getAriaSort('subtaskCount')}>
              <SortableTableHeaderButton
                label="태스크 수"
                sortKey="subtaskCount"
                sortState={sortState}
                onChange={onSortChange}
              />
            </th>
            <th scope="col">
              보고서
              <br />
              URL
            </th>
            <th scope="col" aria-sort={getAriaSort('startDate')}>
              <SortableTableHeaderButton
                label="QA시작일"
                sortKey="startDate"
                sortState={sortState}
                onChange={onSortChange}
              />
            </th>
            <th scope="col" aria-sort={getAriaSort('endDate')}>
              <SortableTableHeaderButton
                label="QA종료일"
                sortKey="endDate"
                sortState={sortState}
                onChange={onSortChange}
              />
            </th>
            <th scope="col" aria-sort={getAriaSort('reporterDisplay')}>
              <SortableTableHeaderButton
                label="리포터"
                sortKey="reporterDisplay"
                sortState={sortState}
                onChange={onSortChange}
              />
            </th>
            <th scope="col" aria-sort={getAriaSort('reviewerDisplay')}>
              <SortableTableHeaderButton
                label="리뷰어"
                sortKey="reviewerDisplay"
                sortState={sortState}
                onChange={onSortChange}
              />
            </th>
            <th scope="col">수정</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr key={project.id}>
              <td>{project.costGroupName || '-'}</td>
              <td>{project.taskType1 || '-'}</td>
              <td>{project.serviceGroupName || '-'}</td>
              <td>{project.serviceName || '-'}</td>
              <td>{project.platform || '-'}</td>
              <td>{project.name}</td>
              <td>{project.subtaskCount}</td>
              <td>
                {project.reportUrl ? (
                  <KrdsLink size="medium" href={project.reportUrl} external>
                    링크
                  </KrdsLink>
                ) : (
                  '-'
                )}
              </td>
              <td className="krds-page__date-cell">{formatDateLabel(project.startDate)}</td>
              <td className="krds-page__date-cell">{formatDateLabel(project.endDate)}</td>
              <td>{project.reporterDisplay || '-'}</td>
              <td>{project.reviewerDisplay || '-'}</td>
              <td>
                <KrdsRouterButtonLink to={`/projects/${project.id}/edit`}>
                  수정
                </KrdsRouterButtonLink>
              </td>
            </tr>
          ))}
          {!projects.length ? (
            <TableEmptyRow
              colSpan={13}
              message="검색 조건에 맞는 프로젝트가 없습니다."
              description="검색어 또는 기간을 조정하십시오."
            />
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
