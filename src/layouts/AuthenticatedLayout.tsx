import { useEffect, useMemo, useState, type MouseEvent } from 'react';
import { useIsFetching } from '@tanstack/react-query';
import {
  Breadcrumb,
  CriticalAlert,
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
    ],
    [navigate],
  );

  function handleRouteLinkClick(event: MouseEvent<HTMLElement>, href?: string) {
    if (!href || !href.startsWith('/')) {
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
            <NavLink to="/dashboard" aria-label="MY WORKS 홈">
              <BrandLogo alt="MY WORKS" width={100} height={30} />
            </NavLink>
            <Header.Navi
              onClickCapture={async (event) => {
                const target = event.target as HTMLElement;
                const button = target.closest('button');
                if (!button || button.textContent?.trim() !== '로그아웃') {
                  return;
                }

                try {
                  setLogoutError('');
                  await logout();
                } catch (error) {
                  setLogoutError(
                    error instanceof Error ? error.message : '로그아웃 처리 중 오류가 발생했습니다.',
                  );
                }
              }}
            >
              <Header.NaviButton.MyGov
                label="사용자 메뉴"
                name={session?.member.accountId ?? ''}
                items={myGovItems}
              />
            </Header.Navi>
          </div>
        </Header.Container>
      </Header>

      <div id="container">
        <div className="inner in-between">
          <SideNavigation
            aria-label="사이드 메뉴"
            onClickCapture={(event) => {
              const target = event.target as HTMLElement;
              const anchor = target.closest('a');
              if (!anchor) {
                return;
              }
              handleRouteLinkClick(event, anchor.getAttribute('href') ?? undefined);
            }}
          >
            <SideNavigation.Title>메뉴</SideNavigation.Title>
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
                            hasActiveChild(location.pathname, item) ||
                            current[item.label] === true
                          ),
                        }))
                      }
                      aria-controls={submenuId}
                    >
                      {item.label}
                    </SideNavigation.Toggle>
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
                  </SideNavigation.Item>
                );
              })}
            </SideNavigation.Menu>
          </SideNavigation>

          <div
            className="contents"
            onClickCapture={(event) => {
              const target = event.target as HTMLElement;
              const anchor = target.closest('.krds-breadcrumb-wrap a');
              if (!anchor) {
                return;
              }
              handleRouteLinkClick(event, anchor.getAttribute('href') ?? undefined);
            }}
          >
            {activeFetchCount > 0 ? <GlobalLoadingSpinner overlay /> : null}
            {logoutError ? (
              <CriticalAlert alerts={[{ variant: 'danger', message: logoutError }]} />
            ) : null}
            <Breadcrumb items={breadcrumbItems} ariaLabel="브래드크럼" />
            <main id="main-content" className="conts-area">
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </>
  );
}
