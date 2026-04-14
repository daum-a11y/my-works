import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/base/Button';
import { useAuth } from '../../auth/AuthContext';
import { AuthLayoutShell, getAuthFeedbackClassName } from '../../components/layout/AuthLayoutShell';

export function PendingApprovalPage() {
  const navigate = useNavigate();
  const { session, logout } = useAuth();

  useEffect(() => {
    document.title = 'My Works | 승인 대기';
  }, []);

  return (
    <AuthLayoutShell
      caption="승인 대기"
      labelledBy="pending-title"
      title="승인 대기 중입니다"
      description={
        <>
          계정은 확인되었지만 아직 앱 접근 승인이 완료되지 않았습니다.
          <br />
          관리자 승인 후 다시 접속해 주세요.
        </>
      }
      body={
        <>
          <dl className={getAuthFeedbackClassName('info')}>
            <div className="auth-layout-shell__feedback-row">
              <dt>계정</dt>
              <dd>{session?.member.accountId ?? '-'}</dd>
            </div>
            <div className="auth-layout-shell__feedback-row">
              <dt>이름</dt>
              <dd>{session?.member.name ?? '-'}</dd>
            </div>
          </dl>
          <div className="auth-layout-shell__actions">
            <Button
              type="button"
              tone="secondary"
              onPress={async () => {
                await logout();
                navigate('/login', { replace: true });
              }}
            >
              로그아웃
            </Button>
          </div>
        </>
      }
    />
  );
}
