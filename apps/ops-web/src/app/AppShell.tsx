import { useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import { Button } from "../components/ui/Button";
import styles from "./AppShell.module.css";

const navigation = [
  { to: "/dashboard", label: "대시보드", group: "운영 현황" },
  { to: "/reports", label: "업무보고", group: "운영 입력" },
  { to: "/projects", label: "프로젝트", group: "프로젝트 관리" },
  { to: "/tracking", label: "트래킹", group: "프로젝트 관리" },
  { to: "/reports/search", label: "개인 검색", group: "기타" },
  { to: "/stats/qa", label: "통계 · QA", group: "통계" },
  { to: "/stats/monitoring", label: "통계 · 모니터링", group: "통계" },
  { to: "/settings/password", label: "비밀번호 변경", group: "계정" },
];

export function AppShell() {
  const { session, logout } = useAuth();
  const location = useLocation();
  const currentItem = [...navigation]
    .sort((left, right) => right.to.length - left.to.length)
    .find(
      (item) => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`),
    );

  useEffect(() => {
    document.title = currentItem ? `My Works · ${currentItem.label}` : "My Works";
  }, [currentItem]);

  return (
    <div className={styles.layout}>
      <a href="#main-content" className="skipLink">
        본문으로 건너뛰기
      </a>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.brandKicker}>운영 콘솔</span>
          <strong>My Works</strong>
          <p className={styles.brandSummary}>업무보고와 프로젝트 상태를 빠르게 확인하고 수정합니다.</p>
        </div>
        <nav aria-label="주요 메뉴" className={styles.nav}>
          {Array.from(new Set(navigation.map((item) => item.group))).map((group) => (
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
                        <span>{item.label}</span>
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
            <p className={styles.routeLabel}>{currentItem?.group ?? "접근성팀 업무"}</p>
            <h1 className={styles.pageTitle}>{currentItem?.label ?? "My Works"}</h1>
          </div>
          <div className={styles.headerMeta}>
            <div className={styles.profile}>
              <strong>{session?.member.name}</strong>
              <span>{session?.member.legacyUserId}</span>
            </div>
            <Button tone="secondary" onPress={() => void logout()}>
              로그아웃
            </Button>
          </div>
        </header>
        <main id="main-content" className={styles.main} tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
