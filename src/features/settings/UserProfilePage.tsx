import { useEffect, useRef, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import styles from "./PasswordSettingsPage.module.css";

type PasswordDraft = {
  next: string;
  confirm: string;
};

export function UserProfilePage() {
  const { session, updatePassword, logout } = useAuth();
  const member = session?.member;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<PasswordDraft>({
    next: "",
    confirm: "",
  });
  const nextInputRef = useRef<HTMLInputElement | null>(null);
  const editButtonRef = useRef<HTMLButtonElement | null>(null);

  const validPw = draft.next.length > 0 && draft.next === draft.confirm;

  useEffect(() => {
    document.title = "프로필 | My Works";
  }, []);

  useEffect(() => {
    if (editing) {
      nextInputRef.current?.focus();
      return;
    }

    editButtonRef.current?.focus();
  }, [editing]);

  const handleEdit = () => {
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    setDraft({
      next: "",
      confirm: "",
    });
  };

  const handleChange = async () => {
    if (!validPw) {
      return;
    }

    const confirmed = window.confirm("비밀번호를 정말 변경하시겠습니까? 되돌릴 수 없습니다.");
    if (!confirmed) {
      return;
    }

    try {
      await updatePassword(draft.next);
      window.alert("비밀번호가 변경되었습니다. 다시 로그인해주세요");
      await logout();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "서버 저장 실패. 다시 시도해주세요.");
    }
  };

  return (
    <div className={styles.page}>
      <section className={styles.summaryCard}>
        <h2 className={styles.title}>프로필</h2>

        <table className={styles.profileTable}>
          <caption className="srOnly">계정 정보</caption>
          <tbody>
            <tr>
              <th scope="row">ID</th>
              <td>{member?.legacyUserId ?? "-"}</td>
            </tr>
            <tr>
              <th scope="row">이름</th>
              <td>{member?.name ?? "-"}</td>
            </tr>
          </tbody>
        </table>

        {!editing ? (
          <div className={styles.summaryActions}>
            <button ref={editButtonRef} type="button" className={styles.editButton} onClick={handleEdit}>
              비밀번호 변경
            </button>
          </div>
        ) : null}
      </section>

      {editing ? (
        <section className={styles.formSection} aria-label="비밀번호 변경">
          <div className={styles.formGroup}>
            <h3 className={styles.formTitle}>비밀번호 변경</h3>
          <form
            className={styles.form}
            onSubmit={(event) => {
              event.preventDefault();
              void handleChange();
            }}
          >
            <label className={styles.field}>
              <span className={styles.label}>변경할 비밀번호</span>
              <input
                ref={nextInputRef}
                className={styles.input}
                type="password"
                autoComplete="new-password"
                value={draft.next}
                onChange={(event) => setDraft((current) => ({ ...current, next: event.target.value }))}
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>비밀번호 재확인</span>
              <input
                className={styles.input}
                type="password"
                autoComplete="new-password"
                value={draft.confirm}
                onChange={(event) => setDraft((current) => ({ ...current, confirm: event.target.value }))}
              />
            </label>

            <div className={styles.message} aria-live="assertive">
              {draft.next || draft.confirm ? (
                validPw ? (
                  <p data-state="success">입력된 두 값이 동일합니다.</p>
                ) : (
                  <p data-state="danger">입력된 두 값이 서로 다릅니다.</p>
                )
              ) : null}
            </div>

            <div className={styles.actions}>
              <button type="submit" className={styles.primaryButton} disabled={!validPw}>
                변경
              </button>
              <button type="button" className={styles.secondaryButton} onClick={handleCancel}>
                취소
              </button>
            </div>
          </form>
          </div>
        </section>
      ) : null}
    </div>
  );
}
