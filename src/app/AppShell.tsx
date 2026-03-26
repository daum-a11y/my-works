import { useMemo } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  FileText, 
  Activity, 
  Layers, 
  Database, 
  Search,
  Settings,
  Shield,
  LogOut,
  ChevronRight,
  Users
} from "lucide-react";
import { useAuth } from "../features/auth/AuthContext";
import styles from "./AppShell.module.css";

type NavigationItem = {
  label: string;
  to?: string;
  children?: readonly { to: string; label: string }[];
};

const baseNavigation = [
  { to: "/dashboard", label: "업무 현황", icon: LayoutDashboard },
  { to: "/reports", label: "업무 보고", icon: FileText },
  { to: "/tracking", label: "모니터링 현황", icon: Activity },
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
  { to: "/reports/search" , label: "업무 검색", icon: Search },
] as const;

const adminNavigation = [
  { 
    label: "관리자 설정", 
    icon: Shield,
    children: [
      { to: "/admin/reports", label: "전체 업무 리스트" },
      { to: "/admin/members", label: "사용자 계정 관리" },
      { to: "/admin/type", label: "업무 타입 관리" },
      { to: "/admin/group", label: "서비스그룹 관리" },
    ]
  },
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

  const breadcrumbs = useMemo(() => {
    const parts = [{ label: "My Works", to: "/dashboard" }];
    
    if (location.pathname === "/settings/password") {
      parts.push({ label: "비밀번호 변경", to: "/settings/password" });
      return parts;
    }

    for (const item of navigation) {
      if (item.to && isCurrentPath(location.pathname, item.to)) {
        parts.push({ label: item.label, to: item.to });
        break;
      }

      if (item.children) {
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
                  {item.to ? (
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
                <div className={styles.profileIcon}><Users size={16} /></div>
                <div className={styles.profileInfo}>
                  <strong>{session?.member.name}</strong>
                  <span>{session?.member.legacyUserId}</span>
                </div>
              </div>
              <NavLink
                to="/settings/password"
                className={({ isActive }) => (isActive ? styles.headerActionActive : styles.headerAction)}
                title="계정 설정"
              >
                <Settings size={18} />
              </NavLink>
              <button 
                type="button" 
                className={styles.headerButton} 
                onClick={() => void logout()}
                title="로그아웃"
              >
                <LogOut size={18} />
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
