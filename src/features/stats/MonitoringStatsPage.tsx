import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PageSection } from '../../components/ui/PageSection';
import { opsDataClient } from '../../lib/data-client';
import { type PageStatus, type ProjectPage } from '../../lib/domain';
import { getCurrentMonth, shiftMonth } from '../resource/resource-shared';
import { useAuth } from '../auth/AuthContext';
import styles from './shared.module.css';

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

function parseIssueCount(note: string, key: 'highest' | 'high' | 'normal') {
  const matched = note.match(new RegExp(`${key}:\\s*(\\d+)`));
  return matched ? matched[1] : '-';
}

function formatTrackStatus(value: PageStatus) {
  switch (value) {
    case '개선':
      return '전체 수정';
    case '일부':
      return '일부 수정';
    case '중지':
      return '중지';
    case '미개선':
    default:
      return '미수정';
  }
}

function monthKeyFromMonitoringMonth(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 4) {
    return `20${digits.slice(0, 2)}-${digits.slice(2, 4)}`;
  }
  return '';
}

function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'short',
  }).format(new Date(year, month - 1, 1));
}

function buildMonthRange(monthKeys: string[]): string[] {
  if (!monthKeys.length) {
    return [];
  }

  const uniqueKeys = [...new Set(monthKeys)].sort();
  const [startYear, startMonth] = uniqueKeys[0].split('-').map(Number);
  const [endYear, endMonth] = uniqueKeys[uniqueKeys.length - 1].split('-').map(Number);
  const range: string[] = [];
  let cursor = new Date(startYear, startMonth - 1, 1);
  const end = new Date(endYear, endMonth - 1, 1);

  while (cursor <= end) {
    range.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`);
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }

  return range;
}

function isStoppedStatus(status: PageStatus): boolean {
  return status === '중지';
}

function isFullFixStatus(status: PageStatus): boolean {
  return status === '개선';
}

function isPartialFixStatus(status: PageStatus): boolean {
  return status === '일부';
}

function sortRows(left: MonitoringRow, right: MonitoringRow) {
  return new Date(right.page.updatedAt).getTime() - new Date(left.page.updatedAt).getTime();
}

export function MonitoringStatsPage() {
  const { session } = useAuth();
  const member = session?.member;
  const defaultEndMonth = getCurrentMonth();
  const defaultStartMonth = shiftMonth(defaultEndMonth, -5);

  const monitoringQuery = useQuery({
    queryKey: ['monitoring-detail', member?.id],
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
          projectName: projectsById.get(page.projectId)?.name ?? '미분류 프로젝트',
          platform: projectsById.get(page.projectId)?.platform ?? '-',
          assigneeName: page.ownerMemberId
            ? (membersById.get(page.ownerMemberId) ?? '미지정')
            : '미지정',
          reportUrl: projectsById.get(page.projectId)?.reportUrl ?? page.url,
        }))
        .sort(sortRows);
    },
    enabled: Boolean(member),
  });

  const monitoringRows = useMemo<MonitoringRow[]>(
    () => monitoringQuery.data ?? [],
    [monitoringQuery.data],
  );
  const [draftStartMonth, setDraftStartMonth] = useState(defaultStartMonth);
  const [draftEndMonth, setDraftEndMonth] = useState(defaultEndMonth);
  const [startMonth, setStartMonth] = useState(defaultStartMonth);
  const [endMonth, setEndMonth] = useState(defaultEndMonth);

  const handleSearch = () => {
    const nextStart =
      draftStartMonth && draftEndMonth && draftStartMonth > draftEndMonth
        ? draftEndMonth
        : draftStartMonth;
    const nextEnd =
      draftStartMonth && draftEndMonth && draftStartMonth > draftEndMonth
        ? draftStartMonth
        : draftEndMonth;
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
      return '전체 기간';
    }
    if (startMonth && endMonth) {
      return `${formatMonthLabel(startMonth)} ~ ${formatMonthLabel(endMonth)}`;
    }
    if (startMonth) {
      return `${formatMonthLabel(startMonth)} 이후`;
    }
    return `${formatMonthLabel(endMonth)} 이전`;
  }, [defaultEndMonth, defaultStartMonth, endMonth, startMonth]);

  const filteredRows = useMemo(() => {
    return monitoringRows.filter((row) => {
      const monthKey = monthKeyFromMonitoringMonth(row.page.monitoringMonth);
      if (!monthKey) {
        return false;
      }
      if (startMonth && monthKey < startMonth) {
        return false;
      }
      if (endMonth && monthKey > endMonth) {
        return false;
      }
      return true;
    });
  }, [endMonth, monitoringRows, startMonth]);

  const monthlyRows = useMemo<MonthlyMonitoringRow[]>(() => {
    if (!filteredRows.length) {
      return [];
    }

    const grouped = new Map<
      string,
      {
        count: number;
        sent: number;
        unsent: number;
        stopped: number;
        fullFix: number;
        partialFix: number;
      }
    >();
    const monthKeys = filteredRows
      .map((row) => monthKeyFromMonitoringMonth(row.page.monitoringMonth))
      .filter(Boolean);

    for (const row of filteredRows) {
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
      current.sent +=
        row.page.trackStatus !== '미개선' && !isStoppedStatus(row.page.trackStatus) ? 1 : 0;
      current.unsent += row.page.trackStatus === '미개선' ? 1 : 0;
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
  }, [filteredRows]);

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <h1 className={styles.title}>모니터링 통계</h1>
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
            <input
              type="month"
              aria-label="모니터링 시작월"
              value={draftStartMonth}
              onChange={(event) => setDraftStartMonth(event.target.value)}
            />
          </label>
          <label className={styles.filterField}>
            <span>종료월</span>
            <input
              type="month"
              aria-label="모니터링 종료월"
              value={draftEndMonth}
              onChange={(event) => setDraftEndMonth(event.target.value)}
            />
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
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="총모니터링수"
                    stroke="var(--chart-series-primary-stroke)"
                    fill="var(--chart-series-primary-fill)"
                  />
                  <Area
                    type="monotone"
                    dataKey="sent"
                    name="전달 수"
                    stroke="var(--chart-series-success-stroke)"
                    fill="var(--chart-series-success-fill)"
                  />
                  <Area
                    type="monotone"
                    dataKey="fullFix"
                    name="완전 개선수"
                    stroke="var(--chart-series-warning-stroke)"
                    fill="var(--chart-series-warning-fill)"
                  />
                  <Area
                    type="monotone"
                    dataKey="partialFix"
                    name="일부 개선수"
                    stroke="var(--chart-series-danger-stroke)"
                    fill="var(--chart-series-danger-fill)"
                  />
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
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <caption className={styles.srOnly}>필터링된 모니터링 목록</caption>
            <thead>
              <tr>
                <th scope="col">해당월</th>
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
              {filteredRows.map((row) => (
                <tr key={row.page.id}>
                  <td>{formatMonthLabel(monthKeyFromMonitoringMonth(row.page.monitoringMonth))}</td>
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
                  <td>{parseIssueCount(row.page.note, 'highest')}</td>
                  <td>{parseIssueCount(row.page.note, 'high')}</td>
                  <td>{parseIssueCount(row.page.note, 'normal')}</td>
                  <td>{row.page.note || '-'}</td>
                  <td>
                    {row.reportUrl ? (
                      <a
                        href={row.reportUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.link}
                      >
                        Click
                      </a>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              ))}
              {!filteredRows.length ? (
                <tr>
                  <td colSpan={11} className={styles.empty}>
                    조건에 맞는 모니터링 내역이 없습니다.
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
