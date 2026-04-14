import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from 'krds-react';
import { EmptyState } from '../../components/shared/EmptyState';
import { MonthlyReportCalendar } from '../../components/shared/MonthlyReportCalendar';

interface DashboardMonthState {
  currentMonth: boolean;
  future: boolean;
  today: number;
  weeks: ReturnType<typeof import('../resource/resourceUtils').buildCalendarWeeks>;
  year: number;
  month: number;
  summary: Map<number, number>;
}

interface DashboardCalendarSectionProps {
  monthState: DashboardMonthState | null;
  onShiftMonth: (offset: number) => void;
}

export function DashboardCalendarSection({
  monthState,
  onShiftMonth,
}: DashboardCalendarSectionProps) {
  return (
    <section className="krds-page__section">
      {monthState && (
        <div className="krds-page__section-head">
          <div className="krds-page__calendar-heading">
            <div className="krds-page__calendar-nav" aria-label="업무일지 월 이동">
              <Button
                size="medium"
                type="button"
                variant="tertiary"
                onClick={() => onShiftMonth(-1)}
              >
                <ChevronLeft size={16} strokeWidth={2.4} aria-hidden="true" />
                <span className="sr-only">이전달 보기</span>
              </Button>
              <h2 className="krds-page__calendar-title">
                {monthState.year}년 {monthState.month}월
              </h2>
              <Button
                size="medium"
                type="button"
                variant="tertiary"
                onClick={() => onShiftMonth(1)}
              >
                <ChevronRight size={16} strokeWidth={2.4} aria-hidden="true" />
                <span className="sr-only">다음달 보기</span>
              </Button>
            </div>
          </div>
        </div>
      )}
      {monthState ? (
        <MonthlyReportCalendar
          caption="업무일지 작성 현황"
          weeks={monthState.weeks}
          summary={monthState.summary}
          currentMonth={monthState.currentMonth}
          futureMonth={monthState.future}
          todayDay={monthState.today}
          padded={false}
          panel={false}
          getDateLink={(date) => ({ to: '/reports', state: { reportDate: date } })}
        />
      ) : (
        <EmptyState message="사용자 정보를 확인할 수 없습니다." />
      )}
    </section>
  );
}
