import { useEffect, useMemo, useState, type MouseEvent } from 'react';
import { useIsFetching } from '@tanstack/react-query';
import {
  Breadcrumb,
  Header,
  SideNavigation,
  SkipLink,
  type HeaderMyGovMenuItem,
} from 'krds-react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BrandLogo } from '../components/layout/BrandLogo';
import { useAuth } from '../auth/AuthContext';
import {
  adminNavigation,
  baseNavigation,
  setDocumentTitle,
  toBreadcrumbItems,
  type NavigationItem,
} from '../router/navigation';
import { GlobalLoadingSpinner } from '../components/layout/GlobalLoadingSpinner';
import './AuthenticatedLayout.css';

function toDomId(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, '-');
}

function isLeafItem(item: NavigationItem): item is Extract<NavigationItem, { to: string }> {
  return 'to' in item;
}

function hasActiveChild(pathname: string, item: Extract<NavigationItem, { children: readonly unknown[] }>) {
  return item.children.some((child) => pathname === child.to || pathname.startsWith(`${child.to}/`));
}

export function AuthenticatedLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { session, logout } = useAuth();
  const isAdmin = session?.member.role === 'admin';
  const activeFetchCount = useIsFetching();
  const [logoutError, setLogoutError] = useState('');
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

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
  }, [location.pathname]);

  const myGovItems = useMemo<HeaderMyGovMenuItem[]>(
    () => [
      {
        label: '프로필',
        href: '/profile',
        onClick(event) {
          event.preventDefault();
          navigate('/profile');
        },
      },
      {
        label: '로그아웃',
        async onClick() {
          try {
            setLogoutError('');
            await logout();
          } catch (error) {
            setLogoutError(
              error instanceof Error ? error.message : '로그아웃 처리 중 오류가 발생했습니다.',
            );
          }
        },
      },
    ],
    [logout, navigate],
  );

  function handleRouteLinkClick(event: MouseEvent<HTMLElement>, href?: string) {
    if (!href || !href.startsWith('/')) {
      return;
    }

    event.preventDefault();
    navigate(href);
  }

  return (
    <div className="authenticated-layout">
      <SkipLink targetId="main-content">본문으로 바로가기</SkipLink>

      <Header className="authenticated-layout__header">
        <Header.Container className="authenticated-layout__header-container">
          <NavLink to="/dashboard" aria-label="MY WORKS 홈" className="authenticated-layout__brand-link">
            <BrandLogo className="my-works-brand-logo" alt="MY WORKS" width={100} height={30} />
          </NavLink>
          <Header.Navi>
            <Header.NaviButton.MyGov
              label="사용자 메뉴"
              name={session?.member.accountId ?? ''}
              items={myGovItems}
            />
          </Header.Navi>
        </Header.Container>
      </Header>

      <div className="authenticated-layout__content-grid">
        <aside
          aria-label="주요 메뉴"
          className="authenticated-layout__sidebar"
          onClickCapture={(event) => {
            const target = event.target as HTMLElement;
            const anchor = target.closest('a');
            if (!anchor) {
              return;
            }
            handleRouteLinkClick(event, anchor.getAttribute('href') ?? undefined);
          }}
        >
          <SideNavigation>
            <SideNavigation.Title className="authenticated-layout__side-nav-title">메뉴</SideNavigation.Title>
            <SideNavigation.Menu>
              {navigation.map((item) => {
                if (isLeafItem(item)) {
                  const isCurrent =
                    location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);

                  return (
                    <SideNavigation.Item key={item.to} active={isCurrent}>
                      <SideNavigation.Link
                        href={item.to}
                        current={isCurrent}
                      >
                        {item.label}
                      </SideNavigation.Link>
                    </SideNavigation.Item>
                  );
                }

                const expanded = hasActiveChild(location.pathname, item) || openGroups[item.label] === true;
                const submenuId = `side-nav-${toDomId(item.label)}`;

                return (
                  <SideNavigation.Item key={item.label} active={expanded}>
                    <SideNavigation.Toggle
                      active={expanded}
                      expanded={expanded}
                      onClick={() =>
                        setOpenGroups((current) => ({
                          ...current,
                          [item.label]: !(hasActiveChild(location.pathname, item) || current[item.label] === true),
                        }))
                      }
                      aria-controls={submenuId}
                    >
                      {item.label}
                    </SideNavigation.Toggle>
                    <SideNavigation.SubMenu id={submenuId}>
                      <SideNavigation.Menu>
                        {item.children.map((child) => {
                          const isCurrent =
                            location.pathname === child.to ||
                            location.pathname.startsWith(`${child.to}/`);

                          return (
                            <SideNavigation.SubItem key={child.to} active={isCurrent}>
                              <SideNavigation.Link
                                href={child.to}
                                current={isCurrent}
                              >
                                {child.label}
                              </SideNavigation.Link>
                            </SideNavigation.SubItem>
                          );
                        })}
                      </SideNavigation.Menu>
                    </SideNavigation.SubMenu>
                  </SideNavigation.Item>
                );
              })}
            </SideNavigation.Menu>
          </SideNavigation>
        </aside>

        <div className="authenticated-layout__main-wrap">
          {activeFetchCount > 0 ? <GlobalLoadingSpinner overlay /> : null}
          <div className="authenticated-layout__inner">
            {logoutError ? (
              <p role="alert" aria-live="polite" className="authenticated-layout__status-message">
                {logoutError}
              </p>
            ) : null}
            <div
              className="authenticated-layout__breadcrumb"
              onClickCapture={(event) => {
                const target = event.target as HTMLElement;
                const anchor = target.closest('a');
                if (!anchor) {
                  return;
                }
                handleRouteLinkClick(event, anchor.getAttribute('href') ?? undefined);
              }}
            >
              <Breadcrumb items={breadcrumbItems} ariaLabel="브레드크럼" />
            </div>
            <main id="main-content" className="authenticated-layout__main">
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
