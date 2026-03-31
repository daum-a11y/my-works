import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { ChevronRight, ChevronDown, House, LogOut, UserRound } from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';
import { adminNavigation, baseNavigation, getBreadcrumbs, setDocumentTitle } from './navigation';
import styles from './AppShell.module.css';

export function AppShell() {
  const location = useLocation();
  const { session, logout } = useAuth();
  const isAdmin = session?.member.role === 'admin';
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string>('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

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
      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <div className={styles.brand}>
            <NavLink to="/dashboard" className={styles.brandLink} aria-label="MY WORKS 홈">
              <img
                className={styles.brandLogo}
                src="/img/my-works-logo-200x60.png"
                alt="MY WORKS"
                width="100"
                height="30"
              />
            </NavLink>
          </div>

          <nav aria-label="주요 메뉴" className={styles.nav}>
            <ul className={styles.navList}>
              {navigation.map((item) => (
                <li key={item.label} className={styles.navItem}>
                  {'to' in item && item.to ? (
                    <NavLink
                      to={item.to}
                      className={({ isActive }) => (isActive ? styles.activeLink : styles.link)}
                    >
                      {item.icon && <item.icon size={16} strokeWidth={2} />}
                      <span>{item.label}</span>
                    </NavLink>
                  ) : (
                    <div className={styles.navGroup}>
                      <div className={styles.navGroupHeader}>
                        {item.icon && <item.icon size={16} strokeWidth={2} />}
                        <span className={styles.sectionLabel}>{item.label}</span>
                      </div>
                      <ul className={styles.subNavList}>
                        {'children' in item &&
                          item.children?.map((child) => (
                            <li key={child.to}>
                              <NavLink
                                to={child.to}
                                className={({ isActive }) =>
                                  isActive ? styles.activeLink : styles.link
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

        <div className={styles.content}>
          <header className={styles.header}>
            <div className={styles.headerTitle}>
              <nav className={styles.breadcrumbs} aria-label="브래드크럼">
                <ol>
                  {breadcrumbs.map((crumb, i) => (
                    <li key={crumb.label}>
                      {i > 0 && <ChevronRight size={14} className={styles.breadcrumbSeparator} />}
                      <span className={i === breadcrumbs.length - 1 ? styles.lastCrumb : ''}>
                        {i === 0 ? (
                          <Link
                            to="/dashboard"
                            className={styles.breadcrumbHome}
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
            <div className={styles.headerMeta}>
              <div className={styles.userMenu} ref={userMenuRef}>
                <button
                  type="button"
                  className={styles.userMenuTrigger}
                  aria-haspopup="menu"
                  aria-expanded={isUserMenuOpen}
                  aria-label={`${session?.member.name ?? '사용자'} 메뉴`}
                  onClick={() => setIsUserMenuOpen((open) => !open)}
                >
                  <div className={styles.profileIcon} aria-hidden="true">
                    {userInitials}
                  </div>
                  <div className={styles.profileInfo}>
                    <strong>{session?.member.accountId}</strong>
                  </div>
                  <ChevronDown
                    size={15}
                    strokeWidth={2.2}
                    className={isUserMenuOpen ? styles.userMenuChevronOpen : styles.userMenuChevron}
                    aria-hidden="true"
                  />
                </button>
                {isUserMenuOpen ? (
                  <div className={styles.userMenuPanel} role="menu" aria-label="사용자 메뉴">
                    <div className={styles.userMenuIdentity}>
                      <div className={styles.userMenuIdentityAvatar} aria-hidden="true">
                        {userInitials}
                      </div>
                      <div className={styles.userMenuIdentityText}>
                        <strong>{session?.member.accountId}</strong>
                        <span>{session?.member.name}</span>
                      </div>
                    </div>
                    <NavLink
                      to="/profile"
                      role="menuitem"
                      className={({ isActive }) =>
                        isActive ? styles.userMenuItemActive : styles.userMenuItem
                      }
                    >
                      <UserRound size={15} strokeWidth={2} aria-hidden="true" />
                      <span>프로필</span>
                    </NavLink>
                    <button
                      type="button"
                      role="menuitem"
                      className={`${styles.userMenuItem} ${styles.userMenuItemDanger}`}
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
                <p className={styles.headerStatus} role="alert" aria-live="polite">
                  {logoutError}
                </p>
              ) : null}
            </div>
          </header>

          <main id="main-content" className={styles.main}>
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
}
