import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { adminDataClient } from '../adminClient';
import type { AdminTaskTypeItem, AdminTaskTypePayload } from '../admin-types';
import '../../../styles/domain/pages/projects-feature.scss';

function createDraft(taskType?: AdminTaskTypeItem): AdminTaskTypePayload {
  if (!taskType) {
    return {
      type1: '',
      type2: '',
      displayLabel: '',
      displayOrder: 0,
      requiresServiceGroup: false,
      isActive: true,
    };
  }

  return {
    id: taskType.id,
    type1: taskType.type1,
    type2: taskType.type2,
    displayLabel: taskType.displayLabel,
    displayOrder: taskType.displayOrder,
    requiresServiceGroup: taskType.requiresServiceGroup,
    isActive: taskType.isActive,
  };
}

function buildDisplayLabel(type1: string, type2: string, displayLabel: string) {
  const normalizedDisplayLabel = displayLabel.trim();
  if (normalizedDisplayLabel) {
    return normalizedDisplayLabel;
  }

  const normalizedType1 = type1.trim();
  const normalizedType2 = type2.trim();

  if (normalizedType1 && normalizedType2) {
    return `${normalizedType1} / ${normalizedType2}`;
  }

  return normalizedType1 || normalizedType2;
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

  const taskTypes = useMemo(() => taskTypesQuery.data ?? [], [taskTypesQuery.data]);
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
        displayLabel: buildDisplayLabel(payload.type1, payload.type2, payload.displayLabel),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'task-types'] });
      navigate('/org/type', {
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
      navigate('/org/type', {
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
  const taskUsageCount = usageQuery.data?.taskCount ?? 0;
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
      <section className={`${'shell'} ${'editorShell'}`}>
        <p className={'statusMessage'}>불러오는 중...</p>
      </section>
    );
  }

  if (isEditMode && !selectedTaskType && !taskTypesQuery.isLoading) {
    return (
      <section className={`${'shell'} ${'editorShell'}`}>
        <header className={'editorHeader'}>
          <h1 className={'title'}>업무 타입 수정</h1>
        </header>
        <p className={'statusMessage'}>업무 타입을 찾을 수 없습니다.</p>
      </section>
    );
  }

  return (
    <section className={`${'shell'} ${'editorShell'}`}>
      <header className={'editorHeader'}>
        <h1 className={'title'}>{isEditMode ? '업무 타입 수정' : '업무 타입 추가'}</h1>
      </header>

      {errorMessage ? <p className={'statusMessage'}>{errorMessage}</p> : null}

      <section className={`${'modal'} ${'editorSurface'}`} aria-label="업무 타입 편집 패널">
        <form className={`${'detailForm'} ${'editorDetailForm'}`} onSubmit={handleSubmit}>
          <div className={'editorFormGrid'}>
            <label className={'field'}>
              <span>타입1</span>
              <input
                ref={titleRef}
                value={draft.type1}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, type1: event.target.value }))
                }
              />
            </label>

            <label className={'field'}>
              <span>타입2</span>
              <input
                value={draft.type2}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, type2: event.target.value }))
                }
              />
            </label>

            <label className={'field'}>
              <span>리소스 타입</span>
              <select
                value={draft.requiresServiceGroup ? '1' : '0'}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    requiresServiceGroup: event.target.value === '1',
                  }))
                }
              >
                <option value="1">프로젝트</option>
                <option value="0">일반</option>
              </select>
            </label>

            <label className={'field'}>
              <span>활성여부</span>
              <select
                value={draft.isActive ? '1' : '0'}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, isActive: event.target.value === '1' }))
                }
              >
                <option value="1">활성</option>
                <option value="0">비활성</option>
              </select>
            </label>

            {isEditMode ? (
              <label className={'field'}>
                <span>비고</span>
                <input
                  value={draft.displayLabel}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, displayLabel: event.target.value }))
                  }
                />
              </label>
            ) : null}
          </div>

          <div className={`${'formActions'} ${'editorFormActions'}`}>
            <div className={'editorFormActionsStart'}>
              {isEditMode ? (
                <>
                  <button
                    type="button"
                    className={'deleteButton'}
                    onClick={() => void handleDelete()}
                    disabled={deleteMutation.isPending || deleteBlocked}
                  >
                    삭제
                  </button>
                  {deleteHelpText ? <p className={'helpText'}>{deleteHelpText}</p> : null}
                </>
              ) : null}
            </div>
            <div className={'editorFormActionsEnd'}>
              <Link to="/org/type" className={'secondaryButton'}>
                취소
              </Link>
              <button type="submit" className={'primaryButton'} disabled={saveMutation.isPending}>
                저장
              </button>
            </div>
          </div>
        </form>
      </section>
    </section>
  );
}
