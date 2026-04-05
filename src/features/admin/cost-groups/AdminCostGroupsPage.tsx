import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router-dom';
import { setDocumentTitle } from '../../../app/navigation';
import { adminDataClient } from '../adminClient';
import styles from '../AdminCrudPage.module.css';

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
    <section className={styles.page}>
      <header className={styles.pageHeader}>
        <div className={styles.pageHeaderTop}>
          <div className={styles.pageHeading}>
            <h1 className={styles.title}>청구그룹 관리</h1>
          </div>
          <Link to="/org/cost-group/new" className={styles.headerAction}>
            청구그룹 추가
          </Link>
        </div>
      </header>

      {statusMessage ? <p className={styles.helperText}>{statusMessage}</p> : null}
      {errorMessage ? <p className={styles.helperText}>{errorMessage}</p> : null}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <caption className={styles.srOnly}>청구그룹 내역</caption>
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
                <tr key={item.id} className={item.isActive ? '' : styles.inactiveRow}>
                  <td className={styles.rowKey}>{item.name}</td>
                  <td>{item.isActive ? '노출' : '숨김'}</td>
                  <td>
                    <div className={styles.actions}>
                      <Link
                        to={`/org/cost-group/${item.id}/edit`}
                        className={styles.secondaryButton}
                      >
                        수정
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className={styles.emptyState}>
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
