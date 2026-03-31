import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { adminDataClient } from '../admin-client';
import type { MemberAdminPayload } from '../admin-types';
import { createMemberDraft, normalizeMemberDraft } from './member-admin-form';
import styles from '../../projects/ProjectsFeature.module.css';

export function AdminMemberEditorPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { memberId } = useParams<{ memberId: string }>();
  const isEditMode = Boolean(memberId);
  const [draft, setDraft] = useState<MemberAdminPayload>(() => createMemberDraft());

  const membersQuery = useQuery({
    queryKey: ['admin', 'members'],
    queryFn: () => adminDataClient.listMembersAdmin(),
  });

  const selectedMember = useMemo(
    () => membersQuery.data?.find((member) => member.id === memberId) ?? null,
    [memberId, membersQuery.data],
  );
  const isInactiveMember = isEditMode && selectedMember?.userActive === false;

  const roleLabel = draft.role === 'admin' ? '관리자' : '팀원';
  const activeLabel = draft.userActive ? '활성' : '비활성';

  useEffect(() => {
    if (!isEditMode) {
      setDraft(createMemberDraft());
      return;
    }

    if (selectedMember) {
      setDraft(createMemberDraft(selectedMember));
    }
  }, [isEditMode, selectedMember]);

  const saveMutation = useMutation({
    mutationFn: async (payload: MemberAdminPayload) => {
      const normalizedDraft = normalizeMemberDraft(payload);

      if (!isEditMode) {
        await adminDataClient.inviteMemberAdmin({
          email: normalizedDraft.email,
          accountId: normalizedDraft.accountId,
          name: normalizedDraft.name,
          role: normalizedDraft.role,
        });
      }

      await adminDataClient.saveMemberAdmin(normalizedDraft);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'members'] });
      navigate('/admin/members', {
        replace: true,
        state: {
          statusMessage: isEditMode
            ? '사용자 정보를 저장했습니다.'
            : '사용자를 추가하고 초대 메일을 보냈습니다.',
        },
      });
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      if (!selectedMember) {
        throw new Error('초대할 사용자 정보가 없습니다.');
      }

      await adminDataClient.inviteMemberAdmin({
        email: selectedMember.email,
        accountId: selectedMember.accountId,
        name: selectedMember.name,
        role: selectedMember.role,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'members'] });
      navigate('/admin/members', {
        replace: true,
        state: { statusMessage: '초대 메일을 보냈습니다.' },
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!memberId) {
        throw new Error('삭제할 사용자 정보가 없습니다.');
      }

      return adminDataClient.deleteMemberAdmin(memberId);
    },
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'members'] });
      navigate('/admin/members', {
        replace: true,
        state: {
          statusMessage:
            result === 'deleted'
              ? '사용자를 삭제했습니다.'
              : '업무 데이터가 있어 사용자를 비활성 보관 처리했습니다.',
        },
      });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async () => {
      if (!selectedMember) {
        throw new Error('복원할 사용자 정보가 없습니다.');
      }

      await adminDataClient.saveMemberAdmin({
        id: selectedMember.id,
        authUserId: selectedMember.authUserId,
        accountId: selectedMember.accountId,
        name: selectedMember.name,
        email: selectedMember.email,
        role: selectedMember.role,
        note: selectedMember.note,
        userActive: true,
        reportRequired: selectedMember.reportRequired,
        isActive: true,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'members'] });
      navigate('/admin/members', {
        replace: true,
        state: { statusMessage: '사용자를 다시 활성화했습니다.' },
      });
    },
  });

  const errorMessage =
    (membersQuery.error instanceof Error && membersQuery.error.message) ||
    (saveMutation.error instanceof Error && saveMutation.error.message) ||
    (inviteMutation.error instanceof Error && inviteMutation.error.message) ||
    (deleteMutation.error instanceof Error && deleteMutation.error.message) ||
    (restoreMutation.error instanceof Error && restoreMutation.error.message) ||
    '';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await saveMutation.mutateAsync(draft);
  };

  const handleDelete = async () => {
    if (!isEditMode || !selectedMember) {
      return;
    }

    if (
      !window.confirm(
        `${selectedMember.name} 사용자를 삭제하시겠습니까?\n업무 데이터가 있으면 비활성 보관 처리됩니다.`,
      )
    ) {
      return;
    }

    await deleteMutation.mutateAsync();
  };

  const handleInvite = async () => {
    if (!isEditMode || !selectedMember || isInactiveMember) {
      return;
    }

    if (!window.confirm(`${selectedMember.name}에게 초대 메일을 보내시겠습니까?`)) {
      return;
    }

    await inviteMutation.mutateAsync();
  };

  const handleRestore = async () => {
    if (!isEditMode || !selectedMember || !isInactiveMember) {
      return;
    }

    if (!window.confirm(`${selectedMember.name} 사용자를 다시 활성화하시겠습니까?`)) {
      return;
    }

    await restoreMutation.mutateAsync();
  };

  if (membersQuery.isLoading && isEditMode) {
    return (
      <section className={`${styles.shell} ${styles.editorShell}`}>
        <p className={styles.statusMessage}>불러오는 중...</p>
      </section>
    );
  }

  if (isEditMode && !selectedMember && !membersQuery.isLoading) {
    return (
      <section className={`${styles.shell} ${styles.editorShell}`}>
        <header className={styles.editorHeader}>
          <h1 className={styles.title}>사용자 수정</h1>
        </header>
        <p className={styles.statusMessage}>사용자 정보를 찾을 수 없습니다.</p>
      </section>
    );
  }

  return (
    <section className={`${styles.shell} ${styles.editorShell}`}>
      <header className={styles.editorHeader}>
        <h1 className={styles.title}>{isEditMode ? '사용자 수정' : '사용자 추가'}</h1>
      </header>

      {errorMessage ? <p className={styles.statusMessage}>{errorMessage}</p> : null}

      <section className={`${styles.modal} ${styles.editorSurface}`} aria-label="사용자 편집 패널">
        <form className={`${styles.detailForm} ${styles.editorDetailForm}`} onSubmit={handleSubmit}>
          <div className={styles.editorFormGrid}>
            <label className={styles.field}>
              <span>ID</span>
              <input
                autoFocus
                value={draft.accountId}
                readOnly={Boolean(isInactiveMember)}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, accountId: event.target.value }))
                }
              />
            </label>

            <label className={styles.field}>
              <span>이름</span>
              <input
                value={draft.name}
                readOnly={Boolean(isInactiveMember)}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, name: event.target.value }))
                }
              />
            </label>

            <label className={styles.field}>
              <span>이메일</span>
              <input
                type="email"
                value={draft.email}
                readOnly={Boolean(isInactiveMember)}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, email: event.target.value }))
                }
              />
            </label>

            <label className={styles.field}>
              <span>권한</span>
              {isInactiveMember ? (
                <input value={roleLabel} readOnly />
              ) : (
                <select
                  value={draft.role}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      role: event.target.value as MemberAdminPayload['role'],
                    }))
                  }
                >
                  <option value="user">팀원</option>
                  <option value="admin">관리자</option>
                </select>
              )}
            </label>

            {isEditMode ? (
              <label className={styles.field}>
                <span>Supabase ID</span>
                <input value={draft.authUserId ?? '-'} readOnly />
              </label>
            ) : null}

            {isEditMode ? (
              <label className={styles.field}>
                <span>활성 여부</span>
                <input value={activeLabel} readOnly />
              </label>
            ) : null}

            <label className={styles.field}>
              <span>업무보고 대상여부</span>
              {isInactiveMember ? (
                <input value={draft.reportRequired ? '대상' : '비대상'} readOnly />
              ) : (
                <select
                  value={draft.reportRequired ? '1' : '0'}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      reportRequired: event.target.value === '1',
                    }))
                  }
                >
                  <option value="1">대상</option>
                  <option value="0">비대상</option>
                </select>
              )}
            </label>

            <label className={styles.field}>
              <span>비고</span>
              <textarea
                value={draft.note}
                readOnly={Boolean(isInactiveMember)}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, note: event.target.value }))
                }
              />
            </label>
          </div>

          <div className={`${styles.formActions} ${styles.editorFormActions}`}>
            <div className={styles.editorFormActionsStart}>
              {isEditMode ? (
                <>
                  {!isInactiveMember ? (
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={() => void handleInvite()}
                      disabled={inviteMutation.isPending}
                    >
                      초대 메일
                    </button>
                  ) : null}
                  {isInactiveMember ? (
                    <button
                      type="button"
                      className={styles.primaryButton}
                      onClick={() => void handleRestore()}
                      disabled={restoreMutation.isPending}
                    >
                      복원
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={styles.deleteButton}
                      onClick={() => void handleDelete()}
                      disabled={deleteMutation.isPending}
                    >
                      삭제
                    </button>
                  )}
                </>
              ) : null}
            </div>
            <div className={styles.editorFormActionsEnd}>
              <Link to="/admin/members" className={styles.secondaryButton}>
                취소
              </Link>
              <button
                type="submit"
                className={styles.primaryButton}
                disabled={saveMutation.isPending || Boolean(isInactiveMember)}
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
