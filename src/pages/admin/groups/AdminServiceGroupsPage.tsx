import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router-dom';
import { setDocumentTitle } from '../../../router/navigation';
import { AdminOrderDialog } from '../../../components/admin/AdminOrderDialog';
import { adminDataClient } from '../../../api/admin';
import type { AdminServiceGroupItem } from '../types';
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
  const queryClient = useQueryClient();
  const [statusMessage, setStatusMessage] = useState('');
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);

  useEffect(() => {
    setDocumentTitle('서비스그룹 관리');
  }, []);

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

  const reorderMutation = useMutation({
    mutationFn: async (ids: string[]) => adminDataClient.reorderServiceGroups({ ids }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'service-groups'] });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'cost-groups'] });
      setOrderDialogOpen(false);
      setStatusMessage('서비스그룹 순서를 저장했습니다.');
    },
  });

  useEffect(() => {
    const nextMessage = (location.state as { statusMessage?: string } | null)?.statusMessage;
    if (nextMessage) {
      setStatusMessage(nextMessage);
    }
  }, [location.state]);

  const errorMessage =
    (serviceGroupsQuery.error instanceof Error && serviceGroupsQuery.error.message) ||
    (reorderMutation.error instanceof Error && reorderMutation.error.message) ||
    '';

  return (
    <section className="admin-crud-page admin-crud-page--page">
      <header className="admin-crud-page__page-header">
        <div className="admin-crud-page__page-header-top">
          <div className="admin-crud-page__page-heading">
            <h1 className="admin-crud-page__title">서비스그룹 관리</h1>
          </div>
          <div className="admin-crud-page__page-header-actions">
            <button
              type="button"
              className="admin-crud-page__header-action"
              onClick={() => setOrderDialogOpen(true)}
              disabled={!serviceGroups.length}
            >
              순서변경
            </button>
            <Link to="/admin/group/new" className="admin-crud-page__header-action">
              서비스그룹 추가
            </Link>
          </div>
        </div>
      </header>

      {statusMessage ? <p className="admin-crud-page__helper-text">{statusMessage}</p> : null}
      {errorMessage ? <p className="admin-crud-page__helper-text">{errorMessage}</p> : null}

      <div className="admin-crud-page__table-wrap">
        <table className="admin-crud-page__table">
          <caption className="sr-only">서비스그룹 내역</caption>
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
                    <tr
                      key={item.id}
                      className={item.svcActive ? '' : 'admin-crud-page__inactive-row'}
                    >
                      {group === costGroup.groups[0] && rowIndex === 0 ? (
                        <td rowSpan={costGroup.rowSpan} className="admin-crud-page__row-key">
                          {costGroup.costGroupName}
                        </td>
                      ) : null}
                      {rowIndex === 0 ? (
                        <td
                          rowSpan={group.rows.length}
                          scope="row"
                          className="admin-crud-page__row-key"
                        >
                          {group.svcGroup}
                        </td>
                      ) : null}
                      <td>{item.svcName || '-'}</td>
                      <td>{item.svcActive ? '노출' : '숨김'}</td>
                      <td>
                        <div className="admin-crud-page__actions">
                          <Link
                            to={`/admin/group/${item.id}/edit`}
                            className="admin-crud-page__button admin-crud-page__button--secondary"
                          >
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
                <td colSpan={5} className="admin-crud-page__empty-state">
                  표시할 서비스그룹 내역이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AdminOrderDialog
        title="서비스그룹 순서변경"
        description="서비스그룹과 서비스명 목록의 노출 순서를 저장합니다."
        items={serviceGroups.map((item) => ({
          id: item.id,
          title: item.name,
          description: item.costGroupName ? `청구그룹: ${item.costGroupName}` : undefined,
          badge: item.svcActive ? '노출' : '숨김',
          inactive: !item.svcActive,
        }))}
        isOpen={orderDialogOpen}
        isSaving={reorderMutation.isPending}
        errorMessage={reorderMutation.error instanceof Error ? reorderMutation.error.message : ''}
        onClose={() => setOrderDialogOpen(false)}
        onSave={(ids) => reorderMutation.mutateAsync(ids)}
      />
    </section>
  );
}
