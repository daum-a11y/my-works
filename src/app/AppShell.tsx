import { useMemo, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  FileText, 
  Layers, 
  Database, 
  Search,
  Shield,
  BarChart3,
  ChevronRight
} from "lucide-react";
import { useAuth } from "../features/auth/AuthContext";
import styles from "./AppShell.module.css";

type NavigationItem = {
  label: string;
  to?: string;
  children?: readonly { to: string; label: string }[];
};

const baseNavigation = [
  { to: "/dashboard", label: "대시보드", icon: LayoutDashboard },
  { to: "/reports", label: "업무보고", icon: FileText },
  { to: "/projects", label: "프로젝트 관리", icon: Layers },
  { 
    label: "리소스 현황", 
    icon: Database,
    children: [
      { to: "/resource/summary", label: "리소스 요약" },
      { to: "/resource/type", label: "업무유형 집계" },
      { to: "/resource/svc", label: "서비스그룹 집계" },
      { to: "/resource/month", label: "월간 종합현황" },
    ] 
  },
  {
    label: "통계",
    icon: BarChart3,
    children: [
      { to: "/stats/qa", label: "QA" },
      { to: "/stats/monitoring", label: "모니터링" },
    ]
  },
  { to: "/reports/search" , label: "업무보고 검색", icon: Search },
] as const;

const adminNavigation = [
  {
    label: "관리자 설정",
    icon: Shield,
    children: [
      { to: "/admin/summary", label: "관리자 요약" },
      { to: "/admin/reports", label: "전체 업무검색" },
      { to: "/admin/members", label: "사용자" },
      { to: "/admin/type", label: "업무 타입 관리" },
      { to: "/admin/group", label: "서비스그룹 관리" },
    ],
  },
] as const;

function isCurrentPath(pathname: string, to: string) {
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function AppShell() {
  const location = useLocation();
  const { session, logout } = useAuth();
  const isAdmin = session?.member.role === "admin";
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string>("");

  const navigation = useMemo(
    () => (isAdmin ? [...baseNavigation, ...adminNavigation] : [...baseNavigation]),
    [isAdmin],
  );

  const breadcrumbs = useMemo(() => {
    const parts = [{ label: "My Works", to: "/dashboard" }];
    
    if (location.pathname === "/profile" || location.pathname === "/password-change") {
      parts.push({ label: "프로필", to: "/profile" });
      return parts;
    }

    for (const item of navigation) {
      if ("to" in item && item.to && isCurrentPath(location.pathname, item.to)) {
        parts.push({ label: item.label, to: item.to });
        break;
      }

      if ("children" in item && item.children) {
        for (const child of item.children) {
          if (isCurrentPath(location.pathname, child.to)) {
            parts.push({ label: item.label, to: "#" });
            parts.push({ label: child.label, to: child.to });
            return parts;
          }
        }
      }
    }

    return parts;
  }, [location.pathname, navigation]);

  async function handleLogout() {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);
    setLogoutError("");

    try {
      await logout();
    } catch (error) {
      setLogoutError(error instanceof Error ? error.message : "로그아웃에 실패했습니다.");
    } finally {
      setIsLoggingOut(false);
    }
  }

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
                <li key={item.label} className={styles.navItem}>
                  {"to" in item && item.to ? (
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
                        {"children" in item && item.children?.map((child: any) => (
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
                      <span className={i === breadcrumbs.length - 1 ? styles.lastCrumb : ""}>
                        {crumb.label}
                      </span>
                    </li>
                  ))}
                </ol>
              </nav>
            </div>
            <div className={styles.headerMeta}>
              <div className={styles.profile}>
                <div className={styles.profileIcon}>
                  {(session?.member?.legacyUserId || session?.member?.name || "").slice(0, 2)}
                </div>
                <div className={styles.profileInfo}>
                  <strong>{session?.member.name}</strong>
                  <span>{session?.member.legacyUserId}</span>
                </div>
              </div>
              <div className={styles.headerActions}>
                <NavLink
                  to="/profile"
                  className={({ isActive }) => (isActive ? styles.headerActionActive : styles.headerAction)}
                  title="프로필"
                  aria-label="프로필"
                >
                  <span className={styles.headerActionContent}>
                    <span className={styles.headerActionLabel}>프로필</span>
                  </span>
                </NavLink>
                <button 
                  type="button" 
                  className={`${styles.headerButton} ${styles.headerButtonDanger}`}
                  onClick={() => void handleLogout()}
                  aria-label="로그아웃"
                  title="로그아웃"
                  disabled={isLoggingOut}
                  aria-busy={isLoggingOut || undefined}
                >
                  <span className={styles.headerActionContent}>
                    <span className={styles.headerActionLabel}>
                      {isLoggingOut ? "로그아웃 중…" : "로그아웃"}
                    </span>
                  </span>
                </button>
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
