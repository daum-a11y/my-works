import clsx from 'clsx';
import { Button, Modal } from 'krds-react';
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
      <section className="krds-page-summary__content-section">
        <div className="krds-page__table-wrap krds-table-wrap">
          <table className="krds-page__table tbl data">
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
                        <span
                          className={clsx(
                            'krds-page-summary__minute-value',
                            `krds-page-summary__minute-value--${tone}`,
                          )}
                        >
                          {formatSignedMinutes(row.diffMinutes)}
                        </span>
                      </td>
                      <td>
                        <Button
                          type="button"
                          variant="tertiary"
                          onClick={() => onDetailOpen(row.id)}
                        >
                          상세
                        </Button>
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
        <Modal.Root
          open={detailOpen}
          onOpenChange={(open) => {
            if (!open) {
              onDetailClose();
            }
          }}
          closeOnEsc
          closeOnOverlayClick
          size="lg"
        >
          <Modal.Content aria-label="월간 작성 현황">
            <Modal.Header title={formatMemberLabel(detailMember.accountId, detailMember.name)} />
            <Modal.Body>
              <p className="krds-page-summary__detail-period">{monthState.label}</p>
              <MonthlyReportCalendar
                weeks={monthState.weeks}
                summary={monthState.summary}
                currentMonth={monthState.currentMonth}
                futureMonth={monthState.futureMonth}
                todayDay={monthState.todayDay}
                padded={false}
                className="krds-page-summary__calendar"
              />
            </Modal.Body>
            <Modal.Footer>
              <Button type="button" variant="secondary" onClick={onDetailClose}>
                닫기
              </Button>
            </Modal.Footer>
          </Modal.Content>
        </Modal.Root>
      ) : null}
    </>
  );
}
