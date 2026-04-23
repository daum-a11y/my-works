import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, CriticalAlert } from 'krds-react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { setDocumentTitle } from '../../../router/navigation';
import { AdminSortOrderDialog } from '../../../components/admin/AdminSortOrderDialog';
import { PageHeader } from '../../../components/shared/PageHeader';
import { deleteServiceGroupAdmin, getServiceGroupUsageSummary, listServiceGroups, reorderServiceGroups, replaceServiceGroupUsage, saveServiceGroupAdmin } from '../../../api/serviceGroups';
import { AdminServiceGroupsResultsTable } from './AdminServiceGroupsResultsTable';
import type { AdminServiceGroupItem } from '../admin.types';
import { toAdminServiceGroup } from '../adminApiTransform';
import { useAlertMessage } from '../../../hooks/useAlertMessage';

function groupServiceGroups(items: readonly AdminServiceGroupItem[]) {
  const grouped = new Map<string, Map<string, AdminServiceGroupItem[]>>();

  for (const item of items) {
    const costGroupKey = item.costGroupName || '-';
    const serviceGroupKey = item.serviceGroupName || '-';
    const serviceGroups = grouped.get(costGroupKey) ?? new Map<string, AdminServiceGroupItem[]>();
    const rows = serviceGroups.get(serviceGroupKey) ?? [];
    rows.push(item);
    serviceGroups.set(serviceGroupKey, rows);
    grouped.set(costGroupKey, serviceGroups);
  }

  return Array.from(grouped.entries()).map(([costGroupName, serviceGroups]) => {
    const groups = Array.from(serviceGroups.entries()).map(([serviceGroupName, rows]) => ({
      serviceGroupName,
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
    setDocumentTitle('서비스 그룹 관리');
  }, []);

  const serviceGroupsQuery = useQuery({
    queryKey: ['admin', 'service-groups'],
    queryFn: () => listServiceGroups(),
  });

  const serviceGroups = useMemo(
    () =>
      [...(serviceGroupsQuery.data ?? []).map(toAdminServiceGroup)].sort(
        (left, right) =>
          left.costGroupName.localeCompare(right.costGroupName) ||
          left.displayOrder - right.displayOrder ||
          left.name.localeCompare(right.name),
      ),
    [serviceGroupsQuery.data],
  );
  const groupedServiceGroups = useMemo(() => groupServiceGroups(serviceGroups), [serviceGroups]);

  const reorderMutation = useMutation({
    mutationFn: async (ids: string[]) => reorderServiceGroups({ ids }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'service-groups'] });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'cost-groups'] });
      setOrderDialogOpen(false);
      setStatusMessage('서비스 그룹 순서를 저장했습니다.');
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
  useAlertMessage(errorMessage);

  return (
    <section className="admin-page page-view">
      <PageHeader
        title="서비스 그룹 관리"
        actions={
          <>
            <Button
              size="medium"
              type="button"
              variant="secondary"
              onClick={() => setOrderDialogOpen(true)}
              disabled={!serviceGroups.length}
            >
              순서변경
            </Button>
            <Button
              as={RouterLink}
              to="/admin/group/new"
              role="link"
              variant="primary"
              size="medium"
            >
              서비스 그룹 추가
            </Button>
          </>
        }
      />

      {statusMessage ? (
        <CriticalAlert alerts={[{ variant: 'ok', message: statusMessage }]} />
      ) : null}

      <AdminServiceGroupsResultsTable groupedServiceGroups={groupedServiceGroups} />

      <AdminSortOrderDialog
        title="서비스 그룹 순서변경"
        items={serviceGroups.map((item) => ({
          id: item.id,
          title: item.name,
          description: item.costGroupName ? `${item.costGroupName}` : undefined,
          badge: item.svcActive ? '노출' : '숨김',
          badgeColor: item.svcActive ? 'success' : 'gray',
          inactive: !item.svcActive,
        }))}
        isOpen={orderDialogOpen}
        isPending={reorderMutation.isPending}
        errorMessage={reorderMutation.error instanceof Error ? reorderMutation.error.message : ''}
        onClose={() => setOrderDialogOpen(false)}
        onSave={(ids) => reorderMutation.mutateAsync(ids)}
      />
    </section>
  );
}
