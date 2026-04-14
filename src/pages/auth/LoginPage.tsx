import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { CriticalAlert } from 'krds-react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { isSupabaseConfigured } from '../../config/env';
import { AuthLayoutShell } from '../../components/layout/AuthLayoutShell';
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
  const [errorMessage, setErrorMessage] = useState('');
  const [noticeMessage, setNoticeMessage] = useState(
    typeof locationState.noticeMessage === 'string' ? locationState.noticeMessage : '',
  );
  const {
    control,
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
    <AuthLayoutShell
      caption="로그인"
      labelledBy="login-title"
      body={
        <LoginForm
          errorMessage={errorMessage}
          noticeMessage={noticeMessage}
          isBusy={isBusy}
          isSupabaseConfigured={isSupabaseConfigured}
          errors={errors}
          control={control}
          handleSubmit={handleSubmit}
          onSubmit={async (values) => {
            try {
              setErrorMessage('');
              setNoticeMessage('');
              await login(values.email, values.password);
            } catch (error) {
              setErrorMessage(error instanceof Error ? error.message : '로그인에 실패했습니다.');
            }
          }}
          onRecovery={() => {
            navigate('/forgot-password');
          }}
        />
      }
      aside={
        !isSupabaseConfigured ? (
          <CriticalAlert
            alerts={[
              {
                variant: 'info',
                message:
                  '환경 설정 필요. `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`가 설정되어야 로그인할 수 있습니다.',
              },
            ]}
          />
        ) : null
      }
    />
  );
}
