import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageSection } from "../../components/ui/PageSection";
import { opsDataClient } from "../../lib/data-client";
import { type PageStatus, type ProjectPage } from "../../lib/domain";
import { useAuth } from "../auth/AuthContext";
import styles from "./shared.module.css";

interface MonitoringRow {
  page: ProjectPage;
  projectName: string;
  platform: string;
  assigneeName: string;
}

interface MonthlyMonitoringRow {
  monthKey: string;
  label: string;
  count: number;
  improved: number;
  attention: number;
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function monthKeyFromDate(value: string): string {
  return value.slice(0, 7);
}

function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
  }).format(new Date(year, month - 1, 1));
}

function buildMonthRange(monthKeys: string[]): string[] {
  if (!monthKeys.length) {
    return [];
  }

  const uniqueKeys = [...new Set(monthKeys)].sort();
  const [startYear, startMonth] = uniqueKeys[0].split("-").map(Number);
  const [endYear, endMonth] = uniqueKeys[uniqueKeys.length - 1].split("-").map(Number);
  const range: string[] = [];
  let cursor = new Date(startYear, startMonth - 1, 1);
  const end = new Date(endYear, endMonth - 1, 1);

  while (cursor <= end) {
    range.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`);
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }

  return range;
}

function isAttentionStatus(status: PageStatus): boolean {
  return status === "미개선" || status === "일부" || status === "중지";
}

export function MonitoringStatsPage() {
  const { session } = useAuth();
  const member = session?.member;

  const monitoringQuery = useQuery({
    queryKey: ["monitoring-detail", member?.id],
    queryFn: async () => {
      const [pages, projects, members] = await Promise.all([
        opsDataClient.getAllProjectPages(),
        opsDataClient.getProjects(),
        opsDataClient.getMembers(),
      ]);
      const projectsById = new Map(projects.map((project) => [project.id, project]));
      const membersById = new Map(members.map((item) => [item.id, item.name]));

      return pages
        .filter((page) => page.monitoringInProgress)
        .map((page) => ({
          page,
          projectName: projectsById.get(page.projectId)?.name ?? "미분류 프로젝트",
          platform: projectsById.get(page.projectId)?.platform ?? "-",
          assigneeName: page.ownerMemberId ? membersById.get(page.ownerMemberId) ?? "미지정" : "미지정",
        }))
        .sort((left, right) => new Date(right.page.updatedAt).getTime() - new Date(left.page.updatedAt).getTime());
    },
    enabled: Boolean(member),
  });

  const monitoringRows = useMemo<MonitoringRow[]>(() => monitoringQuery.data ?? [], [monitoringQuery.data]);
  const monthlyRows = useMemo<MonthlyMonitoringRow[]>(() => {
    if (!monitoringRows.length) {
      return [];
    }

    const grouped = new Map<string, { count: number; improved: number; attention: number }>();
    const monthKeys = monitoringRows.map((row) => monthKeyFromDate(row.page.updatedAt));

    for (const row of monitoringRows) {
      const monthKey = monthKeyFromDate(row.page.updatedAt);
      const current = grouped.get(monthKey) ?? { count: 0, improved: 0, attention: 0 };
      current.count += 1;
      if (row.page.trackStatus === "개선") {
        current.improved += 1;
      }
      if (isAttentionStatus(row.page.trackStatus)) {
        current.attention += 1;
      }
      grouped.set(monthKey, current);
    }

    return buildMonthRange(monthKeys).map((monthKey) => ({
      monthKey,
      label: formatMonthLabel(monthKey),
      count: grouped.get(monthKey)?.count ?? 0,
      improved: grouped.get(monthKey)?.improved ?? 0,
      attention: grouped.get(monthKey)?.attention ?? 0,
    }));
  }, [monitoringRows]);
  const maxCount = monthlyRows.reduce((max, row) => Math.max(max, row.count), 1);

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <p className={styles.kicker}>모니터링 통계</p>
        <h1 className={styles.title}>월별 차트, 월별 표, 하단 상세 목록으로 모니터링을 봅니다.</h1>
        <p className={styles.lead}>현재 스키마에서 확인 가능한 수정 시각 기준으로 월별 분포를 맞췄습니다.</p>
        <p className={styles.summaryLine}>
          총 {monitoringRows.length}개 · 개선 {monitoringRows.filter((row) => row.page.trackStatus === "개선").length}개 ·
          주의 {monitoringRows.filter((row) => isAttentionStatus(row.page.trackStatus)).length}개
        </p>
      </header>

      <PageSection title="월별 차트" description="모니터링 수정 시각을 기준으로 월별 분포를 확인합니다.">
        <div className={styles.chartSurface}>
          {monthlyRows.length ? (
            <div className={styles.chart} role="img" aria-label="모니터링 월별 차트">
              {monthlyRows.map((row) => {
                const height = maxCount ? Math.max((row.count / maxCount) * 100, row.count ? 14 : 8) : 8;

                return (
                  <div key={row.monthKey} className={styles.chartColumn}>
                    <div className={styles.chartTrack}>
                      <div className={styles.chartBar} style={{ height: `${height}%` }}>
                        <strong className={styles.chartValue}>{row.count}</strong>
                      </div>
                    </div>
                    <span className={styles.chartLabel}>{row.label}</span>
                    <span className={styles.chartNote}>
                      개선 {row.improved}개 · 주의 {row.attention}개
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className={styles.empty}>모니터링 데이터가 없습니다.</p>
          )}
        </div>
      </PageSection>

      <PageSection title="월별 표" description="월별 항목 수와 개선/주의 건수를 함께 표시합니다.">
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <caption className={styles.srOnly}>모니터링 월별 표</caption>
            <thead>
              <tr>
                <th scope="col">월</th>
                <th scope="col">항목 수</th>
                <th scope="col">개선</th>
                <th scope="col">주의</th>
              </tr>
            </thead>
            <tbody>
              {monthlyRows.map((row) => (
                <tr key={row.monthKey}>
                  <td>{row.label}</td>
                  <td className="tabularNums">{row.count}</td>
                  <td className="tabularNums">{row.improved}</td>
                  <td className="tabularNums">{row.attention}</td>
                </tr>
              ))}
              {!monthlyRows.length ? (
                <tr>
                  <td colSpan={4} className={styles.empty}>
                    월별 데이터가 없습니다.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </PageSection>

      <PageSection title="하단 상세 목록" description="진행중 모니터링 페이지를 상세 표로 확인합니다.">
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <caption className={styles.srOnly}>모니터링 상세 목록</caption>
            <thead>
              <tr>
                <th scope="col">플랫폼</th>
                <th scope="col">앱 / 페이지</th>
                <th scope="col">담당자</th>
                <th scope="col">상태</th>
                <th scope="col">메모</th>
                <th scope="col">수정 시각</th>
                <th scope="col">보고서</th>
              </tr>
            </thead>
            <tbody>
              {monitoringRows.map((row) => (
                <tr key={row.page.id}>
                  <td>
                    <span className="uiPlatformBadge">{row.platform}</span>
                  </td>
                  <td>
                    <div className={styles.stackCell}>
                      <strong>{row.projectName}</strong>
                      <span>{row.page.title}</span>
                    </div>
                  </td>
                  <td>{row.assigneeName}</td>
                  <td>
                    <span className="uiStatusBadge" data-status={row.page.trackStatus}>
                      {row.page.trackStatus}
                    </span>
                  </td>
                  <td>{row.page.note || "-"}</td>
                  <td className="tabularNums">{formatDateTime(row.page.updatedAt)}</td>
                  <td>
                    {row.page.url ? (
                      <a href={row.page.url} target="_blank" rel="noreferrer" className={styles.link}>
                        열기
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}
              {!monitoringRows.length ? (
                <tr>
                  <td colSpan={7} className={styles.empty}>
                    진행중 모니터링 항목이 없습니다.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </PageSection>
    </div>
  );
}
