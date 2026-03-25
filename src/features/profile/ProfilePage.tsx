import { useMemo, useState, type FormEvent } from "react";
import { Button } from "../../components/ui/Button";
import { PageSection } from "../../components/ui/PageSection";
import { useAuth } from "../auth/AuthContext";
import styles from "./ProfilePage.module.css";

interface PasswordDraft {
  currentPassword: string;
  nextPassword: string;
  confirmPassword: string;
}

function createEmptyDraft(): PasswordDraft {
  return {
    currentPassword: "",
    nextPassword: "",
    confirmPassword: "",
  };
}

export function ProfilePage() {
  const { session, logout, updatePassword } = useAuth();
  const [editingPassword, setEditingPassword] = useState(false);
  const [draft, setDraft] = useState<PasswordDraft>(createEmptyDraft);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "danger">("success");
  const member = session?.member ?? null;

  const identityRows = useMemo(
    () => [
      { label: "ID", value: member?.legacyUserId ?? "-" },
      { label: "이름", value: member?.name ?? "-" },
      { label: "이메일", value: member?.email ?? "-" },
    ],
    [member?.email, member?.legacyUserId, member?.name],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!draft.currentPassword.trim()) {
      setMessageTone("danger");
      setMessage("현재 비밀번호를 입력해 주세요.");
      return;
    }

    if (draft.nextPassword.trim().length < 8) {
      setMessageTone("danger");
      setMessage("새 비밀번호는 8자 이상이어야 합니다.");
      return;
    }

    if (draft.nextPassword !== draft.confirmPassword) {
      setMessageTone("danger");
      setMessage("새 비밀번호와 확인 값이 일치하지 않습니다.");
      return;
    }

    try {
      await updatePassword(draft.nextPassword);
      setMessageTone("success");
      setMessage("비밀번호를 변경했습니다. 다시 로그인해 주세요.");
      setDraft(createEmptyDraft());
      setEditingPassword(false);
      await logout();
    } catch (error) {
      setMessageTone("danger");
      setMessage(error instanceof Error ? error.message : "비밀번호를 변경하지 못했습니다.");
    }
  };

  return (
    <div className={styles.page}>
      <PageSection title="프로필" description="사용자 기본 정보와 비밀번호 변경 기능을 한 화면에서 제공합니다.">
        <div className={styles.identityGrid}>
          {identityRows.map((row) => (
            <div key={row.label} className={styles.identityCard}>
              <span>{row.label}</span>
              <strong>{row.value}</strong>
            </div>
          ))}
        </div>

        <div className={styles.toolbar}>
          <div>
            <strong>비밀번호 변경</strong>
            <p>원본 흐름에 맞춰 동일 화면에서 변경을 처리합니다.</p>
          </div>
          <div className={styles.actions}>
            {editingPassword ? (
              <Button
                type="button"
                tone="ghost"
                onClick={() => {
                  setEditingPassword(false);
                  setDraft(createEmptyDraft());
                  setMessage("");
                }}
              >
                취소
              </Button>
            ) : null}
            <Button type="button" onClick={() => setEditingPassword((current) => !current)}>
              {editingPassword ? "닫기" : "비밀번호 변경"}
            </Button>
          </div>
        </div>

        {editingPassword ? (
          <form className={styles.form} onSubmit={handleSubmit}>
            <label className={styles.field}>
              <span>현재 비밀번호</span>
              <input
                type="password"
                autoComplete="current-password"
                value={draft.currentPassword}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, currentPassword: event.target.value }))
                }
              />
            </label>
            <label className={styles.field}>
              <span>새 비밀번호</span>
              <input
                type="password"
                autoComplete="new-password"
                value={draft.nextPassword}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, nextPassword: event.target.value }))
                }
              />
            </label>
            <label className={styles.field}>
              <span>비밀번호 확인</span>
              <input
                type="password"
                autoComplete="new-password"
                value={draft.confirmPassword}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, confirmPassword: event.target.value }))
                }
              />
            </label>
            <div className={styles.actions}>
              <Button type="submit">확인</Button>
            </div>
          </form>
        ) : null}

        {message ? (
          <p className={styles.message} data-state={messageTone} role={messageTone === "success" ? "status" : "alert"}>
            {message}
          </p>
        ) : null}
      </PageSection>
    </div>
  );
}
