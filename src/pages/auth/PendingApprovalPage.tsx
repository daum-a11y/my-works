import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'krds-react';
import { useAuth } from '../../auth/AuthContext';
import { AuthLayoutShell } from '../../components/layout/AuthLayoutShell';
import { KrdsStructuredInfoList } from '../../components/shared';

export function PendingApprovalPage() {
  const navigate = useNavigate();
  const { session, logout } = useAuth();

  useEffect(() => {
    document.title = 'My Works | 승인 대기';
  }, []);

  return (
    <AuthLayoutShell
      caption="계정 확인"
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
          <KrdsStructuredInfoList
            items={[
              { label: '계정', value: session?.member.accountId ?? '-' },
              { label: '이름', value: session?.member.name ?? '-' },
            ]}
          />
          <div className="krds-auth-shell__actions">
            <Button
              size="medium"
              type="button"
              variant="secondary"
              onClick={async () => {
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
