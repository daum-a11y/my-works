import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router-dom';
import { setDocumentTitle } from '../../../router/navigation';
import { AdminOrderDialog } from '../../../components/admin/AdminOrderDialog';
import { adminDataClient } from '../../../api/admin';
import { AdminCostGroupsResultsTable } from './AdminCostGroupsResultsTable';
import '../../../styles/pages/AdminPage.scss';

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
      [...(costGroupsQuery.data ?? [])].sort(
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

  return (
    <section className="admin-crud-page admin-crud-page--page">
      <header className="admin-crud-page__page-header">
        <div className="admin-crud-page__page-header-top">
          <div className="admin-crud-page__page-heading">
            <h1 className="admin-crud-page__title">청구그룹 관리</h1>
          </div>
          <div className="admin-crud-page__page-header-actions">
            <button
              type="button"
              className="admin-crud-page__header-action"
              onClick={() => setOrderDialogOpen(true)}
              disabled={!costGroups.length}
            >
              순서변경
            </button>
            <Link to="/admin/cost-group/new" className="admin-crud-page__header-action">
              청구그룹 추가
            </Link>
          </div>
        </div>
      </header>

      {statusMessage ? <p className="admin-crud-page__helper-text">{statusMessage}</p> : null}
      {errorMessage ? <p className="admin-crud-page__helper-text">{errorMessage}</p> : null}

      <AdminCostGroupsResultsTable costGroups={costGroups} />

      <AdminOrderDialog
        title="청구그룹 순서변경"
        description="업무 화면과 관리 화면에서 사용할 청구그룹 표시 순서를 조정합니다."
        items={costGroups.map((item) => ({
          id: item.id,
          title: item.name,
          badge: item.isActive ? '노출' : '숨김',
          inactive: !item.isActive,
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
