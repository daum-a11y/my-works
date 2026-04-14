import { Badge } from 'krds-react';
import { KrdsRouterButtonLink } from '../../../components/shared';
import { TableEmptyRow } from '../../../components/shared/TableEmptyRow';
import type { AdminPlatformItem } from '../admin.types';

interface AdminPlatformsResultsTableProps {
  platforms: readonly AdminPlatformItem[];
}

export function AdminPlatformsResultsTable({ platforms }: AdminPlatformsResultsTableProps) {
  return (
    <div className="krds-page-admin__table-wrap krds-table-wrap">
      <table className="krds-page-admin__table tbl data">
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
              <tr key={item.id} className={item.isVisible ? '' : 'krds-page-admin__inactive-row'}>
                <td className="krds-page-admin__row-key">{item.name}</td>
                <td>
                  <Badge
                    variant="light"
                    color={item.isVisible ? 'success' : 'gray'}
                    size="small"
                  >
                    {item.isVisible ? '노출' : '미노출'}
                  </Badge>
                </td>
                <td>
                  <div className="krds-page-admin__actions">
                    <KrdsRouterButtonLink to={`/admin/platform/${item.id}/edit`}>
                      수정
                    </KrdsRouterButtonLink>
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
