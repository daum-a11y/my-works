import { Fragment, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Link, useParams } from 'react-router-dom';
import { setDocumentTitle } from '../../app/navigation';
import { opsDataClient } from '../../lib/dataClient';
import {
  countWorkingDays,
  countWorkingDaysUntil,
  formatMd,
  formatMm,
  getCurrentMonth,
  shiftMonth,
} from './resourceShared';
import '../../styles/domain/pages/dashboard-page.scss';
import '../../styles/domain/pages/projects-feature.scss';
import '../../styles/domain/pages/resource-page.scss';
import { useAuth } from '../auth/AuthContext';

interface DistributionItem {
  key: 'holiday' | 'project' | 'normal' | 'buffer';
  label: string;
  minutes: number;
  mm: string;
  fill: string;
  labelColor?: string;
}

interface DistributionTooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey?: string | number;
    value?: number | string;
  }>;
}

const integerFormatter = new Intl.NumberFormat('ko-KR');
const decimalFormatter = new Intl.NumberFormat('ko-KR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function parseMonth(value: string) {
  const [year, month] = value.split('-').map(Number);
  return { year, month };
}

function formatIntegerValue(value: number) {
  return integerFormatter.format(value);
}

function formatDecimalValue(value: number) {
  return decimalFormatter.format(value);
}

function renderDistributionLabel(props: unknown, item: DistributionItem) {
  const labelProps = (props ?? {}) as {
    x?: number | string;
    y?: number | string;
    width?: number | string;
    height?: number | string;
  };
  const x = Number(labelProps.x ?? 0);
  const y = Number(labelProps.y ?? 0);
  const width = Number(labelProps.width ?? 0);
  const height = Number(labelProps.height ?? 0);

  if (!width || !height || width < 92) {
    return null;
  }

  return (
    <text
      x={x + width / 2}
      y={y + height / 2}
      fill={item.labelColor ?? 'var(--text-inverse)'}
      fontSize="12"
      fontWeight="600"
      textAnchor="middle"
      dominantBaseline="central"
    >
      {`${item.label} ${item.mm} MM`}
    </text>
  );
}

function DistributionTooltip({
  active,
  payload,
  items,
}: DistributionTooltipProps & { items: DistributionItem[] }) {
  if (!active || !payload?.length) {
    return null;
  }

  const current = payload.find((entry) => Number(entry.value ?? 0) > 0);
  if (!current) {
    return null;
  }

  const item = items.find((entry) => entry.key === current.dataKey);
  if (!item) {
    return null;
  }

  return (
    <div className="resource-page__chart-tooltip">
      <strong>{item.label}</strong>
      <span>{item.mm} MM</span>
    </div>
  );
}

export function ResourceMonthPage() {
  const { type } = useParams();
  const selectedMonth = type && /^\d{4}-\d{2}$/.test(type) ? type : getCurrentMonth();
  const { session } = useAuth();
  const member = session?.member ?? null;
  const query = useQuery({
    queryKey: ['resource', 'month-report', member?.id, selectedMonth],
    queryFn: () => opsDataClient.getResourceMonthReport(member!, selectedMonth),
    enabled: Boolean(member),
    placeholderData: (previousData) => previousData,
  });
  const [workFold, setWorkFold] = useState(false);
  const [svcFold, setSvcFold] = useState(false);
  const [activeTableTab, setActiveTableTab] = useState<'type' | 'service' | 'report'>('report');

  useEffect(() => {
    setDocumentTitle('월간 리포트');
  }, []);

  const report = query.data;
  const typeRows = report?.typeRows ?? [];
  const serviceSummaryRows = report?.serviceSummaryRows ?? [];
  const serviceDetailRows = report?.serviceDetailRows ?? [];
  const memberTotals = report?.memberTotals ?? [];
  const hasTableData =
    typeRows.length > 0 || serviceSummaryRows.length > 0 || serviceDetailRows.length > 0;

  const totalMinutes = typeRows.reduce((sum, row) => sum + row.totalMinutes, 0);
  const unpaidLeaveMinutes =
    typeRows.find((row) => row.type1 === '휴무')?.items.find((item) => item.type2 === '무급휴가')
      ?.minutes ?? 0;
  const holidayMinutes = Math.max(
    0,
    (typeRows.find((row) => row.type1 === '휴무')?.totalMinutes ?? 0) - unpaidLeaveMinutes,
  );
  const bufferMinutes = typeRows.find((row) => row.type1 === '기타버퍼')?.totalMinutes ?? 0;
  const adjustedTotalMinutes = totalMinutes - unpaidLeaveMinutes;
  const projectMinutes = serviceSummaryRows.reduce((sum, row) => sum + row.totalMinutes, 0);
  const nonProjectMinutes = Math.max(
    0,
    adjustedTotalMinutes - holidayMinutes - bufferMinutes - projectMinutes,
  );
  const unpaidRows = typeRows
    .filter((row) => !row.requiresServiceGroup)
    .map((row) => ({
      type1: row.type1,
      totalMinutes:
        row.type1 === '휴무'
          ? Math.max(0, row.totalMinutes - unpaidLeaveMinutes)
          : row.totalMinutes,
    }))
    .filter((row) => row.totalMinutes > 0);

  const { year, month } = parseMonth(selectedMonth);
  const beforeMonth = shiftMonth(selectedMonth, -1);
  const afterMonth = shiftMonth(selectedMonth, 1);
  const isCurrentMonth = selectedMonth === getCurrentMonth();
  const workingDays = countWorkingDays(selectedMonth);
  const monthWorkingDays = countWorkingDaysUntil(selectedMonth, new Date().getDate());
  const expectedMinutes = (isCurrentMonth ? monthWorkingDays : workingDays) * 480;
  const summaryItems = [
    { label: '근무일', value: `WD ${workingDays}일` },
    { label: '총 MM', value: `${formatMm(adjustedTotalMinutes, workingDays)} MM` },
    {
      label: '휴무 제외',
      value: `${formatMm(adjustedTotalMinutes - holidayMinutes, workingDays)} MM`,
    },
    ...(unpaidLeaveMinutes > 0
      ? [{ label: '무급휴가', value: `${formatMm(unpaidLeaveMinutes, workingDays)} MM` }]
      : []),
  ];
  const distributionItems = [
    {
      key: 'project',
      label: '프로젝트',
      minutes: projectMinutes,
      mm: formatMm(projectMinutes, workingDays),
      fill: 'var(--chart-series-primary-stroke)',
    },
    {
      key: 'normal',
      label: '일반',
      minutes: nonProjectMinutes,
      mm: formatMm(nonProjectMinutes, workingDays),
      fill: 'color-mix(in oklab, var(--raw-indigo-100) 82%, var(--raw-paper-2))',
      labelColor: 'var(--text-primary)',
    },
    {
      key: 'buffer',
      label: '기타버퍼',
      minutes: bufferMinutes,
      mm: formatMm(bufferMinutes, workingDays),
      fill: 'var(--raw-slate-700)',
    },
    {
      key: 'holiday',
      label: '휴가/휴무',
      minutes: holidayMinutes,
      mm: formatMm(holidayMinutes, workingDays),
      fill: 'var(--chart-series-success-stroke)',
    },
  ].filter((item) => item.minutes > 0) as DistributionItem[];
  const distributionChartData = distributionItems.length
    ? [
        {
          name: '배분 현황',
          holiday: holidayMinutes,
          project: projectMinutes,
          normal: nonProjectMinutes,
          buffer: bufferMinutes,
        },
      ]
    : [];
  const memberStatusRows = memberTotals.map((member) => {
    const diffMinutes = member.totalMinutes - expectedMinutes;

    return {
      ...member,
      diffMinutes,
      className:
        diffMinutes < 0
          ? 'resource-page__member-badge--danger'
          : diffMinutes > 0
            ? 'resource-page__member-badge--warning'
            : 'resource-page__member-badge--success',
    };
  });
  const memberOverCount = memberStatusRows.filter((member) => member.diffMinutes > 0).length;
  const memberUnderCount = memberStatusRows.filter((member) => member.diffMinutes < 0).length;

  return (
    <section className="dashboard-page dashboard-page--page projects-feature projects-feature--shell resource-page resource-page--page">
      <header className="projects-feature__page-header">
        <div className="projects-feature__page-header-top">
          <h1 className="projects-feature__title">월간 리포트</h1>
        </div>
      </header>

      {query.isPending ? (
        <div className="dashboard-page__empty">데이터를 불러오는 중입니다.</div>
      ) : (
        <>
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
                    <span className="projects-feature__sr-only">이전달 보기</span>
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
                    <span className="projects-feature__sr-only">다음달 보기</span>
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
                <div
                  className="resource-page__chart-frame"
                  role="img"
                  aria-label="월간 리소스 배분 현황"
                >
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
                          <LabelList content={(props) => renderDistributionLabel(props, item)} />
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
                    <span className="projects-feature__sr-only">
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

          {hasTableData ? (
            <section className="resource-page__table-tabs-section">
              <div
                className="resource-page__table-tabs"
                role="tablist"
                aria-label="월간 리포트 표 보기"
              >
                <button
                  type="button"
                  className={[
                    'resource-page__table-tab',
                    activeTableTab === 'report' ? 'resource-page__table-tab--active' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  aria-pressed={activeTableTab === 'report'}
                  onClick={() => setActiveTableTab('report')}
                >
                  월간 보고서
                </button>
                <button
                  type="button"
                  className={[
                    'resource-page__table-tab',
                    activeTableTab === 'service' ? 'resource-page__table-tab--active' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  aria-pressed={activeTableTab === 'service'}
                  onClick={() => setActiveTableTab('service')}
                >
                  서비스그룹별 합계
                </button>
                <button
                  type="button"
                  className={[
                    'resource-page__table-tab',
                    activeTableTab === 'type' ? 'resource-page__table-tab--active' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  aria-pressed={activeTableTab === 'type'}
                  onClick={() => setActiveTableTab('type')}
                >
                  업무타입별 합계
                </button>
              </div>

              {activeTableTab === 'type' ? (
                <section className="resource-page__table-tab-panel">
                  <div className="resource-page__table-tab-actions">
                    <button
                      type="button"
                      className="projects-feature__header-action"
                      onClick={() => setWorkFold((current) => !current)}
                      disabled={!typeRows.length}
                    >
                      {workFold ? '상세' : '요약'}
                    </button>
                  </div>
                  <div className="dashboard-page__table-wrap">
                    <table className={clsx('dashboard-page__table', 'dashboard-page__table')}>
                      <thead>
                        <tr>
                          <th>타입1</th>
                          <th>타입2</th>
                          <th>총 시간 (분)</th>
                          <th>총 일 (d)</th>
                          <th>M/M</th>
                        </tr>
                      </thead>
                      <tfoot>
                        <tr className="resource-page__sum-row">
                          <td colSpan={2}>합계</td>
                          <td
                            className={clsx(
                              'resource-page__number-cell',
                              'resource-page__sum-cell',
                            )}
                          >
                            {formatIntegerValue(totalMinutes)}
                          </td>
                          <td
                            className={clsx(
                              'resource-page__number-cell',
                              'resource-page__sum-cell',
                            )}
                          >
                            {formatDecimalValue(Number(formatMd(totalMinutes)))}
                          </td>
                          <td
                            className={clsx(
                              'resource-page__number-cell',
                              'resource-page__sum-cell',
                            )}
                          >
                            {formatMm(totalMinutes, workingDays)}
                          </td>
                        </tr>
                      </tfoot>
                      <tbody>
                        {typeRows.map((row) => (
                          <Fragment key={row.type1}>
                            <tr
                              className={
                                !row.requiresServiceGroup
                                  ? 'resource-page__light-gray-row'
                                  : undefined
                              }
                            >
                              <td rowSpan={workFold ? 1 : row.items.length + 1}>{row.type1}</td>
                              <td className="resource-page__table-summary-cell">합계</td>
                              <td
                                className={clsx(
                                  'resource-page__number-cell',
                                  'resource-page__table-summary-cell',
                                )}
                              >
                                {formatIntegerValue(row.totalMinutes)}
                              </td>
                              <td
                                className={clsx(
                                  'resource-page__number-cell',
                                  'resource-page__table-summary-cell',
                                )}
                              >
                                {formatDecimalValue(Number(formatMd(row.totalMinutes)))}
                              </td>
                              <td
                                className={clsx(
                                  'resource-page__number-cell',
                                  'resource-page__table-summary-cell',
                                )}
                              >
                                {formatMm(row.totalMinutes, workingDays)}
                              </td>
                            </tr>
                            {!workFold
                              ? row.items.map((item) => (
                                  <tr
                                    key={`${row.type1}-${item.type2}`}
                                    className={
                                      item.requiresServiceGroup
                                        ? undefined
                                        : 'resource-page__light-gray-row'
                                    }
                                  >
                                    <td>{item.type2}</td>
                                    <td className="resource-page__number-cell">
                                      {formatIntegerValue(item.minutes)}
                                    </td>
                                    <td className="resource-page__number-cell">
                                      {formatDecimalValue(Number(formatMd(item.minutes)))}
                                    </td>
                                    <td className="resource-page__number-cell">
                                      {formatMm(item.minutes, workingDays)}
                                    </td>
                                  </tr>
                                ))
                              : null}
                          </Fragment>
                        ))}
                        {!typeRows.length ? (
                          <tr>
                            <td colSpan={5} className="projects-feature__empty-state">
                              데이터 없음
                            </td>
                          </tr>
                        ) : null}
                      </tbody>
                    </table>
                  </div>
                </section>
              ) : null}

              {activeTableTab === 'service' ? (
                <section className="resource-page__table-tab-panel">
                  <div className="resource-page__table-tab-actions">
                    <button
                      type="button"
                      className="projects-feature__header-action"
                      onClick={() => setSvcFold((current) => !current)}
                      disabled={!serviceDetailRows.length}
                    >
                      {svcFold ? '상세' : '요약'}
                    </button>
                  </div>
                  <div className="dashboard-page__table-wrap">
                    <table className={clsx('dashboard-page__table', 'dashboard-page__table')}>
                      <thead>
                        <tr>
                          <th>청구그룹</th>
                          <th>서비스그룹</th>
                          <th>서비스명</th>
                          <th>타입1</th>
                          <th>총 시간 (분)</th>
                          <th>총 일 (d)</th>
                          <th>M/M</th>
                        </tr>
                      </thead>
                      <tfoot>
                        <tr className="resource-page__sum-row">
                          <td colSpan={4}>합계</td>
                          <td className="resource-page__number-cell">
                            {formatIntegerValue(projectMinutes)}
                          </td>
                          <td className="resource-page__number-cell">
                            {formatDecimalValue(Number(formatMd(projectMinutes)))}
                          </td>
                          <td className="resource-page__number-cell">
                            {formatMm(projectMinutes, workingDays)}
                          </td>
                        </tr>
                      </tfoot>
                      <tbody>
                        {serviceDetailRows.map((group) => {
                          const detailLength = group.names.reduce(
                            (sum, name) => sum + name.items.length,
                            0,
                          );

                          return (
                            <Fragment key={group.group}>
                              <tr>
                                <td rowSpan={svcFold ? 1 : detailLength + 1}>{group.costGroup}</td>
                                <td rowSpan={svcFold ? 1 : detailLength + 1}>{group.group}</td>
                                <td colSpan={2} className="resource-page__table-summary-cell">
                                  합계
                                </td>
                                <td
                                  className={clsx(
                                    'resource-page__number-cell',
                                    'resource-page__table-summary-cell',
                                  )}
                                >
                                  {formatIntegerValue(group.totalMinutes)}
                                </td>
                                <td
                                  className={clsx(
                                    'resource-page__number-cell',
                                    'resource-page__table-summary-cell',
                                  )}
                                >
                                  {formatDecimalValue(Number(formatMd(group.totalMinutes)))}
                                </td>
                                <td
                                  className={clsx(
                                    'resource-page__number-cell',
                                    'resource-page__table-summary-cell',
                                  )}
                                >
                                  {formatMm(group.totalMinutes, workingDays)}
                                </td>
                              </tr>
                              {!svcFold
                                ? group.names.map((name) =>
                                    name.items.map((item, index) => (
                                      <tr key={`${group.group}-${name.name}-${item.type1}`}>
                                        {index === 0 ? (
                                          <td rowSpan={name.items.length}>{name.name}</td>
                                        ) : null}
                                        <td>{item.type1}</td>
                                        <td className="resource-page__number-cell">
                                          {formatIntegerValue(item.minutes)}
                                        </td>
                                        <td className="resource-page__number-cell">
                                          {formatDecimalValue(Number(formatMd(item.minutes)))}
                                        </td>
                                        <td className="resource-page__number-cell">
                                          {formatMm(item.minutes, workingDays)}
                                        </td>
                                      </tr>
                                    )),
                                  )
                                : null}
                            </Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              ) : null}

              {activeTableTab === 'report' ? (
                <section className="resource-page__table-tab-panel">
                  <div className="dashboard-page__table-wrap">
                    <table
                      className={clsx(
                        'dashboard-page__table',
                        'dashboard-page__table',
                        'resource-page__report-table',
                      )}
                    >
                      <thead>
                        <tr>
                          <th>청구그룹</th>
                          <th>타입1</th>
                          <th>타입2</th>
                          <th>M/M</th>
                        </tr>
                      </thead>
                      <tfoot>
                        <tr className="resource-page__sum-row">
                          <td colSpan={3}>합계</td>
                          <td className="resource-page__number-cell">
                            {formatMm(adjustedTotalMinutes, workingDays)}
                          </td>
                        </tr>
                      </tfoot>
                      <tbody>
                        {serviceSummaryRows.map((group) => (
                          <Fragment key={group.group}>
                            <tr>
                              <td rowSpan={group.names.length + 1}>{group.costGroup}</td>
                              <td rowSpan={group.names.length + 1}>{group.group}</td>
                              <td className="resource-page__table-summary-cell">합계</td>
                              <td>{formatMm(group.totalMinutes, workingDays)}</td>
                            </tr>
                            {group.names.map((name) => (
                              <tr key={`${group.group}-${name.name}`}>
                                <td>{name.name}</td>
                                <td className="resource-page__number-cell">
                                  {formatMm(name.minutes, workingDays)}
                                </td>
                              </tr>
                            ))}
                          </Fragment>
                        ))}
                        {unpaidRows.map((row) => (
                          <tr key={row.type1}>
                            <td colSpan={3}>{row.type1}</td>
                            <td className="resource-page__number-cell">
                              {formatMm(row.totalMinutes, workingDays)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              ) : null}
            </section>
          ) : (
            <section className="resource-page__table-tabs-section">
              <div className="dashboard-page__table-wrap">
                <div className="projects-feature__empty-state">데이터가 없습니다.</div>
              </div>
            </section>
          )}
        </>
      )}
    </section>
  );
}
