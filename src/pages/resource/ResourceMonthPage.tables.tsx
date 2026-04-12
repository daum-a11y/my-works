import { Fragment } from 'react';
import clsx from 'clsx';
import type {
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
            <td className={clsx('resource-page__number-cell', 'resource-page__sum-cell')}>
              {formatIntegerValue(totalMinutes)}
            </td>
            <td className={clsx('resource-page__number-cell', 'resource-page__sum-cell')}>
              {formatDecimalValue(Number(formatMd(totalMinutes)))}
            </td>
            <td className={clsx('resource-page__number-cell', 'resource-page__sum-cell')}>
              {formatMm(totalMinutes, workingDays)}
            </td>
          </tr>
        </tfoot>
        <tbody>
          {typeRows.map((row) => (
            <Fragment key={row.type1}>
              <tr
                className={!row.requiresServiceGroup ? 'resource-page__light-gray-row' : undefined}
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
                        item.requiresServiceGroup ? undefined : 'resource-page__light-gray-row'
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
            <TableEmptyRow
              colSpan={5}
              className="projects-feature__empty-state"
              message="데이터 없음"
            />
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
    <div className="dashboard-page__table-wrap">
      <table className={clsx('dashboard-page__table', 'dashboard-page__table')}>
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
          <tr className="resource-page__sum-row">
            <td colSpan={4}>합계</td>
            <td className="resource-page__number-cell">{formatIntegerValue(projectMinutes)}</td>
            <td className="resource-page__number-cell">
              {formatDecimalValue(Number(formatMd(projectMinutes)))}
            </td>
            <td className="resource-page__number-cell">{formatMm(projectMinutes, workingDays)}</td>
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
                          {index === 0 ? <td rowSpan={name.items.length}>{name.name}</td> : null}
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
  );
}

interface ResourceMonthReportTableProps {
  serviceSummaryRows: ResourceMonthReportServiceSummaryRow[];
  unpaidRows: Array<{ type1: string; totalMinutes: number }>;
  adjustedTotalMinutes: number;
  workingDays: number;
}

export function ResourceMonthReportTable({
  serviceSummaryRows,
  unpaidRows,
  adjustedTotalMinutes,
  workingDays,
}: ResourceMonthReportTableProps) {
  return (
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
  );
}
