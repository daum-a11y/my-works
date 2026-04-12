import { Link } from 'react-router-dom';
import type { AdminServiceGroupItem } from '../admin.types';

interface AdminServiceGroupGroup {
  serviceGroupName: string;
  rows: AdminServiceGroupItem[];
}

interface AdminServiceCostGroup {
  costGroupName: string;
  groups: AdminServiceGroupGroup[];
  rowSpan: number;
}

interface AdminServiceGroupsResultsTableProps {
  groupedServiceGroups: readonly AdminServiceCostGroup[];
}

export function AdminServiceGroupsResultsTable({
  groupedServiceGroups,
}: AdminServiceGroupsResultsTableProps) {
  return (
    <div className="admin-crud-page__table-wrap">
      <table className="admin-crud-page__table">
        <caption className="sr-only">서비스 그룹 내역</caption>
        <thead>
          <tr>
            <th>청구그룹</th>
            <th>서비스 그룹</th>
            <th>서비스명</th>
            <th>노출여부</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          {groupedServiceGroups.length ? (
            groupedServiceGroups.map((costGroup) =>
              costGroup.groups.map((group) =>
                group.rows.map((item, rowIndex) => {
                  const inactiveCellClassName = item.svcActive
                    ? undefined
                    : 'admin-crud-page__inactive-cell';

                  return (
                    <tr key={item.id}>
                      {group === costGroup.groups[0] && rowIndex === 0 ? (
                        <td rowSpan={costGroup.rowSpan} className="admin-crud-page__row-key">
                          {costGroup.costGroupName}
                        </td>
                      ) : null}
                      {rowIndex === 0 ? (
                        <td
                          rowSpan={group.rows.length}
                          scope="row"
                          className="admin-crud-page__row-key"
                        >
                          {group.serviceGroupName}
                        </td>
                      ) : null}
                      <td className={inactiveCellClassName}>{item.serviceName || '-'}</td>
                      <td className={inactiveCellClassName}>{item.svcActive ? '노출' : '숨김'}</td>
                      <td className={inactiveCellClassName}>
                        <div className="admin-crud-page__actions">
                          <Link
                            to={`/admin/group/${item.id}/edit`}
                            className="admin-crud-page__button admin-crud-page__button--secondary"
                          >
                            수정
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                }),
              ),
            )
          ) : (
            <tr>
              <td colSpan={5} className="admin-crud-page__empty-state">
                표시할 서비스 그룹 내역이 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
