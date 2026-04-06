import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router-dom';
import { setDocumentTitle } from '../../../router/navigation';
import { AdminOrderDialog } from '../AdminOrderDialog';
import { adminDataClient } from '../../../api/admin';
import '../../../styles/domain/pages/admin-crud-page.scss';
import type { AdminTaskTypeItem } from '../types';

function groupTaskTypes(taskTypes: AdminTaskTypeItem[]) {
  const grouped = new Map<string, AdminTaskTypeItem[]>();

  for (const taskType of taskTypes) {
    const items = grouped.get(taskType.type1) ?? [];
    items.push(taskType);
    grouped.set(taskType.type1, items);
  }

  return Array.from(grouped.entries())
    .map(([type1, rows]) => ({
      type1,
      rows: [...rows].sort(
        (left, right) =>
          left.displayOrder - right.displayOrder || left.type2.localeCompare(right.type2),
      ),
    }))
    .sort((left, right) => {
      const leftOrder = left.rows[0]?.displayOrder ?? 0;
      const rightOrder = right.rows[0]?.displayOrder ?? 0;
      return leftOrder - rightOrder || left.type1.localeCompare(right.type1);
    });
}

export function AdminTaskTypesPage() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const [statusMessage, setStatusMessage] = useState('');
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);

  const taskTypesQuery = useQuery({
    queryKey: ['admin', 'task-types'],
    queryFn: () => adminDataClient.listTaskTypes(),
  });

  const taskTypes = useMemo(
    () =>
      [...(taskTypesQuery.data ?? [])].sort(
        (left, right) =>
          left.displayOrder - right.displayOrder ||
          left.type1.localeCompare(right.type1) ||
          left.type2.localeCompare(right.type2),
      ),
    [taskTypesQuery.data],
  );

  const groupedTaskTypes = useMemo(() => groupTaskTypes(taskTypes), [taskTypes]);
  const activeTypeMap = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const item of taskTypes) {
      map.set(item.id, item.isActive);
    }
    return map;
  }, [taskTypes]);

  useEffect(() => {
    setDocumentTitle('업무 타입 관리');
  }, []);

  useEffect(() => {
    const nextMessage = (location.state as { statusMessage?: string } | null)?.statusMessage;
    if (nextMessage) {
      setStatusMessage(nextMessage);
    }
  }, [location.state]);

  const reorderMutation = useMutation({
    mutationFn: async (ids: string[]) => adminDataClient.reorderTaskTypes({ ids }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'task-types'] });
      setOrderDialogOpen(false);
      setStatusMessage('업무 타입 순서를 저장했습니다.');
    },
  });

  const errorMessage =
    (taskTypesQuery.error instanceof Error && taskTypesQuery.error.message) ||
    (reorderMutation.error instanceof Error && reorderMutation.error.message) ||
    '';

  return (
    <section className="admin-crud-page admin-crud-page--page">
      <header className="admin-crud-page__page-header">
        <div className="admin-crud-page__page-header-top">
          <div className="admin-crud-page__page-heading">
            <h1 className="admin-crud-page__title">업무 타입 관리</h1>
          </div>
          <div className="admin-crud-page__page-header-actions">
            <button
              type="button"
              className="admin-crud-page__header-action"
              onClick={() => setOrderDialogOpen(true)}
              disabled={!taskTypes.length}
            >
              순서변경
            </button>
            <Link to="/admin/type/new" className="admin-crud-page__header-action">
              업무 타입 추가
            </Link>
          </div>
        </div>
      </header>

      {statusMessage ? <p className="admin-crud-page__helper-text">{statusMessage}</p> : null}
      {errorMessage ? <p className="admin-crud-page__helper-text">{errorMessage}</p> : null}

      <div className="admin-crud-page__table-wrap">
        <table className="admin-crud-page__table">
          <caption className="admin-crud-page__sr-only">업무타입 내역</caption>
          <thead>
            <tr>
              <th>타입1</th>
              <th>타입2</th>
              <th>리소스 타입</th>
              <th>활성여부</th>
              <th>비고</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {groupedTaskTypes.length ? (
              groupedTaskTypes.map((group) =>
                group.rows.map((item, rowIndex) => (
                  <tr
                    key={item.id}
                    className={activeTypeMap.get(item.id) ? '' : 'admin-crud-page__inactive-row'}
                  >
                    {rowIndex === 0 ? (
                      <td
                        rowSpan={group.rows.length}
                        scope="row"
                        className="admin-crud-page__row-key"
                      >
                        {group.type1}
                      </td>
                    ) : null}
                    <td>{item.type2}</td>
                    <td>{item.requiresServiceGroup ? '프로젝트' : '일반'}</td>
                    <td>{activeTypeMap.get(item.id) ? '활성' : '비활성'}</td>
                    <td>{item.displayLabel || '-'}</td>
                    <td>
                      <div className="admin-crud-page__actions">
                        <Link
                          to={`/admin/type/${item.id}/edit`}
                          className="admin-crud-page__button admin-crud-page__button--secondary"
                        >
                          수정
                        </Link>
                      </div>
                    </td>
                  </tr>
                )),
              )
            ) : (
              <tr>
                <td className="admin-crud-page__empty-state" colSpan={6}>
                  표시할 업무타입 내역이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AdminOrderDialog
        title="업무 타입 순서변경"
        description="업무 타입 목록과 선택 UI에서 사용할 순서를 재정렬합니다."
        items={taskTypes.map((item) => ({
          id: item.id,
          title: `${item.type1} / ${item.type2}`,
          description: item.displayLabel || undefined,
          badge: item.requiresServiceGroup ? '프로젝트' : '일반',
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
