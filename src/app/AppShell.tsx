import { useEffect, useMemo, useRef, useState } from 'react';
import { useIsFetching } from '@tanstack/react-query';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { ChevronRight, ChevronDown, House, LogOut, UserRound } from 'lucide-react';
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
    <>
      <a href="#main-content" className="skipLink">
        본문으로 바로가기
      </a>
      <div className={'layout'}>
        <aside className={'sidebar'}>
          <div className={'brand'}>
            <NavLink to="/dashboard" className={'brandLink'} aria-label="MY WORKS 홈">
              <img
                className={'brandLogo'}
                src="/img/my-works-logo-200x60.png"
                alt="MY WORKS"
                width="100"
                height="30"
              />
            </NavLink>
          </div>

          <nav aria-label="주요 메뉴" className={'nav'}>
            <ul className={'navList'}>
              {navigation.map((item) => (
                <li key={item.label} className={'navItem'}>
                  {'to' in item && item.to ? (
                    <NavLink
                      to={item.to}
                      className={({ isActive }) => (isActive ? 'activeLink' : 'link')}
                    >
                      {item.icon && <item.icon size={16} strokeWidth={2} />}
                      <span>{item.label}</span>
                    </NavLink>
                  ) : (
                    <div className={'navGroup'}>
                      <div className={'navGroupHeader'}>
                        {item.icon && <item.icon size={16} strokeWidth={2} />}
                        <span className={'sectionLabel'}>{item.label}</span>
                      </div>
                      <ul className={'subNavList'}>
                        {'children' in item &&
                          item.children?.map((child) => (
                            <li key={child.to}>
                              <NavLink
                                to={child.to}
                                className={({ isActive }) => (isActive ? 'activeLink' : 'link')}
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

        <div className={'content'}>
          {resourceFetchCount > 0 ? (
            <div className={'globalLoadingOverlay'}>
              <GlobalLoadingSpinner overlay />
            </div>
          ) : null}
          <header className={'header'}>
            <div className={'headerTitle'}>
              <nav className={'breadcrumbs'} aria-label="브래드크럼">
                <ol>
                  {breadcrumbs.map((crumb, i) => (
                    <li key={crumb.label}>
                      {i > 0 && <ChevronRight size={14} className={'breadcrumbSeparator'} />}
                      <span className={i === breadcrumbs.length - 1 ? 'lastCrumb' : ''}>
                        {i === 0 ? (
                          <Link
                            to="/dashboard"
                            className={'breadcrumbHome'}
                            aria-label="홈으로 가기"
                          >
                            <House size={14} strokeWidth={2.2} aria-hidden="true" />
                            <span className="srOnly">홈</span>
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
            <div className={'headerMeta'}>
              <div className={'userMenu'} ref={userMenuRef}>
                <button
                  type="button"
                  className={'userMenuTrigger'}
                  aria-haspopup="menu"
                  aria-expanded={isUserMenuOpen}
                  aria-label={`${session?.member.name ?? '사용자'} 메뉴`}
                  onClick={() => setIsUserMenuOpen((open) => !open)}
                >
                  <div className={'profileIcon'} aria-hidden="true">
                    {userInitials}
                  </div>
                  <div className={'profileInfo'}>
                    <strong>{session?.member.accountId}</strong>
                  </div>
                  <ChevronDown
                    size={15}
                    strokeWidth={2.2}
                    className={isUserMenuOpen ? 'userMenuChevronOpen' : 'userMenuChevron'}
                    aria-hidden="true"
                  />
                </button>
                {isUserMenuOpen ? (
                  <div className={'userMenuPanel'} role="menu" aria-label="사용자 메뉴">
                    <div className={'userMenuIdentity'}>
                      <div className={'userMenuIdentityAvatar'} aria-hidden="true">
                        {userInitials}
                      </div>
                      <div className={'userMenuIdentityText'}>
                        <strong>{session?.member.accountId}</strong>
                        <span>{session?.member.name}</span>
                      </div>
                    </div>
                    <NavLink
                      to="/profile"
                      role="menuitem"
                      className={({ isActive }) =>
                        isActive ? 'userMenuItemActive' : 'userMenuItem'
                      }
                    >
                      <UserRound size={15} strokeWidth={2} aria-hidden="true" />
                      <span>프로필</span>
                    </NavLink>
                    <button
                      type="button"
                      role="menuitem"
                      className={`${'userMenuItem'} ${'userMenuItemDanger'}`}
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
                <p className={'headerStatus'} role="alert" aria-live="polite">
                  {logoutError}
                </p>
              ) : null}
            </div>
          </header>

          <main id="main-content" className={'main'}>
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
}
