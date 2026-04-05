import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { isSupabaseConfigured } from '../../lib/env';
import { Button } from '../../components/ui/Button';
import { InputField } from '../../components/ui/Field';
import '../../styles/domain/pages/login-page.scss';

const loginSchema = z.object({
  email: z.string().email('이메일 형식으로 입력해 주세요.'),
  password: z.string().min(1, '비밀번호를 입력해 주세요.'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { login, session, status } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState =
    typeof location.state === 'object' && location.state
      ? (location.state as { noticeMessage?: string; emailPrefill?: string })
      : {};
  const [errorMessage, setErrorMessage] = useState('');
  const [noticeMessage, setNoticeMessage] = useState(
    typeof locationState.noticeMessage === 'string' ? locationState.noticeMessage : '',
  );
  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: typeof locationState.emailPrefill === 'string' ? locationState.emailPrefill : '',
      password: '',
    },
  });

  useEffect(() => {
    document.title = 'My Works | 로그인';
  }, []);

  useEffect(() => {
    if (noticeMessage) {
      setFocus(locationState.emailPrefill ? 'password' : 'email');
    }
  }, [locationState.emailPrefill, noticeMessage, setFocus]);

  if (status === 'authenticated' && session) {
    return <Navigate to="/dashboard" replace />;
  }

  const isBusy = isSubmitting;

  return (
    <main className="loginPageScope page">
      <section className="panel" aria-labelledby="login-title">
        <div className="introBlock">
          <h1 className="logoHeading">
            <img
              className="logo"
              src="/img/my-works-logo-200x60.png"
              alt="My Works"
              width="100"
              height="30"
            />
          </h1>
          <p id="login-title" className="caption">
            로그인
          </p>
        </div>

        <div className="formBlock">
          <form
            className="form"
            onSubmit={handleSubmit(async (values) => {
              try {
                setErrorMessage('');
                setNoticeMessage('');
                await login(values.email, values.password);
              } catch (error) {
                setErrorMessage(error instanceof Error ? error.message : '로그인에 실패했습니다.');
              }
            })}
          >
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
              <div className="notice" data-state="success" role="status">
                <strong className="noticeTitle">비밀번호 변경 완료</strong>
                <p>{noticeMessage}</p>
              </div>
            ) : null}
            {errorMessage ? (
              <div className="error" role="alert">
                <strong className="noticeTitle">로그인 확인 필요</strong>
                <p>{errorMessage}</p>
              </div>
            ) : null}
            <div className="submitRow">
              <Button type="submit" isDisabled={!isSupabaseConfigured || isBusy}>
                로그인
              </Button>
            </div>
            <div className="recoveryPanel">
              <button
                type="button"
                className="recoveryButton"
                disabled={!isSupabaseConfigured || isBusy}
                onClick={() => {
                  navigate('/forgot-password');
                }}
              >
                비밀번호 찾기
              </button>
            </div>
          </form>
        </div>
      </section>
      {!isSupabaseConfigured ? (
        <div className="notice configNotice" data-state="info">
          <strong>환경 설정 필요</strong>
          <p>`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`가 설정되어야 로그인할 수 있습니다.</p>
        </div>
      ) : null}
    </main>
  );
}
