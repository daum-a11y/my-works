import { TableEmptyRow } from '../../../components/shared/TableEmptyRow';
import type { AdminTaskSearchItem, MemberAdminItem } from '../types';
import type { SortState } from './AdminReportsPage.types';
import { AdminReportsSortButton } from './AdminReportsSortButton';
import { formatTimeCell } from './AdminReportsPage.utils';

interface AdminReportsResultsTableProps {
  tasks: AdminTaskSearchItem[];
  membersById: Map<string, MemberAdminItem>;
  sortState: SortState;
  deletePending: boolean;
  onSortChange: (next: SortState) => void;
  onEdit: (taskId: string) => void;
  onDelete: (taskId: string) => void;
}

export function AdminReportsResultsTable({
  tasks,
  membersById,
  sortState,
  deletePending,
  onSortChange,
  onEdit,
  onDelete,
}: AdminReportsResultsTableProps) {
  return (
    <div className={'admin-reports-page__panel'}>
      <div className={'admin-reports-page__table-wrap'}>
        <table className={'admin-reports-page__table'}>
          <thead>
            <tr>
              <th>
                <AdminReportsSortButton
                  label="일자"
                  sortKey="taskDate"
                  sortState={sortState}
                  onChange={onSortChange}
                />
              </th>
              <th>
                <AdminReportsSortButton
                  label="ID"
                  sortKey="member"
                  sortState={sortState}
                  onChange={onSortChange}
                />
              </th>
              <th>
                <AdminReportsSortButton
                  label="청구그룹"
                  sortKey="costGroup"
                  sortState={sortState}
                  onChange={onSortChange}
                />
              </th>
              <th>
                <AdminReportsSortButton
                  label="type 1"
                  sortKey="taskType1"
                  sortState={sortState}
                  onChange={onSortChange}
                />
              </th>
              <th>
                <AdminReportsSortButton
                  label="type 2"
                  sortKey="taskType2"
                  sortState={sortState}
                  onChange={onSortChange}
                />
              </th>
              <th>
                <AdminReportsSortButton
                  label="플랫폼"
                  sortKey="platform"
                  sortState={sortState}
                  onChange={onSortChange}
                />
              </th>
              <th>
                <AdminReportsSortButton
                  label="서비스그룹"
                  sortKey="serviceGroup"
                  sortState={sortState}
                  onChange={onSortChange}
                />
              </th>
              <th>
                <AdminReportsSortButton
                  label="서비스명"
                  sortKey="serviceName"
                  sortState={sortState}
                  onChange={onSortChange}
                />
              </th>
              <th>
                <AdminReportsSortButton
                  label="프로젝트명"
                  sortKey="projectName"
                  sortState={sortState}
                  onChange={onSortChange}
                />
              </th>
              <th>
                <AdminReportsSortButton
                  label="페이지명"
                  sortKey="pageTitle"
                  sortState={sortState}
                  onChange={onSortChange}
                />
              </th>
              <th>링크</th>
              <th>
                <AdminReportsSortButton
                  label="시간"
                  sortKey="taskUsedtime"
                  sortState={sortState}
                  onChange={onSortChange}
                />
              </th>
              <th>비고</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 ? (
              <TableEmptyRow
                colSpan={14}
                className={'admin-reports-page__empty-state'}
                message="검색 결과가 없습니다."
              />
            ) : (
              tasks.map((task) => {
                const member = membersById.get(task.memberId);

                return (
                  <tr key={task.id}>
                    <td>{task.taskDate}</td>
                    <td>
                      <strong>{member?.accountId ?? task.memberId}</strong>
                      <div className={'admin-reports-page__muted'}>
                        {member?.name ?? task.memberName}
                      </div>
                    </td>
                    <td>{task.costGroupName || '-'}</td>
                    <td>{task.taskType1}</td>
                    <td>{task.taskType2}</td>
                    <td>{task.platform || '-'}</td>
                    <td>{task.serviceGroupName || '-'}</td>
                    <td>{task.serviceName || '-'}</td>
                    <td>{task.projectName || '-'}</td>
                    <td>{task.pageTitle || '-'}</td>
                    <td>
                      {task.pageUrl ? (
                        <a
                          href={task.pageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className={'admin-reports-page__table-link'}
                        >
                          링크
                        </a>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>{formatTimeCell(task.taskUsedtime)}</td>
                    <td>{task.note || '-'}</td>
                    <td>
                      <div className={'admin-reports-page__action-stack'}>
                        <button
                          type="button"
                          className={
                            'admin-reports-page__button admin-reports-page__button--action'
                          }
                          onClick={() => onEdit(task.id)}
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          className={
                            'admin-reports-page__button admin-reports-page__button--delete'
                          }
                          onClick={() => onDelete(task.id)}
                          disabled={deletePending}
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
  );
}
