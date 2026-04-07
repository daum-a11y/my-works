import type { UseFormHandleSubmit, UseFormRegister } from 'react-hook-form';
import { BrandLogo } from '../../components/layout/BrandLogo';
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
    <main className="password-recovery-page">
      <section className="password-recovery-page__panel" aria-labelledby="recovery-title">
        <div className="password-recovery-page__hero">
          <h1 className="password-recovery-page__logo-heading">
            <BrandLogo
              className="password-recovery-page__logo"
              alt="My Works"
              width={100}
              height={30}
            />
          </h1>
          <p id="recovery-title" className="password-recovery-page__caption">
            비밀번호 재설정
          </p>
        </div>
        <div className="password-recovery-page__form">
          <div className="password-recovery-page__lead">
            <p className="password-recovery-page__description">
              새 비밀번호를 입력하면 현재 계정의 비밀번호가 즉시 변경됩니다.
            </p>
          </div>
          <form className="password-recovery-page__form-shell" onSubmit={handleSubmit(onSubmit)}>
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
              <p
                className="password-recovery-page__feedback password-recovery-page__feedback--success"
                data-state="success"
                role="status"
              >
                {noticeMessage}
              </p>
            ) : null}
            {errorMessage ? (
              <p
                className="password-recovery-page__feedback password-recovery-page__feedback--danger"
                data-state="danger"
                role="alert"
              >
                {errorMessage}
              </p>
            ) : null}
            <div className="password-recovery-page__actions">
              <Button type="submit" isDisabled={isSubmitting}>
                비밀번호 변경
              </Button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
