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
import { Tab, TabList, TabTrigger } from 'krds-react';
import { EmptyState, TableEmptyRow } from '../../components/shared';
import type { StatsSummaryView, TaskMonitoringMonthlyRow } from './ProjectStatsPage.types';

interface TaskMonitoringSummarySectionProps {
  summaryView: StatsSummaryView;
  monthlyRows: TaskMonitoringMonthlyRow[];
  onSummaryViewChange: (view: StatsSummaryView) => void;
}

const STATUS_ORDER = ['미수정', '일부 수정', '전체 수정'] as const;
const STATUS_COLORS = {
  미수정: 'var(--chart-series-danger-stroke)',
  '일부 수정': 'var(--chart-series-warning-stroke)',
  '전체 수정': 'var(--chart-series-success-stroke)',
} as const;

export function TaskMonitoringSummarySection({
  summaryView,
  monthlyRows,
  onSummaryViewChange,
}: TaskMonitoringSummarySectionProps) {
  return (
    <>
      <Tab
        value={summaryView}
        onValueChange={(value) => onSummaryViewChange(value as StatsSummaryView)}
      >
        <TabList aria-label="태스크 월별 요약 보기">
          <TabTrigger value="table">표</TabTrigger>
          <TabTrigger value="chart">그래프</TabTrigger>
        </TabList>
      </Tab>
      {summaryView === 'chart' ? (
        <div className={'chart-surface'}>
          {monthlyRows.length ? (
            <div className={'chart-frame'} role="img" aria-label="태스크 월별 차트">
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={monthlyRows} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Legend />
                  {STATUS_ORDER.map((status) => (
                    <Area
                      key={status}
                      type="monotone"
                      stackId="status"
                      dataKey={`statusCounts.${status}`}
                      name={status}
                      stroke={STATUS_COLORS[status]}
                      fill={STATUS_COLORS[status]}
                      fillOpacity={0.75}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState message="표시할 태스크 데이터가 없습니다." />
          )}
        </div>
      ) : (
        <div className={'table-wrap krds-table-wrap'}>
          <table className={'krds-table tbl data'}>
            <caption className={'sr-only'}>태스크 월별 표</caption>
            <thead>
              <tr>
                <th scope="col">월</th>
                <th scope="col">전체 태스크 수</th>
                {STATUS_ORDER.map((status) => (
                  <th key={status} scope="col">
                    {status}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {monthlyRows.map((row) => (
                <tr key={row.monthKey}>
                  <td>{row.label}</td>
                  <td className="number-cell">{row.totalCount}</td>
                  {STATUS_ORDER.map((status) => (
                    <td key={status} className="number-cell">
                      {row.statusCounts[status]}
                    </td>
                  ))}
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
