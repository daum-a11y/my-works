import clsx from 'clsx';
import { Link } from 'react-router-dom';
import '../../styles/domain/components/MonthlyReportCalendar.scss';

const weekdayLabels = ['일', '월', '화', '수', '목', '금', '토'];

export interface CalendarCell {
  day: number;
  date: string;
  weekday: number;
}

export interface MonthlyReportCalendarLink {
  to: string;
  state?: unknown;
}

interface MonthlyReportCalendarProps {
  weeks: Array<Array<CalendarCell | null>>;
  summary: Map<number, number>;
  currentMonth: boolean;
  futureMonth: boolean;
  todayDay: number;
  caption?: string;
  padded?: boolean;
  panel?: boolean;
  getDateLink?: (date: string) => MonthlyReportCalendarLink | null;
  className?: string;
}

function formatDiffMinutes(minutes: number) {
  if (minutes > 0) {
    return `+${minutes.toLocaleString('ko-KR')}분`;
  }

  if (minutes < 0) {
    return `-${Math.abs(minutes).toLocaleString('ko-KR')}분`;
  }

  return '0';
}

export function MonthlyReportCalendar({
  weeks,
  summary,
  currentMonth,
  futureMonth,
  todayDay,
  caption,
  padded = true,
  panel = true,
  getDateLink,
  className,
}: MonthlyReportCalendarProps) {
  return (
    <div
      className={clsx(
        'monthly-report-calendar',
        panel && 'monthly-report-calendar--panel',
        padded && 'monthly-report-calendar--padded',
        className,
      )}
    >
      <table className="monthly-report-calendar__table">
        {caption ? <caption className="monthly-report-calendar__caption">{caption}</caption> : null}
        <thead>
          <tr>
            {weekdayLabels.map((label) => (
              <th key={label}>{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, weekIndex) => (
            <tr key={`week-${weekIndex}`}>
              {week.map((cell, weekdayIndex) => {
                if (!cell) {
                  return (
                    <td
                      key={`blank-${weekIndex}-${weekdayIndex}`}
                      className="monthly-report-calendar__blank"
                    />
                  );
                }

                const minutes = summary.get(cell.day) ?? 0;
                const isWeekend = cell.weekday === 0 || cell.weekday === 6;
                const showBusinessState =
                  !isWeekend &&
                  ((currentMonth && todayDay >= cell.day) || (!futureMonth && !currentMonth));
                const linkTarget = getDateLink?.(cell.date) ?? null;
                const isToday = currentMonth && todayDay === cell.day;
                const dateLabel = (
                  <span className="monthly-report-calendar__date">{cell.day}일</span>
                );

                return (
                  <td
                    key={cell.date}
                    className={clsx(
                      'monthly-report-calendar__cell',
                      isWeekend && 'monthly-report-calendar__cell--weekend',
                      isToday && 'monthly-report-calendar__cell--today',
                    )}
                  >
                    <div className="monthly-report-calendar__cell-inner">
                      {linkTarget ? (
                        <Link
                          to={linkTarget.to}
                          state={linkTarget.state}
                          className="monthly-report-calendar__link"
                        >
                          {dateLabel}
                        </Link>
                      ) : (
                        dateLabel
                      )}
                      {isToday ? (
                        <span className="monthly-report-calendar__today-mark">오늘</span>
                      ) : null}
                    </div>
                    {isWeekend ? (
                      minutes > 0 ? (
                        <span className="monthly-report-calendar__badge monthly-report-calendar__badge--weekend">
                          {minutes.toLocaleString('ko-KR')}분
                        </span>
                      ) : null
                    ) : minutes > 0 ? (
                      <span
                        className={clsx(
                          'monthly-report-calendar__badge',
                          minutes >= 480
                            ? 'monthly-report-calendar__badge--success'
                            : 'monthly-report-calendar__badge--warning',
                        )}
                      >
                        {formatDiffMinutes(minutes - 480)}
                      </span>
                    ) : showBusinessState ? (
                      <span className="monthly-report-calendar__badge monthly-report-calendar__badge--danger">
                        -480분
                      </span>
                    ) : null}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
