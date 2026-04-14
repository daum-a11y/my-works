import type { UseFormHandleSubmit, UseFormRegister } from 'react-hook-form';
import { AuthLayoutShell, getAuthFeedbackClassName } from '../../components/layout/AuthLayoutShell';
import { Button } from '../../components/base/Button';
import { InputField } from '../../components/base/Field';

interface RecoveryFormValues {
  nextPassword: string;
  confirmPassword: string;
}

interface PasswordRecoveryFormProps {
  errorMessage: string;
  noticeMessage: string;
  isSubmitting: boolean;
  errors: {
    nextPassword?: { message?: string };
    confirmPassword?: { message?: string };
  };
  register: UseFormRegister<RecoveryFormValues>;
  handleSubmit: UseFormHandleSubmit<RecoveryFormValues>;
  onSubmit: (values: RecoveryFormValues) => Promise<void>;
}

export function PasswordRecoveryForm({
  errorMessage,
  noticeMessage,
  isSubmitting,
  errors,
  register,
  handleSubmit,
  onSubmit,
}: PasswordRecoveryFormProps) {
  return (
    <AuthLayoutShell
      caption="비밀번호 재설정"
      labelledBy="recovery-title"
      description="새 비밀번호를 입력하면 현재 계정의 비밀번호가 즉시 변경됩니다."
      body={
        <form onSubmit={handleSubmit(onSubmit)} className="auth-layout-shell__form">
          <InputField
            label="새 비밀번호"
            type="password"
            autoComplete="new-password"
            errorMessage={errors.nextPassword?.message}
            disabled={isSubmitting}
            {...register('nextPassword')}
          />
          <InputField
            label="새 비밀번호 확인"
            type="password"
            autoComplete="new-password"
            errorMessage={errors.confirmPassword?.message}
            disabled={isSubmitting}
            {...register('confirmPassword')}
          />
          {noticeMessage ? (
            <p role="status" className={getAuthFeedbackClassName('success')}>
              {noticeMessage}
            </p>
          ) : null}
          {errorMessage ? (
            <p role="alert" className={getAuthFeedbackClassName('danger')}>
              {errorMessage}
            </p>
          ) : null}
          <div className="auth-layout-shell__actions">
            <Button type="submit" isDisabled={isSubmitting}>
              비밀번호 변경
            </Button>
          </div>
        </form>
      }
    />
  );
}
