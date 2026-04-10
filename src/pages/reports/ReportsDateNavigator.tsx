import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ReportsDateNavigatorProps {
  currentListDateText: string;
  onShiftDate: (offsetDays: number) => void;
}

function getTodayInputValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateParts(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return {
      compact: value,
      detail: '',
    };
  }

  const [year, month, day] = value.split('-');
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  const weekday = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()] ?? '';

  return {
    compact: `${year}.${month}.${day}`,
    detail: `${weekday}요일`,
  };
}

export function ReportsDateNavigator({
  currentListDateText,
  onShiftDate,
}: ReportsDateNavigatorProps) {
  const todayInputValue = getTodayInputValue();
  const isToday = currentListDateText === todayInputValue;
  const { compact, detail } = formatDateParts(currentListDateText);

  return (
    <section className="reports-page__date-navigator">
      <div className="reports-page__date-context">
        <p className="reports-page__date-text">
          <strong>{compact}</strong>
          {detail ? <span>{detail}</span> : null}
        </p>
        <div className="reports-page__date-actions" role="group" aria-label="업무보고 날짜 이동">
          <button
            type="button"
            className="reports-page__button reports-page__button--date reports-page__button--date-icon"
            onClick={() => onShiftDate(-1)}
            aria-label="이전일 조회"
          >
            <ChevronLeft size={16} strokeWidth={2.2} aria-hidden="true" />
            <span className="sr-only">이전일</span>
          </button>
          <button
            type="button"
            className="reports-page__button reports-page__button--date"
            onClick={() => onShiftDate(0)}
            aria-label="오늘 조회"
            aria-pressed={isToday}
          >
            Today
          </button>
          <button
            type="button"
            className="reports-page__button reports-page__button--date reports-page__button--date-icon"
            onClick={() => onShiftDate(1)}
            aria-label="다음일 조회"
          >
            <ChevronRight size={16} strokeWidth={2.2} aria-hidden="true" />
            <span className="sr-only">다음일</span>
          </button>
        </div>
      </div>
    </section>
  );
}
