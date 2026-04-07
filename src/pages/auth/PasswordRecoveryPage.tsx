import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../../auth/AuthContext';
import { PasswordRecoveryForm } from './PasswordRecoveryForm';
import { PasswordRecoveryInvalidState } from './PasswordRecoveryInvalidState';
import '../../styles/domain/pages/password-recovery-page.scss';

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
    document.title = 'My Works | 비밀번호 재설정';
  }, []);

  if (!isRecoverySession) {
    return <PasswordRecoveryInvalidState onLogin={() => navigate('/login', { replace: true })} />;
  }

  return (
    <PasswordRecoveryForm
      errorMessage={errorMessage}
      noticeMessage={noticeMessage}
      isSubmitting={isSubmitting}
      errors={errors}
      register={register}
      handleSubmit={handleSubmit}
      onSubmit={async (values) => {
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
          setErrorMessage(error instanceof Error ? error.message : '비밀번호 변경에 실패했습니다.');
        }
      }}
    />
  );
}
