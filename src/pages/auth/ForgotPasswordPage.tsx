import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { Button, TextInput } from 'krds-react';
import { AuthPageLayout } from '../../components/layout/AuthPageLayout';
import { isSupabaseConfigured } from '../../config/env';
import { useAuth } from '../../auth/AuthContext';

const forgotPasswordSchema = z.object({
  email: z.string().email('이메일 형식으로 입력해 주세요.'),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const [noticeMessage, setNoticeMessage] = useState('');
  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
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
    <AuthPageLayout
      caption="비밀번호 찾기"
      labelledBy="forgot-password-title"
      description="가입한 이메일 주소를 입력하면 재설정 메일을 보내어 새 비밀번호를 설정합니다."
      body={
        <form
          onSubmit={handleSubmit(async (values) => {
            try {
              clearErrors();
              setNoticeMessage('');
              await resetPassword(values.email);
              setNoticeMessage('메일을 확인해 비밀번호를 재설정해 주세요.');
            } catch {
              setError('email', {
                type: 'server',
                message: '메일을 보낼 수 없습니다. 이메일 주소를 다시 확인해 주세요.',
              });
            }
          })}
          className="krds-form"
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
              disabled={!isSupabaseConfigured || isSubmitting}
            >
              재설정 메일 보내기
            </Button>
          </div>
          <div className="krds-auth-support">
            <span>이미 계정이 있으신가요?</span>
            <Button size="small" type="button" variant="link" onClick={() => navigate('/login')}>
              로그인으로 돌아가기
            </Button>
          </div>
        </form>
      }
    />
  );
}
