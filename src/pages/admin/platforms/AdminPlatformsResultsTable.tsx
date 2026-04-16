import { Badge, Button } from 'krds-react';
import { Link as RouterLink } from 'react-router-dom';
import { TableEmptyRow } from '../../../components/shared/TableEmptyRow';
import type { AdminPlatformItem } from '../admin.types';

interface AdminPlatformsResultsTableProps {
  platforms: readonly AdminPlatformItem[];
}

export function AdminPlatformsResultsTable({ platforms }: AdminPlatformsResultsTableProps) {
  return (
    <div className="table-wrap krds-table-wrap">
      <table className="krds-table tbl data">
        <caption className="sr-only">플랫폼 내역</caption>
        <thead>
          <tr>
            <th>플랫폼명</th>
            <th>노출여부</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          {platforms.length ? (
            platforms.map((item) => (
              <tr key={item.id} className={item.isVisible ? '' : 'is-muted'}>
                <td className="row-title">{item.name}</td>
                <td>
                  <Badge variant="light" color={item.isVisible ? 'success' : 'gray'} size="small">
                    {item.isVisible ? '노출' : '미노출'}
                  </Badge>
                </td>
                <td>
                  <div className="action-group">
                    <Button as={RouterLink} to={`/admin/platform/${item.id}/edit`} role="link">
                      수정
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <TableEmptyRow colSpan={3} message="표시할 플랫폼 내역이 없습니다." />
          )}
        </tbody>
      </table>
    </div>
  );
}
