import { useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import styles from './PasswordSettingsPage.module.css';

type PasswordDraft = {
  next: string;
  confirm: string;
};

type PasswordErrors = {
  next: string;
  confirm: string;
};

type PasswordStep = 'form' | 'confirm' | 'done';

function getRoleLabel(role?: string) {
  return role === 'admin' ? '관리자' : '구성원';
}

function getPasswordErrors(draft: PasswordDraft): PasswordErrors {
  let next = '';
  let confirm = '';

  if (draft.next && draft.next.trim().length < 8) {
    next = '8자 이상 입력해 주세요.';
  }

  if (draft.confirm && draft.next !== draft.confirm) {
    confirm = '비밀번호가 다릅니다.';
  }

  return { next, confirm };
}

export function UserProfilePage() {
  const navigate = useNavigate();
  const { session, updatePassword, logout } = useAuth();
  const member = session?.member;
  const [editing, setEditing] = useState(false);
  const [step, setStep] = useState<PasswordStep>('form');
  const [draft, setDraft] = useState<PasswordDraft>({ next: '', confirm: '' });
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nextInputRef = useRef<HTMLInputElement | null>(null);
  const editButtonRef = useRef<HTMLButtonElement | null>(null);
  const nextHintId = useId();
  const confirmHintId = useId();

  const errors = getPasswordErrors(draft);
  const canSubmit =
    draft.next.trim().length >= 8 &&
    draft.confirm.trim().length > 0 &&
    draft.next === draft.confirm &&
    !isSubmitting;

  useEffect(() => {
    document.title = '프로필 | My Works';
  }, []);

  useEffect(() => {
    if (editing) {
      if (step === 'form') {
        nextInputRef.current?.focus();
      }
      return;
    }

    editButtonRef.current?.focus();
  }, [editing, step]);

  useEffect(() => {
    if (!editing || step !== 'form' || isSubmitting) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setEditing(false);
        setDraft({ next: '', confirm: '' });
        setSubmitError('');
        setStep('form');
        setIsSubmitting(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editing, isSubmitting, step]);

  const resetDraft = () => {
    setDraft({ next: '', confirm: '' });
    setSubmitError('');
    setStep('form');
    setIsSubmitting(false);
  };

  const handleEdit = () => {
    setSubmitError('');
    setStep('form');
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    resetDraft();
  };

  const handleChange = async () => {
    if (!canSubmit) {
      if (!draft.next.trim()) {
        setSubmitError('새 비밀번호를 입력해 주세요.');
        return;
      }

      if (draft.next.trim().length < 8) {
        setSubmitError('8자 이상 입력해 주세요.');
        return;
      }

      if (!draft.confirm.trim()) {
        setSubmitError('비밀번호 확인을 입력해 주세요.');
        return;
      }

      setSubmitError('비밀번호가 다릅니다.');
      return;
    }

    setSubmitError('');
    setStep('confirm');
  };

  const handleConfirmChange = async () => {
    try {
      setIsSubmitting(true);
      setSubmitError('');
      await updatePassword(draft.next);
      setStep('done');
      setIsSubmitting(false);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : '비밀번호 변경에 실패했습니다. 다시 시도해 주세요.',
      );
      setIsSubmitting(false);
      setStep('form');
    }
  };

  const handleMoveToLogin = async () => {
    await logout();
    navigate('/login', {
      replace: true,
      state: {
        noticeMessage: '비밀번호가 변경되었습니다. 로그인해 주세요.',
        emailPrefill: member?.email ?? '',
      },
    });
  };

  return (
    <section className={styles.page} aria-labelledby="profile-title">
      <header className={styles.hero}>
        <h1 id="profile-title" className={styles.pageTitle}>
          프로필
        </h1>
      </header>

      <div className={styles.workspace}>
        <section className={styles.panel} aria-labelledby="profile-summary-title">
          <div className={styles.panelHeader}>
            <h2 id="profile-summary-title" className={styles.panelTitle}>
              계정
            </h2>
            {!editing ? (
              <button
                ref={editButtonRef}
                type="button"
                className={styles.primaryButton}
                onClick={handleEdit}
              >
                비밀번호 변경
              </button>
            ) : null}
          </div>

          <dl className={styles.profileList}>
            <div className={styles.profileRow}>
              <dt>ID</dt>
              <dd>{member?.accountId ?? '-'}</dd>
            </div>
            <div className={styles.profileRow}>
              <dt>이름</dt>
              <dd>{member?.name ?? '-'}</dd>
            </div>
            <div className={styles.profileRow}>
              <dt>이메일</dt>
              <dd>{member?.email ?? '-'}</dd>
            </div>
            <div className={styles.profileRow}>
              <dt>권한</dt>
              <dd>{getRoleLabel(member?.role)}</dd>
            </div>
          </dl>
        </section>
      </div>

      {editing ? (
        <div
          className={styles.modalScrim}
          onClick={step === 'form' && !isSubmitting ? handleCancel : undefined}
        >
          <section
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="password-change-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.panelHeader}>
              <h2 id="password-change-title" className={styles.panelTitle}>
                비밀번호 변경
              </h2>
            </div>

            {step === 'form' ? (
              <form
                className={styles.form}
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleChange();
                }}
              >
                <label className={styles.field}>
                  <span className={styles.label}>새 비밀번호</span>
                  <input
                    ref={nextInputRef}
                    className={styles.input}
                    type="password"
                    autoComplete="new-password"
                    aria-label="새 비밀번호"
                    aria-invalid={errors.next ? 'true' : 'false'}
                    aria-describedby={errors.next ? nextHintId : undefined}
                    value={draft.next}
                    onChange={(event) => {
                      setSubmitError('');
                      setDraft((current) => ({ ...current, next: event.target.value }));
                    }}
                  />
                  <span
                    id={nextHintId}
                    className={styles.fieldMessage}
                    data-state={errors.next ? 'danger' : 'empty'}
                  >
                    {errors.next || ' '}
                  </span>
                </label>

                <label className={styles.field}>
                  <span className={styles.label}>새 비밀번호 확인</span>
                  <input
                    className={styles.input}
                    type="password"
                    autoComplete="new-password"
                    aria-label="새 비밀번호 확인"
                    aria-invalid={errors.confirm ? 'true' : 'false'}
                    aria-describedby={errors.confirm ? confirmHintId : undefined}
                    value={draft.confirm}
                    onChange={(event) => {
                      setSubmitError('');
                      setDraft((current) => ({ ...current, confirm: event.target.value }));
                    }}
                  />
                  <span
                    id={confirmHintId}
                    className={styles.fieldMessage}
                    data-state={errors.confirm ? 'danger' : 'empty'}
                  >
                    {errors.confirm || ' '}
                  </span>
                </label>

                <div className={styles.formFooter}>
                  <div className={styles.message} aria-live="polite">
                    {submitError ? <p data-state="danger">{submitError}</p> : null}
                  </div>
                  <div className={styles.actions}>
                    <button type="submit" className={styles.primaryButton} disabled={!canSubmit}>
                      변경
                    </button>
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={handleCancel}
                      disabled={isSubmitting}
                    >
                      취소
                    </button>
                  </div>
                </div>
              </form>
            ) : step === 'confirm' ? (
              <div className={styles.confirmState}>
                <div className={styles.stateBlock} data-state="confirm">
                  <p className={styles.confirmMessage}>
                    비밀번호를 정말 변경하시겠습니까? 되돌릴 수 없습니다.
                  </p>
                </div>
                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={() => void handleConfirmChange()}
                    disabled={isSubmitting}
                  >
                    변경
                  </button>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => setStep('form')}
                    disabled={isSubmitting}
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.doneState}>
                <div className={styles.stateBlock} data-state="done">
                  <p className={styles.doneMessage}>비밀번호가 변경되었습니다.</p>
                </div>
                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={() => void handleMoveToLogin()}
                  >
                    로그인
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      ) : null}
    </section>
  );
}
