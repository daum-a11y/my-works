import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { CriticalAlert } from 'krds-react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { isSupabaseConfigured } from '../../config/env';
import { AuthPageLayout } from '../../components/layout/AuthPageLayout';
import { LoginForm } from './LoginForm';

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
  const [noticeMessage, setNoticeMessage] = useState(
    typeof locationState.noticeMessage === 'string' ? locationState.noticeMessage : '',
  );
  const {
    control,
    handleSubmit,
    setFocus,
    setError,
    clearErrors,
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
    <>
      {!isSupabaseConfigured ? (
        <CriticalAlert
          alerts={[
            {
              variant: 'danger',
              message: '환경 설정 필요합니다. 관리자에게 문의하세요.',
            },
          ]}
        />
      ) : (
        <AuthPageLayout
          caption="로그인"
          labelledBy="login-title"
          body={
            <LoginForm
              noticeMessage={noticeMessage}
              isBusy={isBusy}
              isSupabaseConfigured={isSupabaseConfigured}
              errors={errors}
              control={control}
              handleSubmit={handleSubmit}
              onSubmit={async (values) => {
                try {
                  clearErrors();
                  setNoticeMessage('');
                  await login(values.email, values.password);
                } catch {
                  setError('password', {
                    type: 'server',
                    message: '이메일 또는 비밀번호를 다시 확인해 주세요.',
                  });
                  setFocus('password');
                }
              }}
              onRecovery={() => {
                navigate('/forgot-password');
              }}
            />
          }
        />
      )}
    </>
  );
}
