import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
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
  reportUrl: string;
}

interface MonthlyMonitoringRow {
  monthKey: string;
  label: string;
  count: number;
  sent: number;
  unsent: number;
  stopped: number;
  fullFix: number;
  partialFix: number;
}

interface MonitoringSection {
  title: string;
  rows: MonitoringRow[];
}

function parseIssueCount(note: string, key: "highest" | "high" | "normal") {
  const matched = note.match(new RegExp(`${key}:\\s*(\\d+)`));
  return matched ? matched[1] : "-";
}

function hasAgitDate(note: string) {
  return /agit_date:\s*\d{4}-\d{2}-\d{2}/.test(note);
}

function formatTrackStatus(value: PageStatus) {
  switch (value) {
    case "개선":
      return "전체 수정";
    case "일부":
      return "일부 수정";
    case "중지":
      return "중지";
    case "미개선":
    default:
      return "미수정";
  }
}

function monthKeyFromDate(value: string): string {
  return value.slice(0, 7);
}

function monthKeyFromMonitoringMonth(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 4) {
    return `20${digits.slice(0, 2)}-${digits.slice(2, 4)}`;
  }
  return "";
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

function isStoppedStatus(status: PageStatus): boolean {
  return status === "중지";
}

function isFullFixStatus(status: PageStatus): boolean {
  return status === "개선";
}

function isPartialFixStatus(status: PageStatus): boolean {
  return status === "일부";
}

function sortRows(left: MonitoringRow, right: MonitoringRow) {
  return new Date(right.page.updatedAt).getTime() - new Date(left.page.updatedAt).getTime();
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
        .filter((page) => Boolean(page.monitoringMonth))
        .map((page) => ({
          page,
          projectName: projectsById.get(page.projectId)?.name ?? "미분류 프로젝트",
          platform: projectsById.get(page.projectId)?.platform ?? "-",
          assigneeName: page.ownerMemberId ? membersById.get(page.ownerMemberId) ?? "미지정" : "미지정",
          reportUrl: projectsById.get(page.projectId)?.reportUrl ?? page.url,
        }))
        .sort(sortRows);
    },
    enabled: Boolean(member),
  });

  const monitoringRows = useMemo<MonitoringRow[]>(() => monitoringQuery.data ?? [], [monitoringQuery.data]);
  const activeRows = useMemo(() => {
    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    const previous = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const previousMonth = `${previous.getFullYear()}-${String(previous.getMonth() + 1).padStart(2, "0")}`;

    return monitoringRows.filter((row) => {
      const monthKey = monthKeyFromMonitoringMonth(row.page.monitoringMonth);
      return (monthKey === currentMonth || monthKey === previousMonth)
        && !hasAgitDate(row.page.note)
        && row.page.trackStatus !== "중지";
    });
  }, [monitoringRows]);

  const monthlyRows = useMemo<MonthlyMonitoringRow[]>(() => {
    if (!monitoringRows.length) {
      return [];
    }

    const grouped = new Map<
      string,
      { count: number; sent: number; unsent: number; stopped: number; fullFix: number; partialFix: number }
    >();
    const monthKeys = monitoringRows
      .map((row) => monthKeyFromMonitoringMonth(row.page.monitoringMonth))
      .filter(Boolean);

    for (const row of monitoringRows) {
      const monthKey = monthKeyFromMonitoringMonth(row.page.monitoringMonth);
      if (!monthKey) {
        continue;
      }
      const current = grouped.get(monthKey) ?? {
        count: 0,
        sent: 0,
        unsent: 0,
        stopped: 0,
        fullFix: 0,
        partialFix: 0,
      };

      current.count += 1;
      current.sent += row.page.trackStatus !== "미개선" && !isStoppedStatus(row.page.trackStatus) ? 1 : 0;
      current.unsent += row.page.trackStatus === "미개선" ? 1 : 0;
      current.stopped += isStoppedStatus(row.page.trackStatus) ? 1 : 0;
      current.fullFix += isFullFixStatus(row.page.trackStatus) ? 1 : 0;
      current.partialFix += isPartialFixStatus(row.page.trackStatus) ? 1 : 0;
      grouped.set(monthKey, current);
    }

    return buildMonthRange(monthKeys).map((monthKey) => {
      const current = grouped.get(monthKey) ?? {
        count: 0,
        sent: 0,
        unsent: 0,
        stopped: 0,
        fullFix: 0,
        partialFix: 0,
      };

      return {
        monthKey,
        label: formatMonthLabel(monthKey),
        ...current,
      };
    });
  }, [monitoringRows]);

  const detailSections = useMemo<MonitoringSection[]>(() => {
    const today = new Date();
    const sections: MonitoringSection[] = [
      {
        title: "진행중 모니터링",
        rows: activeRows,
      },
    ];

    for (let offset = 0; offset < 5; offset += 1) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() - offset, 1);
      const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`;
      const monthLabel = formatMonthLabel(monthKey);

      sections.push({
        title: `${monthLabel} 진행한 모니터링`,
        rows: monitoringRows
          .filter((row) => monthKeyFromMonitoringMonth(row.page.monitoringMonth) === monthKey)
          .sort(sortRows),
      });
    }

    return sections;
  }, [activeRows, monitoringRows]);

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <h1 className={styles.title}>모니터링 통계</h1>
      </header>

      <PageSection title="최근 월별 모니터링 통계">
        <div className={styles.chartSurface}>
          {monthlyRows.length ? (
            <div className={styles.chartFrame} role="img" aria-label="모니터링 월별 차트">
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={monthlyRows} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="count" name="총모니터링수" stroke="#2563eb" fill="#93c5fd" />
                  <Area type="monotone" dataKey="sent" name="전달 수" stroke="#16a34a" fill="#86efac" />
                  <Area type="monotone" dataKey="fullFix" name="완전 개선수" stroke="#f59e0b" fill="#fde68a" />
                  <Area type="monotone" dataKey="partialFix" name="일부 개선수" stroke="#dc2626" fill="#fecaca" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className={styles.empty}>모니터링 데이터가 없습니다.</p>
          )}
        </div>
      </PageSection>

      <PageSection title="모니터링 통계 테이블">
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <caption className={styles.srOnly}>모니터링 월별 표</caption>
            <thead>
              <tr>
                <th scope="col">해당월</th>
                <th scope="col">총 진행</th>
                <th scope="col">전달</th>
                <th scope="col">미전달</th>
                <th scope="col">중지</th>
                <th scope="col">전체 수정</th>
                <th scope="col">일부 수정</th>
              </tr>
            </thead>
            <tbody>
              {monthlyRows.map((row) => (
                <tr key={row.monthKey}>
                  <td>{row.label}</td>
                  <td className="tabularNums">{row.count}</td>
                  <td className="tabularNums">{row.sent}</td>
                  <td className="tabularNums">{row.unsent}</td>
                  <td className="tabularNums">{row.stopped}</td>
                  <td className="tabularNums">{row.fullFix}</td>
                  <td className="tabularNums">{row.partialFix}</td>
                </tr>
              ))}
              {!monthlyRows.length ? (
                <tr>
                  <td colSpan={7} className={styles.empty}>
                    월별 데이터가 없습니다.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </PageSection>

      <PageSection title="모니터링 목록">
        <div className={styles.detailGrid}>
          {detailSections.map((section) => (
            <article key={section.title} className={styles.detailPanel}>
              <div>
                <h3 className={styles.detailTitle}>{section.title}</h3>
              </div>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <caption className={styles.srOnly}>{section.title}</caption>
                  <thead>
                    <tr>
                      <th scope="col">플랫폼</th>
                      <th scope="col">앱이름</th>
                      <th scope="col">페이지</th>
                      <th scope="col">담당자</th>
                      <th scope="col">상태</th>
                      <th scope="col">수정된 highest 이슈수</th>
                      <th scope="col">수정된 high 이슈수</th>
                      <th scope="col">수정된 normal 이슈수</th>
                      <th scope="col">비고</th>
                      <th scope="col">보고서</th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.rows.map((row) => (
                    <tr key={row.page.id}>
                        <td>
                          <span className="uiPlatformBadge">{row.platform}</span>
                        </td>
                        <td>{row.projectName}</td>
                        <td>{row.page.title}</td>
                        <td>{row.assigneeName}</td>
                        <td>
                          <span className="uiStatusBadge" data-status={row.page.trackStatus}>
                            {formatTrackStatus(row.page.trackStatus)}
                          </span>
                        </td>
                        <td>{parseIssueCount(row.page.note, "highest")}</td>
                        <td>{parseIssueCount(row.page.note, "high")}</td>
                        <td>{parseIssueCount(row.page.note, "normal")}</td>
                        <td>{row.page.note || "-"}</td>
                        <td>
                          {row.reportUrl ? (
                            <a href={row.reportUrl} target="_blank" rel="noreferrer" className={styles.link}>
                              Click
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    ))}
                    {!section.rows.length ? (
                      <tr>
                        <td colSpan={10} className={styles.empty}>
                          진행한 것이 없습니다.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </article>
          ))}
        </div>
      </PageSection>
    </div>
  );
}
