import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router-dom';
import { setDocumentTitle } from '../../../app/navigation';
import { adminDataClient } from '../adminClient';
import type { AdminServiceGroupItem } from '../admin-types';
import '../../../styles/domain/pages/admin-crud-page.scss';

function groupServiceGroups(items: readonly AdminServiceGroupItem[]) {
  const grouped = new Map<string, Map<string, AdminServiceGroupItem[]>>();

  for (const item of items) {
    const costGroupKey = item.costGroupName || '-';
    const serviceGroupKey = item.svcGroup || '-';
    const serviceGroups = grouped.get(costGroupKey) ?? new Map<string, AdminServiceGroupItem[]>();
    const rows = serviceGroups.get(serviceGroupKey) ?? [];
    rows.push(item);
    serviceGroups.set(serviceGroupKey, rows);
    grouped.set(costGroupKey, serviceGroups);
  }

  return Array.from(grouped.entries()).map(([costGroupName, serviceGroups]) => {
    const groups = Array.from(serviceGroups.entries()).map(([svcGroup, rows]) => ({
      svcGroup,
      rows,
    }));

    return {
      costGroupName,
      groups,
      rowSpan: groups.reduce((sum, group) => sum + group.rows.length, 0),
    };
  });
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
          left.costGroupName.localeCompare(right.costGroupName) ||
          left.displayOrder - right.displayOrder ||
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
    <section className="adminCrudPageScope page">
      <header className="pageHeader">
        <div className="pageHeaderTop">
          <div className="pageHeading">
            <h1 className="title">서비스그룹 관리</h1>
          </div>
          <Link to="/org/group/new" className="headerAction">
            서비스그룹 추가
          </Link>
        </div>
      </header>

      {statusMessage ? <p className="helperText">{statusMessage}</p> : null}
      {errorMessage ? <p className="helperText">{errorMessage}</p> : null}

      <div className="tableWrap">
        <table className="table">
          <caption className="srOnly">서비스그룹 내역</caption>
          <thead>
            <tr>
              <th>청구그룹</th>
              <th>서비스그룹</th>
              <th>서비스명</th>
              <th>노출여부</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {groupedServiceGroups.length ? (
              groupedServiceGroups.map((costGroup) =>
                costGroup.groups.map((group) =>
                  group.rows.map((item, rowIndex) => (
                    <tr key={item.id} className={item.svcActive ? '' : 'inactiveRow'}>
                      {group === costGroup.groups[0] && rowIndex === 0 ? (
                        <td rowSpan={costGroup.rowSpan} className="rowKey">
                          {costGroup.costGroupName}
                        </td>
                      ) : null}
                      {rowIndex === 0 ? (
                        <td rowSpan={group.rows.length} scope="row" className="rowKey">
                          {group.svcGroup}
                        </td>
                      ) : null}
                      <td>{item.svcName || '-'}</td>
                      <td>{item.svcActive ? '노출' : '숨김'}</td>
                      <td>
                        <div className="actions">
                          <Link to={`/org/group/${item.id}/edit`} className="secondaryButton">
                            수정
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )),
                ),
              )
            ) : (
              <tr>
                <td colSpan={5} className="emptyState">
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
