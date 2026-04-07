import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { adminDataClient } from '../../../api/admin';
import type { MemberAdminPayload } from '../types';
import { AdminMemberEditorActionRow } from './AdminMemberEditorActionRow';
import { AdminMemberEditorBasicSection } from './AdminMemberEditorBasicSection';
import {
  ADMIN_MEMBER_EDITOR_CREATE_TITLE,
  ADMIN_MEMBER_EDITOR_DEFAULT_INVITE_ERROR,
  ADMIN_MEMBER_EDITOR_EDIT_TITLE,
} from './AdminMemberEditorPage.constants';
import { AdminMemberEditorNoteSection } from './AdminMemberEditorNoteSection';
import { AdminMemberEditorStatusSection } from './AdminMemberEditorStatusSection';
import { createMemberDraft, normalizeMemberDraft } from './memberAdminForm';
import {
  buildInvitePayload,
  getAuthActionLabel,
  getDeleteConfirmMessage,
  getDeleteSuccessMessage,
  getInviteConfirmMessage,
  getInviteSuccessMessage,
  getRestoreConfirmMessage,
  getSaveSuccessMessage,
} from './AdminMemberEditorPage.utils';
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
  const authActionLabel = getAuthActionLabel(hasAuthAccount);

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
          statusMessage: getSaveSuccessMessage(isEditMode),
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

      await adminDataClient.createMemberAdmin(buildInvitePayload(selectedMember));
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'members'] });
      navigate('/admin/members', {
        replace: true,
        state: {
          statusMessage: getInviteSuccessMessage(hasAuthAccount),
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
          statusMessage: getDeleteSuccessMessage(result),
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

    if (!window.confirm(getDeleteConfirmMessage(selectedMember.name))) {
      return;
    }

    await deleteMutation.mutateAsync();
  };

  const handleInvite = async () => {
    if (!isEditMode || !selectedMember || isInactiveMember) {
      return;
    }

    if (!window.confirm(getInviteConfirmMessage(selectedMember.name, hasAuthAccount))) {
      return;
    }

    setLocalErrorMessage('');
    try {
      await inviteMutation.mutateAsync();
    } catch (error) {
      setLocalErrorMessage(
        error instanceof Error ? error.message : ADMIN_MEMBER_EDITOR_DEFAULT_INVITE_ERROR,
      );
    }
  };

  const handleRestore = async () => {
    if (!isEditMode || !selectedMember || !isInactiveMember) {
      return;
    }

    if (!window.confirm(getRestoreConfirmMessage(selectedMember.name))) {
      return;
    }

    setLocalErrorMessage('');
    await restoreMutation.mutateAsync();
  };

  if (membersQuery.isLoading && isEditMode) {
    return (
      <section className="projects-feature projects-feature__shell projects-feature__editor-shell">
        <p className={'projects-feature__status-message'}>불러오는 중...</p>
      </section>
    );
  }

  if (isEditMode && !selectedMember && !membersQuery.isLoading) {
    return (
      <section className="projects-feature projects-feature__shell projects-feature__editor-shell">
        <header className={'projects-feature__editor-header'}>
          <h1 className={'projects-feature__title'}>{ADMIN_MEMBER_EDITOR_EDIT_TITLE}</h1>
        </header>
        <p className={'projects-feature__status-message'}>사용자 정보를 찾을 수 없습니다.</p>
      </section>
    );
  }

  return (
    <section className="projects-feature projects-feature__shell projects-feature__editor-shell">
      <header className={'projects-feature__editor-header'}>
        <h1 className={'projects-feature__title'}>
          {isEditMode ? ADMIN_MEMBER_EDITOR_EDIT_TITLE : ADMIN_MEMBER_EDITOR_CREATE_TITLE}
        </h1>
      </header>

      {errorMessage ? <p className={'projects-feature__status-message'}>{errorMessage}</p> : null}

      <section
        className="projects-feature__modal projects-feature__editor-surface"
        aria-label="사용자 편집 패널"
      >
        <form
          className="projects-feature__detail-form projects-feature__editor-detail-form"
          onSubmit={handleSubmit}
        >
          <AdminMemberEditorBasicSection
            draft={draft}
            isInactiveMember={Boolean(isInactiveMember)}
            isEmailLocked={isEmailLocked}
            roleLabel={roleLabel}
            onDraftChange={(patch) =>
              setDraft((current) => ({
                ...current,
                ...patch,
              }))
            }
          />

          {isEditMode ? (
            <AdminMemberEditorStatusSection
              draft={draft}
              isInactiveMember={Boolean(isInactiveMember)}
              activeLabel={activeLabel}
              memberStatusLabel={memberStatusLabel}
              onDraftChange={(patch) =>
                setDraft((current) => ({
                  ...current,
                  ...patch,
                }))
              }
            />
          ) : null}

          {isEditMode ? (
            <AdminMemberEditorNoteSection
              draft={draft}
              isInactiveMember={Boolean(isInactiveMember)}
              onDraftChange={(patch) =>
                setDraft((current) => ({
                  ...current,
                  ...patch,
                }))
              }
            />
          ) : null}

          <AdminMemberEditorActionRow
            isEditMode={isEditMode}
            isInactiveMember={Boolean(isInactiveMember)}
            authActionLabel={authActionLabel}
            invitePending={inviteMutation.isPending}
            restorePending={restoreMutation.isPending}
            deletePending={deleteMutation.isPending}
            savePending={saveMutation.isPending}
            onInvite={() => void handleInvite()}
            onRestore={() => void handleRestore()}
            onDelete={() => void handleDelete()}
          />
        </form>
      </section>
    </section>
  );
}
