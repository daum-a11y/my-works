import { Button, Link as KrdsLink } from 'krds-react';
import { SortableTableHeaderButton, TableEmptyRow } from '../../../components/shared';
import type { AdminTaskSearchItem } from '../admin.types';
import type { SortState } from './AdminReportsPage.types';
import { formatTimeCell } from './AdminReportsPage.utils';

interface AdminReportsResultsTableProps {
  tasks: AdminTaskSearchItem[];
  sortState: SortState;
  deletePending: boolean;
  onSortChange: (next: SortState) => void;
  onEdit: (taskId: string) => void;
  onDelete: (taskId: string) => void;
}

export function AdminReportsResultsTable({
  tasks,
  sortState,
  deletePending,
  onSortChange,
  onEdit,
  onDelete,
}: AdminReportsResultsTableProps) {
  const getAriaSort = (key: SortState['key']) => {
    if (sortState.key !== key) {
      return 'none';
    }

    return sortState.direction === 'asc' ? 'ascending' : 'descending';
  };

  return (
    <div className={'krds-page-admin__panel'}>
      <div className={'krds-page-admin__table-wrap krds-table-wrap'}>
        <table className={'krds-page-admin__table tbl data'}>
          <caption className={'sr-only'}>업무보고 검색 결과 테이블</caption>
          <thead>
            <tr>
              <th scope="col" aria-sort={getAriaSort('taskDate')}>
                <SortableTableHeaderButton
                  label="일자"
                  sortKey="taskDate"
                  sortState={sortState}
                  onChange={onSortChange}
                />
              </th>
              <th scope="col" aria-sort={getAriaSort('member')}>
                <SortableTableHeaderButton
                  label="ID"
                  sortKey="member"
                  sortState={sortState}
                  onChange={onSortChange}
                />
              </th>
              <th scope="col" aria-sort={getAriaSort('costGroup')}>
                <SortableTableHeaderButton
                  label="청구그룹"
                  sortKey="costGroup"
                  sortState={sortState}
                  onChange={onSortChange}
                />
              </th>
              <th scope="col" aria-sort={getAriaSort('taskType1')}>
                <SortableTableHeaderButton
                  label="type 1"
                  sortKey="taskType1"
                  sortState={sortState}
                  onChange={onSortChange}
                />
              </th>
              <th scope="col" aria-sort={getAriaSort('taskType2')}>
                <SortableTableHeaderButton
                  label="type 2"
                  sortKey="taskType2"
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
              <th scope="col" aria-sort={getAriaSort('serviceGroup')}>
                <SortableTableHeaderButton
                  label="서비스 그룹"
                  sortKey="serviceGroup"
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
              <th scope="col" aria-sort={getAriaSort('projectName')}>
                <SortableTableHeaderButton
                  label="프로젝트명"
                  sortKey="projectName"
                  sortState={sortState}
                  onChange={onSortChange}
                />
              </th>
              <th scope="col" aria-sort={getAriaSort('subtaskTitle')}>
                <SortableTableHeaderButton
                  label="태스크명"
                  sortKey="subtaskTitle"
                  sortState={sortState}
                  onChange={onSortChange}
                />
              </th>
              <th scope="col">업무명</th>
              <th scope="col">링크</th>
              <th scope="col" aria-sort={getAriaSort('taskUsedtime')}>
                <SortableTableHeaderButton
                  label="시간"
                  sortKey="taskUsedtime"
                  sortState={sortState}
                  onChange={onSortChange}
                />
              </th>
              {/*<th scope="col">비고</th>*/}
              <th scope="col">관리</th>
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 ? (
              <TableEmptyRow colSpan={14} message="검색 조건에 맞는 업무보고가 없습니다." />
            ) : (
              tasks.map((task) => {
                return (
                  <tr key={task.id}>
                    <td>{task.taskDate}</td>
                    <td>
                      <strong>{task.memberAccountId || task.memberId}</strong>
                      <div className={'krds-page-admin__muted'}>{task.memberName}</div>
                    </td>
                    <td>{task.costGroupName || '-'}</td>
                    <td>{task.taskType1}</td>
                    <td>{task.taskType2}</td>
                    <td>{task.platform || '-'}</td>
                    <td>{task.serviceGroupName || '-'}</td>
                    <td>{task.serviceName || '-'}</td>
                    <td>{task.projectName || '-'}</td>
                    <td>{task.subtaskTitle || '-'}</td>
                    <td>{task.content || '-'}</td>
                    <td>
                      {task.url ? (
                        <KrdsLink href={task.url} external>
                          링크
                        </KrdsLink>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>{formatTimeCell(task.taskUsedtime)}</td>
                    {/*<td>{task.note || '-'}</td>*/}
                    <td>
                      <div className={'krds-page-admin__action-stack'}>
                        <Button type="button" variant="secondary" onClick={() => onEdit(task.id)}>
                          수정
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => onDelete(task.id)}
                          disabled={deletePending}
                        >
                          삭제
                        </Button>
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
  );
}
