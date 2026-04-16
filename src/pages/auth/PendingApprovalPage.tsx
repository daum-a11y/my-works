import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, StructuredList } from 'krds-react';
import { useAuth } from '../../auth/AuthContext';
import { AuthPageLayout } from '../../components/layout/AuthPageLayout';

export function PendingApprovalPage() {
  const navigate = useNavigate();
  const { session, logout } = useAuth();

  useEffect(() => {
    document.title = 'My Works | 승인 대기';
  }, []);

  return (
    <AuthPageLayout
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
          <StructuredList className="sm">
            {[
              { label: '계정', value: session?.member.accountId ?? '-' },
              { label: '이름', value: session?.member.name ?? '-' },
            ].map((item, index) => (
              <li key={`${item.label}-${index}`} className="structured-item">
                <div className="in">
                  <div className="card-body">
                    <div className="c-text">
                      <strong className="c-tit">{item.label}</strong>
                      <span className="c-txt">{item.value}</span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </StructuredList>
          <div className="action-area">
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
