import { useEffect } from 'react';
import { Button } from 'krds-react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { AuthPageLayout } from '../../components/layout/AuthPageLayout';

export function NotFoundPage() {
  const { status, session } = useAuth();
  const navigate = useNavigate();
  const isAuthenticated = status === 'authenticated' && session;
  const destination = isAuthenticated ? '/dashboard' : '/login';
  const actionLabel = isAuthenticated ? '대시보드로 이동' : '로그인으로 이동';
  const secondaryLabel = isAuthenticated ? '업무보고로 이동' : '이전 화면';
  const secondaryDestination = isAuthenticated ? '/person/report' : null;

  useEffect(() => {
    document.title = 'My Works | 페이지를 찾을 수 없음';
  }, []);

  return (
    <AuthPageLayout
      caption="404"
      labelledBy="not-found-title"
      title="페이지를 찾을 수 없습니다."
      description="요청한 주소가 없거나 접근할 수 없습니다."
      body={
        <div className="action-area">
          <Button as={RouterLink} to={destination} role="link" variant="primary" size="medium">
            {actionLabel}
          </Button>
          {secondaryDestination ? (
            <Button
              as={RouterLink}
              to={secondaryDestination}
              role="link"
              variant="link"
              size="small"
            >
              {secondaryLabel}
            </Button>
          ) : (
            <Button size="small" type="button" variant="link" onClick={() => navigate(-1)}>
              {secondaryLabel}
            </Button>
          )}
        </div>
      }
    />
  );
}
