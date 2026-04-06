import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router-dom';
import { setDocumentTitle } from '../../../app/navigation';
import { AdminOrderDialog } from '../AdminOrderDialog';
import { adminDataClient } from '../adminClient';
import '../../../styles/domain/pages/admin-crud-page.scss';

export function AdminPlatformsPage() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const [statusMessage, setStatusMessage] = useState('');
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);

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

  const reorderMutation = useMutation({
    mutationFn: async (ids: string[]) => adminDataClient.reorderPlatforms({ ids }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'platforms'] });
      setOrderDialogOpen(false);
      setStatusMessage('플랫폼 순서를 저장했습니다.');
    },
  });

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
    (platformsQuery.error instanceof Error && platformsQuery.error.message) ||
    (reorderMutation.error instanceof Error && reorderMutation.error.message) ||
    '';

  return (
    <section className="admin-crud-page admin-crud-page--page">
      <header className="admin-crud-page__page-header">
        <div className="admin-crud-page__page-header-top">
          <div className="admin-crud-page__page-heading">
            <h1 className="admin-crud-page__title">플랫폼 관리</h1>
          </div>
          <div className="admin-crud-page__page-header-actions">
            <button
              type="button"
              className="admin-crud-page__header-action"
              onClick={() => setOrderDialogOpen(true)}
              disabled={!platforms.length}
            >
              순서변경
            </button>
            <Link to="/admin/platform/new" className="admin-crud-page__header-action">
              플랫폼 추가
            </Link>
          </div>
        </div>
      </header>

      {statusMessage ? <p className="admin-crud-page__helper-text">{statusMessage}</p> : null}
      {errorMessage ? <p className="admin-crud-page__helper-text">{errorMessage}</p> : null}

      <div className="admin-crud-page__table-wrap">
        <table className="admin-crud-page__table">
          <caption className="admin-crud-page__sr-only">플랫폼 내역</caption>
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
                <tr key={item.id} className={item.isVisible ? '' : 'admin-crud-page__inactive-row'}>
                  <td className="admin-crud-page__row-key">{item.name}</td>
                  <td>{item.isVisible ? '노출' : '미노출'}</td>
                  <td>
                    <div className="admin-crud-page__actions">
                      <Link
                        to={`/admin/platform/${item.id}/edit`}
                        className="admin-crud-page__button admin-crud-page__button--secondary"
                      >
                        수정
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="admin-crud-page__empty-state">
                  표시할 플랫폼 내역이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AdminOrderDialog
        title="플랫폼 순서변경"
        description="플랫폼 선택 목록에 노출되는 순서를 드래그앤드롭으로 정렬합니다."
        items={platforms.map((item) => ({
          id: item.id,
          title: item.name,
          badge: item.isVisible ? '노출' : '미노출',
          inactive: !item.isVisible,
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
