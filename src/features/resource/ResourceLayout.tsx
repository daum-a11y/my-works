import { NavLink, Outlet } from "react-router-dom";
import styles from "./ResourcePage.module.css";

const tabs = [
  { to: "/resource/summary", label: "일간 요약", note: "사용자별 작성 현황과 당일 업무" },
  { to: "/resource/type", label: "타입별 집계", note: "업무 유형별 건수와 시간" },
  { to: "/resource/svc", label: "그룹별 집계", note: "서비스 그룹과 프로젝트 단위 집계" },
  { to: "/resource/month", label: "월간 판독", note: "월간 작성률과 일자별 충족 상태" },
] as const;

export function ResourceLayout() {
  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerCopy}>
          <p className={styles.kicker}>Resource Ledger</p>
          <h1>리소스 판독</h1>
          <p>요약, 유형, 그룹, 월간 흐름을 같은 표면에서 보지 말고 목적별 작업판으로 분리합니다.</p>
        </div>
      </header>
      <div className={styles.layout}>
        <nav className={styles.tabs} aria-label="리소스 섹션">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) => (isActive ? `${styles.tab} ${styles.tabActive}` : styles.tab)}
            >
              <strong>{tab.label}</strong>
              <span>{tab.note}</span>
            </NavLink>
          ))}
        </nav>
        <div className={styles.content}>
          <Outlet />
        </div>
      </div>
    </section>
  );
}
