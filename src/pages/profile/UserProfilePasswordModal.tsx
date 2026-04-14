import { Button, CriticalAlert, Modal, TextInput } from 'krds-react';

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

  const canClose = step === 'form' && !isSubmitting;

  return (
    <Modal.Root
      open={editing}
      onOpenChange={(open) => {
        if (!open && canClose) {
          onCancel();
        }
      }}
      closeOnEsc={canClose}
      closeOnOverlayClick={canClose}
      size="md"
    >
      <Modal.Content aria-labelledby="password-change-title">
        <Modal.Header title="비밀번호 변경" titleId="password-change-title" />
        <Modal.Body>
          {step === 'form' ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                onSubmit();
              }}
            >
              <TextInput
                ref={nextInputRef}
                label="새 비밀번호"
                type="password"
                autoComplete="new-password"
                value={draft.next}
                onChange={(value) => onDraftChange({ next: value })}
                error={errors.next || undefined}
                size="large"
              />
              <TextInput
                label="새 비밀번호 확인"
                type="password"
                autoComplete="new-password"
                value={draft.confirm}
                onChange={(value) => onDraftChange({ confirm: value })}
                error={errors.confirm || undefined}
                size="large"
              />
              <div aria-live="polite">
                {submitError ? (
                  <CriticalAlert alerts={[{ variant: 'danger', message: submitError }]} />
                ) : null}
              </div>
              <Modal.Footer>
                <Button type="submit" variant="primary" disabled={!canSubmit}>
                  변경
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  취소
                </Button>
              </Modal.Footer>
            </form>
          ) : step === 'confirm' ? (
            <>
              <CriticalAlert
                alerts={[
                  {
                    variant: 'info',
                    message: '비밀번호를 정말 변경하시겠습니까? 되돌릴 수 없습니다.',
                  },
                ]}
              />
              <Modal.Footer>
                <Button type="button" variant="primary" onClick={onConfirm} disabled={isSubmitting}>
                  변경
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onBackToForm}
                  disabled={isSubmitting}
                >
                  취소
                </Button>
              </Modal.Footer>
            </>
          ) : (
            <>
              <CriticalAlert
                alerts={[{ variant: 'ok', message: '비밀번호가 변경되었습니다.' }]}
              />
              <Modal.Footer>
                <Button type="button" variant="primary" onClick={onMoveToLogin}>
                  로그인
                </Button>
              </Modal.Footer>
            </>
          )}
        </Modal.Body>
      </Modal.Content>
    </Modal.Root>
  );
}
