import { Link } from 'react-router-dom';
import type { AdminTaskTypeItem } from '../types';

interface AdminTaskTypeGroup {
  type1: string;
  rows: AdminTaskTypeItem[];
}

interface AdminTaskTypesResultsTableProps {
  groupedTaskTypes: readonly AdminTaskTypeGroup[];
  activeTypeMap: ReadonlyMap<string, boolean>;
}

export function AdminTaskTypesResultsTable({
  groupedTaskTypes,
  activeTypeMap,
}: AdminTaskTypesResultsTableProps) {
  return (
    <div className="admin-crud-page__table-wrap">
      <table className="admin-crud-page__table">
        <caption className="sr-only">업무타입 내역</caption>
        <thead>
          <tr>
            <th>타입1</th>
            <th>타입2</th>
            <th>리소스 타입</th>
            <th>활성여부</th>
            <th>비고</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          {groupedTaskTypes.length ? (
            groupedTaskTypes.map((group) =>
              group.rows.map((item, rowIndex) => (
                <tr
                  key={item.id}
                  className={activeTypeMap.get(item.id) ? '' : 'admin-crud-page__inactive-row'}
                >
                  {rowIndex === 0 ? (
                    <td
                      rowSpan={group.rows.length}
                      scope="row"
                      className="admin-crud-page__row-key"
                    >
                      {group.type1}
                    </td>
                  ) : null}
                  <td>{item.type2}</td>
                  <td>{item.requiresServiceGroup ? '프로젝트' : '일반'}</td>
                  <td>{activeTypeMap.get(item.id) ? '활성' : '비활성'}</td>
                  <td>{item.displayLabel || '-'}</td>
                  <td>
                    <div className="admin-crud-page__actions">
                      <Link
                        to={`/admin/type/${item.id}/edit`}
                        className="admin-crud-page__button admin-crud-page__button--secondary"
                      >
                        수정
                      </Link>
                    </div>
                  </td>
                </tr>
              )),
            )
          ) : (
            <tr>
              <td className="admin-crud-page__empty-state" colSpan={6}>
                표시할 업무타입 내역이 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
