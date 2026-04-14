import { Fragment } from 'react';
import clsx from 'clsx';
import type {
  ResourceMonthReportNonServiceSummaryRow,
  ResourceMonthReportServiceDetailRow,
  ResourceMonthReportServiceSummaryRow,
  ResourceMonthReportTypeRow,
} from '../../types/domain';
import { TableEmptyRow } from '../../components/shared/TableEmptyRow';
import { formatMd, formatMm } from './resourceUtils';
import { formatDecimalValue, formatIntegerValue } from './ResourceMonthPage.utils';

interface ResourceMonthTypeTableProps {
  typeRows: ResourceMonthReportTypeRow[];
  totalMinutes: number;
  workingDays: number;
  workFold: boolean;
}

export function ResourceMonthTypeTable({
  typeRows,
  totalMinutes,
  workingDays,
  workFold,
}: ResourceMonthTypeTableProps) {
  return (
    <div className="krds-page__table-wrap krds-table-wrap">
      <table className={clsx('krds-page__table', 'tbl', 'data')}>
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
          <tr className="krds-page__sum-row">
            <td colSpan={2}>합계</td>
            <td className={clsx('krds-page__number-cell', 'krds-page__sum-cell')}>
              {formatIntegerValue(totalMinutes)}
            </td>
            <td className={clsx('krds-page__number-cell', 'krds-page__sum-cell')}>
              {formatDecimalValue(Number(formatMd(totalMinutes)))}
            </td>
            <td className={clsx('krds-page__number-cell', 'krds-page__sum-cell')}>
              {formatMm(totalMinutes, workingDays)}
            </td>
          </tr>
        </tfoot>
        <tbody>
          {typeRows.map((row) => (
            <Fragment key={row.type1}>
              <tr
                className={!row.requiresServiceGroup ? 'krds-page__light-gray-row' : undefined}
              >
                <td rowSpan={workFold ? 1 : row.items.length + 1}>{row.type1}</td>
                <td className="krds-page__table-summary-cell">합계</td>
                <td
                  className={clsx(
                    'krds-page__number-cell',
                    'krds-page__table-summary-cell',
                  )}
                >
                  {formatIntegerValue(row.totalMinutes)}
                </td>
                <td
                  className={clsx(
                    'krds-page__number-cell',
                    'krds-page__table-summary-cell',
                  )}
                >
                  {formatDecimalValue(Number(formatMd(row.totalMinutes)))}
                </td>
                <td
                  className={clsx(
                    'krds-page__number-cell',
                    'krds-page__table-summary-cell',
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
                        item.requiresServiceGroup ? undefined : 'krds-page__light-gray-row'
                      }
                    >
                      <td>{item.type2}</td>
                      <td className="krds-page__number-cell">
                        {formatIntegerValue(item.minutes)}
                      </td>
                      <td className="krds-page__number-cell">
                        {formatDecimalValue(Number(formatMd(item.minutes)))}
                      </td>
                      <td className="krds-page__number-cell">
                        {formatMm(item.minutes, workingDays)}
                      </td>
                    </tr>
                  ))
                : null}
            </Fragment>
          ))}
          {!typeRows.length ? (
            <TableEmptyRow colSpan={5} message="표시할 업무타입 집계가 없습니다." />
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

interface ResourceMonthServiceTableProps {
  serviceDetailRows: ResourceMonthReportServiceDetailRow[];
  projectMinutes: number;
  workingDays: number;
  svcFold: boolean;
}

export function ResourceMonthServiceTable({
  serviceDetailRows,
  projectMinutes,
  workingDays,
  svcFold,
}: ResourceMonthServiceTableProps) {
  return (
    <div className="krds-page__table-wrap krds-table-wrap">
      <table className={clsx('krds-page__table', 'tbl', 'data')}>
        <thead>
          <tr>
            <th>청구그룹</th>
            <th>서비스 그룹</th>
            <th>서비스명</th>
            <th>타입1</th>
            <th>총 시간 (분)</th>
            <th>총 일 (d)</th>
            <th>M/M</th>
          </tr>
        </thead>
        <tfoot>
          <tr className="krds-page__sum-row">
            <td colSpan={4}>합계</td>
            <td className="krds-page__number-cell">{formatIntegerValue(projectMinutes)}</td>
            <td className="krds-page__number-cell">
              {formatDecimalValue(Number(formatMd(projectMinutes)))}
            </td>
            <td className="krds-page__number-cell">{formatMm(projectMinutes, workingDays)}</td>
          </tr>
        </tfoot>
        <tbody>
          {serviceDetailRows.map((group) => {
            const detailLength = group.names.reduce((sum, name) => sum + name.items.length, 0);

            return (
              <Fragment key={group.group}>
                <tr>
                  <td rowSpan={svcFold ? 1 : detailLength + 1}>{group.costGroup}</td>
                  <td rowSpan={svcFold ? 1 : detailLength + 1}>{group.group}</td>
                  <td colSpan={2} className="krds-page__table-summary-cell">
                    합계
                  </td>
                  <td
                    className={clsx(
                      'krds-page__number-cell',
                      'krds-page__table-summary-cell',
                    )}
                  >
                    {formatIntegerValue(group.totalMinutes)}
                  </td>
                  <td
                    className={clsx(
                      'krds-page__number-cell',
                      'krds-page__table-summary-cell',
                    )}
                  >
                    {formatDecimalValue(Number(formatMd(group.totalMinutes)))}
                  </td>
                  <td
                    className={clsx(
                      'krds-page__number-cell',
                      'krds-page__table-summary-cell',
                    )}
                  >
                    {formatMm(group.totalMinutes, workingDays)}
                  </td>
                </tr>
                {!svcFold
                  ? group.names.map((name) =>
                      name.items.map((item, index) => (
                        <tr key={`${group.group}-${name.name}-${item.type1}`}>
                          {index === 0 ? <td rowSpan={name.items.length}>{name.name}</td> : null}
                          <td>{item.type1}</td>
                          <td className="krds-page__number-cell">
                            {formatIntegerValue(item.minutes)}
                          </td>
                          <td className="krds-page__number-cell">
                            {formatDecimalValue(Number(formatMd(item.minutes)))}
                          </td>
                          <td className="krds-page__number-cell">
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
  );
}

interface ResourceMonthReportTableProps {
  serviceSummaryRows: ResourceMonthReportServiceSummaryRow[];
  nonServiceSummaryRows: ResourceMonthReportNonServiceSummaryRow[];
  adjustedTotalMinutes: number;
  workingDays: number;
}

interface ResourceMonthReportBillingGroupRow {
  costGroup: string;
  items: Array<{
    type1: string;
    totalMinutes: number;
    names: Array<{ name: string; minutes: number }>;
  }>;
}

function toResourceMonthReportBillingGroups(
  serviceSummaryRows: ResourceMonthReportServiceSummaryRow[],
  nonServiceSummaryRows: ResourceMonthReportNonServiceSummaryRow[],
) {
  const groupMap = new Map<string, ResourceMonthReportBillingGroupRow>();

  const getGroup = (costGroup: string) => {
    const current = groupMap.get(costGroup);
    if (current) {
      return current;
    }

    const next = { costGroup, items: [] };
    groupMap.set(costGroup, next);
    return next;
  };

  serviceSummaryRows.forEach((row) => {
    getGroup(row.costGroup).items.push({
      type1: row.group,
      totalMinutes: row.totalMinutes,
      names: row.names,
    });
  });

  nonServiceSummaryRows.forEach((row) => {
    getGroup(row.costGroup).items.push({
      type1: row.type1,
      totalMinutes: row.totalMinutes,
      names: row.items.map((item) => ({ name: item.type2, minutes: item.minutes })),
    });
  });

  return Array.from(groupMap.values());
}

export function ResourceMonthReportTable({
  serviceSummaryRows,
  nonServiceSummaryRows,
  adjustedTotalMinutes,
  workingDays,
}: ResourceMonthReportTableProps) {
  const billingGroupRows = toResourceMonthReportBillingGroups(
    serviceSummaryRows,
    nonServiceSummaryRows,
  );

  return (
    <div className="krds-page__table-wrap krds-table-wrap">
      <table
        className={clsx(
          'krds-page__table',
          'tbl',
          'data',
          'krds-page__report-table',
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
          <tr className="krds-page__sum-row">
            <td colSpan={3}>합계</td>
            <td className="krds-page__number-cell">
              {formatMm(adjustedTotalMinutes, workingDays)}
            </td>
          </tr>
        </tfoot>
        <tbody>
          {billingGroupRows.map((group) => {
            const groupRowSpan = group.items.reduce((sum, item) => sum + item.names.length + 1, 0);
            let isFirstGroupRow = true;

            return (
              <Fragment key={group.costGroup}>
                {group.items.map((item, itemIndex) => {
                  const showCostGroup = isFirstGroupRow;
                  isFirstGroupRow = false;

                  return (
                    <Fragment key={`${group.costGroup}-${item.type1}-${itemIndex}`}>
                      <tr>
                        {showCostGroup ? <td rowSpan={groupRowSpan}>{group.costGroup}</td> : null}
                        <td rowSpan={item.names.length + 1}>{item.type1}</td>
                        <td className="krds-page__table-summary-cell">합계</td>
                        <td>{formatMm(item.totalMinutes, workingDays)}</td>
                      </tr>
                      {item.names.map((name, nameIndex) => (
                        <tr
                          key={`${group.costGroup}-${item.type1}-${itemIndex}-${name.name}-${nameIndex}`}
                        >
                          <td>{name.name}</td>
                          <td className="krds-page__number-cell">
                            {formatMm(name.minutes, workingDays)}
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  );
                })}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
