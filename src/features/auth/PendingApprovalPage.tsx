import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { useAuth } from './AuthContext';
import '../../styles/domain/pages/login-page.scss';

export function PendingApprovalPage() {
  const navigate = useNavigate();
  const { session, logout } = useAuth();

  useEffect(() => {
    document.title = 'My Works | 승인 대기';
  }, []);

  return (
    <main className="loginPageScope page">
      <section className="panel" aria-labelledby="pending-title">
        <header className="introBlock">
          <h1 id="pending-title" className="logoHeading">
            승인 대기 중입니다
          </h1>
          <p>
            계정은 확인되었지만 아직 앱 접근 승인이 완료되지 않았습니다.
            <br />
            관리자 승인 후 다시 접속해 주세요.
          </p>
        </header>

        <dl className="notice" data-state="info">
          <div>
            <dt>계정</dt>
            <dd>{session?.member.accountId ?? '-'}</dd>
          </div>
          <div>
            <dt>이름</dt>
            <dd>{session?.member.name ?? '-'}</dd>
          </div>
        </dl>

        <div className="submitRow">
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
      </section>
    </main>
  );
}
