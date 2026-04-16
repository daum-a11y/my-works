import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, CriticalAlert } from 'krds-react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { setDocumentTitle } from '../../../router/navigation';
import { AdminSortOrderDialog } from '../../../components/admin/AdminSortOrderDialog';
import { PageHeader } from '../../../components/shared/PageHeader';
import { adminDataClient } from '../../../api/admin';
import { AdminCostGroupsResultsTable } from './AdminCostGroupsResultsTable';
import { toAdminCostGroup } from '../adminApiTransform';
import { useAlertMessage } from '../../../hooks/useAlertMessage';

export function AdminCostGroupsPage() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const [statusMessage, setStatusMessage] = useState('');
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);

  useEffect(() => {
    setDocumentTitle('청구그룹 관리');
  }, []);

  const costGroupsQuery = useQuery({
    queryKey: ['admin', 'cost-groups'],
    queryFn: () => adminDataClient.listCostGroups(),
  });

  const costGroups = useMemo(
    () =>
      [...(costGroupsQuery.data ?? []).map(toAdminCostGroup)].sort(
        (left, right) =>
          left.displayOrder - right.displayOrder || left.name.localeCompare(right.name),
      ),
    [costGroupsQuery.data],
  );

  const reorderMutation = useMutation({
    mutationFn: async (ids: string[]) => adminDataClient.reorderCostGroups({ ids }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'cost-groups'] });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'service-groups'] });
      setOrderDialogOpen(false);
      setStatusMessage('청구그룹 순서를 저장했습니다.');
    },
  });

  useEffect(() => {
    const nextMessage = (location.state as { statusMessage?: string } | null)?.statusMessage;
    if (nextMessage) {
      setStatusMessage(nextMessage);
    }
  }, [location.state]);

  const errorMessage =
    (costGroupsQuery.error instanceof Error && costGroupsQuery.error.message) ||
    (reorderMutation.error instanceof Error && reorderMutation.error.message) ||
    '';
  useAlertMessage(errorMessage);

  return (
    <section className="admin-page page-view">
      <PageHeader
        title="청구그룹 관리"
        actions={
          <>
            <Button
              size="medium"
              type="button"
              variant="secondary"
              onClick={() => setOrderDialogOpen(true)}
              disabled={!costGroups.length}
            >
              순서변경
            </Button>
            <Button
              as={RouterLink}
              to="/admin/cost-group/new"
              role="link"
              variant="primary"
              size="medium"
            >
              청구그룹 추가
            </Button>
          </>
        }
      />

      {statusMessage ? (
        <CriticalAlert alerts={[{ variant: 'ok', message: statusMessage }]} />
      ) : null}

      <AdminCostGroupsResultsTable costGroups={costGroups} />

      <AdminSortOrderDialog
        title="청구그룹 순서변경"
        items={costGroups.map((item) => ({
          id: item.id,
          title: item.name,
          badge: item.isActive ? '노출' : '숨김',
          badgeColor: item.isActive ? 'success' : 'gray',
          inactive: !item.isActive,
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
