interface ReportsDateNavigatorProps {
  currentListDateText: string;
  onShiftDate: (offsetDays: number) => void;
}

export function ReportsDateNavigator({
  currentListDateText,
  onShiftDate,
}: ReportsDateNavigatorProps) {
  return (
    <section className="reports-page__date-navigator">
      <p className="reports-page__date-text">{currentListDateText}</p>
      <div className="reports-page__date-actions">
        <button
          type="button"
          className="reports-page__button reports-page__button--secondary"
          onClick={() => onShiftDate(-1)}
          aria-label="이전일 조회"
        >
          이전일
        </button>
        <button
          type="button"
          className="reports-page__button reports-page__button--secondary"
          onClick={() => onShiftDate(0)}
          aria-label="오늘 조회"
        >
          오늘
        </button>
        <button
          type="button"
          className="reports-page__button reports-page__button--secondary"
          onClick={() => onShiftDate(1)}
          aria-label="다음일 조회"
        >
          다음일
        </button>
      </div>
    </section>
  );
}
