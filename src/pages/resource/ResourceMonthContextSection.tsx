import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Accordion, Badge, Button, StructuredList } from 'krds-react';
import { Link as RouterLink } from 'react-router-dom';
import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
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
    <section className="month-context">
      <div className="section-head">
        <div className="calendar-heading">
          <div className="calendar-nav" aria-label="월간 리포트 월 이동">
            <Button
              as={RouterLink}
              to={`/resource/month/${beforeMonth}`}
              role="link"
              variant="tertiary"
              aria-label="이전달 보기"
            >
              <ChevronLeft size={16} strokeWidth={2.4} aria-hidden="true" />
              <span className="sr-only">이전달 보기</span>
            </Button>
            <h2 className="calendar-title">
              {year}년 {month}월
            </h2>
            <Button
              as={RouterLink}
              to={`/resource/month/${afterMonth}`}
              role="link"
              variant="tertiary"
              aria-label="다음달 보기"
            >
              <ChevronRight size={16} strokeWidth={2.4} aria-hidden="true" />
              <span className="sr-only">다음달 보기</span>
            </Button>
          </div>
        </div>
      </div>

      <StructuredList className="summary-facts sm">
        {summaryItems.map((item, index) => (
          <li key={`${item.label}-${index}`} className="structured-item">
            <div className="in">
              <div className="card-body">
                <div className="c-text">
                  <strong className="c-tit">{item.label}</strong>
                  <span className="c-txt">{item.value}</span>
                </div>
              </div>
            </div>
          </li>
        ))}
      </StructuredList>

      {distributionItems.length ? (
        <div className="chart-surface">
          <div className="chart-frame" role="img" aria-label="월간 리소스 배분 현황">
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
              <div className="badge-row">
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
