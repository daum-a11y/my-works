import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Layers,
  Database,
  Search,
  Shield,
  BarChart3,
  ChevronRight,
  ChevronDown,
  House,
  LogOut,
  UserRound,
} from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';
import styles from './AppShell.module.css';

const baseNavigation = [
  { to: '/dashboard', label: '대시보드', icon: LayoutDashboard },
  { to: '/reports', label: '업무보고', icon: FileText },
  { to: '/reports/search', label: '업무보고 검색', icon: Search },
  { to: '/projects', label: '프로젝트 관리', icon: Layers },
  {
    label: '리소스 현황',
    icon: Database,
    children: [
      { to: '/resource/summary', label: '리소스 요약' },
      { to: '/resource/type', label: '업무유형 집계' },
      { to: '/resource/svc', label: '서비스그룹 집계' },
      { to: '/resource/month', label: '월간 종합현황' },
    ],
  },
  {
    label: '통계',
    icon: BarChart3,
    children: [
      { to: '/stats/qa', label: 'QA 통계' },
      { to: '/stats/monitoring', label: '모니터링 통계' },
    ],
  },
] as const;

const adminNavigation = [
  {
    label: '관리자 설정',
    icon: Shield,
    children: [
      { to: '/admin/summary', label: '관리자 요약' },
      { to: '/admin/reports', label: '전체 업무검색' },
      { to: '/admin/members', label: '사용자' },
      { to: '/admin/type', label: '업무 타입 관리' },
      { to: '/admin/group', label: '서비스그룹 관리' },
    ],
  },
] as const;

function isCurrentPath(pathname: string, to: string) {
  return pathname === to || pathname.startsWith(`${to}/`);
}

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
    const parts = [{ label: '홈', to: '/dashboard' }];

    if (location.pathname === '/profile' || location.pathname === '/password-change') {
      parts.push({ label: '프로필', to: '/profile' });
      return parts;
    }

    for (const item of navigation) {
      if ('to' in item && item.to && isCurrentPath(location.pathname, item.to)) {
        parts.push({ label: item.label, to: item.to });
        break;
      }

      if ('children' in item && item.children) {
        for (const child of item.children) {
          if (isCurrentPath(location.pathname, child.to)) {
            parts.push({ label: item.label, to: '#' });
            parts.push({ label: child.label, to: child.to });
            return parts;
          }
        }
      }
    }

    return parts;
  }, [location.pathname, navigation]);

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

  const userInitials = (session?.member?.legacyUserId || session?.member?.name || '').slice(0, 2);

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
              <nav className={styles.breadcrumbs}>
                <ol>
                  {breadcrumbs.map((crumb, i) => (
                    <li key={crumb.label}>
                      {i > 0 && <ChevronRight size={14} className={styles.breadcrumbSeparator} />}
                      <span className={i === breadcrumbs.length - 1 ? styles.lastCrumb : ''}>
                        {i === 0 ? (
                          <span className={styles.breadcrumbHome} aria-label="홈">
                            <House size={14} strokeWidth={2.2} aria-hidden="true" />
                          </span>
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
                    <strong>{session?.member.legacyUserId}</strong>
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
                        <strong>{session?.member.legacyUserId}</strong>
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
                      aria-busy={isLoggingOut || undefined}
                    >
                      <LogOut size={15} strokeWidth={2} aria-hidden="true" />
                      <span>{isLoggingOut ? '로그아웃 중…' : '로그아웃'}</span>
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
