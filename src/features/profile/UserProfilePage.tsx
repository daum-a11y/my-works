import { useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import '../../styles/domain/pages/password-settings-page.scss';

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
    <section
      className="password-settings-page password-settings-page--page"
      aria-labelledby="profile-title"
    >
      <header className="password-settings-page__hero">
        <h1 id="profile-title" className="password-settings-page__page-title">
          프로필
        </h1>
      </header>

      <div className="password-settings-page__workspace">
        <section className="password-settings-page__panel" aria-labelledby="profile-summary-title">
          <div className="password-settings-page__panel-header">
            <h2 id="profile-summary-title" className="password-settings-page__panel-title">
              계정
            </h2>
            {!editing ? (
              <button
                ref={editButtonRef}
                type="button"
                className="password-settings-page__button password-settings-page__button--primary"
                onClick={handleEdit}
              >
                비밀번호 변경
              </button>
            ) : null}
          </div>

          <dl className="password-settings-page__profile-list">
            <div className="password-settings-page__profile-row">
              <dt>ID</dt>
              <dd>{member?.accountId ?? '-'}</dd>
            </div>
            <div className="password-settings-page__profile-row">
              <dt>이름</dt>
              <dd>{member?.name ?? '-'}</dd>
            </div>
            <div className="password-settings-page__profile-row">
              <dt>이메일</dt>
              <dd>{member?.email ?? '-'}</dd>
            </div>
            <div className="password-settings-page__profile-row">
              <dt>권한</dt>
              <dd>{getRoleLabel(member?.role)}</dd>
            </div>
          </dl>
        </section>
      </div>

      {editing ? (
        <div
          className="password-settings-page__modal-scrim"
          onClick={step === 'form' && !isSubmitting ? handleCancel : undefined}
        >
          <section
            className="password-settings-page__modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="password-change-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="password-settings-page__panel-header">
              <h2 id="password-change-title" className="password-settings-page__panel-title">
                비밀번호 변경
              </h2>
            </div>

            {step === 'form' ? (
              <form
                className="password-settings-page__form"
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleChange();
                }}
              >
                <label className="password-settings-page__field">
                  <span className="password-settings-page__label">새 비밀번호</span>
                  <input
                    ref={nextInputRef}
                    className="password-settings-page__input"
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
                    className="password-settings-page__field-message"
                    data-state={errors.next ? 'danger' : 'empty'}
                  >
                    {errors.next || ' '}
                  </span>
                </label>

                <label className="password-settings-page__field">
                  <span className="password-settings-page__label">새 비밀번호 확인</span>
                  <input
                    className="password-settings-page__input"
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
                    className="password-settings-page__field-message"
                    data-state={errors.confirm ? 'danger' : 'empty'}
                  >
                    {errors.confirm || ' '}
                  </span>
                </label>

                <div className="password-settings-page__form-footer">
                  <div className="password-settings-page__message" aria-live="polite">
                    {submitError ? <p data-state="danger">{submitError}</p> : null}
                  </div>
                  <div className="password-settings-page__actions">
                    <button
                      type="submit"
                      className="password-settings-page__button password-settings-page__button--primary"
                      disabled={!canSubmit}
                    >
                      변경
                    </button>
                    <button
                      type="button"
                      className="password-settings-page__button password-settings-page__button--secondary"
                      onClick={handleCancel}
                      disabled={isSubmitting}
                    >
                      취소
                    </button>
                  </div>
                </div>
              </form>
            ) : step === 'confirm' ? (
              <div className="password-settings-page__state-group password-settings-page__state-group--confirm">
                <div className="password-settings-page__state-block" data-state="confirm">
                  <p className="password-settings-page__message-heading">
                    비밀번호를 정말 변경하시겠습니까? 되돌릴 수 없습니다.
                  </p>
                </div>
                <div className="password-settings-page__actions">
                  <button
                    type="button"
                    className="password-settings-page__button password-settings-page__button--primary"
                    onClick={() => void handleConfirmChange()}
                    disabled={isSubmitting}
                  >
                    변경
                  </button>
                  <button
                    type="button"
                    className="password-settings-page__button password-settings-page__button--secondary"
                    onClick={() => setStep('form')}
                    disabled={isSubmitting}
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <div className="password-settings-page__state-group password-settings-page__state-group--done">
                <div className="password-settings-page__state-block" data-state="done">
                  <p className="password-settings-page__message-heading">
                    비밀번호가 변경되었습니다.
                  </p>
                </div>
                <div className="password-settings-page__actions">
                  <button
                    type="button"
                    className="password-settings-page__button password-settings-page__button--primary"
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
