import clsx from 'clsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Link } from 'react-router-dom';
import type { ResourceMonthReportMemberTotal } from '../../types/domain';
import { DistributionLabel, DistributionTooltip } from './ResourceMonthPage.chart';
import type { DistributionItem } from './ResourceMonthPage.types';

interface SummaryItem {
  label: string;
  value: string;
}

interface MemberStatusRow extends ResourceMonthReportMemberTotal {
  diffMinutes: number;
  className: string;
}

interface ResourceMonthContextSectionProps {
  beforeMonth: string;
  afterMonth: string;
  year: number;
  month: number;
  summaryItems: SummaryItem[];
  distributionItems: DistributionItem[];
  distributionChartData: Array<Record<string, number | string>>;
  adjustedTotalMinutes: number;
  memberStatusRows: MemberStatusRow[];
  memberOverCount: number;
  memberUnderCount: number;
}

export function ResourceMonthContextSection({
  beforeMonth,
  afterMonth,
  year,
  month,
  summaryItems,
  distributionItems,
  distributionChartData,
  adjustedTotalMinutes,
  memberStatusRows,
  memberOverCount,
  memberUnderCount,
}: ResourceMonthContextSectionProps) {
  return (
    <section className="resource-page__month-context">
      <div className="dashboard-page__section-head">
        <div className="dashboard-page__calendar-heading">
          <div className="dashboard-page__calendar-nav" aria-label="월간 리포트 월 이동">
            <Link
              className="dashboard-page__calendar-nav-button"
              to={`/resource/month/${beforeMonth}`}
              aria-label="이전달 보기"
            >
              <ChevronLeft size={16} strokeWidth={2.4} aria-hidden="true" />
              <span className="sr-only">이전달 보기</span>
            </Link>
            <h2 className="dashboard-page__calendar-title">
              {year}년 {month}월
            </h2>
            <Link
              className="dashboard-page__calendar-nav-button"
              to={`/resource/month/${afterMonth}`}
              aria-label="다음달 보기"
            >
              <ChevronRight size={16} strokeWidth={2.4} aria-hidden="true" />
              <span className="sr-only">다음달 보기</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="resource-page__summary-facts">
        {summaryItems.map((item) => (
          <div key={item.label} className="resource-page__summary-fact">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>

      {distributionItems.length ? (
        <div className="resource-page__chart-surface">
          <div className="resource-page__chart-frame" role="img" aria-label="월간 리소스 배분 현황">
            <ResponsiveContainer width="100%" height={52}>
              <BarChart
                data={distributionChartData}
                layout="vertical"
                margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                barCategoryGap={0}
                barGap={0}
              >
                <XAxis type="number" hide domain={[0, adjustedTotalMinutes || 1]} />
                <YAxis type="category" dataKey="name" hide />
                <Tooltip
                  shared={false}
                  cursor={false}
                  content={<DistributionTooltip items={distributionItems} />}
                />
                {distributionItems.map((item) => (
                  <Bar
                    key={item.key}
                    dataKey={item.key}
                    stackId="resource-distribution"
                    fill={item.fill}
                    isAnimationActive={false}
                  >
                    <LabelList
                      content={(props) => <DistributionLabel props={props} item={item} />}
                    />
                  </Bar>
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : null}

      {memberStatusRows.length ? (
        <details className="resource-page__member-accordion">
          <summary className="resource-page__member-accordion-summary">
            <span>
              <strong>총 {memberStatusRows.length}명</strong> | 초과 {memberOverCount}명 미달{' '}
              {memberUnderCount}명
            </span>
            <span className="resource-page__member-accordion-hint">
              <span className="sr-only">
                <span className="resource-page__member-accordion-hint resource-page__member-accordion-hint--closed">
                  펼치기
                </span>
                <span className="resource-page__member-accordion-hint resource-page__member-accordion-hint--open">
                  접기
                </span>
              </span>
              <span aria-hidden="true" className="resource-page__member-accordion-chevron">
                ▾
              </span>
            </span>
          </summary>
          <div className="resource-page__member-accordion-body">
            <div className="resource-page__badge-row">
              {memberStatusRows.map((member) => (
                <span
                  key={member.id}
                  className={clsx('resource-page__member-badge', member.className)}
                >
                  {member.accountId}
                  {member.diffMinutes > 0
                    ? ` +${member.diffMinutes}분`
                    : member.diffMinutes === 0
                      ? ' 0분'
                      : ` ${member.diffMinutes}분`}
                </span>
              ))}
            </div>
          </div>
        </details>
      ) : null}
    </section>
  );
}
