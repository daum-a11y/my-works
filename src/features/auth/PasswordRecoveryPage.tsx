import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../../components/ui/Button';
import { InputField } from '../../components/ui/Field';
import { useAuth } from './AuthContext';
import styles from './PasswordRecoveryPage.module.css';

const recoverySchema = z
  .object({
    nextPassword: z.string().min(8, '비밀번호는 8자 이상이어야 합니다.'),
    confirmPassword: z.string().min(1, '비밀번호 확인을 입력해 주세요.'),
  })
  .refine((value) => value.nextPassword === value.confirmPassword, {
    message: '비밀번호 확인이 일치하지 않습니다.',
    path: ['confirmPassword'],
  });

type RecoveryFormValues = z.infer<typeof recoverySchema>;

export function PasswordRecoveryPage() {
  const navigate = useNavigate();
  const { isRecoverySession, updatePassword, logout } = useAuth();
  const [errorMessage, setErrorMessage] = useState('');
  const [noticeMessage, setNoticeMessage] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RecoveryFormValues>({
    resolver: zodResolver(recoverySchema),
    defaultValues: {
      nextPassword: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    document.title = 'My Works · 비밀번호 재설정';
  }, []);

  if (!isRecoverySession) {
    return (
      <main className={styles.page}>
        <section className={styles.panel} aria-labelledby="recovery-invalid-title">
          <div className={styles.introBlock}>
            <h1 className={styles.logoHeading}>
              <img
                className={styles.logo}
                src="/img/my-works-logo-200x60.png"
                alt="My Works"
                width="100"
                height="30"
              />
            </h1>
            <p id="recovery-invalid-title" className={styles.caption}>
              비밀번호 재설정
            </p>
          </div>
          <div className={styles.formBlock}>
            <div className={styles.hero}>
              <h1 className={styles.title}>유효하지 않은 재설정 링크</h1>
              <p className={styles.description}>
                비밀번호 재설정 메일에서 다시 진입해 주세요. 필요하면 로그인 화면에서 메일을 다시
                요청하실 수 있습니다.
              </p>
            </div>
            <div className={styles.actions}>
              <Button type="button" onPress={() => navigate('/login', { replace: true })}>
                로그인으로 이동
              </Button>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <section className={styles.panel} aria-labelledby="recovery-title">
        <div className={styles.introBlock}>
          <h1 className={styles.logoHeading}>
            <img
              className={styles.logo}
              src="/img/my-works-logo-200x60.png"
              alt="My Works"
              width="100"
              height="30"
            />
          </h1>
          <p id="recovery-title" className={styles.caption}>
            비밀번호 재설정
          </p>
        </div>
        <div className={styles.formBlock}>
          <div className={styles.hero}>
            <p className={styles.description}>
              새 비밀번호를 입력하면 현재 계정의 비밀번호가 즉시 변경됩니다.
            </p>
          </div>
          <form
            className={styles.form}
            onSubmit={handleSubmit(async (values) => {
              try {
                setErrorMessage('');
                setNoticeMessage('');
                await updatePassword(values.nextPassword);
                await logout();
                setNoticeMessage('비밀번호가 변경되었습니다. 다시 로그인해 주세요.');
                navigate('/login', {
                  replace: true,
                  state: { noticeMessage: '비밀번호가 변경되었습니다. 다시 로그인해 주세요.' },
                });
              } catch (error) {
                setErrorMessage(
                  error instanceof Error ? error.message : '비밀번호 변경에 실패했습니다.',
                );
              }
            })}
          >
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
              <p className={styles.message} data-state="success" role="status">
                {noticeMessage}
              </p>
            ) : null}
            {errorMessage ? (
              <p className={styles.message} data-state="danger" role="alert">
                {errorMessage}
              </p>
            ) : null}
            <div className={styles.actions}>
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
