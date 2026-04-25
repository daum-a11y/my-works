import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from 'krds-react';
import { EmptyState } from '../../components/shared/EmptyState';
import { MonthlyReportCalendar } from '../../components/shared/MonthlyReportCalendar';

interface DashboardMonthState {
  currentMonth: boolean;
  future: boolean;
  today: number;
  weeks: ReturnType<
    typeof import('../resource/resourceUtils').buildCalendarWeeks
  >;
  year: number;
  month: number;
  summary: Map<number, number>;
}

interface DashboardCalendarSectionProps {
  monthState: DashboardMonthState | null;
  onShiftMonth: (offset: number) => void;
  onResetMonth: () => void;
}

export function DashboardCalendarSection({
  monthState,
  onShiftMonth,
  onResetMonth
}: DashboardCalendarSectionProps) {
  return (
    <section
      id='dashboard-calendar'
      className='page-section dashboard-calendar-section'>
      {monthState && (
        <div className='section-head dashboard-calendar-head'>
          <h2
            className='calendar-title'
            aria-live='polite'>
            {monthState.year}년 {monthState.month}월
          </h2>
          <nav
            className='calendar-nav'
            aria-label='대시보드 업무일지 월 이동'>
            <div className='calendar-nav-group'>
              <Button
                size='medium'
                type='button'
                variant='tertiary'
                aria-label='이전 월 보기'
                onClick={() => onShiftMonth(-1)}>
                <ChevronLeft
                  size={16}
                  strokeWidth={2.4}
                  aria-hidden='true'
                />
                이전 월
              </Button>
              <Button
                size='medium'
                type='button'
                variant='secondary'
                aria-label='이번 달로 이동'
                disabled={monthState.currentMonth}
                onClick={onResetMonth}>
                오늘
              </Button>
              <Button
                size='medium'
                type='button'
                variant='tertiary'
                aria-label='다음 월 보기'
                onClick={() => onShiftMonth(1)}>
                <ChevronRight
                  size={16}
                  strokeWidth={2.4}
                  aria-hidden='true'
                />
                다음 월
              </Button>
            </div>
          </nav>
        </div>
      )}
      {monthState ? (
        <MonthlyReportCalendar
          caption='업무일지 작성 현황'
          weeks={monthState.weeks}
          summary={monthState.summary}
          currentMonth={monthState.currentMonth}
          futureMonth={monthState.future}
          todayDay={monthState.today}
          padded={false}
          panel={false}
          getDateLink={date => ({
            to: '/reports',
            state: { reportDate: date }
          })}
        />
      ) : (
        <EmptyState message='사용자 정보를 확인할 수 없습니다.' />
      )}
    </section>
  );
}
