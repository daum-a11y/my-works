import { useMemo } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import styles from "./AppShell.module.css";

const baseNavigation = [
  { to: "/dashboard", label: "대시보드", group: "운영 현황" },
  { to: "/reports", label: "업무보고", group: "업무보고" },
  { to: "/projects", label: "프로젝트", group: "프로젝트 관리" },
  { to: "/tracking", label: "트래킹", group: "프로젝트 관리" },
  { to: "/resource", label: "리소스", group: "리소스" },
  { to: "/stats/qa", label: "통계 · QA", group: "통계" },
  { to: "/stats/monitoring", label: "통계 · 모니터링", group: "통계" },
  { to: "/profile", label: "프로필", group: "계정" },
] as const;

const adminNavigation = [
  { to: "/admin/reports", label: "전체 업무검색", group: "관리자" },
  { to: "/admin/type", label: "업무 타입", group: "관리자" },
  { to: "/admin/group", label: "서비스 그룹", group: "관리자" },
  { to: "/admin/members", label: "사용자 관리", group: "관리자" },
] as const;

export function AppShell() {
  const location = useLocation();
  const { session, logout } = useAuth();
  const isAdmin = session?.member.role === "admin";

  const navigation = useMemo(
    () => (isAdmin ? [...baseNavigation, ...adminNavigation] : [...baseNavigation]),
    [isAdmin],
  );

  const currentItem = useMemo(
    () =>
      navigation.find(
        (item) => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`),
      ) ?? navigation[0],
    [location.pathname, navigation],
  );

  const groups = useMemo(() => Array.from(new Set(navigation.map((item) => item.group))), [navigation]);

  return (
    <>
      <a href="#main-content" className="skipLink">
        본문으로 바로가기
      </a>
      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <div className={styles.brand}>
            <span className={styles.brandKicker}>LINKAGELAB A11Y WORKS</span>
            <strong>운영 업무관리</strong>
            <p className={styles.brandSummary}>
              개인 보고 흐름은 유지하고, 관리자 도구는 별도 메뉴로 분리한 운영 콘솔입니다.
            </p>
          </div>

          <nav aria-label="주요 메뉴" className={styles.nav}>
            {groups.map((group) => (
              <div key={group} className={styles.navGroup}>
                <p>{group}</p>
                <ul>
                  {navigation
                    .filter((item) => item.group === group)
                    .map((item) => (
                      <li key={item.to}>
                        <NavLink
                          to={item.to}
                          className={({ isActive }) => (isActive ? styles.activeLink : styles.link)}
                        >
                          {item.label}
                        </NavLink>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        <div className={styles.content}>
          <header className={styles.header}>
            <div className={styles.headerTitle}>
              <span className={styles.routeLabel}>{currentItem?.group ?? "업무관리"}</span>
              <h1 className={styles.pageTitle}>{currentItem?.label ?? "업무관리"}</h1>
            </div>
            <div className={styles.headerMeta}>
              <div className={styles.profile}>
                <strong>{session?.member.name}</strong>
                <span>{session?.member.legacyUserId}</span>
              </div>
              <button type="button" onClick={() => void logout()}>
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
