import { useEffect, useMemo, useState } from 'react';
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
import { PageSection } from '../../components/shared/PageSection';
import { setDocumentTitle } from '../../router/navigation';
import { dataClient } from '../../api/client';
import { pageStatusOptions, type MonitoringStatsRow, type PageStatus } from '../../types/domain';
import { getCurrentMonth, shiftMonth } from '../resource/resourceUtils';
import { useAuth } from '../../auth/AuthContext';
import '../../styles/domain/pages/stats-shared.scss';

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

function sortRows(left: MonitoringStatsRow, right: MonitoringStatsRow) {
  return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
}

export function MonitoringStatsPage() {
  const { session } = useAuth();
  const member = session?.member;
  const queryClient = useQueryClient();
  const defaultEndMonth = getCurrentMonth();
  const defaultStartMonth = shiftMonth(defaultEndMonth, -5);

  const monitoringQuery = useQuery({
    queryKey: ['monitoring-detail', member?.id],
    queryFn: async () => dataClient.getMonitoringStatsRows(),
    enabled: Boolean(member),
  });

  const monitoringRows = useMemo<MonitoringStatsRow[]>(
    () => monitoringQuery.data ?? [],
    [monitoringQuery.data],
  );
  const [draftStartMonth, setDraftStartMonth] = useState(defaultStartMonth);
  const [draftEndMonth, setDraftEndMonth] = useState(defaultEndMonth);
  const [startMonth, setStartMonth] = useState(defaultStartMonth);
  const [endMonth, setEndMonth] = useState(defaultEndMonth);
  const [summaryView, setSummaryView] = useState<'stats-page__chart' | 'stats-page__table'>(
    'stats-page__chart',
  );
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [draftStatus, setDraftStatus] = useState<PageStatus>('미수정');
  const [draftNote, setDraftNote] = useState('');
  const [hoveredNotePageId, setHoveredNotePageId] = useState<string | null>(null);
  const [pinnedNotePageId, setPinnedNotePageId] = useState<string | null>(null);

  useEffect(() => {
    setDocumentTitle('모니터링 통계');
  }, []);

  const savePageMutation = useMutation({
    mutationFn: async (row: MonitoringStatsRow) =>
      dataClient.saveProjectPage({
        id: row.pageId,
        projectId: row.projectId,
        title: row.title,
        url: row.url,
        ownerMemberId: row.ownerMemberId,
        monitoringMonth: row.monitoringMonth,
        trackStatus: draftStatus,
        monitoringInProgress: row.monitoringInProgress,
        qaInProgress: row.qaInProgress,
        note: draftNote.trim(),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['monitoring-detail', member?.id] });
      setEditingPageId(null);
    },
  });

  const startEdit = (row: MonitoringStatsRow) => {
    setEditingPageId(row.pageId);
    setDraftStatus(row.trackStatus);
    setDraftNote(row.note);
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
    return monitoringRows
      .filter((row) => {
        const monthKey = monthKeyFromMonitoringMonth(row.monitoringMonth);
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
      })
      .sort(sortRows);
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
      .map((row) => monthKeyFromMonitoringMonth(row.monitoringMonth))
      .filter(Boolean);

    for (const row of filteredRows) {
      const monthKey = monthKeyFromMonitoringMonth(row.monitoringMonth);
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
      if (row.trackStatus === '전체 수정') {
        current.completed += 1;
      } else if (row.trackStatus === '일부 수정') {
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
    <div className={'stats-page stats-page--page'}>
      <header className={'stats-page__hero'}>
        <h1 className={'stats-page__title'}>모니터링 통계</h1>
      </header>

      <PageSection title="필터">
        <form
          className={'stats-page__filter-bar'}
          onSubmit={(event) => {
            event.preventDefault();
            handleSearch();
          }}
        >
          <label className={'stats-page__filter-field'}>
            <span>시작월</span>
            <input
              type="month"
              aria-label="모니터링 시작월"
              value={draftStartMonth}
              onChange={(event) => setDraftStartMonth(event.target.value)}
            />
          </label>
          <label className={'stats-page__filter-field'}>
            <span>종료월</span>
            <input
              type="month"
              aria-label="모니터링 종료월"
              value={draftEndMonth}
              onChange={(event) => setDraftEndMonth(event.target.value)}
            />
          </label>
          <div className={'stats-page__filter-actions'}>
            <button type="submit" className={'stats-page__filter-button'}>
              검색
            </button>
            <button
              type="button"
              className={'stats-page__filter-button stats-page__filter-button--secondary'}
              onClick={handleReset}
            >
              초기화
            </button>
          </div>
        </form>
      </PageSection>

      <PageSection title="월별 모니터링 현황">
        <div
          className={'stats-page__view-toggle'}
          role="tablist"
          aria-label="모니터링 월별 요약 보기"
        >
          <button
            type="button"
            className={
              summaryView === 'stats-page__table'
                ? 'stats-page__view-toggle-button stats-page__view-toggle-button--active'
                : 'stats-page__view-toggle-button'
            }
            aria-pressed={summaryView === 'stats-page__table'}
            onClick={() => setSummaryView('stats-page__table')}
          >
            표
          </button>
          <button
            type="button"
            className={
              summaryView === 'stats-page__chart'
                ? 'stats-page__view-toggle-button stats-page__view-toggle-button--active'
                : 'stats-page__view-toggle-button'
            }
            aria-pressed={summaryView === 'stats-page__chart'}
            onClick={() => setSummaryView('stats-page__chart')}
          >
            그래프
          </button>
        </div>
        {summaryView === 'stats-page__chart' ? (
          <div className={'stats-page__chart-surface'}>
            {monthlyRows.length ? (
              <div className={'stats-page__chart-frame'} role="img" aria-label="모니터링 월별 차트">
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
              <p className={'stats-page__empty'}>모니터링 데이터가 없습니다.</p>
            )}
          </div>
        ) : (
          <div className={'stats-page__table-wrap'}>
            <table className={'stats-page__table'}>
              <caption className={'sr-only'}>모니터링 월별 표</caption>
              <thead>
                <tr>
                  <th scope="col">월</th>
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
                    <td className="stats-page__table-number">{row.untouched}</td>
                    <td className="stats-page__table-number">{row.partial}</td>
                    <td className="stats-page__table-number">{row.completed}</td>
                    <td className="stats-page__table-number">{row.count}</td>
                  </tr>
                ))}
                {!monthlyRows.length ? (
                  <tr>
                    <td colSpan={5} className={'stats-page__empty'}>
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
        <div className={'stats-page__table-wrap'}>
          <table className={'stats-page__table'}>
            <caption className={'sr-only'}>필터링된 모니터링 페이지 목록</caption>
            <thead>
              <tr>
                <th scope="col">월</th>
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
                <tr key={row.pageId}>
                  <td>{formatMonthLabel(monthKeyFromMonitoringMonth(row.monitoringMonth))}</td>
                  <td>{row.platform}</td>
                  <td>{row.serviceGroupName}</td>
                  <td>{row.projectName}</td>
                  <td>{row.title}</td>
                  <td>{row.assigneeDisplay}</td>
                  <td>
                    {editingPageId === row.pageId ? (
                      <select
                        aria-label={`${row.title} 상태`}
                        className={'stats-page__inline-select'}
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
                      <span className="stats-page__status-badge" data-status={row.trackStatus}>
                        {formatTrackStatus(row.trackStatus)}
                      </span>
                    )}
                  </td>
                  <td>
                    {editingPageId === row.pageId ? (
                      <textarea
                        aria-label={`${row.title} 비고`}
                        className={'stats-page__inline-textarea'}
                        value={draftNote}
                        onChange={(event) => setDraftNote(event.target.value)}
                        rows={3}
                      />
                    ) : row.note ? (
                      <div
                        className={'stats-page__note-cell'}
                        onMouseEnter={() => setHoveredNotePageId(row.pageId)}
                        onMouseLeave={() =>
                          setHoveredNotePageId((current) =>
                            current === row.pageId && pinnedNotePageId !== row.pageId
                              ? null
                              : current,
                          )
                        }
                        onFocusCapture={() => setHoveredNotePageId(row.pageId)}
                        onBlurCapture={(event) => {
                          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                            setHoveredNotePageId((current) =>
                              current === row.pageId && pinnedNotePageId !== row.pageId
                                ? null
                                : current,
                            );
                          }
                        }}
                      >
                        <button
                          type="button"
                          className={[
                            'stats-page__note-toggle',
                            isNoteOpen(row.pageId) ? 'stats-page__note-toggle--active' : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          aria-expanded={isNoteOpen(row.pageId)}
                          aria-label={`${row.title} 내용 보기`}
                          onClick={() => {
                            setPinnedNotePageId((current) =>
                              current === row.pageId ? null : row.pageId,
                            );
                            setHoveredNotePageId(row.pageId);
                          }}
                        >
                          내용 보기
                        </button>
                        {isNoteOpen(row.pageId) ? (
                          <div className={'stats-page__note-popover'} role="tooltip">
                            {row.note}
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
                        className={'stats-page__link'}
                      >
                        링크
                      </a>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    {editingPageId === row.pageId ? (
                      <div className={'stats-page__inline-actions'}>
                        <button
                          type="button"
                          className={'stats-page__inline-action stats-page__inline-action--primary'}
                          onClick={() => savePageMutation.mutate(row)}
                          disabled={savePageMutation.isPending}
                        >
                          저장
                        </button>
                        <button
                          type="button"
                          className={
                            'stats-page__inline-action stats-page__inline-action--secondary'
                          }
                          onClick={cancelEdit}
                          disabled={savePageMutation.isPending}
                        >
                          취소
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className={'stats-page__inline-action stats-page__inline-action--primary'}
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
                  <td colSpan={10} className={'stats-page__empty'}>
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
