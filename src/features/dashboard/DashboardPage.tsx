import { useQuery } from "@tanstack/react-query";
import { opsDataClient } from "../../lib/data-client";
import { useAuth } from "../auth/AuthContext";
import styles from "./DashboardPage.module.css";

export function DashboardPage() {
  const { session } = useAuth();
  const member = session?.member;

  const dashboardQuery = useQuery({
    queryKey: ["dashboard", member?.id],
    queryFn: async () => opsDataClient.getDashboard(member!),
    enabled: Boolean(member),
  });

  const dashboard = dashboardQuery.data;
  const monitoring = dashboard?.monitoring ?? [];
  const qa = dashboard?.qa ?? [];

  return (
    <div className={styles.page}>
      <h1>Dashboard</h1>
      <section className={styles.tableSection}>
        <h2>진행중 모니터링 목록</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <caption className="srOnly">진행중 모니터링 목록</caption>
            <thead>
              <tr>
                <th scope="col">플랫폼</th>
                <th scope="col">앱이름</th>
                <th scope="col">내용</th>
                <th scope="col">보고서</th>
              </tr>
            </thead>
            <tbody>
              {monitoring.map((item) => (
                <tr key={item.pageId}>
                  <td>
                    <span className="uiPlatformBadge">{item.platform}</span>
                  </td>
                  <td>{item.projectName}</td>
                  <td>{item.pageTitle || "-"}</td>
                  <td>
                    {item.reportUrl ? (
                      <a href={item.reportUrl} target="_blank" rel="noreferrer" className={styles.link}>
                        Click
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}
              {!monitoring.length ? (
                <tr>
                  <td colSpan={4} className={styles.empty}>
                    진행중 모니터링 항목이 없습니다.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.tableSection}>
        <h2>진행중 QA 목록</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <caption className="srOnly">진행중 QA 목록</caption>
            <thead>
              <tr>
                <th scope="col">플랫폼</th>
                <th scope="col">앱이름</th>
                <th scope="col">리포터</th>
                <th scope="col">종료 예정</th>
                <th scope="col">보고서</th>
              </tr>
            </thead>
            <tbody>
              {qa.map((item) => (
                <tr key={item.pageId}>
                  <td>
                    <span className="uiPlatformBadge">{item.platform}</span>
                  </td>
                  <td>{item.projectName}</td>
                  <td>{item.ownerName}</td>
                  <td>{item.dueDate || "-"}</td>
                  <td>
                    {item.reportUrl ? (
                      <a href={item.reportUrl} target="_blank" rel="noreferrer" className={styles.link}>
                        Click
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}
              {!qa.length ? (
                <tr>
                  <td colSpan={5} className={styles.empty}>
                    진행중 QA 항목이 없습니다.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
