import clsx from 'clsx';
import { SortableTableHeaderButton } from '../../components/shared';
import { MonthlyReportCalendar } from '../../components/shared/MonthlyReportCalendar';
import { TableEmptyRow } from '../../components/shared/TableEmptyRow';
import type { ResourceSummaryRow } from './ResourceSummaryPage.types';
import type { ResourceSummarySortState } from './ResourceSummaryPage.sort';
import {
  formatMemberLabel,
  formatSignedMinutes,
  getMinuteTone,
} from './ResourceSummaryPage.format';

interface ResourceSummaryMonthState {
  currentMonth: boolean;
  futureMonth: boolean;
  todayDay: number;
  label: string;
  summary: Map<number, number>;
  weeks: ReturnType<typeof import('./resourceUtils').buildCalendarWeeks>;
}

interface ResourceSummaryResultsProps {
  rows: ResourceSummaryRow[];
  sortState: ResourceSummarySortState;
  onSortChange: (next: ResourceSummarySortState) => void;
  detailOpen: boolean;
  detailMember: { accountId: string; name: string } | null;
  monthState: ResourceSummaryMonthState | null;
  onDetailOpen: (memberId: string) => void;
  onDetailClose: () => void;
}

export function ResourceSummaryResults({
  rows,
  sortState,
  onSortChange,
  detailOpen,
  detailMember,
  monthState,
  onDetailOpen,
  onDetailClose,
}: ResourceSummaryResultsProps) {
  const getAriaSort = (key: ResourceSummarySortState['key']) => {
    if (sortState.key !== key) {
      return 'none';
    }

    return sortState.direction === 'asc' ? 'ascending' : 'descending';
  };

  return (
    <>
      <section className="content-section">
        <div className="table-wrap krds-table-wrap">
          <table className="krds-table tbl data">
            <caption className="sr-only">월별 사용자 업무보고 현황</caption>
            <thead>
              <tr>
                <th scope="col" aria-sort={getAriaSort('label')}>
                  <SortableTableHeaderButton
                    label="이름"
                    sortKey="label"
                    sortState={sortState}
                    onChange={onSortChange}
                  />
                </th>
                <th scope="col" aria-sort={getAriaSort('diffMinutes')}>
                  <SortableTableHeaderButton
                    label="미작성 시간"
                    sortKey="diffMinutes"
                    sortState={sortState}
                    onChange={onSortChange}
                  />
                </th>
                <th>상세</th>
              </tr>
            </thead>
            <tbody>
              {rows.length ? (
                rows.map((row) => {
                  const tone = getMinuteTone(row.diffMinutes);
                  return (
                    <tr key={row.id}>
                      <td>{row.label}</td>
                      <td>
                        <span className={clsx('minute-value', `tone-${tone}`)}>
                          {formatSignedMinutes(row.diffMinutes)}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="table-link"
                          onClick={() => onDetailOpen(row.id)}
                        >
                          상세
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <TableEmptyRow
                  colSpan={3}
                  message="조건에 맞는 사용자가 없습니다."
                  description="검색 조건 또는 기간을 조정하십시오."
                />
              )}
            </tbody>
          </table>
        </div>
      </section>

      {detailOpen && detailMember && monthState ? (
        <div className="modal-scrim" onClick={onDetailClose}>
          <section
            className="krds-modal-panel"
            aria-label="월간 작성 현황"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div className="detail-header-text">
                <h2 className="detail-title">
                  {formatMemberLabel(detailMember.accountId, detailMember.name)}
                </h2>
                <p className="detail-period">{monthState.label}</p>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={onDetailClose}
                aria-label="상세 닫기"
              >
                닫기
              </button>
            </div>

            <div className="detail-body">
              <MonthlyReportCalendar
                weeks={monthState.weeks}
                summary={monthState.summary}
                currentMonth={monthState.currentMonth}
                futureMonth={monthState.futureMonth}
                todayDay={monthState.todayDay}
                padded={false}
                className="summary-calendar"
              />
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
