import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, CriticalAlert } from 'krds-react';
import { useLocation } from 'react-router-dom';
import { setDocumentTitle } from '../../../router/navigation';
import { AdminOrderDialog } from '../../../components/admin/AdminOrderDialog';
import { PageHeader } from '../../../components/shared/PageHeader';
import { KrdsRouterButtonLink } from '../../../components/shared';
import { adminDataClient } from '../../../api/admin';
import { AdminTaskTypesResultsTable } from './AdminTaskTypesResultsTable';
import type { AdminTaskTypeItem } from '../admin.types';
import { toAdminTaskType } from '../adminApiTransform';
import { useAlertMessage } from '../../../hooks/useAlertMessage';

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

  useEffect(() => {
    setDocumentTitle('업무 타입 관리');
  }, []);

  const taskTypesQuery = useQuery({
    queryKey: ['admin', 'task-types'],
    queryFn: () => adminDataClient.listTaskTypes(),
  });

  const taskTypes = useMemo(
    () =>
      [...(taskTypesQuery.data ?? []).map(toAdminTaskType)].sort(
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
  useAlertMessage(errorMessage);

  return (
    <section className="krds-page-admin krds-page-admin--page">
      <PageHeader
        title="업무 타입 관리"
        actions={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOrderDialogOpen(true)}
              disabled={!taskTypes.length}
            >
              순서변경
            </Button>
            <KrdsRouterButtonLink to="/admin/type/new" variant="primary" size="large">
              업무 타입 추가
            </KrdsRouterButtonLink>
          </>
        }
      />

      {statusMessage ? (
        <CriticalAlert alerts={[{ variant: 'ok', message: statusMessage }]} />
      ) : null}

      <AdminTaskTypesResultsTable
        groupedTaskTypes={groupedTaskTypes}
        activeTypeMap={activeTypeMap}
      />

      <AdminOrderDialog
        title="업무 타입 순서변경"
        items={taskTypes.map((item) => ({
          id: item.id,
          title: `${item.type1} / ${item.type2}`,
          description: item.note || undefined,
          badge: item.requiresServiceGroup ? '프로젝트' : '일반',
          badgeColor: item.requiresServiceGroup ? 'information' : 'gray',
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
