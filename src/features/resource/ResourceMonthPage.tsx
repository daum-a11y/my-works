import { Fragment, useEffect, useMemo, useState } from 'react';
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
import dashboardStyles from '../dashboard/DashboardPage.module.css';
import projectStyles from '../projects/ProjectsFeature.module.css';
import styles from './ResourcePage.module.css';
import { useAuth } from '../auth/AuthContext';

interface TypeRow {
  type1: string;
  totalMinutes: number;
  requiresServiceGroup: boolean;
  items: Array<{
    type2: string;
    minutes: number;
    requiresServiceGroup: boolean;
  }>;
}

interface ServiceSummaryRow {
  costGroup: string;
  group: string;
  totalMinutes: number;
  names: Array<{
    name: string;
    minutes: number;
  }>;
}

interface ServiceDetailRow {
  costGroup: string;
  group: string;
  totalMinutes: number;
  names: Array<{
    name: string;
    items: Array<{
      type1: string;
      minutes: number;
    }>;
  }>;
}

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
    <div className={styles.chartTooltip}>
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
  });
  const monthRows = useMemo(() => query.data ?? [], [query.data]);
  const [workFold, setWorkFold] = useState(false);
  const [svcFold, setSvcFold] = useState(false);
  const [activeTableTab, setActiveTableTab] = useState<'type' | 'service' | 'report'>('report');

  useEffect(() => {
    setDocumentTitle('월간 리포트');
  }, []);

  const hasTableData = monthRows.length > 0;

  const typeRows = useMemo<TypeRow[]>(() => {
    const grouped = new Map<
      string,
      Map<string, { minutes: number; requiresServiceGroup: boolean }>
    >();

    for (const row of monthRows) {
      const type1 = row.taskType1 || '미분류';
      const type2 = row.taskType2 || '미분류';
      const requiresServiceGroup = row.isServiceTask;
      const items =
        grouped.get(type1) ?? new Map<string, { minutes: number; requiresServiceGroup: boolean }>();
      const current = items.get(type2) ?? { minutes: 0, requiresServiceGroup };
      current.minutes += Math.round(row.taskUsedtime);
      current.requiresServiceGroup = current.requiresServiceGroup || requiresServiceGroup;
      items.set(type2, current);
      grouped.set(type1, items);
    }

    return Array.from(grouped.entries())
      .map(([type1, items]) => {
        const rows = Array.from(items.entries())
          .map(([type2, item]) => ({
            type2,
            minutes: item.minutes,
            requiresServiceGroup: item.requiresServiceGroup,
          }))
          .sort(
            (left, right) =>
              Number(right.requiresServiceGroup) - Number(left.requiresServiceGroup) ||
              left.type2.localeCompare(right.type2),
          );

        return {
          type1,
          totalMinutes: rows.reduce((sum, item) => sum + item.minutes, 0),
          requiresServiceGroup: rows.some((item) => item.requiresServiceGroup),
          items: rows,
        };
      })
      .sort(
        (left, right) =>
          Number(right.requiresServiceGroup) - Number(left.requiresServiceGroup) ||
          left.type1.localeCompare(right.type1),
      );
  }, [monthRows]);

  const serviceSummaryRows = useMemo<ServiceSummaryRow[]>(() => {
    const grouped = new Map<string, Map<string, Map<string, number>>>();

    for (const row of monthRows) {
      if (!row.isServiceTask) {
        continue;
      }

      const costGroupName = row.costGroupName || '미분류';
      const serviceGroupName = row.serviceGroupName || '미분류';
      const serviceName = row.serviceName || '미분류';
      const serviceGroups = grouped.get(costGroupName) ?? new Map<string, Map<string, number>>();
      const names = serviceGroups.get(serviceGroupName) ?? new Map<string, number>();
      names.set(serviceName, (names.get(serviceName) ?? 0) + Math.round(row.taskUsedtime));
      serviceGroups.set(serviceGroupName, names);
      grouped.set(costGroupName, serviceGroups);
    }

    return Array.from(grouped.entries())
      .flatMap(([costGroup, serviceGroups]) =>
        Array.from(serviceGroups.entries()).map(([group, names]) => ({
          costGroup,
          group,
          totalMinutes: Array.from(names.values()).reduce((sum, value) => sum + value, 0),
          names: Array.from(names.entries())
            .map(([name, minutes]) => ({ name, minutes }))
            .sort((left, right) => left.name.localeCompare(right.name)),
        })),
      )
      .sort(
        (left, right) =>
          left.costGroup.localeCompare(right.costGroup) || left.group.localeCompare(right.group),
      );
  }, [monthRows]);

  const serviceDetailRows = useMemo<ServiceDetailRow[]>(() => {
    const grouped = new Map<string, Map<string, Map<string, Map<string, number>>>>();

    for (const row of monthRows) {
      if (!row.isServiceTask) {
        continue;
      }

      const costGroupName = row.costGroupName || '미분류';
      const serviceGroupName = row.serviceGroupName || '미분류';
      const serviceName = row.serviceName || '미분류';
      const serviceGroups =
        grouped.get(costGroupName) ?? new Map<string, Map<string, Map<string, number>>>();
      const names = serviceGroups.get(serviceGroupName) ?? new Map<string, Map<string, number>>();
      const typeMap = names.get(serviceName) ?? new Map<string, number>();
      const type1 = row.taskType1 || '미분류';
      typeMap.set(type1, (typeMap.get(type1) ?? 0) + Math.round(row.taskUsedtime));
      names.set(serviceName, typeMap);
      serviceGroups.set(serviceGroupName, names);
      grouped.set(costGroupName, serviceGroups);
    }

    return Array.from(grouped.entries())
      .flatMap(([costGroup, serviceGroups]) =>
        Array.from(serviceGroups.entries()).map(([group, names]) => ({
          costGroup,
          group,
          totalMinutes: Array.from(names.values())
            .flatMap((items) => Array.from(items.values()))
            .reduce((sum, value) => sum + value, 0),
          names: Array.from(names.entries())
            .map(([name, items]) => ({
              name,
              items: Array.from(items.entries())
                .map(([type1, minutes]) => ({ type1, minutes }))
                .sort((left, right) => left.type1.localeCompare(right.type1)),
            }))
            .sort((left, right) => left.name.localeCompare(right.name)),
        })),
      )
      .sort(
        (left, right) =>
          left.costGroup.localeCompare(right.costGroup) || left.group.localeCompare(right.group),
      );
  }, [monthRows]);

  const memberTotals = useMemo(() => {
    const grouped = new Map<string, { id: string; accountId: string; totalMinutes: number }>();

    monthRows.forEach((row) => {
      const current = grouped.get(row.memberId) ?? {
        id: row.memberId,
        accountId: row.accountId,
        totalMinutes: 0,
      };
      current.totalMinutes += Math.round(row.taskUsedtime);
      grouped.set(row.memberId, current);
    });

    return Array.from(grouped.values()).filter((item) => item.totalMinutes > 0);
  }, [monthRows]);

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
          ? styles.memberBadgeDanger
          : diffMinutes > 0
            ? styles.memberBadgeWarning
            : styles.memberBadgeSuccess,
    };
  });
  const memberOverCount = memberStatusRows.filter((member) => member.diffMinutes > 0).length;
  const memberUnderCount = memberStatusRows.filter((member) => member.diffMinutes < 0).length;

  return (
    <section className={projectStyles.shell}>
      <header className={projectStyles.pageHeader}>
        <div className={projectStyles.pageHeaderTop}>
          <h1 className={projectStyles.title}>월간 리포트</h1>
        </div>
      </header>

      {query.isPending ? (
        <div className={styles.empty}>데이터를 불러오는 중입니다.</div>
      ) : (
        <>
          <section className={styles.monthContext}>
            <div className={dashboardStyles.sectionHead}>
              <div className={dashboardStyles.calendarHeading}>
                <div className={dashboardStyles.calendarTitleBlock}>
                  <h2 className={dashboardStyles.calendarTitle}>
                    {year}년 {month}월
                  </h2>
                </div>
                <div className={dashboardStyles.calendarNav} aria-label="월간 리포트 월 이동">
                  <Link
                    className={dashboardStyles.calendarNavButton}
                    to={`/resource/month/${beforeMonth}`}
                    aria-label="이전달 보기"
                  >
                    <span aria-hidden="true" className={dashboardStyles.calendarNavIcon}>
                      &lt;
                    </span>
                    이전달
                  </Link>
                  <Link
                    className={dashboardStyles.calendarNavButton}
                    to={`/resource/month/${afterMonth}`}
                    aria-label="다음달 보기"
                  >
                    다음달
                    <span aria-hidden="true" className={dashboardStyles.calendarNavIcon}>
                      &gt;
                    </span>
                  </Link>
                </div>
              </div>
            </div>

            <div className={styles.summaryFacts}>
              {summaryItems.map((item) => (
                <div key={item.label} className={styles.summaryFact}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>

            {distributionItems.length ? (
              <div className={styles.chartSurface}>
                <div className={styles.chartFrame} role="img" aria-label="월간 리소스 배분 현황">
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
              <details className={styles.memberAccordion}>
                <summary className={styles.memberAccordionSummary}>
                  <span>
                    <strong>총 {memberStatusRows.length}명</strong> | 초과 {memberOverCount}명 미달{' '}
                    {memberUnderCount}명
                  </span>
                  <span className={styles.memberAccordionHint}>
                    <span className={styles.srOnly}>
                      <span className={styles.memberAccordionHintClosed}>펼치기</span>
                      <span className={styles.memberAccordionHintOpen}>접기</span>
                    </span>
                    <span aria-hidden="true" className={styles.memberAccordionChevron}>
                      ▾
                    </span>
                  </span>
                </summary>
                <div className={styles.memberAccordionBody}>
                  <div className={styles.badgeRow}>
                    {memberStatusRows.map((member) => (
                      <span key={member.id} className={clsx(styles.memberBadge, member.className)}>
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
            <section className={styles.tableTabsSection}>
              <div className={styles.tableTabs} role="tablist" aria-label="월간 리포트 표 보기">
                <button
                  type="button"
                  className={activeTableTab === 'report' ? styles.tableTabActive : styles.tableTab}
                  aria-pressed={activeTableTab === 'report'}
                  onClick={() => setActiveTableTab('report')}
                >
                  월간 보고서
                </button>
                <button
                  type="button"
                  className={activeTableTab === 'service' ? styles.tableTabActive : styles.tableTab}
                  aria-pressed={activeTableTab === 'service'}
                  onClick={() => setActiveTableTab('service')}
                >
                  서비스그룹별 합계
                </button>
                <button
                  type="button"
                  className={activeTableTab === 'type' ? styles.tableTabActive : styles.tableTab}
                  aria-pressed={activeTableTab === 'type'}
                  onClick={() => setActiveTableTab('type')}
                >
                  업무타입별 합계
                </button>
              </div>

              {activeTableTab === 'type' ? (
                <section className={styles.tableTabPanel}>
                  <div className={styles.tableTabActions}>
                    <button
                      type="button"
                      className={projectStyles.headerAction}
                      onClick={() => setWorkFold((current) => !current)}
                      disabled={!typeRows.length}
                    >
                      {workFold ? '상세' : '요약'}
                    </button>
                  </div>
                  <div className={projectStyles.tableWrap}>
                    <table className={clsx(projectStyles.table, styles.table)}>
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
                        <tr className={styles.sumRow}>
                          <th colSpan={2}>합계</th>
                          <td className={clsx(styles.numberCell, styles.sumCell)}>
                            {formatIntegerValue(totalMinutes)}
                          </td>
                          <td className={clsx(styles.numberCell, styles.sumCell)}>
                            {formatDecimalValue(Number(formatMd(totalMinutes)))}
                          </td>
                          <td className={clsx(styles.numberCell, styles.sumCell)}>
                            {formatMm(totalMinutes, workingDays)}
                          </td>
                        </tr>
                      </tfoot>
                      <tbody>
                        {typeRows.map((row) => (
                          <Fragment key={row.type1}>
                            <tr
                              className={
                                !row.requiresServiceGroup ? styles.lightGrayRow : undefined
                              }
                            >
                              <th rowSpan={workFold ? 1 : row.items.length + 1}>{row.type1}</th>
                              <th className={styles.tableSummaryCell}>합계</th>
                              <td className={clsx(styles.numberCell, styles.tableSummaryCell)}>
                                {formatIntegerValue(row.totalMinutes)}
                              </td>
                              <td className={clsx(styles.numberCell, styles.tableSummaryCell)}>
                                {formatDecimalValue(Number(formatMd(row.totalMinutes)))}
                              </td>
                              <td className={clsx(styles.numberCell, styles.tableSummaryCell)}>
                                {formatMm(row.totalMinutes, workingDays)}
                              </td>
                            </tr>
                            {!workFold
                              ? row.items.map((item) => (
                                  <tr
                                    key={`${row.type1}-${item.type2}`}
                                    className={
                                      item.requiresServiceGroup ? undefined : styles.lightGrayRow
                                    }
                                  >
                                    <th>{item.type2}</th>
                                    <td className={styles.numberCell}>
                                      {formatIntegerValue(item.minutes)}
                                    </td>
                                    <td className={styles.numberCell}>
                                      {formatDecimalValue(Number(formatMd(item.minutes)))}
                                    </td>
                                    <td className={styles.numberCell}>
                                      {formatMm(item.minutes, workingDays)}
                                    </td>
                                  </tr>
                                ))
                              : null}
                          </Fragment>
                        ))}
                        {!typeRows.length ? (
                          <tr>
                            <td colSpan={5} className={projectStyles.emptyState}>
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
                <section className={styles.tableTabPanel}>
                  <div className={styles.tableTabActions}>
                    <button
                      type="button"
                      className={projectStyles.headerAction}
                      onClick={() => setSvcFold((current) => !current)}
                      disabled={!serviceDetailRows.length}
                    >
                      {svcFold ? '상세' : '요약'}
                    </button>
                  </div>
                  <div className={projectStyles.tableWrap}>
                    <table className={clsx(projectStyles.table, styles.table)}>
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
                        <tr className={styles.sumRow}>
                          <th colSpan={4}>합계</th>
                          <td className={styles.numberCell}>
                            {formatIntegerValue(projectMinutes)}
                          </td>
                          <td className={styles.numberCell}>
                            {formatDecimalValue(Number(formatMd(projectMinutes)))}
                          </td>
                          <td className={styles.numberCell}>
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
                                <th rowSpan={svcFold ? 1 : detailLength + 1}>{group.costGroup}</th>
                                <th rowSpan={svcFold ? 1 : detailLength + 1}>{group.group}</th>
                                <th colSpan={2} className={styles.tableSummaryCell}>
                                  합계
                                </th>
                                <td className={clsx(styles.numberCell, styles.tableSummaryCell)}>
                                  {formatIntegerValue(group.totalMinutes)}
                                </td>
                                <td className={clsx(styles.numberCell, styles.tableSummaryCell)}>
                                  {formatDecimalValue(Number(formatMd(group.totalMinutes)))}
                                </td>
                                <td className={clsx(styles.numberCell, styles.tableSummaryCell)}>
                                  {formatMm(group.totalMinutes, workingDays)}
                                </td>
                              </tr>
                              {!svcFold
                                ? group.names.map((name) =>
                                    name.items.map((item, index) => (
                                      <tr key={`${group.group}-${name.name}-${item.type1}`}>
                                        {index === 0 ? (
                                          <th rowSpan={name.items.length}>{name.name}</th>
                                        ) : null}
                                        <th>{item.type1}</th>
                                        <td className={styles.numberCell}>
                                          {formatIntegerValue(item.minutes)}
                                        </td>
                                        <td className={styles.numberCell}>
                                          {formatDecimalValue(Number(formatMd(item.minutes)))}
                                        </td>
                                        <td className={styles.numberCell}>
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
                <section className={styles.tableTabPanel}>
                  <div className={projectStyles.tableWrap}>
                    <table className={clsx(projectStyles.table, styles.table, styles.reportTable)}>
                      <thead>
                        <tr>
                          <th>청구그룹</th>
                          <th>타입1</th>
                          <th>타입2</th>
                          <th>M/M</th>
                        </tr>
                      </thead>
                      <tfoot>
                        <tr className={styles.sumRow}>
                          <th colSpan={3}>합계</th>
                          <td className={styles.numberCell}>
                            {formatMm(adjustedTotalMinutes, workingDays)}
                          </td>
                        </tr>
                      </tfoot>
                      <tbody>
                        {serviceSummaryRows.map((group) => (
                          <Fragment key={group.group}>
                            <tr>
                              <th rowSpan={group.names.length + 1}>{group.costGroup}</th>
                              <th rowSpan={group.names.length + 1}>{group.group}</th>
                              <th className={styles.tableSummaryCell}>합계</th>
                              <td className={clsx(styles.numberCell, styles.tableSummaryCell)}>
                                {formatMm(group.totalMinutes, workingDays)}
                              </td>
                            </tr>
                            {group.names.map((name) => (
                              <tr
                                key={`${group.group}-${name.name}`}
                                className={styles.summaryStrongRow}
                              >
                                <th>{name.name}</th>
                                <td className={styles.numberCell}>
                                  {formatMm(name.minutes, workingDays)}
                                </td>
                              </tr>
                            ))}
                          </Fragment>
                        ))}
                        {unpaidRows.map((row) => (
                          <tr key={row.type1} className={styles.summaryStrongRow}>
                            <th colSpan={2}>{row.type1}</th>
                            <td className={styles.numberCell}>
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
            <section className={styles.tableTabsSection}>
              <div className={projectStyles.tableWrap}>
                <div className={projectStyles.emptyState}>데이터가 없습니다.</div>
              </div>
            </section>
          )}
        </>
      )}
    </section>
  );
}
