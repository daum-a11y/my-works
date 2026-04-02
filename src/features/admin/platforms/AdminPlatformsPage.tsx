import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router-dom';
import { setDocumentTitle } from '../../../app/navigation';
import { adminDataClient } from '../adminClient';
import styles from '../AdminCrudPage.module.css';

export function AdminPlatformsPage() {
  const location = useLocation();
  const [statusMessage, setStatusMessage] = useState('');

  const platformsQuery = useQuery({
    queryKey: ['admin', 'platforms'],
    queryFn: () => adminDataClient.listPlatforms(),
  });

  const platforms = useMemo(
    () =>
      [...(platformsQuery.data ?? [])].sort(
        (left, right) =>
          left.displayOrder - right.displayOrder || left.name.localeCompare(right.name),
      ),
    [platformsQuery.data],
  );

  useEffect(() => {
    setDocumentTitle('플랫폼 관리');
  }, []);

  useEffect(() => {
    const nextMessage = (location.state as { statusMessage?: string } | null)?.statusMessage;
    if (nextMessage) {
      setStatusMessage(nextMessage);
    }
  }, [location.state]);

  const errorMessage =
    (platformsQuery.error instanceof Error && platformsQuery.error.message) || '';

  return (
    <section className={styles.page}>
      <header className={styles.pageHeader}>
        <div className={styles.pageHeaderTop}>
          <div className={styles.pageHeading}>
            <h1 className={styles.title}>플랫폼 관리</h1>
          </div>
          <Link to="/org/platform/new" className={styles.headerAction}>
            플랫폼 추가
          </Link>
        </div>
      </header>

      {statusMessage ? <p className={styles.helperText}>{statusMessage}</p> : null}
      {errorMessage ? <p className={styles.helperText}>{errorMessage}</p> : null}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <caption className={styles.srOnly}>플랫폼 내역</caption>
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
                <tr key={item.id} className={item.isVisible ? '' : styles.inactiveRow}>
                  <td className={styles.rowKey}>{item.name}</td>
                  <td>{item.isVisible ? '노출' : '미노출'}</td>
                  <td>
                    <div className={styles.actions}>
                      <Link to={`/org/platform/${item.id}/edit`} className={styles.secondaryButton}>
                        수정
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className={styles.emptyState}>
                  표시할 플랫폼 내역이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
