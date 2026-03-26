import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminDataClient } from "../admin-client";

import styles from "../AdminPage.module.css";
import type { MemberAdminItem, MemberAdminPayload } from "../admin-types";

const QUEUE_REASON_LABEL: Record<string, string> = {
  auth_unlinked: "Auth 미연결",
  legacy_id_missing: "ID 미설정",
  email_missing: "이메일 미설정",
  inactive_candidate: "비활성 사용자",
};

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

export function AdminMembersPage() {
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [draft, setDraft] = useState<MemberAdminPayload | null>(null);

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

  const members = useMemo(
    () =>
      [...(membersQuery.data ?? [])].sort((left, right) => {
        const queueDelta = right.queueReasons.length - left.queueReasons.length;
        if (queueDelta !== 0) {
          return queueDelta;
        }
        return left.legacyUserId.localeCompare(right.legacyUserId);
      }),
    [membersQuery.data],
  );

  useEffect(() => {
    if (!adding && !editingMemberId) {
      setDraft(null);
    }
  }, [adding, editingMemberId]);

  const handleChange = <K extends keyof MemberAdminPayload>(key: K, value: MemberAdminPayload[K]) => {
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
    if (!draft) return;
    await saveMutation.mutateAsync({
      ...draft,
      userActive: draft.userActive ?? draft.isActive ?? true,
      isActive: draft.userActive ?? draft.isActive ?? true,
    });
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

  const summary = useMemo(
    () => ({
      total: members.length,
      admins: members.filter((member) => member.role === "admin").length,
      active: members.filter((member) => member.userActive).length,
      pending: members.filter((member) => member.queueReasons.length > 0).length,
    }),
    [members],
  );

  return (
    <section className={styles.page}>
      

      <header className={styles.hero}>
        <h1>사용자 계정 관리</h1>
      </header>

      {errorMessage && <p className={styles.helperText}>{errorMessage}</p>}

      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span>전체 사용자</span>
          <strong>{summary.total}</strong>
        </div>
        <div className={styles.summaryCard}>
          <span>활성 사용자</span>
          <strong>{summary.active}</strong>
        </div>
        <div className={styles.summaryCard}>
          <span>관리자</span>
          <strong>{summary.admins}</strong>
        </div>
        <div className={styles.summaryCard}>
          <span>처리 대상</span>
          <strong>{summary.pending}</strong>
        </div>
      </div>

      <div className={styles.panel}>
        <div className={styles.sectionHeader}>
          <h2>사용자 목록</h2>
          <div className={styles.sectionActions}>
            {!adding && (
              <button type="button" onClick={startAdd}>
                사용자 추가
              </button>
            )}
          </div>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>이름</th>
                <th>이메일</th>
                <th>Auth 연결</th>
                <th>처리 상태</th>
                <th>권한</th>
                <th>활성</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {adding && draft && (
                <tr className={styles.inlineRow}>
                  <td className={styles.inlineRowCell}>
                    <input
                      aria-label="신규 사용자 ID"
                      value={draft.legacyUserId}
                      onChange={(event) => handleChange("legacyUserId", event.target.value)}
                    />
                  </td>
                  <td className={styles.inlineRowCell}>
                    <input
                      aria-label="신규 사용자 이름"
                      value={draft.name}
                      onChange={(event) => handleChange("name", event.target.value)}
                    />
                  </td>
                  <td className={styles.inlineRowCell}>
                    <input
                      aria-label="신규 사용자 이메일"
                      type="email"
                      value={draft.email}
                      onChange={(event) => handleChange("email", event.target.value)}
                    />
                  </td>
                  <td className={styles.inlineRowCell}>
                    <div className={styles.badges}>
                      <span className={styles.badge}>가입 후 자동 연결</span>
                    </div>
                  </td>
                  <td className={styles.inlineRowCell}>
                    <div className={styles.queueList}>
                      <span className={styles.queueItem}>신규 사용자 등록</span>
                    </div>
                  </td>
                  <td className={styles.inlineRowCell}>
                    <select aria-label="신규 사용자 권한" value={draft.role} onChange={(event) => handleChange("role", event.target.value as MemberAdminPayload["role"]) }>
                      <option value="user">사용자</option>
                      <option value="admin">관리자</option>
                    </select>
                  </td>
                  <td className={styles.inlineRowCell}>
                    <select
                      aria-label="신규 사용자 활성 여부"
                      value={draft.userActive ? "1" : "0"}
                      onChange={(event) => {
                        const nextActive = event.target.value === "1";
                        handleChange("userActive", nextActive);
                        handleChange("isActive", nextActive);
                      }}
                    >
                      <option value="1">활성</option>
                      <option value="0">비활성</option>
                    </select>
                  </td>
                  <td className={styles.inlineRowActions}>
                    <div className={styles.actions}>
                      <button type="button" onClick={() => void saveDraft()} disabled={saveMutation.isPending}>
                        저장
                      </button>
                      <button type="button" onClick={cancelDraft}>
                        취소
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {members.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className={styles.emptyState}>조회된 사용자가 없습니다.</div>
                  </td>
                </tr>
              ) : (
                members.map((member) => {
                  const isEditing = editingMemberId === member.id && draft;

                  return isEditing && draft ? (
                    <tr key={member.id} className={styles.inlineRow}>
                      <td className={styles.inlineRowCell}>
                        <input
                          aria-label="ID 수정"
                          value={draft.legacyUserId}
                          onChange={(event) => handleChange("legacyUserId", event.target.value)}
                        />
                      </td>
                      <td className={styles.inlineRowCell}>
                        <input
                          aria-label="이름 수정"
                          value={draft.name}
                          onChange={(event) => handleChange("name", event.target.value)}
                        />
                      </td>
                      <td className={styles.inlineRowCell}>
                        <input
                          aria-label="이메일 수정"
                          type="email"
                          value={draft.email}
                          onChange={(event) => handleChange("email", event.target.value)}
                        />
                      </td>
                      <td className={styles.inlineRowCell}>
                        <div className={styles.badges}>
                          <span className={member.authUserId ? styles.badge : `${styles.badge} ${styles.warningBadge}`}>
                            {member.authUserId ? "연결됨" : "미연결"}
                          </span>
                        </div>
                        {member.authUserId ? <div className={styles.smallText}>{member.authUserId}</div> : null}
                      </td>
                      <td className={styles.inlineRowCell}>
                        {member.queueReasons.length > 0 ? (
                          <div className={styles.queueList}>
                            {member.queueReasons.map((reason) => (
                              <span key={reason} className={styles.queueItem}>
                                {QUEUE_REASON_LABEL[reason] ?? reason}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div className={styles.badges}>
                            <span className={styles.badge}>정상</span>
                          </div>
                        )}
                      </td>
                      <td className={styles.inlineRowCell}>
                        <select aria-label="권한 수정" value={draft.role} onChange={(event) => handleChange("role", event.target.value as MemberAdminPayload["role"]) }>
                          <option value="user">사용자</option>
                          <option value="admin">관리자</option>
                        </select>
                      </td>
                      <td className={styles.inlineRowCell}>
                        <select
                          aria-label="활성 수정"
                          value={draft.userActive ? "1" : "0"}
                          onChange={(event) => {
                            const nextActive = event.target.value === "1";
                            handleChange("userActive", nextActive);
                            handleChange("isActive", nextActive);
                          }}
                        >
                          <option value="1">활성</option>
                          <option value="0">비활성</option>
                        </select>
                      </td>
                      <td className={styles.inlineRowActions}>
                        <div className={styles.actions}>
                          <button type="button" onClick={() => void saveDraft()} disabled={saveMutation.isPending}>
                            저장
                          </button>
                          <button type="button" onClick={cancelDraft}>
                            취소
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={member.id}>
                      <td>{member.legacyUserId}</td>
                      <td>{member.name}</td>
                      <td>{member.email}</td>
                      <td>
                        <div className={styles.badges}>
                          <span className={member.authUserId ? styles.badge : `${styles.badge} ${styles.warningBadge}`}>
                            {member.authUserId ? "연결됨" : "미연결"}
                          </span>
                        </div>
                        {member.authUserId ? <div className={styles.helperText}>{member.authUserId}</div> : null}
                      </td>
                      <td>
                        {member.queueReasons.length > 0 ? (
                          <div className={styles.queueList}>
                            {member.queueReasons.map((reason) => (
                              <span key={reason} className={styles.queueItem}>
                                {QUEUE_REASON_LABEL[reason] ?? reason}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div className={styles.badges}>
                            <span className={styles.badge}>정상</span>
                          </div>
                        )}
                      </td>
                      <td>{member.role === "admin" ? "관리자" : "사용자"}</td>
                      <td>{member.userActive ? "활성" : "비활성"}</td>
                      <td className={styles.inlineRowActions}>
                        <div className={styles.actions}>
                          <button type="button" className={styles.secondaryButton} onClick={() => void handleResetPassword(member)} disabled={resetPasswordMutation.isPending}>
                            PW 초기화
                          </button>
                          <button type="button" onClick={() => startEdit(member)}>
                            수정
                          </button>
                          <button type="button" onClick={() => void handleDelete(member)} disabled={deleteMutation.isPending}>
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
