import { formatDateLabel } from "../../../lib/utils";
import type { MemberAdminItem, MemberAdminPayload } from "../admin-types";
import styles from "./AdminMembersPage.module.css";

type Mode = "view" | "create" | "edit";

type AdminMemberRowProps = {
  mode: Mode;
  member?: MemberAdminItem;
  draft?: MemberAdminPayload | null;
  onDraftChange?: <K extends keyof MemberAdminPayload>(key: K, value: MemberAdminPayload[K]) => void;
  onStartEdit?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
  onDelete?: () => void;
  onInvite?: () => void;
  isSaving?: boolean;
  isDeleting?: boolean;
  isInviting?: boolean;
};

function getRoleLabel(role: MemberAdminPayload["role"]) {
  return role === "admin" ? "관리자" : "일반";
}

function getActiveLabel(active: boolean) {
  return active ? "활성" : "비활성";
}

function formatMemberDate(value: string) {
  if (!value) {
    return "-";
  }

  return formatDateLabel(value.slice(0, 10));
}

function updateActiveState(
  onDraftChange: AdminMemberRowProps["onDraftChange"],
  nextActive: boolean,
) {
  onDraftChange?.("userActive", nextActive);
  onDraftChange?.("isActive", nextActive);
}

export function AdminMemberRow({
  mode,
  member,
  draft,
  onDraftChange,
  onStartEdit,
  onSave,
  onCancel,
  onDelete,
  onInvite,
  isSaving,
  isDeleting,
  isInviting,
}: AdminMemberRowProps) {
  if (mode === "view") {
    if (!member) {
      return null;
    }

    return (
      <tr>
        <td>{member.legacyUserId}</td>
        <td>{member.name}</td>
        <td>{member.email || "-"}</td>
        <td>{getRoleLabel(member.role)}</td>
        <td>{getActiveLabel(member.userActive)}</td>
        <td>{formatMemberDate(member.joinedAt)}</td>
        <td>{formatMemberDate(member.lastLoginAt)}</td>
        <td>
          <div className={styles.buttonRow}>
            <button type="button" className={styles.secondaryButton} onClick={onInvite} disabled={isInviting}>
              초대 메일
            </button>
            <button type="button" className={styles.secondaryButton} onClick={onStartEdit}>
              수정
            </button>
            <button type="button" className={styles.dangerButton} onClick={onDelete} disabled={isDeleting}>
              삭제
            </button>
          </div>
        </td>
      </tr>
    );
  }

  if (!draft) {
    return null;
  }

  return (
    <tr className={styles.editingRow}>
      <td className={styles.cell}>
        {mode === "create" ? (
          <input
            aria-label="ID"
            autoFocus
            className={styles.input}
            type="text"
            value={draft.legacyUserId}
            onChange={(event) => onDraftChange?.("legacyUserId", event.target.value)}
          />
        ) : (
          <input
            aria-label="ID 수정"
            autoFocus
            className={styles.input}
            type="text"
            value={draft.legacyUserId}
            onChange={(event) => onDraftChange?.("legacyUserId", event.target.value)}
          />
        )}
      </td>
      <td className={styles.cell}>
        <input
          aria-label={mode === "create" ? "이름" : "이름 수정"}
          className={styles.input}
          type="text"
          value={draft.name}
          onChange={(event) => onDraftChange?.("name", event.target.value)}
        />
      </td>
      <td className={styles.cell}>
        <input
          aria-label={mode === "create" ? "이메일" : "이메일 수정"}
          className={styles.input}
          type="email"
          value={draft.email}
          onChange={(event) => onDraftChange?.("email", event.target.value)}
        />
      </td>
      <td className={styles.cell}>
        <select
          aria-label={mode === "create" ? "권한" : "권한 수정"}
          className={styles.select}
          value={draft.role}
          onChange={(event) => onDraftChange?.("role", event.target.value as MemberAdminPayload["role"])}
        >
          <option value="user">팀원</option>
          <option value="admin">관리자</option>
        </select>
      </td>
      <td className={styles.cell}>
        {mode === "create" ? (
          "활성"
        ) : (
          <select
            aria-label="상태 수정"
            className={styles.select}
            value={draft.userActive ? "1" : "0"}
            onChange={(event) => updateActiveState(onDraftChange, event.target.value === "1")}
          >
            <option value="1">활성</option>
            <option value="0">비활성</option>
          </select>
        )}
      </td>
      <td>{mode === "edit" && member ? formatMemberDate(member.joinedAt) : "-"}</td>
      <td>{mode === "edit" && member ? formatMemberDate(member.lastLoginAt) : "-"}</td>
      <td>
        <div className={styles.buttonRow}>
          <button type="button" className={styles.primaryButton} onClick={onSave} disabled={isSaving}>
            {mode === "create" ? "저장 및 초대" : "변경"}
          </button>
          <button type="button" className={styles.secondaryButton} onClick={onCancel}>
            취소
          </button>
        </div>
      </td>
    </tr>
  );
}
