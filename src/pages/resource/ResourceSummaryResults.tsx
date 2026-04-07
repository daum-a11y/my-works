import clsx from 'clsx';
import { MonthlyReportCalendar } from '../../components/shared/MonthlyReportCalendar';
import type { ResourceSummaryRow } from './ResourceSummaryPage.types';
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
  detailOpen: boolean;
  detailMember: { accountId: string; name: string } | null;
  monthState: ResourceSummaryMonthState | null;
  onDetailOpen: (memberId: string) => void;
  onDetailClose: () => void;
}

export function ResourceSummaryResults({
  rows,
  detailOpen,
  detailMember,
  monthState,
  onDetailOpen,
  onDetailClose,
}: ResourceSummaryResultsProps) {
  return (
    <>
      <section className="resource-summary-page__content-section">
        <div className="projects-feature__table-wrap">
          <table className="projects-feature__table">
            <caption className="sr-only">월별 사용자 업무보고 현황</caption>
            <thead>
              <tr>
                <th>이름</th>
                <th>미작성 시간</th>
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
                            'resource-summary-page__minute-value',
                            `resource-summary-page__minute-value--${tone}`,
                          )}
                        >
                          {formatSignedMinutes(row.diffMinutes)}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="projects-feature__table-link"
                          onClick={() => onDetailOpen(row.id)}
                        >
                          상세
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={3} className="projects-feature__empty-state">
                    검색 결과가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {detailOpen && detailMember && monthState ? (
        <div className="resource-summary-page__modal-scrim" onClick={onDetailClose}>
          <section
            className="projects-feature__modal"
            aria-label="월간 작성 현황"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="projects-feature__modal-header">
              <div className="resource-summary-page__detail-header-text">
                <h2 className="projects-feature__detail-title">
                  {formatMemberLabel(detailMember.accountId, detailMember.name)}
                </h2>
                <p className="resource-summary-page__detail-period">{monthState.label}</p>
              </div>
              <button
                type="button"
                className="projects-feature__icon-button"
                onClick={onDetailClose}
                aria-label="상세 닫기"
              >
                닫기
              </button>
            </div>

            <div className="resource-summary-page__detail-body">
              <MonthlyReportCalendar
                weeks={monthState.weeks}
                summary={monthState.summary}
                currentMonth={monthState.currentMonth}
                futureMonth={monthState.futureMonth}
                todayDay={monthState.todayDay}
                padded={false}
                className="resource-summary-page__calendar"
              />
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
