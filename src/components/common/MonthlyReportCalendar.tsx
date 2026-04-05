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
      className={clsx('monthlyReportCalendarScope', panel && 'wrap', padded && 'padded', className)}
    >
      <table className="table">
        {caption ? <caption className="caption">{caption}</caption> : null}
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
                  return <td key={`blank-${weekIndex}-${weekdayIndex}`} className="blank" />;
                }

                const minutes = summary.get(cell.day) ?? 0;
                const isWeekend = cell.weekday === 0 || cell.weekday === 6;
                const showBusinessState =
                  !isWeekend &&
                  ((currentMonth && todayDay >= cell.day) || (!futureMonth && !currentMonth));
                const linkTarget = getDateLink?.(cell.date) ?? null;
                const isToday = currentMonth && todayDay === cell.day;
                const dateLabel = <span className="date">{cell.day}일</span>;

                return (
                  <td
                    key={cell.date}
                    className={clsx('cell', isWeekend && 'weekendCell', isToday && 'today')}
                  >
                    <div className="cellInner">
                      {linkTarget ? (
                        <Link to={linkTarget.to} state={linkTarget.state} className="link">
                          {dateLabel}
                        </Link>
                      ) : (
                        dateLabel
                      )}
                      {isToday ? <span className="todayMark">오늘</span> : null}
                    </div>
                    {isWeekend ? (
                      minutes > 0 ? (
                        <span className="badge badgeWeekend">
                          {minutes.toLocaleString('ko-KR')}분
                        </span>
                      ) : null
                    ) : minutes > 0 ? (
                      <span
                        className={clsx('badge', minutes >= 480 ? 'badgeSuccess' : 'badgeWarning')}
                      >
                        {formatDiffMinutes(minutes - 480)}
                      </span>
                    ) : showBusinessState ? (
                      <span className="badge badgeDanger">-480분</span>
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
