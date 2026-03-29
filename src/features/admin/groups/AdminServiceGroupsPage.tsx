import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router-dom';
import { setDocumentTitle } from '../../../app/navigation';
import { adminDataClient } from '../admin-client';
import type { AdminServiceGroupItem } from '../admin-types';
import styles from '../AdminCrudPage.module.css';

function typeLabel(value: number) {
  if (value === 1) return '카카오';
  if (value === 2) return '공동체';
  return '외부';
}

function groupServiceGroups(items: readonly AdminServiceGroupItem[]) {
  const grouped = new Map<string, AdminServiceGroupItem[]>();

  for (const item of items) {
    const key = item.svcGroup || '-';
    const rows = grouped.get(key) ?? [];
    rows.push(item);
    grouped.set(key, rows);
  }

  return Array.from(grouped.entries()).map(([svcGroup, rows]) => ({
    svcGroup,
    rows,
  }));
}

export function AdminServiceGroupsPage() {
  const location = useLocation();
  const [statusMessage, setStatusMessage] = useState('');

  const serviceGroupsQuery = useQuery({
    queryKey: ['admin', 'service-groups'],
    queryFn: () => adminDataClient.listServiceGroups(),
  });

  const serviceGroups = useMemo(
    () =>
      [...(serviceGroupsQuery.data ?? [])].sort(
        (left, right) =>
          (left.legacySvcNum ?? left.displayOrder) - (right.legacySvcNum ?? right.displayOrder) ||
          left.name.localeCompare(right.name),
      ),
    [serviceGroupsQuery.data],
  );
  const groupedServiceGroups = useMemo(() => groupServiceGroups(serviceGroups), [serviceGroups]);

  useEffect(() => {
    setDocumentTitle('서비스그룹 관리');
  }, []);

  useEffect(() => {
    const nextMessage = (location.state as { statusMessage?: string } | null)?.statusMessage;
    if (nextMessage) {
      setStatusMessage(nextMessage);
    }
  }, [location.state]);

  const errorMessage =
    (serviceGroupsQuery.error instanceof Error && serviceGroupsQuery.error.message) || '';

  return (
    <section className={styles.page}>
      <header className={styles.pageHeader}>
        <div className={styles.pageHeaderTop}>
          <div className={styles.pageHeading}>
            <h1 className={styles.title}>서비스그룹 관리</h1>
          </div>
          <Link to="/org/group/new" className={styles.headerAction}>
            서비스그룹 추가
          </Link>
        </div>
      </header>

      {statusMessage ? <p className={styles.helperText}>{statusMessage}</p> : null}
      {errorMessage ? <p className={styles.helperText}>{errorMessage}</p> : null}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <caption className={styles.srOnly}>서비스그룹 내역</caption>
          <thead>
            <tr>
              <th>서비스그룹</th>
              <th>서비스명</th>
              <th>분류</th>
              <th>활성여부</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {groupedServiceGroups.length ? (
              groupedServiceGroups.map((group) =>
                group.rows.map((item, rowIndex) => (
                  <tr key={item.id} className={item.svcActive ? '' : styles.inactiveRow}>
                    {rowIndex === 0 ? (
                      <td rowSpan={group.rows.length} scope="row" className={styles.rowKey}>
                        {group.svcGroup}
                      </td>
                    ) : null}
                    <td>{item.svcName || '-'}</td>
                    <td>{typeLabel(item.svcType)}</td>
                    <td>{item.svcActive ? '활성' : '비활성'}</td>
                    <td>
                      <div className={styles.actions}>
                        <Link to={`/org/group/${item.id}/edit`} className={styles.secondaryButton}>
                          수정
                        </Link>
                      </div>
                    </td>
                  </tr>
                )),
              )
            ) : (
              <tr>
                <td colSpan={5} className={styles.emptyState}>
                  표시할 서비스그룹 내역이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
