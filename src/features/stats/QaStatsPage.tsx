import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageSection } from "../../components/ui/PageSection";
import { opsDataClient } from "../../lib/data-client";
import { getCurrentMonth, shiftMonth } from "../resource/resource-shared";
import { useAuth } from "../auth/AuthContext";
import styles from "./shared.module.css";

interface QaProject {
  id: string;
  type1: string;
  name: string;
  platform: string;
  serviceGroupName: string;
  reportUrl: string;
  reporterName: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface MonthlyQaRow {
  monthKey: string;
  label: string;
  count: number;
  completed: number;
  active: number;
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

function sortProjects(left: QaProject, right: QaProject) {
  return right.endDate.localeCompare(left.endDate) || left.name.localeCompare(right.name);
}

function isQaProject(project: QaProject) {
  const normalizedType = project.type1.trim();
  return normalizedType === "QA" || normalizedType === "접근성테스트";
}

export function QaStatsPage() {
  const { session } = useAuth();
  const member = session?.member;
  const defaultEndMonth = getCurrentMonth();
  const defaultStartMonth = shiftMonth(defaultEndMonth, -5);

  const projectsQuery = useQuery({
    queryKey: ["qa-projects", member?.id],
    queryFn: async () => {
      const [projects, members, serviceGroups] = await Promise.all([
        opsDataClient.getProjects(),
        opsDataClient.getMembers(),
        opsDataClient.getServiceGroups(),
      ]);

      const membersById = new Map(members.map((item) => [item.id, item.name]));
      const serviceGroupsById = new Map(serviceGroups.map((item) => [item.id, item.name]));

      return projects
        .map((project) => ({
          id: project.id,
          type1: project.projectType1,
          name: project.name,
          platform: project.platform,
          serviceGroupName: project.serviceGroupId ? serviceGroupsById.get(project.serviceGroupId) ?? "-" : "-",
          reportUrl: project.reportUrl,
          reporterName: project.reporterMemberId ? membersById.get(project.reporterMemberId) ?? "미지정" : "미지정",
          startDate: project.startDate,
          endDate: project.endDate,
          isActive: Boolean(project.isActive),
        }))
        .filter(isQaProject)
        .sort(sortProjects);
    },
    enabled: Boolean(member),
  });

  const qaProjects = useMemo(() => projectsQuery.data ?? [], [projectsQuery.data]);
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [draftStartMonth, setDraftStartMonth] = useState(defaultStartMonth);
  const [draftEndMonth, setDraftEndMonth] = useState(defaultEndMonth);
  const [startMonth, setStartMonth] = useState(defaultStartMonth);
  const [endMonth, setEndMonth] = useState(defaultEndMonth);

  const handleSearch = () => {
    const nextStart = draftStartMonth && draftEndMonth && draftStartMonth > draftEndMonth ? draftEndMonth : draftStartMonth;
    const nextEnd = draftStartMonth && draftEndMonth && draftStartMonth > draftEndMonth ? draftStartMonth : draftEndMonth;
    setStartMonth(nextStart);
    setEndMonth(nextEnd);
    setDraftStartMonth(nextStart);
    setDraftEndMonth(nextEnd);
  };

  const handleReset = () => {
    setDraftStartMonth(defaultStartMonth);
    setDraftEndMonth(defaultEndMonth);
    setStartMonth(defaultStartMonth);
    setEndMonth(defaultEndMonth);
  };

  const appliedPeriodLabel = useMemo(() => {
    if (!startMonth && !endMonth) {
      return "전체 기간";
    }
    if (startMonth && endMonth) {
      return `${formatMonthLabel(startMonth)} ~ ${formatMonthLabel(endMonth)}`;
    }
    if (startMonth) {
      return `${formatMonthLabel(startMonth)} 이후`;
    }
    return `${formatMonthLabel(endMonth)} 이전`;
  }, [defaultEndMonth, defaultStartMonth, endMonth, startMonth]);

  const filteredProjects = useMemo(() => {
    return qaProjects.filter((project) => {
      const monthKey = monthKeyFromDate(project.endDate);
      if (startMonth && monthKey < startMonth) {
        return false;
      }
      if (endMonth && monthKey > endMonth) {
        return false;
      }
      return true;
    });
  }, [endMonth, qaProjects, startMonth]);

  const monthlyRows = useMemo<MonthlyQaRow[]>(() => {
    if (!filteredProjects.length) {
      return [];
    }

    const grouped = new Map<string, { count: number; completed: number; active: number }>();
    const monthKeys = filteredProjects.map((project) => monthKeyFromDate(project.endDate));

    for (const project of filteredProjects) {
      const monthKey = monthKeyFromDate(project.endDate);
      const current = grouped.get(monthKey) ?? { count: 0, completed: 0, active: 0 };
      current.count += 1;
      if (project.endDate <= today) {
        current.completed += 1;
      }
      if (project.endDate > today && project.startDate <= today) {
        current.active += 1;
      }
      grouped.set(monthKey, current);
    }

    return buildMonthRange(monthKeys).map((monthKey) => {
      const count = grouped.get(monthKey)?.count ?? 0;
      const completed = grouped.get(monthKey)?.completed ?? 0;
      const active = grouped.get(monthKey)?.active ?? 0;

      return {
        monthKey,
        label: formatMonthLabel(monthKey),
        count,
        completed,
        active,
      };
    });
  }, [filteredProjects, today]);

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <h1 className={styles.title}>QA 통계</h1>
      </header>

      <PageSection title="필터">
        <form
          className={styles.filterBar}
          onSubmit={(event) => {
            event.preventDefault();
            handleSearch();
          }}
        >
          <label className={styles.filterField}>
            <span>시작월</span>
            <input type="month" aria-label="QA 시작월" value={draftStartMonth} onChange={(event) => setDraftStartMonth(event.target.value)} />
          </label>
          <label className={styles.filterField}>
            <span>종료월</span>
            <input type="month" aria-label="QA 종료월" value={draftEndMonth} onChange={(event) => setDraftEndMonth(event.target.value)} />
          </label>
          <div className={styles.filterActions}>
            <button type="submit" className={styles.filterButton}>
              검색
            </button>
            <button type="button" className={styles.filterButtonSecondary} onClick={handleReset}>
              초기화
            </button>
          </div>
        </form>
        <p className={styles.filterSummary}>적용 기간: {appliedPeriodLabel}</p>
      </PageSection>

      <PageSection title="최근 월별 QA 통계">
        <div className={styles.chartSurface}>
          {monthlyRows.length ? (
            <div className={styles.chartFrame} role="img" aria-label="QA 월별 차트">
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={monthlyRows} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="count" name="전체 QA" stroke="#2563eb" fill="#93c5fd" />
                  <Area type="monotone" dataKey="completed" name="완료 QA" stroke="#16a34a" fill="#86efac" />
                  <Area type="monotone" dataKey="active" name="진행 QA" stroke="#f59e0b" fill="#fde68a" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className={styles.empty}>QA 데이터가 없습니다.</p>
          )}
        </div>
      </PageSection>

      <PageSection title="QA 통계 테이블">
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <caption className={styles.srOnly}>QA 월별 표</caption>
            <thead>
              <tr>
                <th scope="col">해당월</th>
                <th scope="col">총 진행</th>
                <th scope="col">진행 완료</th>
                <th scope="col">진행 중</th>
              </tr>
            </thead>
            <tbody>
              {monthlyRows.map((row) => (
                <tr key={row.monthKey}>
                  <td>{row.label}</td>
                  <td className="tabularNums">{row.count}</td>
                  <td className="tabularNums">{row.completed}</td>
                  <td className="tabularNums">{row.active}</td>
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

      <PageSection title="QA 목록">
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <caption className={styles.srOnly}>필터링된 QA 목록</caption>
            <thead>
              <tr>
                <th scope="col">종료월</th>
                <th scope="col">플랫폼</th>
                <th scope="col">서비스</th>
                <th scope="col">앱이름</th>
                <th scope="col">담당자</th>
                <th scope="col">보고서</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((project) => (
                <tr key={project.id}>
                  <td>{formatMonthLabel(monthKeyFromDate(project.endDate))}</td>
                  <td>
                    <span className="uiPlatformBadge">{project.platform}</span>
                  </td>
                  <td>{project.serviceGroupName}</td>
                  <td>{project.name}</td>
                  <td>{project.reporterName}</td>
                  <td>
                    {project.reportUrl ? (
                      <a href={project.reportUrl} target="_blank" rel="noreferrer" className={styles.link}>
                        Click
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}
              {!filteredProjects.length ? (
                <tr>
                  <td colSpan={6} className={styles.empty}>
                    조건에 맞는 QA 내역이 없습니다.
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
