import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/base/Button';
import { InputField } from '../../components/base/Field';
import { AuthLayoutShell, getAuthFeedbackClassName } from '../../components/layout/AuthLayoutShell';
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
    register,
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
          className="auth-layout-shell__form"
        >
          <InputField
            label="이메일"
            type="email"
            autoComplete="username"
            errorMessage={errors.email?.message}
            disabled={!isSupabaseConfigured || isSubmitting}
            {...register('email')}
          />
          {noticeMessage ? (
            <div role="status" className={getAuthFeedbackClassName('success')}>
              <strong>메일 발송 완료</strong>
              <p>{noticeMessage}</p>
            </div>
          ) : null}
          {errorMessage ? (
            <div role="alert" className={getAuthFeedbackClassName('danger')}>
              <strong>입력 확인 필요</strong>
              <p>{errorMessage}</p>
            </div>
          ) : null}
          <div className="auth-layout-shell__actions">
            <Button type="submit" isDisabled={!isSupabaseConfigured || isSubmitting}>
              재설정 메일 보내기
            </Button>
            <div className="auth-layout-shell__action-divider">
              <Button type="button" tone="ghost" onPress={() => navigate('/login')}>
                로그인으로 돌아가기
              </Button>
            </div>
          </div>
        </form>
      }
    />
  );
}
