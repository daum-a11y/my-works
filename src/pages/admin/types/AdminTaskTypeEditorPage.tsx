import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { adminDataClient } from '../../../api/admin';
import { AdminTaskTypeEditorActionRow } from './AdminTaskTypeEditorActionRow';
import { AdminTaskTypeEditorForm } from './AdminTaskTypeEditorForm';
import type { AdminTaskTypeItem, AdminTaskTypePayload } from '../admin.types';
import { toAdminTaskType } from '../adminApiTransform';
import '../../../styles/pages/AdminPage.scss';

function createDraft(taskType?: AdminTaskTypeItem): AdminTaskTypePayload {
  if (!taskType) {
    return {
      type1: '',
      type2: '',
      memo: '',
      displayOrder: 0,
      requiresServiceGroup: false,
      isActive: true,
    };
  }

  return {
    id: taskType.id,
    type1: taskType.type1,
    type2: taskType.type2,
    memo: taskType.memo,
    displayOrder: taskType.displayOrder,
    requiresServiceGroup: taskType.requiresServiceGroup,
    isActive: taskType.isActive,
  };
}

export function AdminTaskTypeEditorPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { taskTypeId } = useParams<{ taskTypeId: string }>();
  const titleRef = useRef<HTMLInputElement | null>(null);
  const isEditMode = Boolean(taskTypeId);
  const [draft, setDraft] = useState<AdminTaskTypePayload>(() => createDraft());

  const taskTypesQuery = useQuery({
    queryKey: ['admin', 'task-types'],
    queryFn: () => adminDataClient.listTaskTypes(),
  });

  const taskTypes = useMemo(
    () => (taskTypesQuery.data ?? []).map(toAdminTaskType),
    [taskTypesQuery.data],
  );
  const selectedTaskType = useMemo(
    () => taskTypes.find((item) => item.id === taskTypeId) ?? null,
    [taskTypeId, taskTypes],
  );
  const usageQuery = useQuery({
    queryKey: [
      'admin',
      'task-types',
      'usage',
      selectedTaskType?.id,
      selectedTaskType?.type1,
      selectedTaskType?.type2,
    ],
    enabled: Boolean(selectedTaskType),
    queryFn: () =>
      adminDataClient.getTaskTypeUsageSummary(
        selectedTaskType!.id,
        selectedTaskType!.type1,
        selectedTaskType!.type2,
      ),
  });
  const nextDisplayOrder = useMemo(
    () => Math.max(0, ...taskTypes.map((item) => item.displayOrder)) + 1,
    [taskTypes],
  );

  useEffect(() => {
    if (!isEditMode) {
      setDraft({
        ...createDraft(),
        displayOrder: nextDisplayOrder,
      });
      return;
    }

    if (selectedTaskType) {
      setDraft(createDraft(selectedTaskType));
    }
  }, [isEditMode, nextDisplayOrder, selectedTaskType]);

  useEffect(() => {
    titleRef.current?.focus();
  }, [taskTypeId]);

  const saveMutation = useMutation({
    mutationFn: async (payload: AdminTaskTypePayload) => {
      return adminDataClient.saveTaskTypeAdmin({
        ...payload,
        type1: payload.type1.trim(),
        type2: payload.type2.trim(),
        memo: payload.memo.trim(),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'task-types'] });
      navigate('/admin/type', {
        replace: true,
        state: {
          statusMessage: isEditMode ? '업무 타입을 저장했습니다.' : '업무 타입을 추가했습니다.',
        },
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!taskTypeId) {
        throw new Error('삭제할 업무 타입이 없습니다.');
      }

      await adminDataClient.deleteTaskTypeAdmin(taskTypeId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'task-types'] });
      navigate('/admin/type', {
        replace: true,
        state: { statusMessage: '업무 타입을 삭제했습니다.' },
      });
    },
  });

  const errorMessage =
    (taskTypesQuery.error instanceof Error && taskTypesQuery.error.message) ||
    (usageQuery.error instanceof Error && usageQuery.error.message) ||
    (saveMutation.error instanceof Error && saveMutation.error.message) ||
    (deleteMutation.error instanceof Error && deleteMutation.error.message) ||
    '';
  const taskUsageCount = useMemo(() => {
    const firstRow = usageQuery.data?.[0];
    return Number(firstRow?.task_count ?? 0);
  }, [usageQuery.data]);
  const deleteBlocked = isEditMode && taskUsageCount > 0;
  const deleteHelpText = deleteBlocked ? `사용 중인 업무 ${taskUsageCount}건` : '';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await saveMutation.mutateAsync(draft);
  };

  const handleDelete = async () => {
    if (!selectedTaskType) {
      return;
    }

    if (!window.confirm('정말 삭제 하시겠습니까? 복구할 수 없습니다.')) {
      return;
    }

    await deleteMutation.mutateAsync();
  };

  if (taskTypesQuery.isLoading && isEditMode) {
    return (
      <section className="projects-feature projects-feature__shell projects-feature__editor-shell">
        <p className={'projects-feature__status-message'}>불러오는 중...</p>
      </section>
    );
  }

  if (isEditMode && !selectedTaskType && !taskTypesQuery.isLoading) {
    return (
      <section className="projects-feature projects-feature__shell projects-feature__editor-shell">
        <header className={'projects-feature__editor-header'}>
          <h1 className={'projects-feature__title'}>업무 타입 수정</h1>
        </header>
        <p className={'projects-feature__status-message'}>업무 타입을 찾을 수 없습니다.</p>
      </section>
    );
  }

  return (
    <section className="projects-feature projects-feature__shell projects-feature__editor-shell">
      <header className={'projects-feature__editor-header'}>
        <h1 className={'projects-feature__title'}>
          {isEditMode ? '업무 타입 수정' : '업무 타입 추가'}
        </h1>
      </header>

      {errorMessage ? <p className={'projects-feature__status-message'}>{errorMessage}</p> : null}

      <section
        className="projects-feature__modal projects-feature__editor-surface"
        aria-label="업무 타입 편집 패널"
      >
        <form
          className="projects-feature__detail-form projects-feature__editor-detail-form"
          onSubmit={handleSubmit}
        >
          <AdminTaskTypeEditorForm
            draft={draft}
            titleRef={titleRef}
            onDraftChange={(patch) =>
              setDraft((current) => ({
                ...current,
                ...patch,
              }))
            }
          />

          <AdminTaskTypeEditorActionRow
            isEditMode={isEditMode}
            deletePending={deleteMutation.isPending}
            deleteBlocked={deleteBlocked}
            deleteHelpText={deleteHelpText}
            savePending={saveMutation.isPending}
            onDelete={() => void handleDelete()}
          />
        </form>
      </section>
    </section>
  );
}
