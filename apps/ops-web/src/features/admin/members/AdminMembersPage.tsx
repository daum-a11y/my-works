import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminDataClient } from "../admin-client";
import styles from "../AdminPage.module.css";
import type { MemberAdminItem, MemberAdminPayload } from "../admin-types";

const QUEUE_LABELS: Record<string, string> = {
  auth_unlinked: "Auth 미연결",
  email_mismatch: "이메일 불일치",
  role_invalid: "권한값 점검 필요",
  inactive_candidate: "비활성 사용자",
};

function createDraft(member?: MemberAdminItem): MemberAdminPayload {
  if (!member) {
    return {
      legacyUserId: "",
      name: "",
      email: "",
      department: "",
      role: "user",
      isActive: true,
      authUserId: null,
    };
  }

  return {
    id: member.id,
    legacyUserId: member.legacyUserId,
    name: member.name,
    email: member.email,
    department: member.department,
    role: member.role,
    isActive: member.isActive,
    authUserId: member.authUserId,
  };
}

export function AdminMembersPage() {
  const queryClient = useQueryClient();
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [draft, setDraft] = useState<MemberAdminPayload>(() => createDraft());

  const membersQuery = useQuery({
    queryKey: ["admin", "members"],
    queryFn: () => adminDataClient.listMembersAdmin(),
  });

  const saveMutation = useMutation({
    mutationFn: (payload: MemberAdminPayload) => adminDataClient.saveMemberAdmin(payload),
    onSuccess: (saved) => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "members"] });
      setSelectedMemberId(saved.id);
      setDraft(createDraft(saved));
    },
  });

  const members = membersQuery.data ?? [];
  const selectedMember = useMemo(
    () => members.find((member) => member.id === selectedMemberId) ?? null,
    [members, selectedMemberId],
  );

  useEffect(() => {
    if (!selectedMemberId && members.length > 0) {
      setSelectedMemberId(members[0].id);
    }
  }, [members, selectedMemberId]);

  useEffect(() => {
    if (selectedMember) {
      setDraft(createDraft(selectedMember));
    }
  }, [selectedMember]);

  const queueMembers = useMemo(
    () => members.filter((member) => member.queueReasons.length > 0),
    [members],
  );

  const handleDraftField = <K extends keyof MemberAdminPayload>(key: K, value: MemberAdminPayload[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const handleSave = async () => {
    await saveMutation.mutateAsync(draft);
  };

  const errorMessage =
    (membersQuery.error instanceof Error && membersQuery.error.message) ||
    (saveMutation.error instanceof Error && saveMutation.error.message) ||
    "";

  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <h2>사용자 관리 및 신규 처리 대상</h2>
        <p>
          members 기준으로 사용자 정보를 관리하고, Auth 미연결/이메일 불일치/비활성 사용자 같은 운영 처리 대상을 함께 확인합니다.
        </p>
      </header>

      {errorMessage && <p className={styles.helperText}>{errorMessage}</p>}

      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span>전체 사용자</span>
          <strong>{members.length}</strong>
        </div>
        <div className={styles.summaryCard}>
          <span>처리 대상</span>
          <strong>{queueMembers.length}</strong>
        </div>
        <div className={styles.summaryCard}>
          <span>관리자</span>
          <strong>{members.filter((member) => member.role === "admin").length}</strong>
        </div>
      </div>

      <div className={styles.layout}>
        <div className={styles.stack}>
          <div className={styles.panel}>
            <div className={styles.toolbar}>
              <div>
                <h3>사용자 목록</h3>
                <p className={styles.helperText}>권한, 활성 여부, Auth 연결 상태를 한 번에 봅니다.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedMemberId("");
                  setDraft(createDraft());
                }}
              >
                신규 사용자
              </button>
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>사용자</th>
                    <th>이메일</th>
                    <th>부서</th>
                    <th>권한</th>
                    <th>활성</th>
                    <th>Auth</th>
                  </tr>
                </thead>
                <tbody>
                  {members.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        <div className={styles.emptyState}>조회된 사용자가 없습니다.</div>
                      </td>
                    </tr>
                  ) : (
                    members.map((member) => (
                      <tr key={member.id} className={member.id === selectedMemberId ? styles.selectedRow : undefined}>
                        <td>
                          <button type="button" className={styles.rowButton} onClick={() => setSelectedMemberId(member.id)}>
                            <strong>{member.name}</strong>
                            <span>{member.legacyUserId}</span>
                          </button>
                        </td>
                        <td>{member.email}</td>
                        <td>{member.department || "-"}</td>
                        <td>{member.role === "admin" ? "관리자" : "사용자"}</td>
                        <td>{member.isActive ? "활성" : "비활성"}</td>
                        <td>{member.authUserId ? "연결됨" : "미연결"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className={styles.panel}>
            <div className={styles.toolbar}>
              <div>
                <h3>신규 처리 대상</h3>
                <p className={styles.helperText}>운영자 개입이 필요한 계정을 빠르게 추릴 수 있는 큐입니다.</p>
              </div>
            </div>
            {queueMembers.length === 0 ? (
              <div className={styles.emptyState}>현재 처리 대상이 없습니다.</div>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>사용자</th>
                      <th>처리 사유</th>
                      <th>Auth 이메일</th>
                    </tr>
                  </thead>
                  <tbody>
                    {queueMembers.map((member) => (
                      <tr key={`queue-${member.id}`}>
                        <td>
                          <strong>{member.name}</strong>
                          <div className={styles.muted}>{member.email}</div>
                        </td>
                        <td>
                          <div className={styles.queueList}>
                            {member.queueReasons.map((reason) => (
                              <span key={`${member.id}-${reason}`} className={styles.queueItem}>
                                {QUEUE_LABELS[reason] ?? reason}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>{member.authEmail || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <aside className={styles.panel}>
          <div className={styles.toolbar}>
            <div>
              <h3>{draft.id ? "사용자 상세 수정" : "신규 사용자 등록"}</h3>
              <p className={styles.helperText}>부서/권한/활성 여부를 이 화면에서 관리합니다.</p>
            </div>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label htmlFor="admin-member-legacy-id">레거시 사용자 ID</label>
              <input
                id="admin-member-legacy-id"
                value={draft.legacyUserId}
                onChange={(event) => handleDraftField("legacyUserId", event.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="admin-member-name">이름</label>
              <input
                id="admin-member-name"
                value={draft.name}
                onChange={(event) => handleDraftField("name", event.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="admin-member-email">이메일</label>
              <input
                id="admin-member-email"
                type="email"
                value={draft.email}
                onChange={(event) => handleDraftField("email", event.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="admin-member-department">부서</label>
              <input
                id="admin-member-department"
                value={draft.department}
                onChange={(event) => handleDraftField("department", event.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="admin-member-role">권한</label>
              <select
                id="admin-member-role"
                value={draft.role}
                onChange={(event) => handleDraftField("role", event.target.value as MemberAdminPayload["role"])}
              >
                <option value="user">사용자</option>
                <option value="admin">관리자</option>
              </select>
            </div>
            <div className={`${styles.field} ${styles.checkbox}`}>
              <input
                id="admin-member-active"
                type="checkbox"
                checked={draft.isActive}
                onChange={(event) => handleDraftField("isActive", event.target.checked)}
              />
              <label htmlFor="admin-member-active">활성 사용자</label>
            </div>
          </div>

          <div className={styles.panel}>
            <h4>Auth 연결 정보</h4>
            <div className={styles.metaList}>
              <div>
                <span>Auth User ID</span>
                <strong>{selectedMember?.authUserId || draft.authUserId || "미연결"}</strong>
              </div>
              <div>
                <span>Auth 이메일</span>
                <strong>{selectedMember?.authEmail || "-"}</strong>
              </div>
              <div>
                <span>처리 사유</span>
                <strong>
                  {selectedMember?.queueReasons.length
                    ? selectedMember.queueReasons.map((reason) => QUEUE_LABELS[reason] ?? reason).join(", ")
                    : "없음"}
                </strong>
              </div>
            </div>
          </div>

          <div className={styles.actions}>
            <button type="button" onClick={() => void handleSave()} disabled={saveMutation.isPending}>
              저장
            </button>
          </div>
        </aside>
      </div>
    </section>
  );
}
