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
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    document.title = "사용자 관리 | My Works";
  }, []);

  const membersQuery = useQuery({
    queryKey: ["admin", "members"],
    queryFn: () => adminDataClient.listMembersAdmin(),
  });

  const saveMutation = useMutation({
    mutationFn: (payload: MemberAdminPayload) => adminDataClient.saveMemberAdmin(payload),
  });

  const inviteMutation = useMutation({
    mutationFn: (payload: { email: string; legacyUserId: string; name: string; role: "user" | "admin" }) =>
      adminDataClient.inviteMemberAdmin(payload),
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
    setStatusMessage("");
    setAdding(true);
    setEditingMemberId(null);
    setDraft(createDraft());
  };

  const startEdit = (member: MemberAdminItem) => {
    setStatusMessage("");
    setAdding(false);
    setEditingMemberId(member.id);
    setDraft(createDraft(member));
  };

  const cancelDraft = () => {
    setStatusMessage("");
    setAdding(false);
    setEditingMemberId(null);
    setDraft(null);
  };

  const saveDraft = async () => {
    if (!draft || saveMutation.isPending || inviteMutation.isPending) {
      return;
    }

    const normalizedDraft = normalizeDraft(draft);
    const isCreate = !normalizedDraft.id;

    setStatusMessage("");

    await saveMutation.mutateAsync(normalizedDraft);

    try {
      if (isCreate) {
        await inviteMutation.mutateAsync({
          email: normalizedDraft.email,
          legacyUserId: normalizedDraft.legacyUserId,
          name: normalizedDraft.name,
          role: normalizedDraft.role,
        });
        setStatusMessage("사용자를 추가하고 초대 메일을 보냈습니다.");
      } else {
        setStatusMessage("사용자 정보를 저장했습니다.");
      }
    } catch (error) {
      setStatusMessage("");
      throw new Error(
        error instanceof Error
          ? `사용자는 저장했지만 초대 메일 발송에 실패했습니다. ${error.message}`
          : "사용자는 저장했지만 초대 메일 발송에 실패했습니다.",
      );
    } finally {
      void queryClient.invalidateQueries({ queryKey: ["admin", "members"] });
    }

    setAdding(false);
    setEditingMemberId(null);
    setDraft(null);
  };

  const handleDelete = async (member: MemberAdminItem) => {
    if (!window.confirm(`정말 ${member.name} 사용자를 삭제하시겠습니까?`)) {
      return;
    }

    await deleteMutation.mutateAsync(member.id);
  };

  const handleInvite = async (member: MemberAdminItem) => {
    setStatusMessage("");
    if (!window.confirm(`${member.name}에게 초대 메일을 보내시겠습니까?`)) {
      return;
    }

    await inviteMutation.mutateAsync({
      email: member.email,
      legacyUserId: member.legacyUserId,
      name: member.name,
      role: member.role,
    });
    setStatusMessage("초대 메일을 보냈습니다.");
  };

  const errorMessage =
    (membersQuery.error instanceof Error && membersQuery.error.message) ||
    (saveMutation.error instanceof Error && saveMutation.error.message) ||
    (inviteMutation.error instanceof Error && inviteMutation.error.message) ||
    (deleteMutation.error instanceof Error && deleteMutation.error.message) ||
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

      {statusMessage ? <p className={styles.statusText}>{statusMessage}</p> : null}
      {errorMessage ? <p className={styles.helperText}>{errorMessage}</p> : null}

      <div className={styles.panel}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <caption className="srOnly">사용자 내역</caption>
            <thead>
              <tr>
                <th>ID</th>
                <th>이름</th>
                <th>이메일</th>
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
                  <td colSpan={8} className={styles.emptyCell}>
                    불러오는 중...
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={8} className={styles.emptyCell}>
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
                    onInvite={() => void handleInvite(member)}
                    isSaving={saveMutation.isPending || inviteMutation.isPending}
                    isDeleting={deleteMutation.isPending}
                    isInviting={inviteMutation.isPending}
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
