import { NavLink, Outlet } from "react-router-dom";
import styles from "./ResourcePage.module.css";

const tabs = [
  { to: "/resource/summary", label: "요약" },
  { to: "/resource/type", label: "타입별 요약" },
  { to: "/resource/svc", label: "그룹별 요약" },
  { to: "/resource/month", label: "월간 리소스" },
];

export function ResourceLayout() {
  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>리소스</h1>
          <p>원본 구조에 맞춰 요약, 타입별, 그룹별, 월간 리소스를 탭 단위로 제공합니다.</p>
        </div>
        <nav className={styles.tabs} aria-label="리소스 탭">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) => (isActive ? `${styles.tab} ${styles.tabActive}` : styles.tab)}
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <Outlet />
    </section>
  );
}
