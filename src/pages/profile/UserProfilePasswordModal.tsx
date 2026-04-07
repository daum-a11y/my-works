type PasswordDraft = {
  next: string;
  confirm: string;
};

type PasswordErrors = {
  next: string;
  confirm: string;
};

type PasswordStep = 'form' | 'confirm' | 'done';

interface UserProfilePasswordModalProps {
  editing: boolean;
  step: PasswordStep;
  draft: PasswordDraft;
  errors: PasswordErrors;
  submitError: string;
  isSubmitting: boolean;
  canSubmit: boolean;
  nextInputRef: React.RefObject<HTMLInputElement | null>;
  nextHintId: string;
  confirmHintId: string;
  onDraftChange: (patch: Partial<PasswordDraft>) => void;
  onSubmit: () => void;
  onCancel: () => void;
  onConfirm: () => void;
  onBackToForm: () => void;
  onMoveToLogin: () => void;
}

export function UserProfilePasswordModal({
  editing,
  step,
  draft,
  errors,
  submitError,
  isSubmitting,
  canSubmit,
  nextInputRef,
  nextHintId,
  confirmHintId,
  onDraftChange,
  onSubmit,
  onCancel,
  onConfirm,
  onBackToForm,
  onMoveToLogin,
}: UserProfilePasswordModalProps) {
  if (!editing) {
    return null;
  }

  return (
    <div
      className="password-settings-page__modal-scrim"
      onClick={step === 'form' && !isSubmitting ? onCancel : undefined}
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
              onSubmit();
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
                onChange={(event) => onDraftChange({ next: event.target.value })}
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
                onChange={(event) => onDraftChange({ confirm: event.target.value })}
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
                  onClick={onCancel}
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
                onClick={onConfirm}
                disabled={isSubmitting}
              >
                변경
              </button>
              <button
                type="button"
                className="password-settings-page__button password-settings-page__button--secondary"
                onClick={onBackToForm}
                disabled={isSubmitting}
              >
                취소
              </button>
            </div>
          </div>
        ) : (
          <div className="password-settings-page__state-group password-settings-page__state-group--done">
            <div className="password-settings-page__state-block" data-state="done">
              <p className="password-settings-page__message-heading">비밀번호가 변경되었습니다.</p>
            </div>
            <div className="password-settings-page__actions">
              <button
                type="button"
                className="password-settings-page__button password-settings-page__button--primary"
                onClick={onMoveToLogin}
              >
                로그인
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
