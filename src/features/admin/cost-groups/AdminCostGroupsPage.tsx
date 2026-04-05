import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router-dom';
import { setDocumentTitle } from '../../../app/navigation';
import { adminDataClient } from '../adminClient';
import '../../../styles/domain/pages/admin-crud-page.scss';

export function AdminCostGroupsPage() {
  const location = useLocation();
  const [statusMessage, setStatusMessage] = useState('');

  const costGroupsQuery = useQuery({
    queryKey: ['admin', 'cost-groups'],
    queryFn: () => adminDataClient.listCostGroups(),
  });

  const costGroups = useMemo(
    () =>
      [...(costGroupsQuery.data ?? [])].sort(
        (left, right) =>
          left.displayOrder - right.displayOrder || left.name.localeCompare(right.name),
      ),
    [costGroupsQuery.data],
  );

  useEffect(() => {
    setDocumentTitle('청구그룹 관리');
  }, []);

  useEffect(() => {
    const nextMessage = (location.state as { statusMessage?: string } | null)?.statusMessage;
    if (nextMessage) {
      setStatusMessage(nextMessage);
    }
  }, [location.state]);

  const errorMessage =
    (costGroupsQuery.error instanceof Error && costGroupsQuery.error.message) || '';

  return (
    <section className={'page'}>
      <header className={'pageHeader'}>
        <div className={'pageHeaderTop'}>
          <div className={'pageHeading'}>
            <h1 className={'title'}>청구그룹 관리</h1>
          </div>
          <Link to="/org/cost-group/new" className={'headerAction'}>
            청구그룹 추가
          </Link>
        </div>
      </header>

      {statusMessage ? <p className={'helperText'}>{statusMessage}</p> : null}
      {errorMessage ? <p className={'helperText'}>{errorMessage}</p> : null}

      <div className={'tableWrap'}>
        <table className={'table'}>
          <caption className={'srOnly'}>청구그룹 내역</caption>
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
                <tr key={item.id} className={item.isActive ? '' : 'inactiveRow'}>
                  <td className={'rowKey'}>{item.name}</td>
                  <td>{item.isActive ? '노출' : '숨김'}</td>
                  <td>
                    <div className={'actions'}>
                      <Link to={`/org/cost-group/${item.id}/edit`} className={'secondaryButton'}>
                        수정
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className={'emptyState'}>
                  표시할 청구그룹 내역이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
