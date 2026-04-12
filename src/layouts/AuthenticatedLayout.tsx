import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useIsFetching } from '@tanstack/react-query';
import clsx from 'clsx';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { ChevronRight, ChevronDown, House, LogOut, UserRound } from 'lucide-react';
import { BrandLogo } from '../components/layout/BrandLogo';
import { useAuth } from '../auth/AuthContext';
import {
  adminNavigation,
  baseNavigation,
  getBreadcrumbs,
  setDocumentTitle,
} from '../router/navigation';
import { GlobalLoadingSpinner } from '../components/layout/GlobalLoadingSpinner';
import '../styles/pages/AuthenticatedLayout.scss';
import { getAvatarColors } from '../utils/color';

export function AuthenticatedLayout() {
  const location = useLocation();
  const { session, logout } = useAuth();
  const isAdmin = session?.member.role === 'admin';
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string>('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [avatarColor, setAvatarColor] = useState<{ backgroundColor: string; textColor: string }>({
    backgroundColor: '',
    textColor: '',
  });
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

  useLayoutEffect(() => {
    setAvatarColor(getAvatarColors(session?.member?.accountId || ''));
  }, [session?.member?.accountId]);

  const userInitials = (session?.member?.accountId || '').slice(0, 2);

  return (
    <div className="authenticated-layout">
      <a href="#main-content" className="skip-link">
        본문으로 바로가기
      </a>
      <div className="authenticated-layout__layout">
        <header className="authenticated-layout__header">
          <div className="authenticated-layout__brand">
            <NavLink
              to="/dashboard"
              className="authenticated-layout__brand-link"
              aria-label="MY WORKS 홈"
            >
              <BrandLogo
                className="authenticated-layout__brand-logo"
                alt="MY WORKS"
                width={100}
                height={30}
              />
            </NavLink>
          </div>
          <div className="authenticated-layout__header-body">
            <div className="authenticated-layout__header-title">
              <nav className="authenticated-layout__breadcrumbs" aria-label="브래드크럼">
                <ol>
                  {breadcrumbs.map((crumb, i) => (
                    <li key={crumb.label}>
                      {i > 0 && (
                        <ChevronRight
                          size={14}
                          className="authenticated-layout__breadcrumb-separator"
                        />
                      )}
                      <span
                        className={
                          i === breadcrumbs.length - 1 ? 'authenticated-layout__last-crumb' : ''
                        }
                      >
                        {i === 0 ? (
                          <Link
                            to="/dashboard"
                            className="authenticated-layout__breadcrumb-home"
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
            <div className="authenticated-layout__header-meta">
              <div className="authenticated-layout__user-menu" ref={userMenuRef}>
                <button
                  type="button"
                  className="authenticated-layout__user-menu-trigger"
                  aria-haspopup="menu"
                  aria-expanded={isUserMenuOpen}
                  aria-label={`${session?.member.name ?? '사용자'} 메뉴`}
                  onClick={() => setIsUserMenuOpen((open) => !open)}
                >
                  <div
                    className="authenticated-layout__profile-icon"
                    style={{
                      backgroundColor: avatarColor.backgroundColor,
                      color: avatarColor.textColor,
                    }}
                    aria-hidden="true"
                  >
                    {userInitials}
                  </div>
                  <div className="authenticated-layout__profile-info">
                    <strong>{session?.member.accountId}</strong>
                  </div>
                  <ChevronDown
                    size={15}
                    strokeWidth={2.2}
                    className={clsx(
                      'authenticated-layout__user-menu-chevron',
                      isUserMenuOpen && 'authenticated-layout__user-menu-chevron--open',
                    )}
                    aria-hidden="true"
                  />
                </button>
                {isUserMenuOpen ? (
                  <div
                    className="authenticated-layout__user-menu-panel"
                    role="menu"
                    aria-label="사용자 메뉴"
                  >
                    <div className="authenticated-layout__user-menu-identity">
                      <div
                        className="authenticated-layout__user-menu-identity-avatar"
                        aria-hidden="true"
                      >
                        {userInitials}
                      </div>
                      <div className="authenticated-layout__user-menu-identity-text">
                        <strong>{session?.member.accountId}</strong>
                        <span>{session?.member.name}</span>
                      </div>
                    </div>
                    <NavLink
                      to="/profile"
                      role="menuitem"
                      className={({ isActive }) =>
                        clsx(
                          'authenticated-layout__user-menu-item',
                          isActive && 'authenticated-layout__user-menu-item--active',
                        )
                      }
                    >
                      <UserRound size={15} strokeWidth={2} aria-hidden="true" />
                      <span>프로필</span>
                    </NavLink>
                    <button
                      type="button"
                      role="menuitem"
                      className="authenticated-layout__user-menu-item authenticated-layout__user-menu-item--danger"
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
                <p className="authenticated-layout__header-status" role="alert" aria-live="polite">
                  {logoutError}
                </p>
              ) : null}
            </div>
          </div>
        </header>

        <aside className="authenticated-layout__sidebar">
          <nav aria-label="주요 메뉴" className="authenticated-layout__nav">
            <ul className="authenticated-layout__nav-list">
              {navigation.map((item) => (
                <li key={item.label} className="authenticated-layout__nav-item">
                  {'to' in item && item.to ? (
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        clsx(
                          'authenticated-layout__nav-link',
                          isActive && 'authenticated-layout__nav-link--active',
                        )
                      }
                    >
                      {item.icon && <item.icon size={16} strokeWidth={2} />}
                      <span>{item.label}</span>
                    </NavLink>
                  ) : (
                    <div className="authenticated-layout__nav-group">
                      <div className="authenticated-layout__nav-group-header">
                        {item.icon && <item.icon size={16} strokeWidth={2} />}
                        <span className="authenticated-layout__section-label">{item.label}</span>
                      </div>
                      <ul className="authenticated-layout__sub-nav-list">
                        {'children' in item &&
                          item.children?.map((child) => (
                            <li key={child.to}>
                              <NavLink
                                to={child.to}
                                className={({ isActive }) =>
                                  clsx(
                                    'authenticated-layout__nav-link',
                                    isActive && 'authenticated-layout__nav-link--active',
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

        <div className="authenticated-layout__content">
          {resourceFetchCount > 0 ? (
            <div className="authenticated-layout__global-loading-overlay">
              <GlobalLoadingSpinner overlay />
            </div>
          ) : null}
          <main id="main-content" className="authenticated-layout__main">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
