import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { adminDataClient } from '../adminClient';
import type { MemberAdminPayload } from '../admin-types';
import { createMemberDraft, normalizeMemberDraft } from './memberAdminForm';
import '../../../styles/domain/pages/projects-feature.scss';

export function AdminMemberEditorPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { memberId } = useParams<{ memberId: string }>();
  const isEditMode = Boolean(memberId);
  const [draft, setDraft] = useState<MemberAdminPayload>(() => createMemberDraft());
  const [localErrorMessage, setLocalErrorMessage] = useState('');

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
  const memberStatusLabel = draft.memberStatus === 'pending' ? '승인대기' : '활성';
  const hasAuthAccount = Boolean(selectedMember?.authUserId);
  const isEmailLocked = Boolean(isInactiveMember || selectedMember?.authUserId);
  const authActionLabel = hasAuthAccount ? '비밀번호 재설정' : '초대 메일 발송';

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

      if (isEditMode && selectedMember?.authUserId) {
        normalizedDraft.email = selectedMember.email;
      }

      if (!isEditMode) {
        await adminDataClient.createMemberAdmin(normalizedDraft);
        return;
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
        throw new Error('인증 메일을 보낼 사용자 정보가 없습니다.');
      }

      if (selectedMember.authUserId) {
        if (!selectedMember.authEmail) {
          throw new Error('Auth 이메일이 없어 비밀번호 재설정 메일을 보낼 수 없습니다.');
        }

        await adminDataClient.resetMemberPasswordAdmin({
          email: selectedMember.authEmail,
        });
        return;
      }

      await adminDataClient.createMemberAdmin({
        id: selectedMember.id,
        authUserId: selectedMember.authUserId,
        accountId: selectedMember.accountId,
        name: selectedMember.name,
        email: selectedMember.email,
        note: selectedMember.note,
        role: selectedMember.role,
        userActive: selectedMember.userActive,
        memberStatus: selectedMember.memberStatus,
        reportRequired: selectedMember.reportRequired,
        isActive: selectedMember.isActive,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'members'] });
      navigate('/admin/members', {
        replace: true,
        state: {
          statusMessage: hasAuthAccount
            ? '비밀번호 재설정 메일을 보냈습니다.'
            : '초대 메일을 보냈습니다.',
        },
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
              ? '사용자와 인증 계정을 삭제했습니다.'
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
        memberStatus: selectedMember.memberStatus,
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
    localErrorMessage ||
    (membersQuery.error instanceof Error && membersQuery.error.message) ||
    (saveMutation.error instanceof Error && saveMutation.error.message) ||
    (inviteMutation.error instanceof Error && inviteMutation.error.message) ||
    (deleteMutation.error instanceof Error && deleteMutation.error.message) ||
    (restoreMutation.error instanceof Error && restoreMutation.error.message) ||
    '';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalErrorMessage('');
    await saveMutation.mutateAsync(draft);
  };

  const handleDelete = async () => {
    if (!isEditMode || !selectedMember) {
      return;
    }

    if (
      !window.confirm(
        `${selectedMember.name} 사용자를 삭제하시겠습니까?\n업무 데이터가 없으면 사용자와 인증 계정을 함께 삭제하고, 업무 데이터가 있으면 비활성 보관 처리합니다.`,
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

    if (
      !window.confirm(
        hasAuthAccount
          ? `${selectedMember.name}에게 비밀번호 재설정 메일을 보내시겠습니까?`
          : `${selectedMember.name}에게 초대 메일을 보내시겠습니까?`,
      )
    ) {
      return;
    }

    setLocalErrorMessage('');
    try {
      await inviteMutation.mutateAsync();
    } catch (error) {
      setLocalErrorMessage(
        error instanceof Error ? error.message : '인증 메일 발송에 실패했습니다.',
      );
    }
  };

  const handleRestore = async () => {
    if (!isEditMode || !selectedMember || !isInactiveMember) {
      return;
    }

    if (!window.confirm(`${selectedMember.name} 사용자를 다시 활성화하시겠습니까?`)) {
      return;
    }

    setLocalErrorMessage('');
    await restoreMutation.mutateAsync();
  };

  if (membersQuery.isLoading && isEditMode) {
    return (
      <section className="projectsFeatureScope shell editorShell">
        <p className={'statusMessage'}>불러오는 중...</p>
      </section>
    );
  }

  if (isEditMode && !selectedMember && !membersQuery.isLoading) {
    return (
      <section className="projectsFeatureScope shell editorShell">
        <header className={'editorHeader'}>
          <h1 className={'title'}>사용자 수정</h1>
        </header>
        <p className={'statusMessage'}>사용자 정보를 찾을 수 없습니다.</p>
      </section>
    );
  }

  return (
    <section className="projectsFeatureScope shell editorShell">
      <header className={'editorHeader'}>
        <h1 className={'title'}>{isEditMode ? '사용자 수정' : '사용자 추가'}</h1>
      </header>

      {errorMessage ? <p className={'statusMessage'}>{errorMessage}</p> : null}

      <section className={`${'modal'} ${'editorSurface'}`} aria-label="사용자 편집 패널">
        <form className={`${'detailForm'} ${'editorDetailForm'}`} onSubmit={handleSubmit}>
          <section className={'editorSection'} aria-labelledby="member-basic-section">
            <div className={'sectionHeader'}>
              <h2 id="member-basic-section" className={'sectionTitle'}>
                기본 정보
              </h2>
            </div>
            <div className={'editorFormGrid'}>
              <label className={'field'}>
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

              <label className={'field'}>
                <span>이름</span>
                <input
                  value={draft.name}
                  readOnly={Boolean(isInactiveMember)}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, name: event.target.value }))
                  }
                />
              </label>

              <label className={'field'}>
                <span>이메일</span>
                <input
                  type="email"
                  value={draft.email}
                  readOnly={isEmailLocked}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, email: event.target.value }))
                  }
                />
              </label>

              <label className={'field'}>
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
            </div>
          </section>

          {isEditMode ? (
            <section className={'editorSection'} aria-labelledby="member-status-section">
              <div className={'sectionHeader'}>
                <h2 id="member-status-section" className={'sectionTitle'}>
                  상태 정보
                </h2>
              </div>
              <div className={'editorFormGrid'}>
                <label className={'field'}>
                  <span>Auth ID</span>
                  <input value={draft.authUserId ?? '-'} readOnly />
                </label>
                <label className={'field'}>
                  <span>활성 여부</span>
                  <input value={activeLabel} readOnly />
                </label>

                <label className={'field'}>
                  <span>승인 상태</span>
                  {isInactiveMember ? (
                    <input value={memberStatusLabel} readOnly />
                  ) : (
                    <select
                      value={draft.memberStatus}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          memberStatus: event.target.value as MemberAdminPayload['memberStatus'],
                        }))
                      }
                    >
                      <option value="active">활성</option>
                      <option value="pending">승인대기</option>
                    </select>
                  )}
                </label>

                <label className={'field'}>
                  <span>업무보고 접근</span>
                  {isInactiveMember ? (
                    <input value={draft.reportRequired ? '허용' : '차단'} readOnly />
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
                      <option value="1">허용</option>
                      <option value="0">차단</option>
                    </select>
                  )}
                </label>
              </div>
            </section>
          ) : null}

          {isEditMode ? (
            <section className={'editorSection'} aria-labelledby="member-note-section">
              <div className={'sectionHeader'}>
                <h2 id="member-note-section" className={'sectionTitle'}>
                  기타
                </h2>
              </div>
              <div className={'editorFormGrid'}>
                <label className={'field'}>
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
            </section>
          ) : null}

          <div className={`${'formActions'} ${'editorFormActions'}`}>
            <div className={'editorFormActionsStart'}>
              {isEditMode ? (
                <>
                  {!isInactiveMember ? (
                    <button
                      type="button"
                      className={'secondaryButton'}
                      onClick={() => void handleInvite()}
                      disabled={inviteMutation.isPending}
                    >
                      {authActionLabel}
                    </button>
                  ) : null}
                  {isInactiveMember ? (
                    <button
                      type="button"
                      className={'primaryButton'}
                      onClick={() => void handleRestore()}
                      disabled={restoreMutation.isPending}
                    >
                      복원
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={'deleteButton'}
                      onClick={() => void handleDelete()}
                      disabled={deleteMutation.isPending}
                    >
                      삭제
                    </button>
                  )}
                </>
              ) : null}
            </div>
            <div className={'editorFormActionsEnd'}>
              <Link to="/admin/members" className={'secondaryButton'}>
                취소
              </Link>
              <button
                type="submit"
                className={'primaryButton'}
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
