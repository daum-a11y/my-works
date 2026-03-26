import { useMemo } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import styles from "./AppShell.module.css";

type NavigationItem = {
  label: string;
  to?: string;
  children?: readonly { to: string; label: string }[];
};

const baseNavigation: readonly NavigationItem[] = [
  { to: "/dashboard", label: "업무 현황" },
  { to: "/reports", label: "업무보고 작성/리스트" },
  { to: "/tracking", label: "모니터링 트래킹" },
  { to: "/projects", label: "프로젝트 관리" },
  { to: "/resource/summary", label: "리소스 판독: 요약" },
  { to: "/resource/type", label: "리소스 판독: 업무유형" },
  { to: "/resource/svc", label: "리소스 판독: 서비스그룹" },
  { to: "/resource/month", label: "리소스 판독: 월간" },
  { to: "/reports/search", label: "업무보고 검색" },
] as const;

const adminNavigation: readonly NavigationItem[] = [
  { to: "/admin/reports", label: "관리자: 전체 업무" },
  { to: "/admin/type", label: "관리자: 업무 타입" },
  { to: "/admin/group", label: "관리자: 서비스 그룹" },
  { to: "/admin/members", label: "관리자: 사용자 관리" },
] as const;

function isCurrentPath(pathname: string, to: string) {
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function AppShell() {
  const location = useLocation();
  const { session, logout } = useAuth();
  const isAdmin = session?.member.role === "admin";

  const navigation = useMemo(
    () => (isAdmin ? [...baseNavigation, ...adminNavigation] : [...baseNavigation]),
    [isAdmin],
  );

  const currentLabel = useMemo(() => {
    if (location.pathname === "/settings/password") {
      return "개인정보 수정";
    }

    for (const item of navigation) {
      if (item.to && isCurrentPath(location.pathname, item.to)) {
        return item.label;
      }

      for (const child of item.children ?? []) {
        if (isCurrentPath(location.pathname, child.to)) {
          return child.label;
        }
      }
    }

    return "My Works";
  }, [location.pathname, navigation]);

  return (
    <>
      <a href="#main-content" className="skipLink">
        본문으로 바로가기
      </a>
      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <div className={styles.brand}>
            <strong>My Works</strong>
          </div>

          <nav aria-label="주요 메뉴" className={styles.nav}>
            <ul className={styles.navList}>
              {navigation.map((item) => (
                <li key={item.label}>
                  {item.to ? (
                    <NavLink
                      to={item.to}
                      className={({ isActive }) => (isActive ? styles.activeLink : styles.link)}
                    >
                      {item.label}
                    </NavLink>
                  ) : (
                    <>
                      <span className={styles.sectionLabel}>{item.label}</span>
                      <ul className={styles.subNavList}>
                        {item.children?.map((child) => (
                          <li key={child.to}>
                            <NavLink
                              to={child.to}
                              className={({ isActive }) => (isActive ? styles.activeLink : styles.link)}
                            >
                              {child.label}
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <div className={styles.content}>
          <header className={styles.header}>
            <div className={styles.headerTitle}>
              <h1 className={styles.pageTitle}>{currentLabel}</h1>
            </div>
            <div className={styles.headerMeta}>
              <div className={styles.profile}>
                <strong>{session?.member.name}</strong>
                <span>{session?.member.legacyUserId}</span>
              </div>
              <NavLink
                to="/settings/password"
                className={({ isActive }) => (isActive ? styles.headerActionActive : styles.headerAction)}
              >
                계정 설정
              </NavLink>
              <button type="button" className={styles.headerButton} onClick={() => void logout()}>
                로그아웃
              </button>
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
