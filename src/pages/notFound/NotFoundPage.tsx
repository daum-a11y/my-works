import { useEffect } from 'react';
import { Button } from 'krds-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { BrandLogo } from '../../components/layout/BrandLogo';
import { KrdsRouterButtonLink } from '../../components/shared';

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
      <section className="krds-not-found__panel" aria-labelledby="not-found-title">
        <div className="krds-not-found__hero">
          <h1 className="krds-not-found__logo-heading">
            <BrandLogo className="krds-not-found__logo" alt="My Works" width={100} height={30} />
          </h1>
          <p className="krds-not-found__caption">404</p>
        </div>
        <div className="krds-not-found__body">
          <h1 id="not-found-title" className="krds-not-found__title">
            페이지를 찾을 수 없습니다.
          </h1>
          <p className="krds-not-found__description">
            주소를 다시 확인하시거나{' '}
            {isAuthenticated
              ? '대시보드로 돌아가 현재 작업을 이어서 진행해 주세요.'
              : '로그인 화면으로 돌아가 다시 진입해 주세요.'}
          </p>
          <div className="krds-not-found__actions">
            <KrdsRouterButtonLink to={destination} variant="primary" size="medium">
              {actionLabel}
            </KrdsRouterButtonLink>
            {secondaryDestination ? (
              <KrdsRouterButtonLink to={secondaryDestination} size="medium">
                {secondaryLabel}
              </KrdsRouterButtonLink>
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
