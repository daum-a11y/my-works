import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Accordion, Badge } from 'krds-react';
import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { KrdsRouterButtonLink, KrdsStructuredInfoList } from '../../components/shared';
import type { ResourceMonthReportMemberTotal } from '../../types/domain';
import { DistributionLabel, DistributionTooltip } from './ResourceMonthPage.chart';
import type { DistributionItem } from './ResourceMonthPage.types';

interface SummaryItem {
  label: string;
  value: string;
}

interface MemberStatusRow extends ResourceMonthReportMemberTotal {
  diffMinutes: number;
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
    <section className="krds-page__month-context">
      <div className="krds-page__section-head">
        <div className="krds-page__calendar-heading">
          <div className="krds-page__calendar-nav" aria-label="월간 리포트 월 이동">
            <KrdsRouterButtonLink
              to={`/resource/month/${beforeMonth}`}
              variant="tertiary"
              aria-label="이전달 보기"
            >
              <ChevronLeft size={16} strokeWidth={2.4} aria-hidden="true" />
              <span className="sr-only">이전달 보기</span>
            </KrdsRouterButtonLink>
            <h2 className="krds-page__calendar-title">
              {year}년 {month}월
            </h2>
            <KrdsRouterButtonLink
              to={`/resource/month/${afterMonth}`}
              variant="tertiary"
              aria-label="다음달 보기"
            >
              <ChevronRight size={16} strokeWidth={2.4} aria-hidden="true" />
              <span className="sr-only">다음달 보기</span>
            </KrdsRouterButtonLink>
          </div>
        </div>
      </div>

      <KrdsStructuredInfoList className="krds-page__summary-facts" items={summaryItems} />

      {distributionItems.length ? (
        <div className="krds-page__chart-surface">
          <div className="krds-page__chart-frame" role="img" aria-label="월간 리소스 배분 현황">
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
        <Accordion defaultValue={[]} variant="line">
          <Accordion.Item value="member-status">
            <Accordion.Header>
              <strong>총 {memberStatusRows.length}명</strong> | 초과 {memberOverCount}명 미달{' '}
              {memberUnderCount}명
            </Accordion.Header>
            <Accordion.Panel>
              <div className="krds-page__badge-row">
                {memberStatusRows.map((member) => {
                  const color =
                    member.diffMinutes < 0
                      ? 'danger'
                      : member.diffMinutes > 0
                        ? 'warning'
                        : 'success';

                  return (
                    <Badge key={member.id} variant="light" color={color} size="small">
                      {member.accountId}
                      {member.diffMinutes > 0
                        ? ` +${member.diffMinutes}분`
                        : member.diffMinutes === 0
                          ? ' 0분'
                          : ` ${member.diffMinutes}분`}
                    </Badge>
                  );
                })}
              </div>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      ) : null}
    </section>
  );
}
