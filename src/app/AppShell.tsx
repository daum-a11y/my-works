import { useEffect, useMemo, useRef, useState } from 'react';
import { useIsFetching } from '@tanstack/react-query';
import clsx from 'clsx';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { ChevronRight, ChevronDown, House, LogOut, UserRound } from 'lucide-react';
import { BrandLogo } from '../components/common/BrandLogo';
import { useAuth } from '../features/auth/AuthContext';
import { GlobalLoadingSpinner } from './GlobalLoadingSpinner';
import { adminNavigation, baseNavigation, getBreadcrumbs, setDocumentTitle } from './navigation';
import '../styles/domain/pages/app-shell.scss';

export function AppShell() {
  const location = useLocation();
  const { session, logout } = useAuth();
  const isAdmin = session?.member.role === 'admin';
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string>('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const resourceFetchCount = useIsFetching({
    predicate: (query) => query.queryKey[0] === 'resource',
  });

  const navigation = useMemo(
    () => (isAdmin ? [...baseNavigation, ...adminNavigation] : [...baseNavigation]),
    [isAdmin],
  );

  const breadcrumbs = useMemo(() => {
    return getBreadcrumbs(location.pathname, navigation);
  }, [location.pathname, navigation]);

  useEffect(() => {
    setDocumentTitle(breadcrumbs[breadcrumbs.length - 1]?.label ?? 'My Works');
  }, [breadcrumbs]);

  useEffect(() => {
    setIsUserMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isUserMenuOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!userMenuRef.current?.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsUserMenuOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isUserMenuOpen]);

  async function handleLogout() {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);
    setLogoutError('');

    try {
      await logout();
    } catch (error) {
      setLogoutError(error instanceof Error ? error.message : '로그아웃에 실패했습니다.');
    } finally {
      setIsLoggingOut(false);
    }
  }

  const userInitials = (session?.member?.accountId || session?.member?.name || '').slice(0, 2);

  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        본문으로 바로가기
      </a>
      <div className="app-shell__layout">
        <header className="app-shell__header">
          <div className="app-shell__brand">
            <NavLink to="/dashboard" className="app-shell__brand-link" aria-label="MY WORKS 홈">
              <BrandLogo className="app-shell__brand-logo" alt="MY WORKS" width={100} height={30} />
            </NavLink>
          </div>
          <div className="app-shell__header-body">
            <div className="app-shell__header-title">
              <nav className="app-shell__breadcrumbs" aria-label="브래드크럼">
                <ol>
                  {breadcrumbs.map((crumb, i) => (
                    <li key={crumb.label}>
                      {i > 0 && (
                        <ChevronRight size={14} className="app-shell__breadcrumb-separator" />
                      )}
                      <span className={i === breadcrumbs.length - 1 ? 'app-shell__last-crumb' : ''}>
                        {i === 0 ? (
                          <Link
                            to="/dashboard"
                            className="app-shell__breadcrumb-home"
                            aria-label="홈으로 가기"
                          >
                            <House size={14} strokeWidth={2.2} aria-hidden="true" />
                            <span className="sr-only">홈</span>
                          </Link>
                        ) : (
                          crumb.label
                        )}
                      </span>
                    </li>
                  ))}
                </ol>
              </nav>
            </div>
            <div className="app-shell__header-meta">
              <div className="app-shell__user-menu" ref={userMenuRef}>
                <button
                  type="button"
                  className="app-shell__user-menu-trigger"
                  aria-haspopup="menu"
                  aria-expanded={isUserMenuOpen}
                  aria-label={`${session?.member.name ?? '사용자'} 메뉴`}
                  onClick={() => setIsUserMenuOpen((open) => !open)}
                >
                  <div className="app-shell__profile-icon" aria-hidden="true">
                    {userInitials}
                  </div>
                  <div className="app-shell__profile-info">
                    <strong>{session?.member.accountId}</strong>
                  </div>
                  <ChevronDown
                    size={15}
                    strokeWidth={2.2}
                    className={clsx(
                      'app-shell__user-menu-chevron',
                      isUserMenuOpen && 'app-shell__user-menu-chevron--open',
                    )}
                    aria-hidden="true"
                  />
                </button>
                {isUserMenuOpen ? (
                  <div className="app-shell__user-menu-panel" role="menu" aria-label="사용자 메뉴">
                    <div className="app-shell__user-menu-identity">
                      <div className="app-shell__user-menu-identity-avatar" aria-hidden="true">
                        {userInitials}
                      </div>
                      <div className="app-shell__user-menu-identity-text">
                        <strong>{session?.member.accountId}</strong>
                        <span>{session?.member.name}</span>
                      </div>
                    </div>
                    <NavLink
                      to="/profile"
                      role="menuitem"
                      className={({ isActive }) =>
                        clsx(
                          'app-shell__user-menu-item',
                          isActive && 'app-shell__user-menu-item--active',
                        )
                      }
                    >
                      <UserRound size={15} strokeWidth={2} aria-hidden="true" />
                      <span>프로필</span>
                    </NavLink>
                    <button
                      type="button"
                      role="menuitem"
                      className="app-shell__user-menu-item app-shell__user-menu-item--danger"
                      onClick={() => void handleLogout()}
                      disabled={isLoggingOut}
                    >
                      <LogOut size={15} strokeWidth={2} aria-hidden="true" />
                      <span>로그아웃</span>
                    </button>
                  </div>
                ) : null}
              </div>
              {logoutError ? (
                <p className="app-shell__header-status" role="alert" aria-live="polite">
                  {logoutError}
                </p>
              ) : null}
            </div>
          </div>
        </header>

        <aside className="app-shell__sidebar">
          <nav aria-label="주요 메뉴" className="app-shell__nav">
            <ul className="app-shell__nav-list">
              {navigation.map((item) => (
                <li key={item.label} className="app-shell__nav-item">
                  {'to' in item && item.to ? (
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        clsx('app-shell__nav-link', isActive && 'app-shell__nav-link--active')
                      }
                    >
                      {item.icon && <item.icon size={16} strokeWidth={2} />}
                      <span>{item.label}</span>
                    </NavLink>
                  ) : (
                    <div className="app-shell__nav-group">
                      <div className="app-shell__nav-group-header">
                        {item.icon && <item.icon size={16} strokeWidth={2} />}
                        <span className="app-shell__section-label">{item.label}</span>
                      </div>
                      <ul className="app-shell__sub-nav-list">
                        {'children' in item &&
                          item.children?.map((child) => (
                            <li key={child.to}>
                              <NavLink
                                to={child.to}
                                className={({ isActive }) =>
                                  clsx(
                                    'app-shell__nav-link',
                                    isActive && 'app-shell__nav-link--active',
                                  )
                                }
                              >
                                {child.label}
                              </NavLink>
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <div className="app-shell__content">
          {resourceFetchCount > 0 ? (
            <div className="app-shell__global-loading-overlay">
              <GlobalLoadingSpinner overlay />
            </div>
          ) : null}
          <main id="main-content" className="app-shell__main">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
