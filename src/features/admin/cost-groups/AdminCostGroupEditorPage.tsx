import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { adminDataClient } from '../adminClient';
import type { AdminCostGroupItem, AdminCostGroupPayload } from '../admin-types';
import styles from '../../projects/ProjectsFeature.module.css';

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

  const costGroupsQuery = useQuery({
    queryKey: ['admin', 'cost-groups'],
    queryFn: () => adminDataClient.listCostGroups(),
  });

  const costGroups = useMemo(() => costGroupsQuery.data ?? [], [costGroupsQuery.data]);
  const selectedCostGroup = useMemo(
    () => costGroups.find((item) => item.id === costGroupId) ?? null,
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

  const saveMutation = useMutation({
    mutationFn: async (payload: AdminCostGroupPayload) =>
      adminDataClient.saveCostGroupAdmin({
        ...payload,
        name: payload.name.trim(),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'cost-groups'] });
      navigate('/org/cost-group', {
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
      navigate('/org/cost-group', {
        replace: true,
        state: { statusMessage: '청구그룹을 삭제했습니다.' },
      });
    },
  });

  const errorMessage =
    (costGroupsQuery.error instanceof Error && costGroupsQuery.error.message) ||
    (saveMutation.error instanceof Error && saveMutation.error.message) ||
    (deleteMutation.error instanceof Error && deleteMutation.error.message) ||
    '';

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

  if (costGroupsQuery.isLoading && isEditMode) {
    return (
      <section className={`${styles.shell} ${styles.editorShell}`}>
        <p className={styles.statusMessage}>불러오는 중...</p>
      </section>
    );
  }

  if (isEditMode && !selectedCostGroup && !costGroupsQuery.isLoading) {
    return (
      <section className={`${styles.shell} ${styles.editorShell}`}>
        <header className={styles.editorHeader}>
          <h1 className={styles.title}>청구그룹 수정</h1>
        </header>
        <p className={styles.statusMessage}>청구그룹을 찾을 수 없습니다.</p>
      </section>
    );
  }

  return (
    <section className={`${styles.shell} ${styles.editorShell}`}>
      <header className={styles.editorHeader}>
        <h1 className={styles.title}>{isEditMode ? '청구그룹 수정' : '청구그룹 추가'}</h1>
      </header>

      {errorMessage ? <p className={styles.statusMessage}>{errorMessage}</p> : null}

      <section
        className={`${styles.modal} ${styles.editorSurface}`}
        aria-label="청구그룹 편집 패널"
      >
        <form className={`${styles.detailForm} ${styles.editorDetailForm}`} onSubmit={handleSubmit}>
          <div className={styles.editorFormGrid}>
            <label className={styles.field}>
              <span>청구그룹명</span>
              <input
                ref={titleRef}
                value={draft.name}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, name: event.target.value }))
                }
              />
            </label>

            <label className={styles.field}>
              <span>노출여부</span>
              <select
                value={draft.isActive ? '1' : '0'}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, isActive: event.target.value === '1' }))
                }
              >
                <option value="1">노출</option>
                <option value="0">숨김</option>
              </select>
            </label>
          </div>

          <div className={`${styles.formActions} ${styles.editorFormActions}`}>
            <div className={styles.editorFormActionsStart}>
              {isEditMode ? (
                <button
                  type="button"
                  className={styles.deleteButton}
                  onClick={() => void handleDelete()}
                  disabled={deleteMutation.isPending}
                >
                  삭제
                </button>
              ) : null}
            </div>
            <div className={styles.editorFormActionsEnd}>
              <Link to="/org/cost-group" className={styles.secondaryButton}>
                취소
              </Link>
              <button
                type="submit"
                className={styles.primaryButton}
                disabled={saveMutation.isPending}
              >
                저장
              </button>
            </div>
          </div>
        </form>
      </section>
    </section>
  );
}
