import { Link } from 'react-router-dom';
import type { AdminCostGroupItem } from '../types';

interface AdminCostGroupsResultsTableProps {
  costGroups: readonly AdminCostGroupItem[];
}

export function AdminCostGroupsResultsTable({ costGroups }: AdminCostGroupsResultsTableProps) {
  return (
    <div className="admin-crud-page__table-wrap">
      <table className="admin-crud-page__table">
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
              <tr key={item.id} className={item.isActive ? '' : 'admin-crud-page__inactive-row'}>
                <td className="admin-crud-page__row-key">{item.name}</td>
                <td>{item.isActive ? '노출' : '숨김'}</td>
                <td>
                  <div className="admin-crud-page__actions">
                    <Link
                      to={`/admin/cost-group/${item.id}/edit`}
                      className="admin-crud-page__button admin-crud-page__button--secondary"
                    >
                      수정
                    </Link>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={3} className="admin-crud-page__empty-state">
                표시할 청구그룹 내역이 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
