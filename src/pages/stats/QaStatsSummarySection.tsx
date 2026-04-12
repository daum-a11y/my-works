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
import { TableEmptyRow } from '../../components/shared';
import type { MonthlyQaRow } from './QaStatsPage.types';
import type { StatsSummaryView } from './QaStatsPage.types';

interface QaStatsSummarySectionProps {
  summaryView: StatsSummaryView;
  monthlyRows: readonly MonthlyQaRow[];
  onSummaryViewChange: (view: StatsSummaryView) => void;
}

export function QaStatsSummarySection({
  summaryView,
  monthlyRows,
  onSummaryViewChange,
}: QaStatsSummarySectionProps) {
  return (
    <>
      <div className={'stats-page__view-toggle'} role="tablist" aria-label="QA 월별 요약 보기">
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
            <div className={'stats-page__chart-frame'} role="img" aria-label="QA 월별 차트">
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
                    name="총 QA"
                    stroke="var(--chart-series-primary-stroke)"
                    fill="var(--chart-series-primary-fill)"
                  />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    name="완료 QA"
                    stroke="var(--chart-series-success-stroke)"
                    fill="var(--chart-series-success-fill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className={'stats-page__empty'}>QA 데이터가 없습니다.</p>
          )}
        </div>
      ) : (
        <div className={'stats-page__table-wrap'}>
          <table className={'stats-page__table'}>
            <caption className={'sr-only'}>QA 월별 표</caption>
            <thead>
              <tr>
                <th scope="col">월</th>
                <th scope="col">총 QA</th>
                <th scope="col">완료 QA</th>
              </tr>
            </thead>
            <tbody>
              {monthlyRows.map((row) => (
                <tr key={row.monthKey}>
                  <td>{row.label}</td>
                  <td className="stats-page__table-number">{row.count}</td>
                  <td className="stats-page__table-number">{row.completed}</td>
                </tr>
              ))}
              {!monthlyRows.length ? (
                <TableEmptyRow
                  colSpan={3}
                  className={'stats-page__empty'}
                  message="월별 데이터가 없습니다."
                />
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
