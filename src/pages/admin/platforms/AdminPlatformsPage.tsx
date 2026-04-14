import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, CriticalAlert } from 'krds-react';
import { useLocation } from 'react-router-dom';
import { setDocumentTitle } from '../../../router/navigation';
import { AdminOrderDialog } from '../../../components/admin/AdminOrderDialog';
import { PageHeader } from '../../../components/shared/PageHeader';
import { KrdsRouterButtonLink } from '../../../components/shared';
import { adminDataClient } from '../../../api/admin';
import { AdminPlatformsResultsTable } from './AdminPlatformsResultsTable';
import { toAdminPlatform } from '../adminApiTransform';
import { useAlertMessage } from '../../../hooks/useAlertMessage';

export function AdminPlatformsPage() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const [statusMessage, setStatusMessage] = useState('');
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);

  useEffect(() => {
    setDocumentTitle('플랫폼 관리');
  }, []);

  const platformsQuery = useQuery({
    queryKey: ['admin', 'platforms'],
    queryFn: () => adminDataClient.listPlatforms(),
  });

  const platforms = useMemo(
    () =>
      [...(platformsQuery.data ?? []).map(toAdminPlatform)].sort(
        (left, right) =>
          left.displayOrder - right.displayOrder || left.name.localeCompare(right.name),
      ),
    [platformsQuery.data],
  );

  const reorderMutation = useMutation({
    mutationFn: async (ids: string[]) => adminDataClient.reorderPlatforms({ ids }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'platforms'] });
      setOrderDialogOpen(false);
      setStatusMessage('플랫폼 순서를 저장했습니다.');
    },
  });

  useEffect(() => {
    const nextMessage = (location.state as { statusMessage?: string } | null)?.statusMessage;
    if (nextMessage) {
      setStatusMessage(nextMessage);
    }
  }, [location.state]);

  const errorMessage =
    (platformsQuery.error instanceof Error && platformsQuery.error.message) ||
    (reorderMutation.error instanceof Error && reorderMutation.error.message) ||
    '';
  useAlertMessage(errorMessage);

  return (
    <section className="krds-page-admin krds-page-admin--page">
      <PageHeader
        title="플랫폼 관리"
        actions={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOrderDialogOpen(true)}
              disabled={!platforms.length}
            >
              순서변경
            </Button>
            <KrdsRouterButtonLink to="/admin/platform/new" variant="primary" size="large">
              플랫폼 추가
            </KrdsRouterButtonLink>
          </>
        }
      />

      {statusMessage ? (
        <CriticalAlert alerts={[{ variant: 'ok', message: statusMessage }]} />
      ) : null}

      <AdminPlatformsResultsTable platforms={platforms} />

      <AdminOrderDialog
        title="플랫폼 순서변경"
        items={platforms.map((item) => ({
          id: item.id,
          title: item.name,
          badge: item.isVisible ? '노출' : '미노출',
          badgeColor: item.isVisible ? 'success' : 'gray',
          inactive: !item.isVisible,
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
