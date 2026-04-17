import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CriticalAlert, Spinner } from 'krds-react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminDataClient } from '../../../api/admin';
import { openAdminTaskSearch } from '../adminTaskSearchLink';
import { AdminPlatformEditorActionRow } from './AdminPlatformEditorActionRow';
import { AdminPlatformEditorForm } from './AdminPlatformEditorForm';
import { AdminPlatformTransferDialog } from './AdminPlatformTransferDialog';
import type { AdminPlatformItem, AdminPlatformPayload } from '../admin.types';
import { toAdminPlatform } from '../adminApiTransform';
import { useAlertMessage } from '../../../hooks/useAlertMessage';
import { PageHeader } from '../../../components/shared';

function createDraft(item?: AdminPlatformItem): AdminPlatformPayload {
  if (!item) {
    return {
      name: '',
      displayOrder: 0,
      isVisible: true,
    };
  }

  return {
    id: item.id,
    name: item.name,
    displayOrder: item.displayOrder,
    isVisible: item.isVisible,
  };
}

export function AdminPlatformEditorPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { platformId } = useParams<{ platformId: string }>();
  const titleRef = useRef<HTMLInputElement | null>(null);
  const isEditMode = Boolean(platformId);
  const [draft, setDraft] = useState<AdminPlatformPayload>(() => createDraft());
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [transferTargetPlatformId, setTransferTargetPlatformId] = useState('');
  const [transferDropExisting, setTransferDropExisting] = useState(false);

  const platformsQuery = useQuery({
    queryKey: ['admin', 'platforms'],
    queryFn: () => adminDataClient.listPlatforms(),
  });

  const platforms = useMemo(
    () => (platformsQuery.data ?? []).map(toAdminPlatform),
    [platformsQuery.data],
  );
  const selectedPlatform = useMemo(
    () => platforms.find((item) => item.id === platformId) ?? null,
    [platformId, platforms],
  );
  const transferTargetPlatforms = useMemo(
    () => platforms.filter((item) => item.id !== platformId && item.isVisible),
    [platformId, platforms],
  );
  const nextDisplayOrder = useMemo(
    () => Math.max(0, ...platforms.map((item) => item.displayOrder)) + 1,
    [platforms],
  );

  useEffect(() => {
    if (!isEditMode) {
      setDraft({ ...createDraft(), displayOrder: nextDisplayOrder });
      return;
    }
    if (selectedPlatform) {
      setDraft(createDraft(selectedPlatform));
    }
  }, [isEditMode, nextDisplayOrder, selectedPlatform]);

  useEffect(() => {
    titleRef.current?.focus();
  }, [platformId]);

  useEffect(() => {
    if (!transferDialogOpen) {
      return;
    }

    if (!transferTargetPlatforms.some((item) => item.id === transferTargetPlatformId)) {
      setTransferTargetPlatformId(transferTargetPlatforms[0]?.id ?? '');
    }
  }, [transferDialogOpen, transferTargetPlatformId, transferTargetPlatforms]);

  const saveMutation = useMutation({
    mutationFn: async (payload: AdminPlatformPayload) =>
      adminDataClient.savePlatformAdmin({ ...payload, name: payload.name.trim() }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'platforms'] });
      navigate('/admin/platform', {
        replace: true,
        state: { statusMessage: isEditMode ? '플랫폼을 저장했습니다.' : '플랫폼을 추가했습니다.' },
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!platformId) throw new Error('삭제할 플랫폼이 없습니다.');
      await adminDataClient.deletePlatformAdmin(platformId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'platforms'] });
      navigate('/admin/platform', {
        replace: true,
        state: { statusMessage: '플랫폼을 삭제했습니다.' },
      });
    },
  });

  const replacePlatformUsageMutation = useMutation({
    mutationFn: async ({
      nextPlatformId,
      dropExisting,
    }: {
      nextPlatformId: string;
      dropExisting: boolean;
    }) => {
      if (!platformId) {
        throw new Error('전환할 플랫폼이 없습니다.');
      }
      await adminDataClient.replacePlatformUsage(platformId, nextPlatformId, dropExisting);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'platforms'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'projects'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'project-option'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'report-project-options'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'task-search'] }),
        queryClient.invalidateQueries({ queryKey: ['reports', 'project-options'] }),
        queryClient.invalidateQueries({ queryKey: ['projects'] }),
        queryClient.invalidateQueries({ queryKey: ['project-editor'] }),
        queryClient.invalidateQueries({ queryKey: ['search'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['monitoring-detail'] }),
        queryClient.invalidateQueries({ queryKey: ['qa-projects'] }),
        queryClient.invalidateQueries({ queryKey: ['resource'] }),
      ]);
      navigate('/admin/platform', {
        replace: true,
        state: { statusMessage: '플랫폼 연관관계를 전환했습니다.' },
      });
    },
  });

  const errorMessage =
    (platformsQuery.error instanceof Error && platformsQuery.error.message) ||
    (saveMutation.error instanceof Error && saveMutation.error.message) ||
    (deleteMutation.error instanceof Error && deleteMutation.error.message) ||
    '';
  useAlertMessage(errorMessage);
  const transferBlocked = isEditMode && transferTargetPlatforms.length === 0;
  const transferHelpText = transferBlocked ? '전환할 노출 플랫폼이 없습니다.' : '';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await saveMutation.mutateAsync(draft);
  };

  const handleDelete = async () => {
    if (!selectedPlatform) return;
    if (!window.confirm('정말 삭제 하시겠습니까? 복구할 수 없습니다.')) return;
    await deleteMutation.mutateAsync();
  };

  const handleTransferOpen = () => {
    setTransferTargetPlatformId(transferTargetPlatforms[0]?.id ?? '');
    setTransferDropExisting(false);
    setTransferDialogOpen(true);
  };

  const handleTransferSave = () => {
    if (!selectedPlatform || !transferTargetPlatformId) {
      return;
    }

    replacePlatformUsageMutation.mutate({
      nextPlatformId: transferTargetPlatformId,
      dropExisting: transferDropExisting,
    });
  };

  const handleViewTasks = () => {
    if (!selectedPlatform) {
      return;
    }

    openAdminTaskSearch({
      startDate: '',
      endDate: '',
      platformId: selectedPlatform.id,
    });
  };

  if (platformsQuery.isLoading && isEditMode) {
    return (
      <section className="krds-page form-page">
        <div className="global-loading-spinner" aria-label="로딩 중" role="status">
          <Spinner />
        </div>
      </section>
    );
  }

  if (isEditMode && !selectedPlatform && !platformsQuery.isLoading) {
    return (
      <section className="krds-page form-page">
        <PageHeader title="플랫폼 수정" />
        <CriticalAlert alerts={[{ variant: 'info', message: '플랫폼을 찾을 수 없습니다.' }]} />
      </section>
    );
  }

  return (
    <section className="krds-page form-page">
      <PageHeader title={isEditMode ? '플랫폼 수정' : '플랫폼 추가'} />
      <section className="page-section" aria-label="플랫폼 편집 패널">
        <form className="krds-form" onSubmit={handleSubmit}>
          <AdminPlatformEditorForm
            draft={draft}
            titleRef={titleRef}
            onDraftChange={(patch) =>
              setDraft((current) => ({
                ...current,
                ...patch,
              }))
            }
          />
          <AdminPlatformEditorActionRow
            isEditMode={isEditMode}
            deletePending={deleteMutation.isPending}
            transferPending={replacePlatformUsageMutation.isPending}
            transferBlocked={transferBlocked}
            transferHelpText={transferHelpText}
            savePending={saveMutation.isPending}
            onDelete={() => void handleDelete()}
            onTransfer={handleTransferOpen}
            onViewTasks={handleViewTasks}
          />
        </form>
      </section>
      {selectedPlatform ? (
        <AdminPlatformTransferDialog
          isOpen={transferDialogOpen}
          isPending={replacePlatformUsageMutation.isPending}
          sourcePlatform={selectedPlatform}
          targetPlatforms={transferTargetPlatforms}
          targetPlatformId={transferTargetPlatformId}
          dropExisting={transferDropExisting}
          errorMessage={
            replacePlatformUsageMutation.error instanceof Error
              ? replacePlatformUsageMutation.error.message
              : ''
          }
          onTargetPlatformChange={setTransferTargetPlatformId}
          onDropExistingChange={setTransferDropExisting}
          onClose={() => setTransferDialogOpen(false)}
          onSave={handleTransferSave}
        />
      ) : null}
    </section>
  );
}
