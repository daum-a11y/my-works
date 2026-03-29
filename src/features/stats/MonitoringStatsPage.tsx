import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PageSection } from '../../components/ui/PageSection';
import { opsDataClient } from '../../lib/data-client';
import { pageStatusOptions, type PageStatus, type ProjectPage } from '../../lib/domain';
import { getCurrentMonth, shiftMonth } from '../resource/resource-shared';
import { useAuth } from '../auth/AuthContext';
import styles from './shared.module.css';

interface MonitoringRow {
  page: ProjectPage;
  serviceGroupName: string;
  projectName: string;
  platform: string;
  assigneeDisplay: string;
  reportUrl: string;
}

interface MonthlyMonitoringRow {
  monthKey: string;
  label: string;
  count: number;
  untouched: number;
  partial: number;
  completed: number;
}

function formatTrackStatus(value: PageStatus) {
  return value;
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
  return `${year}/${String(month).padStart(2, '0')}`;
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

function sortRows(left: MonitoringRow, right: MonitoringRow) {
  return new Date(right.page.updatedAt).getTime() - new Date(left.page.updatedAt).getTime();
}

function memberDisplay(
  memberId: string | null | undefined,
  membersById: Map<string, { accountId: string; name: string }>,
) {
  if (!memberId) {
    return '미지정';
  }

  const member = membersById.get(memberId);

  if (!member) {
    return memberId;
  }

  return `${member.accountId}(${member.name})`;
}

export function MonitoringStatsPage() {
  const { session } = useAuth();
  const member = session?.member;
  const queryClient = useQueryClient();
  const defaultEndMonth = getCurrentMonth();
  const defaultStartMonth = shiftMonth(defaultEndMonth, -5);

  const monitoringQuery = useQuery({
    queryKey: ['monitoring-detail', member?.id],
    queryFn: async () => {
      const [pages, projects, members, serviceGroups] = await Promise.all([
        opsDataClient.getAllProjectPages(),
        opsDataClient.getProjects(),
        opsDataClient.getMembers(),
        opsDataClient.getServiceGroups(),
      ]);
      const projectsById = new Map(projects.map((project) => [project.id, project]));
      const membersById = new Map(
        members.map((item) => [item.id, { accountId: item.accountId, name: item.name }]),
      );
      const serviceGroupsById = new Map(serviceGroups.map((item) => [item.id, item.name]));

      return pages
        .filter((page) => Boolean(page.monitoringMonth))
        .map((page) => ({
          page,
          serviceGroupName: projectsById.get(page.projectId)?.serviceGroupId
            ? (serviceGroupsById.get(projectsById.get(page.projectId)?.serviceGroupId ?? '') ?? '-')
            : '-',
          projectName: projectsById.get(page.projectId)?.name ?? '미분류 프로젝트',
          platform: projectsById.get(page.projectId)?.platform ?? '-',
          assigneeDisplay: memberDisplay(page.ownerMemberId, membersById),
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
  const [summaryView, setSummaryView] = useState<'chart' | 'table'>('chart');
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [draftStatus, setDraftStatus] = useState<PageStatus>('미수정');
  const [draftNote, setDraftNote] = useState('');
  const [hoveredNotePageId, setHoveredNotePageId] = useState<string | null>(null);
  const [pinnedNotePageId, setPinnedNotePageId] = useState<string | null>(null);

  const savePageMutation = useMutation({
    mutationFn: async (page: ProjectPage) =>
      opsDataClient.saveProjectPage({
        id: page.id,
        projectId: page.projectId,
        title: page.title,
        url: page.url,
        ownerMemberId: page.ownerMemberId,
        monitoringMonth: page.monitoringMonth,
        trackStatus: draftStatus,
        monitoringInProgress: page.monitoringInProgress,
        qaInProgress: page.qaInProgress,
        note: draftNote.trim(),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['monitoring-detail', member?.id] });
      setEditingPageId(null);
    },
  });

  const startEdit = (row: MonitoringRow) => {
    setEditingPageId(row.page.id);
    setDraftStatus(row.page.trackStatus);
    setDraftNote(row.page.note);
  };

  const cancelEdit = () => {
    setEditingPageId(null);
    setDraftStatus('미수정');
    setDraftNote('');
  };

  const isNoteOpen = (pageId: string) =>
    hoveredNotePageId === pageId || pinnedNotePageId === pageId;

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
        untouched: number;
        partial: number;
        completed: number;
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
        untouched: 0,
        partial: 0,
        completed: 0,
      };
      current.count += 1;
      if (row.page.trackStatus === '전체 수정') {
        current.completed += 1;
      } else if (row.page.trackStatus === '일부 수정') {
        current.partial += 1;
      } else {
        current.untouched += 1;
      }
      grouped.set(monthKey, current);
    }

    return buildMonthRange(monthKeys).map((monthKey) => {
      const current = grouped.get(monthKey);
      return {
        monthKey,
        label: formatMonthLabel(monthKey),
        count: current?.count ?? 0,
        untouched: current?.untouched ?? 0,
        partial: current?.partial ?? 0,
        completed: current?.completed ?? 0,
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
      </PageSection>

      <PageSection title="월별 모니터링 현황">
        <div className={styles.viewToggle} role="tablist" aria-label="모니터링 월별 요약 보기">
          <button
            type="button"
            className={summaryView === 'table' ? styles.viewToggleActive : styles.viewToggleButton}
            aria-pressed={summaryView === 'table'}
            onClick={() => setSummaryView('table')}
          >
            표
          </button>
          <button
            type="button"
            className={summaryView === 'chart' ? styles.viewToggleActive : styles.viewToggleButton}
            aria-pressed={summaryView === 'chart'}
            onClick={() => setSummaryView('chart')}
          >
            그래프
          </button>
        </div>
        {summaryView === 'chart' ? (
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
                      dataKey="untouched"
                      name="미수정"
                      stackId="monitoring-status"
                      stroke="var(--chart-series-danger-stroke)"
                      fill="var(--chart-series-danger-fill)"
                    />
                    <Area
                      type="monotone"
                      dataKey="partial"
                      name="일부 수정"
                      stackId="monitoring-status"
                      stroke="var(--chart-series-warning-stroke)"
                      fill="var(--chart-series-warning-fill)"
                    />
                    <Area
                      type="monotone"
                      dataKey="completed"
                      name="전체 수정"
                      stackId="monitoring-status"
                      stroke="var(--chart-series-success-stroke)"
                      fill="var(--chart-series-success-fill)"
                    ></Area>
                    <Line
                      type="monotone"
                      dataKey="count"
                      name="총 모니터링 수"
                      stroke="var(--chart-series-primary-stroke)"
                      strokeWidth={2}
                      dot={false}
                      activeDot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className={styles.empty}>모니터링 데이터가 없습니다.</p>
            )}
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <caption className={styles.srOnly}>모니터링 월별 표</caption>
              <thead>
                <tr>
                  <th scope="col">해당월</th>
                  <th scope="col">미수정</th>
                  <th scope="col">일부 수정</th>
                  <th scope="col">전체 수정</th>
                  <th scope="col">총 모니터링 수</th>
                </tr>
              </thead>
              <tbody>
                {monthlyRows.map((row) => (
                  <tr key={row.monthKey}>
                    <td>{row.label}</td>
                    <td className="tabularNums">{row.untouched}</td>
                    <td className="tabularNums">{row.partial}</td>
                    <td className="tabularNums">{row.completed}</td>
                    <td className="tabularNums">{row.count}</td>
                  </tr>
                ))}
                {!monthlyRows.length ? (
                  <tr>
                    <td colSpan={5} className={styles.empty}>
                      월별 데이터가 없습니다.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </PageSection>

      <PageSection title="모니터링 페이지 목록">
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <caption className={styles.srOnly}>필터링된 모니터링 페이지 목록</caption>
            <thead>
              <tr>
                <th scope="col">해당월</th>
                <th scope="col">플랫폼</th>
                <th scope="col">서비스그룹</th>
                <th scope="col">프로젝트명</th>
                <th scope="col">페이지명</th>
                <th scope="col">담당자</th>
                <th scope="col">상태</th>
                <th scope="col">비고</th>
                <th scope="col">보고서URL</th>
                <th scope="col">수정</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.page.id}>
                  <td>{formatMonthLabel(monthKeyFromMonitoringMonth(row.page.monitoringMonth))}</td>
                  <td>{row.platform}</td>
                  <td>{row.serviceGroupName}</td>
                  <td>{row.projectName}</td>
                  <td>{row.page.title}</td>
                  <td>{row.assigneeDisplay}</td>
                  <td>
                    {editingPageId === row.page.id ? (
                      <select
                        aria-label={`${row.page.title} 상태`}
                        className={styles.inlineSelect}
                        value={draftStatus}
                        onChange={(event) => setDraftStatus(event.target.value as PageStatus)}
                      >
                        {pageStatusOptions.map((status) => (
                          <option key={status} value={status}>
                            {formatTrackStatus(status)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="uiStatusBadge" data-status={row.page.trackStatus}>
                        {formatTrackStatus(row.page.trackStatus)}
                      </span>
                    )}
                  </td>
                  <td>
                    {editingPageId === row.page.id ? (
                      <textarea
                        aria-label={`${row.page.title} 비고`}
                        className={styles.inlineTextarea}
                        value={draftNote}
                        onChange={(event) => setDraftNote(event.target.value)}
                        rows={3}
                      />
                    ) : row.page.note ? (
                      <div
                        className={styles.noteCell}
                        onMouseEnter={() => setHoveredNotePageId(row.page.id)}
                        onMouseLeave={() =>
                          setHoveredNotePageId((current) =>
                            current === row.page.id && pinnedNotePageId !== row.page.id
                              ? null
                              : current,
                          )
                        }
                        onFocusCapture={() => setHoveredNotePageId(row.page.id)}
                        onBlurCapture={(event) => {
                          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                            setHoveredNotePageId((current) =>
                              current === row.page.id && pinnedNotePageId !== row.page.id
                                ? null
                                : current,
                            );
                          }
                        }}
                      >
                        <button
                          type="button"
                          className={`${styles.noteToggle} ${isNoteOpen(row.page.id) ? styles.noteToggleActive : ''}`.trim()}
                          aria-expanded={isNoteOpen(row.page.id)}
                          aria-label={`${row.page.title} 내용 보기`}
                          onClick={() => {
                            setPinnedNotePageId((current) =>
                              current === row.page.id ? null : row.page.id,
                            );
                            setHoveredNotePageId(row.page.id);
                          }}
                        >
                          내용 보기
                        </button>
                        {isNoteOpen(row.page.id) ? (
                          <div className={styles.notePopover} role="tooltip">
                            {row.page.note}
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    {row.reportUrl ? (
                      <a
                        href={row.reportUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.link}
                      >
                        링크
                      </a>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    {editingPageId === row.page.id ? (
                      <div className={styles.inlineActions}>
                        <button
                          type="button"
                          className={styles.inlineActionPrimary}
                          onClick={() => savePageMutation.mutate(row.page)}
                          disabled={savePageMutation.isPending}
                        >
                          저장
                        </button>
                        <button
                          type="button"
                          className={styles.inlineActionSecondary}
                          onClick={cancelEdit}
                          disabled={savePageMutation.isPending}
                        >
                          취소
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className={styles.inlineActionPrimary}
                        onClick={() => startEdit(row)}
                      >
                        수정
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!filteredRows.length ? (
                <tr>
                  <td colSpan={10} className={styles.empty}>
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
