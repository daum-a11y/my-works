import { Badge, Button } from 'krds-react';
import { Link as RouterLink } from 'react-router-dom';
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
    <div className="table-wrap krds-table-wrap">
      <table className="krds-table tbl data">
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
                  const inactiveCellClassName = item.svcActive ? undefined : 'is-muted';

                  return (
                    <tr key={item.id}>
                      {group === costGroup.groups[0] && rowIndex === 0 ? (
                        <td rowSpan={costGroup.rowSpan} className="row-title">
                          {costGroup.costGroupName}
                        </td>
                      ) : null}
                      {rowIndex === 0 ? (
                        <td rowSpan={group.rows.length} scope="row" className="row-title">
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
                        <div className="action-group">
                          <Button as={RouterLink} to={`/admin/group/${item.id}/edit`} role="link">
                            수정
                          </Button>
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
