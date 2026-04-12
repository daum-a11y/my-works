import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { adminDataClient } from '../../../api/admin';
import { openAdminTaskSearch } from '../adminTaskSearchLink';
import { AdminCostGroupEditorActionRow } from './AdminCostGroupEditorActionRow';
import { AdminCostGroupEditorForm } from './AdminCostGroupEditorForm';
import { AdminCostGroupTransferDialog } from './AdminCostGroupTransferDialog';
import type { AdminCostGroupItem, AdminCostGroupPayload } from '../admin.types';
import { toAdminCostGroup } from '../adminApiTransform';
import { useAlertMessage } from '../../../hooks/useAlertMessage';
import '../../../styles/pages/AdminPage.scss';

function createDraft(item?: AdminCostGroupItem): AdminCostGroupPayload {
  if (!item) {
    return {
      name: '',
      displayOrder: 0,
      isActive: true,
    };
  }

  return {
    id: item.id,
    name: item.name,
    displayOrder: item.displayOrder,
    isActive: item.isActive,
  };
}

export function AdminCostGroupEditorPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { costGroupId } = useParams<{ costGroupId: string }>();
  const titleRef = useRef<HTMLInputElement | null>(null);
  const isEditMode = Boolean(costGroupId);
  const [draft, setDraft] = useState<AdminCostGroupPayload>(() => createDraft());
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [transferTargetCostGroupId, setTransferTargetCostGroupId] = useState('');
  const [transferDropExisting, setTransferDropExisting] = useState(false);

  const costGroupsQuery = useQuery({
    queryKey: ['admin', 'cost-groups'],
    queryFn: () => adminDataClient.listCostGroups(),
  });

  const costGroups = useMemo(
    () => (costGroupsQuery.data ?? []).map(toAdminCostGroup),
    [costGroupsQuery.data],
  );
  const selectedCostGroup = useMemo(
    () => costGroups.find((item) => item.id === costGroupId) ?? null,
    [costGroupId, costGroups],
  );
  const transferTargetCostGroups = useMemo(
    () => costGroups.filter((item) => item.id !== costGroupId && item.isActive),
    [costGroupId, costGroups],
  );
  const nextDisplayOrder = useMemo(
    () => Math.max(0, ...costGroups.map((item) => item.displayOrder)) + 1,
    [costGroups],
  );

  useEffect(() => {
    if (!isEditMode) {
      setDraft({
        ...createDraft(),
        displayOrder: nextDisplayOrder,
      });
      return;
    }

    if (selectedCostGroup) {
      setDraft(createDraft(selectedCostGroup));
    }
  }, [isEditMode, nextDisplayOrder, selectedCostGroup]);

  useEffect(() => {
    titleRef.current?.focus();
  }, [costGroupId]);

  useEffect(() => {
    if (!transferDialogOpen) {
      return;
    }

    if (!transferTargetCostGroups.some((item) => item.id === transferTargetCostGroupId)) {
      setTransferTargetCostGroupId(transferTargetCostGroups[0]?.id ?? '');
    }
  }, [transferDialogOpen, transferTargetCostGroupId, transferTargetCostGroups]);

  const saveMutation = useMutation({
    mutationFn: async (payload: AdminCostGroupPayload) =>
      adminDataClient.saveCostGroupAdmin({
        ...payload,
        name: payload.name.trim(),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'cost-groups'] });
      navigate('/admin/cost-group', {
        replace: true,
        state: {
          statusMessage: isEditMode ? '청구그룹을 저장했습니다.' : '청구그룹을 추가했습니다.',
        },
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!costGroupId) {
        throw new Error('삭제할 청구그룹이 없습니다.');
      }

      await adminDataClient.deleteCostGroupAdmin(costGroupId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'cost-groups'] });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'service-groups'] });
      navigate('/admin/cost-group', {
        replace: true,
        state: { statusMessage: '청구그룹을 삭제했습니다.' },
      });
    },
  });

  const replaceCostGroupUsageMutation = useMutation({
    mutationFn: async ({
      nextCostGroupId,
      dropExisting,
    }: {
      nextCostGroupId: string;
      dropExisting: boolean;
    }) => {
      if (!costGroupId) {
        throw new Error('전환할 청구그룹이 없습니다.');
      }

      await adminDataClient.replaceCostGroupUsage(costGroupId, nextCostGroupId, dropExisting);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'cost-groups'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'service-groups'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'projects'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'task-search'] }),
        queryClient.invalidateQueries({ queryKey: ['reports'] }),
        queryClient.invalidateQueries({ queryKey: ['search'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['monitoring-detail'] }),
        queryClient.invalidateQueries({ queryKey: ['qa-projects'] }),
        queryClient.invalidateQueries({ queryKey: ['resource'] }),
      ]);
      navigate('/admin/cost-group', {
        replace: true,
        state: { statusMessage: '청구그룹 연관관계를 전환했습니다.' },
      });
    },
  });

  const errorMessage =
    (costGroupsQuery.error instanceof Error && costGroupsQuery.error.message) ||
    (saveMutation.error instanceof Error && saveMutation.error.message) ||
    (deleteMutation.error instanceof Error && deleteMutation.error.message) ||
    '';
  useAlertMessage(errorMessage);
  const transferBlocked = isEditMode && transferTargetCostGroups.length === 0;
  const transferHelpText = transferBlocked ? '전환할 활성 청구그룹이 없습니다.' : '';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await saveMutation.mutateAsync(draft);
  };

  const handleDelete = async () => {
    if (!selectedCostGroup) {
      return;
    }

    if (!window.confirm('정말 삭제 하시겠습니까? 복구할 수 없습니다.')) {
      return;
    }

    await deleteMutation.mutateAsync();
  };

  const handleTransferOpen = () => {
    setTransferTargetCostGroupId(transferTargetCostGroups[0]?.id ?? '');
    setTransferDropExisting(false);
    setTransferDialogOpen(true);
  };

  const handleTransferSave = () => {
    if (!selectedCostGroup || !transferTargetCostGroupId) {
      return;
    }

    replaceCostGroupUsageMutation.mutate({
      nextCostGroupId: transferTargetCostGroupId,
      dropExisting: transferDropExisting,
    });
  };

  const handleViewTasks = () => {
    if (!selectedCostGroup) {
      return;
    }

    openAdminTaskSearch({
      startDate: '',
      endDate: '',
      costGroupId: selectedCostGroup.id,
    });
  };

  if (costGroupsQuery.isLoading && isEditMode) {
    return (
      <section className="projects-feature projects-feature__shell projects-feature__editor-shell">
        <p className={'projects-feature__status-message'}>불러오는 중...</p>
      </section>
    );
  }

  if (isEditMode && !selectedCostGroup && !costGroupsQuery.isLoading) {
    return (
      <section className="projects-feature projects-feature__shell projects-feature__editor-shell">
        <header className={'projects-feature__editor-header'}>
          <h1 className={'projects-feature__title'}>청구그룹 수정</h1>
        </header>
        <p className={'projects-feature__status-message'}>청구그룹을 찾을 수 없습니다.</p>
      </section>
    );
  }

  return (
    <section className="projects-feature projects-feature__shell projects-feature__editor-shell">
      <header className={'projects-feature__editor-header'}>
        <h1 className={'projects-feature__title'}>
          {isEditMode ? '청구그룹 수정' : '청구그룹 추가'}
        </h1>
      </header>
      <section
        className="projects-feature__modal projects-feature__editor-surface"
        aria-label="청구그룹 편집 패널"
      >
        <form
          className="projects-feature__detail-form projects-feature__editor-detail-form"
          onSubmit={handleSubmit}
        >
          <AdminCostGroupEditorForm
            draft={draft}
            titleRef={titleRef}
            onDraftChange={(patch) =>
              setDraft((current) => ({
                ...current,
                ...patch,
              }))
            }
          />

          <AdminCostGroupEditorActionRow
            isEditMode={isEditMode}
            deletePending={deleteMutation.isPending}
            transferPending={replaceCostGroupUsageMutation.isPending}
            transferBlocked={transferBlocked}
            transferHelpText={transferHelpText}
            savePending={saveMutation.isPending}
            onDelete={() => void handleDelete()}
            onTransfer={handleTransferOpen}
            onViewTasks={handleViewTasks}
          />
        </form>
      </section>
      {selectedCostGroup ? (
        <AdminCostGroupTransferDialog
          isOpen={transferDialogOpen}
          isPending={replaceCostGroupUsageMutation.isPending}
          sourceCostGroup={selectedCostGroup}
          targetCostGroups={transferTargetCostGroups}
          targetCostGroupId={transferTargetCostGroupId}
          dropExisting={transferDropExisting}
          errorMessage={
            replaceCostGroupUsageMutation.error instanceof Error
              ? replaceCostGroupUsageMutation.error.message
              : ''
          }
          onTargetCostGroupChange={setTransferTargetCostGroupId}
          onDropExistingChange={setTransferDropExisting}
          onClose={() => setTransferDialogOpen(false)}
          onSave={handleTransferSave}
        />
      ) : null}
    </section>
  );
}
