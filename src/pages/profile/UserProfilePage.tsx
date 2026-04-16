import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFontPreference } from '../../hooks/useFontPreference';
import { useThemePreference } from '../../hooks/useThemePreference';
import { useAuth } from '../../auth/AuthContext';
import {
  UserProfileAccountSection,
  UserProfileFontSection,
  UserProfileThemeSection,
} from './UserProfileSections';
import { UserProfilePasswordModal } from './UserProfilePasswordModal';
import { PageHeader } from '../../components/shared';

type PasswordDraft = {
  next: string;
  confirm: string;
};

type PasswordErrors = {
  next: string;
  confirm: string;
};

type PasswordStep = 'form' | 'confirm' | 'done';

function getRoleLabel(role?: string) {
  return role === 'admin' ? '관리자' : '구성원';
}

function getPasswordErrors(draft: PasswordDraft): PasswordErrors {
  let next = '';
  let confirm = '';

  if (draft.next && draft.next.trim().length < 8) {
    next = '8자 이상 입력해 주세요.';
  }

  if (draft.confirm && draft.next !== draft.confirm) {
    confirm = '비밀번호가 다릅니다.';
  }

  return { next, confirm };
}

export function UserProfilePage() {
  const navigate = useNavigate();
  const { session, updatePassword, logout } = useAuth();
  const { fontPreference, setFontPreference } = useFontPreference();
  const { themePreference, setThemePreference } = useThemePreference();
  const member = session?.member;
  const [editing, setEditing] = useState(false);
  const [step, setStep] = useState<PasswordStep>('form');
  const [draft, setDraft] = useState<PasswordDraft>({ next: '', confirm: '' });
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nextInputRef = useRef<HTMLInputElement | null>(null);
  const editButtonRef = useRef<HTMLButtonElement | null>(null);

  const errors = getPasswordErrors(draft);
  const canSubmit =
    draft.next.trim().length >= 8 &&
    draft.confirm.trim().length > 0 &&
    draft.next === draft.confirm &&
    !isSubmitting;

  useEffect(() => {
    if (!editing || step !== 'form') {
      return;
    }

    nextInputRef.current?.focus();
  }, [editing, step]);

  useEffect(() => {
    if (!editing || step !== 'form' || isSubmitting) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setEditing(false);
        setDraft({ next: '', confirm: '' });
        setSubmitError('');
        setStep('form');
        setIsSubmitting(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editing, isSubmitting, step]);

  const resetDraft = () => {
    setDraft({ next: '', confirm: '' });
    setSubmitError('');
    setStep('form');
    setIsSubmitting(false);
  };

  const handleEdit = () => {
    setSubmitError('');
    setStep('form');
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    resetDraft();
  };

  const handleChange = async () => {
    if (!canSubmit) {
      if (!draft.next.trim()) {
        setSubmitError('새 비밀번호를 입력해 주세요.');
        return;
      }

      if (draft.next.trim().length < 8) {
        setSubmitError('8자 이상 입력해 주세요.');
        return;
      }

      if (!draft.confirm.trim()) {
        setSubmitError('비밀번호 확인을 입력해 주세요.');
        return;
      }

      setSubmitError('비밀번호가 다릅니다.');
      return;
    }

    setSubmitError('');
    setStep('confirm');
  };

  const handleConfirmChange = async () => {
    try {
      setIsSubmitting(true);
      setSubmitError('');
      await updatePassword(draft.next);
      setStep('done');
      setIsSubmitting(false);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : '비밀번호 변경에 실패했습니다. 다시 시도해 주세요.',
      );
      setIsSubmitting(false);
      setStep('form');
    }
  };

  const handleMoveToLogin = async () => {
    await logout();
    navigate('/login', {
      replace: true,
      state: {
        noticeMessage: '비밀번호가 변경되었습니다. 로그인해 주세요.',
        emailPrefill: member?.email ?? '',
      },
    });
  };

  return (
    <section className="settings-page page-view" aria-labelledby="profile-title">
      <PageHeader title="프로필" id="profile-title" />

      <div className="settings-workspace">
        <UserProfileAccountSection
          accountId={member?.accountId}
          name={member?.name}
          email={member?.email}
          roleLabel={getRoleLabel(member?.role)}
          editing={editing}
          editButtonRef={editButtonRef}
          onEdit={handleEdit}
        />

        <UserProfileFontSection
          fontPreference={fontPreference}
          onFontPreferenceChange={setFontPreference}
        />

        <UserProfileThemeSection
          themePreference={themePreference}
          onThemePreferenceChange={setThemePreference}
        />
      </div>

      <UserProfilePasswordModal
        editing={editing}
        step={step}
        draft={draft}
        errors={errors}
        submitError={submitError}
        isSubmitting={isSubmitting}
        canSubmit={canSubmit}
        nextInputRef={nextInputRef}
        onDraftChange={(patch) => {
          setSubmitError('');
          setDraft((current) => ({ ...current, ...patch }));
        }}
        onSubmit={() => {
          void handleChange();
        }}
        onCancel={handleCancel}
        onConfirm={() => {
          void handleConfirmChange();
        }}
        onBackToForm={() => setStep('form')}
        onMoveToLogin={() => {
          void handleMoveToLogin();
        }}
      />
    </section>
  );
}
