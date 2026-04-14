import type { UseFormHandleSubmit, UseFormRegister } from 'react-hook-form';
import { Button } from '../../components/base/Button';
import { InputField } from '../../components/base/Field';

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
  register: UseFormRegister<LoginFormValues>;
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
  register,
  handleSubmit,
  onSubmit,
  onRecovery,
}: LoginFormProps) {
  return (
    <div className="login-page__form">
      <form className="login-page__form-shell" onSubmit={handleSubmit(onSubmit)}>
        <InputField
          label="이메일"
          type="email"
          autoComplete="username"
          errorMessage={errors.email?.message}
          disabled={!isSupabaseConfigured || isBusy}
          {...register('email')}
        />
        <InputField
          label="비밀번호"
          type="password"
          autoComplete="current-password"
          errorMessage={errors.password?.message}
          disabled={!isSupabaseConfigured || isBusy}
          {...register('password')}
        />
        {noticeMessage ? (
          <div
            className="login-page__feedback login-page__feedback--success"
            data-state="success"
            role="status"
          >
            <strong className="login-page__feedback-title">비밀번호 변경 완료</strong>
            <p>{noticeMessage}</p>
          </div>
        ) : null}
        {errorMessage ? (
          <div className="login-page__feedback login-page__feedback--danger" role="alert">
            <strong className="login-page__feedback-title">로그인 확인 필요</strong>
            <p>{errorMessage}</p>
          </div>
        ) : null}
        <div className="login-page__actions">
          <Button type="submit" isDisabled={!isSupabaseConfigured || isBusy}>
            로그인
          </Button>
        </div>
        <div className="login-page__recovery">
          <Button
            type="button"
            tone="ghost"
            isDisabled={!isSupabaseConfigured || isBusy}
            onPress={onRecovery}
          >
            비밀번호 찾기
          </Button>
        </div>
      </form>
    </div>
  );
}
