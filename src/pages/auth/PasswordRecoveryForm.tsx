import { Controller, type Control, type UseFormHandleSubmit } from 'react-hook-form';
import { Button, CriticalAlert, TextInput } from 'krds-react';
import { AuthPageLayout } from '../../components/layout/AuthPageLayout';

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
  control: Control<RecoveryFormValues>;
  handleSubmit: UseFormHandleSubmit<RecoveryFormValues>;
  onSubmit: (values: RecoveryFormValues) => Promise<void>;
}

export function PasswordRecoveryForm({
  errorMessage,
  noticeMessage,
  isSubmitting,
  errors,
  control,
  handleSubmit,
  onSubmit,
}: PasswordRecoveryFormProps) {
  return (
    <AuthPageLayout
      caption="비밀번호 재설정"
      labelledBy="recovery-title"
      description="새 비밀번호를 입력하면 현재 계정의 비밀번호가 즉시 변경됩니다."
      body={
        <form onSubmit={handleSubmit(onSubmit)} className="krds-auth-shell__form">
          <Controller
            name="nextPassword"
            control={control}
            render={({ field }) => (
              <TextInput
                {...field}
                label="새 비밀번호"
                type="password"
                autoComplete="new-password"
                error={errors.nextPassword?.message}
                disabled={isSubmitting}
                size="medium"
              />
            )}
          />
          <Controller
            name="confirmPassword"
            control={control}
            render={({ field }) => (
              <TextInput
                {...field}
                label="새 비밀번호 확인"
                type="password"
                autoComplete="new-password"
                error={errors.confirmPassword?.message}
                disabled={isSubmitting}
                size="medium"
              />
            )}
          />
          {noticeMessage ? (
            <CriticalAlert alerts={[{ variant: 'ok', message: noticeMessage }]} />
          ) : null}
          {errorMessage ? (
            <CriticalAlert alerts={[{ variant: 'danger', message: errorMessage }]} />
          ) : null}
          <div className="krds-auth-shell__actions">
            <Button size="medium" type="submit" variant="primary" disabled={isSubmitting}>
              비밀번호 변경
            </Button>
          </div>
        </form>
      }
    />
  );
}
