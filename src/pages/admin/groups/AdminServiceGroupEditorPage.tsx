import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CriticalAlert } from 'krds-react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminDataClient } from '../../../api/admin';
import { openAdminTaskSearch } from '../adminTaskSearchLink';
import { AdminServiceGroupEditorActionRow } from './AdminServiceGroupEditorActionRow';
import { AdminServiceGroupEditorForm } from './AdminServiceGroupEditorForm';
import { AdminServiceGroupTransferDialog } from './AdminServiceGroupTransferDialog';
import type { AdminServiceGroupItem, AdminServiceGroupPayload } from '../admin.types';
import { toAdminCostGroup, toAdminServiceGroup } from '../adminApiTransform';
import { useAlertMessage } from '../../../hooks/useAlertMessage';
import { PageHeader } from '../../../components/shared';
import { GlobalLoadingSpinner } from '../../../components/layout';

function createDraft(item?: AdminServiceGroupItem): AdminServiceGroupPayload {
  if (!item) {
    return {
      name: '',
      serviceGroupName: '',
      serviceName: '',
      costGroupId: '',
      svcActive: true,
      displayOrder: 0,
      isActive: true,
    };
  }

  return {
    id: item.id,
    name: item.name,
    serviceGroupName: item.serviceGroupName,
    serviceName: item.serviceName,
    costGroupId: item.costGroupId ?? '',
    svcActive: item.svcActive,
    displayOrder: item.displayOrder,
    isActive: item.isActive,
  };
}

function composeServiceName(serviceGroup: string, serviceName: string) {
  const normalizedGroup = serviceGroup.trim();
  const normalizedName = serviceName.trim();

  if (!normalizedGroup && !normalizedName) {
    return '';
  }
  if (!normalizedGroup) {
    return normalizedName;
  }
  if (!normalizedName) {
    return normalizedGroup;
  }
  return `${normalizedGroup} / ${normalizedName}`;
}

export function AdminServiceGroupEditorPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { serviceGroupId } = useParams<{ serviceGroupId: string }>();
  const titleRef = useRef<HTMLInputElement | null>(null);
  const isEditMode = Boolean(serviceGroupId);
  const [draft, setDraft] = useState<AdminServiceGroupPayload>(() => createDraft());
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [transferTargetServiceGroupId, setTransferTargetServiceGroupId] = useState('');
  const [transferDropExisting, setTransferDropExisting] = useState(false);

  const serviceGroupsQuery = useQuery({
    queryKey: ['admin', 'service-groups'],
    queryFn: () => adminDataClient.listServiceGroups(),
  });
  const costGroupsQuery = useQuery({
    queryKey: ['admin', 'cost-groups'],
    queryFn: () => adminDataClient.listCostGroups(),
  });

  const serviceGroups = useMemo(
    () => (serviceGroupsQuery.data ?? []).map(toAdminServiceGroup),
    [serviceGroupsQuery.data],
  );
  const costGroups = useMemo(
    () => (costGroupsQuery.data ?? []).map(toAdminCostGroup),
    [costGroupsQuery.data],
  );
  const selectedServiceGroup = useMemo(
    () => serviceGroups.find((item) => item.id === serviceGroupId) ?? null,
    [serviceGroupId, serviceGroups],
  );
  const transferTargetServiceGroups = useMemo(
    () => serviceGroups.filter((item) => item.id !== serviceGroupId && item.isActive),
    [serviceGroupId, serviceGroups],
  );
  const usageQuery = useQuery({
    queryKey: ['admin', 'service-groups', 'usage', selectedServiceGroup?.id],
    enabled: Boolean(selectedServiceGroup),
    queryFn: () => adminDataClient.getServiceGroupUsageSummary(selectedServiceGroup!.id),
  });
  const nextDisplayOrder = useMemo(
    () => Math.max(0, ...serviceGroups.map((item) => item.displayOrder)) + 1,
    [serviceGroups],
  );

  useEffect(() => {
    if (!isEditMode) {
      setDraft({
        ...createDraft(),
        displayOrder: nextDisplayOrder,
      });
      return;
    }

    if (selectedServiceGroup) {
      setDraft(createDraft(selectedServiceGroup));
    }
  }, [isEditMode, nextDisplayOrder, selectedServiceGroup]);

  useEffect(() => {
    titleRef.current?.focus();
  }, [serviceGroupId]);

  useEffect(() => {
    if (!transferDialogOpen) {
      return;
    }

    if (!transferTargetServiceGroups.some((item) => item.id === transferTargetServiceGroupId)) {
      setTransferTargetServiceGroupId(transferTargetServiceGroups[0]?.id ?? '');
    }
  }, [transferDialogOpen, transferTargetServiceGroupId, transferTargetServiceGroups]);

  const saveMutation = useMutation({
    mutationFn: async (payload: AdminServiceGroupPayload) => {
      const serviceGroupName = payload.serviceGroupName.trim();
      const serviceName = payload.serviceName.trim();
      const svcActive = payload.svcActive;

      return adminDataClient.saveServiceGroupAdmin({
        ...payload,
        name: composeServiceName(serviceGroupName, serviceName),
        serviceGroupName,
        serviceName,
        costGroupId: payload.costGroupId.trim(),
        svcActive,
        isActive: svcActive,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'service-groups'] });
      navigate('/admin/group', {
        replace: true,
        state: {
          statusMessage: isEditMode ? '서비스 그룹을 저장했습니다.' : '서비스 그룹을 추가했습니다.',
        },
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!serviceGroupId) {
        throw new Error('삭제할 서비스 그룹이 없습니다.');
      }

      await adminDataClient.deleteServiceGroupAdmin(serviceGroupId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'service-groups'] });
      navigate('/admin/group', {
        replace: true,
        state: { statusMessage: '서비스 그룹을 삭제했습니다.' },
      });
    },
  });

  const replaceServiceGroupUsageMutation = useMutation({
    mutationFn: async ({
      nextServiceGroupId,
      dropExisting,
    }: {
      nextServiceGroupId: string;
      dropExisting: boolean;
    }) => {
      if (!serviceGroupId) {
        throw new Error('전환할 서비스 그룹이 없습니다.');
      }

      await adminDataClient.replaceServiceGroupUsage(
        serviceGroupId,
        nextServiceGroupId,
        dropExisting,
      );
    },
    onSuccess: async () => {
      await Promise.all([
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
      navigate('/admin/group', {
        replace: true,
        state: { statusMessage: '서비스 그룹 연관관계를 전환했습니다.' },
      });
    },
  });

  const errorMessage =
    (serviceGroupsQuery.error instanceof Error && serviceGroupsQuery.error.message) ||
    (costGroupsQuery.error instanceof Error && costGroupsQuery.error.message) ||
    (usageQuery.error instanceof Error && usageQuery.error.message) ||
    (saveMutation.error instanceof Error && saveMutation.error.message) ||
    (deleteMutation.error instanceof Error && deleteMutation.error.message) ||
    '';
  useAlertMessage(errorMessage);
  const projectUsageCount = useMemo(() => {
    const firstRow = usageQuery.data?.[0];
    return Number(firstRow?.project_count ?? 0);
  }, [usageQuery.data]);
  const deleteBlocked = isEditMode && projectUsageCount > 0;
  const deleteHelpText = deleteBlocked ? `사용 중인 프로젝트 ${projectUsageCount}건` : '';
  const transferBlocked = isEditMode && transferTargetServiceGroups.length === 0;
  const transferHelpText = transferBlocked ? '전환할 활성 서비스 그룹이 없습니다.' : '';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await saveMutation.mutateAsync(draft);
  };

  const handleDelete = async () => {
    if (!selectedServiceGroup) {
      return;
    }

    if (!window.confirm('정말 삭제 하시겠습니까? 복구할 수 없습니다.')) {
      return;
    }

    await deleteMutation.mutateAsync();
  };

  const handleTransferOpen = () => {
    setTransferTargetServiceGroupId(transferTargetServiceGroups[0]?.id ?? '');
    setTransferDropExisting(false);
    setTransferDialogOpen(true);
  };

  const handleTransferSave = () => {
    if (!selectedServiceGroup || !transferTargetServiceGroupId) {
      return;
    }

    replaceServiceGroupUsageMutation.mutate({
      nextServiceGroupId: transferTargetServiceGroupId,
      dropExisting: transferDropExisting,
    });
  };

  const handleViewTasks = () => {
    if (!selectedServiceGroup) {
      return;
    }

    openAdminTaskSearch({
      startDate: '',
      endDate: '',
      costGroupId: selectedServiceGroup.costGroupId ?? '',
      serviceGroupId: selectedServiceGroup.id,
    });
  };

  if (serviceGroupsQuery.isLoading && isEditMode) {
    return (
      <section className="krds-page krds-page__shell krds-page__editor-shell">
        <GlobalLoadingSpinner />
      </section>
    );
  }

  if (isEditMode && !selectedServiceGroup && !serviceGroupsQuery.isLoading) {
    return (
      <section className="krds-page krds-page__shell krds-page__editor-shell">
        <PageHeader title="서비스 그룹 수정" />
        <CriticalAlert alerts={[{ variant: 'info', message: '서비스 그룹을 찾을 수 없습니다.' }]} />
      </section>
    );
  }

  return (
    <section className="krds-page krds-page__shell krds-page__editor-shell">
      <PageHeader title={isEditMode ? '서비스 그룹 수정' : '서비스 그룹 추가'} />
      <section className="krds-page__editor-surface" aria-label="서비스 그룹 편집 패널">
        <form
          className="krds-page__detail-form krds-page__editor-detail-form"
          onSubmit={handleSubmit}
        >
          <AdminServiceGroupEditorForm
            draft={draft}
            costGroups={costGroups}
            titleRef={titleRef}
            onDraftChange={(patch) =>
              setDraft((current) => ({
                ...current,
                ...patch,
              }))
            }
          />

          <AdminServiceGroupEditorActionRow
            isEditMode={isEditMode}
            deletePending={deleteMutation.isPending}
            deleteBlocked={deleteBlocked}
            deleteHelpText={deleteHelpText}
            transferPending={replaceServiceGroupUsageMutation.isPending}
            transferBlocked={transferBlocked}
            transferHelpText={transferHelpText}
            savePending={saveMutation.isPending}
            canSave={Boolean(draft.costGroupId)}
            onDelete={() => void handleDelete()}
            onTransfer={handleTransferOpen}
            onViewTasks={handleViewTasks}
          />
        </form>
      </section>
      {selectedServiceGroup ? (
        <AdminServiceGroupTransferDialog
          isOpen={transferDialogOpen}
          isPending={replaceServiceGroupUsageMutation.isPending}
          sourceServiceGroup={selectedServiceGroup}
          costGroups={costGroups}
          targetServiceGroups={transferTargetServiceGroups}
          targetServiceGroupId={transferTargetServiceGroupId}
          dropExisting={transferDropExisting}
          errorMessage={
            replaceServiceGroupUsageMutation.error instanceof Error
              ? replaceServiceGroupUsageMutation.error.message
              : ''
          }
          onTargetServiceGroupChange={setTransferTargetServiceGroupId}
          onDropExistingChange={setTransferDropExisting}
          onClose={() => setTransferDialogOpen(false)}
          onSave={handleTransferSave}
        />
      ) : null}
    </section>
  );
}
