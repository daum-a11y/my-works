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
import { Tab, TabList, TabTrigger } from 'krds-react';
import { EmptyState, TableEmptyRow } from '../../components/shared';
import type { StatsSummaryView } from './ProjectStatsPage.types';
import type { ProjectStatsMonthlyRow } from './ProjectStatsPage.utils';

const ALL_TASK_TYPE1 = '전체';
const MULTI_SERIES_STROKES = [
  'var(--chart-series-primary-stroke)',
  'var(--chart-series-success-stroke)',
  'var(--chart-series-warning-stroke)',
  'var(--chart-series-danger-stroke)',
  '#0f766e',
  '#c2410c',
];

interface ProjectStatsSummarySectionProps {
  summaryView: StatsSummaryView;
  monthlyRows: ProjectStatsMonthlyRow[];
  selectedTaskType1: string;
  summaryType1Keys: string[];
  onSummaryViewChange: (view: StatsSummaryView) => void;
}

export function ProjectStatsSummarySection({
  summaryView,
  monthlyRows,
  selectedTaskType1,
  summaryType1Keys,
  onSummaryViewChange,
}: ProjectStatsSummarySectionProps) {
  const showAllType1Series = selectedTaskType1 === ALL_TASK_TYPE1;

  return (
    <>
      <Tab
        value={summaryView}
        onValueChange={(value) => onSummaryViewChange(value as StatsSummaryView)}
      >
        <TabList aria-label="프로젝트 월별 요약 보기">
          <TabTrigger value="table">표</TabTrigger>
          <TabTrigger value="chart">그래프</TabTrigger>
        </TabList>
      </Tab>
      {summaryView === 'chart' ? (
        <div className={'chart-surface'}>
          {monthlyRows.length ? (
            <div className={'chart-frame'} role="img" aria-label="프로젝트 월별 차트">
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={monthlyRows} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Legend />
                  {showAllType1Series ? (
                    summaryType1Keys.map((type1, index) => (
                      <Line
                        key={type1}
                        type="monotone"
                        dataKey={`projectCountByType1.${type1}`}
                        name={type1}
                        stroke={MULTI_SERIES_STROKES[index % MULTI_SERIES_STROKES.length]}
                        strokeWidth={2}
                        dot={false}
                      />
                    ))
                  ) : (
                    <Line
                      type="monotone"
                      dataKey="totalProjectCount"
                      name="프로젝트 수"
                      stroke="var(--chart-series-primary-stroke)"
                      strokeWidth={2}
                      dot={false}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState message="표시할 프로젝트 데이터가 없습니다." />
          )}
        </div>
      ) : (
        <div className={'table-wrap krds-table-wrap'}>
          <table className={'krds-table tbl data'}>
            <caption className={'sr-only'}>프로젝트 월별 표</caption>
            <thead>
              <tr>
                <th scope="col">월</th>
                <th scope="col">{showAllType1Series ? '전체 프로젝트 수' : '프로젝트 수'}</th>
                {showAllType1Series
                  ? summaryType1Keys.map((type1) => (
                      <th key={type1} scope="col">
                        {type1}
                      </th>
                    ))
                  : null}
              </tr>
            </thead>
            <tbody>
              {monthlyRows.map((row) => (
                <tr key={row.monthKey}>
                  <td>{row.label}</td>
                  <td className="number-cell">{row.totalProjectCount}</td>
                  {showAllType1Series
                    ? summaryType1Keys.map((type1) => (
                        <td key={type1} className="number-cell">
                          {row.projectCountByType1[type1] ?? 0}
                        </td>
                      ))
                    : null}
                </tr>
              ))}
              {!monthlyRows.length ? (
                <TableEmptyRow
                  colSpan={showAllType1Series ? summaryType1Keys.length + 2 : 2}
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
