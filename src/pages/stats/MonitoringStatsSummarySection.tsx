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
import { EmptyState, TableEmptyRow } from '../../components/shared';
import type { StatsSummaryView } from './MonitoringStatsPage.types';
import type { MonthlyMonitoringRow } from './MonitoringStatsPage.utils';

interface MonitoringStatsSummarySectionProps {
  summaryView: StatsSummaryView;
  monthlyRows: MonthlyMonitoringRow[];
  onSummaryViewChange: (view: StatsSummaryView) => void;
}

export function MonitoringStatsSummarySection({
  summaryView,
  monthlyRows,
  onSummaryViewChange,
}: MonitoringStatsSummarySectionProps) {
  return (
    <>
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
          onClick={() => onSummaryViewChange('stats-page__table')}
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
          onClick={() => onSummaryViewChange('stats-page__chart')}
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
                  />
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
            <EmptyState message="표시할 모니터링 데이터가 없습니다." />
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
                <TableEmptyRow colSpan={5} message="월별 데이터가 없습니다." />
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
