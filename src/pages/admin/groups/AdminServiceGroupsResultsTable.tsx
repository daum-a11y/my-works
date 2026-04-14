import { Badge } from 'krds-react';
import { KrdsRouterButtonLink } from '../../../components/shared';
import { TableEmptyRow } from '../../../components/shared/TableEmptyRow';
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
    <div className="krds-page-admin__table-wrap krds-table-wrap">
      <table className="krds-page-admin__table tbl data">
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
                    : 'krds-page-admin__inactive-cell';

                  return (
                    <tr key={item.id}>
                      {group === costGroup.groups[0] && rowIndex === 0 ? (
                        <td rowSpan={costGroup.rowSpan} className="krds-page-admin__row-key">
                          {costGroup.costGroupName}
                        </td>
                      ) : null}
                      {rowIndex === 0 ? (
                        <td
                          rowSpan={group.rows.length}
                          scope="row"
                          className="krds-page-admin__row-key"
                        >
                          {group.serviceGroupName}
                        </td>
                      ) : null}
                      <td className={inactiveCellClassName}>{item.serviceName || '-'}</td>
                      <td className={inactiveCellClassName}>
                        <Badge
                          variant="light"
                          color={item.svcActive ? 'success' : 'gray'}
                          size="small"
                        >
                          {item.svcActive ? '노출' : '숨김'}
                        </Badge>
                      </td>
                      <td className={inactiveCellClassName}>
                        <div className="krds-page-admin__actions">
                          <KrdsRouterButtonLink to={`/admin/group/${item.id}/edit`}>
                            수정
                          </KrdsRouterButtonLink>
                        </div>
                      </td>
                    </tr>
                  );
                }),
              ),
            )
          ) : (
            <TableEmptyRow colSpan={5} message="표시할 서비스 그룹 내역이 없습니다." />
          )}
        </tbody>
      </table>
    </div>
  );
}
