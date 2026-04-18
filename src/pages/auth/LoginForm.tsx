import { Controller, type Control, type UseFormHandleSubmit } from 'react-hook-form';
import { Button, CriticalAlert, TextInput } from 'krds-react';

interface LoginFormValues {
  email: string;
  password: string;
}

interface LoginFormProps {
  errorMessage: string;
  noticeMessage: string;
  isBusy: boolean;
  isSupabaseConfigured: boolean;
  errors: {
    email?: { message?: string };
    password?: { message?: string };
  };
  control: Control<LoginFormValues>;
  handleSubmit: UseFormHandleSubmit<LoginFormValues>;
  onSubmit: (values: LoginFormValues) => Promise<void>;
  onRecovery: () => void;
}

export function LoginForm({
  errorMessage,
  noticeMessage,
  isBusy,
  isSupabaseConfigured,
  errors,
  control,
  handleSubmit,
  onSubmit,
  onRecovery,
}: LoginFormProps) {
  return (
    <div className="login-form">
      <form className="login-form-shell" onSubmit={handleSubmit(onSubmit)}>
        <Controller
          name="email"
          control={control}
          render={({ field }) => (
            <TextInput
              {...field}
              label="이메일"
              type="email"
              autoComplete="username"
              error={errors.email?.message}
              disabled={!isSupabaseConfigured || isBusy}
              size="medium"
            />
          )}
        />
        <Controller
          name="password"
          control={control}
          render={({ field }) => (
            <TextInput
              {...field}
              label="비밀번호"
              type="password"
              autoComplete="current-password"
              error={errors.password?.message}
              disabled={!isSupabaseConfigured || isBusy}
              size="medium"
            />
          )}
        />
        {noticeMessage ? (
          <CriticalAlert alerts={[{ variant: 'ok', message: noticeMessage }]} />
        ) : null}
        {errorMessage ? (
          <CriticalAlert
            alerts={[{ variant: 'danger', message: `로그인 확인 필요. ${errorMessage}` }]}
          />
        ) : null}
        <div className="action-area">
          <Button
            size="medium"
            type="submit"
            variant="primary"
            disabled={!isSupabaseConfigured || isBusy}
          >
            로그인
          </Button>
        </div>
        <div className="recovery-link">
          <Button
            size="medium"
            type="button"
            variant="tertiary"
            disabled={!isSupabaseConfigured || isBusy}
            onClick={onRecovery}
          >
            비밀번호 찾기
          </Button>
        </div>
      </form>
    </div>
  );
}
