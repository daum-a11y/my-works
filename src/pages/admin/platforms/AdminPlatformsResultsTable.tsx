import { Link } from 'react-router-dom';
import type { AdminPlatformItem } from '../admin.types';

interface AdminPlatformsResultsTableProps {
  platforms: readonly AdminPlatformItem[];
}

export function AdminPlatformsResultsTable({ platforms }: AdminPlatformsResultsTableProps) {
  return (
    <div className="admin-crud-page__table-wrap">
      <table className="admin-crud-page__table">
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
              <tr key={item.id} className={item.isVisible ? '' : 'admin-crud-page__inactive-row'}>
                <td className="admin-crud-page__row-key">{item.name}</td>
                <td>{item.isVisible ? '노출' : '미노출'}</td>
                <td>
                  <div className="admin-crud-page__actions">
                    <Link
                      to={`/admin/platform/${item.id}/edit`}
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
                표시할 플랫폼 내역이 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
