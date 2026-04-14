import { Badge } from 'krds-react';
import { KrdsRouterButtonLink } from '../../../components/shared';
import { TableEmptyRow } from '../../../components/shared/TableEmptyRow';
import type { AdminCostGroupItem } from '../admin.types';

interface AdminCostGroupsResultsTableProps {
  costGroups: readonly AdminCostGroupItem[];
}

export function AdminCostGroupsResultsTable({ costGroups }: AdminCostGroupsResultsTableProps) {
  return (
    <div className="krds-page-admin__table-wrap krds-table-wrap">
      <table className="krds-page-admin__table tbl data">
        <caption className="sr-only">청구그룹 내역</caption>
        <thead>
          <tr>
            <th>청구그룹명</th>
            <th>노출여부</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          {costGroups.length ? (
            costGroups.map((item) => (
              <tr key={item.id} className={item.isActive ? '' : 'krds-page-admin__inactive-row'}>
                <td className="krds-page-admin__row-key">{item.name}</td>
                <td>
                  <Badge
                    variant="light"
                    color={item.isActive ? 'success' : 'gray'}
                    size="small"
                  >
                    {item.isActive ? '노출' : '숨김'}
                  </Badge>
                </td>
                <td>
                  <div className="krds-page-admin__actions">
                    <KrdsRouterButtonLink to={`/admin/cost-group/${item.id}/edit`}>
                      수정
                    </KrdsRouterButtonLink>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <TableEmptyRow colSpan={3} message="표시할 청구그룹 내역이 없습니다." />
          )}
        </tbody>
      </table>
    </div>
  );
}
