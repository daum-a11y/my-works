import { useEffect } from 'react';
import { Button } from 'krds-react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { BrandLogo } from '../../components/layout/BrandLogo';

export function NotFoundPage() {
  const { status, session } = useAuth();
  const navigate = useNavigate();
  const isAuthenticated = status === 'authenticated' && session;
  const destination = isAuthenticated ? '/dashboard' : '/login';
  const actionLabel = isAuthenticated ? '대시보드 복귀' : '로그인 화면으로 이동';
  const secondaryLabel = isAuthenticated ? '업무보고로 바로 이동' : '이전 화면으로 돌아가기';
  const secondaryDestination = isAuthenticated ? '/person/report' : null;

  useEffect(() => {
    document.title = 'My Works | 페이지를 찾을 수 없음';
  }, []);

  return (
    <main className="krds-not-found">
      <section className="not-found-panel" aria-labelledby="not-found-title">
        <div className="not-found-hero">
          <h1 className="logo-heading">
            <BrandLogo className="brand-logo" alt="My Works" width={100} height={30} />
          </h1>
          <p className="caption-text">404</p>
        </div>
        <div className="not-found-body">
          <h1 id="not-found-title" className="not-found-title">
            페이지를 찾을 수 없습니다.
          </h1>
          <p className="description-text">
            주소를 다시 확인하시거나{' '}
            {isAuthenticated
              ? '대시보드로 돌아가 현재 작업을 이어서 진행해 주세요.'
              : '로그인 화면으로 돌아가 다시 진입해 주세요.'}
          </p>
          <div className="action-area">
            <Button as={RouterLink} to={destination} role="link" variant="primary" size="medium">
              {actionLabel}
            </Button>
            {secondaryDestination ? (
              <Button as={RouterLink} to={secondaryDestination} role="link" size="medium">
                {secondaryLabel}
              </Button>
            ) : (
              <Button size="medium" type="button" variant="secondary" onClick={() => navigate(-1)}>
                {secondaryLabel}
              </Button>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
