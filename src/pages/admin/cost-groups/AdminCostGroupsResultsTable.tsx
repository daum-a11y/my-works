import { Badge, Button } from 'krds-react';
import { Link as RouterLink } from 'react-router-dom';
import { TableEmptyRow } from '../../../components/shared/TableEmptyRow';
import type { AdminCostGroupItem } from '../admin.types';

interface AdminCostGroupsResultsTableProps {
  costGroups: readonly AdminCostGroupItem[];
}

export function AdminCostGroupsResultsTable({ costGroups }: AdminCostGroupsResultsTableProps) {
  return (
    <div className="table-wrap krds-table-wrap">
      <table className="krds-table tbl data">
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
              <tr key={item.id} className={item.isActive ? '' : 'is-muted'}>
                <td className="row-title">{item.name}</td>
                <td>
                  <Badge variant="light" color={item.isActive ? 'success' : 'gray'} size="small">
                    {item.isActive ? '노출' : '숨김'}
                  </Badge>
                </td>
                <td>
                  <div className="action-group">
                    <Button as={RouterLink} to={`/admin/cost-group/${item.id}/edit`} role="link">
                      수정
                    </Button>
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
