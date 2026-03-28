import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminDataClient } from "../admin-client";
import type { MemberAdminItem, MemberAdminPayload } from "../admin-types";
import { AdminMemberRow } from "./AdminMemberRow";
import styles from "./AdminMembersPage.module.css";

function createDraft(member?: MemberAdminItem): MemberAdminPayload {
  if (!member) {
    return {
      legacyUserId: "",
      name: "",
      email: "",
      role: "user",
      userActive: true,
      isActive: true,
      authUserId: null,
    };
  }

  return {
    id: member.id,
    authUserId: member.authUserId,
    legacyUserId: member.legacyUserId,
    name: member.name,
    email: member.email,
    role: member.role,
    userActive: member.userActive,
    isActive: member.userActive,
  };
}

function normalizeDraft(draft: MemberAdminPayload): MemberAdminPayload {
  const active = draft.userActive ?? draft.isActive ?? true;

  return {
    ...draft,
    email: draft.email.trim() || draft.legacyUserId.trim(),
    userActive: active,
    isActive: active,
  };
}

export function AdminMembersPage() {
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [draft, setDraft] = useState<MemberAdminPayload | null>(null);

  useEffect(() => {
    document.title = "사용자 관리 | My Works";
  }, []);

  const membersQuery = useQuery({
    queryKey: ["admin", "members"],
    queryFn: () => adminDataClient.listMembersAdmin(),
  });

  const saveMutation = useMutation({
    mutationFn: (payload: MemberAdminPayload) => adminDataClient.saveMemberAdmin(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "members"] });
      setAdding(false);
      setEditingMemberId(null);
      setDraft(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (memberId: string) => adminDataClient.deleteMemberAdmin(memberId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "members"] });
      setAdding(false);
      setEditingMemberId(null);
      setDraft(null);
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (email: string) => adminDataClient.resetMemberPasswordAdmin(email),
  });

  useEffect(() => {
    if (!adding && !editingMemberId) {
      setDraft(null);
    }
  }, [adding, editingMemberId]);

  const members = membersQuery.data ?? [];

  const handleFieldChange = <K extends keyof MemberAdminPayload>(key: K, value: MemberAdminPayload[K]) => {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  };

  const startAdd = () => {
    setAdding(true);
    setEditingMemberId(null);
    setDraft(createDraft());
  };

  const startEdit = (member: MemberAdminItem) => {
    setAdding(false);
    setEditingMemberId(member.id);
    setDraft(createDraft(member));
  };

  const cancelDraft = () => {
    setAdding(false);
    setEditingMemberId(null);
    setDraft(null);
  };

  const saveDraft = async () => {
    if (!draft || saveMutation.isPending) {
      return;
    }

    await saveMutation.mutateAsync(normalizeDraft(draft));
  };

  const handleDelete = async (member: MemberAdminItem) => {
    if (!window.confirm(`정말 ${member.name} 사용자를 삭제하시겠습니까?`)) {
      return;
    }

    await deleteMutation.mutateAsync(member.id);
  };

  const handleResetPassword = async (member: MemberAdminItem) => {
    if (!window.confirm(`${member.name}에게 비밀번호 재설정 메일을 보내시겠습니까?`)) {
      return;
    }

    await resetPasswordMutation.mutateAsync(member.email);
  };

  const errorMessage =
    (membersQuery.error instanceof Error && membersQuery.error.message) ||
    (saveMutation.error instanceof Error && saveMutation.error.message) ||
    (deleteMutation.error instanceof Error && deleteMutation.error.message) ||
    (resetPasswordMutation.error instanceof Error && resetPasswordMutation.error.message) ||
    "";

  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <h1>사용자 관리</h1>
        <div className={styles.heroActions}>
          {!adding ? (
            <button type="button" className={styles.primaryButton} onClick={startAdd}>
              사용자 추가
            </button>
          ) : null}
        </div>
      </header>

      {errorMessage ? <p className={styles.helperText}>{errorMessage}</p> : null}

      <div className={styles.panel}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <caption className="srOnly">사용자 내역</caption>
            <thead>
              <tr>
                <th>ID</th>
                <th>이름</th>
                <th>권한</th>
                <th>활성여부</th>
                <th>등록일</th>
                <th>최종로그인</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {adding && draft ? (
                <AdminMemberRow
                  mode="create"
                  draft={draft}
                  onDraftChange={handleFieldChange}
                  onSave={() => void saveDraft()}
                  onCancel={cancelDraft}
                  isSaving={saveMutation.isPending}
                />
              ) : null}

              {membersQuery.isLoading ? (
                <tr>
                  <td colSpan={7} className={styles.emptyCell}>
                    불러오는 중...
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.emptyCell}>
                    조회된 사용자가 없습니다.
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <AdminMemberRow
                    key={member.id}
                    mode={editingMemberId === member.id ? "edit" : "view"}
                    member={member}
                    draft={editingMemberId === member.id ? draft : null}
                    onDraftChange={handleFieldChange}
                    onStartEdit={() => startEdit(member)}
                    onSave={() => void saveDraft()}
                    onCancel={cancelDraft}
                    onDelete={() => void handleDelete(member)}
                    onResetPassword={() => void handleResetPassword(member)}
                    isSaving={saveMutation.isPending}
                    isDeleting={deleteMutation.isPending}
                    isResetting={resetPasswordMutation.isPending}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
