import { Controller, type Control, type UseFormHandleSubmit } from 'react-hook-form';
import { Button, TextInput } from 'krds-react';

interface LoginFormValues {
  email: string;
  password: string;
}

interface LoginFormProps {
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
    <div className="krds-auth-form">
      <form className="krds-auth-fields" onSubmit={handleSubmit(onSubmit)}>
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
          <p className="krds-auth-status" role="status">
            {noticeMessage}
          </p>
        ) : null}
        <div className="krds-auth-actions">
          <Button
            size="medium"
            type="submit"
            variant="primary"
            disabled={!isSupabaseConfigured || isBusy}
          >
            로그인
          </Button>
        </div>
        <div className="krds-auth-support">
          <span>비밀번호를 잊으셨나요?</span>
          <Button
            size="small"
            type="button"
            variant="link"
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
