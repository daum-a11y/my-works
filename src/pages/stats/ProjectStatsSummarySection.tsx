import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { EmptyState, TableEmptyRow } from '../../components/shared';
import type { StatsSummaryView } from './ProjectStatsPage.types';
import type { ProjectStatsMonthlyRow } from './ProjectStatsPage.utils';

interface ProjectStatsSummarySectionProps {
  summaryView: StatsSummaryView;
  monthlyRows: ProjectStatsMonthlyRow[];
  onSummaryViewChange: (view: StatsSummaryView) => void;
}

export function ProjectStatsSummarySection({
  summaryView,
  monthlyRows,
  onSummaryViewChange,
}: ProjectStatsSummarySectionProps) {
  return (
    <>
      <div
        className={'stats-page__view-toggle'}
        role="tablist"
        aria-label="프로젝트 월별 요약 보기"
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
            <div className={'stats-page__chart-frame'} role="img" aria-label="프로젝트 월별 차트">
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={monthlyRows} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="projectCount"
                    name="프로젝트 수"
                    stroke="var(--chart-series-primary-stroke)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="subtaskCount"
                    name="서브태스크 수"
                    stroke="var(--chart-series-success-stroke)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState message="표시할 프로젝트 데이터가 없습니다." />
          )}
        </div>
      ) : (
        <div className={'stats-page__table-wrap'}>
          <table className={'stats-page__table'}>
            <caption className={'sr-only'}>프로젝트 월별 표</caption>
            <thead>
              <tr>
                <th scope="col">월</th>
                <th scope="col">프로젝트 수</th>
                <th scope="col">서브태스크 수</th>
              </tr>
            </thead>
            <tbody>
              {monthlyRows.map((row) => (
                <tr key={row.monthKey}>
                  <td>{row.label}</td>
                  <td className="stats-page__table-number">{row.projectCount}</td>
                  <td className="stats-page__table-number">{row.subtaskCount}</td>
                </tr>
              ))}
              {!monthlyRows.length ? (
                <TableEmptyRow colSpan={3} message="월별 데이터가 없습니다." />
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
