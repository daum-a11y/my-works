import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { setDocumentTitle } from '../../router/navigation';
import { PageHeader } from '../../components/shared/PageHeader';
import { dataClient } from '../../api/client';
import {
  countWorkingDays,
  countWorkingDaysUntil,
  formatMm,
  getCurrentMonth,
  shiftMonth,
} from './resourceUtils';
import { RESOURCE_MONTH_PAGE_TITLE } from './ResourceMonthPage.constants';
import type { DistributionItem, ResourceMonthTableTab } from './ResourceMonthPage.types';
import { ResourceMonthContextSection } from './ResourceMonthContextSection';
import { ResourceMonthTableSection } from './ResourceMonthTableSection';
import { parseMonth } from './ResourceMonthPage.utils';
import { useAuth } from '../../auth/AuthContext';
import { toResourceMonthReport } from './resourceApiTransform';
import './ResourcePage.css';

export function ResourceMonthPage() {
  const { type } = useParams();
  const selectedMonth = type && /^\d{4}-\d{2}$/.test(type) ? type : getCurrentMonth();
  const { session } = useAuth();
  const member = session?.member ?? null;
  const query = useQuery({
    queryKey: ['resource', 'month-report', member?.id, selectedMonth],
    queryFn: () => dataClient.getResourceMonthReport(member!, selectedMonth),
    enabled: Boolean(member),
    placeholderData: (previousData) => previousData,
  });
  const [workFold, setWorkFold] = useState(false);
  const [svcFold, setSvcFold] = useState(false);
  const [activeTableTab, setActiveTableTab] = useState<ResourceMonthTableTab>('report');

  useEffect(() => {
    setDocumentTitle(RESOURCE_MONTH_PAGE_TITLE);
  }, []);

  const report = useMemo(() => toResourceMonthReport(query.data), [query.data]);
  const typeRows = report?.typeRows ?? [];
  const serviceSummaryRows = report?.serviceSummaryRows ?? [];
  const nonServiceSummaryRows = report?.nonServiceSummaryRows ?? [];
  const serviceDetailRows = report?.serviceDetailRows ?? [];
  const memberTotals = report?.memberTotals ?? [];
  const hasTableData =
    typeRows.length > 0 ||
    serviceSummaryRows.length > 0 ||
    nonServiceSummaryRows.length > 0 ||
    serviceDetailRows.length > 0;

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
      <PageHeader title={RESOURCE_MONTH_PAGE_TITLE} />

      {query.isPending ? null : (
        <>
          <ResourceMonthContextSection
            beforeMonth={beforeMonth}
            afterMonth={afterMonth}
            year={year}
            month={month}
            summaryItems={summaryItems}
            distributionItems={distributionItems}
            distributionChartData={distributionChartData}
            adjustedTotalMinutes={adjustedTotalMinutes}
            memberStatusRows={memberStatusRows}
            memberOverCount={memberOverCount}
            memberUnderCount={memberUnderCount}
          />

          <ResourceMonthTableSection
            hasTableData={hasTableData}
            activeTableTab={activeTableTab}
            onTableTabChange={setActiveTableTab}
            workFold={workFold}
            svcFold={svcFold}
            onWorkFoldToggle={() => setWorkFold((current) => !current)}
            onSvcFoldToggle={() => setSvcFold((current) => !current)}
            typeRows={typeRows}
            serviceSummaryRows={serviceSummaryRows}
            nonServiceSummaryRows={nonServiceSummaryRows}
            serviceDetailRows={serviceDetailRows}
            totalMinutes={totalMinutes}
            adjustedTotalMinutes={adjustedTotalMinutes}
            projectMinutes={projectMinutes}
            workingDays={workingDays}
          />
        </>
      )}
    </section>
  );
}
