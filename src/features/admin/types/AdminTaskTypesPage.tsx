import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router-dom';
import { setDocumentTitle } from '../../../app/navigation';
import { adminDataClient } from '../adminClient';
import '../../../styles/domain/pages/admin-crud-page.scss';
import type { AdminTaskTypeItem } from '../admin-types';

function groupTaskTypes(taskTypes: AdminTaskTypeItem[]) {
  const grouped = new Map<string, AdminTaskTypeItem[]>();

  for (const taskType of taskTypes) {
    const items = grouped.get(taskType.type1) ?? [];
    items.push(taskType);
    grouped.set(taskType.type1, items);
  }

  return Array.from(grouped.entries())
    .map(([type1, rows]) => ({
      type1,
      rows: [...rows].sort(
        (left, right) =>
          left.displayOrder - right.displayOrder || left.type2.localeCompare(right.type2),
      ),
    }))
    .sort((left, right) => {
      const leftOrder = left.rows[0]?.displayOrder ?? 0;
      const rightOrder = right.rows[0]?.displayOrder ?? 0;
      return leftOrder - rightOrder || left.type1.localeCompare(right.type1);
    });
}

export function AdminTaskTypesPage() {
  const location = useLocation();
  const [statusMessage, setStatusMessage] = useState('');

  const taskTypesQuery = useQuery({
    queryKey: ['admin', 'task-types'],
    queryFn: () => adminDataClient.listTaskTypes(),
  });

  const taskTypes = useMemo(
    () =>
      [...(taskTypesQuery.data ?? [])].sort(
        (left, right) =>
          left.displayOrder - right.displayOrder ||
          left.type1.localeCompare(right.type1) ||
          left.type2.localeCompare(right.type2),
      ),
    [taskTypesQuery.data],
  );

  const groupedTaskTypes = useMemo(() => groupTaskTypes(taskTypes), [taskTypes]);
  const activeTypeMap = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const item of taskTypes) {
      map.set(item.id, item.isActive);
    }
    return map;
  }, [taskTypes]);

  useEffect(() => {
    setDocumentTitle('업무 타입 관리');
  }, []);

  useEffect(() => {
    const nextMessage = (location.state as { statusMessage?: string } | null)?.statusMessage;
    if (nextMessage) {
      setStatusMessage(nextMessage);
    }
  }, [location.state]);

  const errorMessage =
    (taskTypesQuery.error instanceof Error && taskTypesQuery.error.message) || '';

  return (
    <section className="adminCrudPageScope page">
      <header className="pageHeader">
        <div className="pageHeaderTop">
          <div className="pageHeading">
            <h1 className="title">업무 타입 관리</h1>
          </div>
          <Link to="/org/type/new" className="headerAction">
            업무 타입 추가
          </Link>
        </div>
      </header>

      {statusMessage ? <p className="helperText">{statusMessage}</p> : null}
      {errorMessage ? <p className="helperText">{errorMessage}</p> : null}

      <div className="tableWrap">
        <table className="table">
          <caption className="srOnly">업무타입 내역</caption>
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
                  <tr key={item.id} className={activeTypeMap.get(item.id) ? '' : 'inactiveRow'}>
                    {rowIndex === 0 ? (
                      <td rowSpan={group.rows.length} scope="row" className="rowKey">
                        {group.type1}
                      </td>
                    ) : null}
                    <td>{item.type2}</td>
                    <td>{item.requiresServiceGroup ? '프로젝트' : '일반'}</td>
                    <td>{activeTypeMap.get(item.id) ? '활성' : '비활성'}</td>
                    <td>{item.displayLabel || '-'}</td>
                    <td>
                      <div className="actions">
                        <Link to={`/org/type/${item.id}/edit`} className="secondaryButton">
                          수정
                        </Link>
                      </div>
                    </td>
                  </tr>
                )),
              )
            ) : (
              <tr>
                <td className="emptyState" colSpan={6}>
                  표시할 업무타입 내역이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
