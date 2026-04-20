import { useEffect, useLayoutEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { useIsFetching } from '@tanstack/react-query';
import clsx from 'clsx';
import { Breadcrumb, CriticalAlert, Header, SideNavigation, SkipLink, Spinner } from 'krds-react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, Settings, UserRound } from 'lucide-react';
import { BrandLogo } from '../components/layout/BrandLogo';
import { useAuth } from '../auth/AuthContext';
import {
  adminNavigation,
  baseNavigation,
  setDocumentTitle,
  toBreadcrumbItems,
  type NavigationItem,
} from '../router/navigation';
import { getAvatarColors } from '../utils/color';

function toDomId(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, '-');
}

function isLeafItem(item: NavigationItem): item is Extract<NavigationItem, { to: string }> {
  return 'to' in item;
}

function hasActiveChild(
  pathname: string,
  item: Extract<NavigationItem, { children: readonly unknown[] }>,
) {
  return item.children.some(
    (child) => pathname === child.to || pathname.startsWith(`${child.to}/`),
  );
}

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { session, logout } = useAuth();
  const isAdmin = session?.member.role === 'admin';
  const activeFetchCount = useIsFetching();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [avatarColor, setAvatarColor] = useState<{ backgroundColor: string; textColor: string }>({
    backgroundColor: '',
    textColor: '',
  });
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  const navigation = useMemo(
    () => (isAdmin ? [...baseNavigation, ...adminNavigation] : [...baseNavigation]),
    [isAdmin],
  );

  const breadcrumbItems = useMemo(
    () => toBreadcrumbItems(location.pathname, navigation),
    [location.pathname, navigation],
  );

  useEffect(() => {
    const current = breadcrumbItems[breadcrumbItems.length - 1];
    setDocumentTitle(current?.text ?? 'My Works');
  }, [breadcrumbItems]);

  useEffect(() => {
    setLogoutError('');
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

  const userInitials = (session?.member?.accountId || '').slice(0, 1);

  function handleRouteLinkClick(event: MouseEvent<HTMLElement>, anchor: HTMLAnchorElement) {
    const href = anchor.getAttribute('href') ?? '';
    if (!href || !href.startsWith('/')) {
      return;
    }

    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.altKey ||
      event.ctrlKey ||
      event.shiftKey ||
      (anchor.target && anchor.target !== '_self') ||
      anchor.hasAttribute('download')
    ) {
      return;
    }

    event.preventDefault();
    navigate(href);
  }

  return (
    <>
      <SkipLink targetId="main-content">본문으로 바로가기</SkipLink>

      <Header>
        <Header.Container>
          <div className="header-branding">
            <div className="logo-heading">
              <NavLink to="/dashboard" aria-label="MY WORKS 홈">
                <BrandLogo className="brand-logo" alt="MY WORKS" width={100} height={30} />
              </NavLink>
            </div>
            <Header.Navi>
              <div className="krds-user-menu" ref={userMenuRef}>
                <button
                  type="button"
                  className="user-menu-trigger btn-navi my drop-btn"
                  aria-haspopup="menu"
                  aria-expanded={isUserMenuOpen}
                  aria-label="사용자 메뉴"
                  onClick={() => setIsUserMenuOpen((open) => !open)}
                >
                  <div
                    className="user-profile-icon"
                    style={{
                      backgroundColor: avatarColor.backgroundColor,
                      color: avatarColor.textColor,
                    }}
                    aria-hidden="true"
                  >
                    {userInitials}
                  </div>
                  <div className="user-profile-info">
                    <strong>{session?.member.accountId}</strong>
                  </div>
                  <ChevronDown
                    size={15}
                    strokeWidth={2.2}
                    className={clsx('user-menu-chevron', isUserMenuOpen && 'is-open')}
                    aria-hidden="true"
                  />
                </button>
                {isUserMenuOpen ? (
                  <div className="user-menu-panel" role="menu" aria-label="사용자 메뉴">
                    <div className="user-menu-identity">
                      <div
                        className="user-menu-avatar"
                        style={{
                          backgroundColor: avatarColor.backgroundColor,
                          color: avatarColor.textColor,
                        }}
                        aria-hidden="true"
                      >
                        {userInitials}
                      </div>
                      <div className="user-menu-text">
                        <strong>{session?.member.accountId}</strong>
                        <span>{session?.member.name}</span>
                      </div>
                    </div>
                    <NavLink
                      to="/profile"
                      role="menuitem"
                      className={({ isActive }) => clsx('user-menu-item', isActive && 'is-active')}
                    >
                      <UserRound size={15} strokeWidth={2} aria-hidden="true" />
                      <span>프로필</span>
                    </NavLink>
                    <NavLink
                      to="/settings"
                      role="menuitem"
                      className={({ isActive }) => clsx('user-menu-item', isActive && 'is-active')}
                    >
                      <Settings size={15} strokeWidth={2} aria-hidden="true" />
                      <span>환경 설정</span>
                    </NavLink>
                    <button
                      type="button"
                      role="menuitem"
                      className="user-menu-item is-danger"
                      onClick={() => void handleLogout()}
                      disabled={isLoggingOut}
                    >
                      <LogOut size={15} strokeWidth={2} aria-hidden="true" />
                      <span>로그아웃</span>
                    </button>
                  </div>
                ) : null}
              </div>
            </Header.Navi>
          </div>
        </Header.Container>
      </Header>

      <div id="container" className="krds-service-layout">
        <div className="krds-service-layout-body inner in-between">
          <SideNavigation
            aria-label="사이드 메뉴"
            className="krds-service-layout-navigation"
            onClickCapture={(event) => {
              const target = event.target as HTMLElement;
              const anchor = target.closest('a') as HTMLAnchorElement | null;
              if (!anchor) {
                return;
              }
              handleRouteLinkClick(event, anchor);
            }}
          >
            <SideNavigation.Menu id="service-side-menu">
              {navigation.map((item) => {
                if (isLeafItem(item)) {
                  const isCurrent =
                    location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);

                  return (
                    <SideNavigation.Item key={item.to} active={isCurrent}>
                      <SideNavigation.Link
                        href={item.to}
                        current={isCurrent}
                        className={isCurrent ? 'selected active' : undefined}
                      >
                        {item.label}
                      </SideNavigation.Link>
                    </SideNavigation.Item>
                  );
                }

                const expanded =
                  hasActiveChild(location.pathname, item) || openGroups[item.label] === true;
                const submenuId = `side-nav-${toDomId(item.label)}`;

                return (
                  <SideNavigation.Item key={item.label} active={expanded}>
                    <SideNavigation.Toggle
                      active={expanded}
                      expanded={expanded}
                      className={expanded ? 'selected' : undefined}
                      onClick={() =>
                        setOpenGroups((current) => ({
                          ...current,
                          [item.label]: !(
                            hasActiveChild(location.pathname, item) || current[item.label] === true
                          ),
                        }))
                      }
                      aria-controls={submenuId}
                    >
                      {item.label}
                    </SideNavigation.Toggle>
                    {expanded ? (
                      <SideNavigation.SubMenu id={submenuId}>
                        {item.children.map((child) => {
                          const isCurrent =
                            location.pathname === child.to ||
                            location.pathname.startsWith(`${child.to}/`);

                          return (
                            <SideNavigation.SubItem key={child.to} active={isCurrent}>
                              <SideNavigation.Link
                                href={child.to}
                                current={isCurrent}
                                className={isCurrent ? 'selected' : undefined}
                              >
                                {child.label}
                              </SideNavigation.Link>
                            </SideNavigation.SubItem>
                          );
                        })}
                      </SideNavigation.SubMenu>
                    ) : null}
                  </SideNavigation.Item>
                );
              })}
            </SideNavigation.Menu>
          </SideNavigation>

          <div
            className="krds-service-layout-content contents"
            onClickCapture={(event) => {
              const target = event.target as HTMLElement;
              const anchor = target.closest('.krds-breadcrumb-wrap a') as HTMLAnchorElement | null;
              if (!anchor) {
                return;
              }
              handleRouteLinkClick(event, anchor);
            }}
          >
            {activeFetchCount > 0 ? (
              <div
                className="global-loading-spinner is-overlay"
                aria-label="로딩 중"
                role="status"
              >
                <Spinner />
              </div>
            ) : null}
            {logoutError ? (
              <CriticalAlert alerts={[{ variant: 'danger', message: logoutError }]} />
            ) : null}
            <Breadcrumb items={breadcrumbItems} ariaLabel="브래드크럼" />
            <main id="main-content" className="krds-service-layout-main conts-area">
              <Outlet />
            </main>
          </div>
        </div>
      </div>
      <footer id="krds-footer">
        <div className="inner">
          <div className="f-btm">
            <div className="f-btm-text">
              <p className="f-copy">© 2026 MY WORKS. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
