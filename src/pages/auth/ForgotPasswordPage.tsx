import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { Button, CriticalAlert, TextInput } from 'krds-react';
import { AuthLayoutShell } from '../../components/layout/AuthLayoutShell';
import { isSupabaseConfigured } from '../../config/env';
import { useAuth } from '../../auth/AuthContext';

const forgotPasswordSchema = z.object({
  email: z.string().email('이메일 형식으로 입력해 주세요.'),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const [errorMessage, setErrorMessage] = useState('');
  const [noticeMessage, setNoticeMessage] = useState('');
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  useEffect(() => {
    document.title = 'My Works | 비밀번호 찾기';
  }, []);

  return (
    <AuthLayoutShell
      caption="비밀번호 찾기"
      labelledBy="forgot-password-title"
      description="가입한 이메일 주소를 입력하면 재설정 메일을 보내어 새 비밀번호를 설정합니다."
      body={
        <form
          onSubmit={handleSubmit(async (values) => {
            try {
              setErrorMessage('');
              setNoticeMessage('');
              await resetPassword(values.email);
              setNoticeMessage('메일을 확인해 비밀번호를 재설정해 주세요.');
            } catch (error) {
              setErrorMessage(error instanceof Error ? error.message : '메일 발송 실패.');
            }
          })}
          className="krds-auth-shell__form"
        >
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
                disabled={!isSupabaseConfigured || isSubmitting}
                size="large"
              />
            )}
          />
          {noticeMessage ? (
            <CriticalAlert
              alerts={[{ variant: 'ok', message: `메일 발송 완료. ${noticeMessage}` }]}
            />
          ) : null}
          {errorMessage ? (
            <CriticalAlert
              alerts={[{ variant: 'danger', message: `입력 확인 필요. ${errorMessage}` }]}
            />
          ) : null}
          <div className="krds-auth-shell__actions">
            <Button type="submit" variant="primary" disabled={!isSupabaseConfigured || isSubmitting}>
              재설정 메일 보내기
            </Button>
            <div className="krds-auth-shell__action-divider">
              <Button type="button" variant="tertiary" onClick={() => navigate('/login')}>
                로그인으로 돌아가기
              </Button>
            </div>
          </div>
        </form>
      }
    />
  );
}
